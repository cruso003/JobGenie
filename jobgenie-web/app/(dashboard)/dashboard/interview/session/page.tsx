// app/(dashboard)/interview/session/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Card,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import LoadingIndicator from '@/components/ui/loading-indicator';
import { motion } from 'framer-motion';
import CameraPreview from '@/components/interview/CameraPreview';
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: 'human' | 'ai';
  content: string;
}

export default function InterviewSessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const type = searchParams.get('type') as 'behavioral' | 'technical' | 'general' || 'behavioral';
  const role = searchParams.get('role') || 'Software Developer';
  const company = searchParams.get('company') || '';
  
  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoading] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle transcriptions from the CameraPreview component
  const handleTranscription = (text: string) => {
    if (text && text.trim()) {
      setMessages(prev => [...prev, { role: 'ai', content: text }]);
    }
  };
  
  // Start the interview
  const startInterview = () => {
    setShowWelcomeDialog(false);
    
    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };
  
  // Handle sending a text message
  const handleSendMessage = () => {
    if (!currentAnswer.trim()) return;
    
    setMessages(prev => [...prev, { role: 'human', content: currentAnswer }]);
    setCurrentAnswer('');
  };
  
  // Handle exit interview request
  const handleExitInterview = () => {
    setShowExitDialog(true);
  };
  
  const confirmExit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    router.push('/dashboard/interview');
  };
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return <LoadingIndicator message="Setting up your interview..." />;
  }
  
  return (
    <div className="container max-w-6xl py-4">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExitInterview}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">
              {type.charAt(0).toUpperCase() + type.slice(1)} Interview
            </h1>
            <p className="text-muted-foreground">
              {role} {company ? `at ${company}` : ''}
            </p>
          </div>
        </div>
        
        <div className="bg-secondary px-3 py-1 rounded-full text-secondary-foreground font-mono">
          {formatTime(timeElapsed)}
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Feed Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl overflow-hidden bg-black/90 relative"
        >
          <CameraPreview onTranscription={handleTranscription} />
        </motion.div>
        
        {/* Chat Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col"
        >
          <Card className="flex-1">
            <CardContent className="pt-6 flex-grow overflow-hidden">
              {/* Conversation history */}
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={`msg-${index}`} className={`flex ${message.role === 'human' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'human' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input area */}
              <div className="mt-4">
                <div className="relative">
                  <Textarea
                    placeholder="Type your answer here or speak directly to the AI..."
                    rows={3}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="resize-none pr-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    className="absolute right-2 bottom-2 h-8 w-8 p-0" 
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!currentAnswer.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitInterview}
              >
                End Interview
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Your Interview</DialogTitle>
            <DialogDescription>
              You&apos;re about to start a {type} interview for the {role} position{company ? ` at ${company}` : ''}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm">
              This AI-powered interview will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Ask you relevant questions for this role</li>
              <li>Listen to your verbal responses</li>
              <li>Provide feedback on your answers</li>
              <li>Consider both what you say and how you present yourself</li>
            </ul>
            <p className="text-sm font-medium">
              The interview requires camera and microphone access.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => router.push('/dashboard/interview')}>
              Cancel
            </Button>
            <Button onClick={startInterview}>
              Start Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Interview?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this interview? Your progress will be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Continue Interview
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              End Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
