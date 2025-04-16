// app/(auth)/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';
import LoadingIndicator from '@/components/ui/loading-indicator';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            ...session.user,
            email: session.user.email || '', // Ensure email is always a string
          });
          // Profile will be fetched in the next useEffect
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
            setUser({
                ...session.user,
                email: session.user.email || '', // Ensure email is always a string
              });
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
    const fetchProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // If no profile exists, we'll handle onboarding later
          if (error.message.includes('No rows found')) {
            setProfile(null);
          }
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);


  // Handle routing based on auth and onboarding status
  useEffect(() => {
    if (!isInitialized || isLoadingProfile) return;

    // Only execute redirect logic if we're on an auth page
    if (pathname.startsWith('/login') || pathname === '/') {
      if (user) {
        // Check if onboarded
        if (profile?.onboarded) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    }
  }, [isInitialized, isLoadingProfile, user, profile, router, pathname]);

  // Show loading while initializing
  if (!isInitialized || (user && isLoadingProfile)) {
    return <LoadingIndicator message="Preparing your experience..." />;
  }

  // Render auth pages for non-authenticated users
  return children;
}
