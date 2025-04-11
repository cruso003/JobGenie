// utils/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your API key
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

// Main model - using Gemini Pro for most generation tasks
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Default generation config
const defaultConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

/**
 * Generate a response from Gemini API
 */
export async function generateText(prompt: string, config = {}) {
    try {
      const generationConfig = { ...defaultConfig, ...config };
      
      // This is the correct way to pass the generation config
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = result.response;
      let text = response.text();
      
      // Strip markdown code blocks if present
      text = text.replace(/```json\s*/, '').replace(/```\s*$/, '');
      return text;
    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      throw error;
    }
  }

/**
 * Suggest job roles based on user profile
 */
export async function suggestJobRoles(profile: {
    skills: string[];
    experience: {
      level: string;
      yearsOfExperience: number;
      currentTitle?: string;
    };
    interests?: string[];
  }) {
    try {
      const prompt = `
        I need job role suggestions for a person with the following profile:
        
        Skills: ${profile.skills.join(', ')}
        Experience level: ${profile.experience.level} (${profile.experience.yearsOfExperience} years)
        ${profile.experience.currentTitle ? `Current title: ${profile.experience.currentTitle}` : ''}
        ${profile.interests ? `Interests: ${profile.interests.join(', ')}` : ''}
        
        Please suggest 3-5 job titles they would be qualified for, along with a brief explanation of why each role is a good fit. Format the response as a JSON array of objects with "title" and "reason" fields.
      `;
  
      const response = await generateText(prompt);
      
      try {
        // Try to parse as JSON
        return JSON.parse(response);
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        
        // If parsing fails, try to extract job titles using regex
        const fallbackResponse = [];
        
        // Look for patterns like "Job Title: Reason" or "1. Job Title - Reason"
        const jobMatches = response.match(/(?:[\d.]+\s*)?([A-Za-z\s]+(?:Developer|Engineer|Designer|Manager|Analyst|Specialist|Architect|Consultant|Expert|Lead|Director|Coordinator|Administrator|Technician|Officer|Assistant|Advisor))[\s:-]+([^.]*)/g);
        
        if (jobMatches && jobMatches.length > 0) {
          jobMatches.slice(0, 5).forEach(match => {
            // Extract title and reason
            const titleMatch = match.match(/(?:[\d.]+\s*)?([A-Za-z\s]+(?:Developer|Engineer|Designer|Manager|Analyst|Specialist|Architect|Consultant|Expert|Lead|Director|Coordinator|Administrator|Technician|Officer|Assistant|Advisor))/);
            const title = titleMatch ? titleMatch[1].trim() : "Job Position";
            
            // Get everything after the title as the reason
            const reasonStart = match.indexOf(title) + title.length;
            let reason = match.substring(reasonStart).replace(/^[\s:-]+/, '').trim();
            
            if (!reason) reason = "This role matches your skills and experience.";
            
            fallbackResponse.push({ title, reason });
          });
        }
        
        // If we couldn't extract jobs, return a default suggestion
        if (fallbackResponse.length === 0) {
          const defaultTitle = profile.experience.currentTitle || 
            (profile.skills.length > 0 ? `${profile.skills[0]} Specialist` : "Professional");
          
          fallbackResponse.push({ 
            title: defaultTitle, 
            reason: "This role aligns with your current experience and skillset."
          });
          
          // Add a second suggestion based on skills
          if (profile.skills.length > 1) {
            fallbackResponse.push({
              title: `${profile.skills[1]} Developer`,
              reason: "Your skills make you well-suited for this position."
            });
          }
        }
        
        return fallbackResponse;
      }
    } catch (error) {
      console.error('Error in suggestJobRoles:', error);
      // Return a basic fallback option
      return [{
        title: "Professional",
        reason: "Based on your profile"
      }];
    }
  }

/**
 * Generate job search query based on job title and user preferences
 */
export async function generateJobSearchQuery(jobTitle: string, location?: string, remote?: boolean) {
  const prompt = `
    Generate a search query for job listings based on the following:
    
    Job title: ${jobTitle}
    ${location ? `Location: ${location}` : ''}
    ${remote === true ? 'Looking for remote positions' : ''}
    
    Return just the search query text that would be effective for finding relevant jobs.
  `;

  return await generateText(prompt);
}

/**
 * Generate resume bullet points for a job application
 */
export async function generateResumeBullets(jobDescription: string, userSkills: string[], experience: string) {
  const prompt = `
    Create 3-5 impactful resume bullet points for a candidate with the following skills and experience applying to this job:
    
    Job description: ${jobDescription}
    
    Candidate skills: ${userSkills.join(', ')}
    Experience: ${experience}
    
    Format bullet points for direct use in a resume. Focus on achievements and how their skills match the job requirements.
  `;

  return await generateText(prompt);
}

/**
 * Generate a cover letter for a job application
 */
export async function generateCoverLetter(jobTitle: string, companyName: string, jobDescription: string, userProfile: any) {
  const prompt = `
    Write a professional cover letter for a ${jobTitle} position at ${companyName}.
    
    Job description: ${jobDescription}
    
    About the candidate:
    - Name: ${userProfile.fullName}
    - Skills: ${userProfile.skills.join(', ')}
    - Experience level: ${userProfile.experience.level} (${userProfile.experience.yearsOfExperience} years)
    ${userProfile.experience.currentTitle ? `- Current title: ${userProfile.experience.currentTitle}` : ''}
    
    The cover letter should be professional, engaging, and highlight how the candidate's skills and experience match the job requirements.
  `;

  return await generateText(prompt);
}

/**
 * Generate interview questions based on job and user profile
 */
export async function generateInterviewQuestions(jobTitle: string, userSkills: string[]) {
  const prompt = `
    Generate 5 common interview questions for a ${jobTitle} role.
    
    The candidate has the following skills: ${userSkills.join(', ')}
    
    For each question, also provide guidance on what a good answer might include.
    Format the response as a JSON array of objects with "question" and "guidance" fields.
  `;

  const response = await generateText(prompt);
  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse Gemini response:', e);
    return [];
  }
}

/**
 * Explain why a job is a good fit for the user
 */
export async function explainJobFit(jobDescription: string, userProfile: any) {
  const prompt = `
    Explain why this job might be a good fit for this candidate:
    
    Job description: ${jobDescription}
    
    Candidate profile:
    - Skills: ${userProfile.skills.join(', ')}
    - Experience level: ${userProfile.experience.level} (${userProfile.experience.yearsOfExperience} years)
    ${userProfile.experience.currentTitle ? `- Current title: ${userProfile.experience.currentTitle}` : ''}
    ${userProfile.interests ? `- Interests: ${userProfile.interests.join(', ')}` : ''}
    
    Focus on specific matches between the candidate's skills/experience and the job requirements.
    Highlight 3-4 key points about why this job might be suitable.
  `;

  return await generateText(prompt);
}

/**
 * Recommend skills to learn based on desired job
 */
export async function recommendSkillsToLearn(desiredJobTitle: string, currentSkills: string[]) {
    try {
      const prompt = `
        I want to become a ${desiredJobTitle}.
        I already know these skills: ${currentSkills.join(', ')}
        
        What 3-5 additional skills should I learn to be more competitive for this role?
        For each skill, briefly explain why it's valuable and suggest a free or affordable resource to learn it.
        Format the response as a JSON array of objects with "skill", "reason", and "resource" fields.
      `;
  
      const response = await generateText(prompt);
      try {
        return JSON.parse(response);
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        
        // If parsing fails, extract skills manually
        const fallbackResponse = [];
        
        // Look for patterns like "Skill Name: Reason"
        const skillMatches = response.match(/[A-Za-z\s/+#]+:[\s\S]+?(?=\n[A-Za-z\s/+#]+:|$)/g);
        
        if (skillMatches && skillMatches.length > 0) {
          skillMatches.slice(0, 5).forEach(match => {
            const parts = match.split(':');
            if (parts.length >= 2) {
              const skill = parts[0].trim();
              const description = parts[1].trim();
              
              // Try to identify resource section with keywords
              let reason = description;
              let resource = "Online tutorials and courses";
              
              if (description.includes("Resource:")) {
                const resourceParts = description.split("Resource:");
                reason = resourceParts[0].trim();
                resource = resourceParts[1].trim();
              } else if (description.includes("Learn on:")) {
                const resourceParts = description.split("Learn on:");
                reason = resourceParts[0].trim();
                resource = resourceParts[1].trim();
              }
              
              fallbackResponse.push({ skill, reason, resource });
            }
          });
        }
        
        // If extraction failed, provide default suggestions
        if (fallbackResponse.length === 0) {
          fallbackResponse.push({
            skill: "Advanced Problem Solving",
            reason: "Essential for any professional role",
            resource: "LeetCode, HackerRank, or online courses on Coursera"
          });
          
          if (desiredJobTitle.toLowerCase().includes("developer") || 
              desiredJobTitle.toLowerCase().includes("engineer")) {
            fallbackResponse.push({
              skill: "Cloud Computing",
              reason: "Increasingly important for modern applications",
              resource: "AWS Free Tier, Microsoft Learn, or Google Cloud Training"
            });
          }
        }
        
        return fallbackResponse;
      }
    } catch (error) {
      console.error('Error in recommendSkillsToLearn:', error);
      // Return basic fallback options
      return [{
        skill: "Communication Skills",
        reason: "Essential for all professional roles",
        resource: "Free courses on Coursera or YouTube"
      }];
    }
  }

/**
 * Extract key information from a CV or resume text
 */
export async function extractCVInfo(cvText: string) {
  const prompt = `
    Extract the key information from this CV/resume text:
    
    ${cvText}
    
    Provide a structured output with the following sections:
    1. Skills - List all technical and soft skills mentioned
    2. Experience - Summarize work experience, with company names and years
    3. Education - List degrees, institutions, and graduation years
    4. Key achievements - Highlight notable accomplishments
    
    Format as a JSON object with these sections as properties.
  `;

  const response = await generateText(prompt, { maxOutputTokens: 2048 });
  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse Gemini response:', e);
    // Return a basic structure in case parsing fails
    return {
      skills: [],
      experience: [],
      education: [],
      keyAchievements: []
    };
  }
}
