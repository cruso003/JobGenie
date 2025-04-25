"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle, Star } from "lucide-react";
import {
  getInterviewSession,
  getInterviewFeedback,
  InterviewSession,
  InterviewFeedback,
  UserSubscription,
  getUserSubscription as getUserSubscriptionFromServer,
} from "@/lib/supabase/interview";
import { useAuthStore } from "@/lib/stores/auth";

export default function InterviewFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const [userSubscription, setUserSubscription] =
    useState<UserSubscription | null>(null);

  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (user?.subscription) {
        setUserSubscription(user.subscription);
      } else if (user?.id) {
        // Await the Promise and get the actual subscription data
        const subscription = await getUserSubscriptionFromServer(user.id);
        setUserSubscription(subscription);
      }
    };

    fetchUserSubscription();
  }, [user]);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user || !sessionId) return;

      try {
        const sessionData = await getInterviewSession(sessionId);

        // Verify this session belongs to the user
        if (sessionData?.user_id !== user.id) {
          router.push("/dashboard/interview");
          return;
        }

        const feedbackData = await getInterviewFeedback(sessionId);

        setSession(sessionData);
        setFeedback(feedbackData);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [sessionId, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p>Interview session not found.</p>
        <Button
          onClick={() => router.push("/dashboard/interview")}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/interview")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Interview Feedback</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>
            {session.interview_type.charAt(0).toUpperCase() +
              session.interview_type.slice(1)}{" "}
            Interview
          </span>
          <span>•</span>
          <span>{session.role}</span>
          {session.company && (
            <>
              <span>•</span>
              <span>{session.company}</span>
            </>
          )}
        </div>
      </header>

      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold">
                {session.overall_score || 0}%
              </div>
              <p className="text-muted-foreground">Overall Score</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {Math.floor((session.duration_seconds || 0) / 60)} minutes
              </div>
              <p className="text-muted-foreground">Interview Duration</p>
            </div>
          </div>
          <Progress value={session.overall_score || 0} className="h-2" />

          {/* Add Score Breakdown Section */}
          {session.score_breakdown && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Score Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(session.score_breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={value} className="w-24 h-1.5" />
                      <span className="text-sm font-medium">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Question-by-Question Feedback
        </h2>

        {feedback.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Question {item.question_number}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {item.question_text}
                  </p>
                </div>
                <Badge
                  variant={
                    item.score >= 80
                      ? "default"
                      : item.score >= 60
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {item.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Your Answer:</h4>
                <div className="bg-muted/50 p-3 rounded-lg">
                  {item.code_submission ? (
                    <pre className="text-sm overflow-x-auto">
                      <code>{item.code_submission}</code>
                    </pre>
                  ) : (
                    <p className="text-sm">{item.user_answer}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Feedback:</h4>
                <p className="text-sm">{item.feedback_text}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Strengths:
                  </h4>
                  <ul className="text-sm space-y-1">
                    {item.strengths.map((strength, idx) => (
                      <li key={idx} className="ml-6">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    Areas for Improvement:
                  </h4>
                  <ul className="text-sm space-y-1">
                    {item.areas_for_improvement.map((area, idx) => (
                      <li key={idx} className="ml-6">
                        • {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA for Pro Users */}
      {userSubscription?.subscription_type !== "pro" && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="text-center py-8">
            <Star className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Want More Detailed Feedback?
            </h3>
            <p className="text-muted-foreground mb-4">
              Upgrade to Pro for video analysis, body language feedback, and
              unlimited interview sessions.
            </p>
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-primary"
            >
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
