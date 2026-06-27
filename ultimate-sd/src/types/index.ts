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
  tags?: string[];
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

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW_NEEDED';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface ProblemWithStatus extends SystemDesignProblem {
  status?: ProgressStatus;
  progress?: number;
  lastPracticed?: Date;
  nextRepetitionDate?: Date;
  totalAttempts?: number;
  bestScore?: number;
}

export interface ParsedFeedback {
  score: number;
  strengths?: string[];
  weaknesses?: string[];
  missed?: string[];
  isAcceptable?: boolean;
}

export interface StepSubmissionAttempt {
  id: string;
  content: string;
  feedback: ParsedFeedback | null;
  score: number | null;
  isPassing: boolean;
  createdAt: Date;
}

export interface StepSubmissionDetail {
  stepId: string;
  stepTitle: string;
  attempts: StepSubmissionAttempt[];
}

export interface PhaseSubmissionGroup {
  phase: string;
  phaseLabel: string;
  steps: StepSubmissionDetail[];
}

export interface SessionDetail {
  id: string;
  problemTitle: string;
  problemSlug: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  finalScore?: number;
  attemptNumber: number;
  diagramSnapshot?: unknown;
  phases: PhaseSubmissionGroup[];
}