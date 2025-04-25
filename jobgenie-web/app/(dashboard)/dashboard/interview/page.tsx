"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/stores/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  Briefcase,
  Users,
  Code,
  AlertCircle,
  Info,
  Clock,
  Trophy,
  Star,
} from "lucide-react";
import LoadingIndicator from "@/components/ui/loading-indicator";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import genieAnimation from "@/assets/animations/genie-animation.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  checkInterviewLimits,
  getUserSubscription,
  getInterviewHistory,
  UserSubscription,
  InterviewSession,
} from "@/lib/supabase/interview";
import { useDebounce } from "use-debounce";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";

export default function InterviewPage() {
  // State variables with separate loading states
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [interviewHistory, setInterviewHistory] = useState<InterviewSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  const [selectedInterviewType, setSelectedInterviewType] = useState<"behavioral" | "technical" | "general">("behavioral");
  
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  
  const [interviewLimits, setInterviewLimits] = useState<{
    canCreateInterview: boolean;
    remainingInterviews: number;
  } | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(true);

  // Use debounced values to prevent UI flickering
  const [debouncedSubscription] = useDebounce(userSubscription, 300);
  const [debouncedLimits] = useDebounce(interviewLimits, 300);
  const [debouncedHistory] = useDebounce(interviewHistory, 300);

  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  // Fetch all user data in parallel
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Fetch profile
      fetchProfile();
      
      // Fetch subscription, limits, and interview history in parallel
      await Promise.all([
        fetchSubscription(),
        fetchLimits(),
        fetchInterviewHistory()
      ]);
    };

    fetchUserData();
  }, [user]);

  // Separate fetch functions to handle errors independently
  const fetchProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
        if (profileData.experience?.currentTitle) {
          setRole(profileData.experience.currentTitle);
        }
      } else if (profileError) {
        throw profileError;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Profile Error",
        description: "Failed to load your profile data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;
    
    setSubscriptionLoading(true);
    try {
      const subscription = await getUserSubscription(user.id);
      setUserSubscription(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast({
        title: "Subscription Error",
        description: "Failed to load your subscription info. Some features may be limited.",
        variant: "destructive",
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchLimits = async () => {
    if (!user) return;
    
    setLimitsLoading(true);
    try {
      const limits = await checkInterviewLimits(user.id);
      setInterviewLimits(limits);
    } catch (error) {
      console.error("Error fetching interview limits:", error);
      toast({
        title: "Limits Error",
        description: "Failed to check your interview limits. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLimitsLoading(false);
    }
  };

  const fetchInterviewHistory = async () => {
    if (!user) return;
    
    setHistoryLoading(true);
    try {
      const interviews = await getInterviewHistory(user.id);
      setInterviewHistory(interviews);
    } catch (error) {
      console.error("Error fetching interview history:", error);
      toast({
        title: "History Error",
        description: "Failed to load your interview history. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!role) {
      toast({
        title: "Role Required",
        description: "Please enter the job role you're interviewing for",
        variant: "destructive",
      });
      return;
    }

    // Check limits again before starting
    if (user) {
      try {
        const { canCreateInterview: currentCanCreate } = await checkInterviewLimits(user.id);
        
        if (!currentCanCreate) {
          toast({
            title: "Interview Limit Reached",
            description: "You've used all your free interviews this month. Upgrade to Pro for unlimited interviews.",
            variant: "destructive",
            action: (
              <Button onClick={() => router.push("/pricing")}>
                Upgrade Now
              </Button>
            ),
          });
          return;
        }
        
        setShowConfirmDialog(true);
      } catch (error) {
        console.error("Error checking limits:", error);
        toast({
          title: "Error",
          description: "Failed to verify your interview limits. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const confirmInterview = () => {
    router.push(
      `/dashboard/interview/session?type=${selectedInterviewType}&role=${encodeURIComponent(
        role
      )}&company=${encodeURIComponent(company || "")}`
    );
  };

  const handleViewInterview = (interview: InterviewSession) => {
    router.push(
      `/dashboard/interview/session/${interview.id}`
    );
  };

  // Show component-level loading indicators instead of a global one
  const isPageLoading = profileLoading && subscriptionLoading && limitsLoading && historyLoading;
  
  if (isPageLoading) {
    return <LoadingIndicator message="Setting up your interview coach..." />;
  }

  const isFreeTier = !debouncedSubscription?.subscription_type || debouncedSubscription.subscription_type === "free";
  const totalAllowedInterviews = 3; // Free tier limit

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interview Coach</h1>
        <p className="text-muted-foreground">
          Practice for your next job interview with AI-powered feedback
        </p>
      </div>

      {/* Interview Limits Display */}
      {isFreeTier && debouncedLimits && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Monthly Interviews</h3>
                    <p className="text-sm text-muted-foreground">
                      {debouncedLimits.remainingInterviews} of {totalAllowedInterviews} interviews remaining
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/pricing")}
                >
                  Upgrade for Unlimited
                </Button>
              </div>
              <Progress 
                value={(debouncedLimits.remainingInterviews / totalAllowedInterviews) * 100} 
                className="h-2"
              />
              {debouncedLimits.remainingInterviews === 0 ? (
                <p className="text-sm text-destructive mt-2">
                  You've reached your monthly limit. Upgrade to Pro to continue practicing.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Resets on the first of each month.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column - Start New Interview */}
        <div className="flex flex-col space-y-6">
          {/* Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden">
              {isFreeTier ? (
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Upgrade to Pro</h3>
                      <p className="text-indigo-100">
                        Unlock unlimited sessions, longer interview times, and advanced feedback
                      </p>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <p className="text-sm">
                          Free: 5-minute sessions | Pro: Up to 45 minutes
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <span className="text-white">
                        <AlertCircle className="h-6 w-6" />
                      </span>
                    </div>
                  </div>
                  <Button
                    className="mt-4 bg-white text-indigo-600 hover:bg-indigo-50"
                    onClick={() => router.push("/pricing")}
                  >
                    Upgrade Now
                  </Button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-600 to-teal-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">You're a Pro Member!</h3>
                      <p className="text-green-100">
                        Enjoy unlimited sessions, extended interview times, and detailed feedback
                      </p>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <p className="text-sm">
                          Up to {debouncedSubscription?.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL
                            ? "45 minutes"
                            : debouncedSubscription?.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ANNUAL
                            ? "15 minutes"
                            : "10 minutes"} per session
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <span className="text-white">
                        <Star className="h-6 w-6" />
                      </span>
                    </div>
                  </div>
                  <Button
                    className="mt-4 bg-white text-green-600 hover:bg-green-50"
                    onClick={() => router.push("/dashboard/interview/resources/interview-tips")}
                  >
                    Explore Pro Tips
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Interview Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Start a New Interview</CardTitle>
                <CardDescription>
                  Choose an interview type and enter the role details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs
                  defaultValue="behavioral"
                  onValueChange={(v) =>
                    setSelectedInterviewType(
                      v as "behavioral" | "technical" | "general"
                    )
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                  </TabsList>
                  <TabsContent value="behavioral" className="mt-4 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">Behavioral Interview</h4>
                        <p className="text-sm text-muted-foreground">
                          Practice answering questions about your experience,
                          soft skills, and past behavior
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="technical" className="mt-4 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-100 p-3 rounded-full text-green-600 dark:bg-green-900/30 dark:text-green-300">
                        <Code className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">Technical Interview</h4>
                        <p className="text-sm text-muted-foreground">
                          Answer technical questions related to your field and
                          demonstrate problem-solving skills
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="general" className="mt-4 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 p-3 rounded-full text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">General Interview</h4>
                        <p className="text-sm text-muted-foreground">
                          Mix of common interview questions across different
                          areas to help with overall preparation
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Job Role
                    </label>
                    <input
                      id="role"
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. Frontend Developer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">
                      Company (Optional)
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. TechCorp"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleStartInterview}
                  disabled={limitsLoading || (debouncedLimits ? !debouncedLimits.canCreateInterview : false)}
                >
                  {limitsLoading 
                    ? "Checking limits..."
                    : debouncedLimits && !debouncedLimits.canCreateInterview 
                      ? "Interview Limit Reached" 
                      : "Start Interview"}
                </Button>
              </CardContent>
            </Card>
            <Dialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Ready to Start Your Interview?</DialogTitle>
                  <DialogDescription>
                    You're about to start a {selectedInterviewType} interview
                    for the {role} position
                    {company ? ` at ${company}` : ""}.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <p className="text-sm">This AI-powered interview will:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Ask you relevant questions for this role</li>
                    <li>Listen to your verbal responses with a professional voice</li>
                    <li>Analyze your video for body language and presentation</li>
                    <li>Provide feedback on your answers</li>
                  </ul>

                  <div className="flex items-center space-x-2 text-sm font-medium bg-muted p-3 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span>
                      {debouncedSubscription?.subscription_type === "pro"
                        ? `Session duration: ${
                            debouncedSubscription.stripe_price_id ===
                            SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL
                              ? "45"
                              : debouncedSubscription.stripe_price_id ===
                                SUBSCRIPTION_PLANS.PRO_ANNUAL
                              ? "15"
                              : "10"
                          } minutes`
                        : "Free session: 5 minutes"}
                    </span>
                  </div>

                  {isFreeTier && debouncedLimits && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        You'll have {debouncedLimits.remainingInterviews - 1} interview{debouncedLimits.remainingInterviews === 2 ? "" : "s"} remaining after this session.
                      </p>
                    </div>
                  )}

                  <p className="text-sm font-medium">
                    The interview requires camera and microphone access.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={confirmInterview}>Start Interview</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        {/* Right Column - Interview History & Tips */}
        <div className="flex flex-col space-y-6">
          {/* Recent Interviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Interviews</CardTitle>
                  <CardDescription>
                    Your previous practice sessions
                  </CardDescription>
                </div>
                {debouncedHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/interview/history")}
                  >
                    See All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="py-8 flex justify-center">
                    <LoadingIndicator message="Loading your interview history..." />
                  </div>
                ) : debouncedHistory.length > 0 ? (
                  <div className="space-y-4">
                    {debouncedHistory.slice(0, 3).map((interview) => (
                      <div
                        key={interview.id}
                        className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleViewInterview(interview)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`rounded-full p-2 ${
                                interview.interview_type === "behavioral"
                                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                  : interview.interview_type === "technical"
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                              }`}
                            >
                              {interview.interview_type === "behavioral" ? (
                                <Users className="h-4 w-4" />
                              ) : interview.interview_type === "technical" ? (
                                <Code className="h-4 w-4" />
                              ) : (
                                <Briefcase className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{interview.role}</h4>
                              <p className="text-sm text-muted-foreground">
                                {interview.company || "General Practice"}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(interview.start_time).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium mr-2">
                              Status:
                            </span>
                            <span className={`text-sm ${
                              interview.status === "completed" ? "text-green-600" : 
                              interview.status === "in_progress" ? "text-yellow-600" : 
                              "text-red-600"
                            }`}>
                              {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-32 w-32 mb-4">
                      <Lottie animationData={genieAnimation} loop />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      No interviews yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Start your first practice interview to prepare for your
                      next job opportunity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Interview Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Interview Tips</CardTitle>
                <CardDescription>Advice to help you succeed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Use the STAR Method</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Structure your answers to behavioral questions using
                        Situation, Task, Action, Result format
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Practice Speaking Clearly</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our AI listens to your tone, pace, and clarity
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Mind Your Body Language</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        The AI analyzes your video for posture and engagement
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => router.push("/dashboard/interview/resources/interview-tips")}
                >
                  More Tips
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
