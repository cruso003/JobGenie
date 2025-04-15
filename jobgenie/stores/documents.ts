// stores/documents.ts
import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from './auth';

export interface Document {
  id: string;
  user_id: string;
  title: string;
  document_type: 'resume' | 'cover_letter';
  content: string;
  target_job_id?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentsStore {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  getDocumentById: (id: string) => Promise<Document | null>;
  createDocument: (data: Partial<Document>) => Promise<Document | null>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
}

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  documents: [],
  loading: false,
  error: null,
  
  fetchDocuments: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ documents: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ error: 'Failed to fetch documents', loading: false });
    }
  },
  
  getDocumentById: async (id: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching document by ID:', error);
      set({ error: 'Failed to fetch document' });
      return null;
    }
  },
  
  createDocument: async (documentData: Partial<Document>) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    
    try {
      const newDocument = {
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...documentData,
      };
      
      const { data, error } = await supabase
        .from('documents')
        .insert(newDocument)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      set(state => ({ 
        documents: [data, ...state.documents] 
      }));
      
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      set({ error: 'Failed to create document' });
      return null;
    }
  },
  
  updateDocument: async (id: string, documentData: Partial<Document>) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...documentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...data } : doc
        )
      }));
      
      return data;
    } catch (error) {
      console.error('Error updating document:', error);
      set({ error: 'Failed to update document' });
      return null;
    }
  },
  
  deleteDocument: async (id: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== id)
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ error: 'Failed to delete document' });
      return false;
    }
  },
}));
