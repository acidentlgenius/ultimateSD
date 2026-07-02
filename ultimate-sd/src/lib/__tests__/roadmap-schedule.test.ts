import { describe, it, expect } from 'vitest';
import {
  SE_EIGHT_WEEK_SCHEDULE,
  FRESHER_EIGHT_WEEK_SCHEDULE,
  getScheduleForTrack,
  getWeekScheduleStatus,
} from '../roadmap-schedule';
import { getRoadmapData } from '@/components/roadmap/RoadmapData';

describe('roadmap-schedule', () => {
  it('defines 8 weeks for the SE track', () => {
    const schedule = getScheduleForTrack('se');
    expect(schedule).toHaveLength(8);
    expect(schedule[0]?.week).toBe(1);
    expect(schedule[7]?.week).toBe(8);
  });

  it('returns empty schedule for tracks without a plan', () => {
    expect(getScheduleForTrack('sse')).toEqual([]);
  });

  it('marks week complete when all slugs are completed', () => {
    const week = SE_EIGHT_WEEK_SCHEDULE[0]!;
    const progress = Object.fromEntries(
      week.slugs.map((slug) => [slug, 'COMPLETED' as const]),
    );
    expect(getWeekScheduleStatus(week, progress)).toBe('complete');
  });

  it('marks week in-progress when any slug started', () => {
    const week = SE_EIGHT_WEEK_SCHEDULE[0]!;
    expect(
      getWeekScheduleStatus(week, { [week.slugs[0]!]: 'IN_PROGRESS' }),
    ).toBe('in-progress');
  });
});

describe('fresher 8-week schedule', () => {
  it('defines 8 weeks for the fresher track', () => {
    const schedule = getScheduleForTrack('fresher');
    expect(schedule).toHaveLength(8);
    expect(schedule.map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('week 1 is foundations with no problems', () => {
    expect(FRESHER_EIGHT_WEEK_SCHEDULE[0]!.slugs).toEqual([]);
  });

  it('covers exactly the fresher roadmap problem slugs, in track order', () => {
    const trackSlugs = getRoadmapData('fresher').flatMap((phase) =>
      phase.steps.filter((s) => s.problemSlug).map((s) => s.problemSlug!)
    );
    const scheduleSlugs = FRESHER_EIGHT_WEEK_SCHEDULE.flatMap((w) => [...w.slugs]);
    expect(scheduleSlugs).toEqual(trackSlugs);
  });

  it('a foundations-only week with no slugs reads as upcoming', () => {
    expect(getWeekScheduleStatus(FRESHER_EIGHT_WEEK_SCHEDULE[0]!, {})).toBe('upcoming');
  });
});
