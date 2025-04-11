import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";
import { suggestJobRoles, recommendSkillsToLearn } from "@/utils/gemini";
import { searchJobs } from "@/utils/jsearch";
import LottieView from "lottie-react-native";

interface JobSuggestion {
  title: string;
  reason: string;
}

interface JobRecommendation {
  job_title: string;
  employer_name: string;
  job_description: string;
  job_apply_link: string;
  job_city: string;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_period?: string | null;
}

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jobRecommendations, setJobRecommendations] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [careerTip, setCareerTip] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<any[]>([]);
  const [geniePrompt, setGeniePrompt] = useState("");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { user } = useAuthStore();
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

      const { data: jobData, error: jobError } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("user_id", user?.id)
        .order("saved_at", { ascending: false });

      if (!jobError && jobData) {
        setSavedJobs(jobData);
      }

      const { data: recData, error: recError } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (!recError && recData) {
        setRecommendations(recData);
      }

      if (
        (!jobData || jobData.length === 0) &&
        (!recData || recData.length === 0)
      ) {
        await generateNewRecommendations();
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    // Use profile data to generate new recommendations
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

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

      fetchJobRecommendations(data);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchJobRecommendations = async (profile: any) => {
    if (!profile) return;

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
            setJobRecommendations(jobResults.data);
          } else {
            setJobRecommendations([
              {
                job_title: firstJob.title,
                employer_name: "Various Companies",
                job_description: `Based on your profile, we recommend exploring ${firstJob.title} roles. ${firstJob.reason}`,
                job_apply_link: "#",
                job_city: profile.location || "Remote",
              },
            ]);
          }
        } catch (error) {
          console.error("Error searching jobs:", error);
          setJobRecommendations(
            jobSuggestions.slice(0, 3).map(
              (job: JobSuggestion): JobRecommendation => ({
                job_title: job.title,
                employer_name: "Recommended Role",
                job_description: job.reason,
                job_apply_link: "#",
                job_city: profile.location || "Remote",
              })
            )
          );
        }
      }
    } catch (error) {
      console.error("Error getting job recommendations:", error);
    }
  };

  const fetchSkillSuggestions = async (profile: any) => {
    if (!profile) return;

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
        const skillRecommendations = await recommendSkillsToLearn(
          firstJob.title,
          profile.skills
        );
        if (skillRecommendations && skillRecommendations.length > 0) {
          setSkillSuggestions(skillRecommendations.slice(0, 3));
        }
      }
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
    }
  };

  const handleGeniePromptSubmit = () => {
    if (geniePrompt.trim()) {
      router.push({
        pathname: "/(tabs)/genie",
        params: { prompt: geniePrompt },
      });
    }
  };

  const openJobDetails = (job: any) => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  const closeJobDetails = () => {
    setModalVisible(false);
    setSelectedJob(null);
  };

  const handleTailoredResume = (job: any) => {
    router.push({
      pathname: "/(tabs)/resume",
      params: { jobTitle: job.job_title, company: job.employer_name },
    });
    closeJobDetails();
  };

  const handleCreateCoverLetter = (job: any) => {
    router.push({
      pathname: "/(tabs)/resume",
      params: {
        jobTitle: job.job_title,
        company: job.employer_name,
        action: "cover-letter",
      },
    });
    closeJobDetails();
  };

  const handlePrepareInterview = (job: any) => {
    router.push({
      pathname: "/(tabs)/genie",
      params: {
        prompt: `Prepare me for an interview for a ${job.job_title} role at ${job.employer_name}`,
      },
    });
    closeJobDetails();
  };

  const handleApplyDirectly = (job: any) => {
    if (job.job_apply_link && job.job_apply_link !== "#") {
      // In a real app, use Linking.openURL(job.job_apply_link)
      console.log("Opening application link:", job.job_apply_link);
    } else {
      console.log("No application link available");
    }
    closeJobDetails();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>
          Loading your personalized dashboard...
        </Text>
      </View>
    );
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

      {/* Job Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeJobDetails}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                {selectedJob?.job_title || "Job Details"}
              </Text>
              <Pressable onPress={closeJobDetails}>
                <Feather
                  name="x"
                  size={24}
                  color={isDark ? "#FFFFFF" : "#111827"}
                />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                {selectedJob?.employer_name || "Unknown Company"}
              </Text>
              <Text
                style={[
                  styles.modalLocation,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {selectedJob?.job_city || "Remote"}
              </Text>
              <View style={styles.modalDetail}>
                <Feather name="dollar-sign" size={16} color="#6366F1" />
                <Text
                  style={[
                    styles.modalDetailText,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  Salary Range:{" "}
                  {selectedJob?.job_min_salary && selectedJob?.job_max_salary
                    ? `${selectedJob.job_min_salary} - ${
                        selectedJob.job_max_salary
                      } per ${selectedJob.job_salary_period?.toLowerCase()}`
                    : "Not available"}
                </Text>
              </View>
              <Text
                style={[
                  styles.modalSectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Job Description
              </Text>
              <Text
                style={[
                  styles.modalDescription,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                {selectedJob?.job_description || "No description available."}
              </Text>

              {/* Prepare to Apply Section */}
              <Text
                style={[
                  styles.modalSectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827", marginTop: 24 },
                ]}
              >
                Prepare to Apply
              </Text>
              <View style={styles.prepareOptions}>
                <TouchableOpacity
                  style={[
                    styles.prepareButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.15)"
                        : "rgba(99, 102, 241, 0.1)",
                    },
                  ]}
                  onPress={() => handleTailoredResume(selectedJob)}
                >
                  <Feather name="file-text" size={20} color="#6366F1" />
                  <Text style={styles.prepareButtonText}>Tailored Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.prepareButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.15)"
                        : "rgba(99, 102, 241, 0.1)",
                    },
                  ]}
                  onPress={() => handleCreateCoverLetter(selectedJob)}
                >
                  <Feather name="edit" size={20} color="#6366F1" />
                  <Text style={styles.prepareButtonText}>
                    Create Cover Letter
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.prepareButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.15)"
                        : "rgba(99, 102, 241, 0.1)",
                    },
                  ]}
                  onPress={() => handlePrepareInterview(selectedJob)}
                >
                  <Feather name="message-circle" size={20} color="#6366F1" />
                  <Text style={styles.prepareButtonText}>
                    Prepare for Interview
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.prepareButton, styles.applyDirectButton]}
                  onPress={() => handleApplyDirectly(selectedJob)}
                >
                  <Feather name="check-circle" size={20} color="#FFFFFF" />
                  <Text
                    style={[styles.prepareButtonText, { color: "#FFFFFF" }]}
                  >
                    Apply Directly
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  },
                ]}
                onPress={closeJobDetails}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Recommended Jobs 🎯
          </Text>

          {jobRecommendations.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {jobRecommendations.map((job, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.jobCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(31, 41, 55, 0.6)"
                        : "rgba(255, 255, 255, 0.8)",
                    },
                  ]}
                  onPress={() => openJobDetails(job)}
                >
                  <View style={styles.jobHeader}>
                    <Text
                      style={[
                        styles.jobTitle,
                        { color: isDark ? "#FFFFFF" : "#111827" },
                      ]}
                      numberOfLines={1}
                    >
                      {job.job_title}
                    </Text>
                    <Feather name="bookmark" size={20} color="#6366F1" />
                  </View>
                  <Text
                    style={[
                      styles.companyName,
                      { color: isDark ? "#D1D5DB" : "#4B5563" },
                    ]}
                    numberOfLines={1}
                  >
                    {job.employer_name}
                  </Text>
                  <Text
                    style={[
                      styles.jobLocation,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {job.job_city || "Remote"}
                  </Text>
                  <Text
                    style={[
                      styles.jobDescription,
                      { color: isDark ? "#D1D5DB" : "#4B5563" },
                    ]}
                    numberOfLines={2}
                  >
                    {job.job_description?.substring(0, 100)}...
                  </Text>

                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => openJobDetails(job)}
                  >
                    <Text style={styles.applyButtonText}>View Details</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
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
                We're finding perfect jobs for you
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.emptyStateButtonText}>Search Jobs Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Continue Learning */}
        <View style={styles.learningContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Continue Learning 📚
          </Text>

          {skillSuggestions.length > 0 ? (
            skillSuggestions.map((skill, index) => (
              <View
                key={index}
                style={[
                  styles.learningCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(31, 41, 55, 0.6)"
                      : "rgba(255, 255, 255, 0.8)",
                  },
                ]}
              >
                <View style={styles.learningHeader}>
                  <Feather name="book-open" size={20} color="#6366F1" />
                  <Text
                    style={[
                      styles.learningTitle,
                      { color: isDark ? "#FFFFFF" : "#111827" },
                    ]}
                  >
                    {skill.skill}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.learningDescription,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                  numberOfLines={2}
                >
                  {skill.reason}
                </Text>
                <TouchableOpacity style={styles.learnMoreButton}>
                  <Text style={styles.learnMoreButtonText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            ))
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

        {/* AI Genie Prompt Box */}
        <View style={styles.geniePromptContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Ask the Genie 🧠
          </Text>
          <View
            style={[
              styles.promptBox,
              {
                backgroundColor: isDark
                  ? "rgba(31, 41, 55, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
              },
            ]}
          >
            <TextInput
              style={[
                styles.promptInput,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
              placeholder="What skills do I need for a frontend dev job?"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={geniePrompt}
              onChangeText={setGeniePrompt}
            />
            <TouchableOpacity
              style={styles.promptButton}
              onPress={handleGeniePromptSubmit}
            >
              <Feather name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
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
  geniePromptContainer: {
    marginBottom: 24,
  },
  promptBox: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  promptInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  promptButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    padding: 8,
    marginLeft: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalLocation: {
    fontSize: 14,
    marginBottom: 12,
  },
  modalDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalScroll: {
    flex: 1,
  },
  modalFooter: {
    marginTop: 16,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  modalButtonText: {
    fontWeight: "500",
    fontSize: 16,
  },
  prepareOptions: {
    marginBottom: 16,
  },
  prepareButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  applyDirectButton: {
    backgroundColor: "#6366F1",
  },
  prepareButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#6366F1",
  },
});
