// app/(onboarding)/index.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/stores/auth';
import WelcomeScreen from './welcome';
import BasicInfoScreen from './basic-info';
import SkillsScreen from './skills';
import ExperienceScreen from './experience';
import GoalsScreen from './goals';
import OptionalCVScreen from './optional-cv';
import FinalizeScreen from './finalize';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

type OnboardingData = {
  fullName: string;
  location: string;
  jobType: string;
  skills: string[];
  experience: {
    level: 'beginner' | 'intermediate' | 'advanced';
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
  onboarded?: boolean;
};

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState<OnboardingData>({
    fullName: '',
    location: '',
    jobType: '',
    skills: [],
    experience: {
      level: 'beginner',
      yearsOfExperience: 0,
    },
    interests: [],
    goals: [],
  });
  
  const { user } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    // Fetch the profile data when component loads
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setProfileLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        // Process the data from the database into our state format
        if (data) {
          let experienceObj = {
            level: 'beginner' as const,
            yearsOfExperience: 0
          };
          
          // Parse experience if it exists and is a string
          if (data.experience) {
            try {
              // If it's a string, parse it
              if (typeof data.experience === 'string') {
                experienceObj = JSON.parse(data.experience);
              } else if (typeof data.experience === 'object') {
                // If it's already an object, use it
                experienceObj = data.experience;
              }
            } catch (e) {
              console.error('Error parsing experience:', e);
            }
          }
          
          // Set the profile data
          setProfileData({
            fullName: data.full_name || '',
            location: data.location || '',
            jobType: data.job_type || '',
            skills: data.skills || [],
            experience: experienceObj,
            interests: data.interests || [],
            goals: data.goals || [],
            cv: data.cv || {},
            onboarded: data.onboarded || false
          });
        }
      } catch (error) {
        console.error('Error in fetchProfileData:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  // Save profile data to Supabase
  const updateProfile = async (data: Partial<OnboardingData>, final = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Update local state
      const updatedProfileData = { ...profileData, ...data };
      setProfileData(updatedProfileData);
      
      // Convert to DB format
      const dbData = {
        id: user.id,
        full_name: updatedProfileData.fullName,
        location: updatedProfileData.location,
        job_type: updatedProfileData.jobType,
        skills: updatedProfileData.skills,
        experience: JSON.stringify(updatedProfileData.experience),
        interests: updatedProfileData.interests,
        goals: updatedProfileData.goals,
        cv: updatedProfileData.cv,
        onboarded: final ? true : false,
        updated_at: new Date().toISOString(),
      };
      
      // Update Supabase profile
      const { error } = await supabase
        .from('profiles')
        .upsert(dbData);
      
      if (error) throw error;
      
      if (final) {
        // Redirect to home screen
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle next step
  const handleNext = (data?: Partial<OnboardingData>) => {
    if (data) {
      updateProfile(data);
    }
    setStep(prev => prev + 1);
  };
  
  // Handle step back
  const handleBack = () => {
    setStep(prev => Math.max(0, prev - 1));
  };
  
  // Handle completion
  const handleComplete = (data?: Partial<OnboardingData>) => {
    updateProfile({ ...data, onboarded: true }, true);
  };
  
  if (profileLoading && step > 0) {
    return <LoadingIndicator />;
  }
  
  // Render current onboarding step
  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeScreen onNext={handleNext} />;
      case 1:
        return (
          <BasicInfoScreen 
            initialData={profileData}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 2:
        return (
          <SkillsScreen 
            initialData={profileData.skills}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 3:
        return (
          <ExperienceScreen 
            initialData={profileData.experience}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 4:
        return (
          <GoalsScreen 
            initialData={{ interests: profileData.interests, goals: profileData.goals }}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 5:
        return (
          <OptionalCVScreen 
            initialData={profileData.cv}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 6:
        return (
          <FinalizeScreen 
            profileData={profileData}
            onComplete={handleComplete}
            onBack={handleBack} 
          />
        );
      default:
        return <WelcomeScreen onNext={handleNext} />;
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {loading ? <LoadingIndicator /> : renderStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
