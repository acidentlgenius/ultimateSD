import { SessionStatus } from '@prisma/client';

export type AdminActivityType =
  | 'session_started'
  | 'session_completed'
  | 'session_abandoned'
  | 'step_submitted';

export interface AdminActivityItem {
  id: string;
  type: AdminActivityType;
  timestamp: Date;
  userId: string;
  userName: string | null;
  userEmail: string;
  problemId: string;
  problemTitle: string;
  sessionStatus?: SessionStatus;
  stepId?: string;
  phase?: string;
  score?: number | null;
  isPassing?: boolean;
  attemptNumber?: number;
}

export function getActivityLabel(type: AdminActivityType): string {
  switch (type) {
    case 'session_started':
      return 'Started practice session';
    case 'session_completed':
      return 'Completed practice session';
    case 'session_abandoned':
      return 'Abandoned practice session';
    case 'step_submitted':
      return 'Submitted step';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
