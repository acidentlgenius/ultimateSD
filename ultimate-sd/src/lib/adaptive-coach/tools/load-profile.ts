import { prisma } from '@/lib/prisma';
import type { ExperienceLevel, LearnerProfile } from '@/lib/adaptive-coach/types';

const VALID_LEVELS: ExperienceLevel[] = ['fresher', 'sde1', 'sde2', 'senior'];
const VALID_INTENTS = ['interview', 'upskill', 'learn'] as const;
type PracticeIntent = (typeof VALID_INTENTS)[number] | '';

function isExperienceLevel(value: string): value is ExperienceLevel {
  return (VALID_LEVELS as readonly string[]).includes(value);
}

function resolveIntent(practiceIntent: string): PracticeIntent {
  if ((VALID_INTENTS as readonly string[]).includes(practiceIntent)) {
    return practiceIntent as PracticeIntent;
  }
  return 'upskill';
}

export function resolveExperienceLevel(
  experienceLevel: string,
  practiceIntent: string
): ExperienceLevel {
  if (isExperienceLevel(experienceLevel)) {
    return experienceLevel;
  }
  if (experienceLevel === '' && practiceIntent === 'learn') {
    return 'fresher';
  }
  return 'sde1';
}

export async function loadProfile(userId: string): Promise<LearnerProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      experienceLevel: true,
      practiceIntent: true,
      targetRole: true,
      targetCompanies: true,
      interviewDate: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const [memoryNotes, competencySignals] = await Promise.all([
    prisma.coachMemoryNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.competencySignal.findMany({
      where: { userId },
    }),
  ]);

  const intent = resolveIntent(user.practiceIntent);

  return {
    userId: user.id,
    level: resolveExperienceLevel(user.experienceLevel, user.practiceIntent),
    targetRole: user.targetRole ?? undefined,
    companies: user.targetCompanies,
    intent,
    interviewDate: user.interviewDate?.toISOString(),
    competencies: competencySignals.map((signal) => ({
      skillId: signal.skillId,
      earned: signal.earned,
      coached: signal.coached,
      updatedAt: signal.updatedAt.toISOString(),
    })),
    memoryNotes: memoryNotes.map((note) => ({
      id: note.id,
      text: note.text,
      tags: note.tags,
      problemSlug: note.problemSlug ?? undefined,
      createdAt: note.createdAt.toISOString(),
    })),
  };
}
