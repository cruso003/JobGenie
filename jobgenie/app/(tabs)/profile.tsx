import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Switch,
  Image,
  Alert,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: "Applied" | "Interview Scheduled" | "Offer Received" | "Rejected";
  date: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // State for profile data
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [desiredRole, setDesiredRole] = useState("Software Engineer");
  const [location, setLocation] = useState("San Francisco, CA");
  const [salaryExpectation, setSalaryExpectation] = useState("100,000");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Placeholder application history
  const [applications, setApplications] = useState<Application[]>([
    {
      id: "1",
      jobTitle: "Frontend Developer",
      company: "TechCorp",
      status: "Interview Scheduled",
      date: "2025-04-01",
    },
    {
      id: "2",
      jobTitle: "Product Manager",
      company: "Innovate Inc.",
      status: "Applied",
      date: "2025-03-28",
    },
    {
      id: "3",
      jobTitle: "Data Analyst",
      company: "DataSolutions",
      status: "Rejected",
      date: "2025-03-15",
    },
  ]);

  // Toggle dark mode (placeholder)
  const toggleDarkMode = () => {
    // This is handled by useColorScheme, but you can add logic to save the preference
    console.log("Toggling dark mode...");
  };

  // Logout
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            console.log("Logging out...");
            // Implement logout logic (e.g., clear auth token, navigate to login)
            router.replace("/login");
          },
        },
      ]
    );
  };

  // Delete Account
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("Deleting account...");
            // Implement delete account logic (e.g., call Supabase to delete user)
            router.replace("/login");
          },
        },
      ]
    );
  };

  // Render application history item
  const renderApplication = ({ item }: { item: Application }) => (
    <View
      style={[
        styles.applicationCard,
        { backgroundColor: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.8)" },
      ]}
    >
      <View style={styles.applicationHeader}>
        <Text
          style={[
            styles.applicationTitle,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          {item.jobTitle}
        </Text>
        <Text
          style={[
            styles.applicationStatus,
            {
              color:
                item.status === "Interview Scheduled"
                  ? "#10B981"
                  : item.status === "Offer Received"
                  ? "#3B82F6"
                  : item.status === "Rejected"
                  ? "#EF4444"
                  : isDark
                  ? "#D1D5DB"
                  : "#4B5563",
            },
          ]}
        >
          {item.status}
        </Text>
      </View>
      <Text
        style={[
          styles.applicationCompany,
          { color: isDark ? "#D1D5DB" : "#4B5563" },
        ]}
      >
        {item.company}
      </Text>
      <Text
        style={[
          styles.applicationDate,
          { color: isDark ? "#9CA3AF" : "#6B7280" },
        ]}
      >
        Applied on {item.date}
      </Text>
    </View>
  );

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
          style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}
        >
          Profile 👤
        </Text>
        <TouchableOpacity
          onPress={handleLogout}
          accessible={true}
          accessibilityLabel="Log out"
        >
          <Feather name="log-out" size={24} color={isDark ? "#FFFFFF" : "#111827"} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Empty State */}
        {!(name || email) ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={isDark ? ["#4B5563", "#6B7280"] : ["#E5E7EB", "#D1D5DB"]}
              style={styles.iconBackground}
            >
              <Feather name="user" size={48} color={isDark ? "#FFFFFF" : "#111827"} />
            </LinearGradient>
            <Text
              style={[
                styles.emptyStateText,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Set Up Your Profile
            </Text>
            <Text
              style={[
                styles.emptyStateSubText,
                { color: isDark ? "#D1D5DB" : "#4B5563" },
              ]}
            >
              Add your personal info to get started.
            </Text>
          </View>
        ) : (
          <>
            {/* Profile Overview */}
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.8)" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Profile Overview
              </Text>
              <View style={styles.profilePictureContainer}>
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.profilePicture}
                  />
                ) : (
                  <View style={styles.profilePicturePlaceholder}>
                    <Feather name="user" size={40} color="#4B5563" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editPictureButton}
                  onPress={() => {
                    console.log("Opening image picker...");
                    // Implement image picker logic (e.g., expo-image-picker)
                  }}
                  accessible={true}
                  accessibilityLabel="Edit profile picture"
                >
                  <Feather name="camera" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
                placeholder="Full Name"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={name}
                onChangeText={setName}
                accessible={true}
                accessibilityLabel="Full name"
              />
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
                placeholder="Email"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={false}
                accessible={true}
                accessibilityLabel="Email address"
              />
            </View>

            {/* Job Preferences */}
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.8)" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Job Preferences
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
                placeholder="Desired Role"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={desiredRole}
                onChangeText={setDesiredRole}
                accessible={true}
                accessibilityLabel="Desired role"
              />
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
                placeholder="Preferred Location"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={location}
                onChangeText={setLocation}
                accessible={true}
                accessibilityLabel="Preferred location"
              />
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
                placeholder="Salary Expectation"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={salaryExpectation}
                onChangeText={setSalaryExpectation}
                keyboardType="numeric"
                accessible={true}
                accessibilityLabel="Salary expectation"
              />
            </View>

            {/* Application History */}
            <View style={styles.applicationSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Application History
              </Text>
              {applications.length === 0 ? (
                <Text
                  style={[
                    styles.noApplicationsText,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  No applications yet. Start applying to jobs!
                </Text>
              ) : (
                <FlatList
                  data={applications}
                  renderItem={renderApplication}
                  keyExtractor={(item) => item.id}
                  style={styles.applicationList}
                  scrollEnabled={false}
                />
              )}
            </View>

            {/* Settings */}
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.8)" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Settings
              </Text>
              <View style={styles.settingRow}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  Dark Mode
                </Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: "#E5E7EB", true: "#4B5563" }}
                  thumbColor={isDark ? "#FFFFFF" : "#F9FAFB"}
                  accessible={true}
                  accessibilityLabel="Toggle dark mode"
                />
              </View>
              <View style={styles.settingRow}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  Notifications
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: "#E5E7EB", true: "#4B5563" }}
                  thumbColor={isDark ? "#FFFFFF" : "#F9FAFB"}
                  accessible={true}
                  accessibilityLabel="Toggle notifications"
                />
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
                accessible={true}
                accessibilityLabel="Delete account"
              >
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  iconBackground: {
    borderRadius: 100,
    padding: 20,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyStateSubText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePicturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(75, 85, 99, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  editPictureButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4B5563",
    borderRadius: 12,
    padding: 4,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  applicationSection: {
    marginVertical: 16,
  },
  applicationList: {
    marginTop: 8,
  },
  applicationCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  applicationStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  applicationCompany: {
    fontSize: 14,
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
  },
  noApplicationsText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
  },
  deleteButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#EF4444",
  },
});
