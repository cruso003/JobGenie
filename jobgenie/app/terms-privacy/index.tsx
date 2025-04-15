// app/terms-privacy.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { cn } from "@/utils/cn";

export default function TermsPrivacyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-1">
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        className="absolute inset-0"
      />

      {/* Header */}
      <View className="flex-row items-center px-6 pt-14 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className={cn(
            "w-10 h-10 rounded-full items-center justify-center mr-4",
            isDark ? "bg-white/10" : "bg-black/5"
          )}
        >
          <Feather
            name="chevron-left"
            size={24}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
        </TouchableOpacity>
        <Text
          className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Terms & Privacy
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pb-8">
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
            Terms of Service
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            By using JobGenie, you agree to these terms of service. JobGenie is provided "as is" without warranties of any kind.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            1. Users must be at least 18 years old to use JobGenie.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            2. Users are responsible for maintaining the confidentiality of their account information.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            3. JobGenie reserves the right to modify or terminate the service at any time.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            4. Job listings and career guidance are provided through third-party services and AI technology. We do not guarantee the accuracy of job listings or career advice.
          </Text>
        </View>

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
            Privacy Policy
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            JobGenie values your privacy. This policy explains how we collect, use, and protect your data.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            1. Information Collection: We collect information you provide during registration, profile creation, and app usage.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            2. Data Usage: Your information is used to personalize job recommendations, provide career guidance, and improve our services.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            3. Data Protection: We implement security measures to protect your personal information from unauthorized access.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            4. Third-party Services: JobGenie uses third-party APIs for job listings and content. These services have their own privacy policies.
          </Text>
          
          <Text className={cn("mb-4", isDark ? "text-white/80" : "text-gray-600")}>
            5. User Rights: You can access, update, or delete your account information at any time through the app.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
