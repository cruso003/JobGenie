import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";
import {
  recommendSkillsToLearn,
  suggestJobRoles,
  generateLearningPath,
} from "@/utils/gemini";
import {
  fetchYouTubeTutorials,
  LearningResource,
} from "@/utils/learningResources";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import LottieView from "lottie-react-native";
import { cn } from "@/utils/cn";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

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

export default function SkillsScreen() {
  const router = useRouter();
  const { skillName } = useLocalSearchParams();
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const initialSkillNameRef = useRef<string | null>(
    skillName ? String(skillName) : null
  );
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
      router.push(`/skills/video/${videoId}`);
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
      <LoadingIndicator
        message={
          initialSkillNameRef.current
            ? `Preparing learning path for ${initialSkillNameRef.current}...`
            : "Loading skills..."
        }
      />
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        className="absolute inset-0"
      />
      <View className="absolute inset-0 overflow-hidden">
        <LottieView
          source={require("@/assets/animations/bubbles-bg.json")}
          autoPlay
          loop
          style={{ opacity: 0.3 }}
        />
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className={cn(
            "w-10 h-10 rounded-full items-center justify-center",
            isDark ? "bg-white/10" : "bg-black/5"
          )}
        >
          <Feather
            name="chevron-left"
            size={24}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
        </TouchableOpacity>
        <Text
          className={cn(
            "text-xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Skill Development
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1">
        {/* Skills tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {skillsList.map((skill) => (
            <TouchableOpacity
              key={skill.skill}
              onPress={() => handleSkillSelect(skill.skill)}
              className={cn(
                "px-5 py-3 rounded-full mr-3",
                activeSkill === skill.skill
                  ? "bg-primary"
                  : isDark
                  ? "bg-white/10"
                  : "bg-black/5"
              )}
            >
              <Text
                className={cn(
                  "font-medium",
                  activeSkill === skill.skill
                    ? "text-white"
                    : isDark
                    ? "text-white/90"
                    : "text-gray-800"
                )}
              >
                {skill.skill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main content */}
        <View className="px-6 pt-4 pb-16">
          {loadingSkillDetail ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text
                className={cn(
                  "mt-4 text-center",
                  isDark ? "text-white/70" : "text-gray-500"
                )}
              >
                Loading details for {activeSkill}...
              </Text>
            </View>
          ) : detailedSkill ? (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 600 }}
            >
              {/* Skill Header Card */}
              <BlurView
                intensity={30}
                tint={isDark ? "dark" : "light"}
                className="rounded-3xl overflow-hidden mb-6"
              >
                <LinearGradient
                  colors={["#6366F1", "#06B6D4"]}
                  start={[0, 0]}
                  end={[1, 0]}
                  className="rounded-3xl p-6"
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                      <Feather name="trending-up" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-2xl font-bold">
                        {detailedSkill.skill}
                      </Text>
                      <Text className="text-white/80 text-sm">
                        In-demand career skill
                      </Text>
                    </View>
                  </View>
                  <Text className="text-white/90 text-base leading-6 mb-4">
                    {detailedSkill.description}
                  </Text>
                  <TouchableOpacity
                    className="bg-white/20 px-4 py-2 rounded-lg flex-row items-center self-start"
                    onPress={async () => {
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
                    <Feather name="plus-circle" size={16} color="white" />
                    <Text className="text-white ml-2">Add to My Skills</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>

              {/* Learning Path Section */}
              <View
                className={cn(
                  "rounded-3xl p-6 mb-6",
                  isDark ? "bg-gray-800/60" : "bg-white/70"
                )}
              >
                <Text
                  className={cn(
                    "text-lg font-bold mb-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  Learning Path
                </Text>
                {detailedSkill.learningPath?.steps.map((step, index) => (
                  <View
                    key={index}
                    className="flex-row items-start mb-4 last:mb-0"
                  >
                    <View
                      className={cn(
                        "w-8 h-8 rounded-full items-center justify-center mr-3",
                        "bg-primary"
                      )}
                    >
                      <Text className="text-white font-bold">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className={cn(
                          "text-base font-medium",
                          isDark ? "text-white" : "text-gray-900"
                        )}
                      >
                        {step}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Videos Section */}
              <View
                className={cn(
                  "rounded-3xl p-6",
                  isDark ? "bg-gray-800/60" : "bg-white/70"
                )}
              >
                <Text
                  className={cn(
                    "text-lg font-bold mb-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  Video Tutorials
                </Text>
                {resourcesLoading ? (
                  <View className="items-center py-6">
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text
                      className={cn(
                        "mt-2",
                        isDark ? "text-white/70" : "text-gray-500"
                      )}
                    >
                      Finding the best videos...
                    </Text>
                  </View>
                ) : videos.length > 0 ? (
                  videos.map((video, index) => (
                    <TouchableOpacity
                      key={index}
                      className={cn(
                        "flex-row items-center p-4 rounded-xl mb-3 last:mb-0",
                        isDark ? "bg-gray-700/50" : "bg-white"
                      )}
                      onPress={() => handleVideoPress(video.url)}
                      accessible={true}
                      accessibilityLabel={`Play video: ${video.title}`}
                      accessibilityRole="button"
                    >
                      <View
                        className={cn(
                          "w-10 h-10 rounded-full items-center justify-center mr-3",
                          "bg-cyan-500/20"
                        )}
                      >
                        <Feather name="video" size={16} color="#06B6D4" />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={cn(
                            "font-medium",
                            isDark ? "text-white" : "text-gray-900"
                          )}
                          numberOfLines={2}
                        >
                          {video.title}
                        </Text>
                        <View className="flex-row mt-1">
                          <Text
                            className={cn(
                              "text-xs mr-2",
                              isDark ? "text-white/60" : "text-gray-500"
                            )}
                          >
                            YouTube
                          </Text>
                          <Text
                            className={cn(
                              "text-xs",
                              isDark ? "text-white/60" : "text-gray-500"
                            )}
                          >
                            {video.difficulty.charAt(0).toUpperCase() +
                              video.difficulty.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View className="bg-red-500 px-2 py-1 rounded">
                        <Feather name="play" size={16} color="white" />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="items-center py-6">
                    <Feather
                      name="search"
                      size={36}
                      color={isDark ? "#6B7280" : "#9CA3AF"}
                    />
                    <Text
                      className={cn(
                        "mt-2 text-center",
                        isDark ? "text-white/70" : "text-gray-500"
                      )}
                    >
                      No videos found for this skill
                    </Text>
                  </View>
                )}
              </View>
            </MotiView>
          ) : (
            <View className="items-center justify-center py-12">
              <Text
                className={cn(
                  "text-center",
                  isDark ? "text-white/70" : "text-gray-500"
                )}
              >
                No skill details available. Please select a skill from the list above.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
