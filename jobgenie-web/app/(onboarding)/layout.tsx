// app/(onboarding)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';
import LoadingIndicator from '@/components/ui/loading-indicator';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isLoading && !user) {
      router.push('/login');
    }

    // Check if user is already onboarded
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking onboarding status:', error);
          return;
        }

        // If already onboarded, redirect to dashboard
        if (data?.onboarded) {
          router.push('/dashboard');
        } 
      } catch (error) {
        console.error('Error in onboarding check:', error);
      }
    };

    checkOnboardingStatus();
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingIndicator message="Preparing your onboarding..." />;
  }

  // Only render children if authenticated
  return user ? children : null;
}
