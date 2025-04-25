// lib/stripe/config.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_API_KEY!, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

export const getStripeUrl = () => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!;
};

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO_MONTHLY: 'price_1RFxsAHjllFf5pa1FFfPL8H6',
  PRO_ANNUAL: 'price_1RFxt6HjllFf5pa1zYz1d8z1',
  PRO_ELITE_ANNUAL: 'price_1RFxttHjllFf5pa1ngNXCRCX',
};

  // Helper function to calculate monthly price for annual plans
  export const calculateMonthlyPrice = (annualPrice: number): string => {
    return (annualPrice / 12).toFixed(2);
  };