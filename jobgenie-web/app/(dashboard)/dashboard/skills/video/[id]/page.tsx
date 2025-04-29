"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import YouTubePlayer from "@/components/YoutubePlayer";

export default function VideoPlayerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  console.log("Params:", params);
  
  const { id } = params;

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">No video selected</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2" aria-label="Go back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Video Player */}
      <div className="aspect-video w-full">
        <YouTubePlayer videoId={id} />
      </div>
    </div>
  );
}
