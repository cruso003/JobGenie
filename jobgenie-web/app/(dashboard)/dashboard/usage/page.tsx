// app/dashboard/usage/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { checkInterviewLimits } from "@/lib/supabase/interview";
import { checkDocumentLimits } from "@/lib/supabase/documents";
import { getUserSubscription } from "@/lib/supabase/interview";
import { useAuthStore } from "@/lib/stores/auth";
import { FileText, MessageSquare, Video } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";

export default function UsagePage() {
  const [interviewLimits, setInterviewLimits] = useState<any>(null);
  const [documentLimits, setDocumentLimits] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchUsageData = async () => {
      if (user) {
        const [sub, interviews, documents] = await Promise.all([
          getUserSubscription(user.id),
          checkInterviewLimits(user.id),
          checkDocumentLimits(user.id)
        ]);
        
        setSubscription(sub);
        setInterviewLimits(interviews);
        setDocumentLimits(documents);
      }
    };

    fetchUsageData();
  }, [user]);

  const getProgressValue = (used: number, max: number, isUnlimited: boolean) => {
    if (isUnlimited) return 100;
    if (max === 0) return 0;
    return (used / max) * 100;
  };

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Usage Dashboard</h1>
        <p className="text-muted-foreground">
          Track your JobGenie usage and limits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviewLimits && (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Used this month</span>
                    <span>
                      {interviewLimits.remainingInterviews === -1 
                        ? "Unlimited" 
                        : `${3 - interviewLimits.remainingInterviews} / 3`}
                    </span>
                  </div>
                  <Progress 
                    value={getProgressValue(
                      3 - interviewLimits.remainingInterviews, 
                      3, 
                      interviewLimits.remainingInterviews === -1
                    )} 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {interviewLimits.remainingInterviews === -1 
                    ? "Unlimited interviews with Pro subscription" 
                    : `${interviewLimits.remainingInterviews} interviews remaining`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentLimits && (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Generated this month</span>
                    <span>
                      {documentLimits.isUnlimited 
                        ? "Unlimited" 
                        : `${3 - documentLimits.remainingResumes} / 3`}
                    </span>
                  </div>
                  <Progress 
                    value={getProgressValue(
                      3 - documentLimits.remainingResumes, 
                      3, 
                      documentLimits.isUnlimited
                    )} 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {documentLimits.isUnlimited 
                    ? "Unlimited resumes with Pro subscription" 
                    : `${documentLimits.remainingResumes} resumes remaining`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Cover Letters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentLimits && (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Generated this month</span>
                    <span>
                      {documentLimits.isUnlimited 
                        ? "Unlimited" 
                        : `${3 - documentLimits.remainingCoverLetters} / 3`}
                    </span>
                  </div>
                  <Progress 
                    value={getProgressValue(
                      3 - documentLimits.remainingCoverLetters, 
                      3, 
                      documentLimits.isUnlimited
                    )} 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {documentLimits.isUnlimited 
                    ? "Unlimited cover letters with Pro subscription" 
                    : `${documentLimits.remainingCoverLetters} cover letters remaining`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Duration Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Video Interviews</h3>
                <p className="text-muted-foreground">
                  {subscription?.subscription_type === 'pro' 
                    ? `${subscription.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL ? '45' : '15'} minutes per session`
                    : '5 minutes per session'}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Text Interviews</h3>
                <p className="text-muted-foreground">
                  {subscription?.subscription_type === 'pro' 
                    ? `${subscription.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL ? 'Unlimited' : '30 minutes'} per session`
                    : '5 minutes per session'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
