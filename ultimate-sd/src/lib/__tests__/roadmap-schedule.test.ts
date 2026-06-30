import { describe, it, expect } from 'vitest';
import {
  SE_EIGHT_WEEK_SCHEDULE,
  getScheduleForTrack,
  getWeekScheduleStatus,
} from '../roadmap-schedule';

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
