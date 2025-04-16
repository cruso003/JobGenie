// app/(onboarding)/_components/skills-section.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Plus, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  initialData: string[];
  onNext: (data: { skills: string[] }) => void;
  onBack: () => void;
};

// Common skill suggestions by category
const skillSuggestions = {
  technical: [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'SQL',
    'C#', 'AWS', 'Docker', 'Kubernetes', 'HTML/CSS', 'Git', 'PHP', 'Ruby'
  ],
  design: [
    'UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 
    'Sketch', 'InDesign', 'Product Design', 'Wireframing', 'Prototyping'
  ],
  business: [
    'Project Management', 'Marketing', 'Sales', 'SEO', 'Data Analysis', 
    'Microsoft Office', 'Google Analytics', 'Content Writing', 'Copywriting',
    'Social Media Management', 'Customer Service', 'Leadership'
  ]
};

export default function SkillsSection({ initialData, onNext, onBack }: Props) {
  const [skills, setSkills] = useState<string[]>(initialData || []);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [category, setCategory] = useState<'technical' | 'design' | 'business'>('technical');
  const [error, setError] = useState('');
  
  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = skillSuggestions[category].filter(
        skill => skill.toLowerCase().includes(inputValue.toLowerCase()) && 
                !skills.includes(skill)
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [inputValue, category, skills]);
  
  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;
    
    // Check if skill already exists
    if (skills.some(s => s.toLowerCase() === trimmedSkill.toLowerCase())) {
      setError('This skill is already added');
      return;
    }
    
    setSkills([...skills, trimmedSkill]);
    setInputValue('');
    setError('');
  };
  
  const removeSkill = (index: number) => {
    const newSkills = [...skills];
    newSkills.splice(index, 1);
    setSkills(newSkills);
  };
  
  const handleAddFromInput = () => {
    if (inputValue) {
      addSkill(inputValue);
    }
  };
  
  const handleContinue = () => {
    if (skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }
    
    onNext({ skills });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        What skills do you have?
      </h1>
      
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Add skills that showcase your expertise. These will help match you with relevant opportunities.
      </p>
      
      {/* Category selector */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setCategory('technical')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            category === 'technical'
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          )}
        >
          Technical
        </button>
        <button
          onClick={() => setCategory('design')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            category === 'design'
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          )}
        >
          Design
        </button>
        <button
          onClick={() => setCategory('business')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            category === 'business'
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          )}
        >
          Business
        </button>
      </div>
      
      {/* Skill input */}
      <div className="mb-6">
        <label htmlFor="skill" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add a skill
        </label>
        <div className="relative flex">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600" />
            <Input
              id="skill"
              placeholder="e.g., JavaScript, Figma"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFromInput();
                }
              }}
              className="pl-10 pr-10"
            />
            {inputValue && (
              <button
                onClick={handleAddFromInput}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                title="Add skill"
              >
                <Plus className="h-5 w-5 text-indigo-600" />
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Suggestions:
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer px-3 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 flex items-center gap-1"
                onClick={() => addSkill(suggestion)}
              >
                {suggestion}
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Popular in category */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Popular in {category}:
        </h3>
        <div className="flex flex-wrap gap-2">
          {skillSuggestions[category].slice(0, 8).map((skill, index) => (
            !skills.includes(skill) && (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer px-3 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 flex items-center gap-1"
                onClick={() => addSkill(skill)}
              >
                {skill}
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
              </Badge>
            )
          ))}
        </div>
      </div>
      
      {/* Selected skills */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your skills ({skills.length}):
        </h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Badge
                className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 flex items-center gap-1"
              >
                {skill}
                <button onClick={() => removeSkill(index)} className="ml-1" title={`Remove ${skill}`}>
                  <span className="sr-only">Remove {skill}</span>
                  Remove skill
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            </motion.div>
          ))}
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
