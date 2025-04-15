// types/index.ts
export interface Message {
    id: string;
    text: string;
    sender: "user" | "genie";
    timestamp: string;
    isVoice?: boolean;
    rich?: boolean;
    richData?: any;
    richType?: "interview-prep" | "learning-path" | "career-advice" | "interview-question";
    actions?: MessageAction[];
    isPinned?: boolean;
  }
  
  export interface MessageAction {
    label: string;
    icon: string;
    action: () => void;
  }
  
  export interface ConversationContext {
    stage: 'initial' | 'interview-prep' | 'skill-learning' | 'career-advice';
    subStage?: string;
    jobRole?: string;
    company?: string;
    interviewType?: 'behavioral' | 'technical' | 'general';
    targetSkill?: string;
    skillLevel?: 'beginner' | 'intermediate' | 'advanced';
    currentRole?: string;
    targetRole?: string;
    extraData?: {
      questions?: any[];
      currentQuestionIndex?: number;
      [key: string]: any;
    };
  }
  