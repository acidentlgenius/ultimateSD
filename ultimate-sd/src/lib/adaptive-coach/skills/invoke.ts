import 'server-only';

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';

import { appendCoachTrace } from '@/lib/adaptive-coach/coach-trace';
import { isCompetencyId } from '@/lib/adaptive-coach/competencies';
import { loadSkill } from '@/lib/adaptive-coach/skills-loader';
import type { CoachStage } from '@/lib/adaptive-coach/tools/stage-rails';
import type { AgendaMove, LearnerProfile, PracticeMode, SessionState } from '@/lib/adaptive-coach/types';
import {
  isFinalProbeRound,
  PROBE_MAX_ROUNDS,
} from '@/lib/probe';

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

export const ProfileReflectNoteSchema = z.object({
  text: z.string().min(1),
  tags: z.array(z.string()),
  problemSlug: z.string().optional(),
});

export const ProfileReflectCompetencyDeltaSchema = z.object({
  skillId: z.string(),
  outcome: z.enum(['earned', 'coached']),
});

export const ProfileReflectSchema = z.object({
  notes: z.array(ProfileReflectNoteSchema).max(3),
  competencyDeltas: z.array(ProfileReflectCompetencyDeltaSchema).max(5).default([]),
});

export type ProfileReflectOutput = z.infer<typeof ProfileReflectSchema>;

export const MockProbeOutputSchema = z.object({
  question: z.string().min(1),
});

export type MockProbeOutput = z.infer<typeof MockProbeOutputSchema>;

export const SessionDebriefOutputSchema = z.object({
  overallScore: z.number().min(1).max(10),
  verdict: z.string().min(1),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  phaseNotes: z.array(
    z.object({
      phase: z.string(),
      comment: z.string(),
    }),
  ),
});

export type SessionDebriefOutput = z.infer<typeof SessionDebriefOutputSchema>;

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

/** Drop missed/weakness items that contradict the answer or wander out of FR scope. */
export function sanitizeEvaluateAgainstAnswer(
  evaluation: EvaluateSkillOutput,
  userAnswer: string,
  stage?: Pick<CoachStage, 'title' | 'phase' | 'phaseKey'>,
): EvaluateSkillOutput {
  const answer = userAnswer.toLowerCase();
  const isFunctionalReqs =
    stage?.phaseKey === 'requirements' ||
    /functional\s+requirements/i.test(stage?.title ?? '');

  const missed = evaluation.missed.filter((item) => {
    if (
      /although|even though|are listed|already (listed|mentioned|included)|candidate'?s answer/i.test(
        item,
      )
    ) {
      return false;
    }
    const quoted = [...item.matchAll(/['"]([^'"]{3,})['"]/g)].map((m) =>
      m[1].toLowerCase(),
    );
    if (quoted.some((q) => answer.includes(q))) return false;
    return true;
  });

  let weaknesses = evaluation.weaknesses;
  if (isFunctionalReqs) {
    weaknesses = weaknesses.filter(
      (item) =>
        !/\b301\b|\b302\b|\b307\b|base62|md5|sha-?1|hash\+?truncat|bloom filter|consistent hashing|cap theorem|db schema|cassandra|dynamodb/i.test(
          item,
        ),
    );
  }

  return { ...evaluation, missed, weaknesses };
}

function parseAgendaOutput(raw: string): AgendaOutput | null {
  return parseJsonWithSchema(raw, AgendaOutputSchema);
}

function parseTeachForwardOutput(raw: string): TeachForwardOutput | null {
  return parseJsonWithSchema(raw, TeachForwardSchema);
}

function parseProfileReflectOutput(raw: string): ProfileReflectOutput | null {
  const parsed = parseJsonWithSchema(raw, ProfileReflectSchema);
  if (!parsed) return null;
  return { ...parsed, competencyDeltas: parsed.competencyDeltas ?? [] };
}

function parseMockProbeOutput(raw: string): MockProbeOutput | null {
  return parseJsonWithSchema(raw, MockProbeOutputSchema);
}

function parseSessionDebriefOutput(raw: string): SessionDebriefOutput | null {
  return parseJsonWithSchema(raw, SessionDebriefOutputSchema);
}

type SkillMessages = {
  skill: string;
  system: string;
  human: string;
};

async function invokeWithValidation(
  llm: BaseChatModel,
  messages: SkillMessages,
): Promise<EvaluateSkillOutput> {
  const response = await llm.invoke([
    new SystemMessage(messages.system),
    new HumanMessage(messages.human),
  ]);
  const first = parseEvaluateOutput(String(response.content));
  if (first) {
    appendCoachTrace({
      at: new Date().toISOString(),
      skill: messages.skill,
      systemPrompt: messages.system,
      humanPrompt: messages.human,
      llmRaw: String(response.content),
      parsed: first,
    });
    return first;
  }

  const retry = await llm.invoke([
    new SystemMessage(messages.system),
    new HumanMessage(
      `${messages.human}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — fields score, accuracy, strengths, weaknesses, and missed are required. Do not include isAcceptable or markdown.`,
    ),
  ]);
  const second = parseEvaluateOutput(String(retry.content));
  if (second) {
    appendCoachTrace({
      at: new Date().toISOString(),
      skill: messages.skill,
      systemPrompt: messages.system,
      humanPrompt: messages.human,
      llmRaw: String(retry.content),
      parsed: second,
      meta: { retry: true },
    });
    return second;
  }

  throw new Error('evaluate-for-level returned malformed JSON after retry');
}

async function invokeAgendaWithValidation(
  llm: BaseChatModel,
  messages: SkillMessages,
): Promise<AgendaOutput> {
  const response = await llm.invoke([
    new SystemMessage(messages.system),
    new HumanMessage(messages.human),
  ]);
  const first = parseAgendaOutput(String(response.content));
  if (first) {
    appendCoachTrace({
      at: new Date().toISOString(),
      skill: messages.skill,
      systemPrompt: messages.system,
      humanPrompt: messages.human,
      llmRaw: String(response.content),
      parsed: first,
    });
    return first;
  }

  const retry = await llm.invoke([
    new SystemMessage(messages.system),
    new HumanMessage(
      `${messages.human}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — field "moves" is required with 1–3 items, each having kind, prompt, and skillFocus. Do not include markdown.`,
    ),
  ]);
  const second = parseAgendaOutput(String(retry.content));
  if (second) {
    appendCoachTrace({
      at: new Date().toISOString(),
      skill: messages.skill,
      systemPrompt: messages.system,
      humanPrompt: messages.human,
      llmRaw: String(retry.content),
      parsed: second,
      meta: { retry: true },
    });
    return second;
  }

  throw new Error('plan-agenda returned malformed JSON after retry');
}

async function invokeTeachForwardWithValidation(
  llm: BaseChatModel,
  messages: SkillMessages,
): Promise<TeachForwardOutput> {
  const response = await llm.invoke([
    new SystemMessage(messages.system),
    new HumanMessage(messages.human),
  ]);
  const first = parseTeachForwardOutput(String(response.content));
  if (first) {
    appendCoachTrace({
      at: new Date().toISOString(),
      skill: messages.skill,
      systemPrompt: messages.system,
      humanPrompt: messages.human,
      llmRaw: String(response.content),
      parsed: first,
    });
    return first;
  }

  const retry = await llm.invoke([
    new SystemMessage(messages.system),
    new HumanMessage(
      `${messages.human}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — fields tip and skillFocus are required. Do not include markdown or dump the full expert architecture.`,
    ),
  ]);
  const second = parseTeachForwardOutput(String(retry.content));
  if (second) {
    appendCoachTrace({
      at: new Date().toISOString(),
      skill: messages.skill,
      systemPrompt: messages.system,
      humanPrompt: messages.human,
      llmRaw: String(retry.content),
      parsed: second,
      meta: { retry: true },
    });
    return second;
  }

  throw new Error('teach-forward returned malformed JSON after retry');
}

async function invokeMockProbeWithValidation(
  llm: BaseChatModel,
  prompt: string,
): Promise<MockProbeOutput> {
  const response = await llm.invoke([new HumanMessage(prompt)]);
  const first = parseMockProbeOutput(String(response.content));
  if (first) {
    return first;
  }

  const retry = await llm.invoke([
    new HumanMessage(
      `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — field "question" is required. Do not include markdown.`,
    ),
  ]);
  const second = parseMockProbeOutput(String(retry.content));
  if (second) {
    return second;
  }

  throw new Error('mock-probe returned malformed JSON after retry');
}

async function invokeSessionDebriefWithValidation(
  llm: BaseChatModel,
  prompt: string,
): Promise<SessionDebriefOutput> {
  const response = await llm.invoke([new HumanMessage(prompt)]);
  const first = parseSessionDebriefOutput(String(response.content));
  if (first) {
    return first;
  }

  const retry = await llm.invoke([
    new HumanMessage(
      `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — fields overallScore, verdict, strengths, improvements, and phaseNotes are required. Do not include markdown.`,
    ),
  ]);
  const second = parseSessionDebriefOutput(String(retry.content));
  if (second) {
    return second;
  }

  throw new Error('session-debrief returned malformed JSON after retry');
}

async function invokeProfileReflectWithValidation(
  llm: BaseChatModel,
  prompt: string,
): Promise<ProfileReflectOutput> {
  const response = await llm.invoke([new HumanMessage(prompt)]);
  const first = parseProfileReflectOutput(String(response.content));
  if (first) {
    return first;
  }

  const retry = await llm.invoke([
    new HumanMessage(
      `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object — field "notes" is required (0–3 items with text and tags), "competencyDeltas" is optional. Do not include markdown.`,
    ),
  ]);
  const second = parseProfileReflectOutput(String(retry.content));
  if (second) {
    return second;
  }

  throw new Error('profile-reflect returned malformed JSON after retry');
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

function buildEvaluateMessages(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
  attemptCount?: number;
  previousFeedback?: {
    weaknesses: string[];
    missed: string[];
  };
}): SkillMessages {
  const skill = loadSkill('evaluate-for-level');
  const attempt = args.attemptCount && args.attemptCount >= 1 ? args.attemptCount : 1;
  const prior =
    args.previousFeedback &&
    (args.previousFeedback.weaknesses.length > 0 || args.previousFeedback.missed.length > 0)
      ? `## Prior attempt feedback (do not repeat the same wording)
- Attempt number: ${attempt}
- Previous weaknesses: ${args.previousFeedback.weaknesses.join('; ') || 'none'}
- Previous missed: ${args.previousFeedback.missed.join('; ') || 'none'}
Focus on what is still missing or newly weak relative to the prior notes.`
      : `## Attempt
- This is attempt ${attempt} on this stage.`;

  return {
    skill: 'evaluate-for-level',
    system: skill.body,
    human: `## Session
- Problem: ${args.problemTitle}
- Stage id: ${args.stage.id}
- Stage: ${args.stage.title} (${args.stage.phase})
- Rail prompt (authoring spine — grade against this scope): ${args.stage.prompt}
${formatProfileContext(args.profile)}

${prior}

## Reference material
${formatGoldBlock(args.gold)}

## Candidate answer
${args.userAnswer}

Grade this submission now.
Rules reminder: missed = absent from the answer; weaknesses = flaws in what they wrote for THIS stage only. Never say something is missing if it appears above. For Functional Requirements, do not grade 301/302, encoding internals, or schema.
`,
  };
}

function buildPlanAgendaMessages(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  gold: string[];
  lastEvaluation?: EvaluateSkillOutput;
}): SkillMessages {
  const skill = loadSkill('plan-agenda');
  const evaluationBlock = args.lastEvaluation
    ? `## Last evaluation (same stage only — use for probes)
- Score: ${args.lastEvaluation.score}/10
- Accuracy: ${args.lastEvaluation.accuracy}%
- Strengths: ${args.lastEvaluation.strengths.join('; ') || 'none noted'}
- Weaknesses: ${args.lastEvaluation.weaknesses.join('; ') || 'none noted'}
- Missed: ${args.lastEvaluation.missed.join('; ') || 'none noted'}
Mode: retry / deepen on THIS stage (${args.stage.title}). Do not invent fake prior conversation. Stay on this stage's deliverable.`
    : `## Last evaluation
None — this is a cold start for ${args.stage.title} (${args.stage.phase}).
Mode: cold start — emit one sharp primary ask for THIS stage only (optional short teach). No continuity from earlier stages. No fake continuity.`;

  return {
    skill: 'plan-agenda',
    system: skill.body,
    human: `## Session
- Problem: ${args.problemTitle}
- Stage id: ${args.stage.id}
- Stage: ${args.stage.title} (${args.stage.phase})
- Rail prompt (spine — improve on it, do not merely rephrase): ${args.stage.prompt}
${formatProfileContext(args.profile)}

## Competency signals
${formatCompetencySummary(args.profile)}

## Memory notes (recent)
${formatMemoryNotesSummary(args.profile)}

${evaluationBlock}

## Reference material (shape prompts; never leak answers)
${formatGoldBlock(args.gold)}

Plan the next agenda moves for this stage now.`,
  };
}

function buildTeachForwardMessages(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
  gateReason: string;
}): SkillMessages {
  const skill = loadSkill('teach-forward');

  return {
    skill: 'teach-forward',
    system: skill.body,
    human: `## Session
- Problem: ${args.problemTitle}
- Stage id: ${args.stage.id}
- Stage: ${args.stage.title} (${args.stage.phase})
- Rail prompt: ${args.stage.prompt}
${formatProfileContext(args.profile)}
- Gate reason: ${args.gateReason}

## Reference material
${formatGoldBlock(args.gold)}

## Candidate answer
${args.userAnswer}

Write the single teach-forward tip now.`,
  };
}

function formatCompetencySummary(profile: LearnerProfile): string {
  if (profile.competencies.length === 0) {
    return 'No competency signals recorded yet.';
  }

  return profile.competencies
    .slice(0, 12)
    .map((c) => `- ${c.skillId}: earned ${c.earned.toFixed(2)}, coached ${c.coached.toFixed(2)}`)
    .join('\n');
}

function formatMemoryNotesSummary(profile: LearnerProfile): string {
  if (profile.memoryNotes.length === 0) {
    return 'No prior memory notes.';
  }

  return profile.memoryNotes
    .slice(0, 5)
    .map((note) => `- ${note.text} [${note.tags.join(', ')}]`)
    .join('\n');
}

function buildProfileReflectPrompt(args: {
  profile: LearnerProfile;
  problemTitle: string;
  problemSlug: string;
  mode: SessionState['mode'];
  sessionState: SessionState;
  finalScore?: number;
}): string {
  const skill = loadSkill('profile-reflect');
  const attemptsSummary =
    Object.keys(args.sessionState.attempts).length > 0
      ? Object.entries(args.sessionState.attempts)
          .map(([stageId, count]) => `- ${stageId}: ${count} attempt(s)`)
          .join('\n')
      : 'No stage attempts recorded.';

  const scoreLine =
    args.finalScore != null ? `- Final score: ${args.finalScore}/10` : '';

  return `${skill.body}

## Session context
- Problem: ${args.problemTitle} (${args.problemSlug})
- Mode: ${args.mode}
- Session status: ${args.sessionState.status}
- Last stage: ${args.sessionState.stageId || 'unknown'}
${scoreLine}
${formatProfileContext(args.profile)}

## Stage attempts
${attemptsSummary}

## Current competencies
${formatCompetencySummary(args.profile)}

## Existing memory notes (recent)
${formatMemoryNotesSummary(args.profile)}

Respond with ONLY valid JSON matching this schema:
{
  "notes": [
    {
      "text": "<concise memory note, ≤200 tokens>",
      "tags": ["competency-tag"],
      "problemSlug": "<optional problem slug>"
    }
  ],
  "competencyDeltas": [
    {
      "skillId": "<competency id>",
      "outcome": "earned" | "coached"
    }
  ]
}

Provide 0–3 notes. Only include competencyDeltas for meaningful session signals. Do not include markdown or fields outside the schema.`;
}

export async function invokeEvaluateForLevel(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
  attemptCount?: number;
  previousFeedback?: {
    weaknesses: string[];
    missed: string[];
  };
}): Promise<EvaluateSkillOutput> {
  const evaluation = await invokeWithValidation(args.llm, buildEvaluateMessages(args));
  return sanitizeEvaluateAgainstAnswer(evaluation, args.userAnswer, args.stage);
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
      buildPlanAgendaMessages(args),
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
  return invokeTeachForwardWithValidation(args.llm, buildTeachForwardMessages(args));
}

function buildMockProbePrompt(args: {
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
  round: number;
  probeHistory: string[];
}): string {
  const skill = loadSkill('mock-probe');
  const framing = isFinalProbeRound(args.round)
    ? 'This is your final follow-up — make it the hardest one.'
    : `This is follow-up ${args.round} of ${PROBE_MAX_ROUNDS}.`;
  const historyBlock =
    args.probeHistory.length > 0
      ? args.probeHistory.map((line, index) => `${index + 1}. ${line}`).join('\n')
      : '(none yet — open the probe)';

  return `${skill.body}

## Session context
- Problem: ${args.problemTitle}
- Stage: ${args.stage.title} (${args.stage.phase})
- Stage prompt: ${args.stage.prompt}
${formatProfileContext(args.profile)}
- ${framing}

## Reference material
${formatGoldBlock(args.gold)}

## Candidate's accepted answer
${args.userAnswer}

## Prior probe exchanges
${historyBlock}

Respond with ONLY valid JSON matching this schema:
{
  "question": "<one adversarial follow-up, under 60 words>"
}

Do not include markdown or fields outside the schema.`;
}

function buildSessionDebriefPrompt(args: {
  profile: LearnerProfile;
  problemTitle: string;
  problemSlug: string;
  mode: PracticeMode;
  variant?: 'lite' | 'full';
  answers: Array<{
    phase: string;
    title: string;
    answer: string;
    passed: boolean;
  }>;
}): string {
  const skill = loadSkill('session-debrief');
  const transcript = args.answers
    .map(
      (a) =>
        `### ${a.phase} — ${a.title} (${a.passed ? 'passed evaluation' : 'not passed'})\n${a.answer}`,
    )
    .join('\n\n');

  return `${skill.body}

## Session context
- Problem: ${args.problemTitle} (${args.problemSlug})
- Mode: ${args.mode}
- Variant: ${args.variant ?? 'lite'}
${formatProfileContext(args.profile)}

## Candidate transcript
${transcript}

Respond with ONLY valid JSON matching this schema:
{
  "overallScore": <number 1-10>,
  "verdict": "<Strong Hire | Hire | Lean Hire | No Hire>",
  "strengths": ["specific strength"],
  "improvements": ["specific improvement"],
  "phaseNotes": [{ "phase": "<phase name>", "comment": "<one-sentence note>" }]
}

Do not include markdown or fields outside the schema.`;
}

export async function invokeMockProbe(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
  round: number;
  probeHistory?: string[];
}): Promise<MockProbeOutput> {
  return invokeMockProbeWithValidation(
    args.llm,
    buildMockProbePrompt({ ...args, probeHistory: args.probeHistory ?? [] }),
  );
}

export async function invokeSessionDebrief(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  problemSlug: string;
  mode: PracticeMode;
  answers: Array<{
    phase: string;
    title: string;
    answer: string;
    passed: boolean;
  }>;
  variant?: 'lite' | 'full';
}): Promise<SessionDebriefOutput | null> {
  try {
    return await invokeSessionDebriefWithValidation(
      args.llm,
      buildSessionDebriefPrompt(args),
    );
  } catch {
    return null;
  }
}

export async function invokeProfileReflect(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  problemSlug: string;
  mode: SessionState['mode'];
  sessionState: SessionState;
  finalScore?: number;
}): Promise<ProfileReflectOutput> {
  const output = await invokeProfileReflectWithValidation(
    args.llm,
    buildProfileReflectPrompt(args),
  );

  return {
    notes: output.notes,
    competencyDeltas: output.competencyDeltas.filter((delta) =>
      isCompetencyId(delta.skillId),
    ),
  };
}
