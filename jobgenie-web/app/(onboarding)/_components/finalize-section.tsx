/* eslint-disable react-hooks/exhaustive-deps */
// app/(onboarding)/_components/finalize-section.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Briefcase, FileText, Video, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { suggestJobRoles, recommendSkillsToLearn, calculateJobMatch } from '@/lib/gemini';
import { searchJobs } from '@/lib/jsearch';
import Lottie from 'lottie-react';
import analysingAnimation from '@/assets/animations/analyzing.json';

type ProfileData = {
  fullName: string;
  location: string;
  jobType: string;
  skills: string[];
  experience: {
    level: 'beginner' | 'intermediate' | 'advanced';
    yearsOfExperience: number;
    currentTitle?: string;
  };
  interests: string[];
  goals: string[];
};

type Props = {
  profileData: ProfileData;
  onComplete: (data?: Partial<ProfileData>) => void;
  onBack: () => void;
};

export default function FinalizeSection({ profileData, onComplete, onBack }: Props) {
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<string[]>([]);
  type JobSearchResult = {
    job_title: string;
    employer_name: string;
    job_city?: string;
    job_min_salary?: number;
    job_max_salary?: number;
    job_salary_period?: string;
    job_description?: string;
    job_apply_link?: string;
    job_id?: string;
  };
  
  const [jobMatches, setJobMatches] = useState<JobSearchResult[]>([]);
  // Define the SkillSuggestion type
  type SkillSuggestion = {
    skill: string;
    reason: string;
    resource: string;
  };
  
  const [skillSuggestions, setSkillSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingComplete, setProcessingComplete] = useState(false);
  const { user } = useAuthStore();
  
  useEffect(() => {
    generateRecommendations();
  }, []);
  
  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const recommendationItems: string[] = [];
      
      try {
        const jobSuggestions = await suggestJobRoles({
          skills: profileData.skills,
          experience: profileData.experience,
          interests: profileData.interests,
        });
        
        if (jobSuggestions && jobSuggestions.length > 0) {
          const firstJob = jobSuggestions[0];
          recommendationItems.push(`Explore opportunities as a ${firstJob.title}`);
          
          try {
            const skillRecommendations = await recommendSkillsToLearn(firstJob.title, profileData.skills);
            if (skillRecommendations && skillRecommendations.length > 0) {
              const firstSkill = skillRecommendations[0];
              recommendationItems.push(`Learn ${firstSkill.skill} to enhance your ${firstJob.title} prospects`);
              setSkillSuggestions(skillRecommendations);
            }
          } catch (error) {
            console.error('Error getting skill recommendations:', error);
          }
          
          try {
            const searchQuery = `${firstJob.title} ${profileData.jobType === 'remote' ? 'remote' : ''} ${profileData.location || ''}`.trim();
            const jobResults = await searchJobs(searchQuery, 1, 5);
            
            if (jobResults && jobResults.data && jobResults.data.length > 0) {
              const jobCount = jobResults.data.length;
              if (jobCount > 0) {
                recommendationItems.push(`We found ${jobCount} ${firstJob.title} jobs that match your profile`);
              }
              
              const sortedJobs = jobResults.data.sort((a, b) => {
                const hasSalaryA = a.job_min_salary && a.job_max_salary && a.job_salary_period;
                const hasSalaryB = b.job_min_salary && b.job_max_salary && b.job_salary_period;
                return hasSalaryB ? 1 : hasSalaryA ? -1 : 0;
              });
              
              const topJobs = sortedJobs.slice(0, 3);
              setJobMatches(topJobs);
            }
          } catch (error) {
            console.error('Error searching jobs:', error);
          }
        }
      } catch (error) {
        console.error('Error getting job suggestions:', error);
      }
      
      recommendationItems.push("Create a professional resume tailored to your target roles");
      
      if (profileData.experience.level === 'beginner') {
        recommendationItems.push("Practice interview skills with our AI mock interviewer");
      }
      
      if (recommendationItems.length < 3) {
        recommendationItems.push(
          "Customize your job search preferences",
          "Practice for interviews with JobGenie's mock interview assistant"
        );
      }
      
      setPersonalizedRecommendations(recommendationItems);
      setProcessingComplete(true);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setPersonalizedRecommendations([
        `Customize your job search preferences for ${profileData.jobType} roles`,
        `Explore learning resources for ${profileData.skills.slice(0, 2).join(', ')}`,
        "Create a tailored resume with JobGenie's AI assistant",
        "Practice for interviews with our mock interview feature"
      ]);
      setProcessingComplete(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteOnboarding = async () => {
    if (!user) return;
  
    setLoading(true);
  
    try {
      // Prepare profile data for Gemini API
      const profileForGemini = {
        skills: profileData.skills || [],
        experience: profileData.experience || { level: 'beginner', yearsOfExperience: 0 },
        interests: profileData.interests || [],
      };
  
      // Save skill recommendations
      if (skillSuggestions && skillSuggestions.length > 0) {
        for (const skill of skillSuggestions.slice(0, 3)) {
          await supabase
            .from('recommendations')
            .insert({
              user_id: user.id,
              type: 'skill',
              title: skill.skill,
              description: `${skill.reason} Resource: ${skill.resource}`
            });
        }
      }
  
      // Save up to 3 job matches with match percentages
      if (jobMatches.length > 0) {
        for (const jobMatch of jobMatches) {
          let salaryRange = "Not specified";
  
          // Check if job_min_salary and job_max_salary are available
          if (jobMatch.job_min_salary && jobMatch.job_max_salary) {
            salaryRange = `$${jobMatch.job_min_salary.toLocaleString()} - $${jobMatch.job_max_salary.toLocaleString()}`;
          } else if (jobMatch.job_description) {
            // Try to extract a salary range from job_description
            const rangeRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?-\s?(?:\$|USD)?\s?(\d{1,3}(?:,\d{3})*)/i;
            const rangeMatch = jobMatch.job_description.match(rangeRegex);
            if (rangeMatch) {
              const minSalary = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
              const maxSalary = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
              salaryRange = `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
            } else {
              // Try to extract a single salary
              const singleRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?(?!\s?-\s?(?:\$|USD)?\s?\d{1,3}(?:,\d{3})*)/i;
              const singleMatch = jobMatch.job_description.match(singleRegex);
              if (singleMatch) {
                const salary = parseInt(singleMatch[1].replace(/,/g, ''), 10);
                salaryRange = `$${salary.toLocaleString()}`;
              }
            }
          }
  
          // Calculate match percentage using Gemini
          let matchPercentage = 85; // Default fallback
          let matchReasoning = 'Based on your skills and experience'; // Default fallback
  
          try {
            const match = await calculateJobMatch(
              jobMatch.job_title,
              jobMatch.job_description || '',
              profileForGemini
            );
            matchPercentage = match.percentage;
            matchReasoning = match.reasoning;
          } catch (error) {
            console.error(`Error calculating match for job ${jobMatch.job_title}:`, error);
          }
  
          await supabase
            .from('saved_jobs')
            .insert({
              user_id: user.id,
              job_title: jobMatch.job_title || 'Job Opportunity',
              company_name: jobMatch.employer_name || '',
              job_description: jobMatch.job_description || '',
              job_location: jobMatch.job_city || profileData.location || 'Remote',
              salary_range: salaryRange,
              application_link: jobMatch.job_apply_link || '',
              external_job_id: jobMatch.job_id || '',
              status: 'recommended',
              match_percentage: matchPercentage,
              match_reasoning: matchReasoning,
              last_match_update: new Date().toISOString(),
            });
        }
      }
  
      // Save general recommendations
      for (const recommendation of personalizedRecommendations) {
        await supabase
          .from('recommendations')
          .insert({
            user_id: user.id,
            type: 'general',
            title: recommendation,
            description: ''
          });
      }
  
      onComplete();
    } catch (error) {
      console.error('Error saving recommendations:', error);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (job: JobSearchResult) => {
    // Check for job_min_salary and job_max_salary
    if (job.job_min_salary && job.job_max_salary) {
      return `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`;
    }

    // Try to extract salary from job_description
    if (job.job_description) {
      // Check for a salary range (e.g., "$140,000 - $200,000")
      const rangeRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?-\s?(?:\$|USD)?\s?(\d{1,3}(?:,\d{3})*)/i;
      const rangeMatch = job.job_description.match(rangeRegex);
      if (rangeMatch) {
        const minSalary = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
        const maxSalary = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
        return `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
      }

      // Check for a single salary (e.g., "Salary 140,000 annually")
      const singleRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?(?!\s?-\s?(?:\$|USD)?\s?\d{1,3}(?:,\d{3})*)/i;
      const singleMatch = job.job_description.match(singleRegex);
      if (singleMatch) {
        const salary = parseInt(singleMatch[1].replace(/,/g, ''), 10);
        return `$${salary.toLocaleString()}`;
      }
    }

    // Fallback
    return "Not specified";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-xl mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Your profile is ready!
      </h1>
      
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        Thanks for sharing your information, {profileData.fullName.split(' ')[0]}. Here&apos;s what I&apos;ve learned about you:
      </p>
      
      {/* Profile Summary Card */}
      <Card className="mb-8 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white text-xl font-bold mr-4">
              {profileData.fullName.split(' ').map(name => name[0]).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {profileData.fullName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {profileData.location} • {profileData.experience.level}
              </p>
              {profileData.experience.currentTitle && (
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {profileData.experience.currentTitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Skills */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {profileData.skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {skill}
                </Badge>
              ))}
              {profileData.skills.length > 5 && (
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  +{profileData.skills.length - 5} more
                </Badge>
              )}
            </div>
          </div>
          
          {/* Interests */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Interests
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {profileData.interests.join(', ')}
            </p>
          </div>
          
          {/* Goals */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Goals
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {profileData.goals.join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Job Matches Section */}
      {!loading && jobMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Job Matches
          </h2>
          
          <div className="space-y-4">
            {jobMatches.slice(0, 3).map((job, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {job.job_title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {job.employer_name} • {job.job_city || 'Remote'}
                  </p>
                  <div className="flex items-center mb-2">
                    <Briefcase className="h-4 w-4 text-indigo-600 mr-2" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Salary Range: {formatSalary(job)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Here&apos;s what you can do next:
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Lottie
              animationData={analysingAnimation}
              className="w-32 h-32"
              loop={true}
            />
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">
              JobGenie is analyzing your profile...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {personalizedRecommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.2 }}
              >
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4 flex items-start">
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-4",
                        index === 0 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" :
                        index === 1 ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" :
                        index === 2 ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      )}
                    >
                      {index === 0 ? (
                        <Briefcase className="h-5 w-5" />
                      ) : index === 1 ? (
                        <FileText className="h-5 w-5" />
                      ) : index === 2 ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 flex-1">
                      {recommendation}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button
          onClick={handleCompleteOnboarding}
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={loading || !processingComplete}
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Processing...
            </>
          ) : (
            <>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
