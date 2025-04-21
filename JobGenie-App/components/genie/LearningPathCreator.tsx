// components/genie/LearningPathCreator.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Switch
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useProfileStore } from '@/stores/profile';
import { useSkillsStore } from '@/stores/skills';
import { recommendSkillsToLearn } from '@/utils/gemini';

// Define interfaces for the learning path structure
interface Skill {
  skill: string;
  [key: string]: any;
}
  
interface Resource {
  [key: string]: string;
}
  
interface Milestone {
  name: string;
  duration: string;
  skills: string[];
  resources: string[];
  project: string | null;
}
  
interface LearningPath {
  title: string;
  description: string;
  timeline: string;
  milestones: Milestone[];
}

interface LearningPathCreatorProps {
  targetRole?: string;
  onSave?: (path: any) => void;
  onClose: () => void;
  isDark: boolean;
}

export default function LearningPathCreator({
  targetRole = '',
  onSave,
  onClose,
  isDark
}: LearningPathCreatorProps) {
  const { profile } = useProfileStore();
  const { startSkill } = useSkillsStore();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [roleName, setRoleName] = useState(targetRole);
  const [timeFrame, setTimeFrame] = useState('3 months');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [includeProjects, setIncludeProjects] = useState(true);
  const [learningPath, setLearningPath] = useState<any>(null);
  
  // Generate learning path
  const generatePath = async () => {
    if (!roleName) {
      alert('Please enter a target role');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First get skills recommendations
      const userSkills = profile?.skills || [];
      const skillRecommendations = await recommendSkillsToLearn(roleName, userSkills);
      
    // Sample response (would come from Gemini API)
      // Sample response (would come from Gemini API)
    // Define interfaces for the learning path structure
    interface Skill {
      skill: string;
      [key: string]: any;
    }
    
    interface Resource {
      [key: string]: string;
    }
    
    interface Milestone {
      name: string;
      duration: string;
      skills: string[];
      resources: string[];
      project: string | null;
    }
    
    interface LearningPath {
      title: string;
      description: string;
      timeline: string;
      milestones: Milestone[];
    }

    const samplePath: LearningPath = {
      title: `${roleName} Career Path`,
      description: `A structured learning journey to become a ${roleName} in ${timeFrame}`,
      timeline: timeFrame,
      milestones: [
        {
          name: "Foundation Phase",
          duration: "4 weeks",
          skills: skillRecommendations.slice(0, 2).map((s: Skill) => s.skill),
          resources: [
            "Udemy: Complete Web Developer Bootcamp",
            "freeCodeCamp: Responsive Web Design",
            "MDN Web Docs"
          ],
          project: includeProjects ? "Personal portfolio website" : null
        },
        {
          name: "Core Skills Phase",
          duration: "6 weeks",
          skills: skillRecommendations.slice(2, 4).map((s: Skill) => s.skill),
          resources: [
            "Coursera: React Specialization",
            "YouTube: Traversy Media",
            "CodeWithMosh: Advanced Courses"
          ],
          project: includeProjects ? "Interactive web application" : null
        },
        {
          name: "Advanced Phase",
          duration: "8 weeks",
          skills: [skillRecommendations[4]?.skill || "Advanced frameworks"],
          resources: [
            "Udemy: Advanced React Patterns",
            "GitHub: Open source contributions",
            "Medium articles and tech blogs"
          ],
          project: includeProjects ? "Full-stack project with authentication" : null
        },
        {
          name: "Portfolio & Job Preparation",
          duration: "2 weeks",
          skills: ["Interview preparation", "Portfolio refinement"],
          resources: [
            "Pramp: Mock interviews",
            "LeetCode/HackerRank for practice",
            "Resume and LinkedIn optimization"
          ],
          project: includeProjects ? "Technical presentation video" : null
        }
      ]
    };
      
      setLearningPath(samplePath);
    } catch (error) {
      console.error('Error generating learning path:', error);
      alert('Failed to generate learning path. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save skills to the user's account
  const saveToAccount = async () => {
    if (!learningPath) return;
    
    try {
      // Extract all skills from the learning path
    const allSkills: string[] = learningPath.milestones.flatMap((m: Milestone) => m.skills);
      
      // Add skills to the user's account
      for (const skill of allSkills) {
        if (typeof skill === 'string') {
          await startSkill(skill);
        }
      }
      
      // Call onSave callback with the learning path
      if (onSave) {
        onSave(learningPath);
      }
      
      alert('Learning path saved to your account!');
    } catch (error) {
      console.error('Error saving learning path:', error);
      alert('Failed to save learning path. Please try again.');
    }
  };
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }
    ]}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: isDark ? '#FFFFFF' : '#111827' }
        ]}>
          Create Learning Path
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {!learningPath ? (
          // Form to configure learning path
          <View style={styles.form}>
            <Text style={[
              styles.label,
              { color: isDark ? '#D1D5DB' : '#4B5563' }
            ]}>
              Target Role
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(243, 244, 246, 0.8)',
                  color: isDark ? '#FFFFFF' : '#111827'
                }
              ]}
              value={roleName}
              onChangeText={setRoleName}
              placeholder="e.g. Frontend Developer"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            />
            
            <Text style={[
              styles.label,
              { color: isDark ? '#D1D5DB' : '#4B5563' }
            ]}>
              Time Frame
            </Text>
            <View style={styles.optionsContainer}>
              {['3 months', '6 months', '1 year'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    timeFrame === option && styles.selectedOption,
                    {
                      backgroundColor: isDark 
                        ? timeFrame === option ? 'rgba(99, 102, 241, 0.3)' : 'rgba(31, 41, 55, 0.6)' 
                        : timeFrame === option ? 'rgba(99, 102, 241, 0.2)' : 'rgba(243, 244, 246, 0.8)'
                    }
                  ]}
                  onPress={() => setTimeFrame(option)}
                >
                  <Text style={[
                    styles.optionText,
                    timeFrame === option && styles.selectedOptionText,
                    { color: timeFrame === option ? '#6366F1' : isDark ? '#D1D5DB' : '#4B5563' }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[
              styles.label,
              { color: isDark ? '#D1D5DB' : '#4B5563' }
            ]}>
              Target Skill Level
            </Text>
            <View style={styles.optionsContainer}>
              {['beginner', 'intermediate', 'advanced'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    skillLevel === option && styles.selectedOption,
                    {
                      backgroundColor: isDark 
                        ? skillLevel === option ? 'rgba(99, 102, 241, 0.3)' : 'rgba(31, 41, 55, 0.6)' 
                        : skillLevel === option ? 'rgba(99, 102, 241, 0.2)' : 'rgba(243, 244, 246, 0.8)'
                    }
                  ]}
                  onPress={() => setSkillLevel(option)}
                >
                  <Text style={[
                    styles.optionText,
                    skillLevel === option && styles.selectedOptionText,
                    { color: skillLevel === option ? '#6366F1' : isDark ? '#D1D5DB' : '#4B5563' }
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={[
                styles.switchLabel,
                { color: isDark ? '#D1D5DB' : '#4B5563' }
              ]}>
                Include hands-on projects
              </Text>
              <Switch
                value={includeProjects}
                onValueChange={setIncludeProjects}
                trackColor={{ false: '#9CA3AF', true: '#6366F1' }}
                thumbColor={includeProjects ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.generateButton,
                isLoading && { opacity: 0.7 }
              ]}
              onPress={generatePath}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>
                  Generate Learning Path
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Display generated learning path
          <View style={styles.learningPathContainer}>
            <View style={[
              styles.pathHeader,
              { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }
            ]}>
              <Text style={[
                styles.pathTitle,
                { color: isDark ? '#FFFFFF' : '#111827' }
              ]}>
                {learningPath.title}
              </Text>
              <Text style={[
                styles.pathDescription,
                { color: isDark ? '#D1D5DB' : '#4B5563' }
              ]}>
                {learningPath.description}
              </Text>
              <Text style={[
                styles.pathTimeline,
                { color: isDark ? '#6366F1' : '#6366F1' }
              ]}>
                Timeline: {learningPath.timeline}
              </Text>
            </View>
            
            {learningPath.milestones.map((milestone: Milestone, index: number) => (
                <View 
                    key={index}
                    style={[
                        styles.milestone,
                        { backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.8)' }
                    ]}
                >
                    <View style={styles.milestoneHeader}>
                        <View style={styles.milestoneNumberContainer}>
                            <Text style={styles.milestoneNumber}>{index + 1}</Text>
                        </View>
                        <View style={styles.milestoneHeaderText}>
                            <Text style={[
                                styles.milestoneName,
                                { color: isDark ? '#FFFFFF' : '#111827' }
                            ]}>
                                {milestone.name}
                            </Text>
                            <Text style={[
                                styles.milestoneDuration,
                                { color: isDark ? '#D1D5DB' : '#4B5563' }
                            ]}>
                                {milestone.duration}
                            </Text>
                        </View>
                    </View>
                    
                    <Text style={[
                        styles.sectionTitle,
                        { color: isDark ? '#6366F1' : '#6366F1' }
                    ]}>
                        Skills to Learn
                    </Text>
                    <View style={styles.skillsContainer}>
                        {milestone.skills.map((skill: string, idx: number) => (
                            <View 
                                key={idx}
                                style={[
                                    styles.skillBadge,
                                    { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }
                                ]}
                            >
                                <Text style={[
                                    styles.skillBadgeText,
                                    { color: isDark ? '#6366F1' : '#6366F1' }
                                ]}>
                                    {skill}
                                </Text>
                            </View>
                        ))}
                    </View>
                    
                    <Text style={[
                        styles.sectionTitle,
                        { color: isDark ? '#6366F1' : '#6366F1' }
                    ]}>
                        Recommended Resources
                    </Text>
                    {milestone.resources.map((resource: string, idx: number) => (
                        <Text 
                            key={idx}
                            style={[
                                styles.resourceItem,
                                { color: isDark ? '#D1D5DB' : '#4B5563' }
                            ]}
                        >
                            • {resource}
                        </Text>
                    ))}
                    
                    {milestone.project && (
                        <>
                            <Text style={[
                                styles.sectionTitle,
                                { color: isDark ? '#6366F1' : '#6366F1' }
                            ]}>
                                Hands-on Project
                            </Text>
                            <View style={[
                                styles.projectContainer,
                                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                            ]}>
                                <Feather name="code" size={18} color="#3B82F6" style={styles.projectIcon} />
                                <Text style={[
                                    styles.projectText,
                                    { color: isDark ? '#D1D5DB' : '#4B5563' }
                                ]}>
                                    {milestone.project}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            ))}
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setLearningPath(null)}
              >
                <Feather name="edit-2" size={18} color="#6366F1" />
                <Text style={styles.editButtonText}>Edit Parameters</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveToAccount}
              >
                <Feather name="save" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save To My Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedOption: {
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  learningPathContainer: {
    padding: 16,
  },
  pathHeader: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pathDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  pathTimeline: {
    fontSize: 14,
    fontWeight: '600',
  },
  milestone: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  milestoneHeaderText: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  milestoneDuration: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillBadge: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    margin: 4,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resourceItem: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 4,
  },
  projectContainer: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  projectIcon: {
    marginRight: 8,
  },
  projectText: {
    fontSize: 14,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 32,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: '#6366F1',
    fontWeight: '500',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
});
