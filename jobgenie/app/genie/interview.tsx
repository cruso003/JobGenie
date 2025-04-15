// app/genie/interview.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, CameraType, CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MotiView } from 'moti';
import { evaluateInterviewAnswer, generateInterviewQuestions } from '@/utils/gemini';
import { cn } from '@/utils/cn';

interface Question {
  id: string;
  question: string;
  guidance: string;
}

interface Answer {
  questionId: string;
  text: string;
  feedback?: string;
  score?: number;
}

export default function InterviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { role = 'Software Developer', company, type = 'behavioral' } = params;
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('front')
  const [isVideoMode, setIsVideoMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const windowHeight = Dimensions.get('window').height;
  
  // Request camera and audio permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      setHasPermission(
        cameraStatus === 'granted' && audioStatus === 'granted'
      );
    })();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Start timer when interview begins
  useEffect(() => {
    if (questions.length > 0 && !interviewComplete) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [questions, interviewComplete]);
  
  // Fetch interview questions on mount
  useEffect(() => {
    fetchInterviewQuestions();
  }, []);
  
  const fetchInterviewQuestions = async () => {
    try {
      setIsLoading(true);
      const questionList = await generateInterviewQuestions(
        String(role),
        [], // User skills would come from profile
        type as 'behavioral' | 'technical' | 'general',
        5 // Number of questions
      );
      
      const formattedQuestions: Question[] = questionList.map((q: any, index: number) => ({
        id: `q-${index}`,
        question: q.question,
        guidance: q.guidance
      }));
      
      setQuestions(formattedQuestions);
      
      // Initialize answers array
      const initialAnswers: Answer[] = formattedQuestions.map(q => ({
        questionId: q.id,
        text: ''
      }));
      
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      Alert.alert(
        'Error',
        'Failed to load interview questions. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleNextQuestion = async () => {
    // Save current answer
    if (currentAnswer.trim()) {
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestionIndex] = {
        ...updatedAnswers[currentQuestionIndex],
        text: currentAnswer
      };
      setAnswers(updatedAnswers);
      
      // Get AI feedback if not the last question
      if (currentQuestionIndex < questions.length - 1) {
        await getFeedbackForAnswer(
          questions[currentQuestionIndex], 
          currentAnswer,
          currentQuestionIndex
        );
      }
      
      // Move to next question or complete interview
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else {
        // Get feedback for the final question
        await getFeedbackForAnswer(
          questions[currentQuestionIndex], 
          currentAnswer,
          currentQuestionIndex
        );
        
        // Complete the interview
        completeInterview();
      }
    } else {
      Alert.alert('Empty Answer', 'Please provide an answer before continuing.');
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1].text);
    }
  };
  
  const getFeedbackForAnswer = async (
    question: Question, 
    answer: string,
    index: number
  ) => {
    try {
      setIsFeedbackLoading(true);
      
      const feedback = await evaluateInterviewAnswer(
        String(role),
        question.question,
        answer,
        question.guidance
      );
      
      const updatedAnswers = [...answers];
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        text: answer,
        feedback: feedback.feedback,
        score: feedback.score
      };
      
      setAnswers(updatedAnswers);
      
      // Update total score
      const scores = updatedAnswers
        .filter(a => a.score !== undefined)
        .map(a => a.score as number);
      
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        setTotalScore(avgScore);
      }
      
    } catch (error) {
      console.error('Error getting feedback:', error);
    } finally {
      setIsFeedbackLoading(false);
    }
  };
  
  const completeInterview = () => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setInterviewComplete(true);
    
    // Calculate final score
    const scores = answers
      .filter(a => a.score !== undefined)
      .map(a => a.score as number);
    
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      setTotalScore(avgScore);
    }
  };
  
  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      
      // In a real app, we would record video here
      // For now, we'll just simulate recording
      Alert.alert('Recording Started', 'Video recording would start here in a production app.');
    }
  };
  
  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      setIsRecording(false);
      
      // In a real app, we would stop recording here
      Alert.alert('Recording Stopped', 'Video recording would stop here in a production app.');
    }
  };
  
  
  const toggleVideoMode = () => {
    setIsVideoMode(!isVideoMode);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const endInterview = () => {
    Alert.alert(
      'End Interview',
      'Are you sure you want to end this interview? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Interview', 
          onPress: () => {
            completeInterview();
          }
        }
      ]
    );
  };
  
  // If permissions are still being checked
  if (hasPermission === null) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="mt-2">Checking camera permissions...</Text>
      </View>
    );
  }
  
  // If permissions were denied
  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Feather name="camera-off" size={64} color="#EF4444" />
        <Text className="text-lg font-semibold text-center mt-4">
          Camera and microphone permissions are required for mock interviews.
        </Text>
        <TouchableOpacity 
          className="mt-4 px-6 py-3 bg-primary rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        className="absolute inset-0"
      />
      
      <View className="flex-1">
        {/* Interview Header */}
        <View className="flex-row items-center justify-between p-4 pt-14">
          <TouchableOpacity 
            className={cn(
              "p-2 rounded-full",
              isDark ? "bg-gray-800" : "bg-white/70"
            )}
            onPress={() => router.back()}
          >
            <Feather 
              name="x" 
              size={24} 
              color={isDark ? "#FFFFFF" : "#111827"} 
            />
          </TouchableOpacity>
          
          <View className="items-center">
            <Text 
              className={cn(
                "text-lg font-semibold",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              {type === 'behavioral' ? 'Behavioral' : type === 'technical' ? 'Technical' : 'Mock'} Interview
            </Text>
            <Text 
              className={cn(
                "text-sm",
                isDark ? "text-gray-300" : "text-gray-600"
              )}
            >
              {String(role)} {company ? `at ${company}` : ''}
            </Text>
          </View>
          
          <View 
            className={cn(
              "px-3 py-1 rounded-full",
              isDark ? "bg-gray-800" : "bg-white/70"
            )}
          >
            <Text 
              className={cn(
                "font-mono",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              {formatTime(timeElapsed)}
            </Text>
          </View>
        </View>
        
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text 
              className={cn(
                "mt-4 text-center",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              Preparing your interview questions...
            </Text>
          </View>
        ) : interviewComplete ? (
          <ScrollView className="flex-1 p-6">
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 600 }}
            >
              <View 
                className={cn(
                  "rounded-3xl overflow-hidden mb-6",
                  isDark ? "bg-gray-800/80" : "bg-white/80"
                )}
              >
                <LinearGradient
                  colors={["#6366F1", "#06B6D4"]}
                  start={[0, 0]}
                  end={[1, 0]}
                  className="px-6 py-8"
                >
                  <Text className="text-white text-2xl font-bold mb-2">
                    Interview Complete!
                  </Text>
                  <Text className="text-white/90 text-base mb-4">
                    You've completed the mock interview for {role}.
                  </Text>
                  
                  <View className="flex-row items-center justify-between bg-white/20 p-4 rounded-xl">
                    <View>
                      <Text className="text-white/80 text-sm">Total Score</Text>
                      <Text className="text-white text-3xl font-bold">
                        {Math.round(totalScore * 20)}%
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white/80 text-sm">Time</Text>
                      <Text className="text-white text-xl font-semibold">
                        {formatTime(timeElapsed)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white/80 text-sm">Questions</Text>
                      <Text className="text-white text-xl font-semibold">
                        {questions.length}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
                
                <View className="p-6">
                  <Text 
                    className={cn(
                      "text-lg font-semibold mb-4",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    Performance Summary
                  </Text>
                  
                  <View className="mb-6">
                    <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <View 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.min(Math.round(totalScore * 20), 100)}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-xs text-gray-500">Needs Improvement</Text>
                      <Text className="text-xs text-gray-500">Excellent</Text>
                    </View>
                  </View>
                  
                  <Text 
                    className={cn(
                      "text-base mb-4",
                      isDark ? "text-white/90" : "text-gray-700"
                    )}
                  >
                    {totalScore >= 4 
                      ? "Excellent job! Your responses were clear, concise, and demonstrated strong qualifications."
                      : totalScore >= 3
                        ? "Good performance overall. Your answers showed potential with some areas for improvement."
                        : "You've made a start, but there's room for growth. Review the feedback for each question."}
                  </Text>
                </View>
              </View>
              
              <Text 
                className={cn(
                  "text-lg font-semibold mb-4",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Question Analysis
              </Text>
              
              {answers.map((answer, index) => (
                <View 
                  key={answer.questionId}
                  className={cn(
                    "p-4 rounded-xl mb-4",
                    isDark ? "bg-gray-800/80" : "bg-white/80"
                  )}
                >
                  <View className="flex-row items-center mb-2">
                    <View
                      className={cn(
                        "w-8 h-8 rounded-full items-center justify-center mr-3",
                        "bg-primary"
                      )}
                    >
                      <Text className="text-white font-bold">{index + 1}</Text>
                    </View>
                    <Text 
                      className={cn(
                        "flex-1 font-medium",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    >
                      {questions[index].question}
                    </Text>
                  </View>
                  
                  <View 
                    className={cn(
                      "p-3 rounded-lg mb-3",
                      isDark ? "bg-gray-700/50" : "bg-gray-100"
                    )}
                  >
                    <Text 
                      className={cn(
                        "italic",
                        isDark ? "text-white/80" : "text-gray-700"
                      )}
                    >
                      {answer.text || "No answer provided"}
                    </Text>
                  </View>
                  
                  {answer.feedback && (
                    <View 
                      className={cn(
                        "p-3 rounded-lg",
                        isDark ? "bg-blue-900/20" : "bg-blue-50"
                      )}
                    >
                      <Text 
                        className={cn(
                          "font-medium mb-1",
                          isDark ? "text-white" : "text-gray-900"
                        )}
                      >
                        Feedback:
                      </Text>
                      <Text 
                        className={cn(
                          isDark ? "text-white/80" : "text-gray-700"
                        )}
                      >
                        {answer.feedback}
                      </Text>
                      {answer.score !== undefined && (
                        <View className="flex-row items-center mt-2">
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
                                color={star <= answer.score! ? "#FBBF24" : "#9CA3AF"}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
              
              <View className="flex-row mt-4 mb-8">
                <TouchableOpacity 
                  className="flex-1 bg-primary rounded-xl py-4 items-center"
                  onPress={() => router.push("/(tabs)/genie")}
                >
                  <Text className="text-white font-medium">Return to Genie</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </ScrollView>
        ) : (
          <>
            {/* Video Feed Section (top 40-50%) */}
            <View style={{ height: windowHeight * 0.45 }} className="px-4 pb-4">
              <View 
                className={cn(
                  "flex-1 rounded-2xl overflow-hidden",
                  !isVideoMode && "bg-gray-800"
                )}
              >
                {isVideoMode ? (
                  <CameraView
                    ref={cameraRef}
                    facing={cameraType}
                    ratio="16:9"
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Feather name="mic" size={48} color="#FFFFFF" />
                    <Text className="text-white text-center mt-2">
                      Audio Only Mode
                    </Text>
                  </View>
                )}
                
                {/* Camera Controls */}
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-6">
                  <TouchableOpacity 
                    className="bg-white/20 p-3 rounded-full items-center justify-center"
                    onPress={toggleMute}
                  >
                    <Feather 
                      name={isMuted ? "mic-off" : "mic"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                  
                  {isRecording ? (
                    <TouchableOpacity 
                      className="bg-red-500 p-4 rounded-full items-center justify-center"
                      onPress={stopRecording}
                    >
                      <View className="w-4 h-4 bg-white rounded" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      className="bg-red-500 p-4 rounded-full items-center justify-center"
                      onPress={startRecording}
                    >
                      <Feather name="circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    className="bg-white/20 p-3 rounded-full items-center justify-center"
                    onPress={toggleVideoMode}
                  >
                    <Feather 
                      name={isVideoMode ? "video" : "video-off"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Question & Answer Section (bottom 50-60%) */}
            <View 
              className={cn(
                "flex-1 px-4 rounded-t-3xl pt-6 pb-4",
                isDark ? "bg-gray-900" : "bg-gray-100"
              )}
            >
              <ScrollView className="flex-1">
                {/* Progress Indicator */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text 
                    className={cn(
                      "font-medium",
                      isDark ? "text-white/70" : "text-gray-500"
                    )}
                  >
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Text>
                  <TouchableOpacity 
                    className={cn(
                      "px-3 py-1 rounded-full",
                      isDark ? "bg-red-900/20" : "bg-red-100"
                    )}
                    onPress={endInterview}
                  >
                    <Text className="text-red-500 font-medium">End</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Progress Bar */}
                <View className="h-1 bg-gray-200 rounded-full mb-6">
                  <View 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </View>
                
                {/* Current Question */}
                <View 
                  className={cn(
                    "p-4 rounded-xl mb-4",
                    isDark ? "bg-gray-800" : "bg-white"
                  )}
                >
                  <Text 
                    className={cn(
                      "text-lg font-medium mb-2",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    {questions[currentQuestionIndex]?.question || "Loading question..."}
                  </Text>
                  
                  <View 
                    className={cn(
                      "p-3 rounded-lg",
                      isDark ? "bg-blue-900/20" : "bg-blue-50"
                    )}
                  >
                    <Text 
                      className={cn(
                        "text-sm",
                        isDark ? "text-blue-300" : "text-blue-800"
                      )}
                    >
                      <Feather name="info" size={14} color={isDark ? "#93C5FD" : "#1D4ED8"} /> Tip: {
                        questions[currentQuestionIndex]?.guidance || "Be concise and provide specific examples."
                      }
                    </Text>
                  </View>
                </View>
                
                {/* Current Answer */}
                <View 
                  className={cn(
                    "p-4 rounded-xl mb-4",
                    isDark ? "bg-gray-800" : "bg-white"
                  )}
                >
                  <Text 
                    className={cn(
                      "font-medium mb-2",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    Your Answer:
                  </Text>
                  
                  <TextInput
                    className={cn(
                      "p-3 rounded-lg mb-3",
                      isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
                    )}
                    placeholder="Type your answer here..."
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={currentAnswer}
                    onChangeText={setCurrentAnswer}
                  />
                  
                  <View className="flex-row">
                    <TouchableOpacity 
                      className={cn(
                        "flex-row items-center justify-center p-3 rounded-lg mr-2",
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      )}
                      onPress={() => {
                        // In a real app, we would initiate voice-to-text here
                        Alert.alert('Voice Input', 'Voice-to-text would be activated here in a production app.');
                      }}
                    >
                      <Feather 
                        name="mic" 
                        size={18} 
                        color={isDark ? "#FFFFFF" : "#111827"} 
                      />
                      <Text 
                        className={cn(
                          "ml-2 font-medium",
                          isDark ? "text-white" : "text-gray-900"
                        )}
                      >
                        Speak
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="flex-1 bg-primary p-3 rounded-lg items-center justify-center"
                      onPress={() => setCurrentAnswer('')}
                    >
                      <Text className="text-white font-medium">Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Answer Feedback (when available) */}
                {answers[currentQuestionIndex]?.feedback && (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 300 }}
                    className={cn(
                      "p-4 rounded-xl mb-4",
                      isDark ? "bg-gray-800" : "bg-white"
                    )}
                  >
                    <Text 
                      className={cn(
                        "font-medium mb-2",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    >
                      Feedback:
                    </Text>
                    
                    <Text 
                      className={cn(
                        isDark ? "text-white/80" : "text-gray-700"
                      )}
                    >
                      {answers[currentQuestionIndex].feedback}
                    </Text>
                    
                    {answers[currentQuestionIndex].score !== undefined && (
                      <View className="flex-row items-center mt-2">
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
                              color={star <= (answers[currentQuestionIndex].score || 0) ? "#FBBF24" : "#9CA3AF"}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </MotiView>
                )}
              </ScrollView>
              
              {/* Navigation Buttons */}
              <View className="flex-row mt-4">
                <TouchableOpacity 
                  className={cn(
                    "flex-1 py-3 rounded-xl mr-2 items-center",
                    isDark ? "bg-gray-800" : "bg-white",
                    currentQuestionIndex === 0 && "opacity-50"
                  )}
                  onPress={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <Text 
                    className={cn(
                      "font-medium",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={cn(
                    "flex-1 bg-primary py-3 rounded-xl items-center",
                    isFeedbackLoading && "opacity-70"
                  )}
                  onPress={handleNextQuestion}
                  disabled={isFeedbackLoading}
                >
                  {isFeedbackLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-medium">
                      {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
