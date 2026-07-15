import { describe, expect, it } from 'vitest';
import { PROBLEMS } from '../problems';
import { getStepsForProblem } from '../problem-steps';
import { DEFAULT_PHASE_STEPS, GENERIC_OOD_PHASE_STEPS } from '../steps';
import {
  buildStepKey,
  clampStepIndex,
  getDiagramStepKeysForProblem,
  getGenericFallbackSteps,
  isDiagramSubStep,
  isFirstJourneyStep,
  phaseIncludesDiagram,
  resolveEffectivePhase,
  resolveEvaluationPhaseKey,
  resolveEvaluationSubStepKey,
  resolvePhaseSteps,
  computePracticeProgress,
} from '../step-journey';
import type { SystemDesignProblem } from '@/types';

describe('problem journey audit', () => {
  it('every catalog problem has at least one valid step', () => {
    for (const problem of PROBLEMS) {
      const phaseSteps = resolvePhaseSteps(getStepsForProblem(problem.slug), DEFAULT_PHASE_STEPS);
      const phaseKeys = Object.keys(phaseSteps);
      expect(phaseKeys.length, problem.slug).toBeGreaterThan(0);

      for (const phaseKey of phaseKeys) {
        const steps = phaseSteps[phaseKey];
        expect(steps.length, `${problem.slug}:${phaseKey}`).toBeGreaterThan(0);
        for (const step of steps) {
          expect(step.title, `${problem.slug}:${phaseKey}`).toBeTruthy();
          expect(step.prompt, `${problem.slug}:${phaseKey}`).toBeTruthy();
          expect(step.inputType, `${problem.slug}:${phaseKey}`).toBeTruthy();
        }
      }
    }
  });

  it('stale requirements phase resolves to the first real phase for widget problems', () => {
    const steps = getStepsForProblem('design-feature-flag-system');
    expect(steps).toBeDefined();
    const phaseKeys = Object.keys(steps!);
    expect(resolveEffectivePhase('requirements', phaseKeys)).toBe('requirements');
    expect(buildStepKey(resolveEffectivePhase('requirements', phaseKeys), 0)).toBe('requirements-0');
  });
});

describe('resolveEffectivePhase', () => {
  it('keeps a valid phase key', () => {
    expect(resolveEffectivePhase('hld', ['requirements', 'hld', 'lld'])).toBe('hld');
  });

  it('falls back to the first phase when the current key is invalid', () => {
    expect(
      resolveEffectivePhase('requirements', ['feature-flag-flow'])
    ).toBe('feature-flag-flow');
  });
});

describe('buildStepKey', () => {
  it('uses the effective phase key, not a stale requirements key', () => {
    const phaseKeys = ['feature-flag-flow'];
    const effective = resolveEffectivePhase('requirements', phaseKeys);
    expect(buildStepKey(effective, 0)).toBe('feature-flag-flow-0');
  });
});

describe('clampStepIndex', () => {
  it('clamps out-of-range indices', () => {
    expect(clampStepIndex(5, 2)).toBe(1);
    expect(clampStepIndex(-1, 3)).toBe(0);
  });
});

describe('isDiagramSubStep', () => {
  it('recognizes architecture-like substeps used across problems', () => {
    expect(isDiagramSubStep('architecture')).toBe(true);
    expect(isDiagramSubStep('diagram')).toBe(true);
    expect(isDiagramSubStep('hld')).toBe(true);
    expect(isDiagramSubStep('high-level')).toBe(true);
    expect(isDiagramSubStep('data-flow')).toBe(true);
    expect(isDiagramSubStep('data_flow')).toBe(true);
    expect(isDiagramSubStep('functional')).toBe(false);
  });
});

describe('isFirstJourneyStep', () => {
  it('does not assume requirements is always first', () => {
    expect(isFirstJourneyStep('feature-flag-flow', 0, ['feature-flag-flow'])).toBe(true);
    expect(isFirstJourneyStep('requirements', 0, ['feature-flag-flow'])).toBe(false);
  });
});

describe('resolveEvaluationPhaseKey', () => {
  it('maps phase keys directly', () => {
    expect(resolveEvaluationPhaseKey('hld', 'System Architecture')).toBe('hld');
    expect(resolveEvaluationPhaseKey('lld', 'Deep Dive')).toBe('lld');
  });

  it('maps display labels when phase key is missing', () => {
    expect(resolveEvaluationPhaseKey(undefined, 'System Architecture')).toBe('hld');
    expect(resolveEvaluationPhaseKey(undefined, 'Deep Dive')).toBe('lld');
    expect(resolveEvaluationPhaseKey(undefined, 'Requirements')).toBe('requirements');
  });

  it('maps generic custom phase keys', () => {
    expect(resolveEvaluationPhaseKey('architecture', 'Architecture')).toBe('hld');
    expect(resolveEvaluationPhaseKey('deep_dive', 'Deep Dive')).toBe('lld');
  });
});

describe('resolveEvaluationSubStepKey', () => {
  it('normalizes HLD substeps', () => {
    expect(resolveEvaluationSubStepKey('hld', 'diagram')).toBe('architecture');
    expect(resolveEvaluationSubStepKey('hld', 'hld')).toBe('architecture');
    expect(resolveEvaluationSubStepKey('hld', 'metadata')).toBe('data-model');
  });

  it('normalizes LLD substeps', () => {
    expect(resolveEvaluationSubStepKey('lld', 'data_flow')).toBe('data-flow');
    expect(resolveEvaluationSubStepKey('lld', 'core_components')).toBe('components');
  });
});

describe('phaseIncludesDiagram', () => {
  it('includes standard and generic architecture phases', () => {
    expect(phaseIncludesDiagram('hld')).toBe(true);
    expect(phaseIncludesDiagram('lld')).toBe(true);
    expect(phaseIncludesDiagram('architecture')).toBe(true);
    expect(phaseIncludesDiagram('deep_dive')).toBe(true);
    expect(phaseIncludesDiagram('requirements')).toBe(false);
  });
});

describe('getDiagramStepKeysForProblem', () => {
  it('returns keys only for diagram sub-steps', () => {
    const phaseSteps = {
      hld: [
        { subStep: 'architecture', title: 'Architecture', inputType: 'text' },
        { subStep: 'api', title: 'API', inputType: 'text' },
      ],
      tradeoffs: [
        { subStep: 'tradeoffs', title: 'Tradeoffs', inputType: 'text' },
      ],
    };
    const keys = getDiagramStepKeysForProblem(phaseSteps as any);
    expect(keys).toEqual([buildStepKey('hld', 0)]);
    expect(isDiagramSubStep('architecture')).toBe(true);
  });
});

describe('resolvePhaseSteps backfill merge', () => {
  it('keeps custom phases and backfills missing ones from the generic fallback', () => {
    const custom = {
      requirements: DEFAULT_PHASE_STEPS.requirements,
      algorithm: [
        {
          phase: 'Algorithm',
          subStep: 'encoding',
          title: 'Encoding',
          prompt: 'Explain your encoding scheme.',
          inputType: 'textarea' as const,
        },
      ],
    };
    const merged = resolvePhaseSteps(custom, DEFAULT_PHASE_STEPS);

    expect(Object.keys(merged)).toEqual(
      expect.arrayContaining(['requirements', 'algorithm', 'hld', 'lld', 'tradeoffs', 'scalability'])
    );
    expect(merged.hld).toBe(DEFAULT_PHASE_STEPS.hld);
    expect(merged.lld).toBe(DEFAULT_PHASE_STEPS.lld);
    expect(merged.algorithm).toBe(custom.algorithm);
  });

  it('falls back entirely to the generic template when no custom steps exist', () => {
    expect(resolvePhaseSteps(undefined, DEFAULT_PHASE_STEPS)).toEqual(DEFAULT_PHASE_STEPS);
  });
});

describe('getGenericFallbackSteps', () => {
  it('selects the OOD generic template for oop-design tagged problems', () => {
    const problem = { slug: 'design-parking-lot' } as SystemDesignProblem;
    expect(getGenericFallbackSteps(problem)).toBe(GENERIC_OOD_PHASE_STEPS);
  });

  it('selects the default generic template for everything else', () => {
    const problem = { slug: 'design-tinyurl' } as SystemDesignProblem;
    expect(getGenericFallbackSteps(problem)).toBe(DEFAULT_PHASE_STEPS);
  });
});