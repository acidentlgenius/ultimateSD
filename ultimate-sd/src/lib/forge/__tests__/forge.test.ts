import { describe, expect, it, vi } from 'vitest';

vi.mock('@excalidraw/excalidraw', () => ({
  convertToExcalidrawElements: (skeleton: unknown[]) =>
    skeleton.map((item, index) => {
      const el = item as Record<string, unknown>;
      return {
        id: (el.id as string) ?? `gen-${index}`,
        type: el.type ?? 'rectangle',
        x: el.x ?? 0,
        y: el.y ?? 0,
        width: el.width ?? 100,
        height: el.height ?? 100,
        customData: el.customData,
        opacity: el.opacity ?? 100,
        strokeWidth: el.strokeWidth ?? 2,
        backgroundColor: el.backgroundColor ?? 'transparent',
        isDeleted: false,
        text: el.text,
      };
    }),
  getTextFromElements: (elements: { text?: string }[]) =>
    elements.map((el) => el.text ?? '').join('\n'),
}));

import { buildForgeJourney, getJourneyProgress, estimateMinutesRemaining } from '@/lib/forge/forge-journey';
import { buildStandardForgeJourney } from '@/lib/forge/standard-journey';
import { FORGE_PORTED_PROBLEM_SLUGS, getForgeProblemContent } from '@/lib/forge/forge-problem-content';
import { spawnSessionFrames, extractFrameText, extractSelectionText, activateNextFrame } from '@/lib/forge/frame-manager';
import { mergeFeedbackAnnotations } from '@/lib/forge/forge-annotations';
import { initForgeSession, loadForgeSession, saveForgeSession, normalizeForgeSession, resolveForgeInitialScene } from '@/lib/forge/forge-session';
import { isForgeSessionComplete, averageStepScore } from '@/lib/forge/forge-progress';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import type { SystemDesignProblem } from '@/types';

const TINYURL: SystemDesignProblem = {
  id: '1',
  title: 'Design TinyURL',
  slug: 'design-tinyurl',
  context: 'URL shortener',
  difficulty: 'Easy',
  category: 'Basics',
  companies: ['Amazon'],
  functionalRequirements: ['Shorten URL', 'Redirect', 'Custom alias'],
  nonFunctionalRequirements: ['Low latency', 'High availability'],
  steps: DEFAULT_PHASE_STEPS,
};

describe('buildForgeJourney', () => {
  it('flattens phase steps into ordered journey', () => {
    const journey = buildForgeJourney(DEFAULT_PHASE_STEPS);
    expect(journey.length).toBeGreaterThan(5);
    expect(journey[0].subStep).toBe('functional');
    expect(journey[0].theme).toBe('blue');
    expect(journey[0].frameId).toBe('frame-requirements-functional');
  });

  it('computes progress percentage', () => {
    expect(getJourneyProgress(['a', 'b'], 6)).toBe(33);
    expect(getJourneyProgress([], 6)).toBe(0);
  });

  it('estimates remaining minutes from active step', () => {
    const journey = buildForgeJourney(DEFAULT_PHASE_STEPS);
    const remaining = estimateMinutesRemaining(journey, 1);
    expect(remaining).toBeGreaterThan(0);
  });
});

describe('spawnSessionFrames', () => {
  it('creates frame elements for each journey step', () => {
    const journey = buildForgeJourney(DEFAULT_PHASE_STEPS);
    const elements = spawnSessionFrames(journey, TINYURL, 'intermediate', 0);
    expect(elements.length).toBeGreaterThan(journey.length);
    const frameHeaders = elements.filter((el) => el.customData?.type === 'schematic-frame');
    expect(frameHeaders).toHaveLength(journey.length);
  });

  it('includes starter requirements for intermediate seniority on FR step', () => {
    const journey = buildForgeJourney(DEFAULT_PHASE_STEPS);
    const elements = spawnSessionFrames(journey, TINYURL, 'intermediate', 0);
    const text = elements
      .filter((el) => el.type === 'text')
      .map((el) => ('text' in el ? el.text : ''))
      .join(' ');
    expect(text).toContain('Shorten URL');
  });

  it('extractFrameText returns text inside frame bounds', () => {
    const journey = buildForgeJourney(DEFAULT_PHASE_STEPS);
    const elements = spawnSessionFrames(journey, TINYURL, 'beginner', 0);
    const frameId = journey[0].frameId;
    const extracted = extractFrameText(elements, frameId);
    expect(extracted.length).toBeGreaterThan(0);
  });
});

describe('forge session persistence', () => {
  it('round-trips session state via localStorage', () => {
    const session = initForgeSession('design-tinyurl', 'advanced');
    session.immersionComplete = true;
    session.seniorityCalibrated = true;
    saveForgeSession(session);

    const loaded = loadForgeSession('design-tinyurl');
    expect(loaded?.sessionId).toBe(session.sessionId);
    expect(loaded?.seniority).toBe('advanced');
    expect(loaded?.immersionComplete).toBe(true);
    expect(loaded?.seniorityCalibrated).toBe(true);
  });

  it('backfills seniorityCalibrated on older sessions', () => {
    const legacy = {
      ...initForgeSession('design-tinyurl'),
      seniorityCalibrated: undefined as unknown as boolean,
    };
    const normalized = normalizeForgeSession(legacy);
    expect(normalized.seniorityCalibrated).toBe(false);
  });
});

describe('activateNextFrame', () => {
  it('un-ghosts the next frame after step completion', () => {
    const journey = buildForgeJourney(DEFAULT_PHASE_STEPS);
    const elements = spawnSessionFrames(journey, TINYURL, 'intermediate', 0);
    const frame0 = journey[0].frameId;
    const frame1 = journey[1].frameId;
    const ghostBefore = elements.find((el) => el.id === frame1);
    expect(ghostBefore?.opacity).toBe(25);

    const updated = activateNextFrame(elements, frame0, frame1);
    const unghosted = updated.find((el) => el.id === frame1);
    expect(unghosted?.opacity).toBe(100);
  });
});

describe('buildStandardForgeJourney', () => {
  it('returns 6 canonical frames from the design spec', () => {
    const journey = buildStandardForgeJourney(TINYURL);
    expect(journey).toHaveLength(6);
    expect(journey[0].subStep).toBe('functional');
    expect(journey[2].title).toBe('Data Model');
    expect(journey[4].subStep).toBe('architecture');
    expect(journey[5].phaseKey).toBe('tradeoffs');
  });
});

describe('forge annotations', () => {
  it('adds feedback pins inside a frame', () => {
    const journey = buildStandardForgeJourney(TINYURL);
    const elements = spawnSessionFrames(journey, TINYURL, 'intermediate', 0);
    const frameId = journey[0].frameId;
    const merged = mergeFeedbackAnnotations(elements, frameId, journey[0].stepId, {
      score: 4,
      strengths: ['Good scope'],
      weaknesses: ['Missing analytics'],
      isAcceptable: true,
    });
    expect(merged.length).toBeGreaterThan(elements.length);
    expect(merged.some((el) => el.customData?.type === 'schematic-annotation')).toBe(true);
  });
});

describe('forge problem content', () => {
  it('ports 10 problems with tailored content', () => {
    expect(FORGE_PORTED_PROBLEM_SLUGS).toHaveLength(10);
    expect(FORGE_PORTED_PROBLEM_SLUGS).toContain('design-tinyurl');
    expect(FORGE_PORTED_PROBLEM_SLUGS).toContain('design-youtube');
    expect(FORGE_PORTED_PROBLEM_SLUGS).toContain('design-uber');
  });

  it('applies per-problem architecture prompts', () => {
    const journey = buildStandardForgeJourney(TINYURL);
    const arch = journey.find((s) => s.stepId === 'hld-architecture');
    expect(arch?.prompt).toContain('redirect end-to-end');
  });

  it('exposes entity names for data model frames', () => {
    const content = getForgeProblemContent('design-tinyurl');
    expect(content?.entities).toEqual(['LongUrl', 'ShortCode', 'ClickEvent']);
  });
});

describe('extractSelectionText', () => {
  it('returns text from selected elements only', () => {
    const journey = buildForgeJourney(DEFAULT_PHASE_STEPS);
    const elements = spawnSessionFrames(journey, TINYURL, 'beginner', 0);
    const textEl = elements.find((el) => el.type === 'text' && 'text' in el && el.text?.includes('Shorten'));
    expect(textEl).toBeDefined();
    if (!textEl) return;

    const selected = extractSelectionText(elements, { [textEl.id]: true });
    expect(selected).toContain('Shorten');
  });
});

describe('forge progress', () => {
  it('marks session complete when all journey steps are done', () => {
    const journey = buildStandardForgeJourney(TINYURL);
    const completed = journey.map((step) => step.stepId);
    expect(isForgeSessionComplete(completed, journey)).toBe(true);
    expect(isForgeSessionComplete(completed.slice(0, -1), journey)).toBe(false);
  });

  it('averages step scores', () => {
    expect(averageStepScore({ a: 4, b: 5 })).toBe(4.5);
    expect(averageStepScore({})).toBeNull();
  });
});

describe('resolveForgeInitialScene', () => {
  it('prefers local scene over server snapshot', () => {
    const session = initForgeSession('design-tinyurl');
    const localScene = {
      type: 'excalidraw' as const,
      version: 2,
      source: 'forge',
      elements: [{ id: 'local', type: 'rectangle', isDeleted: false }],
      appState: {},
      files: {},
    };
    const serverScene = {
      type: 'excalidraw' as const,
      version: 2,
      source: 'server',
      elements: [{ id: 'server', type: 'rectangle', isDeleted: false }],
      appState: {},
      files: {},
    };
    const resolved = resolveForgeInitialScene(
      { ...session, scene: localScene },
      serverScene
    );
    expect(resolved?.elements[0].id).toBe('local');
  });

  it('falls back to server snapshot when local scene is empty', () => {
    const session = initForgeSession('design-tinyurl');
    const serverScene = {
      type: 'excalidraw' as const,
      version: 2,
      source: 'server',
      elements: [{ id: 'server', type: 'rectangle', isDeleted: false }],
      appState: {},
      files: {},
    };
    const resolved = resolveForgeInitialScene(session, serverScene);
    expect(resolved?.elements[0].id).toBe('server');
  });
});
