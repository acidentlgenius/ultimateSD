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
