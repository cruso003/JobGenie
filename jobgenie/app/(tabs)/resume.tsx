import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { WebView } from "react-native-webview";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProfileStore } from "@/stores/profile";
import { useDocumentsStore } from "@/stores/documents";
import {
  generateHtmlDocument,
  updateHtmlDocument,
  generateText,
} from "@/utils/gemini";

// Types for the component state
type Template = "modern" | "classic" | "minimal";
type ChatRole = "user" | "assistant";

// Define interface for chat message
interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: Date;
  html?: string; // Optional HTML content for assistant responses
}

// Import Document type from store to ensure compatibility
import { Document } from "@/stores/documents";

const { width, height } = Dimensions.get("window");

export default function ConversationalResumeBuilder() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { jobId, jobTitle, company, action } = params;
  const webViewRef = useRef<WebView>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { profile, fetchProfile } = useProfileStore();
  const { documents, fetchDocuments, createDocument } = useDocumentsStore();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingCoverLetter, setIsCreatingCoverLetter] = useState<boolean>(
    action === "cover-letter"
  );
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [showDocumentList, setShowDocumentList] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>("modern");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [currentHtml, setCurrentHtml] = useState<string>("");

  const scrollViewRef = useRef<ScrollView>(null);

  // Load user profile and documents
  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, []);

  // Set initial prompt when profile loads
  useEffect(() => {
    if (profile) {
      const docType = isCreatingCoverLetter ? "cover letter" : "resume";

      let prompt = `Create a professional ${docType} for me based on my profile:\n\n`;

      if (jobTitle && company) {
        prompt += `Target position: ${jobTitle} at ${company}\n\n`;
      }

      prompt += `My name: ${profile.full_name || "Not specified"}\n`;
      prompt += `Skills: ${profile.skills?.join(", ") || "Not specified"}\n`;
      prompt += `Experience: ${profile.experience?.level || ""} (${
        profile.experience?.yearsOfExperience || 0
      } years)\n`;

      if (profile.experience?.currentTitle) {
        prompt += `Current title: ${profile.experience.currentTitle}\n`;
      }

      if (profile.interests && profile.interests.length > 0) {
        prompt += `Interests: ${profile.interests.join(", ")}\n`;
      }

      prompt += `\nI'd like a ${selectedTemplate} style design.`;

      setInitialPrompt(prompt);
    }
  }, [profile, jobTitle, company, isCreatingCoverLetter, selectedTemplate]);

  // Filter documents when loaded
  useEffect(() => {
    if (documents && documents.length > 0) {
      const filteredDocs = documents.filter(
        (doc) =>
          doc.document_type ===
          (isCreatingCoverLetter ? "cover_letter" : "resume")
      );
      setExistingDocuments(filteredDocs);
    }
  }, [documents, isCreatingCoverLetter]);

  // Start conversation
  const startConversation = async () => {
    if (!profile) {
      Alert.alert("Profile Required", "Please complete your profile first");
      return;
    }

    setIsLoading(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: initialPrompt,
      timestamp: new Date(),
    };

    setChatMessages([userMessage]);

    try {
      // Generate initial document
      const html = await generateHtmlDocument({
        profile,
        jobTitle: jobTitle?.toString() || "",
        company: company?.toString() || "",
        additionalInfo: "",
        isCreatingCoverLetter,
        template: selectedTemplate,
      });

      setCurrentHtml(html);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: `I've created a ${
          isCreatingCoverLetter ? "cover letter" : "resume"
        } for you based on your profile information. Here's what I came up with:`,
        timestamp: new Date(),
        html: html,
      };

      setChatMessages([userMessage, assistantMessage]);

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error starting conversation:", error);
      Alert.alert(
        "Generation Error",
        "Failed to generate content. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Send follow-up message
  const sendMessage = async () => {
    if (!currentMessage.trim()) {
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Build conversation context
      const conversationHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send request to update the document
      const updatedHtml = await updateHtmlDocument({
        originalHtml: currentHtml,
        userRequest: currentMessage,
        conversationHistory,
      });

      setCurrentHtml(updatedHtml);

      // Generate a description of what was changed
      const changeDescription = await generateText(`
        You just updated an HTML document based on this request: "${currentMessage}"
        Please provide a brief summary (2-3 sentences) of what changes you made to the document.
        Be specific but concise. Start with "I've updated the document..."
      `);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: changeDescription,
        timestamp: new Date(),
        html: updatedHtml,
      };

      setChatMessages([...chatMessages, userMessage, assistantMessage]);

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error updating document:", error);

      // Add error response
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "I'm sorry, I encountered an error trying to update the document. Please try again with different instructions.",
        timestamp: new Date(),
      };

      setChatMessages([...chatMessages, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Preview document in full screen
  const previewDocument = (html: string) => {
    setPreviewHtml(html);
    setShowPreview(true);
  };

  // Export as PDF
  const exportPdf = async () => {
    try {
      setIsLoading(true);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: currentHtml,
        base64: false,
      });

      // Get a good filename
      const filename = `${
        isCreatingCoverLetter ? "cover-letter" : "resume"
      }-${Date.now()}.pdf`;

      // On iOS, the Print.printToFileAsync already provides the right URI
      // On Android, we need to copy the file to a shareable location
      const pdfUri =
        Platform.OS === "ios"
          ? uri
          : `${FileSystem.documentDirectory}${filename}`;

      if (Platform.OS === "android") {
        await FileSystem.copyAsync({
          from: uri,
          to: pdfUri,
        });
      }

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert("Error", "Failed to export PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // Save document to Supabase
  const saveDocument = async () => {
    if (!currentHtml) {
      Alert.alert("Error", "Please generate content first");
      return;
    }

    try {
      setIsLoading(true);

      const documentTitle = isCreatingCoverLetter
        ? `Cover Letter for ${
            jobTitle ? `${jobTitle} at ${company}` : "Position"
          }`
        : `Resume ${jobTitle ? `for ${jobTitle} at ${company}` : ""}`.trim();

      const document = await createDocument({
        title: documentTitle,
        document_type: isCreatingCoverLetter ? "cover_letter" : "resume",
        content: currentHtml,
        target_job_id: (jobId as string) || undefined,
      });

      if (document) {
        Alert.alert(
          "Document Saved",
          `Your ${
            isCreatingCoverLetter ? "cover letter" : "resume"
          } has been saved successfully.`,
          [
            {
              text: "OK",
              onPress: () => {
                if (jobTitle && company) {
                  router.back();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error saving document:", error);
      Alert.alert("Error", "Failed to save document");
    } finally {
      setIsLoading(false);
    }
  };

  // Load an existing document
  const loadDocument = (document: Document) => {
    try {
      setIsLoading(true);

      const docContent = document.content || "";
      setCurrentHtml(docContent);

      // Create initial messages
      const initialUserMessage: ChatMessage = {
        role: "user",
        content: `Load my saved ${
          isCreatingCoverLetter ? "cover letter" : "resume"
        }: "${document.title}"`,
        timestamp: new Date(),
      };

      const initialAssistantMessage: ChatMessage = {
        role: "assistant",
        content: `I've loaded your saved ${
          isCreatingCoverLetter ? "cover letter" : "resume"
        }: "${
          document.title
        }". You can now make additional changes by sending me instructions.`,
        timestamp: new Date(),
        html: docContent,
      };

      setChatMessages([initialUserMessage, initialAssistantMessage]);
      setShowDocumentList(false);
    } catch (error) {
      console.error("Error loading document:", error);
      Alert.alert("Error", "Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  // Render chat message
  const renderChatMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === "user";

    return (
      <View
        key={index}
        style={[
          styles.chatMessage,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.messageRole}>
            {isUser ? "You" : "AI Assistant"}
          </Text>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <Text style={styles.messageContent}>{message.content}</Text>

        {!isUser && message.html && (
          <View style={styles.messageActions}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => previewDocument(message.html || "")}
            >
              <Feather name="eye" size={14} color="#FFFFFF" />
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity
            onPress={() => setShowDocumentList(true)}
            style={styles.iconButton}
            accessibilityLabel="View saved documents"
          >
            <Feather
              name="folder"
              size={22}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsCreatingCoverLetter(!isCreatingCoverLetter)}
            style={styles.switchButton}
            accessibilityLabel={`Switch to ${
              isCreatingCoverLetter ? "Resume" : "Cover Letter"
            } mode`}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 12 }}>
              Switch to {isCreatingCoverLetter ? "Resume" : "Cover Letter"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {chatMessages.length === 0 ? (
        // Initial setup screen
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Template Selection */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark
                  ? "rgba(31, 41, 55, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Choose Template
            </Text>

            <View style={styles.templateOptions}>
              {["modern", "classic", "minimal"].map((template) => (
                <TouchableOpacity
                  key={template}
                  style={[
                    styles.templateOption,
                    selectedTemplate === template &&
                      styles.selectedTemplateOption,
                  ]}
                  onPress={() => setSelectedTemplate(template as Template)}
                >
                  <Text
                    style={[
                      styles.templateText,
                      selectedTemplate === template &&
                        styles.selectedTemplateText,
                    ]}
                  >
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Job Information */}
          {(jobTitle || company) && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark
                    ? "rgba(31, 41, 55, 0.6)"
                    : "rgba(255, 255, 255, 0.8)",
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Target Position
              </Text>
              <Text
                style={[
                  styles.jobInfoText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                <Text style={{ fontWeight: "600" }}>Job Title:</Text>{" "}
                {jobTitle || "Not specified"}
              </Text>
              <Text
                style={[
                  styles.jobInfoText,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                <Text style={{ fontWeight: "600" }}>Company:</Text>{" "}
                {company || "Not specified"}
              </Text>
            </View>
          )}

          {/* Profile Preview */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark
                  ? "rgba(31, 41, 55, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Your Profile
            </Text>

            {profile ? (
              <View>
                <Text
                  style={[
                    styles.profileItem,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  <Text style={{ fontWeight: "600" }}>Name:</Text>{" "}
                  {profile.full_name || "Not specified"}
                </Text>

                <Text
                  style={[
                    styles.profileItem,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  <Text style={{ fontWeight: "600" }}>Skills:</Text>{" "}
                  {profile.skills?.join(", ") || "Not specified"}
                </Text>

                <Text
                  style={[
                    styles.profileItem,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  <Text style={{ fontWeight: "600" }}>Experience:</Text>{" "}
                  {profile.experience?.level || ""} (
                  {profile.experience?.yearsOfExperience || 0} years)
                </Text>

                {profile.experience?.currentTitle && (
                  <Text
                    style={[
                      styles.profileItem,
                      { color: isDark ? "#D1D5DB" : "#4B5563" },
                    ]}
                  >
                    <Text style={{ fontWeight: "600" }}>Current Title:</Text>{" "}
                    {profile.experience.currentTitle}
                  </Text>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <Text
                    style={[
                      styles.profileItem,
                      { color: isDark ? "#D1D5DB" : "#4B5563" },
                    ]}
                  >
                    <Text style={{ fontWeight: "600" }}>Interests:</Text>{" "}
                    {profile.interests.join(", ")}
                  </Text>
                )}
              </View>
            ) : (
              <Text
                style={[
                  styles.profileItem,
                  { color: isDark ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                Loading profile information...
              </Text>
            )}
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={startConversation}
            disabled={isLoading}
          >
            <Text style={styles.startButtonText}>
              Create {isCreatingCoverLetter ? "Cover Letter" : "Resume"} with AI
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // Chat interface
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={true}
          >
            {chatMessages.map((message, index) =>
              renderChatMessage(message, index)
            )}

            {isLoading && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: isDark ? "#FFFFFF" : "#111827" }]}
              placeholder="Ask for changes or improvements..."
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={currentMessage}
              onChangeText={setCurrentMessage}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: !currentMessage.trim() || isLoading ? 0.5 : 1 },
              ]}
              onPress={sendMessage}
              disabled={!currentMessage.trim() || isLoading}
            >
              <Feather name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveDocument}
              disabled={isLoading || !currentHtml}
            >
              <Feather name="save" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={exportPdf}
              disabled={isLoading || !currentHtml}
            >
              <Feather name="download" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.previewFullButton]}
              onPress={() => previewDocument(currentHtml)}
              disabled={isLoading || !currentHtml}
            >
              <Feather name="maximize" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Full Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Document List Modal */}
      {showDocumentList && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Your Documents
              </Text>
              <TouchableOpacity onPress={() => setShowDocumentList(false)}>
                <Feather
                  name="x"
                  size={24}
                  color={isDark ? "#FFFFFF" : "#111827"}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {existingDocuments.length > 0 ? (
                existingDocuments.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.documentItem}
                    onPress={() => loadDocument(doc)}
                  >
                    <Feather
                      name={
                        doc.document_type === "resume" ? "file-text" : "edit-3"
                      }
                      size={20}
                      color="#6366F1"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.documentTitle,
                          { color: isDark ? "#FFFFFF" : "#111827" },
                        ]}
                      >
                        {doc.title}
                      </Text>
                      <Text
                        style={{
                          color: isDark ? "#9CA3AF" : "#6B7280",
                          fontSize: 12,
                        }}
                      >
                        {new Date(doc.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  style={{
                    color: isDark ? "#D1D5DB" : "#4B5563",
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  No saved documents found
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.createNewButton}
              onPress={() => {
                setShowDocumentList(false);
                setChatMessages([]);
                setCurrentHtml("");
              }}
            >
              <Text style={styles.createNewButtonText}>Create New</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Full Preview Modal */}
      {showPreview && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showPreview}
          onRequestClose={() => setShowPreview(false)}
        >
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <TouchableOpacity
                onPress={() => setShowPreview(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.previewTitle}>
                {isCreatingCoverLetter
                  ? "Cover Letter Preview"
                  : "Resume Preview"}
              </Text>
              <TouchableOpacity
                onPress={exportPdf}
                style={styles.exportPdfButton}
              >
                <Feather name="download" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <WebView
              originWhitelist={["*"]}
              source={{ html: previewHtml }}
              style={styles.fullWebView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color="#6366F1"
                  style={styles.webViewLoader}
                />
              )}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
  },
  switchButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  jobInfoText: {
    fontSize: 16,
    marginBottom: 12,
    padding: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 8,
  },
  profileItem: {
    fontSize: 16,
    marginBottom: 12,
    padding: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 8,
  },
  templateOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  templateOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedTemplateOption: {
    backgroundColor: "#6366F1",
  },
  templateText: {
    color: "#6366F1",
    fontWeight: "500",
  },
  selectedTemplateText: {
    color: "#FFFFFF",
  },
  startButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 24,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  // Chat interface styles
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatMessagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  chatMessage: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    maxWidth: "88%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6366F1",
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(31, 41, 55, 0.6)",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  messageRole: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  messageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  messageContent: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
  },
  messageActions: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "center",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewButtonText: {
    color: "#FFFFFF",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(31, 41, 55, 0.4)",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: "#6366F1",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(31, 41, 55, 0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(31, 41, 55, 0.4)",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#10B981",
  },
  exportButton: {
    backgroundColor: "#6366F1",
  },
  previewFullButton: {
    backgroundColor: "#F59E0B",
  },
  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(156, 163, 175, 0.3)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(209, 213, 219, 0.3)",
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  createNewButton: {
    marginTop: 16,
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  createNewButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  // Preview modal
  previewContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#6366F1",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  previewTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  fullWebView: {
    flex: 1,
  },
  webViewLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  exportPdfButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
