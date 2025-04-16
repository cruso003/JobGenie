// app/(onboarding)/_components/basic-info.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, MapPin, Briefcase, ArrowRight } from 'lucide-react';

type Props = {
  initialData: {
    fullName: string;
    location: string;
    jobType: string;
  };
  onNext: (data: unknown) => void;
};

const jobTypes = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Internship', value: 'internship' },
];

export default function BasicInfo({ initialData, onNext }: Props) {
  const [fullName, setFullName] = useState(initialData.fullName || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [jobType, setJobType] = useState(initialData.jobType || 'full-time');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const validateAndContinue = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your name';
    }
    
    if (!location.trim()) {
      newErrors.location = 'Please enter your location';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onNext({
        fullName,
        location,
        jobType,
      });
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Let&apos;s start with the basics
      </h1>
      
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        Tell us a bit about yourself so we can personalize your experience
      </p>
      
      <div className="space-y-6">
        {/* Full Name Input */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600" />
            <Input
              id="fullName"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) {
                  setErrors({ ...errors, fullName: '' });
                }
              }}
              className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>
        
        {/* Location Input */}
        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600" />
            <Input
              id="location"
              placeholder="City, State or Remote"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (errors.location) {
                  setErrors({ ...errors, location: '' });
                }
              }}
              className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location}</p>
          )}
        </div>
        
        {/* Job Type Select */}
        <div className="space-y-2">
          <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Preferred Job Type
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600 z-10" />
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Continue Button */}
        <Button
          onClick={validateAndContinue}
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
          size="lg"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
