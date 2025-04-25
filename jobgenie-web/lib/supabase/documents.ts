// lib/supabase/documents.ts
import { supabase } from "../supabase";
import { getUserSubscription } from "./interview";

export interface DocumentLimits {
  user_id: string;
  resumes_generated: number;
  cover_letters_generated: number;
  last_reset_date: string;
}

export interface DocumentLimitStatus {
  canGenerateResume: boolean;
  canGenerateCoverLetter: boolean;
  remainingResumes: number;
  remainingCoverLetters: number;
  isUnlimited: boolean;
}

export async function checkDocumentLimits(userId: string): Promise<DocumentLimitStatus> {
  const subscription = await getUserSubscription(userId);
  
  // Pro Annual and Elite users get unlimited documents
  const isUnlimited = subscription?.subscription_type === 'pro' && 
    (subscription.stripe_price_id === 'price_1RFxt6HjllFf5pa1zYz1d8z1' || 
     subscription.stripe_price_id === 'price_1RFxttHjllFf5pa1ngNXCRCX');
  
  if (isUnlimited) {
    return {
      canGenerateResume: true,
      canGenerateCoverLetter: true,
      remainingResumes: -1,
      remainingCoverLetters: -1,
      isUnlimited: true
    };
  }

  // Get limits for free and monthly pro users
  const { data: limits, error } = await supabase
    .from('document_generation_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !limits) {
    // Create new limit record if doesn't exist
    await supabase
      .from('document_generation_limits')
      .insert([{ user_id: userId, resumes_generated: 0, cover_letters_generated: 0 }]);
    
    return {
      canGenerateResume: true,
      canGenerateCoverLetter: true,
      remainingResumes: subscription?.subscription_type === 'pro' ? 10 : 3,
      remainingCoverLetters: subscription?.subscription_type === 'pro' ? 10 : 3,
      isUnlimited: false
    };
  }

  // Reset limits if a month has passed
  const lastReset = new Date(limits.last_reset_date);
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  if (lastReset < monthAgo) {
    await supabase
      .from('document_generation_limits')
      .update({ 
        resumes_generated: 0, 
        cover_letters_generated: 0,
        last_reset_date: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    return {
      canGenerateResume: true,
      canGenerateCoverLetter: true,
      remainingResumes: subscription?.subscription_type === 'pro' ? 10 : 3,
      remainingCoverLetters: subscription?.subscription_type === 'pro' ? 10 : 3,
      isUnlimited: false
    };
  }

  const maxResumes = subscription?.subscription_type === 'pro' ? 10 : 3;
  const maxCoverLetters = subscription?.subscription_type === 'pro' ? 10 : 3;

  return {
    canGenerateResume: limits.resumes_generated < maxResumes,
    canGenerateCoverLetter: limits.cover_letters_generated < maxCoverLetters,
    remainingResumes: maxResumes - limits.resumes_generated,
    remainingCoverLetters: maxCoverLetters - limits.cover_letters_generated,
    isUnlimited: false
  };
}

export async function incrementDocumentUsage(userId: string, documentType: 'resume' | 'cover_letter'): Promise<void> {
  const { data: limits, error } = await supabase
    .from('document_generation_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (limits) {
    const updateData = documentType === 'resume' 
      ? { resumes_generated: limits.resumes_generated + 1 }
      : { cover_letters_generated: limits.cover_letters_generated + 1 };
    
    await supabase
      .from('document_generation_limits')
      .update(updateData)
      .eq('user_id', userId);
  } else {
    const insertData = documentType === 'resume'
      ? { user_id: userId, resumes_generated: 1, cover_letters_generated: 0 }
      : { user_id: userId, resumes_generated: 0, cover_letters_generated: 1 };
    
    await supabase
      .from('document_generation_limits')
      .insert([insertData]);
  }
}
