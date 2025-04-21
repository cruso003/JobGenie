// app/job-details.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabase } from "@/utils/supabase";
import { useAuthStore } from "@/stores/auth";
import { getJobDetails } from "@/utils/jsearch";
import { useJobsStore } from "@/stores/jobs";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

export default function JobDetailsScreen() {
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  const source = params.source as string;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string>("new");
  const [isSaved, setIsSaved] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useAuthStore();
  const { recommendedJobs } = useJobsStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  
  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      checkIfSaved();
    } else {
      setError("No job ID provided");
      setLoading(false);
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      setLoading(true);

      // First check if we already have this job in our database (saved jobs)
      const { data: savedJob, error: savedJobError } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("external_job_id", jobId)
        .single();

      if (!savedJobError && savedJob) {
        setJob(savedJob);
        setApplicationStatus(savedJob.status || "saved");
        setIsSaved(true);
      } else {
        // If not in database, check if it's in the recommended jobs store
        const recommendedJob = recommendedJobs.find(job => job.job_id === jobId);
        
        if (recommendedJob) {
          setJob(recommendedJob);
        } else {
          // As a last resort, fetch from JSearch API
          try {
            const startTime = Date.now();
            const result = await getJobDetails(jobId as string);
            const timeTaken = Date.now() - startTime;
            
            // If result came back very quickly, it was likely from cache
            if (timeTaken < 300) {
              setUsingCachedData(true);
            }
            
            if (result && result.data) {
              
              // Handle cases where the API returns an array but we need the first item
              if (Array.isArray(result.data) && result.data.length > 0) {
                setJob(result.data[0]);
              } else {
                setJob(result.data);
              }
            } else {
              console.error("No job data found in API response");
              setError("Could not load job details");
              // Fallback to minimal default
              setJob({
                job_title: "Job details not available",
                employer_name: "Company information not found",
                job_description: "No description available for this job. Please try returning to the previous screen.",
                job_city: "Location not specified",
                job_apply_link: "#",
              });
            }
          } catch (apiError) {
            console.error("Error fetching job details from API:", apiError);
            setError("Error retrieving job data");
            // Use fallback
            setJob({
              job_title: "Job details not available",
              employer_name: "Company information not found",
              job_description: "No description available for this job. Please try returning to the previous screen.",
              job_city: "Location not specified",
              job_apply_link: "#",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchJobDetails:", error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  
  const checkIfSaved = async () => {
    if (!user || !jobId) return;

    try {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("external_job_id", jobId)
        .single();

      if (!error && data) {
        setIsSaved(true);
        setApplicationStatus(data.status || "saved");
      } else {
        setIsSaved(false);
        setApplicationStatus("new");
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const updateApplicationStatus = async (status: string) => {
    if (!user || !job) return;

    try {
      // First check if this job exists in our database
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_job_id", jobId)
        .single();

      if (!error && data) {
        // Update existing record
        await supabase.from("saved_jobs").update({ status }).eq("id", data.id);
      } else {
        // Create new record
        await supabase.from("saved_jobs").insert({
          user_id: user.id,
          job_title: job.job_title,
          company_name: job.employer_name || job.company_name,
          job_description: job.job_description,
          job_location: job.job_city || job.job_location || "Remote",
          job_apply_link: job.job_apply_link || job.application_link,
          external_job_id: job.job_id || jobId,
          status,
        });
      }

      setApplicationStatus(status);
      setIsSaved(true);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update application status.");
    }
  };

  const handleApply = async () => {
    const applyLink = job?.job_apply_link || job?.application_link;
    
    if (!applyLink || applyLink === "#") {
      Alert.alert(
        "No Application Link",
        "This job does not have an application link available."
      );
      return;
    }

    try {
      await Linking.openURL(applyLink);

      // Ask user if they want to mark as applied
      Alert.alert(
        "Mark as Applied?",
        "Do you want to mark this job as applied in your tracker?",
        [
          {
            text: "No",
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: () => updateApplicationStatus("applied"),
          },
        ]
      );
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "Could not open the application link.");
    }
  };

  const handleSaveJob = async () => {
    if (!user || !job) return;

    try {
      if (isSaved) {
        // Show confirmation alert before removing
        Alert.alert(
          "Unsave Job",
          "Are you sure you want to remove this job from your saved list?",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Unsave",
              style: "destructive",
              onPress: async () => {
                try {
                  const { data, error: findError } = await supabase
                    .from("saved_jobs")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("external_job_id", jobId)
                    .single();
                    
                  if (findError || !data) {
                    console.error("Job not found in saved jobs");
                    Alert.alert("Error", "Could not find this job in your saved jobs.");
                    return;
                  }
                  
                  const { error } = await supabase
                    .from("saved_jobs")
                    .delete()
                    .eq("id", data.id);

                  if (error) throw error;
                  setIsSaved(false);
                  setApplicationStatus("new");
                } catch (error) {
                  console.error("Error unsaving job:", error);
                  Alert.alert("Error", "Failed to unsave this job. Please try again.");
                }
              }
            }
          ]
        );
      } else {
        // Add to saved jobs
        const { error } = await supabase.from("saved_jobs").insert({
          user_id: user.id,
          job_title: job.job_title,
          company_name: job.employer_name || job.company_name,
          job_description: job.job_description,
          job_location: job.job_city || job.job_location || "Remote",
          job_apply_link: job.job_apply_link || job.application_link,
          external_job_id: job.job_id || jobId,
          status: "saved",
        });

        if (error) throw error;
        setIsSaved(true);
        setApplicationStatus("saved");
        Alert.alert("Success", "Job saved successfully!");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      Alert.alert("Error", "Failed to save this job. Please try again.");
    }
  };

  const handleDeleteJob = async () => {
    if (!user || !jobId) return;
    
    Alert.alert(
      'Remove Job',
      'Are you sure you want to remove this job from your saved jobs?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error: findError } = await supabase
                .from("saved_jobs")
                .select("id")
                .eq("user_id", user.id)
                .eq("external_job_id", jobId)
                .single();
                
              if (findError || !data) {
                console.error("Job not found in saved jobs");
                Alert.alert("Error", "Could not find this job in your saved jobs.");
                return;
              }
              
              const { error } = await supabase
                .from('saved_jobs')
                .delete()
                .eq('id', data.id);
              
              if (error) throw error;
              
              // Navigate back after deletion
              router.back();
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'Failed to remove this job. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchJobDetails();
  };

  const handleTailoredResume = () => {
    router.push({
      pathname: "/(tabs)/resume",
      params: {
        jobTitle: job?.job_title,
        company: job?.employer_name || job?.company_name,
      },
    });
  };

  const handleCreateCoverLetter = () => {
    router.push({
      pathname: "/(tabs)/resume",
      params: {
        jobTitle: job?.job_title,
        company: job?.employer_name || job?.company_name,
        action: "cover-letter",
      },
    });
  };

  const handlePrepareInterview = () => {
    router.push({
      pathname: "/(tabs)/genie",
      params: {
        prompt: `Prepare me for an interview for a ${job?.job_title} role at ${job?.employer_name || job?.company_name}`,
      },
    });
  };

  const handleShareJob = async () => {
    try {
      await Share.share({
        title: `Job: ${job?.job_title} at ${job?.employer_name || job?.company_name}`,
        message: `Check out this job: ${job?.job_title} at ${job?.employer_name || job?.company_name}\n\n${job?.job_description?.substring(0, 200)}...\n\nApply here: ${job?.job_apply_link || job?.application_link || "No link available"}`,
      });
    } catch (error) {
      console.error("Error sharing job:", error);
    }
  };

  const renderSalaryInfo = () => {
    if (job?.salary_range && job.salary_range !== "Not specified") {
      return (
        <View style={styles.salaryContainer}>
          <Feather name="dollar-sign" size={16} color="#6366F1" />
          <Text
            style={[
              styles.salaryText,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            {job.salary_range}
          </Text>
        </View>
      );
    } else if (job?.job_min_salary && job?.job_max_salary) {
      return (
        <View style={styles.salaryContainer}>
          <Feather name="dollar-sign" size={16} color="#6366F1" />
          <Text
            style={[
              styles.salaryText,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            {job.job_min_salary}-{job.job_max_salary}{" "}
            {job.job_salary_currency || ""} {job.job_salary_period?.toLowerCase() || ""}
          </Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
        <LinearGradient
          colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather
              name="arrow-left"
              size={24}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={50} color={isDark ? "#E5E7EB" : "#6B7280"} />
          <Text style={{ 
            color: isDark ? "#FFFFFF" : "#111827", 
            textAlign: "center", 
            marginTop: 20,
            marginBottom: 16,
            fontSize: 18,
            fontWeight: "500"
          }}>
            {error}
          </Text>
          <Text style={{ 
            color: isDark ? "#D1D5DB" : "#6B7280", 
            textAlign: "center", 
            marginBottom: 20,
            paddingHorizontal: 20,
          }}>
            We couldn't load the job details. This may happen if the job listing has expired or if there's a connection issue.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Feather name="refresh-cw" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: "#FFFFFF", fontWeight: "500" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather
            name="arrow-left"
            size={24}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {isSaved && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDeleteJob}
            >
              <Feather
                name="trash-2"
                size={22}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={handleShareJob}>
            <Feather
              name="share-2"
              size={22}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSaveJob}>
            <Feather
              name="bookmark"
              size={22}
              color={isSaved ? "#6366F1" : isDark ? "#FFFFFF" : "#111827"}
              style={{ opacity: isSaved ? 1 : 0.5 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cached data indicator */}
        {usingCachedData && (
          <View style={[
            styles.cachedDataIndicator,
            { backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "rgba(219, 234, 254, 0.8)" }
          ]}>
            <Feather name="database" size={14} color={isDark ? "#93C5FD" : "#3B82F6"} />
            <Text style={[
              styles.cachedDataText,
              { color: isDark ? "#93C5FD" : "#3B82F6" }
            ]}>
              Viewing cached job data. Pull down to refresh.
            </Text>
          </View>
        )}

        {/* Job Title Section */}
        <Text
          style={[styles.jobTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}
        >
          {job?.job_title || "Job Title"}
        </Text>

        <Text
          style={[
            styles.companyName,
            { color: isDark ? "#D1D5DB" : "#4B5563" },
          ]}
        >
          {job?.employer_name || job?.company_name || "Company"}
        </Text>

        <View style={styles.locationContainer}>
          <Feather name="map-pin" size={16} color="#6366F1" />
          <Text
            style={[
              styles.locationText,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {job?.job_city || job?.job_location || "Remote"}
            {job?.job_country ? `, ${job.job_country}` : ""}
          </Text>
        </View>

        {/* Application Status */}
        <View style={styles.applicationStatusContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Application Status
          </Text>
          <View style={styles.statusOptions}>
            <TouchableOpacity
              style={[
                styles.statusOption,
                applicationStatus === "saved" && styles.activeStatusOption,
              ]}
              onPress={() => updateApplicationStatus("saved")}
            >
              <Text
                style={[
                  styles.statusText,
                  applicationStatus === "saved" && styles.activeStatusText,
                ]}
              >
                Saved
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                applicationStatus === "applied" && styles.activeStatusOption,
              ]}
              onPress={() => updateApplicationStatus("applied")}
            >
              <Text
                style={[
                  styles.statusText,
                  applicationStatus === "applied" && styles.activeStatusText,
                ]}
              >
                Applied
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                applicationStatus === "interviewing" &&
                  styles.activeStatusOption,
              ]}
              onPress={() => updateApplicationStatus("interviewing")}
            >
              <Text
                style={[
                  styles.statusText,
                  applicationStatus === "interviewing" &&
                    styles.activeStatusText,
                ]}
              >
                Interviewing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                applicationStatus === "offered" && styles.activeStatusOption,
              ]}
              onPress={() => updateApplicationStatus("offered")}
            >
              <Text
                style={[
                  styles.statusText,
                  applicationStatus === "offered" && styles.activeStatusText,
                ]}
              >
                Offered
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Salary Info */}
        {renderSalaryInfo()}

        {/* Application Checklist */}
        <View style={styles.checklistContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Application Checklist
          </Text>
          <View
            style={[
              styles.checklist,
              {
                backgroundColor: isDark
                  ? "rgba(31, 41, 55, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.checklistItem}
              onPress={handleTailoredResume}
            >
              <Feather name="file-text" size={20} color="#6366F1" />
              <Text
                style={[
                  styles.checklistText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Tailor your resume
              </Text>
              <Feather
                name="chevron-right"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checklistItem}
              onPress={handleCreateCoverLetter}
            >
              <Feather name="edit-3" size={20} color="#6366F1" />
              <Text
                style={[
                  styles.checklistText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Create a cover letter
              </Text>
              <Feather
                name="chevron-right"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checklistItem}
              onPress={handlePrepareInterview}
            >
              <Feather name="message-circle" size={20} color="#6366F1" />
              <Text
                style={[
                  styles.checklistText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Practice interview
              </Text>
              <Feather
                name="chevron-right"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Job Description */}
        <View style={styles.descriptionContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Job Description
          </Text>
          <Text
            style={[
              styles.description,
              { color: isDark ? "#D1D5DB" : "#4B5563" },
            ]}
          >
            {job?.job_description || "No description available"}
          </Text>
        </View>

        {/* Application Tips */}
        <View style={styles.tipsContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Application Tips
          </Text>
          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: isDark
                  ? "rgba(31, 41, 55, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
              },
            ]}
          >
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={18} color="#10B981" />
              <Text
                style={[
                  styles.tipText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                Customize your resume to highlight relevant skills for this role
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={18} color="#10B981" />
              <Text
                style={[
                  styles.tipText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                Address specific job requirements in your cover letter
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={18} color="#10B981" />
              <Text
                style={[
                  styles.tipText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                Research {job?.employer_name || job?.company_name} before applying to mention in your
                application
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={18} color="#10B981" />
              <Text
                style={[
                  styles.tipText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                Follow up within 1-2 weeks if you don't hear back
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cachedDataIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  cachedDataText: {
    fontSize: 12,
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
  },
  salaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  salaryText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "500",
  },
  applicationStatusContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  activeStatusOption: {
    backgroundColor: "#6366F1",
  },
  statusText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "500",
  },
  activeStatusText: {
    color: "#FFFFFF",
  },
  checklistContainer: {
    marginBottom: 24,
  },
  checklist: {
    borderRadius: 16,
    overflow: "hidden",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(209, 213, 219, 0.3)",
  },
  checklistText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  tipsContainer: {
    marginBottom: 100, // Extra space for the footer
  },
  tipCard: {
    borderRadius: 16,
    padding: 16,
  },
  tipItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  tipText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "transparent",
  },
  applyButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
