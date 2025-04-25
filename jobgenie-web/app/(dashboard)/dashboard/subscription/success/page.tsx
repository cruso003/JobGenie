
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});
import successAnimation from "@/assets/animations/success-animation.json";
import { useAuthStore } from "@/lib/stores/auth";
import { getUserSubscription, UserSubscription } from "@/lib/supabase/interview";
import { useToast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's subscription to display plan details
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const subscription = await getUserSubscription(user.id);
        setUserSubscription(subscription);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast({
          title: "Error",
          description: "Failed to load your subscription details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, router, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!userSubscription || userSubscription.subscription_type !== "pro") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Subscription Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              It looks like your subscription wasn’t processed correctly.
            </p>
            <Button onClick={() => router.push("/pricing")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionDuration =
    userSubscription.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL
      ? "45 minutes"
      : userSubscription.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ANNUAL
      ? "15 minutes"
      : "10 minutes";

  return (
    <div className="container max-w-4xl py-12 min-h-screen flex items-center justify-center px-4 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lottie animationData={successAnimation} loop={false} className="h-32 w-32" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Subscription Successful!
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Welcome to JobGenie Pro! You&apos;re now ready to take your interview prep to the next level.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Benefits Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Your Pro Benefits</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Unlimited Interview Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      Practice as much as you want with no monthly limits.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Extended Session Times</h4>
                    <p className="text-sm text-muted-foreground">
                      Up to {sessionDuration} per session for deeper practice.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Advanced Feedback</h4>
                    <p className="text-sm text-muted-foreground">
                      Get detailed insights on your performance, including body language analysis.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Pro Interview Tips</h4>
                    <p className="text-sm text-muted-foreground">
                      Access exclusive resources to ace your interviews.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">
                Ready to start practicing with your new Pro features?
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => router.push("/dashboard/interview")}
                >
                  Start an Interview Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/interview/resources/interview-tips")}
                >
                  Explore Pro Tips
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
