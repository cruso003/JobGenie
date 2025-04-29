"use client";

import { useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
}

export default function YouTubePlayer({ videoId, className = "" }: YouTubePlayerProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black text-white w-full h-full rounded-lg ${className}`}>
        <p>Failed to load video</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full rounded-lg overflow-hidden ${className}`}>
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?playsinline=1&autoplay=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={() => setError(true)}
      />
    </div>
  );
}
