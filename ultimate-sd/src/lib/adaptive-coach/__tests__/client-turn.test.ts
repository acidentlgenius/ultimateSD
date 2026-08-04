// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  activeAgendaAsk,
  parseCoachStageId,
  seedCoachSessionState,
} from '@/lib/adaptive-coach/client-turn';
import type { AgendaMove } from '@/lib/adaptive-coach/types';

describe('activeAgendaAsk', () => {
  it('prefers ask/probe over skip and advance', () => {
    const agenda: AgendaMove[] = [
      {
        id: '1',
        kind: 'skip',
        prompt: 'skip me',
        skillFocus: [],
        source: 'planner',
      },
      {
        id: '2',
        kind: 'ask',
        prompt: 'List three functional requirements for TinyURL.',
        skillFocus: ['requirements'],
        source: 'planner',
      },
    ];
    expect(activeAgendaAsk(agenda)?.prompt).toMatch(/functional requirements/i);
  });
});

describe('parseCoachStageId', () => {
  it('splits phaseKey and step index', () => {
    expect(parseCoachStageId('requirements-0')).toEqual({
      phaseKey: 'requirements',
      stepIndex: 0,
    });
    expect(parseCoachStageId('high-level-2')).toEqual({
      phaseKey: 'high-level',
      stepIndex: 2,
    });
  });
});

describe('seedCoachSessionState', () => {
  it('creates a running adaptive session at the given stage', () => {
    const seeded = seedCoachSessionState({
      problemSlug: 'design-parking-lot',
      stageId: 'capacity-1',
    });
    expect(seeded.version).toBe('adaptive-1');
    expect(seeded.status).toBe('running');
    expect(seeded.stageId).toBe('capacity-1');
    expect(seeded.problemSlug).toBe('design-parking-lot');
  });
});
