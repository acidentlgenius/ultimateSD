import { prisma } from '@/lib/prisma';

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export async function recordOutcome(args: {
  userId: string;
  skillIds: string[];
  outcome: 'earned' | 'coached';
  delta?: number;
}): Promise<void> {
  if (args.skillIds.length === 0) {
    return;
  }

  const delta = args.delta ?? (args.outcome === 'earned' ? 0.15 : 0.1);
  const field = args.outcome === 'earned' ? 'earned' : 'coached';

  await prisma.$transaction(async (tx) => {
    for (const skillId of args.skillIds) {
      const existing = await tx.competencySignal.findUnique({
        where: { userId_skillId: { userId: args.userId, skillId } },
      });

      const current = existing?.[field] ?? 0;
      const next = clamp(current + delta);

      await tx.competencySignal.upsert({
        where: { userId_skillId: { userId: args.userId, skillId } },
        create: {
          userId: args.userId,
          skillId,
          earned: field === 'earned' ? next : 0,
          coached: field === 'coached' ? next : 0,
        },
        update: {
          [field]: next,
        },
      });
    }
  });
}
