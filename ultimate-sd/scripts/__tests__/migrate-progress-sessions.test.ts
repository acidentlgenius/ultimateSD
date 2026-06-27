// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildBackfillPlan } from '../lib/backfill-progress';

describe('buildBackfillPlan', () => {
  it('creates an ACTIVE session and links progress for in-progress rows', () => {
    const plan = buildBackfillPlan(
      [
        {
          id: 'pp-1',
          userId: 'user-1',
          problemId: 'problem-1',
          status: 'IN_PROGRESS',
          totalAttempts: 2,
          createdAt: new Date('2026-01-01'),
          startedAt: new Date('2026-01-01'),
        },
      ],
      []
    );

    expect(plan.sessions).toHaveLength(1);
    expect(plan.sessions[0]).toMatchObject({
      userId: 'user-1',
      problemId: 'problem-1',
      status: 'ACTIVE',
      attemptNumber: 2,
    });
    expect(plan.progressUpdates).toEqual([
      {
        progressId: 'pp-1',
        sessionTempId: plan.sessions[0].tempId,
        setActiveSession: true,
        totalAttempts: 2,
      },
    ]);
  });

  it('creates a COMPLETED session for orphan submissions', () => {
    const plan = buildBackfillPlan(
      [],
      [
        {
          id: 'sub-1',
          userId: 'user-2',
          problemId: 'problem-2',
          createdAt: new Date('2026-02-01'),
        },
      ]
    );

    expect(plan.sessions).toHaveLength(1);
    expect(plan.sessions[0].status).toBe('COMPLETED');
    expect(plan.submissionUpdates).toEqual([
      {
        submissionId: 'sub-1',
        sessionTempId: plan.sessions[0].tempId,
      },
    ]);
  });
});
