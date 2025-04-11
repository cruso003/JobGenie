// stores/skills.ts
import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from './auth';

export interface SkillProgress {
  id: string;
  skill_name: string;
  progress: number; // 0-100
  resources_used: string[];
  started_at: string;
  completed_at?: string;
  notes?: string;
}

interface SkillsState {
  skills: SkillProgress[];
  isLoading: boolean;
  fetchSkillProgress: () => Promise<void>;
  startSkill: (skillName: string) => Promise<void>;
  updateSkillProgress: (id: string, progress: number, notes?: string) => Promise<void>;
  addResource: (id: string, resource: string) => Promise<void>;
  completeSkill: (id: string) => Promise<void>;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  isLoading: false,
  
  fetchSkillProgress: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('skill_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      
      set({ skills: data || [] });
    } catch (error) {
      console.error('Error fetching skill progress:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  startSkill: async (skillName) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      // Check if already exists
      const existingSkill = get().skills.find(s => 
        s.skill_name.toLowerCase() === skillName.toLowerCase()
      );
      
      if (existingSkill) {
        // Skill already exists, no need to create a new one
        return;
      }
      
      const newSkill = {
        user_id: user.id,
        skill_name: skillName,
        progress: 0,
        resources_used: [],
        started_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('skill_progress')
        .insert([newSkill])
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        skills: [data, ...state.skills]
      }));
    } catch (error) {
      console.error('Error starting new skill:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateSkillProgress: async (id, progress, notes) => {
    try {
      const updates: any = { progress };
      if (notes !== undefined) updates.notes = notes;
      
      const { error } = await supabase
        .from('skill_progress')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        skills: state.skills.map(skill => 
          skill.id === id ? { ...skill, progress, ...(notes ? { notes } : {}) } : skill
        )
      }));
    } catch (error) {
      console.error('Error updating skill progress:', error);
    }
  },
  
  addResource: async (id, resource) => {
    try {
      const skill = get().skills.find(s => s.id === id);
      if (!skill) return;
      
      const resources_used = [...(skill.resources_used || [])];
      if (!resources_used.includes(resource)) {
        resources_used.push(resource);
        
        const { error } = await supabase
          .from('skill_progress')
          .update({ resources_used })
          .eq('id', id);
        
        if (error) throw error;
        
        set(state => ({
          skills: state.skills.map(s => 
            s.id === id ? { ...s, resources_used } : s
          )
        }));
      }
    } catch (error) {
      console.error('Error adding resource to skill:', error);
    }
  },
  
  completeSkill: async (id) => {
    try {
      const completed_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('skill_progress')
        .update({ 
          progress: 100,
          completed_at
        })
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        skills: state.skills.map(skill => 
          skill.id === id ? { ...skill, progress: 100, completed_at } : skill
        )
      }));
    } catch (error) {
      console.error('Error completing skill:', error);
    }
  }
}));
