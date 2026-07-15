// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    coachMemoryNote: { findMany: vi.fn() },
    competencySignal: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { resolveExperienceLevel, loadProfile } from '@/lib/adaptive-coach/tools/load-profile';

describe('resolveExperienceLevel', () => {
  it('returns stored enum when valid', () => {
    expect(resolveExperienceLevel('sde2', '')).toBe('sde2');
    expect(resolveExperienceLevel('senior', 'interview')).toBe('senior');
  });

  it('defaults empty level + learn intent to fresher', () => {
    expect(resolveExperienceLevel('', 'learn')).toBe('fresher');
  });

  it('defaults empty level otherwise to sde1', () => {
    expect(resolveExperienceLevel('', '')).toBe('sde1');
    expect(resolveExperienceLevel('', 'interview')).toBe('sde1');
    expect(resolveExperienceLevel('', 'upskill')).toBe('sde1');
  });

  it('falls back to sde1 for invalid stored values', () => {
    expect(resolveExperienceLevel('staff', 'learn')).toBe('sde1');
    expect(resolveExperienceLevel('invalid', '')).toBe('sde1');
  });
});

describe('loadProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults level and intent when user fields are empty', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      experienceLevel: '',
      practiceIntent: '',
      targetRole: null,
      targetCompanies: [],
      interviewDate: null,
    } as never);
    vi.mocked(prisma.coachMemoryNote.findMany).mockResolvedValue([]);
    vi.mocked(prisma.competencySignal.findMany).mockResolvedValue([]);

    const profile = await loadProfile('user-1');

    expect(profile).toEqual({
      userId: 'user-1',
      level: 'sde1',
      targetRole: undefined,
      companies: [],
      intent: 'upskill',
      interviewDate: undefined,
      competencies: [],
      memoryNotes: [],
    });
  });

  it('resolves learn intent to fresher when experience level is empty', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-2',
      experienceLevel: '',
      practiceIntent: 'learn',
      targetRole: 'backend',
      targetCompanies: ['Google'],
      interviewDate: new Date('2026-08-01T00:00:00.000Z'),
    } as never);
    vi.mocked(prisma.coachMemoryNote.findMany).mockResolvedValue([]);
    vi.mocked(prisma.competencySignal.findMany).mockResolvedValue([]);

    const profile = await loadProfile('user-2');

    expect(profile.level).toBe('fresher');
    expect(profile.intent).toBe('learn');
    expect(profile.targetRole).toBe('backend');
    expect(profile.companies).toEqual(['Google']);
    expect(profile.interviewDate).toBe('2026-08-01T00:00:00.000Z');
  });

  it('hydrates last 20 memory notes and all competency signals', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-3',
      experienceLevel: 'sde1',
      practiceIntent: 'interview',
      targetRole: null,
      targetCompanies: [],
      interviewDate: null,
    } as never);
    vi.mocked(prisma.coachMemoryNote.findMany).mockResolvedValue([
      {
        id: 'note-1',
        text: 'Needs caching help',
        tags: ['caching'],
        problemSlug: 'design-tinyurl',
        createdAt: new Date('2026-07-01T12:00:00.000Z'),
      },
    ] as never);
    vi.mocked(prisma.competencySignal.findMany).mockResolvedValue([
      {
        skillId: 'caching',
        earned: 0.4,
        coached: 0.1,
        updatedAt: new Date('2026-07-10T08:00:00.000Z'),
      },
    ] as never);

    const profile = await loadProfile('user-3');

    expect(prisma.coachMemoryNote.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-3' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    expect(profile.memoryNotes).toEqual([
      {
        id: 'note-1',
        text: 'Needs caching help',
        tags: ['caching'],
        problemSlug: 'design-tinyurl',
        createdAt: '2026-07-01T12:00:00.000Z',
      },
    ]);
    expect(profile.competencies).toEqual([
      {
        skillId: 'caching',
        earned: 0.4,
        coached: 0.1,
        updatedAt: '2026-07-10T08:00:00.000Z',
      },
    ]);
  });
});
