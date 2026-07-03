import { describe, expect, it } from 'vitest';
import { applyProgressToRoadmap } from '@/lib/roadmap-progress';
import type { RoadmapPhase } from '@/components/roadmap/RoadmapTypes';

const samplePhases: RoadmapPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1',
    description: 'Basics',
    steps: [
      {
        id: 'step-1',
        title: 'TinyURL',
        description: 'First problem',
        problemSlug: 'design-tinyurl',
        status: 'locked',
      },
      {
        id: 'step-2',
        title: 'Parking Lot',
        description: 'Second problem',
        problemSlug: 'design-parking-lot',
        status: 'locked',
      },
    ],
  },
];

describe('applyProgressToRoadmap', () => {
  it('unlocks the first step for guests with no progress', () => {
    const result = applyProgressToRoadmap(samplePhases, {});
    expect(result[0].steps[0].status).toBe('unlocked');
    expect(result[0].steps[1].status).toBe('locked');
  });

  it('unlocks the next step when the previous problem is completed', () => {
    const result = applyProgressToRoadmap(samplePhases, {
      'design-tinyurl': 'COMPLETED',
    });
    expect(result[0].steps[0].status).toBe('completed');
    expect(result[0].steps[1].status).toBe('unlocked');
  });

  it('marks in-progress problems correctly', () => {
    const result = applyProgressToRoadmap(samplePhases, {
      'design-tinyurl': 'IN_PROGRESS',
    });
    expect(result[0].steps[0].status).toBe('in-progress');
    expect(result[0].steps[1].status).toBe('locked');
  });
});

const conceptPhases: RoadmapPhase[] = [
  {
    id: 'phase-0',
    title: 'Phase 0',
    description: 'Concepts only',
    steps: [
      {
        id: 'concept-1',
        title: 'What Is System Design?',
        description: 'Concept card',
        status: 'unlocked',
      },
      {
        id: 'concept-2',
        title: 'Requirements & Trade-offs',
        description: 'Concept card',
        status: 'unlocked',
      },
    ],
  },
  {
    id: 'phase-1',
    title: 'Phase 1',
    description: 'First problems',
    steps: [
      {
        id: 'step-1',
        title: 'Parking Lot',
        description: 'First problem',
        problemSlug: 'design-parking-lot',
        status: 'unlocked',
      },
      {
        id: 'step-2',
        title: 'Elevator',
        description: 'Second problem',
        problemSlug: 'design-elevator-system',
        status: 'locked',
      },
    ],
  },
];

describe('applyProgressToRoadmap with concept-only steps', () => {
  it('concept steps do not block the first problem for guests', () => {
    const result = applyProgressToRoadmap(conceptPhases, {});
    expect(result[0].steps[0].status).toBe('unlocked');
    expect(result[0].steps[1].status).toBe('unlocked');
    expect(result[1].steps[0].status).toBe('unlocked');
    expect(result[1].steps[1].status).toBe('locked');
  });

  it('problem completion still gates the following problem step', () => {
    const result = applyProgressToRoadmap(conceptPhases, {
      'design-parking-lot': 'COMPLETED',
    });
    expect(result[1].steps[0].status).toBe('completed');
    expect(result[1].steps[1].status).toBe('unlocked');
  });

  it('a concept step between problems passes the unlock chain through', () => {
    const phases: RoadmapPhase[] = [
      {
        id: 'phase-x',
        title: 'Mixed',
        description: 'Problem, concept, problem',
        steps: [
          {
            id: 'p1',
            title: 'TinyURL',
            description: 'Problem',
            problemSlug: 'design-tinyurl',
            status: 'unlocked',
          },
          {
            id: 'c1',
            title: 'Timed Mock',
            description: 'Concept card',
            status: 'unlocked',
          },
          {
            id: 'p2',
            title: 'WhatsApp',
            description: 'Problem',
            problemSlug: 'design-whatsapp',
            status: 'locked',
          },
        ],
      },
    ];
    const locked = applyProgressToRoadmap(phases, {});
    expect(locked[0].steps[2].status).toBe('locked');

    const unlocked = applyProgressToRoadmap(phases, {
      'design-tinyurl': 'COMPLETED',
    });
    expect(unlocked[0].steps[1].status).toBe('unlocked');
    expect(unlocked[0].steps[2].status).toBe('unlocked');
  });
});
