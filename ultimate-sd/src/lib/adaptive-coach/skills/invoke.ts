import 'server-only';

import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';

import { loadSkill } from '@/lib/adaptive-coach/skills-loader';
import type { CoachStage } from '@/lib/adaptive-coach/tools/stage-rails';
import type { AgendaMove, LearnerProfile } from '@/lib/adaptive-coach/types';

export const EvaluateSkillOutputSchema = z.object({
  score: z.number().min(0).max(10),
  accuracy: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missed: z.array(z.string()),
});

export type EvaluateSkillOutput = z.infer<typeof EvaluateSkillOutputSchema>;

export const AgendaOutputSchema = z.object({
  moves: z
    .array(
      z.object({
        kind: z.enum(['ask', 'probe', 'teach', 'skip', 'advance']),
        prompt: z.string().min(1),
        skillFocus: z.array(z.string()),
      }),
    )
    .min(1)
    .max(3),
});

export type AgendaOutput = z.infer<typeof AgendaOutputSchema>;

export const TeachForwardSchema = z.object({
  tip: z.string().min(1),
  skillFocus: z.array(z.string()),
});

export type TeachForwardOutput = z.infer<typeof TeachForwardSchema>;

function stripMarkdownFences(raw: string): string {
  return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

function parseJsonWithSchema<T>(
  raw: string,
  schema: z.ZodType<T>,
): T | null {
  const content = stripMarkdownFences(raw);

  try {
    const result = schema.safeParse(JSON.parse(content));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function parseEvaluateOutput(raw: string): EvaluateSkillOutput | null {
  return parseJsonWithSchema(raw, EvaluateSkillOutputSchema);
}

function parseAgendaOutput(raw: string): AgendaOutput | null {
  return parseJsonWithSchema(raw, AgendaOutputSchema);
}

function parseTeachForwardOutput(raw: string): TeachForwardOutput | null {
  return parseJsonWithSchema(raw, TeachForwardSchema);
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

async function invokeAgendaWithValidation(
  llm: BaseChatModel,
  prompt: string,
): Promise<AgendaOutput> {
  const response = await llm.invoke([new HumanMessage(prompt)]);
  const first = parseAgendaOutput(String(response.content));
  if (first) {
    return first;
  }

  const retry = await llm.invoke([
    new HumanMessage(
      `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — field "moves" is required with 1–3 items, each having kind, prompt, and skillFocus. Do not include markdown.`,
    ),
  ]);
  const second = parseAgendaOutput(String(retry.content));
  if (second) {
    return second;
  }

  throw new Error('plan-agenda returned malformed JSON after retry');
}

async function invokeTeachForwardWithValidation(
  llm: BaseChatModel,
  prompt: string,
): Promise<TeachForwardOutput> {
  const response = await llm.invoke([new HumanMessage(prompt)]);
  const first = parseTeachForwardOutput(String(response.content));
  if (first) {
    return first;
  }

  const retry = await llm.invoke([
    new HumanMessage(
      `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — fields tip and skillFocus are required. Do not include markdown or dump the full expert architecture.`,
    ),
  ]);
  const second = parseTeachForwardOutput(String(retry.content));
  if (second) {
    return second;
  }

  throw new Error('teach-forward returned malformed JSON after retry');
}

function formatGoldBlock(gold: string[]): string {
  return gold.length > 0
    ? gold.map((chunk, index) => `### Gold ${index + 1}\n${chunk}`).join('\n\n')
    : 'No expert gold available for this stage. Use general system-design expectations.';
}

function formatProfileContext(profile: LearnerProfile): string {
  return `- Learner level: ${profile.level}
- Learner intent: ${profile.intent || 'unspecified'}
- Target role: ${profile.targetRole ?? 'unspecified'}`;
}

export function fallbackAgenda(stage: CoachStage): AgendaMove[] {
  return [
    {
      id: `${stage.id}-rail-0`,
      kind: 'ask',
      prompt: stage.prompt,
      skillFocus: [],
      source: 'rail',
    },
  ];
}

function toAgendaMoves(stage: CoachStage, output: AgendaOutput): AgendaMove[] {
  return output.moves.map((move, index) => ({
    id: `${stage.id}-plan-${index}`,
    kind: move.kind,
    prompt: move.prompt,
    skillFocus: move.skillFocus,
    source: 'planner' as const,
  }));
}

function buildEvaluatePrompt(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
}): string {
  const skill = loadSkill('evaluate-for-level');

  return `${skill.body}

## Session context
- Problem: ${args.problemTitle}
- Stage: ${args.stage.title} (${args.stage.phase})
- Stage prompt: ${args.stage.prompt}
${formatProfileContext(args.profile)}

## Reference material
${formatGoldBlock(args.gold)}

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

function buildPlanAgendaPrompt(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  gold: string[];
  lastEvaluation?: EvaluateSkillOutput;
}): string {
  const skill = loadSkill('plan-agenda');
  const evaluationBlock = args.lastEvaluation
    ? `## Last evaluation
- Score: ${args.lastEvaluation.score}/10
- Accuracy: ${args.lastEvaluation.accuracy}%
- Weaknesses: ${args.lastEvaluation.weaknesses.join('; ') || 'none noted'}
- Missed: ${args.lastEvaluation.missed.join('; ') || 'none noted'}`
    : '## Last evaluation\nNo prior evaluation for this stage.';

  return `${skill.body}

## Session context
- Problem: ${args.problemTitle}
- Stage: ${args.stage.title} (${args.stage.phase})
- Stage prompt: ${args.stage.prompt}
${formatProfileContext(args.profile)}

${evaluationBlock}

## Reference material
${formatGoldBlock(args.gold)}

Respond with ONLY valid JSON matching this schema:
{
  "moves": [
    {
      "kind": "ask" | "probe" | "teach" | "skip" | "advance",
      "prompt": "<non-empty coaching prompt>",
      "skillFocus": ["competency-tag"]
    }
  ]
}

Provide 1–3 moves. Do not include markdown or fields outside the schema.`;
}

function buildTeachForwardPrompt(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
  gateReason: string;
}): string {
  const skill = loadSkill('teach-forward');

  return `${skill.body}

## Session context
- Problem: ${args.problemTitle}
- Stage: ${args.stage.title} (${args.stage.phase})
- Stage prompt: ${args.stage.prompt}
${formatProfileContext(args.profile)}
- Gate reason: ${args.gateReason}

## Reference material
${formatGoldBlock(args.gold)}

## Candidate answer
${args.userAnswer}

Respond with ONLY valid JSON matching this schema:
{
  "tip": "<one focused coaching tip>",
  "skillFocus": ["competency-tag"]
}

Do not dump the full expert architecture. Do not include markdown or fields outside the schema.`;
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

export async function invokePlanAgenda(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  gold: string[];
  lastEvaluation?: EvaluateSkillOutput;
}): Promise<AgendaMove[]> {
  try {
    const output = await invokeAgendaWithValidation(
      args.llm,
      buildPlanAgendaPrompt(args),
    );
    return toAgendaMoves(args.stage, output);
  } catch {
    return fallbackAgenda(args.stage);
  }
}

export async function invokeTeachForward(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
  gateReason: string;
}): Promise<TeachForwardOutput> {
  return invokeTeachForwardWithValidation(args.llm, buildTeachForwardPrompt(args));
}
