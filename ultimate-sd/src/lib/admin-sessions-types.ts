import { SessionStatus } from '@prisma/client';
import type { SessionDetail } from '@/types';

export interface AdminSessionSummary {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  status: SessionStatus;
  attemptNumber: number;
  startedAt: string;
  completedAt: string | null;
  finalScore: number | null;
  submissionCount: number;
  passingCount: number;
  durationMinutes: number;
  totalPausedSeconds: number;
}

export interface AdminSessionDetail extends SessionDetail {
  userName: string | null;
  userEmail: string;
}
