/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';
import { Briefcase, FileText, Video, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { ProfileData } from '@/lib/gemini';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);
  
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder data until we connect to backend
  const stats = {
    savedJobs: 5,
    appliedJobs: 2,
    interviews: 1,
    documents: 3
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="mt-2 text-indigo-100">
              Your job search dashboard is ready for today
            </p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0">
            <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
              Find Jobs
            </Button>
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
              Create Resume
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saved Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedJobs}</div>
            <p className="text-xs text-muted-foreground">
              +2 saved this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Applied Jobs
            </CardTitle>
            <FileText className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appliedJobs}</div>
            <p className="text-xs text-muted-foreground">
              +1 applied this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Video className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviews}</div>
            <p className="text-xs text-muted-foreground">
              Interview Practiced this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents}</div>
            <p className="text-xs text-muted-foreground">
              Resumes and cover letters
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity & Tips */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest job search activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900 dark:text-blue-100">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Saved a new job</p>
                  <p className="text-sm text-muted-foreground">Senior Frontend Developer at TechCorp</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900 dark:text-green-100">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                <p className="font-medium">Updated resume</p>
                  <p className="text-sm text-muted-foreground">Modern Resume Template</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900 dark:text-purple-100">
                  <Video className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Completed mock interview</p>
                  <p className="text-sm text-muted-foreground">Frontend Developer - Behavioral</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full">View All Activity</Button>
          </CardContent>
        </Card>

        {/* Career Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Career Tips</CardTitle>
            <CardDescription>Personalized advice for your job search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900 dark:text-amber-100">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Skill Recommendation</p>
                  <p className="text-sm text-muted-foreground">
                    Learning React will increase your job matches by 40%
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-100">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Application Timing</p>
                  <p className="text-sm text-muted-foreground">
                    Apply to new job postings within 48 hours for best results
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900 dark:text-red-100">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Resume Tip</p>
                  <p className="text-sm text-muted-foreground">
                    Your resume lacks specific achievements. Add measurable results.
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full">View All Tips</Button>
          </CardContent>
        </Card>
      </div>

      {/* Job Recommendations */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Recommended Jobs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Job Card 1 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg">Frontend Developer</CardTitle>
                  <CardDescription>TechCorp Inc.</CardDescription>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                  96% Match
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center text-sm text-muted-foreground">
                <Briefcase className="mr-1 h-4 w-4" />
                Remote • Full-time
              </div>
              <p className="mb-4 text-sm">
                Looking for a skilled frontend developer with experience in React, TypeScript and modern CSS...
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  React
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  TypeScript
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  Tailwind
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm">
                  Save
                </Button>
                <Button size="sm">View Job</Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Card 2 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg">React Native Developer</CardTitle>
                  <CardDescription>MobileTech Solutions</CardDescription>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                  92% Match
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center text-sm text-muted-foreground">
                <Briefcase className="mr-1 h-4 w-4" />
                San Francisco, CA • Full-time
              </div>
              <p className="mb-4 text-sm">
                We are seeking a React Native developer to join our mobile app development team...
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  React Native
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  JavaScript
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  Mobile
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm">
                  Save
                </Button>
                <Button size="sm">View Job</Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Card 3 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg">Full-Stack Developer</CardTitle>
                  <CardDescription>InnoTech Startups</CardDescription>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                  85% Match
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center text-sm text-muted-foreground">
                <Briefcase className="mr-1 h-4 w-4" />
                New York, NY • Contract
              </div>
              <p className="mb-4 text-sm">
                Seeking a full-stack developer with experience in Node.js, React, and database technologies...
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  Node.js
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  React
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  MongoDB
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm">
                  Save
                </Button>
                <Button size="sm">View Job</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-4 text-center">
          <Button variant="outline">View More Jobs</Button>
        </div>
      </section>
    </div>
  );
}

