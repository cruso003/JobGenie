/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/profile/edit/page.tsx
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Briefcase, 
  MapPin, 
  Award, 
  X,
  ArrowLeft,
  Save,
  Plus
} from 'lucide-react';
import LoadingIndicator from '@/components/ui/loading-indicator';
import { motion } from 'framer-motion';

// Component for a skill input with autocomplete
import { SkillInput } from '@/components/profile/skill-input';
import { ProfileData } from '@/lib/gemini';

export default function EditProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [currentTitle, setCurrentTitle] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [currentInterest, setCurrentInterest] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [currentGoal, setCurrentGoal] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
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
      setFullName(data.full_name || '');
      setLocation(data.location || '');
      setJobType(data.job_type || '');
      setSkills(data.skills || []);
      setInterests(data.interests || []);
      setGoals(data.goals || []);
      
      // Parse experience
      if (data.experience) {
        let experience;
        try {
          experience = typeof data.experience === 'string'
            ? JSON.parse(data.experience)
            : data.experience;
            
          setExperienceLevel(experience.level || 'beginner');
          setYearsOfExperience(experience.yearsOfExperience || 0);
          setCurrentTitle(experience.currentTitle || '');
        } catch (e) {
          console.error('Error parsing experience:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Format the experience data
      const experienceData = {
        level: experienceLevel,
        yearsOfExperience,
        currentTitle,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          location,
          job_type: jobType,
          skills,
          experience: experienceData,
          interests,
          goals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (currentSkill && !skills.includes(currentSkill)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addInterest = () => {
    if (currentInterest && !interests.includes(currentInterest)) {
      setInterests([...interests, currentInterest]);
      setCurrentInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const addGoal = () => {
    if (currentGoal && !goals.includes(currentGoal)) {
      setGoals([...goals, currentGoal]);
      setCurrentGoal('');
    }
  };

  const removeGoal = (goalToRemove: string) => {
    setGoals(goals.filter(goal => goal !== goalToRemove));
  };

  if (loading) {
    return <LoadingIndicator message="Loading profile..." />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={() => router.push('/profile')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
          <CardTitle className="text-xl">Personal Information</CardTitle>
          <CardDescription className="text-indigo-100">
            Update your profile details
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
         >
           {/* Basic Info Section */}
           <div className="space-y-4">
             <h3 className="flex items-center text-lg font-medium">
               <User className="mr-2 h-5 w-5 text-indigo-600" />
               Basic Information
             </h3>
             
             <div className="grid gap-4 sm:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="fullName">Full Name</Label>
                 <Input
                   id="fullName"
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   placeholder="Your full name"
                 />
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="location">Location</Label>
                 <Input
                   id="location"
                   value={location}
                   onChange={(e) => setLocation(e.target.value)}
                   placeholder="City, Country"
                 />
               </div>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="jobType">Preferred Job Type</Label>
               <Select value={jobType} onValueChange={setJobType}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select job type" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Full-time">Full-time</SelectItem>
                   <SelectItem value="Part-time">Part-time</SelectItem>
                   <SelectItem value="Contract">Contract</SelectItem>
                   <SelectItem value="Freelance">Freelance</SelectItem>
                   <SelectItem value="Remote">Remote</SelectItem>
                   <SelectItem value="Hybrid">Hybrid</SelectItem>
                   <SelectItem value="Internship">Internship</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
           
           {/* Experience Section */}
           <div className="space-y-4">
             <h3 className="flex items-center text-lg font-medium">
               <Briefcase className="mr-2 h-5 w-5 text-indigo-600" />
               Experience
             </h3>
             
             <div className="grid gap-4 sm:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="experienceLevel">Experience Level</Label>
                 <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select experience level" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="beginner">Beginner</SelectItem>
                     <SelectItem value="intermediate">Intermediate</SelectItem>
                     <SelectItem value="advanced">Advanced</SelectItem>
                     <SelectItem value="expert">Expert</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                 <Input
                   id="yearsOfExperience"
                   type="number"
                   min="0"
                   max="50"
                   value={yearsOfExperience}
                   onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                 />
               </div>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="currentTitle">Current Title</Label>
               <Input
                 id="currentTitle"
                 value={currentTitle}
                 onChange={(e) => setCurrentTitle(e.target.value)}
                 placeholder="Your current job title"
               />
             </div>
           </div>
           
           {/* Skills Section */}
           <div className="space-y-4">
             <h3 className="flex items-center text-lg font-medium">
               <Award className="mr-2 h-5 w-5 text-indigo-600" />
               Skills
             </h3>
             
             <div className="flex flex-wrap gap-2">
               {skills.map((skill) => (
                 <Badge key={skill} variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300"></Badge>               ))}
             </div>
             
             <div className="flex items-center space-x-2">
               <Input
                 value={currentSkill}
                 onChange={(e) => setCurrentSkill(e.target.value)}
                 placeholder="Add a skill"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     addSkill();
                   }
                 }}
               />
               <Button type="button" onClick={addSkill} size="icon">
                 <Plus className="h-4 w-4" />
               </Button>
             </div>
           </div>
           
           {/* Interests Section */}
           <div className="space-y-4">
             <h3 className="flex items-center text-lg font-medium">
               <MapPin className="mr-2 h-5 w-5 text-indigo-600" />
               Interests
             </h3>
             
             <div className="flex flex-wrap gap-2">
               {interests.map((interest) => (
                 <Badge key={interest} variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                   {interest}
                   <button 
                     className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900" 
                     onClick={() => removeInterest(interest)}
                     title="Remove interest"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </Badge>
               ))}
             </div>
             
             <div className="flex items-center space-x-2">
               <Input
                 value={currentInterest}
                 onChange={(e) => setCurrentInterest(e.target.value)}
                 placeholder="Add an interest"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     addInterest();
                   }
                 }}
               />
               <Button type="button" onClick={addInterest} size="icon">
                 <Plus className="h-4 w-4" />
               </Button>
             </div>
           </div>
           
           {/* Goals Section */}
           <div className="space-y-4">
             <h3 className="flex items-center text-lg font-medium">
               <Award className="mr-2 h-5 w-5 text-indigo-600" />
               Career Goals
             </h3>
             
             <div className="flex flex-wrap gap-2">
               {goals.map((goal) => (
                 <Badge key={goal} variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300">
                   {goal}
                   <button 
                   title='Remove goal'
                     className="ml-1 rounded-full p-0.5 hover:bg-green-200 dark:hover:bg-green-900" 
                     onClick={() => removeGoal(goal)}
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </Badge>
               ))}
             </div>
             
             <div className="flex items-center space-x-2">
               <Input
                 value={currentGoal}
                 onChange={(e) => setCurrentGoal(e.target.value)}
                 placeholder="Add a career goal"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     addGoal();
                   }
                 }}
               />
               <Button type="button" onClick={addGoal} size="icon">
                 <Plus className="h-4 w-4" />
               </Button>
             </div>
           </div>
         </motion.div>
       </CardContent>
       
       <CardFooter className="flex justify-between border-t bg-gray-50 px-6 py-4 dark:bg-gray-900">
         <Button 
           variant="outline" 
           onClick={() => router.push('/profile')}
         >
           Cancel
         </Button>
         <Button 
           onClick={handleSaveProfile} 
           disabled={saving}
           className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400"
         >
           {saving ? (
             <>Saving...</>
           ) : (
             <>
               <Save className="mr-2 h-4 w-4" />
               Save Changes
             </>
           )}
         </Button>
       </CardFooter>
     </Card>
   </div>
 );
}
