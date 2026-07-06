import { describe, expect, it } from 'vitest';
import { buildPhaseExportGroups, getStepTitle, parseStepKey } from '../pdf-export-helpers';
import { DEFAULT_PHASE_STEPS } from '../steps';

describe('parseStepKey', () => {
  it('parses phase and index from step keys', () => {
    expect(parseStepKey('requirements-2')).toEqual({
      phaseKey: 'requirements',
      stepIndex: 2,
    });
    expect(parseStepKey('data-modeling-0')).toEqual({
      phaseKey: 'data-modeling',
      stepIndex: 0,
    });
  });
});

describe('buildPhaseExportGroups', () => {
  it('includes custom phase keys and step titles', () => {
    const savedStepData = new Map<string, Record<string, unknown>>([
      ['requirements-0', { listItems: ['Post tweets'] }],
      ['requirements-2', { listItems: ['280 char limit'] }],
      ['data-modeling-0', { textInput: 'User graph' }],
    ]);

    const groups = buildPhaseExportGroups(
      {
        id: 'design-twitter',
        slug: 'design-twitter',
        title: 'Twitter',
        context: '',
        functionalRequirements: [],
        nonFunctionalRequirements: [],
        difficulty: 'Hard',
        category: 'Social',
        companies: [],
        steps: {
          requirements: DEFAULT_PHASE_STEPS.requirements,
          'data-modeling': [
            {
              phase: 'Data Modeling',
              subStep: 'graph',
              title: 'User Graph',
              prompt: 'Model follows',
              inputType: 'textarea',
            },
          ],
        },
      },
      savedStepData
    );

    expect(groups.map((g) => g.phaseKey)).toEqual(['requirements', 'data-modeling']);
    expect(groups[0].steps.map((s) => s.stepTitle)).toEqual([
      'Functional Requirements',
      'Constraints & Assumptions',
    ]);
    expect(groups[1].steps[0].stepTitle).toBe('User Graph');
  });
});

describe('getStepTitle', () => {
  it('falls back to formatted key when step metadata is missing', () => {
    expect(getStepTitle(DEFAULT_PHASE_STEPS, 'requirements-2')).toBe(
      'Constraints & Assumptions'
    );
  });
});
