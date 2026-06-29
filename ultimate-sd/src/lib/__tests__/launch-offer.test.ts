import { describe, it, expect } from 'vitest';
import {
  buildLaunchOfferStats,
  getLaunchOfferExpiry,
  LAUNCH_PLATFORM_SLOTS,
} from '../launch-offer';

describe('getLaunchOfferExpiry', () => {
  it('returns a date 3 months after the given date', () => {
    const from = new Date('2026-01-15T12:00:00.000Z');
    const expiry = getLaunchOfferExpiry(from);
    expect(expiry.getFullYear()).toBe(2026);
    expect(expiry.getMonth()).toBe(3);
    expect(expiry.getDate()).toBe(15);
  });
});

describe('buildLaunchOfferStats', () => {
  it('computes remaining platform slots', () => {
    const stats = buildLaunchOfferStats(12, 2, 40);
    expect(stats.platformClaimed).toBe(12);
    expect(stats.platformRemaining).toBe(LAUNCH_PLATFORM_SLOTS - 12);
    expect(stats.aiWinners).toBe(2);
    expect(stats.aiEntries).toBe(40);
    expect(stats.isActive).toBe(true);
  });

  it('never returns negative remaining slots', () => {
    const stats = buildLaunchOfferStats(60, 0, 0);
    expect(stats.platformRemaining).toBe(0);
  });
});
