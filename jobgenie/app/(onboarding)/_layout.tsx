// app/(onboarding)/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

export default function OnboardingLayout() {
  const { user } = useAuthStore();
  const { profile, isLoading, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (user && !profile) {
      fetchProfile();
    }
  }, [user]);

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // If still loading profile
  if (isLoading) {
    return <LoadingIndicator />;
  }

  // If profile is loaded and already onboarded, redirect to home
  if (profile?.onboarded) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Show onboarding flow
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="skills" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="optional-cv" />
      <Stack.Screen name="finalize" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
