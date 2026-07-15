import 'server-only';

import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';

import { loadSkill } from '@/lib/adaptive-coach/skills-loader';
import type { CoachStage } from '@/lib/adaptive-coach/tools/stage-rails';
import type { LearnerProfile } from '@/lib/adaptive-coach/types';

export const EvaluateSkillOutputSchema = z.object({
  score: z.number().min(0).max(10),
  accuracy: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missed: z.array(z.string()),
});

export type EvaluateSkillOutput = z.infer<typeof EvaluateSkillOutputSchema>;

function parseEvaluateOutput(raw: string): EvaluateSkillOutput | null {
  const content = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const result = EvaluateSkillOutputSchema.safeParse(JSON.parse(content));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function invokeWithValidation(
  llm: BaseChatModel,
  prompt: string,
): Promise<EvaluateSkillOutput> {
  const response = await llm.invoke([new HumanMessage(prompt)]);
  const first = parseEvaluateOutput(String(response.content));
  if (first) {
    return first;
  }

  const retry = await llm.invoke([
    new HumanMessage(
      `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — fields score, accuracy, strengths, weaknesses, and missed are required. Do not include isAcceptable or markdown.`,
    ),
  ]);
  const second = parseEvaluateOutput(String(retry.content));
  if (second) {
    return second;
  }

  throw new Error('evaluate-for-level returned malformed JSON after retry');
}

function buildEvaluatePrompt(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
}): string {
  const skill = loadSkill('evaluate-for-level');
  const goldBlock =
    args.gold.length > 0
      ? args.gold.map((chunk, index) => `### Gold ${index + 1}\n${chunk}`).join('\n\n')
      : 'No expert gold available for this stage. Use general system-design expectations.';

  return `${skill.body}

## Session context
- Problem: ${args.problemTitle}
- Stage: ${args.stage.title} (${args.stage.phase})
- Stage prompt: ${args.stage.prompt}
- Learner level: ${args.profile.level}
- Learner intent: ${args.profile.intent || 'unspecified'}
- Target role: ${args.profile.targetRole ?? 'unspecified'}

## Reference material
${goldBlock}

## Candidate answer
${args.userAnswer}

Respond with ONLY valid JSON matching this schema:
{
  "score": <number 0-10>,
  "accuracy": <number 0-100>,
  "strengths": ["specific strength"],
  "weaknesses": ["specific weakness"],
  "missed": ["missed key point"]
}

Do not include isAcceptable or any fields outside the schema.`;
}

export async function invokeEvaluateForLevel(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
}): Promise<EvaluateSkillOutput> {
  return invokeWithValidation(args.llm, buildEvaluatePrompt(args));
}
