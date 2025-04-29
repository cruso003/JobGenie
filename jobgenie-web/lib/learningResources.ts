// utils/learningResources.ts
import axios from 'axios';

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "";

// Interface for learning resources
export interface LearningResource {
  title: string;
  url: string;
  type: "video";
  free: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  source?: string;
  description?: string;
  image?: string;
  videoId?: string;
}

// Cache duration in milliseconds (7 days)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Fetch YouTube tutorials via RapidAPI with caching
 */
export async function fetchYouTubeTutorials(skillName: string, limit: number = 5): Promise<LearningResource[]> {
  // In server components or SSR, localStorage isn't available
  if (typeof window === 'undefined') {
    return fetchYouTubeTutorialsFromAPI(skillName, limit);
  }

  try {
    // Check cache first
    const cacheKey = `youtube_tutorials_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // If cache is still valid (not expired)
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached YouTube data for', skillName);
        return data;
      }
    }
    
    const tutorials = await fetchYouTubeTutorialsFromAPI(skillName, limit);
    
    // Save to cache
    localStorage.setItem(cacheKey, JSON.stringify({
      data: tutorials,
      timestamp: Date.now()
    }));
    
    return tutorials;
  } catch (error) {
    console.error('Error fetching YouTube tutorials:', error);
    
    // If API call fails, try to use cached data even if expired
    try {
      const cacheKey = `youtube_tutorials_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        console.log('Using expired cached data after API failure');
        return data;
      }
    } catch (cacheError) {
      console.error('Error retrieving cache:', cacheError);
    }
    
    // Return empty array if both API and cache fail
    return [];
  }
}

/**
 * Fetch YouTube tutorials from API without caching
 */
async function fetchYouTubeTutorialsFromAPI(skillName: string, limit: number): Promise<LearningResource[]> {
  try {
    const response = await axios.get('https://youtube-search-and-download.p.rapidapi.com/search', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'youtube-search-and-download.p.rapidapi.com'
      },
      params: {
        query: `${skillName} tutorial`,
        type: 'v',
        sort: 'r'
      }
    });

    if (response.data && response.data.contents) {
      return response.data.contents
        .slice(0, limit)
        .map((item: any) => {
          const video = item.video;
          const videoId = video.videoId;
          
          return {
            title: video.title || `${skillName} Tutorial`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            videoId: videoId,
            type: "video",
            free: true,
            difficulty: determineDifficulty(video.title),
            source: "YouTube",
            description: video.descriptionSnippet?.[0]?.text || "",
            image: video.thumbnails?.[0]?.url || ""
          };
        });
    }
    
    return [];
  } catch (error) {
    console.error('Error in API call:', error);
    return [];
  }
}

/**
 * Helper function to determine difficulty level based on title
 */
function determineDifficulty(title: string): "beginner" | "intermediate" | "advanced" {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('beginner') || lowerTitle.includes('basics') || lowerTitle.includes('introduction') || lowerTitle.includes('101')) {
    return "beginner";
  } else if (lowerTitle.includes('advanced') || lowerTitle.includes('expert') || lowerTitle.includes('master')) {
    return "advanced";
  } else {
    return "intermediate";
  }
}

/**
 * Clear all cached resources
 */
export function clearResourceCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    
    // Find all keys starting with youtube_tutorials_
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('youtube_tutorials_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all matching keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Resource cache cleared:', keysToRemove.length, 'items');
  } catch (error) {
    console.error('Error clearing resource cache:', error);
  }
}

/**
 * Get a specific cached resource without making API calls
 */
export function getCachedResource(skillName: string): LearningResource[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const cacheKey = `youtube_tutorials_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached resource:', error);
    return null;
  }
}

/**
 * Pre-cache resources for common skills
 */
export async function preCacheCommonSkills(skills: string[]): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const fetchPromises = skills.map(skill => {
        const cacheKey = `youtube_tutorials_${skill.toLowerCase().replace(/\s+/g, '_')}`;
        
        const cachedData = localStorage.getItem(cacheKey);
        if (!cachedData || (Date.now() - JSON.parse(cachedData).timestamp > CACHE_DURATION)) {
          console.log('Pre-caching', skill);
          return fetchYouTubeTutorials(skill, 5);
        }
        return Promise.resolve([]) as Promise<LearningResource[]>;
    });
    
    await Promise.all(fetchPromises);
    console.log('Pre-caching completed');
  } catch (error) {
    console.error('Error during pre-caching:', error);
  }
}

/**
 * Check if we're in a browser environment where localStorage is available
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get estimated storage usage
 */
export function getStorageUsage(): { tutorials: number, totalItems: number, estimatedSizeKB: number } {
  if (typeof window === 'undefined') {
    return { tutorials: 0, totalItems: 0, estimatedSizeKB: 0 };
  }

  try {
    let tutorialCount = 0;
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('youtube_tutorials_')) {
        tutorialCount++;
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length * 2; // Approximate - each character in JS is 2 bytes
        }
      }
    }

    return {
      tutorials: tutorialCount,
      totalItems: localStorage.length,
      estimatedSizeKB: Math.round(totalSize / 1024)
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { tutorials: 0, totalItems: 0, estimatedSizeKB: 0 };
  }
}
