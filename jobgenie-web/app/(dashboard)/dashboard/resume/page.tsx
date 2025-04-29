// src/pages/resume-builder.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useProfileStore } from "@/lib/stores/profile";
import { useDocumentsStore } from "@/lib/stores/documents";
import { useSubscriptionStore } from "@/lib/stores/subscription";
import {
  generateHtmlDocument,
  generateText,
  updateHtmlDocument,
} from "@/lib/gemini";
import { useToast } from "@/components/ui/use-toast";

// Component imports
import ResumeHeader from "@/components/resume-builder/ResumeHeader";
import InitialSetupScreen from "@/components/resume-builder/InitialSetupScreen";
import ChatTab from "@/components/resume-builder/ChatTab";
import EditTab from "@/components/resume-builder/EditTab";
import HistoryTab from "@/components/resume-builder/HistoryTab";
import PreviewPanel from "@/components/resume-builder/PreviewPanel";
import FullScreenPreview from "@/components/resume-builder/FullScreenPreview";
import MobileActionBar from "@/components/resume-builder/MobileActionBar";
import SavedDocumentsDialog from "@/components/resume-builder/SavedDocumentsDialog";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, RefreshCw, Clock, CheckCircle2 } from "lucide-react";

// Types
import { 
  Template, 
  ChatRole, 
  DocumentType, 
  ChatMessage, 
  Document, 
  PendingChange 
} from "@/types/resume-builder";

export default function ResumeBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const jobTitle = searchParams.get("jobTitle");
  const company = searchParams.get("company");
  const action = searchParams.get("action");

  const { user } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const { documents, fetchDocuments, createDocument } = useDocumentsStore();
  const {
    subscription,
    fetchSubscription,
    resumeLimit,
    resumeCount,
    incrementResumeCount,
  } = useSubscriptionStore();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingCoverLetter, setIsCreatingCoverLetter] = useState<boolean>(
    action === "cover-letter"
  );
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [showDocumentList, setShowDocumentList] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>("modern");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [isPromptEditable, setIsPromptEditable] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [activeColor, setActiveColor] = useState<string>("blue");
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const { toast } = useToast();

  // Color options
  const colorOptions = {
    blue: "#3b82f6",
    green: "#10b981", 
    purple: "#8b5cf6",
    teal: "#14b8a6",
    orange: "#f97316",
    gray: "#6b7280"
  };

  // Export as PDF
  const exportPdf = async () => {
    try {
      setIsLoading(true);
      const blob = new Blob([currentHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        isCreatingCoverLetter ? "cover-letter" : "resume"
      }-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "Export Success",
        description: "Document exported successfully.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Error",
        description: "Failed to export PDF.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save document
  const saveDocument = async () => {
    if (!currentHtml) {
      toast({
        title: "No Content",
        description: "Please generate content first.",
        variant: "destructive",
      });
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
        target_job_id: jobId || undefined,
      });

      if (document) {
        toast({
          title: "Success",
          description: `Your ${
            isCreatingCoverLetter ? "cover letter" : "resume"
          } has been saved successfully.`,
        });
        if (jobTitle && company) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Save Error",
        description: "Failed to save document.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start conversation
  const startConversation = async () => {
    if (!profile) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile first",
        variant: "destructive",
      });
      return;
    }

    if (!checkSubscriptionLimits()) return;

    setIsLoading(true);
    setIsPromptEditable(false); // Lock prompt editing after starting

    const userMessage: ChatMessage = {
      role: "user",
      content: initialPrompt,
      timestamp: new Date(),
    };

    setChatMessages([userMessage]);

    try {
      const html = await generateHtmlDocument({
        profile,
        jobTitle: jobTitle || "",
        company: company || "",
        additionalInfo: "",
        isCreatingCoverLetter,
        template: selectedTemplate,
      });

      setCurrentHtml(html);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: `I've created a ${
          isCreatingCoverLetter ? "cover letter" : "resume"
        } for you based on your profile information. Here's what I came up with:`,
        timestamp: new Date(),
        html: html,
      };

      setChatMessages([userMessage, assistantMessage]);
      if (user?.id) {
        incrementResumeCount(user.id);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Generation Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send follow-up message
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const conversationHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const updatedHtml = await updateHtmlDocument({
        originalHtml: currentHtml,
        userRequest: currentMessage,
        conversationHistory,
      });

      setCurrentHtml(updatedHtml);

      const changeDescription = await generateText(`
        You just updated an HTML document based on this request: "${currentMessage}"
        Please provide a brief summary (2-3 sentences) of what changes you made to the document.
        Be specific but concise. Start with "I've updated the document..."
      `);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: changeDescription,
        timestamp: new Date(),
        html: updatedHtml,
      };

      setChatMessages([...chatMessages, userMessage, assistantMessage]);
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Update Error",
        description:
          "Failed to update the document. Try different instructions.",
        variant: "destructive",
      });
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

  // Preview document
  const previewDocument = (html: string) => {
    setCurrentHtml(html);
    setShowPreview(true);
  };

  // Add a pending change
  const addPendingChange = (description: string, prompt: string) => {
    setPendingChanges([...pendingChanges, { description, prompt }]);
  };

  // Remove a pending change
  const removePendingChange = (index: number) => {
    setPendingChanges(pendingChanges.filter((_, i) => i !== index));
  };

  // Apply pending changes
  const applyPendingChanges = async () => {
    if (pendingChanges.length === 0) return;
    
    // Create a single prompt from all pending changes
    const combinedPrompt = pendingChanges
      .map(change => change.prompt)
      .join(". Also, ");
    
    // Set the combined prompt and send
    setCurrentMessage(combinedPrompt);
    setPendingChanges([]);
    
    // Switch to chat tab to see the changes happening
    setActiveTab("chat");
    
    // Small delay to ensure UI updates before sending
    setTimeout(() => sendMessage(), 100);
  };

  // Check subscription limits before starting conversation
  const checkSubscriptionLimits = useCallback(() => {
    if (!subscription || subscription.subscription_type === "free") {
      // Free plan
      if (resumeCount >= resumeLimit) {
        toast({
          title: "Limit Reached",
          description: `You've reached the limit of ${resumeLimit} resumes on the Free plan. Upgrade to continue.`,
          variant: "destructive",
        });
        router.push("/pricing");
        return false;
      }
    }
    return true;
  }, [subscription, resumeCount, resumeLimit, toast, router]);

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
      toast({
        title: "Load Error",
        description: "Failed to load document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load user profile, documents, and subscription
  useEffect(() => {
    fetchProfile();
    fetchDocuments();
    if (user?.id) {
      fetchSubscription(user.id);
    }
  }, [user?.id, fetchProfile, fetchDocuments, fetchSubscription]);

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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Update preview dynamically
  useEffect(() => {
    if (previewIframeRef.current && currentHtml) {
      previewIframeRef.current.srcdoc = currentHtml;
    }
  }, [currentHtml]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Full Screen Preview */}
      {showPreview && (
        <FullScreenPreview
          currentHtml={currentHtml}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          setShowPreview={setShowPreview}
          isCreatingCoverLetter={isCreatingCoverLetter}
          exportPdf={exportPdf}
          isLoading={isLoading}
        />
      )}

      {/* Header */}
      <ResumeHeader 
        router={router}
        isCreatingCoverLetter={isCreatingCoverLetter}
        setIsCreatingCoverLetter={setIsCreatingCoverLetter}
        subscription={subscription}
        resumeCount={resumeCount}
        resumeLimit={resumeLimit}
        setShowDocumentList={setShowDocumentList}
      />

      {/* Status Indicator */}
      <div className="flex items-center justify-end text-xs text-muted-foreground px-4 -mt-2 mb-2">
        {isLoading ? (
          <span className="flex items-center">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Processing...
          </span>
        ) : pendingChanges.length > 0 ? (
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {pendingChanges.length} changes pending
          </span>
        ) : (
          <span className="flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Up to date
          </span>
        )}
      </div>

      {/* Main Content */}
      {chatMessages.length === 0 ? (
        // Initial Setup Screen
        <InitialSetupScreen
          profile={profile}
          jobTitle={jobTitle}
          company={company}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          activeColor={activeColor}
          setActiveColor={setActiveColor}
          colorOptions={colorOptions}
          initialPrompt={initialPrompt}
          setInitialPrompt={setInitialPrompt}
          isPromptEditable={isPromptEditable}
          setIsPromptEditable={setIsPromptEditable}
          isCreatingCoverLetter={isCreatingCoverLetter}
          isLoading={isLoading}
          startConversation={startConversation}
          subscription={subscription}
          resumeCount={resumeCount}
          resumeLimit={resumeLimit}
          router={router}
        />
      ) : (
        // Chat and Preview Interface
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Chat Section */}
          <div className="flex flex-col w-full md:w-1/2 border-r">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="mx-4 my-2 justify-start">
                <TabsTrigger value="chat" className="px-4">
                  <Eye className="h-4 w-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="edit" className="px-4">
                  <Eye className="h-4 w-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="history" className="px-4 hidden sm:flex">
                  <Eye className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
              
              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col px-0 m-0">
                <ChatTab 
                  chatMessages={chatMessages}
                  messagesEndRef={messagesEndRef}
                  isLoading={isLoading}
                  currentMessage={currentMessage}
                  setCurrentMessage={setCurrentMessage}
                  sendMessage={sendMessage}
                  previewDocument={previewDocument}
                />
              </TabsContent>
              
              {/* Edit Tab */}
              <TabsContent value="edit" className="flex-1 overflow-auto p-4 m-0">
                <EditTab 
                  pendingChanges={pendingChanges}
                  setPendingChanges={setPendingChanges}
                  removePendingChange={removePendingChange}
                  applyPendingChanges={applyPendingChanges}
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  activeColor={activeColor}
                  setActiveColor={setActiveColor}
                  colorOptions={colorOptions}
                  addPendingChange={addPendingChange}
                  showMobilePreview={() => setShowPreview(true)}
                />
              </TabsContent>
              
              {/* History Tab */}
              <TabsContent value="history" className="flex-1 overflow-auto p-4 m-0">
                <HistoryTab 
                  chatMessages={chatMessages}
                  previewDocument={previewDocument}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Section (Desktop) */}
          <PreviewPanel 
            currentHtml={currentHtml}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            setShowPreview={setShowPreview}
            previewIframeRef={previewIframeRef}
          />
        </div>
      )}

      {/* Mobile Action Bar */}
      <MobileActionBar 
        chatMessages={chatMessages}
        currentHtml={currentHtml}
        activeTab={activeTab}
        pendingChanges={pendingChanges}
        setShowPreview={setShowPreview}
        applyPendingChanges={applyPendingChanges}
        saveDocument={saveDocument}
        isLoading={isLoading}
      />

      {/* Saved Documents Dialog */}
      <SavedDocumentsDialog 
        showDocumentList={showDocumentList}
        setShowDocumentList={setShowDocumentList}
        existingDocuments={existingDocuments}
        loadDocument={loadDocument}
        setChatMessages={setChatMessages}
        setCurrentHtml={setCurrentHtml}
        setIsPromptEditable={setIsPromptEditable}
      />
    </div>
  );
}
