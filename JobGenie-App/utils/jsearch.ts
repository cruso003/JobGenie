// utils/jsearch.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// JSearch API configuration
const JSEARCH_API_KEY = process.env.EXPO_PUBLIC_JSEARCH_API_KEY || "";
const JSEARCH_API_HOST = "jsearch.p.rapidapi.com";
const BASE_URL = "https://jsearch.p.rapidapi.com";

// Default headers for all requests
const headers = {
  'X-RapidAPI-Key': JSEARCH_API_KEY,
  'X-RapidAPI-Host': JSEARCH_API_HOST,
};

// Cache duration in milliseconds (4 hours)
const CACHE_DURATION = 4 * 60 * 60 * 1000;

/**
 * Search for jobs using the JSearch API with caching
 * @param query Search query string (e.g. "React Developer in New York")
 * @param page Page number for pagination
 * @param numPages Number of pages to retrieve
 * @param filters Additional filter parameters
 */
export async function searchJobs(
  query: string,
  page: number = 1,
  numPages: number = 1,
  filters: { [key: string]: any } = {}
) {
  try {
    // Generate a cache key based on the query and filters
    const cacheKey = `jsearch_jobs_${query.toLowerCase().replace(/\s+/g, '_')}_p${page}_n${numPages}_${JSON.stringify(filters)}`;
    
    // Check cache first
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // If cache is still valid (not expired)
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached job search data for:', query);
        return data;
      }
    }
    
    // If no valid cache, fetch from API
    const response = await axios.get(`${BASE_URL}/search`, {
      headers,
      params: {
        query,
        page: page.toString(),
        num_pages: numPages.toString(),
        ...filters
      }
    });
    
    // Save to cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }));

    return response.data;
  } catch (error) {
    console.error('Error searching jobs:', error);
    
    // If API call fails, try to use cached data even if expired
    try {
      const cacheKey = `jsearch_jobs_${query.toLowerCase().replace(/\s+/g, '_')}_p${page}_n${numPages}_${JSON.stringify(filters)}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        console.log('Using expired cached job data after API failure');
        return data;
      }
    } catch (cacheError) {
      console.error('Error retrieving cache:', cacheError);
    }
    
    throw error;
  }
}

/**
 * Get job details by job ID with caching
 * @param jobId The unique job identifier
 */
export async function getJobDetails(jobId: string) {
  if (!jobId || jobId === "unknown" || jobId === "undefined") {
    console.error("Invalid job ID provided to getJobDetails:", jobId);
    throw new Error("Invalid job ID");
  }

  try {
    // Check cache first
    const cacheKey = `jsearch_job_details_${jobId}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // If cache is still valid (not expired)
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached job details for:', jobId);
        return data;
      }
    }
    
    // If no valid cache, fetch from API
    const response = await axios.get(`${BASE_URL}/job-details`, {
      headers,
      params: {
        job_id: jobId
      }
    });

    // Save to cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }));

    return response.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    
    // If API call fails, try to use cached data even if expired
    try {
      const cacheKey = `jsearch_job_details_${jobId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        console.log('Using expired cached job details after API failure');
        return data;
      }
    } catch (cacheError) {
      console.error('Error retrieving cache:', cacheError);
    }
    
    throw error;
  }
}

/**
 * Search for jobs with specific filters using caching
 * @param query Base search query
 * @param filters Object containing filter options
 */
export async function searchJobsWithFilters(
  query: string,
  filters: {
    employment_types?: string[]; // "FULLTIME", "CONTRACTOR", "PARTTIME", etc.
    job_requirements?: string[]; // "under_3_years_experience", "more_than_3_years_experience", etc.
    remote_jobs_only?: boolean;
    date_posted?: string; // "all", "today", "3days", "week", "month"
    job_titles?: string[];
    categories?: string[];
    company_types?: string[];
  } = {}
) {
  const filterParams: any = {};
  
  // Convert array parameters to comma-separated strings
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      filterParams[key] = value.join(',');
    } else {
      filterParams[key] = value;
    }
  });
  
  return searchJobs(query, 1, 1, filterParams);
}

/**
 * Get estimated salary information for a job title with caching
 * @param jobTitle The job title to get salary information for
 * @param location Optional location parameter
 */
export async function getEstimatedSalary(jobTitle: string, location?: string) {
  try {
    // Generate cache key
    const cacheKey = `jsearch_salary_${jobTitle.toLowerCase().replace(/\s+/g, '_')}${location ? '_' + location.toLowerCase().replace(/\s+/g, '_') : ''}`;
    
    // Check cache first
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Salary data can be valid for longer (1 week)
      if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
        console.log('Using cached salary data for:', jobTitle);
        return data;
      }
    }
    
    const params: any = {
      job_title: jobTitle,
    };
    
    if (location) {
      params.location = location;
    }
    
    const response = await axios.get(`${BASE_URL}/estimated-salary`, {
      headers,
      params
    });

    // Save to cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }));

    return response.data;
  } catch (error) {
    console.error('Error fetching estimated salary:', error);
    
    // Try to use cached data even if expired
    try {
      const cacheKey = `jsearch_salary_${jobTitle.toLowerCase().replace(/\s+/g, '_')}${location ? '_' + location.toLowerCase().replace(/\s+/g, '_') : ''}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        console.log('Using expired cached salary data after API failure');
        return data;
      }
    } catch (cacheError) {
      console.error('Error retrieving cache:', cacheError);
    }
    
    throw error;
  }
}

/**
 * Get company details with caching
 * @param companyName Name of the company to search for
 */
export async function getCompanyDetails(companyName: string) {
  try {
    // Check cache first
    const cacheKey = `jsearch_company_${companyName.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Company data can be valid for longer (1 week)
      if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
        console.log('Using cached company data for:', companyName);
        return data;
      }
    }
    
    const response = await axios.get(`${BASE_URL}/company-search`, {
      headers,
      params: {
        query: companyName
      }
    });

    // Save to cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data: response.data,
      timestamp: Date.now()
    }));

    return response.data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    
    // Try to use cached data even if expired
    try {
      const cacheKey = `jsearch_company_${companyName.toLowerCase().replace(/\s+/g, '_')}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        console.log('Using expired cached company data after API failure');
        return data;
      }
    } catch (cacheError) {
      console.error('Error retrieving cache:', cacheError);
    }
    
    throw error;
  }
}

/**
 * Clear all cached job search data
 */
export async function clearJobSearchCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const jobCacheKeys = keys.filter(key => key.startsWith('jsearch_'));
    
    if (jobCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(jobCacheKeys);
      console.log('Job search cache cleared');
    }
  } catch (error) {
    console.error('Error clearing job search cache:', error);
  }
}

/**
 * Force refresh for a specific job search query
 */
export async function forceRefreshJobSearch(
  query: string,
  page: number = 1,
  numPages: number = 1,
  filters: { [key: string]: any } = {}
): Promise<any> {
  try {
    // Generate the cache key that would be used
    const cacheKey = `jsearch_jobs_${query.toLowerCase().replace(/\s+/g, '_')}_p${page}_n${numPages}_${JSON.stringify(filters)}`;
    
    // Remove this specific cache entry
    await AsyncStorage.removeItem(cacheKey);
    
    // Now perform the search which will generate a fresh cache
    return searchJobs(query, page, numPages, filters);
  } catch (error) {
    console.error('Error during forced refresh:', error);
    throw error;
  }
}

