import React from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import YouTubePlayer from "@/components/YouTubePlayer";
import { useColorScheme } from "@/hooks/useColorScheme";
import { cn } from "@/utils/cn";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!videoId || typeof videoId !== "string") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
        ]}
      >
        <Text className={cn(
            "text-center text-lg",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          No video selected
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
      ]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className={cn(
            "w-10 h-10 rounded-full items-center justify-center",
            isDark ? "bg-white/10" : "bg-black/5"
          )}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather
            name="chevron-left"
            size={24}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
        </TouchableOpacity>
        <View className="w-10" />
      </View>

      {/* Video Player */}
      <View style={styles.playerContainer}>
        <YouTubePlayer videoId={videoId} height={SCREEN_HEIGHT * 0.4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
