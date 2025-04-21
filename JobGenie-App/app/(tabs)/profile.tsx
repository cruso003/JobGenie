// app/(tabs)/profile.tsx - Modified to add Documents section
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";
import { cn } from "@/utils/cn";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { clearResourceCache } from "@/utils/learningResources";
import { useJobsStore } from "@/stores/jobs";
import { useDocumentsStore } from "@/stores/documents";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, signOut } = useAuthStore();
  const { savedJobs, fetchSavedJobs } = useJobsStore();
  const { documents, fetchDocuments } = useDocumentsStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [savedCoverLetters, setSavedCoverLetters] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchSavedJobs();
      fetchDocuments();
    }
  }, [user]);

  useEffect(() => {
    if (documents) {
      // Filter documents by type
      const resumes = documents.filter((doc) => doc.document_type === "resume");
      const coverLetters = documents.filter(
        (doc) => doc.document_type === "cover_letter"
      );

      setSavedResumes(resumes);
      setSavedCoverLetters(coverLetters);
    }
  }, [documents]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Calculate profile completeness
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
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete user data from Supabase
              await supabase.from("profiles").delete().eq("id", user?.id);
              await supabase
                .from("saved_jobs")
                .delete()
                .eq("user_id", user?.id);

              // Delete authentication
              const { error } = await supabase.auth.admin.deleteUser(
                profile?.user_id
              );
              if (error) throw error;

              await signOut();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const clearCache = async () => {
    try {
      await clearResourceCache();
      Alert.alert("Success", "Cache cleared successfully");
    } catch (error) {
      console.error("Error clearing cache:", error);
      Alert.alert("Error", "Failed to clear cache");
    }
  };

  const getExperienceLevel = () => {
    if (!profile?.experience) return "Not specified";

    let experience;
    try {
      experience =
        typeof profile.experience === "string"
          ? JSON.parse(profile.experience)
          : profile.experience;
    } catch (e) {
      return "Not specified";
    }

    return `${experience.level || "Not specified"} (${
      experience.yearsOfExperience || 0
    } years)`;
  };

  const handleEditProfile = () => {
    router.push({
      pathname: "/edit-profile",
      params: { fromProfile: "true" },
    });
  };

  const handleCreateResume = () => {
    router.push("/resume");
  };

  const handleViewDocument = (documentId: string) => {
    router.push({
      pathname: "/document-viewer",
      params: { documentId },
    });
  };

  const renderDocumentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleViewDocument(item.id)}
      className={cn(
        "flex-row items-center py-3 px-4 rounded-xl mb-2",
        isDark ? "bg-gray-700/50" : "bg-white"
      )}
    >
      <View className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center mr-3">
        <Feather name="file-text" size={16} color="#6366F1" />
      </View>
      <View className="flex-1">
        <Text
          className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}
        >
          {item.title}
        </Text>
        <Text
          className={cn("text-xs", isDark ? "text-white/60" : "text-gray-500")}
        >
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={18}
        color={isDark ? "#9CA3AF" : "#6B7280"}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        className="absolute inset-0"
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
        <Text
          className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Profile
        </Text>
        <TouchableOpacity
          onPress={handleLogout}
          className={cn(
            "w-10 h-10 rounded-full items-center justify-center",
            isDark ? "bg-white/10" : "bg-black/5"
          )}
        >
          <Feather
            name="log-out"
            size={20}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pb-8">
        {/* Profile Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
        >
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
              <View className="flex-row items-center mb-4">
                <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mr-4">
                  <Text className="text-white text-2xl font-bold">
                    {profile?.full_name
                      ? profile.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                      : "?"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">
                    {profile?.full_name || "Anonymous User"}
                  </Text>
                  <Text className="text-white/80">
                    {/* More robust way to access the current title */}
                    {(() => {
                      try {
                        if (typeof profile?.experience === "string") {
                          const parsed = JSON.parse(profile.experience);
                          return parsed.currentTitle || "Not specified";
                        } else if (profile?.experience?.currentTitle) {
                          return profile.experience.currentTitle;
                        } else {
                          return "Not specified";
                        }
                      } catch (e) {
                        return "Not specified";
                      }
                    })()}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <View className="flex-row items-center mb-1">
                  <Feather name="map-pin" size={14} color="white" />
                  <Text className="text-white ml-2">
                    {profile?.location || "Location not specified"}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Feather name="briefcase" size={14} color="white" />
                  <Text className="text-white ml-2">
                    {profile?.job_type || "Job type not specified"}
                  </Text>
                </View>
              </View>

              {/* Profile Completeness */}
              <View className="mb-2">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white/90 text-xs">
                    Profile Completeness
                  </Text>
                  <Text className="text-white/90 text-xs">
                    {profileCompleteness}%
                  </Text>
                </View>
                <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-white/90 rounded-full"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </View>
              </View>

              {/* Edit Profile Button */}
              <TouchableOpacity
                className="bg-white/20 px-4 py-2 rounded-lg flex-row items-center self-start mt-3"
                onPress={handleEditProfile}
              >
                <Feather name="edit-2" size={16} color="white" />
                <Text className="text-white ml-2">Edit Profile</Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </MotiView>

        {/* Documents Section */}
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
            My Documents
          </Text>

          {/* Resumes */}
          <View className="mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text
                className={cn(
                  "font-medium text-base",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Resumes
              </Text>
              <Text
                className={cn(
                  "text-xs",
                  isDark ? "text-white/60" : "text-gray-500"
                )}
              >
                {savedResumes.length} saved
              </Text>
            </View>

            {savedResumes.length > 0 ? (
              <FlatList
                data={savedResumes.slice(0, 2)} // Show only the 2 most recent
                renderItem={renderDocumentItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text
                className={cn(
                  "text-center py-4",
                  isDark ? "text-white/60" : "text-gray-500"
                )}
              >
                No resumes yet
              </Text>
            )}
          </View>

          {/* Cover Letters */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text
                className={cn(
                  "font-medium text-base",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Cover Letters
              </Text>
              <Text
                className={cn(
                  "text-xs",
                  isDark ? "text-white/60" : "text-gray-500"
                )}
              >
                {savedCoverLetters.length} saved
              </Text>
            </View>

            {savedCoverLetters.length > 0 ? (
              <FlatList
                data={savedCoverLetters.slice(0, 2)} // Show only the 2 most recent
                renderItem={renderDocumentItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text
                className={cn(
                  "text-center py-4",
                  isDark ? "text-white/60" : "text-gray-500"
                )}
              >
                No cover letters yet
              </Text>
            )}
          </View>

          <TouchableOpacity
            className="bg-primary px-4 py-3 rounded-xl mt-2"
            onPress={handleCreateResume}
          >
            <Text className="text-white text-center font-medium">
              Create New Document
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skills Section */}
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
            My Skills
          </Text>

          {profile?.skills && profile.skills.length > 0 ? (
            <View className="flex-row flex-wrap">
              {profile.skills.map((skill: string, index: number) => (
                <View
                  key={index}
                  className="bg-primary/20 px-3 py-1.5 rounded-full mr-2 mb-2"
                >
                  <Text
                    className="text-primary font-medium"
                    style={{ fontSize: 13 }}
                  >
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              className={cn(
                "text-center py-4",
                isDark ? "text-white/60" : "text-gray-500"
              )}
            >
              No skills added yet
            </Text>
          )}

          <TouchableOpacity
            className="flex-row items-center mt-2"
            onPress={() => router.push("/skills")}
          >
            <Text className="text-primary font-medium mr-1">
              View skill recommendations
            </Text>
            <Feather name="arrow-right" size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Saved Jobs Section */}
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
            Saved Jobs
          </Text>

          <View
            className={cn(
              "rounded-xl p-3 mb-4",
              isDark ? "bg-gray-700/50" : "bg-white"
            )}
          >
            <Text
              className={cn(
                "font-bold text-center text-xl mb-1",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              {savedJobs?.length || 0}
            </Text>
            <Text
              className={cn(
                "text-xs text-center",
                isDark ? "text-white/60" : "text-gray-500"
              )}
            >
              Jobs Saved
            </Text>
          </View>

          <TouchableOpacity
            className="bg-primary px-4 py-3 rounded-xl"
            onPress={() => router.push("/saved-jobs")}
          >
            <Text className="text-white text-center font-medium">
              View Saved Jobs
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Information */}
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
            Your Information
          </Text>

          <View className="mb-4">
            <Text
              className={cn(
                "text-sm mb-1",
                isDark ? "text-white/60" : "text-gray-500"
              )}
            >
              Email
            </Text>
            <Text
              className={cn(
                "font-medium",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              {user?.email || "Not specified"}
            </Text>
          </View>

          <View className="mb-4">
            <Text
              className={cn(
                "text-sm mb-1",
                isDark ? "text-white/60" : "text-gray-500"
              )}
            >
              Experience Level
            </Text>
            <Text
              className={cn(
                "font-medium",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              {getExperienceLevel()}
            </Text>
          </View>

          <View className="mb-4">
            <Text
              className={cn(
                "text-sm mb-1",
                isDark ? "text-white/60" : "text-gray-500"
              )}
            >
              Interests
            </Text>
            <Text
              className={cn(
                "font-medium",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              {profile?.interests && profile.interests.length > 0
                ? profile.interests.join(", ")
                : "Not specified"}
            </Text>
          </View>
        </View>

        {/* Settings */}
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
            Settings
          </Text>

          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={cn(
                  "font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Notifications
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              className="flex-row justify-between items-center mb-4"
              onPress={clearCache}
            >
              <Text
                className={cn(
                  "font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Clear Cache
              </Text>
              <Feather
                name="trash-2"
                size={20}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500/10 px-4 py-3 rounded-xl"
              onPress={handleDeleteAccount}
            >
              <Text className="text-red-500 text-center font-medium">
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
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
            About JobGenie
          </Text>

          <Text
            className={cn("mb-3", isDark ? "text-white/80" : "text-gray-600")}
          >
            JobGenie is your AI-powered career assistant, helping you find and
            land your dream job.
          </Text>

          <Text
            className={cn(
              "text-sm mb-1",
              isDark ? "text-white/60" : "text-gray-500"
            )}
          >
            Version 1.0.0
          </Text>

          <TouchableOpacity
            className="flex-row items-center mt-2"
            onPress={() => router.push("/terms-privacy")}
          >
            <Text className="text-primary font-medium mr-1">
              Terms of Service & Privacy Policy
            </Text>
            <Feather name="external-link" size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
