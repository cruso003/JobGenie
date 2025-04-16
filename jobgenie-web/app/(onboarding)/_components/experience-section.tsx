// app/(onboarding)/_components/experience-section.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, ArrowLeft, Briefcase, Award, User, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  initialData: {
    level: 'beginner' | 'intermediate' | 'advanced';
    yearsOfExperience: number;
    currentTitle?: string;
  };
  onNext: (data: unknown) => void;
  onBack: () => void;
};

export default function ExperienceSection({ initialData, onNext, onBack }: Props) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(initialData.level || 'beginner');
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData.yearsOfExperience || 0);
  const [currentTitle, setCurrentTitle] = useState(initialData.currentTitle || '');
  
  const handleContinue = () => {
    onNext({
      experience: {
        level,
        yearsOfExperience,
        currentTitle: currentTitle.trim() || undefined,
      }
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Tell us about your experience
      </h1>
      
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        This helps us recommend suitable job opportunities and career paths
      </p>
      
      {/* Experience Level */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Experience Level
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <Card 
            className={cn(
              "cursor-pointer border p-4 transition-all hover:shadow-md",
              level === 'beginner' 
                ? "border-indigo-600 border-2" 
                : "hover:border-indigo-300"
            )}
            onClick={() => setLevel('beginner')}
          >
            <div className="flex flex-col items-center text-center">
              <User className={cn(
                "mb-2 h-8 w-8 p-1.5 rounded-full", 
                level === 'beginner' 
                  ? "text-indigo-600 bg-indigo-100" 
                  : "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700"
              )} />
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Beginner</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Just starting out or have minimal experience
              </p>
            </div>
          </Card>
          
          <Card 
            className={cn(
              "cursor-pointer border p-4 transition-all hover:shadow-md",
              level === 'intermediate' 
                ? "border-indigo-600 border-2" 
                : "hover:border-indigo-300"
            )}
            onClick={() => setLevel('intermediate')}
          >
            <div className="flex flex-col items-center text-center">
              <UserCheck className={cn(
                "mb-2 h-8 w-8 p-1.5 rounded-full", 
                level === 'intermediate' 
                  ? "text-indigo-600 bg-indigo-100" 
                  : "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700"
              )} />
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Intermediate</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Have some experience and skills in this field
              </p>
            </div>
          </Card>
          
          <Card 
            className={cn(
              "cursor-pointer border p-4 transition-all hover:shadow-md",
              level === 'advanced' 
                ? "border-indigo-600 border-2" 
                : "hover:border-indigo-300"
            )}
            onClick={() => setLevel('advanced')}
          >
            <div className="flex flex-col items-center text-center">
              <Award className={cn(
                "mb-2 h-8 w-8 p-1.5 rounded-full", 
                level === 'advanced' 
                  ? "text-indigo-600 bg-indigo-100" 
                  : "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700"
              )} />
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Advanced</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Seasoned professional with extensive experience
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Years of Experience */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Years of Experience: {yearsOfExperience}
        </h2>
        
        <Slider
          value={[yearsOfExperience]}
          min={0}
          max={20}
          step={1}
          onValueChange={(value) => setYearsOfExperience(value[0])}
          className="my-6"
        />
        
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>0</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20+</span>
        </div>
      </div>
      
      {/* Current Job Title */}
      <div className="mb-10">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Current Job Title (optional)
        </h2>
        
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600" />
          <Input
            placeholder="e.g., Software Engineer, Designer"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button
          onClick={handleContinue}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
