import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ExploreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");

  // Placeholder data for categories
  const categories = [
    "Design",
    "Tech",
    "Marketing",
    "Writing",
    "Sales",
    "Engineering",
    "Product",
    "Data",
  ];

  // Placeholder data for AI Skill Matcher
  const skillSuggestions = [
    { skill: "React Native", reason: "High demand in mobile app development" },
    { skill: "Figma", reason: "Essential for UI/UX design roles" },
    { skill: "Python", reason: "Useful for data analysis and automation" },
  ];

  // Placeholder data for Recommended Learning Paths
  const learningPaths = [
    {
      title: "Master React Native",
      type: "Course",
      description: "Learn to build mobile apps with React Native",
    },
    {
      title: "UI/UX Design Basics",
      type: "Article",
      description: "Understand the fundamentals of UI/UX design",
    },
    {
      title: "Python for Beginners",
      type: "Task",
      description: "Complete a beginner-friendly Python project",
    },
  ];

  // Placeholder data for Trending Jobs
  const trendingJobs = [
    { title: "Frontend Developer", count: 120 },
    { title: "UI/UX Designer", count: 85 },
    { title: "Data Analyst", count: 60 },
  ];

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
          Explore Opportunities
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
              placeholder="Search jobs..."
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.filters}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
              onPress={() => {
                // Placeholder for location filter modal
                console.log("Open location filter");
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                {location || "Location"}
              </Text>
              <Feather
                name="map-pin"
                size={16}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
              onPress={() => {
                // Placeholder for job type filter modal
                console.log("Open job type filter");
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                {jobType || "Job Type"}
              </Text>
              <Feather
                name="briefcase"
                size={16}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Browse by Category 🏷️
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isDark
                      ? "rgba(99, 102, 241, 0.15)"
                      : "rgba(99, 102, 241, 0.1)",
                  },
                ]}
                onPress={() => {
                  // Placeholder for category search
                  console.log(`Search jobs in ${item}`);
                }}
              >
                <Text style={styles.categoryText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.categoryList}
          />
        </View>

        {/* AI Skill Matcher */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            AI Skill Matcher 🧠
          </Text>
          {skillSuggestions.length > 0 ? (
            skillSuggestions.map((skill, index) => (
              <View
                key={index}
                style={[
                  styles.skillCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(31, 41, 55, 0.6)"
                      : "rgba(255, 255, 255, 0.8)",
                  },
                ]}
              >
                <View style={styles.skillHeader}>
                  <Feather name="book-open" size={20} color="#6366F1" />
                  <Text
                    style={[
                      styles.skillTitle,
                      { color: isDark ? "#FFFFFF" : "#111827" },
                    ]}
                  >
                    {skill.skill}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.skillDescription,
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
                No skill suggestions yet
              </Text>
            </View>
          )}
        </View>

        {/* Recommended Learning Paths */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Recommended Learning Paths 📺
          </Text>
          {learningPaths.length > 0 ? (
            learningPaths.map((path, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.learningCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(31, 41, 55, 0.6)"
                      : "rgba(255, 255, 255, 0.8)",
                  },
                ]}
                onPress={() => {
                  // Placeholder for navigating to learning path
                  console.log(`Open ${path.title}`);
                }}
              >
                <View style={styles.learningHeader}>
                  <Text
                    style={[
                      styles.learningType,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {path.type}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.learningTitle,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  {path.title}
                </Text>
                <Text
                  style={[
                    styles.learningDescription,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                  numberOfLines={2}
                >
                  {path.description}
                </Text>
              </TouchableOpacity>
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
                No learning paths available
              </Text>
            </View>
          )}
        </View>

        {/* Trending Jobs */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Trending Jobs 📈
          </Text>
          {trendingJobs.length > 0 ? (
            trendingJobs.map((job, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.trendingCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(31, 41, 55, 0.6)"
                      : "rgba(255, 255, 255, 0.8)",
                  },
                ]}
                onPress={() => {
                  // Placeholder for searching trending job
                  console.log(`Search for ${job.title}`);
                }}
              >
                <Text
                  style={[
                    styles.trendingTitle,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  {job.title}
                </Text>
                <Text
                  style={[
                    styles.trendingCount,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {job.count} openings
                </Text>
              </TouchableOpacity>
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
              <Feather name="trending-up" size={40} color="#9CA3AF" />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                No trending jobs available
              </Text>
            </View>
          )}
        </View>

        {/* Tools */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Tools 🛠️
          </Text>
          <View style={styles.toolsContainer}>
            <TouchableOpacity
              style={[
                styles.toolCard,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(99, 102, 241, 0.1)",
                },
              ]}
              onPress={() => router.push("/(tabs)/resume")}
            >
              <Feather name="file-text" size={24} color="#6366F1" />
              <Text style={styles.toolText}>Resume Builder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toolCard,
                {
                  backgroundColor: isDark
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(99, 102, 241, 0.1)",
                },
              ]}
              onPress={() => {
                // Placeholder for portfolio builder
                console.log("Portfolio Builder coming soon");
              }}
            >
              <Feather name="briefcase" size={24} color="#6366F1" />
              <Text style={styles.toolText}>Portfolio Builder</Text>
              <Text
                style={[
                  styles.comingSoon,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Coming Soon
              </Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchContainer: {
    marginVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  categoryList: {
    paddingVertical: 8,
  },
  categoryChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366F1",
  },
  skillCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  skillTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  skillDescription: {
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
  learningCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  learningHeader: {
    marginBottom: 8,
  },
  learningType: {
    fontSize: 12,
    fontWeight: "500",
  },
  learningTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  learningDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  trendingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  trendingCount: {
    fontSize: 14,
  },
  toolsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  toolCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    marginHorizontal: 4,
  },
  toolText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#6366F1",
    textAlign: "center",
  },
  comingSoon: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
});
