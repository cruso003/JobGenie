// app/(dashboard)/interview/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Briefcase, Users, Code, AlertCircle, Info, Star } from 'lucide-react';
import LoadingIndicator from '@/components/ui/loading-indicator';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import genieAnimation from '@/assets/animations/genie-animation.json';

interface Interview {
  id: string;
  date: string;
  role: string;
  company: string;
  type: 'behavioral' | 'technical' | 'general';
  score: number;
}

export default function InterviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interviewHistory, setInterviewHistory] = useState<Interview[]>([]);
  const [selectedInterviewType, setSelectedInterviewType] = useState<'behavioral' | 'technical' | 'general'>('behavioral');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
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
      console.log('Fetched profile:', data);
      
      setProfile(data);
      
      // Use current job title as default role if available
      if (data?.experience?.currentTitle) {
        setRole(data.experience.currentTitle);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (!role) {
      toast({
        title: "Role Required",
        description: "Please enter the job role you're interviewing for",
        variant: "destructive",
      });
      return;
    }
    
    // Create a new interview session in the database
    // Then redirect to the session page
    router.push(`/dashboard/interview/session?type=${selectedInterviewType}&role=${encodeURIComponent(role)}&company=${encodeURIComponent(company || '')}`);
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
  
  
  const handleContinueInterview = (interview: Interview) => {
    router.push(`/dashboard/interview/session?interviewId=${interview.id}&type=${interview.type}&role=${encodeURIComponent(interview.role)}&company=${encodeURIComponent(interview.company || '')}`);
  };
  
  if (loading) {
    return <LoadingIndicator message="Setting up your interview coach..." />;
  }
  
  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interview Coach</h1>
        <p className="text-muted-foreground">Practice for your next job interview</p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column - Start New Interview */}
        <div className="flex flex-col space-y-6">
          {/* Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Upgrade to Pro</h3>
                    <p className="text-indigo-100">
                      Get advanced video interviews, personalized feedback, and unlimited practice sessions
                    </p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <span className="text-white">
                      <AlertCircle className="h-6 w-6" />
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="mt-4 bg-white text-indigo-600 hover:bg-indigo-50"
                  onClick={() => router.push('/pricing')}
                >
                  Learn More
                </Button>
              </div>
            </Card>
          </motion.div>
          
          {/* Interview Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Start a New Interview</CardTitle>
                <CardDescription>
                  Choose an interview type and enter the role details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="behavioral" onValueChange={(v) => setSelectedInterviewType(v as 'behavioral' | 'technical' | 'general')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                  </TabsList>
                  <TabsContent value="behavioral" className="mt-4 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">Behavioral Interview</h4>
                        <p className="text-sm text-muted-foreground">
                          Practice answering questions about your experience, soft skills, and past behavior
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="technical" className="mt-4 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-100 p-3 rounded-full text-green-600 dark:bg-green-900/30 dark:text-green-300">
                        <Code className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">Technical Interview</h4>
                        <p className="text-sm text-muted-foreground">
                          Answer technical questions related to your field and demonstrate problem-solving skills
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="general" className="mt-4 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 p-3 rounded-full text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">General Interview</h4>
                        <p className="text-sm text-muted-foreground">
                          Mix of common interview questions across different areas to help with overall preparation
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Job Role
                    </label>
                    <input
                      id="role"
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. Frontend Developer"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">
                      Company (Optional)
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g. TechCorp"
                    />
                  </div>
                </div>
                
                <Button className="w-full" onClick={handleStartInterview}>
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Right Column - Interview History & Tips */}
        <div className="flex flex-col space-y-6">
          {/* Recent Interviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Interviews</CardTitle>
                  <CardDescription>Your previous practice sessions</CardDescription>
                </div>
                {interviewHistory.length > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => router.push('/interview/history')}>
                    See All
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {interviewHistory.length > 0 ? (
                  <div className="space-y-4">
                    {interviewHistory.map((interview) => (
                      <div
                        key={interview.id}
                        className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleContinueInterview(interview)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`rounded-full p-2 ${
                              interview.type === 'behavioral' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                              interview.type === 'technical' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' :
                              'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                              {interview.type === 'behavioral' ? <Users className="h-4 w-4" /> :
                               interview.type === 'technical' ? <Code className="h-4 w-4" /> :
                               <Briefcase className="h-4 w-4" />}
                            </div>
                            <div>
                              <h4 className="font-medium">{interview.role}</h4>
                              <p className="text-sm text-muted-foreground">{interview.company}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(interview.date).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">Score:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= Math.round(interview.score)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <Button size="sm" className="bg-primary text-primary-foreground">
                            Continue
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-32 w-32 mb-4">
                      <Lottie
                        animationData={genieAnimation}
                        loop
                      />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No interviews yet</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Start your first practice interview to prepare for your next job opportunity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Interview Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Interview Tips</CardTitle>
                <CardDescription>Advice to help you succeed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Use the STAR Method</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Structure your answers to behavioral questions using Situation, Task, Action, Result format
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Practice Speaking Clearly</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Record yourself and review your pace, tone, and clarity
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Research the Company</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Understand the company&apos;s values, products, and culture before your interview
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-6" onClick={() => router.push('/resources/interview-tips')}>
                  More Tips
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
