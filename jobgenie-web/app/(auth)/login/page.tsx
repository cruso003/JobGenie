// app/login/page.tsx
'use client';

import Auth from '@/app/(auth)/_components/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import LoadingIndicator from '@/components/ui/loading-indicator';

export default function LoginPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  // Force redirect if user is logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingIndicator message="Checking authentication..." />;
  }

  // Only render Auth component if user is not logged in
  if (!user) {
    return <Auth />;
  }

  // This should not be visible as the redirect should happen
  return <LoadingIndicator message="Redirecting to dashboard..." />;
}
