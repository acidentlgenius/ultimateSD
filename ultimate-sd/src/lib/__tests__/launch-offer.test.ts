import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildLaunchOfferStats,
  formatLaunchOfferCountdown,
  getLaunchOfferCampaignEndsAt,
  getLaunchOfferCountdown,
  getLaunchOfferExpiry,
  isLaunchOfferActive,
  LAUNCH_OFFER_CAMPAIGN_END_ISO,
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
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes remaining platform slots', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'));

    const stats = buildLaunchOfferStats(12, 2, 40);
    expect(stats.platformClaimed).toBe(12);
    expect(stats.platformRemaining).toBe(LAUNCH_PLATFORM_SLOTS - 12);
    expect(stats.aiWinners).toBe(2);
    expect(stats.aiEligible).toBe(40);
    expect(stats.isActive).toBe(true);
  });

  it('exposes aiEligible instead of aiEntries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'));

    const stats = buildLaunchOfferStats(12, 2, 35);
    expect(stats.aiEligible).toBe(35);
    expect(stats).not.toHaveProperty('aiEntries');
  });

  it('never returns negative remaining slots', () => {
    const stats = buildLaunchOfferStats(60, 0, 0);
    expect(stats.platformRemaining).toBe(0);
  });

  it('marks offer inactive after the campaign end date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T00:00:00.000Z'));

    const stats = buildLaunchOfferStats(10, 0, 10);
    expect(stats.isActive).toBe(false);
  });
});

describe('launch offer campaign deadline', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to 15 July 2026', () => {
    expect(getLaunchOfferCampaignEndsAt().toISOString()).toBe(LAUNCH_OFFER_CAMPAIGN_END_ISO);
  });

  it('counts down to the campaign end', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'));

    expect(getLaunchOfferCountdown()).toEqual({
      days: 14,
      hours: 11,
      minutes: 59,
      seconds: 59,
      ended: false,
    });
    expect(formatLaunchOfferCountdown(getLaunchOfferCountdown())).toBe('14d 11h 59m 59s');
  });

  it('is active before the campaign end and inactive after', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00.000Z'));
    expect(isLaunchOfferActive()).toBe(true);

    vi.setSystemTime(new Date('2026-07-16T00:00:00.000Z'));
    expect(isLaunchOfferActive()).toBe(false);
    expect(getLaunchOfferCountdown().ended).toBe(true);
  });
});
