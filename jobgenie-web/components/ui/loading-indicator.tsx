"use client";

import React, { useState, useEffect } from 'react';
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});
import loadingAnimation from '@/assets/animations/loading-genie.json';
import { useTheme } from 'next-themes';

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({ message = 'Loading...' }: LoadingIndicatorProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine theme only on client side
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      <div className="relative h-40 w-40">
        <Lottie
          animationData={loadingAnimation}
          loop
          className="h-full w-full"
        />
      </div>
      <p 
        // Apply conditional classes only after mount to avoid hydration mismatch
        className={`mt-4 text-center text-base font-medium ${
          mounted ? (isDark ? 'text-gray-300' : 'text-gray-600') : 'text-gray-600'
        }`}
      >
        {message}
      </p>
    </div>
  );
}
