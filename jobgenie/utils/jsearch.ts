// utils/jsearch.ts
import axios from 'axios';

// JSearch API configuration
const JSEARCH_API_KEY = process.env.EXPO_PUBLIC_JSEARCH_API_KEY || "";

const JSEARCH_API_HOST = "jsearch.p.rapidapi.com";
const BASE_URL = "https://jsearch.p.rapidapi.com";

// Default headers for all requests
const headers = {
  'X-RapidAPI-Key': JSEARCH_API_KEY,
  'X-RapidAPI-Host': JSEARCH_API_HOST,
};

/**
 * Search for jobs using the JSearch API
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
    const response = await axios.get(`${BASE_URL}/search`, {
      headers,
      params: {
        query,
        page: page.toString(),
        num_pages: numPages.toString(),
        ...filters
      }
    });
    

    return response.data;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
}

/**
 * Get job details by job ID
 * @param jobId The unique job identifier
 */
export async function getJobDetails(jobId: string) {
  try {
    const response = await axios.get(`${BASE_URL}/job-details`, {
      headers,
      params: {
        job_id: jobId
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
}

/**
 * Get estimated salary information for a job title
 * @param jobTitle The job title to get salary information for
 * @param location Optional location parameter
 */
export async function getEstimatedSalary(jobTitle: string, location?: string) {
  try {
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

    return response.data;
  } catch (error) {
    console.error('Error fetching estimated salary:', error);
    throw error;
  }
}

/**
 * Search for jobs with specific filters
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
 * Get company details
 * @param companyName Name of the company to search for
 */
export async function getCompanyDetails(companyName: string) {
  try {
    const response = await axios.get(`${BASE_URL}/company-search`, {
      headers,
      params: {
        query: companyName
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    throw error;
  }
}
