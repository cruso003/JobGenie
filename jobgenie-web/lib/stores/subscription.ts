import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS } from '../stripe/config';

interface Subscription {
  id: string;
  user_id: string;
  subscription_type: string;
  stripe_price_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  stripe_current_period_end: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionState {
  subscription: Subscription | null;
  resumeLimit: number;
  resumeCount: number;
  fetchSubscription: (userId: string) => Promise<void>;
  incrementResumeCount: (userId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  resumeLimit: 3, // Default for Free plan
  resumeCount: 0,
  fetchSubscription: async (userId: string) => {
    if (!userId) return;

    try {
      // Fetch subscription from the user_subscriptions table
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      let resumeLimit = 3; // Default for Free plan
      if (data) {
        console.log('Subscription data:', data);
        
        // Determine resume limits based on subscription_type and stripe_price_id
        if (data.subscription_type === 'pro') {
          if (data.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL) { // Pro Elite Annual
            resumeLimit = Infinity;
          } else if (data.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ANNUAL) { // Pro Annual
            resumeLimit = Infinity;
          } else { // Pro Monthly (price_1RFxsAHjllFf5pa1FFfPL8H6)
            resumeLimit = 10;
          }
        }
      }

      // Fetch resume count for the current month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('document_type', 'resume')
        .gte('created_at', startOfMonth);

      set({ 
        subscription: data || null, 
        resumeLimit, 
        resumeCount: count || 0,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  },
  incrementResumeCount: async (userId: string) => {
    if (!userId) return;
    set((state) => ({ resumeCount: state.resumeCount + 1 }));
  },
}));
