// app/(dashboard)/resume/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  FileText,
  Download,
  Save,
  Folder,
  FileEdit,
  RefreshCw,
  Maximize,
  Zap,
  Clock,
  CheckCircle2,
  User,
  Briefcase,
  Award,
  Eye,
  Settings,
  Mail,
  ZoomIn,
  ZoomOut,
  Printer,
} from "lucide-react";
import {
  generateHtmlDocument,
  generateText,
  updateHtmlDocument,
} from "@/lib/gemini";
import { useProfileStore } from "@/lib/stores/profile";
import { useDocumentsStore } from "@/lib/stores/documents";
import { useSubscriptionStore } from "@/lib/stores/subscription";
import LoadingIndicator from "@/components/ui/loading-indicator";

// Types remain the same as in the original code
type Template = "modern" | "classic" | "minimal";
type ChatRole = "user" | "assistant";
type DocumentType = "resume" | "cover_letter";

interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: Date;
  html?: string;
}

interface Document {
  id: string;
  user_id: string;
  title: string;
  document_type: DocumentType;
  content: string;
  target_job_id?: string;
  created_at: string;
  updated_at: string;
}

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
  } = useSubscriptionStore(); // Subscription logic

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingCoverLetter, setIsCreatingCoverLetter] = useState<boolean>(
    action === "cover-letter"
  );
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [showDocumentList, setShowDocumentList] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>("modern");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [isPromptEditable, setIsPromptEditable] = useState<boolean>(true); // New state for prompt editing
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [zoomLevel, setZoomLevel] = useState<number>(0.75); // For preview zoom
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState<boolean>(false); // Collapsible preview

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Load user profile, documents, and subscription
  useEffect(() => {
    fetchProfile();
    fetchDocuments();
    if (user?.id) {
      fetchSubscription(user.id); // Fetch subscription details
    }
  }, [user?.id]);

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

  // Check subscription limits before starting conversation
  const checkSubscriptionLimits = useCallback(() => {
    if (!subscription ) {
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
      alert("Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border p-4 bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {isCreatingCoverLetter ? "Cover Letter Builder" : "Resume Builder"}
          </h1>
          <Badge
            variant={isCreatingCoverLetter ? "outline" : "default"}
            className="cursor-pointer"
            onClick={() => setIsCreatingCoverLetter(false)}
          >
            Resume
          </Badge>
          <Badge
            variant={isCreatingCoverLetter ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setIsCreatingCoverLetter(true)}
          >
            Cover Letter
          </Badge>
          <Badge variant="secondary">
            {subscription?.subscription_type || "Free"} Plan: {resumeCount}/
            {resumeLimit} Resumes
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Folder className="h-4 w-4 mr-2" />
                Open
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Saved Documents</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <ScrollArea className="h-[300px]">
                  {existingDocuments.length > 0 ? (
                    <div className="space-y-1">
                      {existingDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => loadDocument(doc)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-md">
                              {doc.document_type === "resume" ? (
                                <FileText className="h-5 w-5 text-primary" />
                              ) : (
                                <FileEdit className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No saved documents found
                      </p>
                    </div>
                  )}
                </ScrollArea>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChatMessages([]);
                      setCurrentHtml("");
                      setIsPromptEditable(true); // Allow editing prompt again
                    }}
                  >
                    Create New
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={exportPdf}
            disabled={!currentHtml || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={saveDocument}
            disabled={!currentHtml || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Content */}
      {chatMessages.length === 0 ? (
        <div className="flex-1 p-6 flex flex-col md:flex-row gap-8">
          <motion.div
            className="w-full md:w-1/2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Template Settings
                  </div>
                </CardTitle>
                <CardDescription>
                  Choose a template design for your{" "}
                  {isCreatingCoverLetter ? "cover letter" : "resume"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {["modern", "classic", "minimal"].map((template) => (
                    <div
                      key={template}
                      className={`
                        p-4 rounded-lg border cursor-pointer flex flex-col items-center gap-2 transition-all
                        ${
                          selectedTemplate === template
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "hover:bg-accent"
                        }
                      `}
                      onClick={() => setSelectedTemplate(template as Template)}
                    >
                      {template === "modern" && (
                        <div className="w-full h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md mb-2" />
                      )}
                      {template === "classic" && (
                        <div className="w-full h-24 bg-slate-700 rounded-md mb-2" />
                      )}
                      {template === "minimal" && (
                        <div className="w-full h-24 bg-gradient-to-r from-gray-100 to-gray-300 rounded-md mb-2" />
                      )}
                      <span className="font-medium">
                        {template.charAt(0).toUpperCase() + template.slice(1)}
                      </span>
                      {selectedTemplate === template && (
                        <Badge variant="default" className="mt-1">
                          Selected
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {(jobTitle || company) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Target Position
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <div className="p-3 border rounded-md bg-muted/50">
                      {jobTitle || "Not specified"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <div className="p-3 border rounded-md bg-muted/50">
                      {company || "Not specified"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Profile
                  </div>
                </CardTitle>
                <CardDescription>
                  Information from your profile will be used to generate your{" "}
                  {isCreatingCoverLetter ? "cover letter" : "resume"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-accent">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-primary text-white text-lg">
                          {profile.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {profile.full_name || "Not specified"}
                        </h3>
                        <p className="text-muted-foreground">
                          {profile.experience?.currentTitle ||
                            "Add current position in profile"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills && profile.skills.length > 0 ? (
                          profile.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground p-1">
                            No skills specified
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Experience</Label>
                      <div className="p-3 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span>
                            {profile.experience?.level || "Not specified"} (
                            {profile.experience?.yearsOfExperience || 0} years)
                          </span>
                        </div>
                      </div>
                    </div>

                    {profile.interests && profile.interests.length > 0 && (
                      <div className="space-y-2">
                        <Label>Interests</Label>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map(
                            (interest: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {interest}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <LoadingIndicator message="Loading profile..." />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="w-full md:w-1/2 flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Create with AI
                  </div>
                </CardTitle>
                <CardDescription>
                  Generate a professional{" "}
                  {isCreatingCoverLetter ? "cover letter" : "resume"} with our
                  AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-medium">Initial Prompt</span>
                  </div>
                  <Textarea
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    className="min-h-[150px] resize-none"
                    placeholder="Enter your prompt here..."
                    disabled={!isPromptEditable}
                  />
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-4 mt-6">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={startConversation}
                    disabled={isLoading || !profile || !initialPrompt.trim()}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Create{" "}
                        {isCreatingCoverLetter ? "Cover Letter" : "Resume"} with
                        AI
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left panel - Chat & Editor */}
          <div className="flex flex-col border-r">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="border-b"
            >
              <TabsList className="w-full justify-start h-auto p-0">
                <TabsTrigger
                  value="chat"
                  className="rounded-none px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Chat
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="edit"
                  className="rounded-none px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <div className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4" />
                    Edit
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="rounded-none px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <TabsContent value="edit" className="flex-1 flex flex-col p-0 m-0">
              <div className="flex-1 overflow-y-auto p-4">
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">HTML Editor</CardTitle>
                    <CardDescription>
                      Advanced users can directly edit the HTML for more precise
                      control
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Textarea
                        value={currentHtml}
                        onChange={(e) => {
                          // Debounce the update to improve performance
                          const value = e.target.value;
                          const timeout = setTimeout(
                            () => setCurrentHtml(value),
                            300
                          );
                          return () => clearTimeout(timeout);
                        }}
                        className="font-mono text-sm h-[400px]"
                        spellCheck={false}
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActiveTab("chat")}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Apply Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Edits</CardTitle>
                    <CardDescription>
                      Common changes you might want to make
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Template Style</Label>
                        <Select
                          value={selectedTemplate}
                          onValueChange={(value) =>
                            setSelectedTemplate(value as Template)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Color Scheme</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {["blue", "green", "purple", "gray", "custom"].map(
                            (color) => (
                              <div
                                key={color}
                                className="w-full aspect-square rounded-md border cursor-pointer hover:ring-2 hover:ring-primary/50 flex items-center justify-center"
                                style={{
                                  backgroundColor:
                                    color === "blue"
                                      ? "#3b82f6"
                                      : color === "green"
                                      ? "#10b981"
                                      : color === "purple"
                                      ? "#8b5cf6"
                                      : color === "gray"
                                      ? "#6b7280"
                                      : "#ffffff",
                                }}
                              >
                                {color === "custom" && (
                                  <Settings className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            A-
                          </Button>
                          <div className="flex-1 h-2 bg-muted rounded-full">
                            <div className="w-1/2 h-full bg-primary rounded-full"></div>
                          </div>
                          <Button variant="outline" size="sm">
                            A+
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Layout</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {["single-column", "two-column", "compact"].map(
                            (layout) => (
                              <div
                                key={layout}
                                className="border rounded-md p-2 cursor-pointer hover:bg-accent"
                              >
                                <div className="aspect-[8.5/11] bg-muted rounded flex items-center justify-center">
                                  {layout === "single-column" && (
                                    <div className="w-2/3 h-3/4 flex flex-col gap-2">
                                      <div className="h-1/6 bg-primary/20 rounded"></div>
                                      <div className="h-5/6 bg-primary/10 rounded"></div>
                                    </div>
                                  )}
                                  {layout === "two-column" && (
                                    <div className="w-2/3 h-3/4 flex gap-2">
                                      <div className="w-1/3 h-full bg-primary/20 rounded"></div>
                                      <div className="w-2/3 h-full bg-primary/10 rounded"></div>
                                    </div>
                                  )}
                                  {layout === "compact" && (
                                    <div className="w-2/3 h-3/4 flex flex-col gap-1">
                                      <div className="h-1/5 bg-primary/20 rounded"></div>
                                      <div className="h-1/5 bg-primary/10 rounded"></div>
                                      <div className="h-1/5 bg-primary/10 rounded"></div>
                                      <div className="h-1/5 bg-primary/10 rounded"></div>
                                      <div className="h-1/5 bg-primary/10 rounded"></div>
                                    </div>
                                  )}
                                </div>
                                <p className="text-center text-xs mt-2 capitalize">
                                  {layout.replace("-", " ")}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent
              value="timeline"
              className="flex-1 flex flex-col p-0 m-0"
            >
              <div className="flex-1 overflow-y-auto p-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Document History</CardTitle>
                    <CardDescription>
                      View changes made to your document
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-6 border-l-2 border-muted">
                      {chatMessages.map((message, index) => {
                        if (message.role === "user") return null;
                        return (
                          <div key={index} className="mb-6 relative">
                            <div className="absolute -left-[25px] top-0 w-12 h-12 rounded-full flex items-center justify-center bg-muted">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div className="ml-6 pt-2">
                              <div className="text-sm font-medium">
                                Revision {Math.floor(index / 2)}
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {message.timestamp.toLocaleString()}
                              </div>
                              <div className="p-3 rounded-md bg-muted text-sm">
                                {message.content}
                              </div>

                              {message.html && (
                                <div className="mt-2 flex justify-end gap-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    View
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                    Restore
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="relative">
                        <div className="absolute -left-[25px] top-0 w-12 h-12 rounded-full flex items-center justify-center bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-6 pt-2">
                          <div className="text-sm font-medium">
                            Initial Document
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {chatMessages[1]?.timestamp.toLocaleString() ||
                              new Date().toLocaleString()}
                          </div>
                          <div className="p-3 rounded-md bg-muted/50 text-sm">
                            Document created based on your profile
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>

          {/* Right panel - Preview */}
          <AnimatePresence>
            {!isPreviewCollapsed && (
              <motion.div
                className="hidden lg:flex flex-col border-l"
                initial={{ width: "50%" }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <h3 className="font-medium">Live Preview</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setZoomLevel((prev) => Math.max(0.5, prev - 0.1))
                      }
                    >
                      <ZoomOut className="h-4 w-4 mr-1" />
                      Zoom Out
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setZoomLevel((prev) => Math.min(1.5, prev + 0.1))
                      }
                    >
                      <ZoomIn className="h-4 w-4 mr-1" />
                      Zoom In
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `data:text/html;charset=utf-8,${encodeURIComponent(
                            currentHtml
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewCollapsed(true)}
                    >
                      Collapse
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-muted/20 flex items-center justify-center">
                  {currentHtml ? (
                    <div
                      className="w-[21cm] h-[29.7cm] shadow-lg bg-white overflow-hidden"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "top center",
                      }}
                    >
                      <iframe
                        ref={previewIframeRef}
                        srcDoc={currentHtml}
                        title="Document Preview"
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-12 bg-muted/50 rounded-lg">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Document Yet</h3>
                      <p className="text-muted-foreground mt-2">
                        Your document preview will appear here after generation
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isPreviewCollapsed && (
            <Button
              className="fixed right-4 bottom-4 z-20"
              onClick={() => setIsPreviewCollapsed(false)}
            >
              Show Preview
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
