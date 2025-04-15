// app/edit-profile.tsx - Modified to remove CV step
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/stores/auth';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import BasicInfoScreen from '../(onboarding)/basic-info';
import SkillsScreen from '../(onboarding)/skills';
import ExperienceScreen from '../(onboarding)/experience';
import GoalsScreen from '../(onboarding)/goals';

// Import each form screen

type ProfileData = {
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

export default function EditProfileScreen() {
  const [step, setStep] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Navigation steps - Removed CV step
  const steps = ['Basic Info', 'Skills', 'Experience', 'Goals'];
  
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
  
  // Update profile data without saving to database
  const updateProfileData = (data: Partial<ProfileData>) => {
    setProfileData(prev => ({
      ...prev,
      ...data
    }));
  };
  
  // Save profile data to Supabase
  const saveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
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
        updated_at: new Date().toISOString(),
      };
      
      // Update Supabase profile
      const { error } = await supabase
        .from('profiles')
        .upsert(dbData);
      
      if (error) throw error;
      
      // Return to profile screen
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle next step
  const handleNext = (data?: Partial<ProfileData>) => {
    if (data) {
      updateProfileData(data);
    }
    
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      saveProfile();
    }
  };
  
  // Handle step back
  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep(prev => prev - 1);
    }
  };
  
  if (profileLoading) {
    return <LoadingIndicator />;
  }
  
  // Render current form step
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <BasicInfoScreen 
            initialData={profileData}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 1:
        return (
          <SkillsScreen 
            initialData={profileData.skills}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 2:
        return (
          <ExperienceScreen
            initialData={profileData.experience}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      case 3:
        return (
          <GoalsScreen 
            initialData={{ interests: profileData.interests, goals: profileData.goals }}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
      default:
        return (
          <BasicInfoScreen 
            initialData={profileData}
            onNext={handleNext}
            onBack={handleBack} 
          />
        );
    }
  };

  // Custom navigation header component
  const EditProfileHeader = () => (
    <SafeAreaView style={{ backgroundColor: isDark ? '#111827' : '#F9FAFB' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          Edit Profile
        </Text>
        
        <View style={styles.progressContainer}>
          {steps.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.progressDot, 
                i === step ? styles.activeDot : null,
                { backgroundColor: i === step ? '#6366F1' : isDark ? '#4B5563' : '#D1D5DB' }
              ]} 
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
  
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <LinearGradient
        colors={isDark 
          ? ['#111827', '#1E3A8A'] 
          : ['#F9FAFB', '#EFF6FF']}
        style={StyleSheet.absoluteFill}
      />
      
      <EditProfileHeader />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {saving ? (
          <View style={styles.savingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={[styles.savingText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Saving your profile...
            </Text>
          </View>
        ) : (
          renderStep()
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  savingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  savingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
  }
});
