// app/(onboarding)/_components/goals-section.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  initialData: {
    interests: string[];
    goals: string[];
  };
  onNext: (data: unknown) => void;
  onBack: () => void;
};

// Available interests
const availableInterests = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'AI', 'UX/UI Design', 'Graphic Design', 'Product Management', 'Marketing',
  'SEO', 'Content Writing', 'Copywriting', 'Social Media', 'E-commerce',
  'Cybersecurity', 'Cloud Computing', 'Blockchain', 'Game Development', 
  'AR/VR', 'IoT', 'DevOps', 'Business Analysis', 'Project Management'
];

// Available goals
const availableGoals = [
  'Find a new job', 'Get promoted', 'Switch careers', 'Learn new skills',
  'Build a portfolio', 'Improve resume', 'Network with professionals',
  'Start freelancing', 'Prepare for interviews', 'Salary negotiation',
  'Work remotely', 'Relocate', 'Start a business'
];

export default function GoalsSection({ initialData, onNext, onBack }: Props) {
  const [interests, setInterests] = useState<string[]>(initialData.interests || []);
  const [goals, setGoals] = useState<string[]>(initialData.goals || []);
  const [error, setError] = useState('');
  
  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };
  
  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };
  
  const handleContinue = () => {
    if (interests.length === 0) {
      setError('Please select at least one interest');
      return;
    }
    
    if (goals.length === 0) {
      setError('Please select at least one goal');
      return;
    }
    
    onNext({
      interests,
      goals
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
        What are your interests and goals?
      </h1>
      
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Select topics that interest you and what you&apos;re trying to achieve
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Interests Section */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Your Interests
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Select areas you&apos;re interested in (select multiple)
        </p>
        
        <div className="flex flex-wrap gap-3">
          {availableInterests.map((interest, index) => (
            <button
              key={index}
              onClick={() => toggleInterest(interest)}
              className={cn(
                "px-3 py-2 rounded-full text-sm transition-colors",
                interests.includes(interest)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              )}
            >
              {interests.includes(interest) && (
                <Check className="inline-block h-3.5 w-3.5 mr-1" />
              )}
              {interest}
            </button>
          ))}
        </div>
      </div>
      
      {/* Goals Section */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Your Goals
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          What are you looking to achieve? (select multiple)
        </p>
        
        <div className="flex flex-wrap gap-3">
          {availableGoals.map((goal, index) => (
            <button
              key={index}
              onClick={() => toggleGoal(goal)}
              className={cn(
                "px-3 py-2 rounded-full text-sm transition-colors",
                goals.includes(goal)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              )}
            >
              {goals.includes(goal) && (
                <Check className="inline-block h-3.5 w-3.5 mr-1" />
              )}
              {goal}
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected Summary */}
      <div className="mb-8 text-center text-sm text-gray-600 dark:text-gray-300">
        Selected: {interests.length} interests, {goals.length} goals
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
