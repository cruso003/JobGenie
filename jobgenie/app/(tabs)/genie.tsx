import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";

interface Message {
  id: string;
  text: string;
  sender: "user" | "genie";
  timestamp: string;
  isVoice?: boolean; // Flag to indicate if the message was sent via voice
}

export default function GenieScreen() {
  const router = useRouter();
  const { prompt } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // State for chat messages, input, and typing indicator
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Placeholder quick actions
  const quickActions = [
    "Prepare for an interview",
    "Write a cover letter",
    "Give me career advice",
    "What skills should I learn?",
  ];

  // Handle initial prompt from navigation params
  useEffect(() => {
    if (prompt && typeof prompt === "string") {
      handleSendMessage(prompt);
    }
  }, [prompt]);

  // Function to send a text message
  const handleSendMessage = (text: string, isVoice: boolean = false) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isVoice,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate Genie response
    setIsTyping(true);
    setTimeout(() => {
      const genieResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I'm here to help! You asked: "${text}". Here's a placeholder response. (We'll implement the AI response later.)`,
        sender: "genie",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, genieResponse]);
      setIsTyping(false);

      // Scroll to the latest message
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 1500);

    // Clear input
    setInputText("");
  };

  // Function to handle voice input (placeholder)
  const handleVoiceInput = () => {
    // Placeholder for voice input
    const voiceText = "This is a voice message (placeholder)";
    handleSendMessage(voiceText, true);
  };

  // Function to clear chat
  const handleClearChat = () => {
    setMessages([]);
  };

  // Render a single chat message
  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.genieMessage,
      ]}
    >
      {item.sender === "genie" && (
        <View style={styles.avatarContainer}>
          <Feather name="user" size={20} color="#6366F1" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.sender === "user"
            ? styles.userBubble
            : styles.genieBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: item.sender === "user" ? "#FFFFFF" : isDark ? "#D1D5DB" : "#4B5563",
            },
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.messageTimestamp,
            {
              color: item.sender === "user" ? "rgba(255,255,255,0.7)" : isDark ? "#9CA3AF" : "#6B7280",
            },
          ]}
        >
          {item.timestamp}
          {item.isVoice && " (Voice)"}
        </Text>
      </View>
    </View>
  );

  // Render typing indicator
  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.avatarContainer}>
        <Feather name="user" size={20} color="#6366F1" />
      </View>
      <View style={[styles.messageBubble, styles.genieBubble]}>
        <Text
          style={[
            styles.messageText,
            { color: isDark ? "#D1D5DB" : "#4B5563" },
          ]}
        >
          Typing...
        </Text>
      </View>
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
          Career Genie 🧞‍♂️
        </Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClearChat}>
            <Feather
              name="trash-2"
              size={24}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {/* Chat Area */}
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <LottieView
              source={require("@/assets/animations/genie-animation.json")}
              style={styles.genieAnimation}
              autoPlay
              loop
            />
            <Text
              style={[
                styles.emptyStateText,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Hello, I'm your Career Genie!
            </Text>
            <Text
              style={[
                styles.emptyStateSubText,
                { color: isDark ? "#D1D5DB" : "#4B5563" },
              ]}
            >
              Ask me anything—I'm here to help with interview prep, career advice, and more.
            </Text>

            {/* Quick Actions */}
            <FlatList
              data={quickActions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.15)"
                        : "rgba(99, 102, 241, 0.1)",
                    },
                  ]}
                  onPress={() => handleSendMessage(item)}
                >
                  <Text style={styles.quickActionText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickActions}
              contentContainerStyle={styles.quickActionsContent}
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isTyping ? renderTypingIndicator : null}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark
                  ? "rgba(31, 41, 55, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
                color: isDark ? "#FFFFFF" : "#111827",
              },
            ]}
            placeholder="Type your question..."
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={handleVoiceInput}
          >
            <Feather name="mic" size={20} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleSendMessage(inputText)}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  genieAnimation: {
    width: 120,
    height: 120,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  quickActions: {
    marginVertical: 16,
  },
  quickActionsContent: {
    paddingHorizontal: 8,
  },
  quickActionButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366F1",
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  chatListContent: {
    paddingVertical: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 8,
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  genieMessage: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#6366F1",
  },
  genieBubble: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTimestamp: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  voiceButton: {
    borderRadius: 8,
    padding: 12,
    marginLeft: 12,
  },
  sendButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    padding: 12,
    marginLeft: 12,
  },
});
