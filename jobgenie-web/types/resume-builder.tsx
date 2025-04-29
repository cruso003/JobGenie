// src/types/resume-builder.ts
export type Template = "modern" | "classic" | "minimal";
export type ChatRole = "user" | "assistant";
export type DocumentType = "resume" | "cover_letter";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: Date;
  html?: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  document_type: DocumentType;
  content: string;
  target_job_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingChange {
  description: string;
  prompt: string;
}
