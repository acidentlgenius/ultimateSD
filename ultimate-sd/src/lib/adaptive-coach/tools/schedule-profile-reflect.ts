import 'server-only';

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { invokeProfileReflect } from '@/lib/adaptive-coach/skills/invoke';
import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import { recordOutcome } from '@/lib/adaptive-coach/tools/record-outcome';
import { writeMemoryNotes } from '@/lib/adaptive-coach/tools/write-memory';
import type { LearnerProfile, PracticeMode, SessionState } from '@/lib/adaptive-coach/types';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getProblemBySlug } from '@/lib/problems';
import { getUserLLM } from '@/lib/user-llm';

export type ProfileReflectContext = {
  userId: string;
  problemSlug: string;
  mode: PracticeMode;
  sessionState: SessionState;
  profile: LearnerProfile;
  llm: BaseChatModel;
  finalScore?: number;
};

export async function runProfileReflect(ctx: ProfileReflectContext): Promise<void> {
  const output = await invokeProfileReflect({
    llm: ctx.llm,
    profile: ctx.profile,
    problemTitle: getProblemBySlug(ctx.problemSlug)?.title ?? ctx.problemSlug,
    problemSlug: ctx.problemSlug,
    mode: ctx.mode,
    sessionState: ctx.sessionState,
    finalScore: ctx.finalScore,
  });

  if (output.notes.length > 0) {
    await writeMemoryNotes(
      ctx.userId,
      output.notes.map((note) => ({
        text: note.text,
        tags: note.tags,
        problemSlug: note.problemSlug ?? ctx.problemSlug,
      })),
    );
  }

  for (const delta of output.competencyDeltas) {
    await recordOutcome({
      userId: ctx.userId,
      skillIds: [delta.skillId],
      outcome: delta.outcome,
    });
  }
}

export function scheduleProfileReflect(ctx: ProfileReflectContext): void {
  void runProfileReflect(ctx).catch((err) => {
    console.error('[profile-reflect] failed:', err);
  });
}

export function scheduleClassicProfileReflect(args: {
  userId: string;
  problemSlug: string;
  finalScore?: number;
}): void {
  void (async () => {
    try {
      if (!(await canAccessFeature(args.userId, 'adaptiveCoach'))) {
        return;
      }

      const [profile, { llm }] = await Promise.all([
        loadProfile(args.userId),
        getUserLLM(args.userId, {
          temperature: 0.3,
          problemSlug: args.problemSlug,
        }),
      ]);

      const sessionState: SessionState = {
        version: 'adaptive-1',
        mode: 'practice',
        problemSlug: args.problemSlug,
        stageId: 'complete',
        agenda: [],
        attempts: {},
        stageStartedAt: new Date().toISOString(),
        sessionBudgetSec: 0,
        status: 'complete',
      };

      await runProfileReflect({
        userId: args.userId,
        problemSlug: args.problemSlug,
        mode: 'practice',
        sessionState,
        profile,
        llm,
        finalScore: args.finalScore,
      });
    } catch (err) {
      console.error('[profile-reflect] classic session failed:', err);
    }
  })();
}
