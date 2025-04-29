"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import {
  ChevronLeft,
  TrendingUp,
  Video,
  PlusCircle,
  Play,
  Search,
} from "lucide-react";

// Store & API Utils
import { useAuthStore } from "@/lib/stores/auth";
import { supabase } from "@/lib/supabase";
import {
  recommendSkillsToLearn,
  suggestJobRoles,
  generateLearningPath,
} from "@/lib/gemini";
import { fetchYouTubeTutorials, LearningResource } from "@/lib/learningResources";
import LoadingIndicator from "@/components/ui/loading-indicator";

type SkillDetail = {
  skill: string;
  reason: string;
  resource?: string;
  description?: string;
  learningPath?: {
    steps: string[];
    resources?: LearningResource[];
  };
};

export default function SkillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skillName = searchParams.get("skillName");
  const { user } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const initialSkillNameRef = useRef<string | null>(skillName);
  
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [skillsList, setSkillsList] = useState<SkillDetail[]>([]);
  const [detailedSkill, setDetailedSkill] = useState<SkillDetail | null>(null);
  const [loadingSkillDetail, setLoadingSkillDetail] = useState(false);
  const [videos, setVideos] = useState<LearningResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Track initial skill processing
  const [initialSkillProcessed, setInitialSkillProcessed] = useState(false);

  // Handle video press
  const handleVideoPress = (videoUrl: string) => {
    const videoId = videoUrl.split("v=")[1]?.split("&")[0] || "";
    if (videoId) {
      router.push(`/dashboard/skills/video/${videoId}`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleSkillSelect = (skillName: string) => {
    setActiveSkill(skillName);
    setDetailedSkill(null);
    setLoadingSkillDetail(true);
    fetchSkillDetail(skillName);
  };

  const processInitialSkill = (availableSkills: SkillDetail[]) => {
    if (!availableSkills.length) return;

    if (initialSkillNameRef.current) {
      const exactMatch = availableSkills.find(
        (s) => s.skill.toLowerCase() === initialSkillNameRef.current?.toLowerCase()
      );
      if (exactMatch) {
        setActiveSkill(exactMatch.skill);
        fetchSkillDetail(exactMatch.skill);
        setInitialSkillProcessed(true);
        return;
      }

      const partialMatch = availableSkills.find(
        (s) =>
          s.skill
            .toLowerCase()
            .includes(initialSkillNameRef.current?.toLowerCase() || "") ||
          initialSkillNameRef.current
            ?.toLowerCase()
            .includes(s.skill.toLowerCase())
      );
      if (partialMatch) {
        setActiveSkill(partialMatch.skill);
        fetchSkillDetail(partialMatch.skill);
        setInitialSkillProcessed(true);
        return;
      }

      const customSkill: SkillDetail = {
        skill: initialSkillNameRef.current || "Custom Skill",
        reason: "This skill was specifically requested and will help you advance your career.",
        resource: "Online tutorials and documentation",
      };
      const updatedSkills = [...availableSkills, customSkill];
      setSkillsList(updatedSkills);
      setActiveSkill(customSkill.skill);
      fetchSkillDetail(customSkill.skill);
      setInitialSkillProcessed(true);
    } else {
      setActiveSkill(availableSkills[0].skill);
      fetchSkillDetail(availableSkills[0].skill);
      setInitialSkillProcessed(true);
    }
  };

  useEffect(() => {
    if (skillsList.length > 0 && !initialSkillProcessed) {
      processInitialSkill(skillsList);
    }
  }, [skillsList, initialSkillProcessed]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      await fetchRecommendedSkills(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedSkills = async (profile: any) => {
    if (!profile) return;

    try {
      const { data: existingRecommendations } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "skill");

      if (existingRecommendations && existingRecommendations.length > 0) {
        const formattedRecommendations = existingRecommendations.map((rec) => ({
          skill: rec.title,
          reason: rec.description,
          resource: rec.resource_link || "Online tutorials and documentation",
        }));
        setSkillsList(formattedRecommendations);
        return;
      }

      const profileData = {
        skills: profile.skills || [],
        experience:
          typeof profile.experience === "string"
            ? JSON.parse(profile.experience)
            : profile.experience || { level: "beginner", yearsOfExperience: 0 },
        interests: profile.interests || [],
      };

      const jobSuggestions = await suggestJobRoles(profileData);
      if (jobSuggestions && jobSuggestions.length > 0) {
        const firstJob = jobSuggestions[0];
        const skillRecommendations = await recommendSkillsToLearn(
          firstJob.title,
          profile.skills
        );

        if (skillRecommendations && skillRecommendations.length > 0) {
          const recommendationsToStore = skillRecommendations.map((skill: any) => ({
            user_id: user?.id,
            type: "skill",
            title: skill.skill,
            description: skill.reason,
            resource_link: skill.resource,
            created_at: new Date().toISOString(),
          }));

          await supabase.from("user_recommendations").insert(recommendationsToStore);
          setSkillsList(skillRecommendations);
        }
      }
    } catch (error) {
      console.error("Error fetching skill recommendations:", error);
    }
  };

  const fetchSkillDetail = async (skillName: string) => {
    try {
      setLoadingSkillDetail(true);
      setResourcesLoading(true);

      const skill = skillsList.find(
        (s) => s.skill.toLowerCase() === skillName.toLowerCase()
      );

      if (skill) {
        const profileData = {
          skills: profile?.skills || [],
          experience: profile?.experience || {
            level: "beginner",
            yearsOfExperience: 0,
          },
          interests: profile?.interests || [],
        };

        const learningPath = await generateLearningPath(
          skillName,
          "beginner",
          profileData.skills,
          30
        );

        const detailedSkill = {
          ...skill,
          description: `${skill.skill} is a valuable skill for modern professionals. ${skill.reason}`,
          learningPath: {
            steps: learningPath.objectives || [
              "Understand the basics and core concepts",
              "Build simple projects to practice the fundamentals",
              "Learn advanced techniques and best practices",
              "Work on real-world projects to solidify your knowledge",
              "Stay updated with the latest trends and advancements",
            ],
          },
        };

        setDetailedSkill(detailedSkill);

        const youtubeVideos = await fetchYouTubeTutorials(skillName, 4);
        setVideos(youtubeVideos);
      }
    } catch (error) {
      console.error("Error fetching skill detail:", error);
      const skill = skillsList.find(
        (s) => s.skill.toLowerCase() === skillName.toLowerCase()
      );
      if (skill) {
        const detailedSkill = {
          ...skill,
          description: `${skill.skill} is a valuable skill for modern professionals. ${skill.reason}`,
          learningPath: {
            steps: [
              "Understand the basics and core concepts",
              "Build simple projects to practice the fundamentals",
              "Learn advanced techniques and best practices",
              "Work on real-world projects to solidify your knowledge",
              "Stay updated with the latest trends and advancements",
            ],
          },
        };
        setDetailedSkill(detailedSkill);
        setVideos([
          {
            title: `${skill.skill} for Beginners`,
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            type: "video",
            free: true,
            difficulty: "beginner",
            source: "YouTube",
          },
        ]);
      }
    } finally {
      setLoadingSkillDetail(false);
      setResourcesLoading(false);
    }
  };

  if (loading || (initialSkillNameRef.current && !initialSkillProcessed)) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <LoadingIndicator
          message={
            initialSkillNameRef.current
              ? `Preparing learning path for ${initialSkillNameRef.current}...`
              : "Loading skills..."
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background/5 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Skill Development</h1>
        </div>
      </div>

      {/* Skills tabs */}
      <div className="mb-6">
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex space-x-2">
            {skillsList.map((skill) => (
              <Button
                key={skill.skill}
                variant={activeSkill === skill.skill ? "default" : "secondary"}
                className="px-5 py-3 rounded-full"
                onClick={() => handleSkillSelect(skill.skill)}
              >
                {skill.skill}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {loadingSkillDetail ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-muted-foreground">
              Loading details for {activeSkill}...
            </p>
          </div>
        ) : detailedSkill ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Skill Header Card */}
            <div className="mb-6 rounded-xl overflow-hidden relative">
              <div className="bg-gradient-to-l from-primary to-indigo-600 p-6">
                <div className="flex items-start md:items-center flex-col md:flex-row gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white text-2xl font-bold">{detailedSkill.skill}</h2>
                    <p className="text-white/80 text-sm">In-demand career skill</p>
                  </div>
                </div>
                <p className="text-white/90 text-base leading-6 my-4">
                  {detailedSkill.description}
                </p>
                <Button 
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={async () => {
                    const currentSkills = [...(profile.skills || [])];
                    if (!currentSkills.includes(detailedSkill.skill)) {
                      const { error } = await supabase
                        .from("profiles")
                        .update({
                          skills: [...currentSkills, detailedSkill.skill],
                        })
                        .eq("id", user?.id);

                      if (error) {
                        console.error("Error updating skills:", error);
                      } else {
                        await supabase
                          .from("user_recommendations")
                          .delete()
                          .eq("user_id", user?.id)
                          .eq("type", "skill")
                          .eq("title", detailedSkill.skill);

                        alert(`Added ${detailedSkill.skill} to your profile skills!`);
                        fetchUserProfile();

                        setSkillsList((currentSkills) =>
                          currentSkills.filter(
                            (skill) => skill.skill !== detailedSkill.skill
                          )
                        );

                        if (skillsList.length > 1) {
                          const nextSkill = skillsList.find(
                            (skill) => skill.skill !== detailedSkill.skill
                          );
                          if (nextSkill) {
                            setActiveSkill(nextSkill.skill);
                            fetchSkillDetail(nextSkill.skill);
                          }
                        }
                      }
                    } else {
                      alert(`${detailedSkill.skill} is already in your profile skills!`);
                    }
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add to My Skills
                </Button>
              </div>
            </div>

            {/* Learning Path Section */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">Learning Path</h3>
                <div className="space-y-4">
                  {detailedSkill.learningPath?.steps.map((step, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mr-3">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-medium">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Videos Section */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">Video Tutorials</h3>
                {resourcesLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                    <p className="text-muted-foreground">
                      Finding the best videos...
                    </p>
                  </div>
                ) : videos.length > 0 ? (
                  <div className="space-y-3">
                    {videos.map((video, index) => (
                      <div
                        key={index}
                        className="flex items-center p-4 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer"
                        onClick={() => handleVideoPress(video.url)}
                      >
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3">
                          <Video className="h-4 w-4 text-cyan-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{video.title}</p>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="text-xs mr-2">
                              YouTube
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {video.difficulty.charAt(0).toUpperCase() +
                                video.difficulty.slice(1)}
                            </span>
                          </div>
                        </div>
                        <Button size="icon" variant="destructive" className="ml-2">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No videos found for this skill
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">
              No skill details available. Please select a skill from the list above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
