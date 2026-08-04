export type PracticeMode = 'practice' | 'mock';
export type ExperienceLevel = 'fresher' | 'sde1' | 'sde2' | 'senior';

export type LearnerProfile = {
  userId: string;
  level: ExperienceLevel;
  targetRole?: string;
  companies: string[];
  intent: 'interview' | 'upskill' | 'learn' | '';
  interviewDate?: string; // ISO date
  competencies: CompetencySignal[];
  memoryNotes: MemoryNote[]; // hydrated cap: last 20 (~≤4k tokens)
};

export type CompetencySignal = {
  skillId: string; // e.g. 'caching' | 'consistency' | 'api-design'
  earned: number; // 0..1
  coached: number; // 0..1
  updatedAt: string;
};

export type MemoryNote = {
  id: string;
  text: string; // ≤200 tokens intent
  tags: string[];
  problemSlug?: string;
  createdAt: string;
};

export type AgendaMove = {
  id: string;
  kind: 'ask' | 'probe' | 'teach' | 'skip' | 'advance';
  prompt: string;
  skillFocus: string[];
  source: 'rail' | 'rag' | 'planner';
};

export type GateDecision = {
  action: 'pass' | 'retry' | 'teach_forward' | 'advance_budget' | 'end_mock';
  reason: string;
  threshold?: number;
  tipSkillId?: 'teach-forward';
};

export type SessionState = {
  version: 'adaptive-1';
  mode: PracticeMode;
  problemSlug: string;
  stageId: string;
  agenda: AgendaMove[];
  attempts: Record<string, number>;
  stageStartedAt: string;
  sessionBudgetSec: number;
  status: 'running' | 'complete' | 'summary-error';
};
