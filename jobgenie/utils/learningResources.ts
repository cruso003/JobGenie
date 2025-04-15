// utils/learningResources.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";

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
  try {
    // Check cache first
    const cacheKey = `youtube_tutorials_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // If cache is still valid (not expired)
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached YouTube data for', skillName);
        return data;
      }
    }
    
    // If no valid cache, fetch from API
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
      const tutorials = response.data.contents
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
      
      // Save to cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: tutorials,
        timestamp: Date.now()
      }));
      
      return tutorials;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching YouTube tutorials:', error);
    
    // If API call fails, try to use cached data even if expired
    try {
      const cacheKey = `youtube_tutorials_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
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
export async function clearResourceCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const resourceCacheKeys = keys.filter(key => key.startsWith('youtube_tutorials_'));
    
    if (resourceCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(resourceCacheKeys);
      console.log('Resource cache cleared');
    }
  } catch (error) {
    console.error('Error clearing resource cache:', error);
  }
}

/**
 * Get a specific cached resource without making API calls
 */
export async function getCachedResource(skillName: string): Promise<LearningResource[] | null> {
  try {
    const cacheKey = `youtube_tutorials_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
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
  try {
    const fetchPromises = skills.map(skill => {
        const cacheKey = `youtube_tutorials_${skill.toLowerCase().replace(/\s+/g, '_')}`;
        return AsyncStorage.getItem(cacheKey)
          .then(cachedData => {
            if (!cachedData || (Date.now() - JSON.parse(cachedData).timestamp > CACHE_DURATION)) {
              console.log('Pre-caching', skill);
              return fetchYouTubeTutorials(skill, 5);
            }
            return Promise.resolve([]) as Promise<LearningResource[]>;
          })
          .catch(error => {
            console.error(`Error pre-caching ${skill}:`, error);
            return Promise.resolve([]) as Promise<LearningResource[]>;
          });
      });
    
    await Promise.all(fetchPromises);
    console.log('Pre-caching completed');
  } catch (error) {
    console.error('Error during pre-caching:', error);
  }
}
