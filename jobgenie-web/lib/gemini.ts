/* eslint-disable @typescript-eslint/no-unused-vars */
// utils/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define ProfileData interface if you don't have it imported from elsewhere
export interface ProfileData {
  full_name?: string;
  skills?: string[];
  experience?: {
    level?: string;
    yearsOfExperience?: number;
    currentTitle?: string;
  };
  interests?: string[];
}

// Initialize the Gemini API with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

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
 * Calculate job match percentage based on user profile and job description
 */
export async function calculateJobMatch(
  jobTitle: string,
  jobDescription: string,
  userProfile: {
    skills: string[];
    experience: {
      level: string;
      yearsOfExperience: number;
      currentTitle?: string;
    };
    interests?: string[];
  }
) {
  try {
    const prompt = `
      I need to calculate a match percentage between a job and a candidate's profile.
      
      Job title: ${jobTitle}
      Job description: ${jobDescription}
      
      Candidate profile:
      - Skills: ${userProfile.skills.join(', ')}
      - Experience level: ${userProfile.experience.level} (${userProfile.experience.yearsOfExperience} years)
      ${userProfile.experience.currentTitle ? `- Current title: ${userProfile.experience.currentTitle}` : ''}
      ${userProfile.interests ? `- Interests: ${userProfile.interests.join(', ')}` : ''}
      
      Calculate a match percentage (0-100) based on how well the candidate's skills and experience match the job requirements.
      Explain the reasoning behind the percentage calculation.
      
      Return the response as a JSON object with "percentage" (number) and "reasoning" (string) fields.
    `;

    const response = await generateText(prompt);
    
    try {
      // Try to parse as JSON
      const result = JSON.parse(response);
      return {
        percentage: Number(result.percentage),
        reasoning: result.reasoning
      };
    } catch (e) {
      console.error('Failed to parse Gemini match percentage response:', e);
      
      // Try to extract percentage using regex
      const percentageMatch = response.match(/(\d{1,3})%/);
      let percentage = 75; // Default percentage
      
      if (percentageMatch && percentageMatch[1]) {
        percentage = Math.min(100, Math.max(0, parseInt(percentageMatch[1], 10)));
      }
      
      return {
        percentage,
        reasoning: "Based on matching skills and experience with job requirements."
      };
    }
  } catch (error) {
    console.error('Error calculating job match:', error);
    return {
      percentage: 70, // Default fallback percentage
      reasoning: "Based on general profile fit for this position."
    };
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
export async function generateCoverLetter(jobTitle: string, companyName: string, jobDescription: string, userProfile:ProfileData) {
  const prompt = `
    Write a professional cover letter for a ${jobTitle} position at ${companyName}.
    
    Job description: ${jobDescription}
    
    About the candidate:
    - Name: ${userProfile.full_name || ""}
    - Skills: ${userProfile.skills?.join(', ') || ""}
    - Experience level: ${userProfile.experience?.level || ""} (${userProfile.experience?.yearsOfExperience || 0} years)
    ${userProfile.experience?.currentTitle ? `- Current title: ${userProfile.experience.currentTitle}` : ''}
    
    The cover letter should be professional, engaging, and highlight how the candidate's skills and experience match the job requirements.
  `;

  return await generateText(prompt);
}

/**
 * Generate interview questions based on job role and interview type
 */
export async function generateInterviewQuestions(
  jobRole: string,
  userSkills: string[],
  interviewType: 'behavioral' | 'technical' | 'general' = 'general',
  questionCount: number = 5
) {
  try {
    const prompt = `
      Generate ${questionCount} interview questions for a ${jobRole} position.
      The interview type is ${interviewType}.
      
      ${interviewType === 'technical' 
        ? `Include technical questions specific to the ${jobRole} role. Focus on skills like: ${userSkills.join(', ')}`
        : interviewType === 'behavioral' 
        ? 'Include behavioral questions that assess soft skills and past experiences.'
        : 'Include a mix of questions about qualifications, experience, and fit for the role.'
      }
      
      For each question, also provide guidance on what would make a good answer.
      
      Format the response as a JSON array of objects with "question" and "guidance" fields.
    `;

    const response = await generateText(prompt);
    
    try {
      // Parse the JSON response
      const questions = JSON.parse(response);
      return questions;
    } catch (e) {
      console.error('Failed to parse interview questions response:', e);
      
      // Extract questions using regex if JSON parsing fails
      const questionsExtracted = [];
      const questionMatches = response.match(/Question [0-9]+:[\s\S]*?(?=Question [0-9]+:|$)/g);
      
      if (questionMatches && questionMatches.length > 0) {
        for (const match of questionMatches) {
          const questionMatch = match.match(/Question [0-9]+:([\s\S]*?)(?=Guidance:|Good Answer:|$)/i);
          const guidanceMatch = match.match(/(?:Guidance:|Good Answer:)([\s\S]*?)$/i);
          
          if (questionMatch && questionMatch[1]) {
            questionsExtracted.push({
              question: questionMatch[1].trim(),
              guidance: guidanceMatch ? guidanceMatch[1].trim() : "Provide a clear, concise answer with specific examples."
            });
          }
        }
      }
      
      // If we still couldn't extract questions, return default ones
      if (questionsExtracted.length === 0) {
        return [
          {
            question: `Tell me about your experience relevant to the ${jobRole} position.`,
            guidance: 'Focus on relevant skills and achievements in your previous roles.'
          },
          {
            question: 'What are your strengths and how would they help you in this role?',
            guidance: 'Highlight 2-3 key strengths directly relevant to the job requirements.'
          },
          {
            question: 'Describe a challenge you faced in a previous role and how you overcame it.',
            guidance: 'Use the STAR method (Situation, Task, Action, Result) to structure your answer.'
          },
          {
            question: 'Why are you interested in this position?',
            guidance: 'Connect your career goals with the company mission and role responsibilities.'
          },
          {
            question: 'What questions do you have for us?',
            guidance: 'Prepare thoughtful questions about the role, team, or company culture.'
          }
        ].slice(0, questionCount);
      }
      
      return questionsExtracted.slice(0, questionCount);
    }
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw error;
  }
}

/**
 * Evaluate an interview answer and provide feedback
 */
export async function evaluateInterviewAnswer(
  jobRole: string,
  question: string,
  answer: string,
  expectedAnswer: string
) {
  try {
    const prompt = `
      You are an interview coach. Please evaluate this interview answer:
      
      Position: ${jobRole}
      Question: ${question}
      Candidate answer: "${answer}"
      
      What would make a good answer: ${expectedAnswer}
      
      Provide constructive feedback on this answer. Include:
      1. What was done well
      2. What could be improved
      3. A suggested improved answer
      4. A score from 1-5 (where 1 is poor and 5 is excellent)
      
      Return the response as a JSON object with "feedback" and "score" fields.
    `;
    
    const response = await generateText(prompt);
    
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse feedback response:', e);
      
      // Extract score using regex
      const scoreMatch = response.match(/(\d)[\/\s]*5/) || [null, '3'];
      const score = Math.min(Math.max(parseInt(scoreMatch[1], 10), 1), 5);
      
      return {
        feedback: response,
        score: score
      };
    }
  } catch (error) {
    console.error('Error evaluating interview answer:', error);
    throw error;
  }
}

/**
 * Generate an overall summary of the interview performance
 */
export async function generateInterviewSummary(
  jobRole: string,
  interviewType: string,
  questions: {
    question: string;
    userAnswer: string;
    feedback: string;
    score: number;
  }[]
) {
  try {
    const prompt = `
      You are an interview coach. Please provide an overall assessment of this mock interview:
      
      Position: ${jobRole}
      Interview type: ${interviewType}
      
      ${questions.map((q, i) => `
        Question ${i+1}: ${q.question}
        Answer: ${q.userAnswer}
        Feedback: ${q.feedback}
        Score: ${q.score}/5
      `).join('\n\n')}
      
      Provide a comprehensive summary (250-300 words) of the interview performance, including:
      1. Overall impression
      2. Key strengths demonstrated
      3. Areas for improvement
      4. Specific, actionable advice for future interviews
      
      Be constructive, encouraging, but honest.
    `;
    
    return await generateText(prompt);
  } catch (error) {
    console.error('Error generating interview summary:', error);
    throw error;
  }
}

interface HtmlDocumentOptions {
  profile: ProfileData;
  jobTitle: string;
  company: string;
  additionalInfo: string;
  isCreatingCoverLetter: boolean;
  template: 'modern' | 'classic' | 'minimal';
  customizations?: {
    primaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
  };
}

interface UpdateSectionOptions {
  originalHtml: string;
  sectionType: string;
  newContent: string;
}

/**
 * Generate a beautiful HTML document (resume or cover letter)
 */
export async function generateHtmlDocument(options: HtmlDocumentOptions): Promise<string> {
  try {
    const {
      profile,
      jobTitle,
      company,
      additionalInfo,
      isCreatingCoverLetter,
      template = "modern",
      customizations = {}
    } = options;
    
    const documentType = isCreatingCoverLetter ? "cover letter" : "resume";
    
    // Build the prompt for Gemini
    const prompt = `
      Create a beautiful, professional ${documentType} in HTML and CSS for ${profile.full_name || "a job seeker"} 
      with the following details:
      
      ${jobTitle && company ? `Target position: ${jobTitle} at ${company}` : ""}
      
      Skills: ${profile.skills?.join(", ") || ""}
      Experience level: ${profile.experience?.level || ""} (${profile.experience?.yearsOfExperience || 0} years)
      ${profile.experience?.currentTitle ? `Current title: ${profile.experience.currentTitle}` : ""}
      ${profile.interests && profile.interests.length > 0 ? `Interests: ${profile.interests.join(", ")}` : ""}
      ${additionalInfo ? `Additional information: ${additionalInfo}` : ""}

      The template style should be: ${template} (modern is sleek with subtle gradients, classic is traditional with serif fonts, minimal is clean and simple)
      
      Requirements:
      1. Create a complete, self-contained HTML document with embedded CSS
      2. Use a clean, professional design with excellent typography
      3. Make sure it's optimized for both screen viewing and printing
      4. Use a responsive design
      5. Create clear, distinct sections with appropriate styling
      6. Use appropriate font pairings, spacing, and visual hierarchy
      7. Include subtle colors and styling that enhance readability
      8. Ensure the HTML is valid and properly structured with semantic tags
      9. MAKE SURE ALL STYLING IS INCLUDED INLINE IN THE HTML FILE

      ${isCreatingCoverLetter 
        ? `For the cover letter:
          - Include a proper header with contact information
          - Add a professional greeting
          - Write 3-4 paragraphs explaining why the candidate is a good fit
          - Include a proper closing
          - Make it look like a professional business letter`
        : `For the resume:
          - Create an ATS-friendly layout
          - Include clear sections for summary, experience, skills, and education
          - Use bullet points for achievements and responsibilities
          - Create a header with contact information
          - Make sure it looks clean and professional when printed`
      }

      THE MOST IMPORTANT REQUIREMENT: Return ONLY valid HTML code with embedded CSS. No markdown, no explanations, just the complete HTML document.
    `;

    const htmlResponse = await generateText(prompt, {
      temperature: 0.3, // Lower temperature for more consistent results
      maxOutputTokens: 8192, // Larger token limit for complete HTML
    });

    // Ensure we have valid HTML by checking and cleaning up the response
    let cleanHtml = htmlResponse;
    
    // Sometimes Gemini might include markdown code block markers
    cleanHtml = cleanHtml.replace(/```html/g, '').replace(/```/g, '');
    
    // Make sure it starts with <!DOCTYPE html>
    if (!cleanHtml.trim().startsWith('<!DOCTYPE html>')) {
      cleanHtml = `<!DOCTYPE html>\n${cleanHtml}`;
    }
    
    return cleanHtml;
  } catch (error) {
    console.error('Error generating HTML document:', error);
    throw error;
  }
}

/**
 * Update an HTML document based on a conversation and user request
 */
export async function updateHtmlDocument({
  originalHtml,
  userRequest,
  conversationHistory
}: {
  originalHtml: string;
  userRequest: string;
  conversationHistory: {role: string, content: string}[];
}): Promise<string> {
  try {
    // Build the conversation context for Gemini
    const conversationContext = conversationHistory
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    // Build the prompt for Gemini
    const prompt = `
      I have an HTML document that represents a resume or cover letter.
      
      Here is our conversation history:
      ${conversationContext}
      
      My latest request is: "${userRequest}"
      
      Here is the current HTML document:
      \`\`\`html
      ${originalHtml}
      \`\`\`
      
      Please update the HTML document according to my latest request. Make any necessary changes to fulfill the request while preserving the overall structure and styling of the document.
      
      Requirements:
      1. Keep all original styles and formatting
      2. Make requested changes precisely
      3. Return ONLY the complete updated HTML document
      4. Make sure to preserve the DOCTYPE and all required HTML elements
      5. Do not include any explanations, just the HTML code
    `;

    const updatedHtml = await generateText(prompt, {
      temperature: 0.2,
      maxOutputTokens: 8192,
    });
    
    // Clean up the response
    let cleanHtml = updatedHtml;
    cleanHtml = cleanHtml.replace(/```html/g, '').replace(/```/g, '');
    
    if (!cleanHtml.trim().startsWith('<!DOCTYPE html>')) {
      cleanHtml = `<!DOCTYPE html>\n${cleanHtml}`;
    }
    
    return cleanHtml;
  } catch (error) {
    console.error('Error updating HTML document:', error);
    throw error;
  }
}

/**
 * Update a specific section in an HTML document
 */
export async function updateHtmlSection(options: UpdateSectionOptions): Promise<string> {
  try {
    const { originalHtml, sectionType, newContent } = options;
    
    // Build the prompt for Gemini
    const prompt = `
      I have an HTML document that represents a ${sectionType === 'greeting' || sectionType === 'introduction' || sectionType === 'body' || sectionType === 'closing' ? 'cover letter' : 'resume'}.
      I need to update the "${sectionType}" section with new content.
      
      Here is the original HTML document:
      \`\`\`html
      ${originalHtml}
      \`\`\`
      
      Here is the new content for the "${sectionType}" section:
      \`\`\`
      ${newContent}
      \`\`\`
      
      Please update the HTML document by finding the appropriate section and replacing its content with the new content.
      Keep all the styling intact and maintain the structure of the document.
      Return only the complete updated HTML document.
    `;

    const updatedHtml = await generateText(prompt, {
      temperature: 0.2,
      maxOutputTokens: 8192,
    });
    
    // Clean up the response
    let cleanHtml = updatedHtml;
    cleanHtml = cleanHtml.replace(/```html/g, '').replace(/```/g, '');
    
    if (!cleanHtml.trim().startsWith('<!DOCTYPE html>')) {
      cleanHtml = `<!DOCTYPE html>\n${cleanHtml}`;
    }
    
    return cleanHtml;
  } catch (error) {
    console.error('Error updating HTML section:', error);
    throw error;
  }
}

/**
 * Explain why a job is a good fit for the user
 */
export async function explainJobFit(jobDescription: string, userProfile: ProfileData) {
  const prompt = `
    Explain why this job might be a good fit for this candidate:
    
    Job description: ${jobDescription}
    
    Candidate profile:
    - Skills: ${userProfile.skills?.join(', ') || ""}
    - Experience level: ${userProfile.experience?.level || ""} (${userProfile.experience?.yearsOfExperience || 0} years)
    ${userProfile.experience?.currentTitle ? `- Current title: ${userProfile.experience.currentTitle}` : ''}
    ${userProfile.interests ? `- Interests: ${userProfile.interests.join(', ')}` : ''}
    
    Focus on specific matches between the candidate's skills/experience and the job requirements.
    Highlight 3-4 key points about why this job might be suitable.
  `;

  return await generateText(prompt);
}

/**
 * Recommend skills to learn based on desired job
 */
export async function recommendSkillsToLearn(desiredJobTitle: string, currentSkills: string[], existingRecommendations: string[] = []) {
  try {
    const prompt = `
      I want to become a ${desiredJobTitle}.
      I already know these skills: ${currentSkills.join(', ')}
      ${existingRecommendations.length > 0 ? `I've already been recommended these skills: ${existingRecommendations.join(', ')}` : ''}
      
      What 3-5 additional skills should I learn to be more competitive for this role?
      DO NOT recommend any skill that I already know or have been recommended.
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

/**
 * Generate a structured interview preparation plan
 */
export async function generateInterviewPrepPlan(
  jobRole: string,
  company: string | undefined,
  interviewType: 'behavioral' | 'technical' | 'general',
  userProfile: ProfileData
) {
  try {
    const prompt = `
      You are a professional career coach helping someone prepare for a ${interviewType} interview for a ${jobRole} position${company ? ` at ${company}` : ''}.
      
      Candidate profile:
      - Skills: ${userProfile.skills?.join(', ') || "Not specified"}
      - Experience level: ${userProfile.experience?.level || "Not specified"} (${userProfile.experience?.yearsOfExperience || 0} years)
      ${userProfile.experience?.currentTitle ? `- Current title: ${userProfile.experience.currentTitle}` : ''}
      
      Create a well-structured interview preparation plan with the following sections:
      
      1. What to Expect - What this type of interview will focus on
      2. Common Questions - 5 specific questions they might face with clear categories
      3. Preparation Tips - How to answer effectively with examples
      4. Next Steps - Concrete actions to take before the interview
      
      Format the response so it can be easily displayed in a mobile app with separate sections.
      Keep each section concise but insightful. Use bullet points where appropriate.
      
      Return the response as a JSON object with these sections as properties: "expectations", "commonQuestions", "preparationTips", and "nextSteps".
      Each section should be formatted as clean text that can be displayed directly to the user.
    `;

    const response = await generateText(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
    
    try {
      // Parse the JSON response
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse interview prep plan:', e);
      
      // If parsing fails, try to extract sections
      const sections = {
        expectations: extractSection(response, "What to Expect", "Common Questions"),
        commonQuestions: extractSection(response, "Common Questions", "Preparation Tips"),
        preparationTips: extractSection(response, "Preparation Tips", "Next Steps"),
        nextSteps: extractSection(response, "Next Steps", "")
      };
      
      return sections;
    }
  } catch (error) {
    console.error('Error generating interview prep plan:', error);
    throw error;
  }
}

/**
 * Helper function to extract sections from text
 */
function extractSection(text: string, sectionStart: string, sectionEnd: string): string {
  const startRegex = new RegExp(`${sectionStart}[:\\s-]*`, 'i');
  const startMatch = text.match(startRegex);
  
  if (!startMatch) return "";
  
  const startIndex = startMatch.index! + startMatch[0].length;
  
  let endIndex = text.length;
  if (sectionEnd) {
    const endRegex = new RegExp(`${sectionEnd}[:\\s-]*`, 'i');
    const endMatch = text.substring(startIndex).match(endRegex);
    if (endMatch) {
      endIndex = startIndex + endMatch.index!;
    }
  }
  
  return text.substring(startIndex, endIndex).trim();
}

/**
 * Generate a personalized learning path for a skill
 */
export async function generateLearningPath(
  targetSkill: string,
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced',
  currentSkills: string[],
  timeframe: number = 30 // days
) {
  try {
    const prompt = `
      Create a structured learning path for someone who wants to learn ${targetSkill}.
      
      Current profile:
      - Proficiency level in ${targetSkill}: ${proficiencyLevel}
      - Related skills they already know: ${currentSkills.join(', ')}
      - Timeframe: ${timeframe} days
      
      Create a progressive, step-by-step learning plan with the following components:
      
      1. Learning Objectives - 3-5 clear goals to achieve
      2. Skill Breakdown - Core components that make up this skill
      3. Week-by-Week Plan - Specific tasks, resources and small projects
      4. Recommended Resources - Free or affordable options to learn from
      5. Practice Projects - 2-3 practical projects to build
      
      Format your response as a simple JSON object with these properties:
      - objectives (array of strings)
      - skillComponents (array of {name: string, description: string})
      - weeklyPlan (array of {week: number, focus: string, tasks: array of strings})
      - resources (array of {type: string, name: string, url: string, why: string})
      - projects (array of {name: string, description: string, difficulty: string})
      
      Keep descriptions concise and focused on practical implementation.
      
      IMPORTANT: Ensure your response is proper, parseable JSON with all property names in quotes.
    `;

    const response = await generateText(prompt, {
      temperature: 0.3, // Lower temperature for more consistent JSON formatting
      maxOutputTokens: 2048,
    });
    
    try {
      // First attempt: try to parse the raw response
      const cleanedResponse = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return JSON.parse(cleanedResponse);
    } catch (e) {
      console.warn('Initial JSON parsing failed, trying to clean the response', e);
      
      try {
        // Second attempt: try to extract a JSON object using regex
        const jsonPattern = /\{[\s\S]*\}/g;
        const matches = response.match(jsonPattern);
        
        if (matches && matches.length > 0) {
          return JSON.parse(matches[0]);
        }
      } catch (e2) {
        console.error('Failed to parse learning path as JSON after cleanup:', e2);
      }
      
      // Fallback: Return a structured object with the target skill
      return {
        objectives: [
          `Understand the fundamentals of ${targetSkill}`,
          `Build a simple project using ${targetSkill}`,
          `Apply ${targetSkill} in practical scenarios`,
          `Master advanced concepts in ${targetSkill}`,
          `Create a portfolio project showcasing ${targetSkill} skills`
        ],
        skillComponents: [
          { 
            name: "Core Concepts", 
            description: `Fundamental principles and techniques of ${targetSkill}` 
          },
          { 
            name: "Practical Application", 
            description: `Hands-on implementation of ${targetSkill} in real scenarios` 
          },
          { 
            name: "Advanced Techniques", 
            description: `Sophisticated methods and best practices in ${targetSkill}` 
          }
        ],
        weeklyPlan: [
          { 
            week: 1, 
            focus: "Fundamentals", 
            tasks: ["Study basic concepts", "Complete introductory tutorials", "Set up development environment"] 
          },
          { 
            week: 2, 
            focus: "Building Skills", 
            tasks: ["Practice with simple exercises", "Review core techniques", "Start a small project"] 
          },
          { 
            week: 3, 
            focus: "Project Development", 
            tasks: ["Complete your first project", "Debug common issues", "Get feedback on your work"] 
          },
          { 
            week: 4, 
            focus: "Advanced Topics", 
            tasks: ["Learn advanced techniques", "Optimize your workflow", "Finalize portfolio project"] 
          }
        ],
        resources: [
          { 
            type: "Online Course", 
            name: `${targetSkill} Fundamentals`, 
            url: "https://www.coursera.org", 
            why: "Structured introduction to core concepts with guided projects" 
          },
          { 
            type: "Documentation", 
            name: `Official ${targetSkill} Documentation`, 
            url: "https://docs.example.com", 
            why: "Comprehensive reference for all aspects of the skill" 
          },
          { 
            type: "YouTube Playlist", 
            name: `${targetSkill} Tutorial Series`, 
            url: "https://www.youtube.com", 
            why: "Visual demonstrations of key techniques and concepts" 
          }
        ],
        projects: [
          { 
            name: "Beginner Project", 
            description: `Create a simple application that demonstrates basic ${targetSkill} concepts`, 
            difficulty: "Beginner" 
          },
          { 
            name: "Intermediate Challenge", 
            description: `Build a more complex solution that incorporates multiple aspects of ${targetSkill}`, 
            difficulty: "Intermediate" 
          },
          { 
            name: "Portfolio Project", 
            description: `Develop a comprehensive project that showcases your mastery of ${targetSkill}`, 
            difficulty: "Advanced" 
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error generating learning path:', error);
    
    // Return a basic fallback if everything fails
    return {
      objectives: [
        `Learn the fundamentals of ${targetSkill}`,
        `Build a simple project using ${targetSkill}`,
        `Develop problem-solving skills with ${targetSkill}`
      ],
      skillComponents: [
        { name: "Fundamentals", description: `Basic concepts of ${targetSkill}` }
      ],
      weeklyPlan: [
        { 
          week: 1, 
          focus: "Getting Started", 
          tasks: ["Research basics", "Set up development environment", "Complete introductory tutorial"] 
        }
      ],
      resources: [
        { 
          type: "Online Course", 
          name: `${targetSkill} for Beginners`, 
          url: "https://www.example.com", 
          why: "Provides structured introduction to core concepts" 
        }
      ],
      projects: [
        { 
          name: "Hello World", 
          description: `Create a simple application using ${targetSkill}`, 
          difficulty: "Beginner" 
        }
      ]
    };
  }
}

/**
 * Generate career transition advice
 */
export async function generateCareerTransitionAdvice(
  currentRole: string,
  targetRole: string,
  userProfile: ProfileData,
  issuesToAddress?: string
) {
  try {
    const prompt = `
      Provide personalized career transition advice for someone moving from ${currentRole} to ${targetRole}.
      
      Candidate profile:
      - Skills: ${userProfile.skills?.join(', ') || "Not specified"}
      - Experience level: ${userProfile.experience?.level || "Not specified"} (${userProfile.experience?.yearsOfExperience || 0} years)
      ${userProfile.experience?.currentTitle ? `- Current title: ${userProfile.experience.currentTitle}` : ''}
      ${issuesToAddress ? `- Specific concerns: ${issuesToAddress}` : ''}
      
      Create a comprehensive transition plan with these components:
      
      1. Skill Gap Analysis - Current skills vs. required skills for the target role
      2. Transferable Skills - Existing skills that can be leveraged
      3. Learning Roadmap - What to learn and in what order
      4. Experience Building - How to gain relevant experience
      5. Networking Strategy - How to connect with professionals in the target field
      6. Resume & Portfolio Adjustments - How to position themselves for the new role
      
      Format the response as a JSON object with these sections as properties.
      Make the advice specific, actionable, and encouraging.
    `;

    const response = await generateText(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
    
    try {
      // Parse the JSON response
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse career transition advice:', e);
      
      // Extract sections if parsing fails
      const sections = {
        skillGapAnalysis: extractSection(response, "Skill Gap Analysis", "Transferable Skills"),
        transferableSkills: extractSection(response, "Transferable Skills", "Learning Roadmap"),
        learningRoadmap: extractSection(response, "Learning Roadmap", "Experience Building"),
        experienceBuilding: extractSection(response, "Experience Building", "Networking Strategy"),
        networkingStrategy: extractSection(response, "Networking Strategy", "Resume & Portfolio"),
        resumeAdjustments: extractSection(response, "Resume & Portfolio", "")
      };
      
      return sections;
    }
  } catch (error) {
    console.error('Error generating career transition advice:', error);
    throw error;
  }
}

/**
 * Generate structured salary negotiation advice
 */
export async function generateSalaryNegotiationAdvice(
  jobRole: string,
  experienceYears: number,
  industry: string,
  location: string,
  currentSalary?: number
) {
  try {
    const prompt = `
      Provide structured salary negotiation advice for a ${jobRole} with ${experienceYears} years of experience in the ${industry} industry${location ? ` in ${location}` : ''}.
      ${currentSalary ? `Their current salary is ${currentSalary}.` : ''}
      
      Create comprehensive negotiation guidance with these components:
      
      1. Salary Research - Typical salary ranges for this role and factors affecting it
      2. Negotiation Strategy - Key approach and timing
      3. Talking Points - Specific points to emphasize based on their experience
      4. Handling Objections - How to respond to common pushback
      5. Benefits to Negotiate - Beyond base salary
      
      Format the response as a JSON object with these sections as properties.
      Make the advice specific, practical, and confidence-building.
    `;

    const response = await generateText(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
    
    try {
      // Parse the JSON response
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse salary negotiation advice:', e);
      
      // Extract sections if parsing fails
      const sections = {
        salaryResearch: extractSection(response, "Salary Research", "Negotiation Strategy"),
        negotiationStrategy: extractSection(response, "Negotiation Strategy", "Talking Points"),
        talkingPoints: extractSection(response, "Talking Points", "Handling Objections"),
        handlingObjections: extractSection(response, "Handling Objections", "Benefits to Negotiate"),
        benefitsToNegotiate: extractSection(response, "Benefits to Negotiate", "")
      };
      
      return sections;
    }
  } catch (error) {
    console.error('Error generating salary negotiation advice:', error);
    throw error;
  }
}

/**
 * Generate personalized feedback on a skill assessment result
 */
export async function generateSkillFeedback(
  skill: string,
  assessmentResponses: Array<{question: string, userAnswer: string, correctAnswer: string}>,
  overallScore: number
) {
  try {
    const prompt = `
      You are a skill coach providing feedback on a ${skill} assessment.
      
      The user scored ${overallScore}% overall.
      
      Here are their assessment responses:
      ${assessmentResponses.map((item, index) => `
        Question ${index + 1}: ${item.question}
        User's answer: ${item.userAnswer}
        Correct answer: ${item.correctAnswer}
      `).join('\n')}
      
      Provide personalized feedback with these components:
      
      1. Strengths - Areas they performed well in
      2. Growth Areas - Specific concepts to improve
      3. Misconceptions - Any fundamental misunderstandings detected
      4. Next Steps - Practical suggestions to improve
      
      Format the response as a JSON object with these sections as properties.
      Keep the feedback constructive, specific, and actionable.
    `;

    const response = await generateText(prompt, {
      temperature: 0.7,
      maxOutputTokens: 1024,
    });
    
    try {
      // Parse the JSON response
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse skill feedback:', e);
      
      // Extract sections if parsing fails
      const sections = {
        strengths: extractSection(response, "Strengths", "Growth Areas"),
        growthAreas: extractSection(response, "Growth Areas", "Misconceptions"),
        misconceptions: extractSection(response, "Misconceptions", "Next Steps"),
        nextSteps: extractSection(response, "Next Steps", "")
      };
      
      return sections;
    }
  } catch (error) {
    console.error('Error generating skill feedback:', error);
    throw error;
  }
}
