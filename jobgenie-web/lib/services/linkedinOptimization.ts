// lib/services/linkedinOptimization.ts
import { createClient } from '@supabase/supabase-js';
import { generateText } from '@/lib/gemini';

interface LinkedInProfile {
  headline: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    description: string;
    duration: string;
  }>;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    field: string;
  }>;
}

interface OptimizationResult {
  optimizedHeadline: string;
  optimizedSummary: string;
  keywordsToAdd: string[];
  recommendedSkills: string[];
  sectionFeedback: {
    headline: string;
    summary: string;
    experience: string[];
    skills: string;
  };
  overallScore: number;
}

export class LinkedInOptimizationService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async analyzeProfile(profile: LinkedInProfile, targetRole: string, industry: string): Promise<OptimizationResult> {
    const prompt = `
      As a LinkedIn profile optimization expert, analyze this profile and provide optimization suggestions for a ${targetRole} position in the ${industry} industry.

      Current Profile:
      Headline: ${profile.headline}
      Summary: ${profile.summary}
      Experience: ${JSON.stringify(profile.experience)}
      Skills: ${profile.skills.join(', ')}
      Education: ${JSON.stringify(profile.education)}

      Provide:
      1. An optimized headline (max 220 characters) that includes relevant keywords
      2. An optimized summary (max 2000 characters) that tells a compelling career story
      3. Industry-specific keywords to add to the profile
      4. Recommended skills based on the target role
      5. Specific feedback for each section
      6. An overall profile score from 1-100

      Format the response as a JSON object with these properties: optimizedHeadline, optimizedSummary, keywordsToAdd, recommendedSkills, sectionFeedback, and overallScore.
    `;

    try {
      const response = await generateText(prompt, {
        temperature: 0.3,
        maxOutputTokens: 2048,
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing LinkedIn profile:', error);
      throw error;
    }
  }

  async generateKeywordSuggestions(targetRole: string, industry: string, currentSkills: string[]): Promise<string[]> {
    const prompt = `
      For a ${targetRole} position in the ${industry} industry, suggest 10 important keywords and skills that would improve LinkedIn visibility.
      Current skills: ${currentSkills.join(', ')}
      
      Provide keywords that are commonly searched by recruiters and ATS systems.
      Return only the keywords as a JSON array of strings.
    `;

    try {
      const response = await generateText(prompt, {
        temperature: 0.3,
        maxOutputTokens: 500,
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating keywords:', error);
      return [];
    }
  }

  async saveOptimization(userId: string, optimization: OptimizationResult, originalProfile: LinkedInProfile): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('linkedin_optimizations')
        .insert({
          user_id: userId,
          current_headline: originalProfile.headline,
          current_summary: originalProfile.summary,
          optimized_headline: optimization.optimizedHeadline,
          optimized_summary: optimization.optimizedSummary,
          optimization_status: 'completed',
          ai_feedback: optimization.sectionFeedback,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving optimization:', error);
      throw error;
    }
  }
}
