import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import LottieView from 'lottie-react-native';
import { suggestJobRoles, recommendSkillsToLearn } from '@/utils/gemini';
import { searchJobs } from '@/utils/jsearch';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/utils/supabase';

type OnboardingData = {
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
  cv?: {
    fileUrl?: string;
    text?: string;
    linkedInUrl?: string;
  };
};

type Props = {
  profileData: OnboardingData;
  onComplete: (data: { onboarded: boolean }) => void;
  onBack: () => void;
};

export default function FinalizeScreen({ profileData, onComplete, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<string[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const { user } = useAuthStore();
  const [firstJobMatch, setFirstJobMatch] = useState<any>(null);
  const [skillSuggestions, setSkillSuggestions] = useState<any[]>([]);
  const [salaryRange, setSalaryRange] = useState<string | null>(null); // State to store salary range

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const cardBgColor = isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.8)';
  
  useEffect(() => {
    generateRecommendations();
  }, []);
  
  const generateRecommendations = async () => {
    try {
      setLoading(true);
      let recommendationItems: string[] = [];
      
      try {
        const jobSuggestions = await suggestJobRoles({
          skills: profileData.skills,
          experience: profileData.experience,
          interests: profileData.interests
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
            const jobResults = await searchJobs(searchQuery, 1, 1);
            
            if (jobResults && jobResults.data && jobResults.data.length > 0) {
              const jobCount = jobResults.total || jobResults.data.length;
              if (jobCount > 0) {
                recommendationItems.push(`We found ${jobCount} ${firstJob.title} jobs that match your profile`);
              }
              
              const jobMatch = jobResults.data[0];
              setFirstJobMatch(jobMatch);

              // Extract salary range from the job match
              if (jobMatch.job_min_salary && jobMatch.job_max_salary && jobMatch.job_salary_period) {
                const salaryRangeText = `${jobMatch.job_min_salary} - ${jobMatch.job_max_salary} per ${jobMatch.job_salary_period.toLowerCase()}`;
                setSalaryRange(salaryRangeText);
                recommendationItems.push(`Estimated salary for ${firstJob.title}: ${salaryRangeText}`);
              } else {
                setSalaryRange(null);
              }
            }
          } catch (error) {
            console.error('Error searching jobs:', error);
          }
        }
      } catch (error) {
        console.error('Error getting job suggestions:', error);
      }
      
      if (!profileData.cv || !profileData.cv.text) {
        recommendationItems.push("Create a professional resume tailored to your target roles");
      }
      
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
      setAnimationComplete(true);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setPersonalizedRecommendations([
        `Customize your job search preferences for ${profileData.jobType} roles`,
        `Explore learning resources for ${profileData.skills.slice(0, 2).join(', ')}`,
        "Create a tailored resume with JobGenie's AI assistant",
        "Practice for interviews with our mock interview feature"
      ]);
      setAnimationComplete(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteOnboarding = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
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
      
      if (firstJobMatch) {
        await supabase
          .from('saved_jobs')
          .insert({
            user_id: user.id,
            job_title: firstJobMatch.job_title || 'Job Opportunity',
            company_name: firstJobMatch.employer_name || '',
            job_description: firstJobMatch.job_description || '',
            job_location: firstJobMatch.job_city || profileData.location || 'Remote',
            salary_range: salaryRange || 'Not available', // Save the salary range
            application_link: firstJobMatch.job_apply_link || '',
            external_job_id: firstJobMatch.job_id || '',
            status: 'recommended'
          });
      }
      
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
      
      onComplete({ onboarded: true });
    } catch (error) {
      console.error('Error saving recommendations:', error);
      onComplete({ onboarded: true });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark 
          ? ['#111827', '#1E3A8A'] 
          : ['#F9FAFB', '#EFF6FF']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={textColor} />
        </TouchableOpacity>
        
        <Text style={[styles.stepIndicator, { color: textColor }]}>
          Final Step
        </Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Text style={[styles.title, { color: textColor }]}>
            Your profile is ready!
          </Text>
          
          <Text style={[styles.subtitle, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
            Thanks for sharing your information, {profileData.fullName.split(' ')[0]}. Here's what I've learned about you:
          </Text>
          
          {/* Profile Summary Card */}
          <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {profileData.fullName.split(' ').map(name => name[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: textColor }]}>
                  {profileData.fullName}
                </Text>
                <Text style={styles.profileMeta}>
                  {profileData.location} • {profileData.experience.level}
                </Text>
                {profileData.experience.currentTitle && (
                  <Text style={styles.profileTitle}>
                    {profileData.experience.currentTitle}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Skills */}
            <View style={styles.profileSection}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Skills
              </Text>
              <View style={styles.skillsContainer}>
                {profileData.skills.slice(0, 5).map((skill, index) => (
                  <View key={index} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{skill}</Text>
                  </View>
                ))}
                {profileData.skills.length > 5 && (
                  <View style={styles.skillPill}>
                    <Text style={styles.skillPillText}>+{profileData.skills.length - 5} more</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Interests */}
            <View style={styles.profileSection}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Interests
              </Text>
              <Text style={[styles.sectionContent, { color: textColor }]}>
                {profileData.interests.join(', ')}
              </Text>
            </View>
            
            {/* Goals */}
            <View style={styles.profileSection}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Goals
              </Text>
              <Text style={[styles.sectionContent, { color: textColor }]}>
                {profileData.goals.join(', ')}
              </Text>
            </View>
          </View>
          
          {/* Job Match Section */}
          {firstJobMatch && (
            <View style={[styles.card, { backgroundColor: cardBgColor, borderColor, marginBottom: 28 }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Top Job Match
              </Text>
              <Text style={[styles.jobTitle, { color: textColor }]}>
                {firstJobMatch.job_title}
              </Text>
              <Text style={[styles.jobMeta, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                {firstJobMatch.employer_name} • {firstJobMatch.job_city || 'Remote'}
              </Text>
              <View style={styles.jobDetail}>
                <Feather name="dollar-sign" size={16} color="#6366F1" style={styles.jobDetailIcon} />
                <Text style={[styles.jobDetailText, { color: textColor }]}>
                  Salary Range: {salaryRange || 'Not available'}
                </Text>
              </View>
            </View>
          )}
          
          {/* Recommendations Section */}
          <View style={styles.recommendationsSection}>
            <Text style={[styles.recommendationsTitle, { color: textColor }]}>
              Here's what you can do next:
            </Text>
            
            {!animationComplete ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require('@/assets/animations/analyzing.json')}
                  style={styles.loadingAnimation}
                  autoPlay
                  loop
                />
                <Text style={[styles.loadingText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  JobGenie is analyzing your profile...
                </Text>
              </View>
            ) : (
              <View style={styles.recommendationsList}>
                {personalizedRecommendations.map((recommendation, index) => (
                  <MotiView
                    key={index}
                    from={{ opacity: 0, translateX: 20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 300, delay: index * 200 }}
                    style={[styles.recommendationItem, { borderColor }]}
                  >
                    <View style={styles.recommendationIcon}>
                      <Feather 
                        name={index === 0 ? 'bell' : index === 1 ? 'book-open' : index === 2 ? 'briefcase' : 'message-square'} 
                        size={20} 
                        color="#6366F1" 
                      />
                    </View>
                    <Text style={[styles.recommendationText, { color: textColor }]}>
                      {recommendation}
                    </Text>
                  </MotiView>
                ))}
              </View>
            )}
          </View>
        </MotiView>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleCompleteOnboarding} 
          disabled={loading || !animationComplete}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#06B6D4']}
            start={[0, 0]}
            end={[1, 0]}
            style={[
              styles.button,
              (loading || !animationComplete) && { opacity: 0.7 }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Get Started</Text>
                <Feather name="arrow-right" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 28,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '500',
  },
  profileSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(209, 213, 219, 0.3)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  skillPillText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '500',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  jobMeta: {
    fontSize: 14,
    marginBottom: 8,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  jobDetailIcon: {
    marginRight: 8,
  },
  jobDetailText: {
    fontSize: 15,
  },
  recommendationsSection: {
    marginBottom: 28,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingAnimation: {
    width: 120,
    height: 120,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
