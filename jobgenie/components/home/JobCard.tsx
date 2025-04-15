import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface JobCardProps {
  job: any;
  isDark: boolean;
}

export default function JobCard({ job, isDark }: JobCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/job-details",
      params: { 
        jobId: job.job_id || job.id || job.external_job_id || String(Math.random()),
        source: "job-card" // Adding a source parameter helps with debugging
      },
    });
  };

  const formatSalary = () => {
    // Check for pre-formatted salary_range (for saved jobs)
    if (job.salary_range && job.salary_range !== "Not specified") {
      const salaryMatch = job.salary_range.match(/\$(\d{1,3}(?:,\d{3})*)\s?(?:-\s?\$(\d{1,3}(?:,\d{3})*))?/);
      if (salaryMatch) {
        const minSalary = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
        if (salaryMatch[2]) {
          const maxSalary = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
          return `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
        }
        return `$${minSalary.toLocaleString()}`;
      }
      return job.salary_range; // Fallback if the format doesn't match
    }
  
    // Check for job_min_salary and job_max_salary (for recommended jobs)
    if (job.job_min_salary && job.job_max_salary) {
      return `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`;
    }
  
    // Try to extract salary from job_description
    if (job.job_description) {
      // Check for a salary range (e.g., "$140,000 - $200,000")
      const rangeRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?-\s?(?:\$|USD)?\s?(\d{1,3}(?:,\d{3})*)/i;
      const rangeMatch = job.job_description.match(rangeRegex);
      if (rangeMatch) {
        const minSalary = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
        const maxSalary = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
        return `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
      }
  
      // Check for a single salary (e.g., "Salary 140,000 annually")
      const singleRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?(?!\s?-\s?(?:\$|USD)?\s?\d{1,3}(?:,\d{3})*)/i;
      const singleMatch = job.job_description.match(singleRegex);
      if (singleMatch) {
        const salary = parseInt(singleMatch[1].replace(/,/g, ''), 10);
        return `$${salary.toLocaleString()}`;
      }
    }
  
    // Fallback
    return "Salary not specified";
  };

  const matchPercentage = job.match_percentage || 85;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(31, 41, 55, 0.6)"
            : "rgba(255, 255, 255, 0.8)",
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.companyLogoContainer}>
          {job.employer_logo ? (
            <Image
              source={{ uri: job.employer_logo }}
              style={styles.companyLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.placeholderLogo, { backgroundColor: "#6366F1" }]}>
              <Text style={styles.placeholderText}>
                {job.employer_name?.charAt(0) || "J"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerContent}>
          <Text
            style={[
              styles.jobTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
            numberOfLines={1}
          >
            {job.job_title}
          </Text>
          <Text
            style={[
              styles.companyName,
              { color: isDark ? "#D1D5DB" : "#4B5563" },
            ]}
            numberOfLines={1}
          >
            {job.employer_name}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Feather name="map-pin" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
          <Text
            style={[
              styles.detailText,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {job.job_city || job.job_country || "Remote"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Feather name="dollar-sign" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
          <Text
            style={[
              styles.detailText,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {formatSalary()}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.description,
          { color: isDark ? "#D1D5DB" : "#4B5563" },
        ]}
        numberOfLines={2}
      >
        {job.job_description?.substring(0, 120)}...
      </Text>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={handlePress}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Feather name="chevron-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        <View
          style={[
            styles.matchButton,
            { backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)" },
          ]}
        >
          <Text style={styles.matchButtonText}>{matchPercentage}% Match</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    marginBottom: 12,
  },
  companyLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  companyLogo: {
    width: 40,
    height: 40,
  },
  placeholderLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
  },
  details: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 13,
    marginRight: 4,
  },
  matchButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  matchButtonText: {
    color: "#6366F1",
    fontWeight: "500",
    fontSize: 13,
  },
});
