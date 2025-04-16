import { create } from 'zustand';
import { supabase } from '../supabase';
import { AuthError } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (data?.session) {
        set({ 
          user: {
            id: data.session.user.id,
            email: data.session.user.email || '',
          },
          isLoading: false,
        });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      set({ user: null, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({ 
        user: {
          id: data.user.id,
          email: data.user.email || '',
        },
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      set({ 
        error: error instanceof AuthError ? error.message : 'An unknown error occurred', 
        isLoading: false 
      });
    }
  },

  signUp: async (email, password, name = '') => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Disable email confirmation
          emailRedirectTo: undefined,
          data: {
            name: name
          }
        }
      });
  
      if (error) throw error;
  
      // If no email verification, user is already authenticated
      if (data.user) {
        set({ 
          user: {
            id: data.user.id,
            email: data.user.email || '',
          },
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      set({ 
        error: error instanceof AuthError ? error.message : 'An unknown error occurred', 
        isLoading: false 
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, isLoading: false });
    } catch (error: unknown) {
      console.error('Sign out error:', error);
      set({ 
        error: error instanceof AuthError ? error.message : 'An unknown error occurred', 
        isLoading: false 
      });
    }
  },
}));
