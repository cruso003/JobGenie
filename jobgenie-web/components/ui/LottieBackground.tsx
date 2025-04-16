// components/LottieBackground.tsx
'use client';
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});
import bubblesBg from '@/assets/animations/bubbles-bg.json';

export default function LottieBackground() {
  return (
    <Lottie 
      animationData={bubblesBg} 
      loop
      className="absolute inset-0 w-full h-full opacity-50 scale-125 dark:opacity-30"
    />
  );
}
