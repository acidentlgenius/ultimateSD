// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  EvaluateSkillOutputSchema,
  invokeEvaluateForLevel,
} from '@/lib/adaptive-coach/skills/invoke';
import type { CoachStage } from '@/lib/adaptive-coach/tools/stage-rails';
import type { LearnerProfile } from '@/lib/adaptive-coach/types';

const profile: LearnerProfile = {
  userId: 'user-1',
  level: 'sde1',
  companies: [],
  intent: 'interview',
  competencies: [],
  memoryNotes: [],
};

const stage: CoachStage = {
  id: 'requirements-0',
  phaseKey: 'requirements',
  phase: 'Requirements',
  title: 'Functional Requirements',
  prompt: 'List the core features from entry to exit.',
  budgetSec: 360,
};

describe('EvaluateSkillOutputSchema', () => {
  it('accepts valid evaluation output', () => {
    const result = EvaluateSkillOutputSchema.safeParse({
      score: 7,
      accuracy: 75,
      strengths: ['Good breadth'],
      weaknesses: ['Missing admin features'],
      missed: ['Degraded payment mode'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('isAcceptable');
    }
  });

  it('rejects incomplete or out-of-range payloads', () => {
    expect(EvaluateSkillOutputSchema.safeParse({ score: 7 }).success).toBe(false);
    expect(
      EvaluateSkillOutputSchema.safeParse({
        score: 11,
        accuracy: 75,
        strengths: [],
        weaknesses: [],
        missed: [],
      }).success,
    ).toBe(false);
  });
});

describe('invokeEvaluateForLevel', () => {
  it('parses JSON from a mock LLM and validates against the schema', async () => {
    const valid = {
      score: 6,
      accuracy: 60,
      strengths: ['Covers entry and exit'],
      weaknesses: ['Light on operator tooling'],
      missed: ['Payment outage degraded mode'],
    };

    const llm = {
      invoke: vi.fn().mockResolvedValue({ content: JSON.stringify(valid) }),
    };

    const result = await invokeEvaluateForLevel({
      llm: llm as never,
      profile,
      problemTitle: 'Parking Lot System',
      stage,
      userAnswer: 'Users enter, get a spot, pay, and leave.',
      gold: ['Expert functional requirements:\n- Admit a vehicle'],
    });

    expect(result).toEqual(valid);
    expect(llm.invoke).toHaveBeenCalledOnce();
  });

  it('retries once when the first LLM response is malformed JSON', async () => {
    const valid = {
      score: 5,
      accuracy: 50,
      strengths: [],
      weaknesses: ['Too shallow'],
      missed: ['Operator dashboard'],
    };

    const llm = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: 'Sorry, here is my feedback in prose.' })
        .mockResolvedValueOnce({ content: JSON.stringify(valid) }),
    };

    const result = await invokeEvaluateForLevel({
      llm: llm as never,
      profile,
      problemTitle: 'Parking Lot System',
      stage,
      userAnswer: 'Basic parking features only.',
      gold: [],
    });

    expect(result).toEqual(valid);
    expect(llm.invoke).toHaveBeenCalledTimes(2);
  });

  it('includes attempt and prior feedback in the evaluate prompt', async () => {
    const valid = {
      score: 4,
      accuracy: 40,
      strengths: [],
      weaknesses: ['Still blending FR and NFR'],
      missed: ['Concrete FR list'],
    };
    const llm = {
      invoke: vi.fn().mockResolvedValue({ content: JSON.stringify(valid) }),
    };

    await invokeEvaluateForLevel({
      llm: llm as never,
      profile,
      problemTitle: 'Design TinyURL',
      stage,
      userAnswer: 'Shorten links',
      gold: [],
      attemptCount: 2,
      previousFeedback: {
        weaknesses: ['Too vague'],
        missed: ['Redirect as a feature'],
      },
    });

    const human = String(llm.invoke.mock.calls[0]?.[0]?.[1]?.content ?? '');
    expect(human).toMatch(/Prior attempt feedback/i);
    expect(human).toMatch(/Attempt number: 2/);
    expect(human).toMatch(/Too vague/);
  });
});

describe('sanitizeEvaluateAgainstAnswer', () => {
  it('drops missed items that contradict the candidate answer', async () => {
    const { sanitizeEvaluateAgainstAnswer } = await import(
      '@/lib/adaptive-coach/skills/invoke'
    );

    const cleaned = sanitizeEvaluateAgainstAnswer(
      {
        score: 7,
        accuracy: 80,
        strengths: ['Good breadth'],
        weaknesses: ['Should discuss 301 vs 302 redirects'],
        missed: [
          "No mention of 'User accounts', although 'User accounts' are listed in the candidate's answer",
        ],
      },
      'URL shortening\nUser accounts\nDashboard for managing links',
      stage,
    );

    expect(cleaned.missed).toEqual([]);
    expect(cleaned.weaknesses).toEqual([]);
  });
});
