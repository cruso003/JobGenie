// app/dashboard/subscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth";
import LoadingIndicator from "@/components/ui/loading-indicator";
import { format } from "date-fns";
import { Crown, CreditCard, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getUserSubscription } from "@/lib/supabase/interview";
import { supabase } from "@/lib/supabase";

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [managingBilling, setManagingBilling] = useState(false);
  const { user } = useAuthStore();
    const { toast } = useToast();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        try {
          const sub = await getUserSubscription(user.id);
          setSubscription(sub);
        } catch (error) {
          console.error('Error fetching subscription:', error);
          toast({
            title: "Error",
            description: "Failed to load subscription details",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };

    fetchSubscription();
  }, [user]);

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      // Get the session from Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("No active session found");
      }
      
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create portal session");
      }
  
      const { url } = await response.json();
  
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error during billing management:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setManagingBilling(false);
    }
  };

  if (loading) {
    return <LoadingIndicator message="Loading subscription details..." />;
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">Manage your JobGenie subscription and billing</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${subscription?.subscription_type === 'pro' ? 'text-yellow-500' : 'text-gray-400'}`} />
            Current Plan
          </CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Plan:</span>
              <span className="capitalize">{subscription?.subscription_type || 'Free'}</span>
            </div>
            
            {subscription?.subscription_type === 'pro' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <span className={`capitalize px-2 py-1 rounded-full text-sm ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Renews on:</span>
                  <span>
                    {subscription.stripe_current_period_end 
                      ? format(new Date(subscription.stripe_current_period_end), 'MMMM d, yyyy')
                      : 'N/A'}
                  </span>
                </div>

                {subscription.stripe_cancel_at && (
                  <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 p-3 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                    <span>
                      Your subscription will end on {format(new Date(subscription.stripe_cancel_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Settings
          </CardTitle>
          <CardDescription>Manage your payment methods and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription?.subscription_type === 'pro' ? (
            <Button 
              onClick={handleManageBilling} 
              disabled={managingBilling}
              className="w-full md:w-auto"
            >
              {managingBilling ? "Opening Portal..." : "Manage Billing"}
            </Button>
          ) : (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
              <p className="text-muted-foreground mb-4">
                Unlock unlimited interviews, advanced features, and priority support
              </p>
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="bg-primary"
              >
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
