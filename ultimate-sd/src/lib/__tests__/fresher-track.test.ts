import { describe, expect, it } from 'vitest';
import { getRoadmapData, FRESHER_TRACK_INFO, getVisibleTracks, TRACKS } from '@/components/roadmap/RoadmapData';
import { PROBLEMS } from '@/lib/problems';

const fresherPhases = getRoadmapData('fresher');

describe('fresher track data integrity', () => {
  it('exposes the Fresher & Campus track info', () => {
    expect(FRESHER_TRACK_INFO.id).toBe('fresher');
    expect(FRESHER_TRACK_INFO.label).toBe('Fresher & Campus');
  });

  it('has five phases in curriculum order', () => {
    expect(fresherPhases.map((p) => p.id)).toEqual([
      'phase-0-fresher',
      'phase-1-fresher',
      'phase-2-fresher',
      'phase-3-fresher',
      'phase-4-fresher',
    ]);
  });

  it('Phase 0 is concept-only (no problems, static content)', () => {
    const phase0 = fresherPhases[0]!;
    expect(phase0.steps.length).toBeGreaterThan(0);
    for (const step of phase0.steps) {
      expect(step.problemSlug).toBeUndefined();
      expect(step.problemId).toBeUndefined();
      expect(step.resources?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('every problem step resolves to a real catalog problem with matching id', () => {
    const problemSteps = fresherPhases.flatMap((p) =>
      p.steps.filter((s) => s.problemSlug)
    );
    expect(problemSteps).toHaveLength(7);
    for (const step of problemSteps) {
      const problem = PROBLEMS.find((p) => p.slug === step.problemSlug);
      expect(problem, `missing problem for slug ${step.problemSlug}`).toBeDefined();
      expect(step.problemId).toBe(problem!.id);
    }
  });

  it('uses the canonical fresher curriculum in order', () => {
    const slugs = fresherPhases.flatMap((p) =>
      p.steps.filter((s) => s.problemSlug).map((s) => s.problemSlug)
    );
    expect(slugs).toEqual([
      'design-parking-lot',
      'design-elevator-system',
      'design-tinyurl',
      'design-rest-api',
      'design-rate-limiter',
      'design-notification-system',
      'design-whatsapp',
    ]);
  });

  it('has no duplicate step ids', () => {
    const ids = fresherPhases.flatMap((p) => p.steps.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getVisibleTracks', () => {
  it('hides the fresher track when the flag is off (zero change)', () => {
    expect(getVisibleTracks(false)).toEqual(TRACKS);
    expect(getVisibleTracks(false).some((t) => t.id === 'fresher')).toBe(false);
  });

  it('puts the fresher track first when the flag is on', () => {
    const visible = getVisibleTracks(true);
    expect(visible[0]).toEqual(FRESHER_TRACK_INFO);
    expect(visible.slice(1)).toEqual(TRACKS);
  });

  it('never mutates the base TRACKS array', () => {
    const before = [...TRACKS];
    getVisibleTracks(true);
    expect(TRACKS).toEqual(before);
  });
});
