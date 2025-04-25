"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Info,
  Clock,
  MessageSquare,
  Video as VideoIcon,
  Code as CodeIcon,
  Play,
  Sparkles,
  Copy,
  Timer,
} from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import CameraPreview from "@/components/interview/CameraPreview";
import {
  conductTextInterview,
  generateText,
  InterviewContext,
} from "@/lib/gemini";
import {
  getUserSubscription,
  checkInterviewLimits,
  createInterviewSession,
  updateInterviewSession,
  incrementInterviewUsage,
  addInterviewFeedback,
  UserSubscription,
  InterviewFeedback,
  getInterviewSession,
} from "@/lib/supabase/interview";
import Editor from "@monaco-editor/react";
import { GeminiWebSocket } from "@/lib/services/geminiWebSocket";
import { useAuthStore } from "@/lib/stores/auth";
import { useToast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";

// Custom hook for timer logic
const useTimer = (isRunning: boolean, sessionLimit: number) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(sessionLimit);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;
          setTimeRemaining(sessionLimit - newTime);
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, sessionLimit]);

  return { timeElapsed, timeRemaining };
};

interface Message {
  role: "human" | "ai";
  content: string;
  type?: "text" | "code" | "feedback";
}

export default function InterviewSessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type =
    (searchParams.get("type") as "behavioral" | "technical" | "general") ||
    "behavioral";
  const role = searchParams.get("role") || "Software Developer";
  const company = searchParams.get("company") || "";

  const [interviewMode, setInterviewMode] = useState<"video" | "text">(
    type === "technical" ? "text" : "video"
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [showModeSwitchDialog, setShowModeSwitchDialog] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [canCreateInterview, setCanCreateInterview] = useState(true);
  const isCreatingSessionRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] =
    useState<UserSubscription | null>(null);

  const geminiWsRef = useRef<GeminiWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Define session limits based on subscription and mode
  let sessionLimit = 300; // Default 5 minutes for free
  if (userSubscription?.subscription_type === "pro") {
    if (userSubscription.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL) {
      sessionLimit = interviewMode === "video" ? 2700 : Infinity; // 45 min video, unlimited text
    } else if (userSubscription.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ANNUAL) {
      sessionLimit = interviewMode === "video" ? 900 : 1800; // 15 min video, 30 min text
    } else {
      sessionLimit = interviewMode === "video" ? 600 : 1200; // 10 min video, 20 min text
    }
  }


  const { timeElapsed, timeRemaining } = useTimer(isTimerRunning, sessionLimit);

  useEffect(() => {
    const initialMessage: Message = {
      role: "ai" as const,
      content:
        interviewMode === "video"
          ? `Hello! I'm your JobGenie interview coach, powered by a professional AI voice. Let's begin the ${type} interview for the ${role}${
              company ? ` at ${company}` : ""
            } position. I'll be analyzing your responses and body language. Are you ready? Click the green video icon to begin.`
          : `Hello! I'm your JobGenie interview coach. Let's begin the ${type} interview for the ${role}${
              company ? ` at ${company}` : ""
            } position. ${
              type === "technical"
                ? "I'll be assessing your technical knowledge and may ask you to write code. Feel free to use the code editor when needed."
                : "I'll be evaluating your responses to help you prepare for real interviews."
            } When you're ready, click the start button to begin.`,
      type: "text" as const,
    };
    setMessages([initialMessage]);
  }, [interviewMode, type, role, company]);

  const setWebSocketRef = useCallback((ws: GeminiWebSocket | null) => {
    geminiWsRef.current = ws;
  }, []);

  const onTranscription = useCallback((text: string) => {
    if (text && text.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          role: "human",
          content: text,
          type: "text",
        },
      ]);
    }
  }, []);

  const onAITranscription = useCallback((text: string) => {
    if (text && text.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: text,
          type: "text",
        },
      ]);
    }
  }, []);

  const onConnectionError = useCallback((error: string) => {
    setConnectionError(error);
    setShowExitDialog(true);
  }, []);

  const onTimerControl = useCallback((shouldRun: boolean) => {
    setIsTimerRunning(shouldRun);
  }, []);

  const handleModeSwitch = useCallback(() => {
    setShowModeSwitchDialog(true);
  }, []);

  useEffect(() => {
    return () => {
      if (currentSessionId && sessionStartedRef.current) {
        updateInterviewSession(currentSessionId, {
          status: "completed",
          end_time: new Date().toISOString(),
          duration_seconds: timeElapsed,
          transcript: { messages: messages },
        }).catch((err) => {
          console.error("Failed to update session on unmount:", err);
        });
      }
    };
  }, [currentSessionId, timeElapsed, messages]);

  const handleExit = async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      if (currentSessionId && sessionStartedRef.current) {
        await completeSession("user_end");
        router.push(`/dashboard/interview/feedback/${currentSessionId}`);
      } else {
        router.push("/dashboard/interview");
      }
    } catch (error) {
      console.error("Error ending interview:", error);
      toast({
        title: "Error",
        description: "Failed to end the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        const subscription = await getUserSubscription(user.id);
        setUserSubscription(subscription);

        const { canCreateInterview: canCreate, remainingInterviews } =
          await checkInterviewLimits(user.id);
        setCanCreateInterview(canCreate);

        if (!canCreate) {
          toast({
            title: "Interview Limit Reached",
            description:
              "You've used all your free interviews this month. Upgrade to Pro for unlimited interviews.",
            variant: "destructive",
          });
          router.push("/pricing");
        }
      }
    };

    checkUserStatus();
  }, [user, toast, router]);

  const createSession = useCallback(async (): Promise<{
    id: string;
  } | null> => {
    if (!user || isCreatingSessionRef.current || sessionStartedRef.current)
      return null;

    try {
      isCreatingSessionRef.current = true;

      const { canCreateInterview } = await checkInterviewLimits(user.id);
      if (!canCreateInterview) {
        toast({
          title: "Interview Limit Reached",
          description:
            "You've used all your free interviews this month. Upgrade to Pro for unlimited interviews.",
          variant: "destructive",
        });
        router.push("/pricing");
        return null;
      }

      const session = await createInterviewSession({
        user_id: user.id,
        interview_type: type,
        mode: interviewMode,
        role: role,
        company: company || null,
        status: "in_progress",
        start_time: new Date().toISOString(),
        end_time: null,
        duration_seconds: null,
        overall_score: null,
        score_breakdown: null,
        transcript: null,
      });

      if (session) {
        setCurrentSessionId(session.id);
        sessionStartedRef.current = true;

        if (userSubscription?.subscription_type !== "pro") {
          await incrementInterviewUsage(user.id);
        }

        return session;
      }

      return null;
    } catch (error) {
      console.error("[InterviewSessionPage] Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create interview session. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      isCreatingSessionRef.current = false;
    }
  }, [
    user,
    interviewMode,
    type,
    role,
    company,
    userSubscription,
    router,
    toast,
  ]);

  const handleStartTextInterview = useCallback(async () => {
    if (isCreatingSessionRef.current || sessionStartedRef.current) return;

    setIsStarting(true);
    try {
      setIsStarted(true);
      setIsTimerRunning(true);

      const session = await createSession();
      if (!session) {
        setIsStarted(false);
        setIsTimerRunning(false);
        return;
      }

      const context: InterviewContext = {
        type,
        role,
        company,
        currentQuestionIndex: 0,
        conversationHistory: [],
      };

      const response = await conductTextInterview("Let's start", context);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: response.response,
          type: response.type,
        },
      ]);
    } catch (error) {
      console.error("[InterviewSessionPage] Error starting interview:", error);
      toast({
        title: "Error",
        description: "Failed to start the interview. Please try again.",
        variant: "destructive",
      });
      setIsStarted(false);
      setIsTimerRunning(false);
    } finally {
      setIsStarting(false);
    }
  }, [type, role, company, createSession, toast]);

  const handleStartVideoInterview = useCallback(async () => {
    if (isCreatingSessionRef.current || sessionStartedRef.current) return false;

    const session = await createSession();
    if (!session) return false;

    setIsStarted(true);
    return true;
  }, [createSession]);

  const calculateInterviewScore = async (
    messages: Message[],
    duration: number
  ): Promise<{ score: number; breakdown: Record<string, number> }> => {
    const humanMessages = messages.filter((m) => m.role === "human");
    const aiMessages = messages.filter((m) => m.role === "ai");
  
    if (humanMessages.length === 0) {
      console.warn(
        "No human responses provided, assigning default score with breakdown."
      );
      return {
        score: 10,
        breakdown: {
          response_quality: 0,
          communication_clarity: 0,
          technical_proficiency: 0,
          time_management: 50,
          engagement_level: 0,
        },
      };
    }
  
    try {
      const prompt = `
        As an expert interview evaluator, score this interview session on a scale of 0-100 and provide a breakdown for each criterion.
  
        Interview type: ${type}
        Mode: ${interviewMode}
        Role: ${role}
        Interview duration: ${duration} seconds
        Total questions asked: ${aiMessages.length}
        Total responses provided: ${humanMessages.length}
  
        Interview transcript:
        ${messages
          .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join("\n")}
  
        Evaluate based on the following criteria (each out of 100):
        1. Response quality and depth (response_quality)
        2. Communication clarity (communication_clarity)
        3. Technical proficiency (technical_proficiency, if applicable)
        4. Time management (time_management)
        5. Engagement level (engagement_level)
  
        For video mode interviews, consider verbal communication and engagement through spoken responses.
        The transcript alternates between AI questions and human responses, so evaluate how well the human responded to each AI question.
  
        Return ONLY a valid JSON object in the following format, with no additional text, comments, or explanations:
        {
          "overall_score": numeric score between 0 and 100,
          "breakdown": {
            "response_quality": number,
            "communication_clarity": number,
            "technical_proficiency": number,
            "time_management": number,
            "engagement_level": number
          }
        }
      `;
  
      const result = await generateText(prompt, {
        temperature: 0.3,
        maxOutputTokens: 256,
      });
  
      // Log the raw result for debugging
      console.log("Raw generateText result:", result);
  
      // Extract JSON from the result using regex to handle extra text
      const jsonMatch = result.match(/{[\s\S]*?}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the response");
      }
  
      const jsonString = jsonMatch[0];
      const evaluation = JSON.parse(jsonString);
  
      // Validate the parsed JSON structure
      if (
        !evaluation ||
        typeof evaluation.overall_score !== "number" ||
        !evaluation.breakdown ||
        typeof evaluation.breakdown !== "object"
      ) {
        throw new Error("Invalid JSON structure in the response");
      }
  
      const score = Math.min(100, Math.max(0, evaluation.overall_score || 75));
      const breakdown = {
        response_quality: Math.min(
          100,
          Math.max(0, evaluation.breakdown?.response_quality || 0)
        ),
        communication_clarity: Math.min(
          100,
          Math.max(0, evaluation.breakdown?.communication_clarity || 0)
        ),
        technical_proficiency: Math.min(
          100,
          Math.max(0, evaluation.breakdown?.technical_proficiency || 0)
        ),
        time_management: Math.min(
          100,
          Math.max(0, evaluation.breakdown?.time_management || 0)
        ),
        engagement_level: Math.min(
          100,
          Math.max(0, evaluation.breakdown?.engagement_level || 0)
        ),
      };
  
      return { score, breakdown };
    } catch (error) {
      console.error("Error calculating interview score:", error);
      return {
        score: 75,
        breakdown: {
          response_quality: 75,
          communication_clarity: 75,
          technical_proficiency: 75,
          time_management: 75,
          engagement_level: 75,
        },
      };
    }
  };

  const generateDetailedFeedback = async (
    messages: Message[],
    interviewType: string,
    jobRole: string
  ): Promise<Omit<InterviewFeedback, "id" | "session_id" | "created_at">[]> => {
    const feedbackItems: Omit<
      InterviewFeedback,
      "id" | "session_id" | "created_at"
    >[] = [];

    const qaPairs: { question: Message; answer?: Message }[] = [];

    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "ai" && messages[i].type !== "feedback") {
        const pair = {
          question: messages[i],
          answer:
            messages[i + 1]?.role === "human" ? messages[i + 1] : undefined,
        };
        qaPairs.push(pair);
      }
    }

    for (let i = 0; i < qaPairs.length; i++) {
      const { question, answer } = qaPairs[i];

      if (answer) {
        try {
          const prompt = `
            You are an expert interview coach providing feedback on a candidate's response.

            Interview type: ${interviewType}
            Mode: ${interviewMode}
            Role: ${jobRole}
            Question ${i + 1}: ${question.content}
            Candidate's answer: ${answer.content}

            Provide a comprehensive evaluation in JSON format with the following structure:
            {
              "score": numeric score from 0-100,
              "feedback_text": "detailed constructive feedback about their response",
              "strengths": ["specific strengths demonstrated"],
              "areas_for_improvement": ["specific areas where they could improve"]
            }

            For video mode interviews, consider verbal communication, tone, and clarity of spoken responses.
            For technical questions with code, also evaluate code quality and approach.
            Keep feedback specific, actionable, and encouraging.
            Return only valid JSON with these properties.
          `;

          const result = await generateText(prompt, {
            temperature: 0.5,
            maxOutputTokens: 1024,
          });

          try {
            const evaluation = JSON.parse(result);

            feedbackItems.push({
              question_number: i + 1,
              question_text: question.content,
              user_answer: answer.content,
              code_submission:
                answer.type === "code" ? answer.content : undefined,
              feedback_text:
                evaluation.feedback_text ||
                "Good response. Consider providing more specific examples.",
              score: Math.min(100, Math.max(0, evaluation.score || 75)),
              strengths: Array.isArray(evaluation.strengths)
                ? evaluation.strengths
                : ["Demonstrated understanding of the topic"],
              areas_for_improvement: Array.isArray(
                evaluation.areas_for_improvement
              )
                ? evaluation.areas_for_improvement
                : ["Provide more specific examples"],
            });
          } catch (parseError) {
            console.error("Error parsing feedback JSON:", parseError);

            feedbackItems.push({
              question_number: i + 1,
              question_text: question.content,
              user_answer: answer.content,
              code_submission:
                answer.type === "code" ? answer.content : undefined,
              feedback_text:
                "Your response demonstrates understanding of the topic. Consider providing more specific examples to strengthen your answer.",
              score: 70,
              strengths: ["Shows basic understanding"],
              areas_for_improvement: [
                "Add more specific examples",
                "Elaborate on key points",
              ],
            });
          }
        } catch (error) {
          console.error("Error generating AI feedback:", error);

          feedbackItems.push({
            question_number: i + 1,
            question_text: question.content,
            user_answer: answer.content,
            feedback_text: "Response received and noted.",
            score: 70,
            strengths: ["Provided a response"],
            areas_for_improvement: ["Consider providing more detail"],
          });
        }
      }
    }

    return feedbackItems;
  };

  const completeSession = useCallback(
    async (reason: "user_end" | "time_expired") => {
      if (!currentSessionId) return;

      try {
        // Verify session ownership
        const sessionData = await getInterviewSession(currentSessionId);
        if (!sessionData || sessionData.user_id !== user?.id) {
          throw new Error("Session does not belong to the current user");
        }

        const { score, breakdown } = await calculateInterviewScore(messages, timeElapsed);
        const feedbackItems = await generateDetailedFeedback(messages, type, role);

        await updateInterviewSession(currentSessionId, {
          status: reason === "user_end" ? "completed" : "completed",
          end_time: new Date().toISOString(),
          duration_seconds: timeElapsed,
          overall_score: score,
          score_breakdown: breakdown,
          transcript: { messages: messages },
        });

        let feedbackSavedSuccessfully = true;
        for (const feedback of feedbackItems) {
          try {
            await addInterviewFeedback({
              session_id: currentSessionId,
              ...feedback,
            });
          } catch (feedbackError) {
            console.error(`Failed to save feedback for question ${feedback.question_number}:`, feedbackError);
            feedbackSavedSuccessfully = false;
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                content: `Feedback for Question ${feedback.question_number}: ${feedback.feedback_text}`,
                type: "feedback",
              },
            ]);
          }
        }

        if (!feedbackSavedSuccessfully) {
          toast({
            title: "Warning",
            description: "Some feedback could not be saved to the database. It has been added to the transcript instead.",
            variant: "destructive",
          });
        }

        sessionStartedRef.current = false;
      } catch (error) {
        console.error("[InterviewSessionPage] Error completing session:", error);
        toast({
          title: "Error",
          description: "Failed to save interview results. Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentSessionId, messages, timeElapsed, type, role, user, toast]
  );

  const handleSendMessage = useCallback(async () => {
    if (!currentAnswer.trim() || isProcessing) return;

    const isCode =
      isCodeMode ||
      /^(function|const|let|var|import|class)\s/.test(currentAnswer);

    setMessages((prev) => [
      ...prev,
      {
        role: "human",
        content: currentAnswer,
        type: isCode ? "code" : "text",
      },
    ]);

    setIsProcessing(true);

    try {
      const context: InterviewContext = {
        type,
        role,
        company,
        currentQuestionIndex: messages.filter((m) => m.role === "ai").length,
        conversationHistory: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          type: msg.type === "feedback" ? "text" : msg.type,
        })),
      };

      const response = await conductTextInterview(currentAnswer, context);

      setMessages((prev) => {
        const newMessages: Message[] = [
          ...prev,
          {
            role: "ai" as const,
            content: response.response,
            type: response.type,
          },
        ];

        if (
          response.type === "code" ||
          response.response.toLowerCase().includes("write code")
        ) {
          setIsCodeMode(true);
        }

        if (currentSessionId) {
          updateInterviewSession(currentSessionId, {
            transcript: { messages: newMessages },
          }).catch((error) => {
            console.error("Error updating transcript:", error);
          });
        }

        return newMessages;
      });
    } catch (error) {
      console.error("[InterviewSessionPage] Error sending message:", error);
    } finally {
      setIsProcessing(false);
      setCurrentAnswer("");
    }
  }, [
    currentAnswer,
    isProcessing,
    type,
    role,
    company,
    messages,
    isCodeMode,
    currentSessionId,
  ]);

  const confirmModeSwitch = useCallback(() => {
    const newMode = interviewMode === "video" ? "text" : "video";

    if (currentSessionId && sessionStartedRef.current) {
      completeSession("user_end").then(() => {
        sessionStartedRef.current = false;
        setCurrentSessionId(null);
        setInterviewMode(newMode);
        setShowModeSwitchDialog(false);
        setIsStarted(false);
        setIsTimerRunning(false);
      });
    } else {
      setInterviewMode(newMode);
      setShowModeSwitchDialog(false);
      setIsStarted(false);
      setIsTimerRunning(false);
    }
  }, [interviewMode, currentSessionId, completeSession]);

  useEffect(() => {
    const checkAndCompleteSession = async () => {
      if (timeRemaining <= 0 && isTimerRunning) {
        setIsTimerRunning(false);
        setShowTimeUpDialog(true);

        if (currentSessionId) {
          try {
            const { score, breakdown } = await calculateInterviewScore(
              messages,
              timeElapsed
            );
            const feedbackItems = await generateDetailedFeedback(
              messages,
              type,
              role
            );

            await updateInterviewSession(currentSessionId, {
              status: "completed",
              end_time: new Date().toISOString(),
              duration_seconds: timeElapsed,
              overall_score: score,
              score_breakdown: breakdown,
            });

            let feedbackSavedSuccessfully = true;
            for (const feedback of feedbackItems) {
              try {
                await addInterviewFeedback({
                  session_id: currentSessionId,
                  ...feedback,
                });
              } catch (feedbackError) {
                console.error(
                  `Failed to save feedback for question ${feedback.question_number}:`,
                  feedbackError
                );
                feedbackSavedSuccessfully = false;
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "ai",
                    content: `Feedback for Question ${feedback.question_number}: ${feedback.feedback_text}`,
                    type: "feedback",
                  },
                ]);
              }
            }

            if (!feedbackSavedSuccessfully) {
              toast({
                title: "Warning",
                description:
                  "Some feedback could not be saved to the database. It has been added to the transcript instead.",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error(
              "[InterviewSessionPage] Error completing session on time up:",
              error
            );
            toast({
              title: "Error",
              description:
                "Failed to save interview results. Please try again.",
              variant: "destructive",
            });
          }
        }
      }
    };

    checkAndCompleteSession();
  }, [
    timeRemaining,
    isTimerRunning,
    currentSessionId,
    messages,
    timeElapsed,
    type,
    role,
    toast,
  ]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const programmingLanguages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
    { value: "sql", label: "SQL" },
    { value: "shell", label: "Shell" },
  ];

  return (
    <div className="container max-w-7xl px-4 py-6">
      <div className="flex flex-col min-h-screen">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExitDialog(true)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-primary" />
                {type.charAt(0).toUpperCase() + type.slice(1)} Interview
              </h1>
              <p className="text-sm text-muted-foreground">
                {role} {company && `at ${company}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isTimerRunning && (
              <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Elapsed: {formatTime(timeElapsed)}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Clock
                    className={`h-4 w-4 ${
                      timeRemaining <= 60 ? "text-red-500" : "text-primary"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      timeRemaining <= 60 ? "text-red-500" : ""
                    }`}
                  >
                    Remaining: {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            )}

            {isStarted && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowExitDialog(true)}
                className="flex items-center"
              >
                End Interview
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleModeSwitch}
              className="hidden lg:flex items-center"
            >
              {interviewMode === "video" ? (
                <MessageSquare className="h-4 w-4 mr-2" />
              ) : (
                <VideoIcon className="h-4 w-4 mr-2" />
              )}
              Switch to {interviewMode === "video" ? "Text" : "Video"}
            </Button>
          </div>
        </header>

        {interviewMode === "video" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl overflow-hidden bg-black/90 shadow-lg"
            >
              <CameraPreview
                onTranscription={onTranscription}
                onAITranscription={onAITranscription}
                setWebSocketRef={setWebSocketRef}
                onTimerControl={onTimerControl}
                onConnectionError={onConnectionError}
                onStartInterview={handleStartVideoInterview}
                canCreateInterview={canCreateInterview}
                interviewContext={{
                  type,
                  role,
                  company: company || undefined,
                }}
              />
            </motion.div>

            <Card className="flex flex-col shadow-lg bg-card/50 backdrop-blur-sm border-2">
              <CardHeader className="pb-3 border-b bg-card/80">
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                  Interview Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea
                  className="h-[calc(100vh-280px)]"
                  ref={scrollAreaRef}
                >
                  <div className="p-4 space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={`msg-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${
                          message.role === "human"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`group relative max-w-[85%] px-4 py-3 rounded-2xl ${
                            message.role === "human"
                              ? "bg-primary text-primary-foreground ml-12"
                              : "bg-secondary text-secondary-foreground mr-12"
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col shadow-lg bg-card/50 backdrop-blur-sm border-2">
              <CardHeader className="pb-3 border-b bg-card/80">
                <CardTitle className="flex items-center text-lg">
                  <Info className="h-5 w-5 mr-2 text-primary" />
                  Interview Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea
                  className="h-[calc(100vh-280px)]"
                  ref={scrollAreaRef}
                >
                  <div className="p-4 space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={`msg-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${
                          message.role === "human"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`group relative max-w-[85%] px-4 py-3 rounded-2xl ${
                            message.role === "human"
                              ? "bg-primary text-primary-foreground ml-12"
                              : "bg-secondary text-secondary-foreground mr-12"
                          }`}
                        >
                          {(message.type === "code" ||
                            message.content.includes("```")) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all bg-background/80 backdrop-blur-sm shadow-lg"
                              onClick={() => {
                                const code =
                                  message.type === "code"
                                    ? message.content
                                    : message.content
                                        .match(/```[\s\S]*?```/g)?.[0]
                                        ?.replace(/```\w*\n?/g, "")
                                        .trim();
                                navigator.clipboard.writeText(
                                  code || message.content
                                );
                                toast({
                                  title: "Code Copied to Clipboard",
                                  description:
                                    "You can now paste it in the editor.",
                                  variant: "default",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}

                          {message.type === "code" ? (
                            <pre className="font-mono text-sm overflow-x-auto whitespace-pre-wrap p-2 bg-black/20 rounded-lg">
                              {message.content}
                            </pre>
                          ) : (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              {!isStarted ? (
                <Card className="flex-1 flex flex-col justify-center shadow-lg bg-card/50 backdrop-blur-sm border-2">
                  <CardContent className="text-center py-12">
                    <div className="mb-8">
                      <MessageSquare className="h-16 w-16 mx-auto text-primary mb-4" />
                      <h3 className="text-2xl font-semibold mb-2">
                        Ready to Start?
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Begin your {type} interview preparation
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You'll have 5 minutes to showcase your skills and
                        knowledge
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleStartTextInterview}
                      className="px-8 py-6 text-lg bg-green-500 hover:bg-green-600"
                      disabled={isStarting}
                    >
                      {isStarting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-2" />
                          Starting...
                        </div>
                      ) : (
                        <>
                          <Play className="h-6 w-6 mr-2" />
                          Start Interview
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex-1 flex flex-col shadow-lg bg-card/50 backdrop-blur-sm border-2">
                  <CardHeader className="pb-3 border-b bg-card/80">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-lg">
                        {isCodeMode ? (
                          <>
                            <CodeIcon className="h-5 w-5 mr-2 text-primary" />
                            Code Editor
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                            Your Response
                          </>
                        )}
                      </CardTitle>
                      {isCodeMode && (
                        <select
                          value={codeLanguage}
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          className="px-3 py-1.5 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary"
                          aria-label="Programming Language"
                        >
                          {programmingLanguages.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-4 overflow-hidden">
                    {isCodeMode ? (
                      <div className="h-[calc(100vh-360px)] rounded-lg border overflow-hidden">
                        <Editor
                          height="100%"
                          language={codeLanguage}
                          value={currentAnswer}
                          onChange={(value) => setCurrentAnswer(value || "")}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            formatOnPaste: true,
                            formatOnType: true,
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            padding: { top: 16, bottom: 16 },
                          }}
                        />
                      </div>
                    ) : (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className="h-[calc(100vh-360px)] resize-none focus:ring-2 focus:ring-primary text-base leading-relaxed"
                        disabled={timeRemaining <= 0 || isProcessing}
                      />
                    )}
                  </CardContent>

                  <CardFooter className="border-t pt-4 flex flex-col gap-2 bg-card/80">
                    {type === "technical" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setIsCodeMode(!isCodeMode)}
                      >
                        {isCodeMode ? (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Switch to Text
                          </>
                        ) : (
                          <>
                            <CodeIcon className="h-4 w-4 mr-2" />
                            Switch to Code Editor
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                      onClick={handleSendMessage}
                      disabled={
                        !currentAnswer.trim() ||
                        timeRemaining <= 0 ||
                        isProcessing
                      }
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Send Answer
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={showModeSwitchDialog}
        onOpenChange={setShowModeSwitchDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Interview Mode?</DialogTitle>
            <DialogDescription>
              {interviewMode === "video" ? (
                <>
                  Switching to text mode will stop the video recording and allow
                  you to type your responses. You'll still be timed, but you can
                  use the code editor for technical questions.
                </>
              ) : (
                <>
                  Switching to video mode will enable camera and microphone for
                  a more realistic interview experience. The AI will analyze
                  your verbal responses and body language.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModeSwitchDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmModeSwitch}>
              Switch to {interviewMode === "video" ? "Text" : "Video"} Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {connectionError ? "Connection Issue" : "End Interview?"}
            </DialogTitle>
            <DialogDescription>
              {connectionError ? (
                <>
                  We encountered an issue: {connectionError}. Please try again
                  later.
                </>
              ) : (
                "Are you sure you want to end this interview? Your progress will be saved."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {!connectionError && (
              <Button
                variant="outline"
                onClick={() => setShowExitDialog(false)}
              >
                Continue Interview
              </Button>
            )}
            <Button
              variant={connectionError ? "default" : "destructive"}
              onClick={handleExit}
              disabled={isEnding}
            >
              {isEnding ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  Ending...
                </div>
              ) : connectionError ? (
                "Close"
              ) : (
                "End Interview & View Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time's Up!</DialogTitle>
            <DialogDescription>
              Your 5-minute free interview session has ended. Your performance
              has been evaluated and feedback has been saved for your review.
              Upgrade to Pro to unlock unlimited session time, advanced video
              analysis, and more personalized feedback.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTimeUpDialog(false);
                router.push(
                  `/dashboard/interview/feedback/${currentSessionId}`
                );
              }}
            >
              View Feedback
            </Button>
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
