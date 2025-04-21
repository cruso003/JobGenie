// stores/jobs.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from './auth';

export interface SavedJob {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  job_description: string;
  job_location: string;
  salary_range?: string;
  application_link?: string;
  job_source: string;
  external_job_id: string;
  saved_at: string;
  status: 'saved' | 'applied' | 'interviewing' | 'rejected' | 'offered';
  match_percentage?: number;
  match_reasoning?: string;
}

export interface RecommendedJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_description: string;
  job_city?: string;
  job_country?: string;
  job_apply_link?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  match_percentage: number;
  match_reasoning?: string;
}

interface JobsState {
  savedJobs: SavedJob[];
  recommendedJobs: RecommendedJob[];
  recentSearches: string[];
  lastRecommendationFetch: number | null;
  isLoading: boolean;
  fetchSavedJobs: () => Promise<void>;
  saveJob: (job: Omit<SavedJob, 'id' | 'saved_at' | 'user_id'>) => Promise<void>;
  updateJobStatus: (jobId: string, status: SavedJob['status']) => Promise<void>;
  removeJob: (jobId: string) => Promise<void>;
  addSearchQuery: (query: string) => void;
  setRecommendedJobs: (jobs: RecommendedJob[]) => void;
  clearRecommendedJobs: () => void;
  isJobSaved: (jobId: string) => boolean;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      savedJobs: [],
      recommendedJobs: [],
      recentSearches: [],
      lastRecommendationFetch: null,
      isLoading: false,
      
      fetchSavedJobs: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase
            .from('saved_jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('saved_at', { ascending: false });
          
          if (error) throw error;
          
          set({ savedJobs: data || [] });
        } catch (error) {
          console.error('Error fetching saved jobs:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveJob: async (job) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        
        try {
          set({ isLoading: true });
          
          const newJob = {
            ...job,
            user_id: user.id,
            saved_at: new Date().toISOString(),
            status: 'saved' as const
          };
          
          const { data, error } = await supabase
            .from('saved_jobs')
            .insert([newJob])
            .select()
            .single();
          
          if (error) throw error;
          
          set(state => ({
            savedJobs: [data, ...state.savedJobs]
          }));
        } catch (error) {
          console.error('Error saving job:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateJobStatus: async (jobId, status) => {
        try {
          const { error } = await supabase
            .from('saved_jobs')
            .update({ status })
            .eq('id', jobId);
          
          if (error) throw error;
          
          set(state => ({
            savedJobs: state.savedJobs.map(job => 
              job.id === jobId ? { ...job, status } : job
            )
          }));
        } catch (error) {
          console.error('Error updating job status:', error);
        }
      },
      
      removeJob: async (jobId) => {
        try {
          const { error } = await supabase
            .from('saved_jobs')
            .delete()
            .eq('id', jobId);
          
          if (error) throw error;
          
          set(state => ({
            savedJobs: state.savedJobs.filter(job => job.id !== jobId)
          }));
        } catch (error) {
          console.error('Error removing job:', error);
        }
      },
      
      addSearchQuery: (query) => {
        set(state => {
          // Remove duplicate if exists
          const filteredQueries = state.recentSearches.filter(q => q !== query);
          // Add to beginning of array and limit to 10 entries
          return {
            recentSearches: [query, ...filteredQueries].slice(0, 10)
          };
        });
      },
      
      setRecommendedJobs: (jobs) => {
        set({ 
          recommendedJobs: jobs,
          lastRecommendationFetch: Date.now()
        });
      },
      
      clearRecommendedJobs: () => {
        set({ 
          recommendedJobs: [],
          lastRecommendationFetch: null
        });
      },
      
      isJobSaved: (jobId) => {
        const { savedJobs } = get();
        return savedJobs.some(job => job.external_job_id === jobId);
      }
    }),
    {
      name: 'jobs-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recommendedJobs: state.recommendedJobs,
        recentSearches: state.recentSearches,
        lastRecommendationFetch: state.lastRecommendationFetch,
      }),
    }
  )
);
