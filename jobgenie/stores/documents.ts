// stores/documents.ts
import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from './auth';

export interface Document {
  id: string;
  title: string;
  document_type: 'resume' | 'cover_letter';
  content?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  target_job_id?: string;
}

interface DocumentsState {
  documents: Document[];
  isLoading: boolean;
  fetchDocuments: () => Promise<void>;
  createDocument: (doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  isLoading: false,
  
  fetchDocuments: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      set({ documents: data || [] });
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createDocument: async (doc) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    
    try {
      set({ isLoading: true });
      
      const now = new Date().toISOString();
      const newDocument = {
        ...doc,
        user_id: user.id,
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('documents')
        .insert([newDocument])
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        documents: [data, ...state.documents]
      }));
      
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateDocument: async (id, updates) => {
    try {
      set({ isLoading: true });
      
      const { error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        )
      }));
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteDocument: async (id) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }
}));
