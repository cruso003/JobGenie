// app/(onboarding)/page.tsx
import React from 'react'

function onboardbing() {
  return (
    <div>onboardbing</div>
  )
}

export default onboardbing
/* 'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingProgress from './_components/onboarding-progress';
import BasicInfo from './_components/basic-info';
import SkillsSection from './_components/skills-section';
import ExperienceSection from './_components/experience-section';
import GoalsSection from './_components/goals-section';
import FinalizeSection from './_components/finalize-section';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';
import LottieBackground from '@/components/ui/LottieBackground';

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
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
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
    // Fetch user profile data if they have any
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && !error.message.includes('No rows found')) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        // If we have profile data, use it to pre-fill
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
          });
        }
      } catch (error) {
        console.error('Error in fetchProfileData:', error);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  // Update profile data without saving to database
  const updateProfileData = (data: Partial<OnboardingData>) => {
    setProfileData(prev => ({
      ...prev,
      ...data
    }));
  };
  
  // Save profile data to Supabase
  const saveProfile = async (finalStep = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Convert to DB format
      const dbData = {
        id: user.id,
        full_name: profileData.fullName,
        location: profileData.location,
        job_type: profileData.jobType,
        skills: profileData.skills,
        experience: JSON.stringify(profileData.experience),
        interests: profileData.interests,
        goals: profileData.goals,
        onboarded: finalStep, // Only mark as onboarded on the final step
        updated_at: new Date().toISOString(),
      };
      
      // Update Supabase profile
      const { error } = await supabase
        .from('profiles')
        .upsert(dbData);
      
      if (error) throw error;
      
      // If this is the final step, redirect to dashboard
      if (finalStep) {
        router.push('/dashboard');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle next step
  const handleNext = async (data?: Partial<OnboardingData>) => {
    if (data) {
      updateProfileData(data);
    }
    
    // Save progress on each step
    await saveProfile(false);
    
    // Move to next step
    setStep(prev => prev + 1);
  };
  
  // Handle step back
  const handleBack = () => {
    setStep(prev => Math.max(0, prev - 1));
  };
  
  // Handle completion
  const handleComplete = async (data?: Partial<OnboardingData>) => {
    if (data) {
      updateProfileData(data);
    }
    
    // Save and mark as onboarded
    const success = await saveProfile(true);
    
    if (success) {
      router.push('/dashboard');
    }
  };
  
  // Helper function to get the current step component
  const renderStep = () => {
    const steps = [
      <BasicInfo 
        key="basic-info"
        initialData={profileData}
        onNext={handleNext}
      />,
      <SkillsSection 
        key="skills"
        initialData={profileData.skills}
        onNext={handleNext}
        onBack={handleBack}
      />,
      <ExperienceSection 
        key="experience"
        initialData={profileData.experience}
        onNext={handleNext}
        onBack={handleBack}
      />,
      <GoalsSection 
        key="goals"
        initialData={{ interests: profileData.interests, goals: profileData.goals }}
        onNext={handleNext}
        onBack={handleBack}
      />,
      <FinalizeSection 
        key="finalize"
        profileData={profileData}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    ];
    
    return steps[step] || steps[0];
  };
  
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-indigo-950" />
        <LottieBackground />
      </div>
      
      <div className="container mx-auto px-4 py-8 flex flex-col flex-1">
        <OnboardingProgress currentStep={step} totalSteps={5} />
        <div className="flex-1 flex items-center justify-center py-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
} */
