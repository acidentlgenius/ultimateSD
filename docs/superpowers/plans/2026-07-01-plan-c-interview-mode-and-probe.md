# Plan C: Interview Mode + AI Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship F2 (timed interview mode, flag `interviewMode`) and F3 (AI probe interviewer, flag `aiProbe`) dark, as a session-config mode over the existing `StepByStepChat`/`PracticeUI` practice flow and a promoted `/api/ai/chat` route respectively.

**Architecture:** F2 adds a pure `interview-mode.ts` module (variant/duration/step selection + session status reducer), a flag-gated `/api/interview/summary` route feeding a new `getInterviewSummary()` in `langgraph.ts`, and an interview session layer inside `PracticeUI` (local-mode `TimerWidget` countdown, HelpAssistant hidden, auto-end → AI debrief → existing `exportPracticeSession` PDF). F3 adds a pure `probe.ts` module (persona prompt + round rules), `getProbeResponse()` in `langgraph.ts`, a `mode: 'probe'` branch in the existing `/api/ai/chat` route, and an opt-in `ProbePanel` shown after a passing step evaluation. Both features are invisible and their APIs 403 while flags are dark.

**Tech Stack:** Next.js 15 App Router, Prisma/Postgres, NextAuth (`@/auth`), LangChain (`@/lib/langgraph`, `@/lib/user-llm`), Vitest (jsdom + @testing-library/react), Playwright.

**Spec:** `docs/superpowers/specs/2026-07-01-flag-gated-feature-launch-design.md` (sections F2, F3, entitlement table, testing). Foundation contract: `docs/superpowers/plans/2026-07-01-plan-a-flag-engine-and-lifetime.md`.

## Global Constraints

- App root is `ultimate-sd/` — all paths below are relative to it.
- Plan A is the foundation — CONSUME, never re-implement: `canAccessFeature(userId: string | null, feature: FeatureKey): Promise<boolean>` from `@/lib/feature-flags-server`; `FeatureKey` includes `'interviewMode'` and `'aiProbe'` (from `@/lib/plans`).
- Both features ship dark (`enabledPlans: []`). Dark = invisible in UI **and** every API route / server entry returns 403 to direct calls.
- Every API route and server-rendered entry point for these features checks `canAccessFeature()` server-side — client-side checks alone are insufficient.
- Interview durations: lite = 45 min (`2700` seconds), full = 60 min (`3600` seconds).
- Lite phase set = the existing `INTERVIEW_LITE_PHASE_STEPS` (Clarify/Requirements → HLD diagram → Trade-offs) from `src/lib/interview-lite-steps.ts` — reuse, do not duplicate.
- Probe: 2–3 adversarial follow-ups (`PROBE_MIN_ROUNDS = 2`, `PROBE_MAX_ROUNDS = 3`); served through the existing `/api/ai/chat` route; AI funding via `getUserLLM()`/`canUseAI()` exactly like `/api/ai/evaluate` — the FLAG decides visibility, `canUseAI` decides funding source (funded = AI plan credits; BYOK elsewhere). No new funding logic.
- No Socratic help (`HelpAssistant`) during an interview session.
- Run unit tests with `npx vitest run <path>`, e2e with `npx playwright test <path>`, types with `npx tsc --noEmit`.
- Do not modify `src/lib/interview-lite-steps.ts` semantics — `getPracticeSteps` behavior for normal practice must not change.

---

### Task 1: Interview mode core logic

**Files:**
- Create: `src/lib/interview-mode.ts`
- Test: `src/lib/__tests__/interview-mode.test.ts`

**Interfaces:**
- Consumes: `getPracticeSteps`, `INTERVIEW_LITE_PHASE_STEPS` from `@/lib/interview-lite-steps`; `StepData`, `SystemDesignProblem` from `@/types`.
- Produces (used by Tasks 4–6, 10–11):
  - `type InterviewVariant = 'lite' | 'full'`
  - `INTERVIEW_DURATION_SECONDS: Record<InterviewVariant, number>` (`{ lite: 2700, full: 3600 }`)
  - `interface InterviewConfig { variant: InterviewVariant; durationSeconds: number }`
  - `parseInterviewParam(value: string | string[] | undefined): InterviewVariant | null`
  - `getInterviewConfig(variant: InterviewVariant): InterviewConfig`
  - `getInterviewSteps(slug: string, difficulty: SystemDesignProblem['difficulty'], variant: InterviewVariant): Record<string, StepData[]>`
  - `type InterviewStatus = 'running' | 'generating-summary' | 'complete' | 'summary-error'`
  - `type InterviewEvent = 'TIME_EXPIRED' | 'FINISH_EARLY' | 'SUMMARY_READY' | 'SUMMARY_FAILED' | 'RETRY_SUMMARY'`
  - `interviewStatusReducer(status: InterviewStatus, event: InterviewEvent): InterviewStatus`
  - `interface InterviewAnswer { stepId: string; phase: string; title: string; answer: string; passed: boolean }`
  - `buildInterviewAnswers(phaseSteps: Record<string, StepData[]>, savedStepData: Map<string, InterviewStepDataLike>): InterviewAnswer[]`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/interview-mode.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  INTERVIEW_DURATION_SECONDS,
  buildInterviewAnswers,
  getInterviewConfig,
  getInterviewSteps,
  interviewStatusReducer,
  parseInterviewParam,
  type InterviewStatus,
} from '@/lib/interview-mode';
import { INTERVIEW_LITE_PHASE_STEPS } from '@/lib/interview-lite-steps';
import { PROBLEM_STEPS } from '@/lib/problem-steps';

describe('interview durations and param parsing', () => {
  it('maps lite to 45 minutes and full to 60 minutes', () => {
    expect(INTERVIEW_DURATION_SECONDS.lite).toBe(2700);
    expect(INTERVIEW_DURATION_SECONDS.full).toBe(3600);
    expect(getInterviewConfig('lite')).toEqual({ variant: 'lite', durationSeconds: 2700 });
    expect(getInterviewConfig('full')).toEqual({ variant: 'full', durationSeconds: 3600 });
  });

  it('parses only exact lite/full values', () => {
    expect(parseInterviewParam('lite')).toBe('lite');
    expect(parseInterviewParam('full')).toBe('full');
    expect(parseInterviewParam('LITE')).toBeNull();
    expect(parseInterviewParam(undefined)).toBeNull();
    expect(parseInterviewParam(['lite'])).toBeNull();
    expect(parseInterviewParam('hack')).toBeNull();
  });
});

describe('getInterviewSteps', () => {
  it('lite variant uses the lite phase set even when the problem has custom steps', () => {
    expect(getInterviewSteps('design-tinyurl', 'Easy', 'lite')).toBe(INTERVIEW_LITE_PHASE_STEPS);
  });

  it('full variant uses the normal practice step selection', () => {
    expect(getInterviewSteps('design-tinyurl', 'Easy', 'full')).toBe(
      PROBLEM_STEPS['design-tinyurl']
    );
  });
});

describe('interviewStatusReducer', () => {
  it('running ends on expiry or early finish', () => {
    expect(interviewStatusReducer('running', 'TIME_EXPIRED')).toBe('generating-summary');
    expect(interviewStatusReducer('running', 'FINISH_EARLY')).toBe('generating-summary');
  });

  it('summary outcome transitions', () => {
    expect(interviewStatusReducer('generating-summary', 'SUMMARY_READY')).toBe('complete');
    expect(interviewStatusReducer('generating-summary', 'SUMMARY_FAILED')).toBe('summary-error');
    expect(interviewStatusReducer('summary-error', 'RETRY_SUMMARY')).toBe('generating-summary');
  });

  it('ignores invalid transitions', () => {
    const cases: Array<[InterviewStatus, Parameters<typeof interviewStatusReducer>[1]]> = [
      ['running', 'SUMMARY_READY'],
      ['complete', 'TIME_EXPIRED'],
      ['generating-summary', 'FINISH_EARLY'],
    ];
    for (const [status, event] of cases) {
      expect(interviewStatusReducer(status, event)).toBe(status);
    }
  });
});

describe('buildInterviewAnswers', () => {
  it('flattens answered and unanswered steps in order', () => {
    const saved = new Map([
      [
        'requirements-0',
        { listItems: ['Shorten URL', 'Redirect'], textInput: '', schemaData: [], completed: true },
      ],
    ]);
    const answers = buildInterviewAnswers(INTERVIEW_LITE_PHASE_STEPS, saved);
    expect(answers).toHaveLength(5);
    expect(answers[0]).toEqual({
      stepId: 'requirements-0',
      phase: 'Requirements',
      title: 'Functional Requirements',
      answer: 'Shorten URL\nRedirect',
      passed: true,
    });
    expect(answers[1].answer).toBe('(not attempted — ran out of time)');
    expect(answers[1].passed).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/interview-mode.test.ts`
Expected: FAIL — module `@/lib/interview-mode` not found.

- [ ] **Step 3: Implement `src/lib/interview-mode.ts`**

```ts
import { getPracticeSteps, INTERVIEW_LITE_PHASE_STEPS } from '@/lib/interview-lite-steps';
import type { StepData, SystemDesignProblem } from '@/types';

export type InterviewVariant = 'lite' | 'full';

export const INTERVIEW_DURATION_SECONDS: Record<InterviewVariant, number> = {
  lite: 2700, // 45 min
  full: 3600, // 60 min
};

export interface InterviewConfig {
  variant: InterviewVariant;
  durationSeconds: number;
}

export function parseInterviewParam(
  value: string | string[] | undefined
): InterviewVariant | null {
  if (value === 'lite' || value === 'full') {
    return value;
  }
  return null;
}

export function getInterviewConfig(variant: InterviewVariant): InterviewConfig {
  return { variant, durationSeconds: INTERVIEW_DURATION_SECONDS[variant] };
}

/**
 * Interview step selection: lite always uses the compact Clarify → HLD →
 * Trade-offs set; full uses whatever normal practice would use for the problem.
 */
export function getInterviewSteps(
  slug: string,
  difficulty: SystemDesignProblem['difficulty'],
  variant: InterviewVariant
): Record<string, StepData[]> {
  if (variant === 'lite') {
    return INTERVIEW_LITE_PHASE_STEPS;
  }
  return getPracticeSteps(slug, difficulty).steps;
}

export type InterviewStatus = 'running' | 'generating-summary' | 'complete' | 'summary-error';

export type InterviewEvent =
  | 'TIME_EXPIRED'
  | 'FINISH_EARLY'
  | 'SUMMARY_READY'
  | 'SUMMARY_FAILED'
  | 'RETRY_SUMMARY';

/** Pure interview session state machine (timer expiry / early finish / debrief). */
export function interviewStatusReducer(
  status: InterviewStatus,
  event: InterviewEvent
): InterviewStatus {
  switch (status) {
    case 'running':
      if (event === 'TIME_EXPIRED' || event === 'FINISH_EARLY') {
        return 'generating-summary';
      }
      return status;
    case 'generating-summary':
      if (event === 'SUMMARY_READY') return 'complete';
      if (event === 'SUMMARY_FAILED') return 'summary-error';
      return status;
    case 'summary-error':
      if (event === 'RETRY_SUMMARY') return 'generating-summary';
      return status;
    case 'complete':
      return status;
  }
}

export interface InterviewAnswer {
  stepId: string;
  phase: string;
  title: string;
  answer: string;
  passed: boolean;
}

/** Shape of StepByStepChat's per-step saved data that we depend on. */
export interface InterviewStepDataLike {
  listItems: string[];
  textInput: string;
  schemaData: unknown[];
  completed: boolean;
}

export function buildInterviewAnswers(
  phaseSteps: Record<string, StepData[]>,
  savedStepData: Map<string, InterviewStepDataLike>
): InterviewAnswer[] {
  const answers: InterviewAnswer[] = [];
  for (const [phaseKey, steps] of Object.entries(phaseSteps)) {
    steps.forEach((step, index) => {
      const stepId = `${phaseKey}-${index}`;
      const data = savedStepData.get(stepId);
      let answer = '';
      if (data) {
        if (step.inputType === 'list') {
          answer = data.listItems.join('\n');
        } else if (step.inputType === 'schema') {
          answer = data.schemaData.length > 0 ? JSON.stringify(data.schemaData) : '';
        } else {
          answer = data.textInput;
        }
      }
      answers.push({
        stepId,
        phase: step.phase,
        title: step.title,
        answer: answer.trim() || '(not attempted — ran out of time)',
        passed: data?.completed ?? false,
      });
    });
  }
  return answers;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/interview-mode.test.ts` → PASS. Then `npx vitest run` → no regressions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/interview-mode.ts src/lib/__tests__/interview-mode.test.ts
git commit -m "feat(interview): pure interview-mode config, step selection, and session reducer"
```

---

### Task 2: TimerWidget fires onComplete in local mode

The interview countdown uses `TimerWidget` in local (localStorage) mode — no server `startedAt`. Today `onComplete` only fires in server mode (`TimerWidget.tsx:118-123` guards on `startedAt`), so auto-end on expiry would never trigger.

**Files:**
- Modify: `src/components/TimerWidget.tsx:118-123`
- Test: `src/components/__tests__/TimerWidget.test.tsx`

**Interfaces:**
- Consumes: existing `TimerWidgetProps`.
- Produces: `onComplete` is invoked exactly once when `timeLeft` hits 0 while active, in both server and local modes. No other behavior changes.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/TimerWidget.test.tsx`:

```tsx
import { render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerWidget } from '@/components/TimerWidget';

describe('TimerWidget local-mode expiry', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onComplete when a local problemId countdown reaches zero', () => {
    const onComplete = vi.fn();
    render(
      <TimerWidget
        initialTimeSeconds={2}
        problemId="interview-lite-p1"
        onComplete={onComplete}
      />
    );

    // Local mode auto-starts when problemId is present; tick past zero.
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/TimerWidget.test.tsx`
Expected: FAIL — `onComplete` never called (0 times) because the expiry effect requires `startedAt`.

- [ ] **Step 3: Implement**

In `src/components/TimerWidget.tsx`, replace the expiry effect (lines 118–123):

```tsx
    useEffect(() => {
        if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (onComplete) onComplete();
        }
    }, [timeLeft, isActive, onComplete]);
```

(Only change: drop the `startedAt` condition from the guard and dependency array.)

- [ ] **Step 4: Run tests to verify pass + no regressions**

Run: `npx vitest run src/components/__tests__/TimerWidget.test.tsx` → PASS. Then `npx vitest run` → all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/TimerWidget.tsx src/components/__tests__/TimerWidget.test.tsx
git commit -m "fix(timer): fire onComplete on expiry in local (client-only) mode"
```

---

### Task 3: Interview debrief generator in langgraph.ts

**Files:**
- Modify: `src/lib/langgraph.ts` (append after `getFeedback`, ends at line 85)
- Test: `src/lib/__tests__/langgraph-interview-summary.test.ts`

**Interfaces:**
- Consumes: `SystemDesignProblem` from `@/types`, `BaseChatModel`, existing `getDefaultLLM()` (module-private, already in file), `HumanMessage`.
- Produces (used by Task 4):
  - `interface InterviewSummaryInput { phase: string; title: string; answer: string; passed: boolean }`
  - `interface InterviewSummary { overallScore: number; verdict: string; strengths: string[]; improvements: string[]; phaseNotes: { phase: string; comment: string }[] }`
  - `getInterviewSummary(problem: SystemDesignProblem, answers: InterviewSummaryInput[], llmOverride?: BaseChatModel | null): Promise<InterviewSummary | null>` — `null` when no LLM or unparseable output.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/langgraph-interview-summary.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getInterviewSummary } from '@/lib/langgraph';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: 'p1',
  title: 'Design TinyURL',
  slug: 'design-tinyurl',
  description: 'URL shortening service',
  difficulty: 'Easy',
  category: 'Web',
  companies: [],
  requirements: [],
};

const answers = [
  { phase: 'Requirements', title: 'Functional Requirements', answer: 'Shorten URL\nRedirect', passed: true },
  { phase: 'HLD', title: 'High-Level Architecture', answer: '(not attempted — ran out of time)', passed: false },
];

function fakeLlm(content: string): BaseChatModel {
  return { invoke: vi.fn().mockResolvedValue({ content }) } as unknown as BaseChatModel;
}

const VALID_JSON = JSON.stringify({
  overallScore: 7,
  verdict: 'Lean Hire',
  strengths: ['Clear requirements'],
  improvements: ['Manage time to reach HLD'],
  phaseNotes: [{ phase: 'Requirements', comment: 'Solid start.' }],
});

describe('getInterviewSummary', () => {
  it('parses a valid JSON debrief', async () => {
    const summary = await getInterviewSummary(problem, answers, fakeLlm(VALID_JSON));
    expect(summary).toEqual(JSON.parse(VALID_JSON));
  });

  it('strips markdown fences before parsing', async () => {
    const fenced = '```json\n' + VALID_JSON + '\n```';
    const summary = await getInterviewSummary(problem, answers, fakeLlm(fenced));
    expect(summary?.verdict).toBe('Lean Hire');
  });

  it('includes every answer and its pass status in the prompt', async () => {
    const llm = fakeLlm(VALID_JSON);
    await getInterviewSummary(problem, answers, llm);
    const invoke = (llm as unknown as { invoke: ReturnType<typeof vi.fn> }).invoke;
    const promptText = String(invoke.mock.calls[0][0][0].content);
    expect(promptText).toContain('Functional Requirements');
    expect(promptText).toContain('not attempted');
    expect(promptText).toContain('Design TinyURL');
  });

  it('returns null on unparseable output', async () => {
    expect(await getInterviewSummary(problem, answers, fakeLlm('sorry, no JSON'))).toBeNull();
  });

  it('returns null when no llm is available', async () => {
    expect(await getInterviewSummary(problem, answers, null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/langgraph-interview-summary.test.ts`
Expected: FAIL — `getInterviewSummary` is not exported.

Note: the "no llm available" test requires `getDefaultLLM()` to return null; the existing implementation returns null unless `process.env.GOOGLE_API_KEY` is set. Guard the test with `vi.stubEnv('GOOGLE_API_KEY', '')` in a `beforeEach` if the local env sets that key — but the call passes `null` explicitly, so implement `getInterviewSummary` to treat an explicit `null` override as "no LLM" (see Step 3, `llmOverride === null` check).

- [ ] **Step 3: Implement in `src/lib/langgraph.ts`**

Append at the end of the file:

```ts
export interface InterviewSummaryInput {
  phase: string;
  title: string;
  answer: string;
  passed: boolean;
}

export interface InterviewSummary {
  overallScore: number; // 1-10
  verdict: string; // 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire'
  strengths: string[];
  improvements: string[];
  phaseNotes: { phase: string; comment: string }[];
}

/** End-of-interview hiring-committee-style debrief. Returns null when unavailable. */
export async function getInterviewSummary(
  problem: SystemDesignProblem,
  answers: InterviewSummaryInput[],
  llmOverride?: BaseChatModel | null
): Promise<InterviewSummary | null> {
  const llm = llmOverride !== undefined ? llmOverride : getDefaultLLM();
  if (!llm) {
    return null;
  }

  const transcript = answers
    .map(
      (a) =>
        `### ${a.phase} — ${a.title} (${a.passed ? 'passed evaluation' : 'not passed'})\n${a.answer}`
    )
    .join('\n\n');

  const prompt = `You are a FAANG system design interviewer (ex-Meta) writing the post-interview debrief for a TIMED mock interview.
Problem: "${problem.title}" — ${problem.description}

Candidate transcript, step by step:
${transcript}

Write an honest hiring-committee-style summary. Weigh unattempted steps as time-management signal, not zero knowledge.
Respond with VALID JSON only (no markdown, no extra text):
{
  "overallScore": <number 1-10>,
  "verdict": "<Strong Hire | Hire | Lean Hire | No Hire>",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "phaseNotes": [{ "phase": "<phase name>", "comment": "<one-sentence note>" }]
}`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = (response.content as string)
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(content);
    if (
      typeof parsed.overallScore !== 'number' ||
      typeof parsed.verdict !== 'string' ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.improvements) ||
      !Array.isArray(parsed.phaseNotes)
    ) {
      return null;
    }
    return parsed as InterviewSummary;
  } catch (error) {
    console.error('getInterviewSummary error:', error);
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/langgraph-interview-summary.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/langgraph.ts src/lib/__tests__/langgraph-interview-summary.test.ts
git commit -m "feat(interview): AI hiring-committee debrief generator"
```

---

### Task 4: Flag-gated /api/interview/summary route

**Files:**
- Create: `src/app/api/interview/summary/route.ts`
- Test: `src/app/api/interview/__tests__/summary.test.ts`

**Interfaces:**
- Consumes: `canAccessFeature` (Plan A), `getUserLLM`/`AIAccessError` from `@/lib/user-llm`, `getInterviewSummary` (Task 3), `PROBLEMS` from `@/lib/problems`.
- Produces: `POST /api/interview/summary` with body `{ slug: string; answers: InterviewSummaryInput[] }`. Responses: `401` unauthenticated, `403 { error: 'Not available' }` when `interviewMode` flag denies, `403 { error: <AIAccessError message> }` when AI funding denied, `404` unknown slug, `400` empty answers, `500` generation failure, `200 { summary: InterviewSummary }`.

- [ ] **Step 1: Write the failing test**

Create `src/app/api/interview/__tests__/summary.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));
vi.mock('@/lib/user-llm', () => {
  class AIAccessError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AIAccessError';
    }
  }
  return { AIAccessError, getUserLLM: vi.fn() };
});
vi.mock('@/lib/langgraph', () => ({ getInterviewSummary: vi.fn() }));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { AIAccessError, getUserLLM } from '@/lib/user-llm';
import { getInterviewSummary } from '@/lib/langgraph';
import { POST } from '@/app/api/interview/summary/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);
const mockedSummary = vi.mocked(getInterviewSummary);

const VALID_BODY = {
  slug: 'design-tinyurl',
  answers: [
    { phase: 'Requirements', title: 'Functional Requirements', answer: 'Shorten URL', passed: true },
  ],
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/interview/summary', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
  mockedFlag.mockResolvedValue(true);
});

describe('POST /api/interview/summary', () => {
  it('rejects unauthenticated users with 401', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 when the interviewMode flag denies (dark launch)', async () => {
    mockedFlag.mockResolvedValue(false);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mockedFlag).toHaveBeenCalledWith('u1', 'interviewMode');
    expect(mockedLLM).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown problem slug', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, slug: 'design-nothing' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 when there are no answers', async () => {
    const res = await POST(makeRequest({ slug: 'design-tinyurl', answers: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 403 with the message when AI funding is denied', async () => {
    mockedLLM.mockRejectedValue(new AIAccessError('Add your preferred API key in Settings.'));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Add your preferred API key in Settings.');
  });

  it('returns the summary on success', async () => {
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedSummary.mockResolvedValue({
      overallScore: 8,
      verdict: 'Hire',
      strengths: ['s'],
      improvements: ['i'],
      phaseNotes: [],
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect((await res.json()).summary.verdict).toBe('Hire');
  });

  it('returns 500 when the generator yields null', async () => {
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedSummary.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/interview/__tests__/summary.test.ts`
Expected: FAIL — module `@/app/api/interview/summary/route` not found.

- [ ] **Step 3: Implement `src/app/api/interview/summary/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PROBLEMS } from '@/lib/problems';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';
import { getInterviewSummary, type InterviewSummaryInput } from '@/lib/langgraph';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await canAccessFeature(session.user.id, 'interviewMode'))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const { slug, answers } = await req.json();

  const problemMetadata = PROBLEMS.find((p) => p.slug === slug);
  if (!problemMetadata) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'No answers to summarize' }, { status: 400 });
  }

  try {
    const { llm } = await getUserLLM(session.user.id, {
      temperature: 0.3,
      problemSlug: slug,
    });
    const summary = await getInterviewSummary(
      problemMetadata,
      answers as InterviewSummaryInput[],
      llm
    );
    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof AIAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Interview summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/interview/__tests__/summary.test.ts` → PASS. `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/interview/ 
git commit -m "feat(interview): flag-gated end-of-session summary API"
```

---

### Task 5: Practice page wiring + Start Interview entry

**Files:**
- Create: `src/components/StartInterviewDialog.tsx`
- Modify: `src/app/practice/[slug]/page.tsx:26-74` (the `PracticePage` function)
- Modify: `src/components/PracticeUI.tsx:41-65` (prop plumbing) and `:342-370` (sidebar footer)

**Interfaces:**
- Consumes: `canAccessFeature` (Plan A); `parseInterviewParam`, `getInterviewConfig`, `getInterviewSteps`, `InterviewConfig` (Task 1).
- Produces:
  - `PracticeUI` accepts `interviewConfig?: InterviewConfig | null` and `interviewAllowed?: boolean` props (Task 6 builds the in-session behavior on `interviewConfig`).
  - `StartInterviewDialog({ slug }: { slug: string })` — "Start Interview" button opening a 45-min lite / 60-min full chooser that navigates to `/practice/<slug>?interview=<variant>`.
  - Server rule: `?interview=` is honored only when `canAccessFeature(userId, 'interviewMode')` is true; otherwise the page **redirects to the plain practice URL** (dark = invisible; the F2 API 403 lives in Task 4).

- [ ] **Step 1: Create `src/components/StartInterviewDialog.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function StartInterviewDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start hover:bg-primary/10 hover:text-primary"
        onClick={() => setOpen(true)}
      >
        <Timer className="h-3.5 w-3.5 mr-2" />
        Start Interview
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a timed interview</DialogTitle>
            <DialogDescription>
              A strict countdown, no help assistant, and an AI hiring-committee debrief with
              PDF export at the end. Your current practice draft stays saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button className="w-full" onClick={() => router.push(`/practice/${slug}?interview=lite`)}>
              45-min lite — Clarify → HLD → Trade-offs
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/practice/${slug}?interview=full`)}
            >
              60-min full — complete step set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Wire the server page**

In `src/app/practice/[slug]/page.tsx`, add imports:

```ts
import { canAccessFeature } from '@/lib/feature-flags-server';
import {
  getInterviewConfig,
  getInterviewSteps,
  parseInterviewParam,
} from '@/lib/interview-mode';
```

Change the `PracticePage` signature and body (currently lines 26–74):

```ts
export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ interview?: string }>;
}) {
  const { slug } = await params;
  const { interview } = await searchParams;
  // ... existing problemMetadata lookup, auth redirect, canAccessProblem check UNCHANGED ...

  const interviewAllowed = await canAccessFeature(session.user.id, 'interviewMode');
  const requestedVariant = parseInterviewParam(interview);
  if (requestedVariant && !interviewAllowed) {
    redirect(`/practice/${slug}`); // dark flag: strip the interview param entirely
  }
  const interviewConfig =
    requestedVariant && interviewAllowed ? getInterviewConfig(requestedVariant) : null;

  const { steps, mode: stepMode } = getPracticeSteps(slug, problemMetadata.difficulty);
  const activeSteps = interviewConfig
    ? getInterviewSteps(slug, problemMetadata.difficulty, interviewConfig.variant)
    : steps;
  const problem = { ...problemMetadata, steps: activeSteps };

  // ... existing existingProgress/progressForUI code UNCHANGED ...

  return (
    <PracticeUI
      problem={problem}
      stepMode={stepMode}
      existingProgress={progressForUI}
      interviewConfig={interviewConfig}
      interviewAllowed={interviewAllowed}
    />
  );
}
```

- [ ] **Step 3: Plumb props into PracticeUI and render the entry**

In `src/components/PracticeUI.tsx`:

Add the import:

```ts
import { StartInterviewDialog } from './StartInterviewDialog';
import type { InterviewConfig } from '@/lib/interview-mode';
```

Extend both the wrapper and `PracticeUIContent` prop types (lines 41–65):

```ts
export default function PracticeUI({
  problem,
  stepMode = 'full',
  existingProgress,
  interviewConfig = null,
  interviewAllowed = false,
}: {
  problem: SystemDesignProblem;
  stepMode?: PracticeStepMode;
  existingProgress?: any;
  interviewConfig?: InterviewConfig | null;
  interviewAllowed?: boolean;
}) {
  return (
    <DiagramCanvasProvider>
      <PracticeUIContent
        problem={problem}
        stepMode={stepMode}
        existingProgress={existingProgress}
        interviewConfig={interviewConfig}
        interviewAllowed={interviewAllowed}
      />
    </DiagramCanvasProvider>
  );
}
```

(`PracticeUIContent` gets the same two extra props.)

In the sidebar footer (`renderSidebar`, before the "Export PDF" button around line 360), add:

```tsx
        {interviewAllowed && !interviewConfig && (
          <StartInterviewDialog slug={problem.slug} />
        )}
```

- [ ] **Step 4: Verify compile + behavior**

Run: `npx tsc --noEmit` → clean. Run `npm run dev`, open `/practice/design-tinyurl`:
- With the flag dark and no override: no "Start Interview" button; `/practice/design-tinyurl?interview=lite` redirects to `/practice/design-tinyurl`.
- Grant your admin user an `interviewMode` override (Plan A admin panel): button appears; choosing "45-min lite" lands on `?interview=lite` and the step list shows the 5 lite steps.

- [ ] **Step 5: Commit**

```bash
git add src/components/StartInterviewDialog.tsx src/components/PracticeUI.tsx "src/app/practice/[slug]/page.tsx"
git commit -m "feat(interview): flag-gated Start Interview entry and server-side variant wiring"
```

---

### Task 6: Interview session UI — countdown, no help, auto-end, debrief + PDF

**Files:**
- Create: `src/components/InterviewSummaryPanel.tsx`
- Modify: `src/components/PracticeUI.tsx` — timer block (`:241-269`), sidebar badge (`:229-237` area), HelpAssistant render (`:460-467`), plus new interview state
- Test: verified by Task 11 e2e (`e2e/interview-mode.spec.ts`); logic already unit-tested in Task 1

**Interfaces:**
- Consumes: `interviewStatusReducer`, `buildInterviewAnswers`, `InterviewStatus`, `InterviewEvent`, `InterviewConfig` (Task 1); `TimerWidget` local-mode `onComplete` (Task 2); `POST /api/interview/summary` (Task 4); existing `exportPracticeSession` via the existing `exportTranscript()` in PracticeUI; `InterviewSummary` type (Task 3).
- Produces: during an interview session — countdown from `interviewConfig.durationSeconds`, hidden HelpAssistant, "End Interview" button, auto-end on expiry, `InterviewSummaryPanel` dialog with debrief + "Export PDF" + "Retry" on failure.

- [ ] **Step 1: Create `src/components/InterviewSummaryPanel.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { StepData, SystemDesignProblem } from '@/types';
import type { InterviewSummary } from '@/lib/langgraph';
import {
  buildInterviewAnswers,
  type InterviewStatus,
  type InterviewStepDataLike,
} from '@/lib/interview-mode';

interface InterviewSummaryPanelProps {
  problem: SystemDesignProblem;
  phaseSteps: Record<string, StepData[]>;
  savedStepData: Map<string, InterviewStepDataLike>;
  status: InterviewStatus; // 'generating-summary' | 'complete' | 'summary-error'
  onSummaryReady: () => void;
  onSummaryFailed: () => void;
  onRetry: () => void;
  onExportPdf: () => Promise<void>;
  isExporting: boolean;
}

export default function InterviewSummaryPanel({
  problem,
  phaseSteps,
  savedStepData,
  status,
  onSummaryReady,
  onSummaryFailed,
  onRetry,
  onExportPdf,
  isExporting,
}: InterviewSummaryPanelProps) {
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (status !== 'generating-summary' || inFlightRef.current) return;
    inFlightRef.current = true;

    const run = async () => {
      try {
        const answers = buildInterviewAnswers(phaseSteps, savedStepData);
        const res = await fetch('/api/interview/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: problem.slug, answers }),
        });
        const data = await res.json();
        if (!res.ok || !data.summary) {
          setError(data.error ?? 'Could not generate your debrief.');
          onSummaryFailed();
          return;
        }
        setSummary(data.summary);
        onSummaryReady();
      } catch {
        setError('Could not generate your debrief.');
        onSummaryFailed();
      } finally {
        inFlightRef.current = false;
      }
    };
    void run();
  }, [status, phaseSteps, savedStepData, problem.slug, onSummaryReady, onSummaryFailed]);

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Interview Debrief</DialogTitle>
          <DialogDescription>
            {status === 'generating-summary'
              ? 'Your interview has ended. The AI interviewer is writing your debrief…'
              : `Timed interview for ${problem.title}.`}
          </DialogDescription>
        </DialogHeader>

        {status === 'generating-summary' && (
          <div className="flex items-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating your interview debrief…
          </div>
        )}

        {status === 'summary-error' && (
          <div className="py-4 space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {status === 'complete' && summary && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{summary.overallScore}/10</span>
              <Badge variant="outline">{summary.verdict}</Badge>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Strengths</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {summary.strengths.map((s, i) => (
                  <li key={`s-${i}`}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Improvements</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {summary.improvements.map((s, i) => (
                  <li key={`i-${i}`}>{s}</li>
                ))}
              </ul>
            </div>
            {summary.phaseNotes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1">Phase notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {summary.phaseNotes.map((n, i) => (
                    <li key={`p-${i}`}>
                      <span className="font-medium text-foreground">{n.phase}:</span> {n.comment}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {status === 'complete' && (
          <DialogFooter>
            <Button onClick={() => void onExportPdf()} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire interview state into `PracticeUIContent`**

In `src/components/PracticeUI.tsx`:

Add imports:

```ts
import InterviewSummaryPanel from './InterviewSummaryPanel';
import {
  interviewStatusReducer,
  type InterviewEvent,
  type InterviewStatus,
} from '@/lib/interview-mode';
```

Add state near the other timer state:

```ts
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>('running');
  const dispatchInterview = (event: InterviewEvent) =>
    setInterviewStatus((s) => interviewStatusReducer(s, event));
```

Replace the `TimerWidget` block (currently lines 242–269) so interview mode uses a local countdown and normal practice keeps the existing server timer:

```tsx
        <div className="mb-4">
          {interviewConfig ? (
            <TimerWidget
              className="w-full justify-between"
              problemId={`interview-${interviewConfig.variant}-${problem.id}`}
              initialTimeSeconds={interviewConfig.durationSeconds}
              onComplete={() => {
                toast.warning("Time's up! Your interview has ended.");
                dispatchInterview('TIME_EXPIRED');
              }}
            />
          ) : (
            <TimerWidget
              className="w-full justify-between"
              problemId={problem.id}
              initialTimeSeconds={
                stepMode === 'lite' ? 2700 :
                problem.difficulty === 'Easy' ? 1800 :
                  problem.difficulty === 'Medium' ? 2700 :
                    3600
              }
              startedAt={serverStartedAt}
              isTimerRunning={isTimerRunning}
              totalPausedSeconds={serverPausedSeconds}
              lastPausedAt={lastPausedAt}
              onToggle={async () => {
                if (!isAuthenticated) return;
                const result = await togglePracticeTimer(problem.id);
                if (result.success) {
                  setIsTimerRunning(result.isTimerRunning ?? false);
                  setServerPausedSeconds(result.totalPausedSeconds ?? 0);
                  setLastPausedAt(result.lastPausedAt ?? null);
                }
              }}
              onComplete={async () => {
                toast.warning("Time's up! The practice session has ended.");
              }}
            />
          )}
        </div>
```

In the sidebar header (next to the existing `stepMode === 'lite'` badge, around line 229), add an interview badge and an End Interview button in the sidebar footer (inside the footer `div`, above Export PDF):

```tsx
            {interviewConfig && (
              <Badge
                variant="outline"
                className="mt-1.5 text-[10px] border-red-500/30 text-red-600 bg-red-500/10"
              >
                Interview · {interviewConfig.durationSeconds / 60} min
              </Badge>
            )}
```

```tsx
        {interviewConfig && interviewStatus === 'running' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-red-600 border-red-500/30 hover:bg-red-500/10"
            onClick={() => dispatchInterview('FINISH_EARLY')}
          >
            End Interview
          </Button>
        )}
```

Disable Socratic help during the session — wrap the existing `HelpAssistant` render (lines 460–467):

```tsx
      {!interviewConfig && (
        <HelpAssistant
          problem={problem}
          currentPhase={phase}
          completedSteps={completedSteps}
          savedStepData={savedStepData}
        />
      )}
```

Render the summary panel at the end of the component (next to the SolutionViewer block):

```tsx
      {interviewConfig && interviewStatus !== 'running' && (
        <InterviewSummaryPanel
          problem={problem}
          phaseSteps={phaseSteps}
          savedStepData={savedStepData}
          status={interviewStatus}
          onSummaryReady={() => dispatchInterview('SUMMARY_READY')}
          onSummaryFailed={() => dispatchInterview('SUMMARY_FAILED')}
          onRetry={() => dispatchInterview('RETRY_SUMMARY')}
          onExportPdf={exportTranscript}
          isExporting={isExporting}
        />
      )}
```

(`phaseSteps`, `savedStepData`, `exportTranscript`, and `isExporting` already exist in `PracticeUIContent` — the PDF export reuses the existing `exportPracticeSession` path unchanged.)

- [ ] **Step 3: Verify compile + behavior**

Run: `npx tsc --noEmit` → clean. `npx vitest run` → all PASS. Manual check with a granted user: `?interview=lite` shows a 45:00 countdown, no floating "Open Help Assistant" button, "End Interview" opens the debrief dialog, and (with a BYOK/AI key) the debrief renders with an Export PDF button.

- [ ] **Step 4: Commit**

```bash
git add src/components/InterviewSummaryPanel.tsx src/components/PracticeUI.tsx
git commit -m "feat(interview): timed session UI with auto-end, AI debrief, and PDF export"
```

---

### Task 7: Probe persona and pure round rules

**Files:**
- Create: `src/lib/probe.ts`
- Modify: `src/lib/langgraph.ts` (append `getProbeResponse`; change the messages import on line 3)
- Test: `src/lib/__tests__/probe.test.ts`

**Interfaces:**
- Consumes: `ChatMessage`, `SystemDesignProblem` from `@/types`; `BaseChatModel`.
- Produces (used by Tasks 8–9):
  - `PROBE_MIN_ROUNDS = 2`, `PROBE_MAX_ROUNDS = 3`
  - `isValidProbeRound(round: unknown): round is number` — integer in `[1, PROBE_MAX_ROUNDS]`
  - `isFinalProbeRound(round: number): boolean`
  - `canEndProbe(round: number): boolean` — true once `PROBE_MIN_ROUNDS` questions asked
  - `PROBE_INTERVIEWER_PERSONA: string` — distinct adversarial interviewer system prompt
  - `buildProbePrompt(input: { problemTitle: string; phase: string; stepAnswer: string; round: number }): string`
  - `getProbeResponse(problem: SystemDesignProblem, phase: string, stepAnswer: string, probeMessages: ChatMessage[], round: number, llmOverride?: BaseChatModel | null): Promise<ChatMessage>` in `@/lib/langgraph`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/probe.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  PROBE_INTERVIEWER_PERSONA,
  PROBE_MAX_ROUNDS,
  PROBE_MIN_ROUNDS,
  buildProbePrompt,
  canEndProbe,
  isFinalProbeRound,
  isValidProbeRound,
} from '@/lib/probe';
import { getProbeResponse } from '@/lib/langgraph';
import type { SystemDesignProblem } from '@/types';

describe('probe round rules', () => {
  it('allows 2-3 adversarial follow-ups', () => {
    expect(PROBE_MIN_ROUNDS).toBe(2);
    expect(PROBE_MAX_ROUNDS).toBe(3);
  });

  it('validates round numbers', () => {
    expect(isValidProbeRound(1)).toBe(true);
    expect(isValidProbeRound(3)).toBe(true);
    expect(isValidProbeRound(0)).toBe(false);
    expect(isValidProbeRound(4)).toBe(false);
    expect(isValidProbeRound(1.5)).toBe(false);
    expect(isValidProbeRound('1')).toBe(false);
  });

  it('marks the final round and the early-exit point', () => {
    expect(isFinalProbeRound(3)).toBe(true);
    expect(isFinalProbeRound(2)).toBe(false);
    expect(canEndProbe(2)).toBe(true);
    expect(canEndProbe(1)).toBe(false);
  });
});

describe('probe persona and prompt', () => {
  it('persona is adversarial: one question, no hints, no answers', () => {
    expect(PROBE_INTERVIEWER_PERSONA).toContain('ONE pointed follow-up question');
    expect(PROBE_INTERVIEWER_PERSONA).toContain('Never give hints');
  });

  it('prompt embeds problem, phase, accepted answer, and round framing', () => {
    const prompt = buildProbePrompt({
      problemTitle: 'Design TinyURL',
      phase: 'HLD',
      stepAnswer: 'LB -> app -> Postgres with Redis cache',
      round: 1,
    });
    expect(prompt).toContain('Design TinyURL');
    expect(prompt).toContain('HLD');
    expect(prompt).toContain('Redis cache');
    expect(prompt).toContain(`follow-up 1 of ${PROBE_MAX_ROUNDS}`);
  });

  it('final round asks for the hardest question', () => {
    const prompt = buildProbePrompt({
      problemTitle: 'Design TinyURL',
      phase: 'HLD',
      stepAnswer: 'x',
      round: PROBE_MAX_ROUNDS,
    });
    expect(prompt).toContain('final follow-up');
  });
});

describe('getProbeResponse', () => {
  const problem: SystemDesignProblem = {
    id: 'p1',
    title: 'Design TinyURL',
    slug: 'design-tinyurl',
    description: 'URL shortening service',
    difficulty: 'Easy',
    category: 'Web',
    companies: [],
    requirements: [],
  };

  it('sends the persona as a system message and returns an ai ChatMessage', async () => {
    const invoke = vi.fn().mockResolvedValue({ content: 'What breaks first at 10x traffic?' });
    const llm = { invoke } as unknown as BaseChatModel;

    const message = await getProbeResponse(problem, 'HLD', 'LB -> app -> DB', [], 1, llm);

    expect(message.role).toBe('ai');
    expect(message.content).toBe('What breaks first at 10x traffic?');
    const [systemMsg, humanMsg] = invoke.mock.calls[0][0];
    expect(String(systemMsg.content)).toBe(PROBE_INTERVIEWER_PERSONA);
    expect(String(humanMsg.content)).toContain('Design TinyURL');
  });

  it('includes prior probe exchanges in the prompt', async () => {
    const invoke = vi.fn().mockResolvedValue({ content: 'And when the cache dies?' });
    const llm = { invoke } as unknown as BaseChatModel;
    const history = [
      { role: 'ai' as const, content: 'Why Redis?', id: '1', timestamp: new Date() },
      { role: 'user' as const, content: 'Hot key reads', id: '2', timestamp: new Date() },
    ];

    await getProbeResponse(problem, 'HLD', 'answer', history, 2, llm);

    const humanText = String(invoke.mock.calls[0][0][1].content);
    expect(humanText).toContain('Interviewer: Why Redis?');
    expect(humanText).toContain('Candidate: Hot key reads');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/probe.test.ts`
Expected: FAIL — module `@/lib/probe` not found.

- [ ] **Step 3: Implement `src/lib/probe.ts`**

```ts
export const PROBE_MIN_ROUNDS = 2;
export const PROBE_MAX_ROUNDS = 3;

export function isValidProbeRound(round: unknown): round is number {
  return (
    typeof round === 'number' &&
    Number.isInteger(round) &&
    round >= 1 &&
    round <= PROBE_MAX_ROUNDS
  );
}

export function isFinalProbeRound(round: number): boolean {
  return round >= PROBE_MAX_ROUNDS;
}

export function canEndProbe(round: number): boolean {
  return round >= PROBE_MIN_ROUNDS;
}

/**
 * Distinct probe-interviewer persona — adversarial, unlike the encouraging
 * evaluator in /api/ai/evaluate.
 */
export const PROBE_INTERVIEWER_PERSONA = `You are "The Skeptic" — a senior staff engineer famous for adversarial system design follow-ups.
The candidate just PASSED a step evaluation. Your job is to stress-test that accepted answer, not to teach.
Rules:
- Ask exactly ONE pointed follow-up question per turn.
- Attack the weakest spot: hidden assumptions, failure modes, scale cliffs, consistency gaps, cost, operational pain.
- Never give hints, praise, or answers. No bullet lists. Under 60 words.`;

export function buildProbePrompt(input: {
  problemTitle: string;
  phase: string;
  stepAnswer: string;
  round: number;
}): string {
  const framing = isFinalProbeRound(input.round)
    ? 'This is your final follow-up — make it the hardest one.'
    : `This is follow-up ${input.round} of ${PROBE_MAX_ROUNDS}.`;
  return `Problem: ${input.problemTitle}. Phase: ${input.phase}.
The candidate's accepted answer was:
"""
${input.stepAnswer}
"""
${framing}`;
}
```

Then in `src/lib/langgraph.ts`, change the messages import (line 3) to:

```ts
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
```

add near the top imports:

```ts
import { PROBE_INTERVIEWER_PERSONA, buildProbePrompt } from '@/lib/probe';
```

and append:

```ts
/** Adversarial probe question after a passed step evaluation (F3). */
export async function getProbeResponse(
  problem: SystemDesignProblem,
  phase: string,
  stepAnswer: string,
  probeMessages: ChatMessage[],
  round: number,
  llmOverride?: BaseChatModel | null
): Promise<ChatMessage> {
  const llm = llmOverride !== undefined ? llmOverride : getDefaultLLM();
  if (!llm) {
    return {
      role: 'ai',
      content: 'Probe interviewer is not available right now.',
      id: Date.now().toString(),
      timestamp: new Date(),
    };
  }

  const history = probeMessages
    .map((m) => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n');

  const prompt = `${buildProbePrompt({ problemTitle: problem.title, phase, stepAnswer, round })}

Conversation so far:
${history || '(none yet — open the probe)'}`;

  try {
    const response = await llm.invoke([
      new SystemMessage(PROBE_INTERVIEWER_PERSONA),
      new HumanMessage(prompt),
    ]);
    return {
      role: 'ai',
      content: response.content as string,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('getProbeResponse error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      role: 'ai',
      content: `Error communicating with AI service: ${errMsg}`,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/probe.test.ts` → PASS. `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/probe.ts src/lib/langgraph.ts src/lib/__tests__/probe.test.ts
git commit -m "feat(probe): adversarial interviewer persona and probe round rules"
```

---

### Task 8: Promote /api/ai/chat with a flag-gated probe mode

**Files:**
- Modify: `src/app/api/ai/chat/route.ts` (insert the probe branch after the problem lookup at lines 17–20; legacy flow below stays byte-identical)
- Test: `src/app/api/ai/__tests__/chat-probe.test.ts`

**Interfaces:**
- Consumes: `canAccessFeature` (Plan A), `getUserLLM`/`AIAccessError` (existing imports in the route), `getProbeResponse` (Task 7), `isValidProbeRound`/`isFinalProbeRound` (Task 7).
- Produces: `POST /api/ai/chat` with body `{ mode: 'probe', slug: string, phase: string, stepAnswer: string, probeMessages?: ChatMessage[], round: number }` → `200 { message: ChatMessage; round: number; isFinal: boolean }`. Errors: `401`, `403 { error: 'Not available' }` (flag dark), `403 { error: <AIAccessError message> }` (funding — `canUseAI` semantics unchanged: platform-funded only where credits exist, i.e. AI plan; BYOK on platform/lifetime), `400` invalid round or missing `stepAnswer`, `404` unknown slug. Requests without `mode: 'probe'` behave exactly as before (legacy chat, no flag check).

- [ ] **Step 1: Write the failing tests**

Create `src/app/api/ai/__tests__/chat-probe.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));
vi.mock('@/lib/user-llm', () => {
  class AIAccessError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AIAccessError';
    }
  }
  return { AIAccessError, getUserLLM: vi.fn() };
});
vi.mock('@/lib/langgraph', () => ({
  getAIResponse: vi.fn(),
  getFeedback: vi.fn(),
  getProbeResponse: vi.fn(),
}));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { AIAccessError, getUserLLM } from '@/lib/user-llm';
import { getProbeResponse } from '@/lib/langgraph';
import { POST } from '@/app/api/ai/chat/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);
const mockedProbe = vi.mocked(getProbeResponse);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const PROBE_BODY = {
  mode: 'probe',
  slug: 'design-tinyurl',
  phase: 'HLD',
  stepAnswer: 'LB -> app -> Postgres with Redis cache',
  probeMessages: [],
  round: 1,
};

const AI_MESSAGE = {
  role: 'ai' as const,
  content: 'What breaks first at 10x traffic?',
  id: '1',
  timestamp: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
  mockedFlag.mockResolvedValue(true);
  mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
  mockedProbe.mockResolvedValue(AI_MESSAGE);
});

describe('POST /api/ai/chat mode=probe', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 while the aiProbe flag is dark', async () => {
    mockedFlag.mockResolvedValue(false);
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(403);
    expect(mockedFlag).toHaveBeenCalledWith('u1', 'aiProbe');
    expect(mockedLLM).not.toHaveBeenCalled();
  });

  it('rejects out-of-range rounds with 400 (max 3 follow-ups)', async () => {
    expect((await POST(makeRequest({ ...PROBE_BODY, round: 4 }))).status).toBe(400);
    expect((await POST(makeRequest({ ...PROBE_BODY, round: 0 }))).status).toBe(400);
  });

  it('rejects a missing stepAnswer with 400', async () => {
    const res = await POST(makeRequest({ ...PROBE_BODY, stepAnswer: '  ' }));
    expect(res.status).toBe(400);
  });

  it('funding denial surfaces as 403 with the canUseAI reason', async () => {
    mockedLLM.mockRejectedValue(
      new AIAccessError('Add your preferred API key in Settings to use AI on the Platform plan.')
    );
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain('Platform plan');
  });

  it('returns the probe question with round metadata', async () => {
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message.content).toBe('What breaks first at 10x traffic?');
    expect(data.round).toBe(1);
    expect(data.isFinal).toBe(false);
  });

  it('marks round 3 as final', async () => {
    const res = await POST(makeRequest({ ...PROBE_BODY, round: 3 }));
    expect((await res.json()).isFinal).toBe(true);
  });

  it('legacy chat (no mode) never consults the flag', async () => {
    const res = await POST(
      makeRequest({ slug: 'design-tinyurl', phase: 'init', input: '', messages: [] })
    );
    expect(res.status).toBe(200);
    expect(mockedFlag).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/ai/__tests__/chat-probe.test.ts`
Expected: FAIL — probe requests fall into the legacy branch (no 403/400; `canAccessFeature` never imported).

- [ ] **Step 3: Implement in `src/app/api/ai/chat/route.ts`**

Add imports:

```ts
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getProbeResponse } from '@/lib/langgraph';
import { isFinalProbeRound, isValidProbeRound } from '@/lib/probe';
```

Change the body destructuring (line 16) to:

```ts
  const body = await req.json();
  const { input, slug, messages = [], phase = 'init', mode } = body;
```

Insert the probe branch immediately after the `problemMetadata` 404 check (after line 20), before `const steps = getStepsForProblem(slug);`:

```ts
  if (mode === 'probe') {
    if (!(await canAccessFeature(session.user.id, 'aiProbe'))) {
      return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }

    const { stepAnswer, probeMessages = [], round } = body;
    if (!isValidProbeRound(round) || typeof stepAnswer !== 'string' || !stepAnswer.trim()) {
      return NextResponse.json({ error: 'Invalid probe request' }, { status: 400 });
    }

    try {
      const { llm } = await getUserLLM(session.user.id, { problemSlug: slug });
      const parsedProbe: ChatMessage[] = (probeMessages as Array<ChatMessage & { timestamp: string }>).map(
        (msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })
      );
      const message = await getProbeResponse(
        { ...problemMetadata, steps: getStepsForProblem(slug) },
        phase,
        stepAnswer,
        parsedProbe,
        round,
        llm
      );
      return NextResponse.json({ message, round, isFinal: isFinalProbeRound(round) });
    } catch (error) {
      if (error instanceof AIAccessError) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      console.error('Probe error:', error);
      return NextResponse.json({ error: 'Error generating probe question.' }, { status: 500 });
    }
  }
```

Everything below (init/done/legacy phases) stays unchanged.

- [ ] **Step 4: Run tests to verify pass + no regressions**

Run: `npx vitest run src/app/api/ai/__tests__/chat-probe.test.ts` → PASS. `npx vitest run` → all PASS. `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/chat/route.ts src/app/api/ai/__tests__/chat-probe.test.ts
git commit -m "feat(probe): flag-gated probe mode on /api/ai/chat with round capping"
```

---

### Task 9: Probe UI — opt-in after a passing evaluation

**Files:**
- Create: `src/components/ProbePanel.tsx`
- Modify: `src/components/FeedbackModal.tsx:23-30` (props interface) and its footer (the block rendering the "Continue to Next Step" button)
- Modify: `src/components/StepByStepChat.tsx:150-152` (Props), `:246` (signature), `:1116-1125` (FeedbackModal render + panel mount)
- Modify: `src/components/PracticeUI.tsx` (`probeEnabled` prop plumbing), `src/app/practice/[slug]/page.tsx` (fetch + pass the flag)

**Interfaces:**
- Consumes: `POST /api/ai/chat` probe contract (Task 8), `canEndProbe` (Task 7), `canAccessFeature(userId, 'aiProbe')` (Plan A, server page only).
- Produces:
  - `FeedbackModalProps` gains `onStartProbe?: () => void`; a "Probe this answer" button renders only when `feedback.isAcceptable && onStartProbe`.
  - `StepByStepChat` gains `probeEnabled?: boolean` (default `false`).
  - `PracticeUI` gains `probeEnabled?: boolean`, forwarded to `StepByStepChat`.
  - `ProbePanel({ problem, phase, stepAnswer, onClose })` — fetches probe question 1 on mount, supports replies up to round 3, "End probe" enabled from round 2, textarea placeholder `Defend your design…`, send button named `Send`, close button named `Close probe`.

- [ ] **Step 1: Create `src/components/ProbePanel.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldQuestion, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { canEndProbe } from '@/lib/probe';
import type { ChatMessage, SystemDesignProblem } from '@/types';

interface ProbePanelProps {
  problem: SystemDesignProblem;
  phase: string;
  stepAnswer: string;
  onClose: () => void;
}

export default function ProbePanel({ problem, phase, stepAnswer, onClose }: ProbePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [round, setRound] = useState(0); // probe questions asked so far
  const [isFinal, setIsFinal] = useState(false);
  const [answeredFinal, setAnsweredFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const fetchProbe = async (nextRound: number, history: ChatMessage[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'probe',
          slug: problem.slug,
          phase,
          stepAnswer,
          probeMessages: history,
          round: nextRound,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Probe unavailable.');
        return;
      }
      setMessages([...history, data.message]);
      setRound(data.round);
      setIsFinal(data.isFinal);
    } catch {
      setError('Probe unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void fetchProbe(1, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendReply = () => {
    if (!reply.trim() || loading) return;
    const userMessage: ChatMessage = {
      role: 'user',
      content: reply.trim(),
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setReply('');
    if (isFinal) {
      setAnsweredFinal(true);
      return;
    }
    void fetchProbe(round + 1, history);
  };

  const probeOver = answeredFinal;

  return (
    <Card className="mt-6 border-2 border-amber-500/30 bg-amber-500/5">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-sm">Probe mode — The Skeptic</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Close probe"
            title="Close probe"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg p-3 text-sm ${
                m.role === 'ai'
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'bg-muted/50 border border-border ml-6'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              The Skeptic is thinking…
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {probeOver ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Probe complete — {round} follow-ups survived.
            </p>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Defend your design…"
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
            <div className="flex justify-between">
              {canEndProbe(round) && !isFinal ? (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  End probe
                </Button>
              ) : (
                <span />
              )}
              <Button size="sm" onClick={sendReply} disabled={loading || !reply.trim()}>
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Add the opt-in to `FeedbackModal`**

In `src/components/FeedbackModal.tsx`, extend the props interface (lines 23–30):

```ts
interface FeedbackModalProps {
  feedback: FeedbackData;
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  onStartProbe?: () => void;
  xpEarned?: number;
}
```

Update the component signature to accept `onStartProbe`, and next to the existing "Continue to Next Step" button in the footer add:

```tsx
            {feedback.isAcceptable && onStartProbe && (
              <Button variant="outline" onClick={onStartProbe}>
                Probe this answer
              </Button>
            )}
```

- [ ] **Step 3: Wire `StepByStepChat`**

In `src/components/StepByStepChat.tsx`:

The file already imports `dynamic` from `next/dynamic` (line 53) — reuse it. Register the panel below the `WIDGETS` map:

```ts
const ProbePanel = dynamic(() => import('./ProbePanel'), { ssr: false });
```

Extend `Props` (lines 150–152) and the signature (line 246):

```ts
interface Props {
  problem: SystemDesignProblem;
  probeEnabled?: boolean;
}

export default function StepByStepChat({ problem, probeEnabled = false }: Props) {
```

Add state near the other useState calls:

```ts
  const [probeContext, setProbeContext] = useState<{ phase: string; stepAnswer: string } | null>(null);
```

Clear it when navigating steps — inside the existing step-load effect keyed on `currentStepKey` (lines 569–584), add `setProbeContext(null);` alongside `setShowFeedback(false);`.

Replace the FeedbackModal render (lines 1117–1125):

```tsx
          {feedback && (
            <FeedbackModal
              isOpen={showFeedback}
              onClose={() => setShowFeedback(false)}
              onContinue={handleNext}
              onStartProbe={
                probeEnabled && feedback.isAcceptable
                  ? () => {
                      const stepAnswer =
                        currentStep.inputType === 'list'
                          ? listItems.join('\n')
                          : currentStep.inputType === 'schema'
                            ? JSON.stringify(schemaData, null, 2)
                            : textInput;
                      setProbeContext({ phase: currentStep.phase, stepAnswer });
                      setShowFeedback(false);
                    }
                  : undefined
              }
              feedback={feedback}
              xpEarned={feedback.isAcceptable ? 20 : 0}
            />
          )}
```

Mount the panel right after the closing `</Card>` of the step card (after line 1135):

```tsx
      {probeContext && (
        <ProbePanel
          problem={problem}
          phase={probeContext.phase}
          stepAnswer={probeContext.stepAnswer}
          onClose={() => setProbeContext(null)}
        />
      )}
```

- [ ] **Step 4: Plumb the flag from the server**

In `src/app/practice/[slug]/page.tsx` (already imports `canAccessFeature` from Task 5):

```ts
  const probeAllowed = await canAccessFeature(session.user.id, 'aiProbe');
```

and pass `probeEnabled={probeAllowed}` to `<PracticeUI …>`.

In `src/components/PracticeUI.tsx`, add `probeEnabled?: boolean` (default `false`) to both `PracticeUI` and `PracticeUIContent` props (same pattern as Task 5's props), and change the `StepByStepChat` render (line 416):

```tsx
            <StepByStepChat problem={problem} probeEnabled={probeEnabled} />
```

- [ ] **Step 5: Verify compile + behavior**

Run: `npx tsc --noEmit` → clean. `npx vitest run` → all PASS (FeedbackModal has an existing component test — if the new prop breaks a snapshot/render assertion, fix the test to pass `onStartProbe: undefined`). Manual: with `aiProbe` dark, no "Probe this answer" button ever renders; with an override granted, it appears after a passing evaluation and the panel runs a round-trip.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProbePanel.tsx src/components/FeedbackModal.tsx src/components/StepByStepChat.tsx src/components/PracticeUI.tsx "src/app/practice/[slug]/page.tsx"
git commit -m "feat(probe): opt-in probe mode UI after passing step evaluations"
```

---

### Task 10: Dark-launch gating e2e + flag override helper

**Files:**
- Create: `e2e/helpers/flags.ts`
- Modify: `e2e/flag-gating.spec.ts` (append; if Plan A Task 10 has not landed yet, create the file with just this describe block — the Plan A tests merge in later)
- Modify: `playwright.config.ts` — authenticated project `testMatch` becomes `/(auth|practice|roadmap|flag-gating|interview-mode|probe)\.spec\.ts/`

**Interfaces:**
- Consumes: Plan A's `FeatureFlagOverride` Prisma model, `E2E_TEST_EMAIL` from `e2e/constants.ts`.
- Produces (used by Task 11):
  - `grantFlagToE2eUser(flagKey: string): Promise<void>`
  - `removeFlagOverrideForE2eUser(flagKey: string): Promise<void>`
  - CI-runnable proof that dark `interviewMode`/`aiProbe` are invisible and their APIs 403.

- [ ] **Step 1: Create `e2e/helpers/flags.ts`**

```ts
import { PrismaClient } from '@prisma/client';
import { E2E_TEST_EMAIL } from '../constants';

const prisma = new PrismaClient();

async function findE2eUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: E2E_TEST_EMAIL, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!user) {
    throw new Error('E2E user not seeded — global setup must run first.');
  }
  return user.id;
}

export async function grantFlagToE2eUser(flagKey: string): Promise<void> {
  const userId = await findE2eUserId();
  await prisma.featureFlagOverride.upsert({
    where: { flagKey_userId: { flagKey, userId } },
    update: { mode: 'granted' },
    create: { flagKey, userId, mode: 'granted' },
  });
}

export async function removeFlagOverrideForE2eUser(flagKey: string): Promise<void> {
  const userId = await findE2eUserId();
  await prisma.featureFlagOverride.deleteMany({ where: { flagKey, userId } });
}
```

- [ ] **Step 2: Append the dark-gating tests to `e2e/flag-gating.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { removeFlagOverrideForE2eUser } from './helpers/flags';

// NOTE: interview-mode.spec.ts and probe.spec.ts grant overrides to the same
// e2e user. CI runs with workers=1, so file order (flag-gating → interview-mode
// → probe) keeps these isolated. Locally run:
//   npx playwright test e2e/flag-gating.spec.ts e2e/interview-mode.spec.ts e2e/probe.spec.ts --workers=1

test.describe('interview mode & probe stay dark', () => {
  test.beforeAll(async () => {
    await removeFlagOverrideForE2eUser('interviewMode');
    await removeFlagOverrideForE2eUser('aiProbe');
  });

  test('no Start Interview entry on the practice page', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Interview' })).toHaveCount(0);
  });

  test('?interview=lite is stripped for unentitled users', async ({ page }) => {
    await page.goto('/practice/design-tinyurl?interview=lite');
    await expect(page).toHaveURL(/\/practice\/design-tinyurl$/);
    await expect(page.getByText(/Interview · 45 min/)).toHaveCount(0);
  });

  test('interview summary API returns 403 while dark', async ({ request }) => {
    const res = await request.post('/api/interview/summary', {
      data: {
        slug: 'design-tinyurl',
        answers: [{ phase: 'HLD', title: 'x', answer: 'y', passed: true }],
      },
    });
    expect(res.status()).toBe(403);
  });

  test('probe chat API returns 403 while dark', async ({ request }) => {
    const res = await request.post('/api/ai/chat', {
      data: {
        mode: 'probe',
        slug: 'design-tinyurl',
        phase: 'HLD',
        stepAnswer: 'answer',
        round: 1,
      },
    });
    expect(res.status()).toBe(403);
  });
});
```

(If Plan A's file already exists, append only the `test.describe` block and the helper import — keep Plan A's existing imports/tests untouched.)

- [ ] **Step 3: Update `playwright.config.ts`**

Change the authenticated project's `testMatch` to:

```ts
      testMatch: /(auth|practice|roadmap|flag-gating|interview-mode|probe)\.spec\.ts/,
```

- [ ] **Step 4: Run the suite**

Run: `npx playwright test e2e/flag-gating.spec.ts`
Expected: PASS (all four tests — features invisible, both APIs 403).

- [ ] **Step 5: Commit**

```bash
git add e2e/helpers/flags.ts e2e/flag-gating.spec.ts playwright.config.ts
git commit -m "test(flags): interview mode and probe dark-launch gating e2e"
```

---

### Task 11: Happy-path e2e — lite interview session and probe round-trip

**Files:**
- Modify: `e2e/helpers/ai-mocks.ts` (append `mockInterviewSummary`, `mockAiProbe`)
- Create: `e2e/interview-mode.spec.ts`
- Create: `e2e/probe.spec.ts`

**Interfaces:**
- Consumes: `mockAiEvaluate` (existing), `grantFlagToE2eUser`/`removeFlagOverrideForE2eUser` (Task 10), interview UI (Tasks 5–6), probe UI (Task 9). AI providers are mocked via `page.route` (existing pattern in `e2e/helpers/ai-mocks.ts`) — no real LLM calls.
- Produces: money-path coverage — full lite interview session and a probe round-trip.

- [ ] **Step 1: Append mocks to `e2e/helpers/ai-mocks.ts`**

```ts
const DEFAULT_INTERVIEW_SUMMARY = {
  overallScore: 8,
  verdict: 'Hire',
  strengths: ['Structured requirements', 'Clear trade-off reasoning'],
  improvements: ['Quantify capacity estimates earlier'],
  phaseNotes: [{ phase: 'HLD', comment: 'Solid component breakdown.' }],
};

export async function mockInterviewSummary(page: Page) {
  await page.route('**/api/interview/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ summary: DEFAULT_INTERVIEW_SUMMARY }),
    });
  });
}

export async function mockAiProbe(page: Page) {
  await page.route('**/api/ai/chat', async (route) => {
    const body = route.request().postDataJSON() as { round?: number };
    const round = body?.round ?? 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: {
          role: 'ai',
          content: `Probe question ${round}: what breaks first at 10x traffic?`,
          id: `probe-${round}`,
          timestamp: new Date().toISOString(),
        },
        round,
        isFinal: round >= 3,
      }),
    });
  });
}
```

- [ ] **Step 2: Create `e2e/interview-mode.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { mockAiEvaluate, mockInterviewSummary } from './helpers/ai-mocks';
import { grantFlagToE2eUser, removeFlagOverrideForE2eUser } from './helpers/flags';

test.describe.configure({ mode: 'serial' });

test.describe('timed interview mode (flag granted)', () => {
  test.beforeAll(async () => {
    await grantFlagToE2eUser('interviewMode');
  });

  test.afterAll(async () => {
    await removeFlagOverrideForE2eUser('interviewMode');
  });

  test.beforeEach(async ({ page }) => {
    await mockAiEvaluate(page);
    await mockInterviewSummary(page);
  });

  test('lite session: start, lite steps, no help, answer, end, AI debrief + PDF', async ({
    page,
  }) => {
    await page.goto('/practice/design-tinyurl');

    // Entry visible when granted
    await page.getByRole('button', { name: 'Start Interview' }).click();
    await page.getByRole('button', { name: /45-min lite/ }).click();
    await expect(page).toHaveURL(/interview=lite/);

    // Interview badge, lite step set (lite placeholder, not the custom tinyurl one),
    // and Socratic help disabled
    await expect(page.getByText('Interview · 45 min')).toBeVisible();
    await expect(page.getByPlaceholder(/compact link/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Help Assistant' })).toHaveCount(0);

    // Answer the first lite step (list input)
    await page.getByPlaceholder(/compact link/i).fill('Shorten a long URL');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: /Submit for Review/i }).click();
    await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /Continue to Next Step/i }).click();

    // Finish early → auto summary → PDF export offered
    await page.getByRole('button', { name: 'End Interview' }).click();
    await expect(page.getByText('Interview Debrief')).toBeVisible();
    await expect(page.getByText('8/10')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Hire', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export PDF/i })).toBeVisible();
  });
});
```

- [ ] **Step 3: Create `e2e/probe.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { mockAiEvaluate, mockAiProbe } from './helpers/ai-mocks';
import { grantFlagToE2eUser, removeFlagOverrideForE2eUser } from './helpers/flags';

test.describe.configure({ mode: 'serial' });

test.describe('AI probe mode (flag granted)', () => {
  test.beforeAll(async () => {
    await grantFlagToE2eUser('aiProbe');
  });

  test.afterAll(async () => {
    await removeFlagOverrideForE2eUser('aiProbe');
  });

  test.beforeEach(async ({ page }) => {
    await mockAiEvaluate(page);
    await mockAiProbe(page);
  });

  test('probe opt-in appears after a passing evaluation and runs a round-trip', async ({
    page,
  }) => {
    await page.goto('/practice/design-tinyurl');

    // Pass the first step (custom tinyurl list step, same as practice.spec.ts)
    await page.getByPlaceholder(/short URL/i).fill('Users can shorten a long URL');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: /Submit for Review/i }).click();
    await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({
      timeout: 15_000,
    });

    // Opt in to probe mode from the feedback modal
    await page.getByRole('button', { name: 'Probe this answer' }).click();
    await expect(page.getByText(/Probe question 1/)).toBeVisible({ timeout: 15_000 });

    // Round-trip: answer question 1 → question 2 arrives
    await page.getByPlaceholder('Defend your design…').fill('Cache absorbs hot keys; DB is sharded by code prefix.');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText(/Probe question 2/)).toBeVisible({ timeout: 15_000 });

    // Minimum 2 rounds reached — early exit allowed
    await page.getByRole('button', { name: 'End probe' }).click();
    await expect(page.getByText(/Probe question 1/)).toHaveCount(0);
  });
});
```

- [ ] **Step 4: Run the specs**

Run: `npx playwright test e2e/interview-mode.spec.ts e2e/probe.spec.ts --workers=1`
Expected: PASS (2 tests).

- [ ] **Step 5: Full regression + commit**

Run: `npx vitest run && npx playwright test` → all PASS.

```bash
git add e2e/helpers/ai-mocks.ts e2e/interview-mode.spec.ts e2e/probe.spec.ts
git commit -m "test(e2e): lite interview happy path and probe round-trip with mocked AI"
```
