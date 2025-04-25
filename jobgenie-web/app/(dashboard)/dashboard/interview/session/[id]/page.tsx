"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Code,
  Briefcase,
  MessageCircle,
  LineChart,
  Check,
  AlertTriangle,
  Clock,
  Download,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingIndicator from "@/components/ui/loading-indicator";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  getInterviewSessionDetails,
  getInterviewFeedback,
  InterviewSession,
  InterviewFeedback,
} from "@/lib/supabase/interview";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth";

export default function InterviewSessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const sessionId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("transcript");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!user || !sessionId || isFetching) return;

      // Check if we've already loaded the session with this ID
      if (session && session.id === sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsFetching(true);
        
        const sessionData = await getInterviewSessionDetails(sessionId);
        
        if (!sessionData) {
          toast({
            title: "Session Not Found",
            description: "The interview session you're looking for doesn't exist or you don't have access to it.",
            variant: "destructive",
          });
          router.push("/dashboard/interview");
          return;
        }

        // Check if the session belongs to the current user
        if (sessionData.user_id !== user.id) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this interview session.",
            variant: "destructive",
          });
          router.push("/dashboard/interview");
          return;
        }

        setSession(sessionData);

        // Fetch feedback for this session
        const feedbackData = await getInterviewFeedback(sessionId);
        setFeedback(feedbackData);
      } catch (error) {
        console.error("Error fetching session details:", error);
        toast({
          title: "Error",
          description: "Failed to load interview details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, user, router, toast, session, isFetching]);

  const formatDuration = (seconds: number | null | undefined) => {
    if (typeof seconds !== 'number') return "N/A";
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-100 dark:bg-green-900/30";
      case "in_progress":
        return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
      case "abandoned":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case "behavioral":
        return <Users className="h-5 w-5" />;
      case "technical":
        return <Code className="h-5 w-5" />;
      case "general":
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Feature Coming Soon",
      description: "The ability to export session details as PDF will be available soon.",
    });
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading interview details..." />;
  }

  if (!session) {
    return (
      <div className="container max-w-6xl py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Interview Session Not Found</h1>
        <p className="mb-6">The interview session you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push("/dashboard/interview")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interviews
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/interview")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              Interview Details
            </h1>
            <p className="text-muted-foreground">
              {session.role} {session.company && `at ${session.company}`}
            </p>
          </div>
        </div>
        
        <Button onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Interview Summary</CardTitle>
            <CardDescription>
              {(session.interview_type || "").charAt(0).toUpperCase() + (session.interview_type || "").slice(1)} interview conducted on {formatDate(session.start_time)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center">
                  <Badge 
                    className={`${getStatusColor(session.status || "")} capitalize`}
                  >
                    {session.status === "in_progress" && (
                      <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2 animate-pulse" />
                    )}
                    {session.status || "Unknown"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Type</p>
                <div className="flex items-center space-x-2">
                  <div className={`rounded-full p-1.5 
                    ${session.interview_type === "behavioral" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" : 
                      session.interview_type === "technical" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300" : 
                      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"}`}
                  >
                    {getInterviewTypeIcon(session.interview_type || "")}
                  </div>
                  <span className="capitalize">{session.interview_type || "Unknown"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Mode</p>
                <div className="flex items-center space-x-2">
                  <div className={`rounded-full p-1.5 ${session.mode === "video" 
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" 
                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"}`}
                  >
                    {session.mode === "video" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="m22 8-6 4 6 4V8Z"></path>
                        <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
                      </svg>
                    ) : (
                      <MessageCircle className="h-5 w-5" />
                    )}
                  </div>
                  <span className="capitalize">{session.mode || "Text"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Duration</p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{formatDuration(session.duration_seconds)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Start Time</p>
                <div className="flex items-center space-x-2">
                  <span>{formatDate(session.start_time)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">End Time</p>
                <div className="flex items-center space-x-2">
                  <span>{formatDate(session.end_time)}</span>
                </div>
              </div>

              {typeof session.overall_score === 'number' && (
                <div className="md:col-span-3 mt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Overall Score</p>
                      <p className={`font-bold text-lg ${getScoreColor(session.overall_score)}`}>
                        {session.overall_score}/100
                      </p>
                    </div>
                    <Progress value={session.overall_score} className="h-2" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Tabs */}
      <Tabs 
        defaultValue="transcript" 
        value={currentTab}
        onValueChange={setCurrentTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="transcript">
            <MessageCircle className="h-4 w-4 mr-2" />
            Transcript
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <LineChart className="h-4 w-4 mr-2" />
            Feedback & Analysis
          </TabsTrigger>
        </TabsList>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Transcript</CardTitle>
              <CardDescription>
                Complete record of the interview conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-450px)] w-full">
                <div className="p-6 space-y-6">
                {session.transcript?.messages && Array.isArray(session.transcript.messages) && session.transcript.messages.length > 0 ? (
                    session.transcript.messages.map(
                        (message: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center">
                                    <Badge
                                        variant={message.role === "ai" ? "secondary" : "default"}
                                        className="mr-2"
                                    >
                                        {message.role === "ai" ? "Interviewer" : "You"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {idx > 0 ? `Question ${Math.ceil(idx / 2)}` : "Introduction"}
                                    </span>
                                </div>
                                <div
                                    className={`p-4 rounded-lg ${
                                        message.role === "ai" ? "bg-muted" : "bg-primary/10"
                                    }`}
                                >
                                    {message.type === "code" || (message.content && message.content.includes("```")) ? (
                                        <div className="relative">
                                            <div className="absolute top-0 right-0 m-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full bg-background/80"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(message.content || "");
                                                        toast({
                                                            title: "Code Copied",
                                                            variant: "default",
                                                        });
                                                    }}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <pre className="font-mono text-sm p-4 bg-black/10 dark:bg-white/5 rounded overflow-x-auto">
                                                {message.content || ""}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{message.content || ""}</div>
                                    )}
                                </div>
                            </div>
                        )
                    )
                ) : (
                    <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <MessageCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No transcript available</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            This interview session doesn't have a transcript available. This could be because
                            the interview was abandoned or there was an error during the session.
                        </p>
                    </div>
                )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Feedback</CardTitle>
              <CardDescription>
                AI-generated feedback on your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(feedback) && feedback.length > 0 ? (
                <div className="space-y-8">
                  {feedback.map((item, index) => (
                    <div key={index} className="space-y-4 pb-8 border-b last:border-b-0">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Question {item.question_number}</h3>
                        <div className="p-4 rounded-lg bg-muted mb-4">
                          <p className="font-medium">{item.question_text || ""}</p>
                        </div>
                        
                        <h4 className="text-sm font-medium mb-2">Your Answer:</h4>
                        <div className="p-4 rounded-lg bg-primary/10 mb-4">
                          {item.code_submission ? (
                            <div className="relative">
                              <div className="absolute top-0 right-0 m-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7 rounded-full bg-background/80"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.code_submission || "");
                                    toast({
                                      title: "Code Copied",
                                      variant: "default",
                                    });
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <pre className="font-mono text-sm p-4 bg-black/10 dark:bg-white/5 rounded overflow-x-auto">
                                {item.code_submission || ""}
                              </pre>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{item.user_answer || ""}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Response Score</h4>
                          <p className={`font-bold ${getScoreColor(item.score || 0)}`}>
                            {item.score || 0}/100
                          </p>
                        </div>
                        <Progress value={item.score || 0} className="h-2" />
                      </div>

                      <div className="space-y-4 mt-4">
                        <h4 className="text-sm font-medium">Feedback</h4>
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="whitespace-pre-wrap">{item.feedback_text || ""}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Strengths
                            </h4>
                            <ul className="space-y-2">
                              {Array.isArray(item.strengths) && item.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-1 rounded-full mr-2 mt-0.5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                  <span className="text-sm">{strength || ""}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center text-amber-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                              {Array.isArray(item.areas_for_improvement) && item.areas_for_improvement.map((area, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-1 rounded-full mr-2 mt-0.5">
                                    <AlertTriangle className="h-3 w-3" />
                                  </div>
                                  <span className="text-sm">{area || ""}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <LineChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No feedback available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {session.status === "in_progress" ? 
                      "The interview is still in progress. Feedback will be available once the session is completed." :
                      "No feedback is available for this interview session. This could be because the interview was abandoned or there was an error during the evaluation."}
                  </p>
                  {session.status === "in_progress" && (
                    <Button 
                      className="mt-4"
                      onClick={() => router.push(`/dashboard/interview/session/${sessionId}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Continue Session
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  This feedback is AI-generated based on your interview responses. Use it as a guide for improvement.
                </p>
              </div>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export Feedback
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
