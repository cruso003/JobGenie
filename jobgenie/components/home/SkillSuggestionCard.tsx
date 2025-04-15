// components/home/SkillSuggestionCard.tsx
import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface SkillSuggestionProps {
  skill: {
    skill: string;
    reason: string;
    resource?: string;
  };
  isDark: boolean;
  height?: number; // Optional prop to set a fixed height
}

export default function SkillSuggestionCard({ 
  skill, 
  isDark,
  height = 350 // Default height if not specified
}: SkillSuggestionProps) {
  const router = useRouter();
  
  const handleLearnMore = () => {
    router.push({
      pathname: "/skills",
      params: { 
        skillName: skill.skill
      },
    });
    
  };
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(31, 41, 55, 0.6)"
            : "rgba(255, 255, 255, 0.8)",
          height: height,
        },
      ]}
    >
      <View style={styles.header}>
        <Feather name="book-open" size={20} color="#6366F1" />
        <Text
          style={[
            styles.title,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
          numberOfLines={1}
        >
          {skill.skill}
        </Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.description,
            { color: isDark ? "#D1D5DB" : "#4B5563" },
          ]}
          numberOfLines={12}
          ellipsizeMode="tail"
        >
          {skill.reason}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.learnButton}
          onPress={handleLearnMore}  
        >
          <Text style={styles.learnButtonText}>View Learning Path</Text>
          <Feather name="external-link" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: 280,
    flexDirection: "column", // Ensure column layout
    justifyContent: "space-between", // Distribute space
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  contentContainer: {
    flex: 1, // Take available space
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
  learnButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  learnButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
    marginRight: 6,
  }
});
