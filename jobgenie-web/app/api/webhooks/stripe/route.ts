// app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/config";
import { supabaseService } from "@/lib/supabase/service"; // Import service client
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature")!;

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (userId && subscriptionId) {
          // Retrieve subscription details with expansion
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
              expand: ["latest_invoice", "default_payment_method"],
            }
          );

          const priceId = subscription.items.data[0].price.id;

          // Get the plan name from your subscription plans table using service client
          const { data: plan } = await supabaseService
            .from("subscription_plans")
            .select("name")
            .eq("stripe_price_id", priceId)
            .single();

          // Get the current period end from the latest invoice or calculate it
          let currentPeriodEnd = null;
          if (
            subscription.latest_invoice &&
            typeof subscription.latest_invoice === "object" &&
            "period_end" in subscription.latest_invoice
          ) {
            currentPeriodEnd = subscription.latest_invoice.period_end;
          } else if ("current_period_end" in subscription) {
            currentPeriodEnd = subscription.current_period_end;
          } else {
            // Calculate based on start date and interval
            const startDate = subscription.start_date;
            const intervalCount =
              subscription.items.data[0].price.recurring?.interval_count || 1;
            const interval =
              subscription.items.data[0].price.recurring?.interval || "month";

            const endDate = new Date(startDate * 1000);
            if (interval === "year") {
              endDate.setFullYear(endDate.getFullYear() + intervalCount);
            } else if (interval === "month") {
              endDate.setMonth(endDate.getMonth() + intervalCount);
            }
            currentPeriodEnd = Math.floor(endDate.getTime() / 1000);
          }

          // Create or update user subscription in database using service client
          const { error } = await supabaseService
            .from("user_subscriptions")
            .upsert(
              {
                user_id: userId,
                subscription_type: plan?.name.toLowerCase().includes("pro")
                  ? "pro"
                  : "free",
                status: "active",
                stripe_subscription_id: subscription.id,
                stripe_price_id: priceId,
                stripe_current_period_end:
                  typeof currentPeriodEnd === "number"
                    ? new Date(currentPeriodEnd * 1000).toISOString()
                    : null,
                stripe_customer_id: customerId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );

          if (error) {
            console.error("Error upserting subscription:", error);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user by stripe_customer_id using service client
        const { data: userSubscription } = await supabaseService
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (userSubscription) {
          // Get the current period end
          let currentPeriodEnd = null;
          const subscriptionWithPeriodEnd =
            subscription as Stripe.Subscription & {
              current_period_end?: number;
            };

          if (
            typeof subscriptionWithPeriodEnd.current_period_end === "number"
          ) {
            // Use the subscription's current_period_end directly if available
            currentPeriodEnd = subscriptionWithPeriodEnd.current_period_end;
          } else {
            // Calculate end date based on subscription details
            const startDateTimestamp = subscription.start_date;
            const interval =
              subscription.items.data[0].price.recurring?.interval || "month";
            const intervalCount =
              subscription.items.data[0].price.recurring?.interval_count || 1;

            // Calculate end timestamp - for annual subscription, add 1 year (in seconds)
            if (interval === "year") {
              currentPeriodEnd =
                startDateTimestamp + intervalCount * 365 * 24 * 60 * 60;
            } else if (interval === "month") {
              // Approximate month as 30 days
              currentPeriodEnd =
                startDateTimestamp + intervalCount * 30 * 24 * 60 * 60;
            }
          }

          // Update subscription status using service client
          const status =
            subscription.status === "active"
              ? "active"
              : subscription.status === "canceled"
              ? "cancelled"
              : "expired";

          await supabaseService
            .from("user_subscriptions")
            .update({
              status,
              stripe_current_period_end:
                typeof currentPeriodEnd === "number"
                  ? new Date(currentPeriodEnd * 1000).toISOString()
                  : null,
              stripe_cancel_at: subscription.cancel_at
                ? new Date(subscription.cancel_at * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          "subscription" in invoice && typeof invoice.subscription === "string"
            ? invoice.subscription
            : undefined;

        if (subscriptionId) {
          // Get the user ID from the subscription using service client
          const { data: userSubscription } = await supabaseService
            .from("user_subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (userSubscription) {
            // Record payment using service client
            await supabaseService.from("payment_history").insert({
              user_id: userSubscription.user_id,
              stripe_payment_intent_id:
                "payment_intent" in invoice && invoice.payment_intent
                  ? String(invoice.payment_intent)
                  : null,
              amount: invoice.amount_paid / 100, // Convert cents to dollars
              currency: invoice.currency,
              status: "succeeded",
              payment_method: invoice.collection_method || "card",
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
