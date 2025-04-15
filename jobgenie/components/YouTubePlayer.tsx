import React, { useState } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { WebView } from "react-native-webview";
import { cn } from "@/utils/cn";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface YouTubePlayerProps {
  videoId: string;
  height?: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, height }) => {
  const [error, setError] = useState(false);
  const playerHeight = height || SCREEN_WIDTH * (9 / 16); // 16:9 aspect ratio

  return (
    <View style={[styles.container, { height: playerHeight }]}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text
            className={cn(
              "text-center text-base",
              "text-white" // Always white for contrast on black
            )}
          >
            Failed to load video
          </Text>
        </View>
      ) : (
        <WebView
          source={{
            uri: `https://www.youtube.com/embed/${videoId}?playsinline=1&autoplay=0`,
          }}
          style={styles.webView}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onError={() => setError(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  webView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});

export default YouTubePlayer;
