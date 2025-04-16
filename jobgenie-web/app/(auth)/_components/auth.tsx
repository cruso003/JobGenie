// app/(auth)/auth.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import LottieBackground from '@/components/ui/LottieBackground';

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { signIn, signUp, isLoading, error: authError } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  useEffect(() => {
    // Reset loading state when component mounts
    useAuthStore.setState({ isLoading: false });
  }, []);

  useEffect(() => {
    // Clear messages when changing mode
    setError(null);
    setSuccess(null);
  }, [authMode]);

  // Get current header text based on auth mode
  const getHeaderText = () => {
    switch(authMode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Join JobGenie';
      case 'forgot-password': return 'Reset Password';
    }
  };
  
  // Get current button text based on auth mode
  const getButtonText = () => {
    switch(authMode) {
      case 'login': return 'Sign In';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Send Reset Link';
    }
  };

  const handleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      if (!email || !password || !confirmPassword || !name) {
        setError('Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      
      // Pass the name to the signUp function
      await signUp(email, password, name);
      
      if (!useAuthStore.getState().error) {
        // Create profile record in Supabase
        const user = useAuthStore.getState().user;
        
        if (user) {
          // Create profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: user.id,
                email: user.email,
                full_name: name,
                onboarded: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
            
          if (profileError) {
            console.error('Error creating profile:', profileError.message);
            setError('Error creating user profile');
            return;
          }
          
          setSuccess('Account created successfully!');
          
          // Redirect to onboarding after a brief delay
          setTimeout(() => {
            router.push('/onboarding');
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      if (!email) {
        setError('Please enter your email');
        return;
      }
      
      // Use supabase directly for password reset
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      setSuccess('Password reset link sent! Check your email.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (authMode === 'login') {
      handleLoginWithPassword(e);
    } else if (authMode === 'register') {
      handleRegister(e);
    } else if (authMode === 'forgot-password') {
      handleForgotPassword(e);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-indigo-950" />
        <LottieBackground />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex w-full max-w-md flex-col items-center"
      >
        {/* Logo/icon */}
        <motion.div 
          className="mb-6 flex items-center justify-center"
          animate={{ 
            rotateZ: [0, 360],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.2
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/30"
            >
              <Zap className="h-10 w-10 text-indigo-600" />
            </motion.div>
          </motion.div>
        </motion.div>
        
        <h1 className="mb-2 text-center text-3xl font-bold dark:text-white">
          {getHeaderText()}
        </h1>
        
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
          {authMode === 'login' 
            ? 'Your AI career assistant awaits you' 
            : authMode === 'register'
              ? 'Create an account to start your career journey'
              : 'Enter your email to receive a password reset link'}
        </p>
        
        {/* Auth card with backdrop blur */}
        <div className="w-full max-w-md overflow-hidden rounded-3xl backdrop-blur-md">
          <Card className="border-white/20 bg-white/50 p-6 dark:bg-gray-900/50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {/* Name field (register only) */}
                {authMode === 'register' && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <label htmlFor="name" className="text-sm font-medium dark:text-white">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-indigo-600" />
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        autoComplete="name"
                      />
                    </div>
                  </motion.div>
                )}
                
                {/* Email field */}
                <motion.div
                  key="email-field"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="space-y-2"
                >
                  <label htmlFor="email" className="text-sm font-medium dark:text-white">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-indigo-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </motion.div>
                
                {/* Password (login & register only) */}
                {(authMode === 'login' || authMode === 'register') && (
                  <motion.div
                    key="password-field"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="space-y-2"
                  >
                    <label htmlFor="password" className="text-sm font-medium dark:text-white">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-indigo-600" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      />
                    </div>
                  </motion.div>
                )}
                
                {/* Confirm Password (register only) */}
                {authMode === 'register' && (
                  <motion.div
                    key="confirm-password-field"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label htmlFor="confirmPassword" className="text-sm font-medium dark:text-white">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-indigo-600" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="new-password"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Success message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-600 dark:text-green-400"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Submit button with gradient */}
              <div className="mt-6 overflow-hidden rounded-full">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 py-6 font-semibold text-white transition-all hover:from-indigo-500 hover:to-cyan-400"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {getButtonText()}
                </Button>
              </div>
              
              {/* Auth mode toggle links */}
              <div className="mt-4 flex justify-center space-x-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {authMode === 'login' 
                    ? "Don't have an account?" 
                    : authMode === 'register'
                      ? "Already have an account?"
                      : "Remember your password?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (authMode === 'login') setAuthMode('register');
                    else setAuthMode('login');
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {authMode === 'login' 
                    ? "Sign Up" 
                    : "Log In"}
                </button>
              </div>
              
              {/* Forgot Password link */}
              {authMode === 'login' && (
                <div className="mt-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot-password')}
                    className="text-sm font-medium text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
