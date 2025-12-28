export interface StepData {
  phase: string;
  subStep: string;
  title: string;
  prompt: string;
  inputType: 'list' | 'textarea' | 'schema';
  placeholder?: string;
  widgetId?: string; // e.g. 'encoding-visualizer'
}

export interface SystemDesignProblem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  companies: string[];
  requirements: string[];
  steps?: Record<string, StepData[]>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  feedback?: { score: number; tips: string[] };
}

export interface ProblemWithStatus extends SystemDesignProblem {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW_NEEDED';
  lastPracticed?: Date;
  nextRepetitionDate?: Date;
  progress?: number;
}