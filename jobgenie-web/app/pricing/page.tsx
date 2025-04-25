// app/pricing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X, Sparkles } from "lucide-react";
import {
  getSubscriptionPlans,
  SubscriptionPlan,
} from "@/lib/stripe/subscription";
import { useAuthStore } from "@/lib/stores/auth";
import LoadingIndicator from "@/components/ui/loading-indicator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "year"
  );
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();


  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const subscriptionPlans = await getSubscriptionPlans();
        setPlans(subscriptionPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);
  

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }
  
    setSelectedPlan(priceId);
    setIsCheckoutLoading(true);
  
    try {
      // Get the session from the Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("No active session found");
      }
      
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ priceId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start checkout process";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCheckoutLoading(false);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return <LoadingIndicator message="Loading subscription plans..." />;
  }

  const filteredPlans = plans.filter(
    (plan) => plan.interval === billingInterval || plan.price === 0
  );

  return (
    <div className="container max-w-7xl py-16 px-4 mx-auto ">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Affordable Pricing</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Start your interview preparation journey for as low as{" "}
          <span className="font-bold">$3.24/month</span>
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant={billingInterval === "month" ? "default" : "outline"}
            onClick={() => setBillingInterval("month")}
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === "year" ? "default" : "outline"}
            onClick={() => setBillingInterval("year")}
          >
            Yearly
            <Badge variant="secondary" className="ml-2">
              Save 19%
            </Badge>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => {
          const isAnnual = plan.interval === "year";
          const monthlyPrice = isAnnual
            ? (plan.price / 12).toFixed(2)
            : plan.price;
          const isPopular = plan.name === "Pro Annual";
          const isElite = plan.name === "Pro Elite Annual";

          return (
            <Card
              key={plan.id}
              className={`relative ${
                isPopular ? "border-primary shadow-lg scale-105" : ""
              } ${isElite ? "border-amber-500" : ""}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              {isElite && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">
                  {plan.name.replace(" Annual", "")}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-8">
                  {plan.price === 0 ? (
                    <div>
                      <span className="text-4xl font-bold">Free</span>
                      <span className="text-muted-foreground ml-2">
                        forever
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold">
                        ${monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {isAnnual && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Billed ${plan.price} annually
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.startsWith("X") ? (
                        <X className="h-5 w-5 text-destructive mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span>{feature.replace("X ", "")}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.price === 0 ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Get Started
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${isPopular ? "bg-primary" : ""} ${
                      isElite ? "bg-amber-500 hover:bg-amber-600" : ""
                    }`}
                    onClick={() => handleSubscribe(plan.stripe_price_id)}
                    disabled={
                      isCheckoutLoading && selectedPlan === plan.stripe_price_id
                    }
                  >
                    {isCheckoutLoading && selectedPlan === plan.stripe_price_id
                      ? "Processing..."
                      : isPopular
                      ? "Get Best Value"
                      : "Subscribe Now"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Compare All Features
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4">Feature</th>
                <th className="text-center py-4 px-4">Free</th>
                <th className="text-center py-4 px-4">Pro Monthly</th>
                <th className="text-center py-4 px-4">Pro Annual</th>
                <th className="text-center py-4 px-4">Pro Elite</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">Interviews per month</td>
                <td className="text-center py-4 px-4">3</td>
                <td className="text-center py-4 px-4">10</td>
                <td className="text-center py-4 px-4">Unlimited</td>
                <td className="text-center py-4 px-4">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">Video interviews</td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">
                  Video session duration
                </td>
                <td className="text-center py-4 px-4">5 min</td>
                <td className="text-center py-4 px-4">10 min</td>
                <td className="text-center py-4 px-4">15 min</td>
                <td className="text-center py-4 px-4">45 min</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">Text session duration</td>
                <td className="text-center py-4 px-4">5 min</td>
                <td className="text-center py-4 px-4">20 min</td>
                <td className="text-center py-4 px-4">30 min</td>
                <td className="text-center py-4 px-4">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">
                  Body Language Analysis
                </td>
                <td className="text-center py-4 px-4">Basic</td>
                <td className="text-center py-4 px-4">Standard</td>
                <td className="text-center py-4 px-4">Advanced</td>
                <td className="text-center py-4 px-4">Advanced</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">AI Feedback</td>
                <td className="text-center py-4 px-4">Basic</td>
                <td className="text-center py-4 px-4">Standard</td>
                <td className="text-center py-4 px-4">Advanced</td>
                <td className="text-center py-4 px-4">Advanced</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">Resumes per month</td>
                <td className="text-center py-4 px-4">3</td>
                <td className="text-center py-4 px-4">10</td>
                <td className="text-center py-4 px-4">Unlimited</td>
                <td className="text-center py-4 px-4">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 font-medium">
                  Cover letters per month
                </td>
                <td className="text-center py-4 px-4">3</td>
                <td className="text-center py-4 px-4">10</td>
                <td className="text-center py-4 px-4">Unlimited</td>
                <td className="text-center py-4 px-4">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto text-left grid gap-6">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">
              How does the annual billing save me money?
            </h3>
            <p className="text-muted-foreground">
              By choosing annual billing, you save 19% compared to monthly
              payments. For example, the Pro Annual plan costs just $3.24/month
              when billed annually, compared to $3.99/month on the monthly plan.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">
              Can I switch plans after subscribing?
            </h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. When
              upgrading, you'll only pay the prorated difference. When
              downgrading, the change will take effect at the end of your
              billing period.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">
              What happens to my progress if I cancel?
            </h3>
            <p className="text-muted-foreground">
              All your interview history, feedback, and achievements remain
              accessible even if you cancel. You can always resubscribe to
              continue where you left off.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">
              Do you offer student discounts?
            </h3>
            <p className="text-muted-foreground">
              Yes! Students with a valid .edu email address receive a 20%
              discount on all plans. Contact our support team to get your
              student discount code.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-12 text-center bg-muted/50 py-8 px-4 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">
          30-Day Money-Back Guarantee
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We're confident you'll love JobGenie. If you're not satisfied within
          the first 30 days, we'll refund your money—no questions asked.
        </p>
      </div>
    </div>
  );
}
