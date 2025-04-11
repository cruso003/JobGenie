// app/(auth)/_layout.tsx
import { Redirect, SplashScreen } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

export default function AuthLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, setUser } = useAuthStore();
  const { profile, fetchProfile, isLoading } = useProfileStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          // Profile will be fetched by the fetchProfile effect below
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
        await SplashScreen.hideAsync();
      }
    };

    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Show loading while initializing
  if (!isInitialized || (user && isLoading)) {
    return <LoadingIndicator />;
  }

  // If user is authenticated, redirect based on onboarding status
  if (user && profile) {
    if (profile.onboarded) {
      return <Redirect href="/(tabs)/home" />;
    } else {
      return <Redirect href="/(onboarding)" />;
    }
  }

  // If not authenticated, allow access to auth routes
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Still loading profile
  return <LoadingIndicator />;
}
