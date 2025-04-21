// stores/auth.ts
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },
  
  checkSession: async () => {
    try {
      set({ isLoading: true });
      const { data } = await supabase.auth.getSession();
      set({ user: data.session?.user || null });
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));
