"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});
import cancelAnimation from "@/assets/animations/cancel-animation.json";

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="container max-w-4xl py-12 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lottie animationData={cancelAnimation} loop={false} className="h-32 w-32" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-600">
              Subscription Canceled
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              It looks like you canceled your subscription attempt. No worries—we’re here to help!
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Message Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">What’s Next?</h3>
              <div className="flex items-start space-x-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-500 mt-1" />
                <div>
                  <h4 className="font-medium text-red-700 dark:text-red-300">
                    You&apos;re Still on the Free Plan
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro to unlock unlimited interview sessions, extended session times, and advanced feedback.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">
                Ready to give it another try or explore other options?
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => router.push("/pricing")}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Need help?{" "}
                <a
                  href="mailto:support@jobgenie.com"
                  className="text-primary hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
