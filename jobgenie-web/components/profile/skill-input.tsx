// components/profile/skill-input.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Common tech skills for autocomplete
const commonSkills = [
  'JavaScript', 'React', 'Node.js', 'TypeScript', 'HTML', 'CSS', 'Tailwind CSS',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'PHP', 'Laravel', 'Ruby', 'Ruby on Rails',
  'Go', 'Rust', 'Swift', 'Kotlin', 'C#', '.NET', 'C++', 'C',
  'SQL', 'PostgreSQL', 'MongoDB', 'MySQL', 'Firebase', 'Redis', 'GraphQL',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Linux', 'Git',
  'REST API', 'Microservices', 'React Native', 'Flutter', 'Electron',
  'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Illustrator', 'Photoshop',
  'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'AI',
  'DevOps', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform', 'Ansible',
  'Agile', 'Scrum', 'Kanban', 'Project Management', 'Leadership'
];

interface SkillInputProps {
  skills: string[];
  setSkills: (skills: string[]) => void;
}

export function SkillInput({ skills, setSkills }: SkillInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Filter suggestions based on input
    if (input.length > 0) {
      const filtered = commonSkills.filter(skill => 
        skill.toLowerCase().includes(input.toLowerCase()) && 
        !skills.includes(skill)
      );
      setSuggestions(filtered.slice(0, 5));  // Limit to 5 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, skills]);
  
  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const addSkill = (skill: string = input) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setInput('');
      setShowSuggestions(false);
    }
  };
  
  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };
  
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300">
            {skill}
            <button 
              className="ml-1 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-900" 
              onClick={() => removeSkill(skill)}
              type="button"
              aria-label={`Remove ${skill}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <div className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a skill"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              } else if (e.key === 'ArrowDown' && showSuggestions) {
                const firstSuggestion = document.querySelector<HTMLButtonElement>('.suggestion-item');
                firstSuggestion?.focus();
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          <Button type="button" onClick={() => addSkill()} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                className="suggestion-item w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                onClick={() => {
                  addSkill(suggestion);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(suggestion);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextSuggestion = document.querySelectorAll<HTMLButtonElement>('.suggestion-item')[index + 1];
                    if (nextSuggestion) {
                      nextSuggestion.focus();
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (index === 0) {
                      inputRef.current?.focus();
                    } else {
                      const prevSuggestion = document.querySelectorAll<HTMLButtonElement>('.suggestion-item')[index - 1];
                      if (prevSuggestion) {
                        prevSuggestion.focus();
                      }
                    }
                  }
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
