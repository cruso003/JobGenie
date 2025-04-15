// components/home/ProfileSummaryCard.tsx - revised
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface ProfileSummaryProps {
  jobCount: number;
  skillCount: number;
  profileCompleteness: number;
  isDark: boolean;
}

export default function ProfileSummaryCard({
  jobCount,
  skillCount,
  profileCompleteness,
  isDark
}: ProfileSummaryProps) {
  const router = useRouter();
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(31, 41, 55, 0.6)"
            : "rgba(255, 255, 255, 0.8)",
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          Your Career Summary
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Feather name="edit" size={18} color="#6366F1" />
        </TouchableOpacity>
      </View>
      
      {/* Redesigned stats container to prevent overflow */}
      <View style={styles.statsGridContainer}>
        <View style={styles.statGridItem}>
          <View style={styles.statIconContainer}>
            <Feather name="briefcase" size={16} color="#6366F1" />
          </View>
          <Text style={[styles.statValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
            {jobCount}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? "#D1D5DB" : "#6B7280" }]}>
            Jobs
          </Text>
        </View>
        
        <View style={styles.statGridItem}>
          <View style={styles.statIconContainer}>
            <Feather name="layers" size={16} color="#6366F1" />
          </View>
          <Text style={[styles.statValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
            {skillCount}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? "#D1D5DB" : "#6B7280" }]}>
            Skills
          </Text>
        </View>
        
        <View style={styles.statGridItem}>
          <View style={styles.statIconContainer}>
            <Feather name="check-circle" size={16} color="#6366F1" />
          </View>
          <Text style={[styles.statValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
            {profileCompleteness}%
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? "#D1D5DB" : "#6B7280" }]}>
            Profile
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => router.push("/saved-jobs")}
      >
        <Text style={styles.viewAllButtonText}>View All Job Matches</Text>
        <Feather name="arrow-right" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  // New grid layout that ensures equal spacing
  statsGridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statGridItem: {
    alignItems: 'center',
    width: '30%', // Ensure equal width with spacing between
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  viewAllButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
});
