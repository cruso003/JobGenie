import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Modal,
  StyleSheet,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";
import { 
  searchJobs, 
  searchJobsWithFilters, 
  forceRefreshJobSearch 
} from "@/utils/jsearch";
import { generateJobSearchQuery } from "@/utils/gemini";
import { cn } from "@/utils/cn";
import { useJobsStore } from "@/stores/jobs";
import { Image } from "expo-image";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

type JobCategory = {
  name: string;
  icon: string;
  query: string;
};

const categories: JobCategory[] = [
  { name: "Software Development", icon: "code", query: "software developer" },
  { name: "Data Science", icon: "bar-chart-2", query: "data scientist" },
  { name: "Design", icon: "pen-tool", query: "ui ux designer" },
  { name: "Marketing", icon: "trending-up", query: "marketing" },
  { name: "Sales", icon: "dollar-sign", query: "sales" },
  { name: "Engineering", icon: "tool", query: "engineer" },
  { name: "Product", icon: "box", query: "product manager" },
  { name: "Finance", icon: "briefcase", query: "finance" },
];

const jobTypes = [
  { label: "All Types", value: "" },
  { label: "Full-time", value: "FULLTIME" },
  { label: "Part-time", value: "PARTTIME" },
  { label: "Contract", value: "CONTRACTOR" },
  { label: "Internship", value: "INTERN" },
];

export default function ExploreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuthStore();
  const { saveJob } = useJobsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedJobTypeLabel, setSelectedJobTypeLabel] = useState("Select Job Type");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedSkillLabel, setSelectedSkillLabel] = useState("Select Skill");
  const [jobTypeModalVisible, setJobTypeModalVisible] = useState(false);
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trendingJobs, setTrendingJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Fetch profile on component mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Fetch trending jobs when profile loads or selectedSkill changes
  useEffect(() => {
    if (profile?.skills?.length > 0) {
      const initialSkill = profile.skills[0] || "";
      setSelectedSkill(initialSkill);
      setSelectedSkillLabel(initialSkill);
      fetchTrendingJobs(initialSkill);
    }
  }, [profile]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // If user has location in profile, set it as default
      if (data?.location) {
        setLocation(data.location);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchTrendingJobs = async (skill: string) => {
    try {
      setLoadingTrending(true);
      setUsingCachedData(false);
      
      const startTime = Date.now();
      const result = await searchJobs(`trending jobs in ${skill}`, 1, 3);
      const timeTaken = Date.now() - startTime;
      
      // If result came back very quickly, it was likely from cache
      if (timeTaken < 300) {
        setUsingCachedData(true);
      }

      if (result?.data && Array.isArray(result.data)) {
        setTrendingJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching trending jobs:", error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setUsingCachedData(false);

      // Generate optimized search query using Gemini if the profile is available
      let optimizedQuery = searchQuery;

      if (profile && !searchQuery) {
        try {
          // Generate a search query based on user profile
          const suggestedQuery = await generateJobSearchQuery(
            profile.experience?.currentTitle || "professional",
            location,
            remoteOnly
          );

          if (suggestedQuery) {
            optimizedQuery = suggestedQuery;
          }
        } catch (err) {
          console.error("Error generating search query:", err);
        }
      }

      // If still no query, use a default one
      if (!optimizedQuery) {
        optimizedQuery = profile?.experience?.currentTitle || "jobs";
      }

      // Prepare filter parameters
      const filters: any = {};

      if (selectedJobType) {
        filters.employment_types = [selectedJobType];
      }

      if (remoteOnly) {
        filters.remote_jobs_only = true;
      }

      // Build final search string
      let searchString = `${optimizedQuery} ${location}`.trim();

      // Perform the search
      const startTime = Date.now();
      const result = await searchJobsWithFilters(searchString, filters);
      const timeTaken = Date.now() - startTime;
      
      if (timeTaken < 300) {
        setUsingCachedData(true);
      }

      if (result?.data && Array.isArray(result.data)) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (category: JobCategory) => {
    setSearchQuery(category.query);
    await handleSearch();
  };

  const handleRefreshWithCache = async () => {
    setIsRefreshing(true);
    setUsingCachedData(false);
    
    try {
      // Force refresh trending jobs
      if (selectedSkill) {
        await forceRefreshJobSearch(`trending jobs in ${selectedSkill}`, 1, 3);
        await fetchTrendingJobs(selectedSkill);
      }
      
      // Force refresh search results if any
      if (searchResults.length > 0) {
        let searchString = `${searchQuery || profile?.experience?.currentTitle || "jobs"} ${location}`.trim();
        const filters: any = {};
        if (selectedJobType) {
          filters.employment_types = [selectedJobType];
        }
        if (remoteOnly) {
          filters.remote_jobs_only = true;
        }
        
        await forceRefreshJobSearch(searchString, 1, 1, filters);
        await handleSearch();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveJob = async (job: any) => {
    try {
      // Extract salary information if available
      let salaryRange = "Not specified";

      if (job.job_min_salary && job.job_max_salary) {
        salaryRange = `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`;
      } else if (job.job_description) {
        const rangeRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?-\s?(?:\$|USD)?\s?(\d{1,3}(?:,\d{3})*)/i;
        const rangeMatch = job.job_description.match(rangeRegex);
        if (rangeMatch) {
          const minSalary = parseInt(rangeMatch[1].replace(/,/g, ""), 10);
          const maxSalary = parseInt(rangeMatch[2].replace(/,/g, ""), 10);
          salaryRange = `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
        } else {
          const singleRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?(?!\s?-\s?(?:\$|USD)?\s?\d{1,3}(?:,\d{3})*)/i;
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
        job_location: job.job_city || location || "Remote",
        salary_range: salaryRange,
        application_link: job.job_apply_link,
        job_source: "JSearch",
        external_job_id: job.job_id || `jobgenie-${Date.now()}`,
        status: "saved",
        match_percentage: job.match_percentage || 85,
        match_reasoning: job.match_reasoning || "Based on your search criteria",
      });

      alert("Job saved successfully!");
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to save job. Please try again.");
    }
  };

  const handleJobTypeSelect = (item: { label: string; value: string }) => {
    setSelectedJobType(item.value);
    setSelectedJobTypeLabel(item.label);
    setJobTypeModalVisible(false);
  };

  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill);
    setSelectedSkillLabel(skill);
    setSkillModalVisible(false);
    fetchTrendingJobs(skill);
  };

  const renderJobItem = ({ item }: { item: any }) => (
    <View
      className={cn(
        "rounded-xl p-4 mb-4",
        isDark ? "bg-gray-800/60" : "bg-white/80"
      )}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text
            className={cn(
              "font-bold text-base mb-1",
              isDark ? "text-white" : "text-gray-900"
            )}
            numberOfLines={2}
          >
            {item.job_title}
          </Text>
          <Text
            className={cn(
              "text-sm mb-1",
              isDark ? "text-gray-300" : "text-gray-700"
            )}
          >
            {item.employer_name}
          </Text>
          <View className="flex-row items-center">
            <Feather
              name="map-pin"
              size={12}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <Text
              className={cn(
                "text-xs ml-1",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              {item.job_city || item.job_country || "Remote"}
            </Text>
          </View>
        </View>
        {item.employer_logo && (
          <View
            className={cn(
              "w-12 h-12 rounded-lg items-center justify-center",
              isDark ? "bg-gray-700" : "bg-gray-100"
            )}
          >
            <Image
              source={{ uri: item.employer_logo }}
              className="w-10 h-10 rounded"
              placeholder={require("@/assets/images/company-placeholder.jpg")}
            />
          </View>
        )}
      </View>

      <Text
        className={cn(
          "text-sm my-2",
          isDark ? "text-gray-300" : "text-gray-600"
        )}
        numberOfLines={3}
      >
        {item.job_description || "No description available"}
      </Text>

      <View className="flex-row mt-3 justify-between">
        <TouchableOpacity
          className={cn(
            "px-3 py-2 rounded-lg flex-row items-center",
            "bg-primary"
          )}
          onPress={() => {
            router.push({
              pathname: "/job-details",
              params: { jobId: item.job_id || item.id },
            });
          }}
        >
          <Text className="text-white font-medium text-sm">View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={cn(
            "px-3 py-2 rounded-lg flex-row items-center",
            isDark ? "bg-gray-700" : "bg-gray-200"
          )}
          onPress={() => handleSaveJob(item)}
        >
          <Feather
            name="bookmark"
            size={16}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
          <Text
            className={cn(
              "ml-1 font-medium text-sm",
              isDark ? "text-white" : "text-gray-800"
            )}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      {isLoading && <LoadingIndicator />}
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        className="absolute inset-0"
      />

      {/* Header */}
      <View className="pt-14 pb-2 px-6">
        <Text
          className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Explore Jobs
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshWithCache} />
        }
      >
        {/* Search Bar */}
        <View className="mb-6">
          <View
            className={cn(
              "flex-row items-center bg-white/80 rounded-xl px-4 py-3 mb-2",
              isDark && "bg-gray-800/80"
            )}
          >
            <Feather
              name="search"
              size={20}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <TextInput
              className={cn(
                "flex-1 mx-2",
                isDark ? "text-white" : "text-gray-900"
              )}
              placeholder="Job title or keywords"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather
                  name="x"
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="flex-row mb-2">
            <View
              className={cn(
                "flex-1 bg-white/80 rounded-xl px-4 py-3 mr-2",
                isDark && "bg-gray-800/80"
              )}
            >
              <View className="flex-row items-center">
                <Feather
                  name="map-pin"
                  size={18}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <TextInput
                  className={cn(
                    "flex-1 mx-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                  placeholder="Location"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-xl px-4 py-3 items-center justify-center"
              onPress={handleSearch}
            >
              <Feather name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Text
                className={cn(
                  "text-sm mr-2",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Remote Only
              </Text>
              <Switch
                value={remoteOnly}
                onValueChange={setRemoteOnly}
                trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View>
              <TouchableOpacity
                style={{
                  backgroundColor: isDark
                    ? "rgba(31, 41, 55, 0.8)"
                    : "rgba(255, 255, 255, 0.8)",
                  borderRadius: 8,
                  height: 36,
                  width: 150,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 10,
                }}
                onPress={() => setJobTypeModalVisible(true)}
                accessible={true}
                accessibilityLabel="Select job type"
                accessibilityRole="combobox"
              >
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: 14,
                    flex: 1,
                  }}
                >
                  {selectedJobTypeLabel}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color={isDark ? "#FFFFFF" : "#111827"}
                />
              </TouchableOpacity>

              <Modal
                animationType="slide"
                transparent={true}
                visible={jobTypeModalVisible}
                onRequestClose={() => setJobTypeModalVisible(false)}
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
                        style={{
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Select Job Type
                      </Text>
                      <TouchableOpacity
                        onPress={() => setJobTypeModalVisible(false)}
                        accessible={true}
                        accessibilityLabel="Close modal"
                      >
                        <Feather
                          name="x"
                          size={24}
                          color={isDark ? "#FFFFFF" : "#111827"}
                        />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={jobTypes}
                      keyExtractor={(item) => item.value}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.modalItem,
                            {
                              borderBottomColor: isDark ? "#374151" : "#E5E7EB",
                            },
                          ]}
                          onPress={() => handleJobTypeSelect(item)}
                        >
                          <Text
                            style={{
                              color: isDark ? "#FFFFFF" : "#111827",
                              fontSize: 14,
                            }}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </Modal>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View className="mb-6">
          <Text
            className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Browse by Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                className={cn(
                  "mr-3 px-4 py-3 rounded-xl flex-row items-center",
                  isDark ? "bg-gray-800/80" : "bg-white/80"
                )}
                onPress={() => handleCategorySelect(category)}
              >
                <Feather name={category.icon as any} size={16} color="#6366F1" />
                <Text
                  className={cn(
                    "ml-2 font-medium",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cached data indicator */}
        {usingCachedData && (
          <View 
            className={cn(
              "flex-row items-center justify-center py-1 mb-2 rounded-lg",
              isDark ? "bg-blue-900/30" : "bg-blue-100"
            )}
          >
            <Feather name="database" size={14} color={isDark ? "#93C5FD" : "#3B82F6"} />
            <Text
              className={cn(
                "text-xs ml-1",
                isDark ? "text-blue-200" : "text-blue-600"
              )}
            >
              Using cached results. Pull down to refresh.
            </Text>
          </View>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View className="mb-6">
            <Text
              className={cn(
                "text-lg font-semibold mb-3",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              Search Results
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderJobItem}
              keyExtractor={(item) => item.job_id || String(Math.random())}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Trending Jobs */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className={cn(
                "text-lg font-semibold",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              Trending {selectedSkill || "Skill"} Jobs
            </Text>

            {profile?.skills?.length > 0 && (
              <View>
                <TouchableOpacity
                  style={{
                    backgroundColor: isDark
                      ? "rgba(31, 41, 55, 0.8)"
                      : "rgba(255, 255, 255, 0.8)",
                    borderRadius: 8,
                    height: 36,
                    width: 140,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                  }}
                  onPress={() => setSkillModalVisible(true)}
                  accessible={true}
                  accessibilityLabel="Select skill"
                  accessibilityRole="combobox"
                >
                  <Text
                    style={{
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontSize: 14,
                      flex: 1,
                    }}
                  >
                    {selectedSkillLabel}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={16}
                    color={isDark ? "#FFFFFF" : "#111827"}
                  />
                </TouchableOpacity>

                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={skillModalVisible}
                  onRequestClose={() => setSkillModalVisible(false)}
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
                          style={{
                            color: isDark ? "#FFFFFF" : "#111827",
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          Select Skill
                        </Text>
                        <TouchableOpacity
                          onPress={() => setSkillModalVisible(false)}
                          accessible={true}
                          accessibilityLabel="Close modal"
                        >
                          <Feather
                            name="x"
                            size={24}
                            color={isDark ? "#FFFFFF" : "#111827"}
                          />
                        </TouchableOpacity>
                      </View>
                      <FlatList
                        data={profile.skills}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.modalItem,
                              {
                                borderBottomColor: isDark ? "#374151" : "#E5E7EB",
                              },
                            ]}
                            onPress={() => handleSkillSelect(item)}
                          >
                            <Text
                              style={{
                                color: isDark ? "#FFFFFF" : "#111827",
                                fontSize: 14,
                              }}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </View>
                </Modal>
              </View>
            )}
          </View>
          {loadingTrending ? (
            <View className="flex-1 items-center justify-center py-6">
              <ActivityIndicator size="small" color="#6366F1" />
              <Text
                className={cn("mt-2", isDark ? "text-white/70" : "text-gray-500")}
              >
                Loading trending jobs...
              </Text>
            </View>
          ) : trendingJobs.length > 0 ? (
            <FlatList
              data={trendingJobs}
              renderItem={renderJobItem}
              keyExtractor={(item) => item.job_id || String(Math.random())}
              scrollEnabled={false}
            />
          ) : (
            <View
              className={cn(
                "rounded-xl p-6 items-center justify-center",
                isDark ? "bg-gray-800/60" : "bg-white/80"
              )}
            >
              <Feather name="trending-up" size={32} color="#9CA3AF" />
              <Text
                className={cn("mt-2 text-center", isDark ? "text-white/70" : "text-gray-500")}
              >
                No trending jobs available right now
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "50%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
});
