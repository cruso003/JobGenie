// app/(tabs)/genie.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MotiView } from 'moti';
import LottieView from 'lottie-react-native';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

export default function GenieScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchInterviewHistory();
    }
  }, [user]);
  
  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInterviewHistory = async () => {
    try {
      // In a real app, we would fetch actual interview history from the database
      // For now, we'll use mock data
      setInterviewHistory([
        {
          id: '1',
          date: '2025-04-10',
          role: 'Frontend Developer',
          company: 'TechCorp',
          type: 'behavioral',
          score: 4.2,
        },
        {
          id: '2',
          date: '2025-04-05',
          role: 'React Native Developer',
          company: 'MobileApp Inc',
          type: 'technical',
          score: 3.8,
        }
      ]);
    } catch (error) {
      console.error('Error fetching interview history:', error);
    }
  };
  
  const interviewTypes = [
    {
      type: 'behavioral',
      title: 'Behavioral Interview',
      description: 'Practice answering questions about your experience and soft skills',
      icon: 'users',
    },
    {
      type: 'technical',
      title: 'Technical Interview',
      description: 'Answer technical questions related to your field',
      icon: 'code',
    },
    {
      type: 'general',
      title: 'General Interview',
      description: 'Mix of common interview questions across different areas',
      icon: 'briefcase',
    }
  ];
  
  const handleStartNewInterview = (type: string) => {
    router.push({
      pathname: "/genie/interview",
      params: {
        type,
        role: profile?.experience?.currentTitle || 'Software Developer',
      }
    });
  };
  
  const handleContinueInterview = (interview: any) => {
    router.push({
      pathname: "/genie/interview",
      params: {
        type: interview.type,
        role: interview.role,
        company: interview.company,
        interviewId: interview.id,
      }
    });
  };
  
  return (
    <View className="flex-1">
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        className="absolute inset-0"
      />
      
      {/* Header */}
      <View className="pt-14 pb-4 px-6">
        <Text 
          className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Interview Coach
        </Text>
        <Text 
          className={cn(
            "text-base mt-1",
            isDark ? "text-gray-300" : "text-gray-600"
          )}
        >
          Practice for your next job interview
        </Text>
      </View>
      
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          className="mb-6"
        >
          <View 
            className={cn(
              "rounded-2xl overflow-hidden",
              isDark ? "bg-gray-800/60" : "bg-white/70"
            )}
          >
            <LinearGradient
              colors={["#6366F1", "#8B5CF6"]}
              start={[0, 0]}
              end={[1, 0]}
              className="p-5"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-2">
                    Upgrade to Pro
                  </Text>
                  <Text className="text-white/90 text-sm">
                    Get advanced video interviews, personalized feedback, and unlimited practice sessions
                  </Text>
                </View>
                <View className="bg-white/20 p-3 rounded-full">
                  <Feather name="zap" size={24} color="white" />
                </View>
              </View>
              
              <TouchableOpacity 
                className="bg-white mt-4 py-2 px-4 rounded-full self-start"
                onPress={() => {
                  // Navigate to upgrade screen
                }}
              >
                <Text className="text-primary font-semibold">Learn More</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </MotiView>
        
        {/* Interview Types */}
        <Text 
          className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Start a New Interview
        </Text>
        
        <View className="mb-6">
          {interviewTypes.map((item, index) => (
            <MotiView
              key={item.type}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 600, delay: index * 100 }}
            >
              <TouchableOpacity 
                className={cn(
                  "p-4 rounded-xl mb-3 flex-row items-center",
                  isDark ? "bg-gray-800/80" : "bg-white/80"
                )}
                onPress={() => handleStartNewInterview(item.type)}
              >
                <View
                  className={cn(
                    "w-12 h-12 rounded-full items-center justify-center mr-4",
                    item.type === 'behavioral' ? "bg-blue-500/20" :
                    item.type === 'technical' ? "bg-green-500/20" : "bg-purple-500/20"
                  )}
                >
                  <Feather 
                    name={item.icon as any} 
                    size={24} 
                    color={
                      item.type === 'behavioral' ? "#3B82F6" :
                      item.type === 'technical' ? "#10B981" : "#8B5CF6"
                    }
                  />
                </View>
                
                <View className="flex-1">
                  <Text 
                    className={cn(
                      "text-lg font-semibold",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    {item.title}
                  </Text>
                  <Text 
                    className={cn(
                      "text-sm",
                      isDark ? "text-gray-300" : "text-gray-600"
                    )}
                  >
                    {item.description}
                  </Text>
                </View>
                
                <Feather 
                  name="chevron-right" 
                  size={24} 
                  color={isDark ? "#9CA3AF" : "#6B7280"} 
                />
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
        
        {/* Recent Interviews */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text 
              className={cn(
                "text-lg font-semibold",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              Recent Interviews
            </Text>
            {interviewHistory.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  // Navigate to history screen
                }}
              >
                <Text className="text-primary">See All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {interviewHistory.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {interviewHistory.map((interview, index) => (
                <MotiView
                  key={interview.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 600, delay: index * 100 }}
                  style={{ width: cardWidth }}
                  className="mr-4"
                >
                  <TouchableOpacity 
                    className={cn(
                      "p-4 rounded-xl",
                      isDark ? "bg-gray-800/80" : "bg-white/80"
                    )}
                    onPress={() => handleContinueInterview(interview)}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-row items-center">
                        <View
                          className={cn(
                            "w-10 h-10 rounded-full items-center justify-center mr-3",
                            interview.type === 'behavioral' ? "bg-blue-500/20" :
                            interview.type === 'technical' ? "bg-green-500/20" : "bg-purple-500/20"
                          )}
                        >
                          <Feather 
                            name={
                              interview.type === 'behavioral' ? "users" :
                              interview.type === 'technical' ? "code" : "briefcase"
                            } 
                            size={20} 
                            color={
                              interview.type === 'behavioral' ? "#3B82F6" :
                              interview.type === 'technical' ? "#10B981" : "#8B5CF6"
                            }
                          />
                        </View>
                        
                        <View>
                          <Text 
                            className={cn(
                              "font-semibold",
                              isDark ? "text-white" : "text-gray-900"
                            )}
                          >
                            {interview.role}
                          </Text>
                          <Text 
                            className={cn(
                              "text-sm",
                              isDark ? "text-gray-300" : "text-gray-600"
                            )}
                          >
                            {interview.company}
                          </Text>
                        </View>
                      </View>
                      
                      <Text 
                        className={cn(
                          "text-xs",
                          isDark ? "text-gray-400" : "text-gray-500"
                        )}
                      >
                        {new Date(interview.date).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text 
                          className={cn(
                            "font-medium mr-2",
                            isDark ? "text-white" : "text-gray-900"
                          )}
                        >
                          Score:
                        </Text>
                        <View className="flex-row">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Feather
                              key={star}
                              name="star"
                              size={16}
                              color={star <= Math.round(interview.score) ? "#FBBF24" : "#9CA3AF"}
                            />
                          ))}
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        className="bg-primary px-3 py-1 rounded-full"
                      >
                        <Text className="text-white font-medium text-sm">Continue</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </ScrollView>
          ) : (
            <View 
              className={cn(
                "p-6 rounded-xl items-center justify-center",
                isDark ? "bg-gray-800/80" : "bg-white/80"
              )}
            >
              <LottieView
                source={require('@/assets/animations/genie-animation.json')}
                style={{ width: 120, height: 120 }}
                autoPlay
                loop
              />
              <Text 
                className={cn(
                  "text-center mt-4",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                No interview history yet. Start your first practice session today!
              </Text>
            </View>
          )}
        </View>
        
        {/* Tips & Resources */}
        <View className="mb-8">
          <Text 
            className={cn(
              "text-lg font-semibold mb-4",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Interview Tips
          </Text>
          
          <View 
            className={cn(
              "p-4 rounded-xl",
              isDark ? "bg-gray-800/80" : "bg-white/80"
            )}
          >
            <View className="flex-row items-center mb-3">
              <Feather name="info" size={20} color="#3B82F6" />
              <Text 
                className={cn(
                  "ml-2 font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Quick Tips for Success
              </Text>
            </View>
            
            <View className="mb-2">
              <Text 
                className={cn(
                  "font-medium mb-1",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                1. Use the STAR Method
              </Text>
              <Text 
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                Situation, Task, Action, Result - structure your answers to behavioral questions.
              </Text>
            </View>
            
            <View className="mb-2">
              <Text 
                className={cn(
                  "font-medium mb-1",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                2. Practice Speaking Clearly
              </Text>
              <Text 
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                Record yourself and review your pace, tone, and clarity.
              </Text>
            </View>
            
            <View>
              <Text 
                className={cn(
                  "font-medium mb-1",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                3. Research the Company
              </Text>
              <Text 
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                Understand the company's values, products, and culture before your interview.
              </Text>
            </View>
            
            <TouchableOpacity 
              className="mt-4 self-end"
              onPress={() => {
                // Navigate to tips page
              }}
            >
              <Text className="text-primary font-medium">More Tips</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
