import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";
import {
  suggestJobRoles,
  recommendSkillsToLearn,
  calculateJobMatch,
} from "@/utils/gemini";
import { searchJobs } from "@/utils/jsearch";
import LottieView from "lottie-react-native";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import ProfileSummaryCard from "@/components/home/ProfileSummaryCard";
import SkillSuggestionCard from "@/components/home/SkillSuggestionCard";
import JobCard from "@/components/home/JobCard";
import { RecommendedJob, useJobsStore } from "@/stores/jobs";
import { differenceInHours } from "date-fns";

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jobRecommendations, setJobRecommendations] = useState<any[]>([]);
  const [refreshingJobs, setRefreshingJobs] = useState(false);
  const [careerTip, setCareerTip] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<any[]>([]);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [recalculatingMatches, setRecalculatingMatches] = useState(false);

  const { user } = useAuthStore();
  const { savedJobs, fetchSavedJobs, saveJob } = useJobsStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (user) {
      loadSavedData();
    }
  }, [user]);

  const loadSavedData = async () => {
    try {
      setLoading(true);
      await fetchUserProfile();
      await fetchSavedJobs();
    } catch (error) {
      console.error("Error loading saved data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);

      const requiredFields = [
        "full_name",
        "location",
        "job_type",
        "skills",
        "experience",
        "interests",
        "goals",
      ];
      const completedFields = requiredFields.filter((field) => {
        if (Array.isArray(data[field])) {
          return data[field].length > 0;
        }
        return data[field] != null && data[field] !== "";
      });

      const completeness = Math.round(
        (completedFields.length / requiredFields.length) * 100
      );
      setProfileCompleteness(completeness);

      fetchSkillSuggestions(data);

      const tips = [
        "Customize your resume for each job application to highlight relevant skills",
        "Prepare for behavioral questions using the STAR method: Situation, Task, Action, Result",
        "Research companies before interviews to understand their culture and values",
        "Network proactively on LinkedIn by engaging with industry content",
      ];
      setCareerTip(tips[Math.floor(Math.random() * tips.length)]);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleRefreshJobs = async () => {
    if (!profile) return;

    try {
      setRefreshingJobs(true);
      await fetchJobRecommendations(profile, true);
    } catch (error) {
      console.error("Error refreshing jobs:", error);
    } finally {
      setRefreshingJobs(false);
    }
  };

  useEffect(() => {
    const { recommendedJobs, lastRecommendationFetch } =
      useJobsStore.getState();

    if (recommendedJobs.length > 0 && lastRecommendationFetch) {
      const hoursSinceLastFetch = differenceInHours(
        new Date(),
        new Date(lastRecommendationFetch)
      );

      if (hoursSinceLastFetch < 24) {
        const savedJobIds = savedJobs.map((job) => job.external_job_id);
        const filteredRecommendations = recommendedJobs.filter(
          (job) => !savedJobIds.includes(job.job_id)
        );

        setJobRecommendations(filteredRecommendations);
      }
    }
  }, [savedJobs]);

  const recalculateJobMatches = async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      setRecalculatingMatches(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) throw new Error("Profile not found");

      const profile = {
        skills: profileData.skills || [],
        experience:
          typeof profileData.experience === "string"
            ? JSON.parse(profileData.experience)
            : profileData.experience || {
                level: "beginner",
                yearsOfExperience: 0,
              },
        interests: profileData.interests || [],
      };

      const { data: jobs } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("user_id", user.id);

      if (!jobs || jobs.length === 0) {
        alert("No saved jobs to recalculate.");
        return;
      }

      const batchSize = 3;
      let updatedCount = 0;

      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (job) => {
            try {
              const match = await calculateJobMatch(
                job.job_title,
                job.job_description || "",
                profile
              );

              await supabase
                .from("saved_jobs")
                .update({
                  match_percentage: match.percentage,
                  match_reasoning: match.reasoning,
                  last_match_update: new Date().toISOString(),
                })
                .eq("id", job.id);

              updatedCount++;
            } catch (e) {
              console.error(`Failed to update job ${job.id}:`, e);
            }
          })
        );

        if (i + batchSize < jobs.length) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      await fetchSavedJobs();

      alert(
        `Updated matches for ${updatedCount} jobs based on your current profile.`
      );
    } catch (error) {
      console.error("Error recalculating job matches:", error);
      alert(
        "There was an error updating your job matches. Please try again later."
      );
    } finally {
      setRecalculatingMatches(false);
    }
  };

  const fetchJobRecommendations = async (
    profile: any,
    forceRefresh = false
  ) => {
    if (!profile) return;

    const { recommendedJobs, lastRecommendationFetch, savedJobs } =
      useJobsStore.getState();
    if (
      !forceRefresh &&
      recommendedJobs.length > 0 &&
      lastRecommendationFetch
    ) {
      const hoursSinceLastFetch = differenceInHours(
        new Date(),
        new Date(lastRecommendationFetch)
      );
      if (hoursSinceLastFetch < 24) {
        const savedJobIds = savedJobs.map((job) => job.external_job_id);
        const filteredRecommendations = recommendedJobs.filter(
          (job) => !savedJobIds.includes(job.job_id)
        );

        setJobRecommendations(filteredRecommendations);
        return;
      }
    }

    try {
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
        const searchQuery = `${firstJob.title} ${
          profile.location || ""
        }`.trim();

        try {
          const jobResults = await searchJobs(searchQuery, 1, 3);

          if (jobResults && jobResults.data && jobResults.data.length > 0) {
            const jobsWithMatches = await Promise.all(
              jobResults.data.map(async (job: any, index: number) => {
                try {
                  if (index === 0) {
                    const match = await calculateJobMatch(
                      job.job_title,
                      job.job_description || "",
                      profileData
                    );

                    return {
                      ...job,
                      match_percentage: match.percentage,
                      match_reasoning: match.reasoning,
                    };
                  } else {
                    return {
                      ...job,
                      match_percentage: 90 - index * 5,
                      match_reasoning: "Based on your skills and experience",
                    };
                  }
                } catch (e) {
                  console.error("Error calculating job match:", e);
                  return {
                    ...job,
                    match_percentage: 85 - index * 5,
                    match_reasoning: "Based on your skills and experience",
                  };
                }
              })
            );

            const savedJobIds = savedJobs.map((job) => job.external_job_id);
            const filteredJobs = jobsWithMatches.filter(
              (job) => !savedJobIds.includes(job.job_id)
            );

            useJobsStore.getState().setRecommendedJobs(jobsWithMatches);
            setJobRecommendations(filteredJobs);
          } else {
            const placeholderJobs = jobSuggestions
              .slice(0, 3)
              .map((job: any, index: number) => ({
                job_id: `suggestion-${index}`,
                job_title: job.title,
                employer_name: "Recommended Role",
                job_description: job.reason,
                job_apply_link: "#",
                job_city: profile.location || "Remote",
                job_country: "United States",
                match_percentage: 95 - index * 5,
              }));

            useJobsStore.getState().setRecommendedJobs(placeholderJobs);

            const savedJobIds = savedJobs.map((job) => job.external_job_id);
            const filteredJobs: RecommendedJob[] = placeholderJobs.filter(
              (job: RecommendedJob) => !savedJobIds.includes(job.job_id)
            );

            setJobRecommendations(filteredJobs);
          }
        } catch (error) {
          console.error("Error searching jobs:", error);
          const placeholderJobs = jobSuggestions
            .slice(0, 3)
            .map((job: any, index: number) => ({
              job_id: `suggestion-${index}`,
              job_title: job.title,
              employer_name: "Recommended Role",
              job_description: job.reason,
              job_apply_link: "#",
              job_city: profile.location || "Remote",
              job_country: "United States",
              match_percentage: 95 - index * 5,
            }));

          useJobsStore.getState().setRecommendedJobs(placeholderJobs);

          const savedJobIds = savedJobs.map((job) => job.external_job_id);
          const filteredJobs: RecommendedJob[] = placeholderJobs.filter(
            (job: RecommendedJob) => !savedJobIds.includes(job.job_id)
          );

          setJobRecommendations(filteredJobs);
        }
      }
    } catch (error) {
      console.error("Error getting job recommendations:", error);
    }
  };

  const fetchSkillSuggestions = async (profile: any) => {
    if (!profile) return;

    try {
      // First, check if we have stored recommendations in the database
      const { data: existingRecommendations } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "skill");

      if (existingRecommendations && existingRecommendations.length > 0) {
        // If we have stored recommendations, use those
        const formattedRecommendations = existingRecommendations.map((rec) => ({
          skill: rec.title,
          reason: rec.description,
          resource: rec.resource_link || "Online tutorials and documentation",
        }));

        setSkillSuggestions(formattedRecommendations.slice(0, 10));
        return;
      }

      // If no stored recommendations, generate new ones
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
          // Store these recommendations in the database for future use
          const recommendationsToStore = skillRecommendations.map(
            (skill: any) => ({
              user_id: user?.id,
              type: "skill",
              title: skill.skill,
              description: skill.reason,
              resource_link: skill.resource,
              created_at: new Date().toISOString(),
            })
          );

          await supabase.from("recommendations").insert(recommendationsToStore);

          setSkillSuggestions(skillRecommendations.slice(0, 10));
        }
      }
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
    }
  };

  const handleSaveJob = async (job: any) => {
    try {
      let salaryRange = "Not specified";

      if (job.job_min_salary && job.job_max_salary) {
        salaryRange = `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`;
      } else if (job.job_description) {
        const rangeRegex =
          /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?-\s?(?:\$|USD)?\s?(\d{1,3}(?:,\d{3})*)/i;
        const rangeMatch = job.job_description.match(rangeRegex);
        if (rangeMatch) {
          const minSalary = parseInt(rangeMatch[1].replace(/,/g, ""), 10);
          const maxSalary = parseInt(rangeMatch[2].replace(/,/g, ""), 10);
          salaryRange = `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
        } else {
          const singleRegex =
            /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?(?!\s?-\s?(?:\$|USD)?\s?\d{1,3}(?:,\d{3})*)/i;
          const singleMatch = job.job_description.match(singleRegex);
          if (singleMatch) {
            const salary = parseInt(singleMatch[1].replace(/,/g, ""), 10);
            salaryRange = `$${salary.toLocaleString()}`;
          }
        }
      }

      await saveJob({
        job_title: job.job_title,
        company_name: job.employer_name,
        job_description: job.job_description,
        job_location: job.job_city || "Remote",
        salary_range: salaryRange,
        application_link: job.job_apply_link,
        job_source: "JSearch",
        external_job_id: job.job_id || `jobgenie-${Date.now()}`,
        status: "saved",
        match_percentage: job.match_percentage,
        match_reasoning: job.match_reasoning,
      });

      setJobRecommendations((currentJobs) =>
        currentJobs.filter((rec) => rec.job_id !== job.job_id)
      );

      alert("Job saved successfully!");
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to save job. Please try again.");
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111827" : "#F9FAFB" },
      ]}
    >
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[styles.greeting, { color: isDark ? "#FFFFFF" : "#111827" }]}
        >
          Hello, {profile?.full_name?.split(" ")[0] || "there"}! 👋
        </Text>
        <TouchableOpacity
          style={[
            styles.profileButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Feather
            name="user"
            size={20}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary Card */}
        <ProfileSummaryCard
          jobCount={savedJobs.length}
          skillCount={skillSuggestions.length}
          profileCompleteness={profileCompleteness}
          isDark={isDark}
        />

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            I want to...
          </Text>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(99, 102, 241, 0.1)",
                },
              ]}
              onPress={() => router.push("/(tabs)/explore")}
            >
              <Feather name="search" size={24} color="#6366F1" />
              <Text style={styles.actionText}>Find Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(99, 102, 241, 0.1)",
                },
              ]}
              onPress={() => router.push("/(tabs)/resume")}
            >
              <Feather name="file-text" size={24} color="#6366F1" />
              <Text style={styles.actionText}>Create Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(99, 102, 241, 0.1)",
                },
              ]}
              onPress={() => router.push("/(tabs)/genie")}
            >
              <Feather name="message-circle" size={24} color="#6366F1" />
              <Text style={styles.actionText}>Practice Interview</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Career Tip */}
        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: isDark
                ? "rgba(6, 182, 212, 0.15)"
                : "rgba(6, 182, 212, 0.1)",
            },
          ]}
        >
          <View style={styles.tipIconContainer}>
            <Feather name="info" size={24} color="#06B6D4" />
          </View>
          <View style={styles.tipContent}>
            <Text
              style={[
                styles.tipTitle,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Career Tip
            </Text>
            <Text
              style={[
                styles.tipText,
                { color: isDark ? "#D1D5DB" : "#4B5563" },
              ]}
            >
              {careerTip}
            </Text>
          </View>
        </View>

        {/* Job Recommendations (Horizontal Scroll) */}
        <View style={styles.recommendationsContainer}>
          <View style={styles.sectionHeaderWithLink}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827", marginBottom: 0 },
                ]}
              >
                Recommended Jobs 🎯
              </Text>
              <TouchableOpacity
                onPress={handleRefreshJobs}
                disabled={refreshingJobs}
                style={{ marginLeft: 8, opacity: refreshingJobs ? 0.5 : 1 }}
              >
                <Feather
                  name="refresh-cw"
                  size={16}
                  color={isDark ? "#FFFFFF" : "#111827"}
                />
              </TouchableOpacity>
              {refreshingJobs && (
                <ActivityIndicator
                  size="small"
                  color="#6366F1"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {jobRecommendations.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {jobRecommendations.map((job, index) => {
                // Create a truly unique key based on multiple factors
                const uniqueKey = `recommendation-${job.job_id || ""}-${
                  job.job_title?.substring(0, 5) || ""
                }-${index}`;

                return (
                  <View key={uniqueKey} style={{ marginRight: 16 }}>
                    <JobCard job={job} isDark={isDark} />
                    <TouchableOpacity
                      style={[
                        styles.saveJobButton,
                        {
                          backgroundColor: isDark
                            ? "rgba(99, 102, 241, 0.2)"
                            : "rgba(99, 102, 241, 0.1)",
                        },
                      ]}
                      onPress={() => handleSaveJob(job)}
                    >
                      <Feather name="bookmark" size={16} color="#6366F1" />
                      <Text style={styles.saveJobButtonText}>
                        Save this job
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: isDark
                    ? "rgba(31, 41, 55, 0.6)"
                    : "rgba(255, 255, 255, 0.8)",
                },
              ]}
            >
              {refreshingJobs ? (
                <>
                  <ActivityIndicator
                    size="large"
                    color="#6366F1"
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: isDark ? "#D1D5DB" : "#4B5563" },
                    ]}
                  >
                    Finding jobs that match your profile...
                  </Text>
                </>
              ) : (
                <>
                  <LottieView
                    source={require("@/assets/animations/search-animation.json")}
                    style={styles.searchAnimation}
                    autoPlay
                    loop
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: isDark ? "#D1D5DB" : "#4B5563" },
                    ]}
                  >
                    Tap the refresh icon to find jobs matching your profile
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={handleRefreshJobs}
                  >
                    <Text style={styles.emptyStateButtonText}>
                      Find Matching Jobs
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* Saved Jobs Section */}
        {savedJobs.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <View style={styles.sectionHeaderWithLink}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Saved Jobs 📌
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={recalculateJobMatches}
                  disabled={recalculatingMatches}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 12,
                    opacity: recalculatingMatches ? 0.5 : 1,
                  }}
                >
                  <Feather name="refresh-cw" size={14} color="#6366F1" />
                  <Text
                    style={{
                      marginLeft: 4,
                      fontSize: 12,
                      color: "#6366F1",
                      fontWeight: "500",
                    }}
                  >
                    Update Matches
                  </Text>
                  {recalculatingMatches && (
                    <ActivityIndicator
                      size="small"
                      color="#6366F1"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/saved-jobs")}>
                  <Text style={styles.seeAllLink}>See all</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {savedJobs.slice(0, 3).map((job, index) => (
                <JobCard
                  key={`saved-${
                    job.id || job.external_job_id || `job-${index}`
                  }`}
                  job={{
                    job_id: job.external_job_id,
                    job_title: job.job_title,
                    employer_name: job.company_name,
                    job_description: job.job_description,
                    job_city: job.job_location,
                    match_percentage:
                      job.match_percentage !== undefined
                        ? job.match_percentage
                        : 85,
                  }}
                  isDark={isDark}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended Skills (Horizontal Scroll) */}
        <View style={styles.recommendationsContainer}>
          <View style={styles.sectionHeaderWithLink}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Recommended Skills 📚
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/skills",
                  params: {
                    prompt: "What skills should I learn to advance my career?",
                  },
                })
              }
            >
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {skillSuggestions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {skillSuggestions.map((skill, index) => (
                <View key={index} style={styles.skillCardWrapper}>
                  <SkillSuggestionCard skill={skill} isDark={isDark} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: isDark
                    ? "rgba(31, 41, 55, 0.6)"
                    : "rgba(255, 255, 255, 0.8)",
                },
              ]}
            >
              <Feather name="book" size={40} color="#9CA3AF" />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                No learning suggestions yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  quickActionsContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeaderWithLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllLink: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "30%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#6366F1",
    textAlign: "center",
  },
  tipCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationsContainer: {
    marginBottom: 24,
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  skillCardWrapper: {
    width: 280, // Match the width of JobCard for consistency
    marginRight: 16,
  },
  jobCard: {
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 280,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 12,
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  applyButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 12,
  },
  learningContainer: {
    marginBottom: 24,
  },
  learningCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  learningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  learningTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  learningDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  learnMoreButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  learnMoreButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  emptyState: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  searchAnimation: {
    width: 80,
    height: 80,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
  emptyStateButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  saveJobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    width: 280,
  },
  saveJobButtonText: {
    color: "#6366F1",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 6,
  },
});
