// utils/jsearch.ts
import axios, { AxiosResponse } from 'axios';

// JSearch API configuration
const JSEARCH_API_KEY = process.env.NEXT_PUBLIC_JSEARCH_API_KEY || "";
const JSEARCH_API_HOST = "jsearch.p.rapidapi.com";
const BASE_URL = "https://jsearch.p.rapidapi.com";

// Default headers for all requests
const headers = {
  'X-RapidAPI-Key': JSEARCH_API_KEY,
  'X-RapidAPI-Host': JSEARCH_API_HOST,
};

// Define the structure of the data for better typing
interface JobData<T = ApiResponse> {
  data: T;
  timestamp: number;
}

// Basic API response structure
interface ApiResponse {
  status: string;
  request_id: string;
  parameters?: Record<string, unknown>;
  data: unknown;
}

// Job search response
interface JobSearchResponse extends ApiResponse {
  data: JobSearchResult[];
}

// Job details response
interface JobDetailsResponse extends ApiResponse {
  data: JobDetail[];
}

// Salary response
interface SalaryResponse extends ApiResponse {
  data: SalaryData[];
}

// Job result structure
interface JobSearchResult {
  job_id: string;
  employer_name: string;
  employer_logo?: string;
  job_title: string;
  job_description: string;
  job_city?: string;
  job_country?: string;
  job_apply_link: string;
  job_min_salary?: number;
  job_max_salary?: number;
  [key: string]: unknown;
}

// Job detail structure
interface JobDetail extends JobSearchResult {
  employer_website?: string;
  employer_company_type?: string;
  job_employment_type?: string;
  job_posted_at_timestamp?: number;
  job_required_skills?: string[];
  job_required_experience?: {
    no_experience_required?: boolean;
    required_experience_in_months?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Salary data structure
interface SalaryData {
  job_title: string;
  min_salary: number;
  max_salary: number;
  median_salary: number;
  location?: string;
  [key: string]: unknown;
}

// Filter parameters
interface FilterParameters {
  employment_types?: string[];
  job_requirements?: string[];
  remote_jobs_only?: boolean;
  date_posted?: string;
  job_titles?: string[];
  categories?: string[];
  company_types?: string[];
  [key: string]: unknown;
}

// For server-side caching
let memoryCache: {
  [key: string]: JobData;
} = {};

// Cache duration in milliseconds (4 hours)
const CACHE_DURATION = 4 * 60 * 60 * 1000;

/**
 * Search for jobs using the JSearch API with in-memory caching
 * @param query Search query string (e.g. "React Developer in New York")
 * @param page Page number for pagination
 * @param numPages Number of pages to retrieve
 * @param filters Additional filter parameters
 */
export async function searchJobs(
  query: string,
  page: number = 1,
  numPages: number = 1,
  filters: Record<string, unknown> = {}
): Promise<JobSearchResponse> {
  // Generate a cache key based on the query and filters
  const cacheKey = `jsearch_jobs_${query.toLowerCase().replace(/\s+/g, '_')}_p${page}_n${numPages}_${JSON.stringify(filters)}`;
  
  try {
    
    // Check cache first
    if (memoryCache[cacheKey]) {
      const { data, timestamp } = memoryCache[cacheKey];
      
      // If cache is still valid (not expired)
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached job search data for:', query);
        return data as JobSearchResponse;
      }
    }
    
    // If no valid cache, fetch from API
    const response: AxiosResponse<JobSearchResponse> = await axios.get(`${BASE_URL}/search`, {
      headers,
      params: {
        query,
        page: page.toString(),
        num_pages: numPages.toString(),
        ...filters
      }
    });
    
    // Save to cache
    memoryCache[cacheKey] = {
      data: response.data as JobSearchResponse,
      timestamp: Date.now()
    };

    return response.data;
  } catch (error) {
    console.error('Error searching jobs:', error);
    
    // If API call fails, try to use cached data even if expired
    if (memoryCache[cacheKey]) {
      const { data } = memoryCache[cacheKey];
      console.log('Using expired cached job data after API failure');
      return data as JobSearchResponse;
    }
    
    throw error;
  }
}

/**
 * Get job details by job ID with caching
 * @param jobId The unique job identifier
 */
export async function getJobDetails(jobId: string): Promise<JobDetailsResponse> {
  if (!jobId || jobId === "unknown" || jobId === "undefined") {
    console.error("Invalid job ID provided to getJobDetails:", jobId);
    throw new Error("Invalid job ID");
  }

  // Declare cacheKey outside the try block for broader scope
  const cacheKey = `jsearch_job_details_${jobId}`;
  try {
    // Check cache first
    if (memoryCache[cacheKey]) {
      const { data, timestamp } = memoryCache[cacheKey];
      
      // If cache is still valid (not expired)
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached job details for:', jobId);
        return data as JobDetailsResponse;
      }
    }
    
    // If no valid cache, fetch from API
    const response: AxiosResponse<JobDetailsResponse> = await axios.get(`${BASE_URL}/job-details`, {
      headers,
      params: {
        job_id: jobId
      }
    });

    // Save to cache
    memoryCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };

    return response.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    
    // If API call fails, try to use cached data even if expired
    if (memoryCache[cacheKey]) {
      const { data } = memoryCache[cacheKey];
      console.log('Using expired cached job details after API failure');
      return data as JobDetailsResponse;
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
  filters: FilterParameters = {}
): Promise<JobSearchResponse> {
  const filterParams: Record<string, string | boolean> = {};
  
  // Convert array parameters to comma-separated strings
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      filterParams[key] = value.join(',');
    } else {
      if (typeof value === 'string' || typeof value === 'boolean') {
        filterParams[key] = value;
      }
    }
  });
  
  return searchJobs(query, 1, 1, filterParams);
}

/**
 * Get estimated salary information for a job title with caching
 * @param jobTitle The job title to get salary information for
 * @param location Optional location parameter
 */
export async function getEstimatedSalary(jobTitle: string, location?: string): Promise<SalaryResponse> {
  // Declare cacheKey outside the try block for broader scope
  const cacheKey = `jsearch_salary_${jobTitle.toLowerCase().replace(/\s+/g, '_')}${location ? '_' + location.toLowerCase().replace(/\s+/g, '_') : ''}`;
  try {
    // Check cache first
    if (memoryCache[cacheKey]) {
      const { data, timestamp } = memoryCache[cacheKey];
      
      // Salary data can be valid for longer (1 week)
      if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
        console.log('Using cached salary data for:', jobTitle);
        return data as unknown as SalaryResponse;
      }
    }
    
    const params: Record<string, string> = {
      job_title: jobTitle,
    };
    
    if (location) {
      params.location = location;
    }
    
    const response: AxiosResponse<SalaryResponse> = await axios.get(`${BASE_URL}/estimated-salary`, {
      headers,
      params
    });

    // Save to cache
    memoryCache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };

    return response.data;
  } catch (error) {
    console.error('Error fetching estimated salary:', error);
    
    // Try to use cached data even if expired
    if (memoryCache[cacheKey]) {
      const { data } = memoryCache[cacheKey];
      console.log('Using expired cached salary data after API failure');
      return data as SalaryResponse;
    }
    
    throw error;
  }
}

/**
 * Clear all cached job search data
 */
export function clearJobSearchCache(): void {
  memoryCache = {};
  console.log('Job search cache cleared');
}

/**
 * Force refresh for a specific job search query
 */
export async function forceRefreshJobSearch(
  query: string,
  page: number = 1,
  numPages: number = 1,
  filters: Record<string, unknown> = {}
): Promise<JobSearchResponse> {
  try {
    // Generate the cache key that would be used
    const cacheKey = `jsearch_jobs_${query.toLowerCase().replace(/\s+/g, '_')}_p${page}_n${numPages}_${JSON.stringify(filters)}`;
    
    // Remove this specific cache entry
    delete memoryCache[cacheKey];
    
    // Now perform the search which will generate a fresh cache
    return searchJobs(query, page, numPages, filters);
  } catch (error) {
    console.error('Error during forced refresh:', error);
    throw error;
  }
}
