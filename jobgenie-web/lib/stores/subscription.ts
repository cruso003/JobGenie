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
  coverLetterLimit: number;
  coverLetterCount: number;
  interviewLimit: number;
  interviewCount: number;
  lastResetDate: string | null;
  fetchSubscription: (userId: string) => Promise<void>;
  incrementResumeCount: (userId: string) => Promise<void>;
  incrementCoverLetterCount: (userId: string) => Promise<void>;
  incrementInterviewCount: (userId: string) => Promise<void>;
  resetCountsIfNeeded: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  resumeLimit: 3, // Default for Free plan
  resumeCount: 0,
  coverLetterLimit: 3, // Default for Free plan
  coverLetterCount: 0,
  interviewLimit: 3, // Default for Free plan
  interviewCount: 0,
  lastResetDate: null,

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

      let resumeLimit = 3;
      let coverLetterLimit = 3;
      let interviewLimit = 3;

      if (data) {
        console.log('Subscription data:', data);
        if (data.subscription_type === 'pro') {
          if (data.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ELITE_ANNUAL) { // Pro Elite Annual
            resumeLimit = Infinity;
            coverLetterLimit = Infinity;
            interviewLimit = Infinity;
          } else if (data.stripe_price_id === SUBSCRIPTION_PLANS.PRO_ANNUAL) { // Pro Annual
            resumeLimit = Infinity;
            coverLetterLimit = Infinity;
            interviewLimit = Infinity;
          } else { // Pro Monthly
            resumeLimit = 10;
            coverLetterLimit = 10;
            interviewLimit = Infinity; // Pro plans typically have unlimited interviews
          }
        }
      }

      // Determine the start of the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch counts for the current month
      const { count: resumeCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('document_type', 'resume')
        .gte('created_at', startOfMonth);

      const { count: coverLetterCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('document_type', 'cover_letter')
        .gte('created_at', startOfMonth);

      const { count: interviewCount } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('start_time', startOfMonth);

      set({
        subscription: data || null,
        resumeLimit,
        resumeCount: resumeCount || 0,
        coverLetterLimit,
        coverLetterCount: coverLetterCount || 0,
        interviewLimit,
        interviewCount: interviewCount || 0,
        lastResetDate: startOfMonth,
      });

      // Check if reset is needed
      get().resetCountsIfNeeded();
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  },

  incrementResumeCount: async (userId: string) => {
    if (!userId) return;
    get().resetCountsIfNeeded();
    set((state) => ({ resumeCount: state.resumeCount + 1 }));
  },

  incrementCoverLetterCount: async (userId: string) => {
    if (!userId) return;
    get().resetCountsIfNeeded();
    set((state) => ({ coverLetterCount: state.coverLetterCount + 1 }));
  },

  incrementInterviewCount: async (userId: string) => {
    if (!userId) return;
    get().resetCountsIfNeeded();
    set((state) => ({ interviewCount: state.interviewCount + 1 }));
  },

  resetCountsIfNeeded: () => {
    const { subscription, lastResetDate } = get();
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // If there's no subscription or it's not a free plan, no reset needed
    if (!subscription || subscription.subscription_type !== 'free') return;

    // If lastResetDate is null or from a previous month, reset counts
    if (
      !lastResetDate ||
      new Date(lastResetDate).getMonth() !== currentMonthStart.getMonth() ||
      new Date(lastResetDate).getFullYear() !== currentMonthStart.getFullYear()
    ) {
      set({
        resumeCount: 0,
        coverLetterCount: 0,
        interviewCount: 0,
        lastResetDate: currentMonthStart.toISOString(),
      });
    }
  },
}));
