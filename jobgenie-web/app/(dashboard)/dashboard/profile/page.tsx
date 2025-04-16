/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Briefcase, 
  MapPin, 
  Award, 
  BookOpen, 
  FileText,
  Settings,
  PenTool,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import LoadingIndicator from '@/components/ui/loading-indicator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Document {
    id: string;
    title: string;
    created_at: string;
    document_type: 'resume' | 'cover_letter';
  } 
  interface SavedJobs {
    id: string;
    job_title: string;
    company_name: string;
    job_location?: string;
    status: string;
    match_percentage?: number;
    application_link?: string;
  }
export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
 

  const [documents, setDocuments] = useState<Document[]>([]);
 

  const [savedJobs, setSavedJobs] = useState<SavedJobs[]>([]);
  
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchDocuments();
      fetchSavedJobs();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Calculate profile completeness
      const requiredFields = [
        'full_name',
        'location',
        'job_type',
        'skills',
        'experience',
        'interests',
        'goals',
      ];
      
      const completedFields = requiredFields.filter((field) => {
        if (Array.isArray(data[field])) {
          return data[field].length > 0;
        }
        return data[field] != null && data[field] !== '';
      });

      const completeness = Math.round(
        (completedFields.length / requiredFields.length) * 100
      );
      setProfileCompleteness(completeness);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedJobs(data || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/dashboard/profile/edit');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/auth');
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user data from Supabase
      await supabase.from('profiles').delete().eq('id', user?.id);
      await supabase.from('saved_jobs').delete().eq('user_id', user?.id);
      await supabase.from('documents').delete().eq('user_id', user?.id);

      // Delete authentication
      await supabase.auth.admin.deleteUser(user?.id || '');
      
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const getExperienceLevel = () => {
    if (!profile?.experience) return 'Not specified';

    let experience;
    try {
      experience =
        typeof profile.experience === 'string'
          ? JSON.parse(profile.experience)
          : profile.experience;
    } catch (e) {
      return 'Not specified';
    }

    return `${experience.level || 'Not specified'} (${
      experience.yearsOfExperience || 0
    } years)`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  if (loading) {
    return <LoadingIndicator message="Loading profile..." />;
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button variant="ghost" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Profile Summary */}
        <div className="space-y-6 md:col-span-1">
          {/* Profile Card */}
          <Card className="overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-500 text-white">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center">
                <Avatar className="mr-4 h-16 w-16 border-2 border-white">
                  <AvatarFallback className="bg-white/20 text-xl font-bold text-white">
                    {profile?.full_name ? getInitials(profile.full_name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name || 'Anonymous User'}</h2>
                  <p className="text-indigo-100">
                    {(() => {
                      try {
                        if (typeof profile?.experience === 'string') {
                          const parsed = JSON.parse(profile.experience);
                          return parsed.currentTitle || 'Not specified';
                        } else if (profile?.experience?.currentTitle) {
                          return profile.experience.currentTitle;
                        } else {
                          return 'Not specified';
                        }
                      } catch (e) {
                        return 'Not specified';
                      }
                    })()}
                  </p>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>{profile?.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span>{profile?.job_type || 'Job type not specified'}</span>
                </div>
              </div>

              {/* Profile Completeness */}
              <div className="mb-2">
                <div className="mb-1 flex justify-between">
                  <span className="text-xs">Profile Completeness</span>
                  <span className="text-xs">{profileCompleteness}%</span>
                </div>
                <Progress 
                  value={profileCompleteness} 
                  className="h-2 bg-white/20" 
                  style={{ '--progress-foreground': 'white' } as React.CSSProperties} 
                />
              </div>

              {/* Edit Profile Button */}
              <Button 
                onClick={handleEditProfile} 
                variant="outline" 
                className="mt-4 w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Skills Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Award className="mr-2 h-5 w-5 text-indigo-600" />
                My Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  No skills added yet
                </p>
              )}
              
              <Button 
                variant="link" 
                onClick={() => router.push('/skills')}
                className="mt-2 px-0 text-indigo-600 dark:text-indigo-400"
              >
                View skill recommendations
              </Button>
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <User className="mr-2 h-5 w-5 text-indigo-600" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{user?.email || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Experience Level</p>
                <p className="font-medium">{getExperienceLevel()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Interests</p>
                <p className="font-medium">
                  {profile?.interests && profile.interests.length > 0
                    ? profile.interests.join(', ')
                    : 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Settings className="mr-2 h-5 w-5 text-indigo-600" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Documents, Jobs, Activity */}
        <div className="space-y-6 md:col-span-2">
          <Tabs defaultValue="documents">
            <TabsList className="w-full">
              <TabsTrigger value="documents" className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-1">
                <Briefcase className="mr-2 h-4 w-4" />
                Saved Jobs
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex-1">
                <BookOpen className="mr-2 h-4 w-4" />
                Learning
              </TabsTrigger>
            </TabsList>
            
            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>My Documents</CardTitle>
                  <CardDescription>
                    Manage your resumes and cover letters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex justify-between">
                    <h3 className="text-lg font-medium">Resumes</h3>
                    <Badge variant="outline">{documents.filter(d => d.document_type === 'resume').length} saved</Badge>
                  </div>
                  
                  {documents.filter(d => d.document_type === 'resume').length > 0 ? (
                    <div className="mb-6 space-y-3">
                      {documents
                        .filter(d => d.document_type === 'resume')
                        .slice(0, 3)
                        .map(doc => (
                          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="flex items-center">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">{doc.title}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => router.push(`/document/${doc.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="mb-6 rounded-lg border border-dashed p-6 text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No resumes created yet</p>
                    </div>
                  )}
                  
                  <div className="mb-4 flex justify-between">
                    <h3 className="text-lg font-medium">Cover Letters</h3>
                    <Badge variant="outline">{documents.filter(d => d.document_type === 'cover_letter').length} saved</Badge>
                  </div>
                  
                  {documents.filter(d => d.document_type === 'cover_letter').length > 0 ? (
                    <div className="mb-6 space-y-3">
                      {documents
                        .filter(d => d.document_type === 'cover_letter')
                        .slice(0, 3)
                        .map(doc => (
                          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="flex items-center">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30">
                                <PenTool className="h-5 w-5" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">{doc.title}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => router.push(`/document/${doc.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="mb-6 rounded-lg border border-dashed p-6 text-center">
                      <PenTool className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No cover letters created yet</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => router.push('/resume')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Document
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Jobs</CardTitle>
                  <CardDescription>
                    Manage your job applications and saved positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {savedJobs.length > 0 ? (
                    <div className="space-y-4">
                      {savedJobs.slice(0, 5).map(job => (
                        <div key={job.id} className="rounded-lg border p-4 shadow-sm">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{job.job_title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{job.company_name}</p>
                            </div>
                            <Badge 
                              className={
                                job.status === 'saved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                job.status === 'applied' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                job.status === 'interviewing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                job.status === 'offered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              }
                            >
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="mb-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="mr-1 h-4 w-4" />
                            <span>{job.job_location || 'Remote'}</span>
                          </div>
                          {job.match_percentage && (
                            <div className="mb-3">
                              <div className="mb-1 flex justify-between text-xs">
                                <span>Match Score</span>
                                <span>{job.match_percentage}%</span>
                              </div>
                              <Progress
                                value={job.match_percentage}
                                className="h-1.5"
                                style={{
                                  '--progress-foreground': job.match_percentage >= 90 ? 'var(--green-500)' :
                                    job.match_percentage >= 70 ? 'var(--blue-500)' :
                                    job.match_percentage >= 50 ? 'var(--amber-500)' :
                                    'var(--gray-500)'
                                } as React.CSSProperties}
                              />
                            </div>
                          )}
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/jobs/${job.id}`)}
                            >
                              View Details
                            </Button>
                            {job.status === 'saved' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Handle apply action
                                  window.open(job.application_link, '_blank');
                                }}
                              >
                                Apply Now
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <Briefcase className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No saved jobs yet</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => router.push('/jobs')}
                    variant="outline"
                  >
                    View All Saved Jobs
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Learning Tab */}
            <TabsContent value="learning">
              <Card>
                <CardHeader>
                  <CardTitle>My Learning Journey</CardTitle>
                  <CardDescription>
                    Track your skills development and learning progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Your learning journey is just beginning</p>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/skills')}
                    >
                      Explore Skills
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
