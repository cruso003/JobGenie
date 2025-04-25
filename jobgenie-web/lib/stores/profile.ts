// stores/profile.ts
import { create } from 'zustand';
import { useAuthStore } from './auth';
import { supabase } from '../supabase';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ProfileData {
  id: string;
  full_name: string;
  location: string;
  jobType: string;
  skills: string[];
  experience: {
    level: ExperienceLevel;
    yearsOfExperience: number;
    currentTitle?: string;
  };
  interests: string[];
  goals: string[];
  cv?: {
    fileUrl?: string;
    text?: string;
    linkedInUrl?: string;
  };
  onboarded: boolean;
  email: string;
}

interface ProfileState {
  profile: ProfileData | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const initialProfileState: ProfileData = {
  id: '',
  full_name: '',
  location: '',
  jobType: '',
  skills: [],
  experience: {
    level: 'beginner',
    yearsOfExperience: 0,
  },
  interests: [],
  goals: [],
  onboarded: false,
  email: '',
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  
  fetchProfile: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      // Convert experience to proper format if needed
      let profile = data;
      if (typeof data.experience === 'string') {
        try {
          profile.experience = JSON.parse(data.experience);
        } catch (e) {
          profile.experience = initialProfileState.experience;
        }
      }
      
      set({ profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ profile: null });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateProfile: async (data: Partial<ProfileData>) => {
    const user = useAuthStore.getState().user;
    const currentProfile = get().profile || initialProfileState;
    
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      const updatedProfile = { ...currentProfile, ...data };
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: updatedProfile.full_name,
          experience: JSON.stringify(updatedProfile.experience),
          skills: updatedProfile.skills,
          interests: updatedProfile.interests,
          goals: updatedProfile.goals,
          job_type: updatedProfile.jobType,
          location: updatedProfile.location,
          email: user.email,
          onboarded: updatedProfile.onboarded,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      set({ profile: updatedProfile });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  completeOnboarding: async () => {
    try {
      await get().updateProfile({ onboarded: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }
}));
