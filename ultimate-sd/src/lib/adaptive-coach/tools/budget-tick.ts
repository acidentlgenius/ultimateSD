import type { PracticeMode } from '@/lib/adaptive-coach/types';

const PRACTICE_WARN_REMAINING_SEC = 300;

export function budgetTick(args: {
  mode: PracticeMode;
  sessionRemainingSec: number;
}): { warn: boolean; endMock: boolean } {
  const endMock = args.mode === 'mock' && args.sessionRemainingSec <= 0;
  const warn =
    args.mode === 'practice' && args.sessionRemainingSec <= PRACTICE_WARN_REMAINING_SEC;

  return { warn, endMock };
}
