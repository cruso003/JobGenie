// lib/supabase/interview.ts
import { supabase } from "../supabase";

export interface InterviewSession {
  id: string;
  user_id: string;
  interview_type: string;
  mode: string;
  role: string;
  company: string | null;
  status: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  overall_score: number | null;
  score_breakdown: Record<string, number> | null;
  transcript: { messages: any[] } | null;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type: 'free' | 'pro';
  stripe_subscription_id: string;
  stripe_price_id: string;
  stripe_customer_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'cancelled' | 'expired';
}

export interface InterviewFeedback {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  user_answer: string;
  code_submission?: string;
  feedback_text: string;
  score: number;
  areas_for_improvement: string[];
  strengths: string[];
}



export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function createInterviewSession(session: Omit<InterviewSession, 'id' | 'created_at' | 'updated_at'>): Promise<InterviewSession | null> {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert([session])
    .select()
    .single();

  if (error) {
    console.error('Error creating interview session:', error);
    return null;
  }

  return data;
}

export async function updateInterviewSession(sessionId: string, updates: Partial<InterviewSession>) {
  const { data, error } = await supabase
    .from("interview_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating interview session:", error);
    throw error;
  }

  return data;
}

export async function checkInterviewLimits(userId: string): Promise<{ canCreateInterview: boolean; remainingInterviews: number }> {
  const subscription = await getUserSubscription(userId);
  
  if (subscription?.subscription_type === 'pro') {
    return { canCreateInterview: true, remainingInterviews: -1 }; // Unlimited for pro
  }

  // Check limits for free tier
  const { data: limits, error } = await supabase
    .from('user_interview_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !limits) {
    // Create new limit record if doesn't exist
    await supabase
      .from('user_interview_limits')
      .insert([{ user_id: userId, free_interviews_used: 0 }]);
    return { canCreateInterview: true, remainingInterviews: 3 };
  }

  // Reset limits if a month has passed
  const lastReset = new Date(limits.last_reset_date);
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  if (lastReset < monthAgo) {
    await supabase.rpc('reset_monthly_interview_limits');
    return { canCreateInterview: true, remainingInterviews: 3 };
  }

  const remaining = 3 - limits.free_interviews_used;
  return { canCreateInterview: remaining > 0, remainingInterviews: remaining };
}

export async function incrementInterviewUsage(userId: string): Promise<void> {
  const { data: limits, error } = await supabase
    .from('user_interview_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (limits) {
    await supabase
      .from('user_interview_limits')
      .update({ free_interviews_used: limits.free_interviews_used + 1 })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('user_interview_limits')
      .insert([{ user_id: userId, free_interviews_used: 1 }]);
  }
}

export async function getInterviewHistory(userId: string): Promise<InterviewSession[]> {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching interview history:', error);
    return [];
  }

  return data;
}

export async function getInterviewSessionDetails(sessionId: string): Promise<InterviewSession | null> {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    console.error("Error fetching interview session:", error);
    return null;
  }

  return data as InterviewSession;
}

export async function getInterviewFeedback(sessionId: string): Promise<InterviewFeedback[]> {
  const { data, error } = await supabase
    .from("interview_feedback")
    .select("*")
    .eq("session_id", sessionId)
    .order("question_number", { ascending: true });

  if (error) {
    console.error("Error fetching interview feedback:", error);
    return [];
  }

  return data as InterviewFeedback[];
}

export async function addInterviewFeedback(feedback: Omit<InterviewFeedback, 'id' | 'created_at'>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active user session');
  }

  const { data, error } = await supabase
    .from('interview_feedback')
    .insert([feedback])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

  export async function getInterviewSession(sessionId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active user session');
    }
  
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', session.user.id) // Ensure the session belongs to the user
      .single();
  
    if (error) {
      throw error;
    }
  
    return data as InterviewSession;
  }
