// app/(onboarding)/_components/onboarding-progress.tsx
import { motion } from 'framer-motion';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);
  
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  index <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {index < totalSteps - 1 && (
                <div className="absolute left-full w-full">
                  <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
                    {index < currentStep && (
                      <motion.div
                        className="h-full bg-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {index === 0
                ? 'Basics'
                : index === 1
                ? 'Skills'
                : index === 2
                ? 'Experience'
                : index === 3
                ? 'Goals'
                : 'Finalize'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
