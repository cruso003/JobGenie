// app/(dashboard)/layout.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/ui/sidebar';
import Header from '@/components/ui/header';
import LoadingIndicator from '@/components/ui/loading-indicator';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, checkAuth, isLoading } = useAuthStore();
  const router = useRouter();
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Check if user is onboarded
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

        // If not onboarded, redirect to onboarding
        if (!data?.onboarded) {
          router.push('/onboarding');
        }
        
        setProfileChecked(true);
      } catch (error) {
        console.error('Error in onboarding check:', error);
      }
    };

    if (user) {
      checkOnboardingStatus();
    }
  }, [user, router]);

  if (isLoading || !profileChecked) {
    return <LoadingIndicator message="Preparing your dashboard..." />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Background with subtle animation */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-950 dark:to-indigo-950/30" />
      </div>
      
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
