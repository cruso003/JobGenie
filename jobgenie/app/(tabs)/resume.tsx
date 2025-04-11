import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Clipboard,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";

interface ResumeSection {
  id: string;
  type: "work" | "education" | "skills" | "projects";
  title: string;
  details: string;
}

export default function ResumeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // State for resume data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [summary, setSummary] = useState("");
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [addSectionModalVisible, setAddSectionModalVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [emailError, setEmailError] = useState("");

  // Character limits
  const SUMMARY_MAX_LENGTH = 500;
  const DETAILS_MAX_LENGTH = 1000;

  // Animation for buttons
  const buttonScale = new Animated.Value(1);

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Validate email
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value) && value.length > 0) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
    setEmail(value);
  };

  // AI Optimization
  const handleOptimizeWithAI = () => {
    console.log("Optimizing resume with AI...");
    setAiSuggestions([
      "Use action verbs like 'led,' 'developed,' or 'streamlined' in your work experience.",
      "Add quantifiable results, e.g., 'Increased sales by 20%.'",
      "Include relevant keywords for your industry, such as 'project management' or 'data analysis.'",
    ]);
  };

  // Add a new section
  const addSection = (type: ResumeSection["type"]) => {
    const newSection: ResumeSection = {
      id: Date.now().toString(),
      type,
      title: "",
      details: "",
    };
    setSections((prev) => [...prev, newSection]);
    setAddSectionModalVisible(false);
  };

  // Update a section
  const updateSection = (
    id: string,
    field: "title" | "details",
    value: string
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  // Remove a section
  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  // Copy resume to clipboard
  const copyToClipboard = () => {
    let resumeText = `${name || "Your Name"}\n`;
    resumeText += `${email || "email@example.com"} | ${
      phone || "123-456-7890"
    }\n\n`;
    if (summary) {
      resumeText += `Professional Summary\n${summary}\n\n`;
    }
    sections.forEach((section) => {
      resumeText += `${
        section.type.charAt(0).toUpperCase() + section.type.slice(1)
      }\n`;
      resumeText += `${section.title || "Untitled"}\n`;
      resumeText += `${section.details || "No details provided."}\n\n`;
    });
    Clipboard.setString(resumeText);
    alert("Resume copied to clipboard!");
  };

  // Render a section input
  const renderSection = ({
    item,
    drag,
    isActive,
  }: {
    item: ResumeSection;
    drag: () => void;
    isActive: boolean;
  }) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.sectionCard,
          {
            backgroundColor: isDark
              ? "rgba(31, 41, 55, 0.6)"
              : "rgba(255, 255, 255, 0.8)",
            elevation: isActive ? 5 : 0,
            shadowOpacity: isActive ? 0.2 : 0,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
          },
        ]}
        accessible={true}
        accessibilityLabel={`${item.type} section`}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Feather
              name={
                item.type === "work"
                  ? "briefcase"
                  : item.type === "education"
                  ? "book"
                  : item.type === "skills"
                  ? "star"
                  : "code"
              }
              size={20}
              color={isDark ? "#D1D5DB" : "#4B5563"}
              style={styles.sectionIcon}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => removeSection(item.id)}
            accessible={true}
            accessibilityLabel={`Delete ${item.type} section`}
          >
            <Feather name="trash-2" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[
            styles.sectionInput,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
          placeholder={
            item.type === "work"
              ? "Job Title, Company"
              : item.type === "education"
              ? "Degree, School"
              : "Title"
          }
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          value={item.title}
          onChangeText={(text) => updateSection(item.id, "title", text)}
          accessible={true}
          accessibilityLabel={`${item.type} title`}
        />
        <View>
          <TextInput
            style={[
              styles.sectionInput,
              { color: isDark ? "#FFFFFF" : "#111827", height: 80 },
            ]}
            placeholder="Details"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={item.details}
            onChangeText={(text) =>
              text.length <= DETAILS_MAX_LENGTH &&
              updateSection(item.id, "details", text)
            }
            multiline
            accessible={true}
            accessibilityLabel={`${item.type} details`}
          />
          <Text
            style={[
              styles.charCount,
              {
                color:
                  item.details.length > DETAILS_MAX_LENGTH
                    ? "#EF4444"
                    : isDark
                    ? "#9CA3AF"
                    : "#6B7280",
              },
            ]}
          >
            {item.details.length}/{DETAILS_MAX_LENGTH}
          </Text>
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  // Render Add Section Modal
  const renderAddSectionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={addSectionModalVisible}
      onRequestClose={() => setAddSectionModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Add a New Section
          </Text>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => addSection("work")}
            accessible={true}
            accessibilityLabel="Add work experience section"
          >
            <Text style={styles.modalOptionText}>Work Experience</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => addSection("education")}
            accessible={true}
            accessibilityLabel="Add education section"
          >
            <Text style={styles.modalOptionText}>Education</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => addSection("skills")}
            accessible={true}
            accessibilityLabel="Add skills section"
          >
            <Text style={styles.modalOptionText}>Skills</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => addSection("projects")}
            accessible={true}
            accessibilityLabel="Add projects section"
          >
            <Text style={styles.modalOptionText}>Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setAddSectionModalVisible(false)}
            accessible={true}
            accessibilityLabel="Cancel adding section"
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render AI Suggestions
  const renderAiSuggestions = () => (
    <View
      style={[
        styles.aiSuggestionsCard,
        {
          backgroundColor: isDark
            ? "rgba(75, 85, 99, 0.2)"
            : "rgba(0, 0, 0, 0.05)",
        },
      ]}
    >
      <Text
        style={[
          styles.aiSuggestionsTitle,
          { color: isDark ? "#FFFFFF" : "#111827" },
        ]}
      >
        AI Suggestions
      </Text>
      {aiSuggestions.length > 0 ? (
        aiSuggestions.map((suggestion, index) => (
          <Text
            key={index}
            style={[
              styles.aiSuggestionText,
              { color: isDark ? "#D1D5DB" : "#4B5563" },
            ]}
          >
            • {suggestion}
          </Text>
        ))
      ) : (
        <Text
          style={[
            styles.aiSuggestionText,
            { color: isDark ? "#D1D5DB" : "#4B5563" },
          ]}
        >
          Click "Optimize with AI" to get suggestions.
        </Text>
      )}
    </View>
  );

  // Render the resume preview
  const renderPreview = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={previewVisible}
      onRequestClose={() => setPreviewVisible(false)}
    >
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
              Resume Preview
            </Text>
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              accessible={true}
              accessibilityLabel="Close preview"
            >
              <Feather
                name="x"
                size={24}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.previewHeader}>
              <Text
                style={[
                  styles.previewName,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                {name || "Your Name"}
              </Text>
              <View style={styles.previewContactContainer}>
                <Text
                  style={[
                    styles.previewContact,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  {email || "email@example.com"}
                </Text>
                <Text
                  style={[
                    styles.previewContact,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  {phone || "123-456-7890"}
                </Text>
              </View>
            </View>
            {summary ? (
              <View style={styles.previewSection}>
                <Text
                  style={[
                    styles.previewSectionTitle,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  Professional Summary
                </Text>
                <Text
                  style={[
                    styles.previewText,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  {summary}
                </Text>
              </View>
            ) : null}
            {sections.map((section) => (
              <View key={section.id} style={styles.previewSection}>
                <Text
                  style={[
                    styles.previewSectionTitle,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                </Text>
                <Text
                  style={[
                    styles.previewTitle,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  {section.title || "Untitled"}
                </Text>
                <Text
                  style={[
                    styles.previewText,
                    { color: isDark ? "#D1D5DB" : "#4B5563" },
                  ]}
                >
                  {section.details || "No details provided."}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyToClipboard}
              accessible={true}
              accessibilityLabel="Copy resume to clipboard"
            >
              <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => {
                console.log("Downloading resume as PDF...");
              }}
              accessible={true}
              accessibilityLabel="Download resume as PDF"
            >
              <Text style={styles.downloadButtonText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
          style={[
            styles.headerTitle,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          Resume Builder 📄
        </Text>
        {(name || email || phone || summary || sections.length > 0) && (
          <TouchableOpacity
            onPress={() => setPreviewVisible(true)}
            accessible={true}
            accessibilityLabel="Preview resume"
          >
            <Feather
              name="eye"
              size={24}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        {!(name || email || phone || summary || sections.length > 0) ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={isDark ? ["#4B5563", "#6B7280"] : ["#E5E7EB", "#D1D5DB"]}
              style={styles.iconBackground}
            >
              <Feather
                name="file-text"
                size={48}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </LinearGradient>
            <Text
              style={[
                styles.emptyStateText,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Build Your Resume
            </Text>
            <Text
              style={[
                styles.emptyStateSubText,
                { color: isDark ? "#D1D5DB" : "#4B5563" },
              ]}
            >
              Start by adding your personal info, work experience, and more.
            </Text>
          </View>
        ) : (
          <>
            {/* Personal Info */}
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
                Personal Info
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                  !name && styles.inputError,
                ]}
                placeholder="Full Name *"
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
                  emailError ? styles.inputError : null,
                ]}
                placeholder="Email *"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={email}
                onChangeText={validateEmail}
                keyboardType="email-address"
                accessible={true}
                accessibilityLabel="Email address"
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
                placeholder="Phone Number"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                accessible={true}
                accessibilityLabel="Phone number"
              />
              <View>
                <TextInput
                  style={[
                    styles.input,
                    { color: isDark ? "#FFFFFF" : "#111827", height: 80 },
                  ]}
                  placeholder="Professional Summary"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={summary}
                  onChangeText={(text) =>
                    text.length <= SUMMARY_MAX_LENGTH && setSummary(text)
                  }
                  multiline
                  accessible={true}
                  accessibilityLabel="Professional summary"
                />
                <Text
                  style={[
                    styles.charCount,
                    {
                      color:
                        summary.length > SUMMARY_MAX_LENGTH
                          ? "#EF4444"
                          : isDark
                          ? "#9CA3AF"
                          : "#6B7280",
                    },
                  ]}
                >
                  {summary.length}/{SUMMARY_MAX_LENGTH}
                </Text>
              </View>
            </View>

            <DraggableFlatList<ResumeSection>
              data={sections}
              renderItem={renderSection}
              keyExtractor={(item: ResumeSection) => item.id}
              onDragEnd={({ data }: { data: ResumeSection[] }) =>
                setSections(data)
              }
              style={styles.sectionsList}
              scrollEnabled={false}
            />

            {/* Add Section Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={() => setAddSectionModalVisible(true)}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                accessible={true}
                accessibilityLabel="Add a new section"
              >
                <Feather name="plus" size={20} color="#4B5563" />
                <Text style={styles.addSectionButtonText}>Add Section</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* AI Suggestions */}
            {renderAiSuggestions()}

            {/* AI Optimization and Save */}
            <View style={styles.actionsContainer}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.optimizeButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(75, 85, 99, 0.2)"
                        : "rgba(0, 0, 0, 0.05)",
                    },
                  ]}
                  onPress={handleOptimizeWithAI}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  accessible={true}
                  accessibilityLabel="Optimize resume with AI"
                >
                  <Text style={styles.optimizeButtonText}>
                    Optimize with AI
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    console.log("Saving resume...");
                  }}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  accessible={true}
                  accessibilityLabel="Save resume"
                >
                  <Text style={styles.saveButtonText}>Save Resume</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modals */}
      {renderAddSectionModal()}
      {renderPreview()}
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
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginBottom: 12,
  },
  sectionsList: {
    marginVertical: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addSectionButton: {
    flexDirection: "row",
    backgroundColor: "rgba(75, 85, 99, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addSectionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4B5563",
    marginLeft: 8,
  },
  aiSuggestionsCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  aiSuggestionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  aiSuggestionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  optimizeButton: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  optimizeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4B5563",
  },
  saveButton: {
    backgroundColor: "#4B5563",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#4B5563",
  },
  modalCloseButton: {
    padding: 16,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: "#EF4444",
  },
  modalFooter: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  copyButton: {
    backgroundColor: "rgba(75, 85, 99, 0.2)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: "center",
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4B5563",
  },
  downloadButton: {
    backgroundColor: "#4B5563",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: "center",
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  previewHeader: {
    borderBottomWidth: 2,
    borderBottomColor: "#4B5563",
    paddingBottom: 12,
    marginBottom: 16,
  },
  previewName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  previewContactContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  previewContact: {
    fontSize: 14,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
