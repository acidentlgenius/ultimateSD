# Plan D: Voice Interview Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dark-launched, turn-based push-to-talk voice interview mode: TTS speaks the interviewer's question, the candidate holds a button to record, audio is transcribed (whisper-1), the transcript runs through the existing interviewer chat pipeline, and the reply comes back as text plus TTS audio — with every turn persisted.

**Architecture:** A thin `voice` layer over the existing chat pipeline. Two new Prisma models (`VoiceSession` with `engine: 'turn-based'`, `VoiceTurn`) mirror the `PracticeSession`/`StepSubmission` storage pattern. Four small API routes under `src/app/api/voice/` (session / transcribe / reply / speak), each gated by `canAccessFeature(userId, 'voiceInterview')` and funded by a `canUseAI`-style pure decision function (`canUseVoice`). Audio calls hit OpenAI whisper-1/tts-1 via plain `fetch` (no new dependency) — platform `OPENAI_API_KEY` for AI-plan users, the user's own `openaiApiKey` for BYOK. The client is a pure reducer state machine (idle→recording→transcribing→thinking→speaking) driven by a `VoicePanel` component that wraps `MediaRecorder` and mounts on the practice screen next to the diagram canvas.

**Tech Stack:** Next.js 15/16 App Router (route handlers), Prisma/Postgres, NextAuth (`@/auth`), LangChain `BaseChatModel` via existing `getUserLLM`, browser `MediaRecorder` + `HTMLAudioElement`, Vitest (jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-07-01-flag-gated-feature-launch-design.md` — section F5, entitlement table (Voice interview: ❌ Free / BYOK Platform / BYOK Lifetime / ✅ funded AI Pro), testing strategy.

## Global Constraints

- App root is `ultimate-sd/` — all paths below are relative to it. Run unit tests with `npx vitest run <path>`, e2e with `npx playwright test <path>`.
- **Requires Plan A merged first** (`docs/superpowers/plans/2026-07-01-plan-a-flag-engine-and-lifetime.md`): this plan consumes `canAccessFeature(userId: string | null, feature: FeatureKey): Promise<boolean>` from `@/lib/feature-flags-server`, `FeatureKey` including `'voiceInterview'` from `@/lib/plans`, `PlanType = 'free' | 'platform' | 'lifetime' | 'ai'`, and the `FeatureFlagOverride` Prisma model. Do not re-implement any of it.
- **Requires Plan C's interview session (loose coupling):** Plan C (`docs/superpowers/plans/2026-07-01-plan-c-interview-mode-and-probe.md`) is not yet written at plan time. `VoiceSession.practiceSessionId` is a nullable plain-string reference (no FK) to whatever session id Plan C's interview mode produces (today: `PracticeSession.id`). Voice works standalone with `practiceSessionId: null`; when Plan C's interviewer persona helper lands in `src/lib/langgraph.ts`, the reply route's `getAIResponse(...)` call is the single swap point.
- Flag key is exactly `'voiceInterview'`. It ships dark (`enabledPlans: []`). Every `/api/voice/*` route must return **403** when `canAccessFeature` denies — UI checks alone are insufficient.
- Entitlement/funding rule (spec F5): funded voice on `'ai'` plan (platform `OPENAI_API_KEY`, one AI credit per turn via `getUserLLM`); BYOK voice on `'platform'`/`'lifetime'` (user's own `openaiApiKey`); NOT on `'free'` (a flag-granted free test user may still use BYOK). Clean error message when the user's provider has no audio support.
- Audio models fixed: STT `whisper-1`, TTS `tts-1` (voice `alloy`). Provider calls via `fetch` — do NOT add the `openai` npm package or any other dependency.
- No WebRTC, no streaming, no realtime infra. `VoiceSession.engine` is the string `'turn-based'` so a realtime engine can slot in later.
- New env var `OPENAI_API_KEY` (platform audio funding). Optional — its absence must produce a clean `VoiceAccessError`, never a crash. Do not add it to `scripts/check-env.ts` required vars.
- Playwright `authenticated` project `testMatch` in `playwright.config.ts` must include the new spec files (Task 8).

---

### Task 1: Prisma models — VoiceSession and VoiceTurn

**Files:**
- Modify: `prisma/schema.prisma`
- Migration: `prisma/migrations/<generated>_voice_sessions/`

**Interfaces:**
- Consumes: existing `User` model, existing `SessionStatus` enum (`ACTIVE | COMPLETED | ABANDONED`).
- Produces: `prisma.voiceSession` (`id`, `userId`, `problemId: string`, `practiceSessionId: string | null`, `engine: string` default `'turn-based'`, `status: SessionStatus`, `startedAt`, `endedAt`, relation `turns`) and `prisma.voiceTurn` (`id`, `voiceSessionId`, `role: string` (`'interviewer' | 'candidate'`), `transcript: string`, `createdAt`).

- [ ] **Step 1: Add models to `prisma/schema.prisma`**

Append at the end of the file (this mirrors the `PracticeSession`/`StepSubmission` storage pattern):

```prisma
model VoiceSession {
  id                String        @id @default(cuid())
  userId            String
  problemId         String
  // Loose reference to the interview session from Plan C (PracticeSession.id).
  // Deliberately NOT a foreign key so voice stays decoupled from the interview flow.
  practiceSessionId String?
  engine            String        @default("turn-based")
  status            SessionStatus @default(ACTIVE)
  startedAt         DateTime      @default(now())
  endedAt           DateTime?

  user  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  turns VoiceTurn[]

  @@index([userId, problemId])
}

model VoiceTurn {
  id             String   @id @default(cuid())
  voiceSessionId String
  role           String // "interviewer" | "candidate"
  transcript     String   @db.Text
  createdAt      DateTime @default(now())

  session VoiceSession @relation(fields: [voiceSessionId], references: [id], onDelete: Cascade)

  @@index([voiceSessionId, createdAt])
}
```

Inside the existing `model User { ... }` block, in the `// Relations` section after `launchOfferEntry        LaunchOfferEntry?`, add:

```prisma
  voiceSessions           VoiceSession[]
```

- [ ] **Step 2: Generate migration and client**

Run: `npx prisma migrate dev --name voice_sessions`
Expected: migration created and applied; client regenerated. Then run `npx tsc --noEmit` → clean.

- [ ] **Step 3: Commit**

```bash
git add prisma/
git commit -m "feat(voice): VoiceSession and VoiceTurn models with turn-based engine field"
```

---

### Task 2: Pure voice funding decision — canUseVoice

**Files:**
- Create: `src/lib/voice-access.ts`
- Test: `src/lib/__tests__/voice-access.test.ts`

**Interfaces:**
- Consumes: `PlanType` (with `'lifetime'`, from Plan A) from `@/lib/plans`.
- Produces (pure, no I/O — the single voice funding rule):
  - `type VoiceFundingSource = 'platform' | 'byok'`
  - `interface VoiceFundingInput { plan: PlanType; aiCredits: number; openaiApiKey: string | null; preferredProvider: string }`
  - `interface VoiceFundingDecision { allowed: boolean; source?: VoiceFundingSource; reason?: string }`
  - `canUseVoice(input: VoiceFundingInput): VoiceFundingDecision`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/voice-access.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canUseVoice } from '@/lib/voice-access';

const base = { aiCredits: 0, openaiApiKey: null, preferredProvider: 'gemini' };

describe('canUseVoice', () => {
  it('ai plan with credits is platform-funded', () => {
    expect(canUseVoice({ ...base, plan: 'ai', aiCredits: 5 })).toEqual({
      allowed: true,
      source: 'platform',
    });
  });

  it('ai plan with no credits falls back to their OpenAI key', () => {
    expect(
      canUseVoice({ ...base, plan: 'ai', openaiApiKey: 'sk-user' })
    ).toEqual({ allowed: true, source: 'byok' });
  });

  it('ai plan with no credits and no key is denied with a credits message', () => {
    const decision = canUseVoice({ ...base, plan: 'ai' });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/credits/i);
  });

  it('platform and lifetime plans use BYOK OpenAI key', () => {
    for (const plan of ['platform', 'lifetime'] as const) {
      expect(
        canUseVoice({ ...base, plan, openaiApiKey: 'sk-user' })
      ).toEqual({ allowed: true, source: 'byok' });
    }
  });

  it('non-OpenAI BYOK provider without an OpenAI key gets a clean audio-support error', () => {
    const decision = canUseVoice({ ...base, plan: 'platform', preferredProvider: 'anthropic' });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/doesn't support audio/i);
    expect(decision.reason).toMatch(/anthropic/i);
  });

  it('OpenAI-preferring user who just has no key gets an add-key message', () => {
    const decision = canUseVoice({ ...base, plan: 'lifetime', preferredProvider: 'openai' });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/add your openai api key/i);
  });

  it('free plan is denied without a key (flag override testers can still BYOK)', () => {
    expect(canUseVoice({ ...base, plan: 'free' }).allowed).toBe(false);
    expect(
      canUseVoice({ ...base, plan: 'free', openaiApiKey: 'sk-user' })
    ).toEqual({ allowed: true, source: 'byok' });
  });

  it('platform plan never consumes platform funding even with stray credits', () => {
    expect(
      canUseVoice({ ...base, plan: 'platform', aiCredits: 10, openaiApiKey: 'sk-user' })
    ).toEqual({ allowed: true, source: 'byok' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/voice-access.test.ts`
Expected: FAIL — module `@/lib/voice-access` not found.

- [ ] **Step 3: Implement `src/lib/voice-access.ts`**

```ts
import type { PlanType } from '@/lib/plans';

export type VoiceFundingSource = 'platform' | 'byok';

export interface VoiceFundingInput {
  plan: PlanType;
  aiCredits: number;
  openaiApiKey: string | null;
  preferredProvider: string;
}

export interface VoiceFundingDecision {
  allowed: boolean;
  source?: VoiceFundingSource;
  reason?: string;
}

/**
 * The single voice funding rule (mirrors canUseAI's shape):
 *   - 'ai' plan: platform-funded while credits last, then BYOK OpenAI key.
 *   - 'platform' / 'lifetime': BYOK OpenAI key only.
 *   - 'free': denied — the 'voiceInterview' flag is the entitlement wall; a
 *     flag-granted tester on free can still exercise voice via a BYOK key.
 * Voice requires OpenAI audio models (whisper-1 / tts-1); other BYOK
 * providers have no audio support, so the OpenAI key is always the BYOK key.
 */
export function canUseVoice(input: VoiceFundingInput): VoiceFundingDecision {
  const { plan, aiCredits, openaiApiKey, preferredProvider } = input;

  if (plan === 'ai' && aiCredits > 0) {
    return { allowed: true, source: 'platform' };
  }

  if (openaiApiKey) {
    return { allowed: true, source: 'byok' };
  }

  if (plan === 'ai') {
    return {
      allowed: false,
      reason:
        'You have used all AI credits for this month. Add an OpenAI API key in Settings to keep using voice interviews.',
    };
  }

  if (plan === 'free') {
    return {
      allowed: false,
      reason: 'Voice interviews are not included on the Free plan.',
    };
  }

  if (preferredProvider !== 'openai') {
    return {
      allowed: false,
      reason: `Voice interviews need OpenAI audio models (Whisper + TTS). Your current AI provider (${preferredProvider}) doesn't support audio — add an OpenAI API key in Settings to use voice.`,
    };
  }

  return {
    allowed: false,
    reason: 'Add your OpenAI API key in Settings to use voice interviews.',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/voice-access.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/voice-access.ts src/lib/__tests__/voice-access.test.ts
git commit -m "feat(voice): pure canUseVoice funding decision (platform vs BYOK)"
```

---

### Task 3: OpenAI audio client — transcribeAudio / synthesizeSpeech

**Files:**
- Create: `src/lib/voice-openai.ts`
- Test: `src/lib/__tests__/voice-openai.test.ts`

**Interfaces:**
- Consumes: global `fetch`, `FormData`, `Blob` (Node 22 built-ins).
- Produces:
  - `class VoiceProviderError extends Error`
  - `transcribeAudio(apiKey: string, audio: Blob, fetchImpl?: typeof fetch): Promise<string>` — whisper-1.
  - `synthesizeSpeech(apiKey: string, text: string, fetchImpl?: typeof fetch): Promise<ArrayBuffer>` — tts-1, mp3 bytes.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/voice-openai.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { transcribeAudio, synthesizeSpeech, VoiceProviderError } from '@/lib/voice-openai';

describe('transcribeAudio', () => {
  it('posts multipart form to whisper-1 and returns the text', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'design a url shortener' }), { status: 200 })
    );
    const audio = new Blob(['audio-bytes'], { type: 'audio/webm' });

    const text = await transcribeAudio('sk-test', audio, fetchImpl as unknown as typeof fetch);

    expect(text).toBe('design a url shortener');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/audio/transcriptions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const form = init.body as FormData;
    expect(form.get('model')).toBe('whisper-1');
    expect(form.get('file')).toBeInstanceOf(Blob);
  });

  it('throws VoiceProviderError on non-2xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }));
    await expect(
      transcribeAudio('sk-bad', new Blob(['x']), fetchImpl as unknown as typeof fetch)
    ).rejects.toBeInstanceOf(VoiceProviderError);
  });
});

describe('synthesizeSpeech', () => {
  it('posts JSON to tts-1 and returns audio bytes', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const fetchImpl = vi.fn().mockResolvedValue(new Response(bytes, { status: 200 }));

    const audio = await synthesizeSpeech('sk-test', 'Hello candidate', fetchImpl as unknown as typeof fetch);

    expect(new Uint8Array(audio)).toEqual(new Uint8Array([1, 2, 3]));
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/audio/speech');
    expect(JSON.parse(init.body)).toEqual({
      model: 'tts-1',
      voice: 'alloy',
      input: 'Hello candidate',
    });
  });

  it('throws VoiceProviderError on non-2xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('err', { status: 500 }));
    await expect(
      synthesizeSpeech('sk-test', 'hi', fetchImpl as unknown as typeof fetch)
    ).rejects.toBeInstanceOf(VoiceProviderError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/voice-openai.test.ts`
Expected: FAIL — module `@/lib/voice-openai` not found.

- [ ] **Step 3: Implement `src/lib/voice-openai.ts`**

```ts
/**
 * Minimal OpenAI audio client (whisper-1 STT, tts-1 TTS) over plain fetch.
 * Deliberately no `openai` npm dependency. `fetchImpl` is injectable for tests.
 */
export class VoiceProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoiceProviderError';
  }
}

const OPENAI_BASE = 'https://api.openai.com/v1';

export async function transcribeAudio(
  apiKey: string,
  audio: Blob,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const form = new FormData();
  form.append('file', audio, 'answer.webm');
  form.append('model', 'whisper-1');

  const res = await fetchImpl(`${OPENAI_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new VoiceProviderError(`Transcription failed (${res.status})`);
  }
  const data = (await res.json()) as { text: string };
  return data.text;
}

export async function synthesizeSpeech(
  apiKey: string,
  text: string,
  fetchImpl: typeof fetch = fetch
): Promise<ArrayBuffer> {
  const res = await fetchImpl(`${OPENAI_BASE}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'tts-1', voice: 'alloy', input: text }),
  });

  if (!res.ok) {
    throw new VoiceProviderError(`Speech synthesis failed (${res.status})`);
  }
  return res.arrayBuffer();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/voice-openai.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/voice-openai.ts src/lib/__tests__/voice-openai.test.ts
git commit -m "feat(voice): fetch-based whisper-1/tts-1 client with injectable fetch"
```

---

### Task 4: Server-side credential resolver — getVoiceCredentials

**Files:**
- Create: `src/lib/voice-server.ts`
- Test: `src/lib/__tests__/voice-server.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `getEffectivePlanType` from `@/lib/access`, `canUseVoice` (Task 2), `process.env.OPENAI_API_KEY`.
- Produces:
  - `class VoiceAccessError extends Error`
  - `interface VoiceCredentials { apiKey: string; source: VoiceFundingSource }`
  - `getVoiceCredentials(userId: string): Promise<VoiceCredentials>` — throws `VoiceAccessError` with the `canUseVoice` reason when denied, or when the platform key is missing.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/voice-server.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';

const mocked = vi.mocked(prisma, true);

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    planType: 'ai',
    planExpiresAt: new Date(Date.now() + 86_400_000),
    aiCredits: 10,
    openaiApiKey: null,
    preferredProvider: 'gemini',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENAI_API_KEY = 'sk-platform';
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe('getVoiceCredentials', () => {
  it('ai plan with credits gets the platform key', async () => {
    mocked.user.findUnique.mockResolvedValue(userRow() as never);
    expect(await getVoiceCredentials('u1')).toEqual({
      apiKey: 'sk-platform',
      source: 'platform',
    });
  });

  it('throws a clean error when the platform key is not configured', async () => {
    delete process.env.OPENAI_API_KEY;
    mocked.user.findUnique.mockResolvedValue(userRow() as never);
    await expect(getVoiceCredentials('u1')).rejects.toThrow(
      'Voice service is temporarily unavailable.'
    );
  });

  it('platform plan uses the user BYOK OpenAI key', async () => {
    mocked.user.findUnique.mockResolvedValue(
      userRow({ planType: 'platform', aiCredits: 0, openaiApiKey: 'sk-user' }) as never
    );
    expect(await getVoiceCredentials('u1')).toEqual({
      apiKey: 'sk-user',
      source: 'byok',
    });
  });

  it('expired platform plan resolves as free and is denied', async () => {
    mocked.user.findUnique.mockResolvedValue(
      userRow({ planType: 'platform', planExpiresAt: new Date('2000-01-01'), aiCredits: 0 }) as never
    );
    await expect(getVoiceCredentials('u1')).rejects.toBeInstanceOf(VoiceAccessError);
  });

  it('propagates the audio-support reason for non-OpenAI providers', async () => {
    mocked.user.findUnique.mockResolvedValue(
      userRow({ planType: 'platform', aiCredits: 0, preferredProvider: 'aws' }) as never
    );
    await expect(getVoiceCredentials('u1')).rejects.toThrow(/doesn't support audio/i);
  });

  it('throws when the user does not exist', async () => {
    mocked.user.findUnique.mockResolvedValue(null as never);
    await expect(getVoiceCredentials('ghost')).rejects.toBeInstanceOf(VoiceAccessError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/voice-server.test.ts`
Expected: FAIL — module `@/lib/voice-server` not found.

- [ ] **Step 3: Implement `src/lib/voice-server.ts`**

```ts
import { prisma } from '@/lib/prisma';
import { getEffectivePlanType } from '@/lib/access';
import { canUseVoice, type VoiceFundingSource } from '@/lib/voice-access';
import type { PlanType } from '@/lib/plans';

export class VoiceAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoiceAccessError';
  }
}

export interface VoiceCredentials {
  apiKey: string;
  source: VoiceFundingSource;
}

/**
 * Resolves which OpenAI key funds this user's audio calls.
 * Platform-funded ('ai' plan) → process.env.OPENAI_API_KEY.
 * BYOK ('platform'/'lifetime', or credit-exhausted 'ai') → user.openaiApiKey.
 * Credit consumption is NOT done here — the reply route's getUserLLM call
 * decrements one AI credit per voice turn for platform-funded users.
 */
export async function getVoiceCredentials(userId: string): Promise<VoiceCredentials> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      planExpiresAt: true,
      aiCredits: true,
      openaiApiKey: true,
      preferredProvider: true,
    },
  });

  if (!user) {
    throw new VoiceAccessError('User not found.');
  }

  const plan = getEffectivePlanType({
    planType: user.planType as PlanType,
    planExpiresAt: user.planExpiresAt,
  });

  const decision = canUseVoice({
    plan,
    aiCredits: user.aiCredits,
    openaiApiKey: user.openaiApiKey,
    preferredProvider: user.preferredProvider,
  });

  if (!decision.allowed || !decision.source) {
    throw new VoiceAccessError(decision.reason ?? 'Voice access denied.');
  }

  if (decision.source === 'platform') {
    const platformKey = process.env.OPENAI_API_KEY;
    if (!platformKey) {
      throw new VoiceAccessError('Voice service is temporarily unavailable.');
    }
    return { apiKey: platformKey, source: 'platform' };
  }

  return { apiKey: user.openaiApiKey as string, source: 'byok' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/voice-server.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/voice-server.ts src/lib/__tests__/voice-server.test.ts
git commit -m "feat(voice): server-side voice credential resolver over canUseVoice"
```

---

### Task 5: Voice session state machine (pure reducer)

**Files:**
- Create: `src/components/voice/voice-machine.ts`
- Test: `src/components/voice/__tests__/voice-machine.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `type VoicePhase = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'error'`
  - `interface VoiceMachineState { phase: VoicePhase; error: string | null }`
  - `type VoiceMachineEvent = { type: 'PRESS' } | { type: 'RELEASE' } | { type: 'TRANSCRIBED' } | { type: 'REPLY_READY' } | { type: 'SPEAK' } | { type: 'PLAYBACK_ENDED' } | { type: 'FAIL'; message: string } | { type: 'RESET' }`
  - `INITIAL_VOICE_STATE: VoiceMachineState`
  - `voiceReducer(state: VoiceMachineState, event: VoiceMachineEvent): VoiceMachineState`

- [ ] **Step 1: Write the failing tests**

Create `src/components/voice/__tests__/voice-machine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  INITIAL_VOICE_STATE,
  voiceReducer,
  type VoiceMachineState,
} from '@/components/voice/voice-machine';

function at(phase: VoiceMachineState['phase']): VoiceMachineState {
  return { phase, error: null };
}

describe('voiceReducer', () => {
  it('walks the full turn: idle→recording→transcribing→thinking→speaking→idle', () => {
    let state = INITIAL_VOICE_STATE;
    state = voiceReducer(state, { type: 'PRESS' });
    expect(state.phase).toBe('recording');
    state = voiceReducer(state, { type: 'RELEASE' });
    expect(state.phase).toBe('transcribing');
    state = voiceReducer(state, { type: 'TRANSCRIBED' });
    expect(state.phase).toBe('thinking');
    state = voiceReducer(state, { type: 'REPLY_READY' });
    expect(state.phase).toBe('speaking');
    state = voiceReducer(state, { type: 'PLAYBACK_ENDED' });
    expect(state.phase).toBe('idle');
  });

  it('SPEAK from idle plays the interviewer question (opening turn)', () => {
    expect(voiceReducer(at('idle'), { type: 'SPEAK' }).phase).toBe('speaking');
  });

  it('ignores illegal events (no recording while speaking, no release while idle)', () => {
    expect(voiceReducer(at('speaking'), { type: 'PRESS' }).phase).toBe('speaking');
    expect(voiceReducer(at('idle'), { type: 'RELEASE' }).phase).toBe('idle');
    expect(voiceReducer(at('thinking'), { type: 'PRESS' }).phase).toBe('thinking');
  });

  it('FAIL from any phase lands in error with the message', () => {
    for (const phase of ['idle', 'recording', 'transcribing', 'thinking', 'speaking'] as const) {
      const state = voiceReducer(at(phase), { type: 'FAIL', message: 'mic denied' });
      expect(state).toEqual({ phase: 'error', error: 'mic denied' });
    }
  });

  it('RESET recovers from error to idle', () => {
    const errored = voiceReducer(at('recording'), { type: 'FAIL', message: 'x' });
    expect(voiceReducer(errored, { type: 'RESET' })).toEqual(INITIAL_VOICE_STATE);
    expect(voiceReducer(errored, { type: 'PRESS' }).phase).toBe('error');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/voice/__tests__/voice-machine.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/voice/voice-machine.ts`**

```ts
export type VoicePhase =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface VoiceMachineState {
  phase: VoicePhase;
  error: string | null;
}

export type VoiceMachineEvent =
  | { type: 'PRESS' } // hold-to-talk pressed
  | { type: 'RELEASE' } // hold-to-talk released
  | { type: 'TRANSCRIBED' } // STT finished
  | { type: 'REPLY_READY' } // interviewer text ready
  | { type: 'SPEAK' } // play interviewer audio directly (opening question)
  | { type: 'PLAYBACK_ENDED' } // TTS playback done
  | { type: 'FAIL'; message: string }
  | { type: 'RESET' };

export const INITIAL_VOICE_STATE: VoiceMachineState = { phase: 'idle', error: null };

/** Pure turn-based push-to-talk state machine. Illegal events are no-ops. */
export function voiceReducer(
  state: VoiceMachineState,
  event: VoiceMachineEvent
): VoiceMachineState {
  if (event.type === 'FAIL') {
    return { phase: 'error', error: event.message };
  }

  switch (state.phase) {
    case 'idle':
      if (event.type === 'PRESS') return { phase: 'recording', error: null };
      if (event.type === 'SPEAK') return { phase: 'speaking', error: null };
      return state;
    case 'recording':
      if (event.type === 'RELEASE') return { phase: 'transcribing', error: null };
      return state;
    case 'transcribing':
      if (event.type === 'TRANSCRIBED') return { phase: 'thinking', error: null };
      return state;
    case 'thinking':
      if (event.type === 'REPLY_READY') return { phase: 'speaking', error: null };
      return state;
    case 'speaking':
      if (event.type === 'PLAYBACK_ENDED') return { phase: 'idle', error: null };
      return state;
    case 'error':
      if (event.type === 'RESET') return INITIAL_VOICE_STATE;
      return state;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/voice/__tests__/voice-machine.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/voice/voice-machine.ts src/components/voice/__tests__/voice-machine.test.ts
git commit -m "feat(voice): pure push-to-talk state machine reducer"
```

---

### Task 6: Voice API routes (session / transcribe / reply / speak) with flag gating

**Files:**
- Create: `src/app/api/voice/guard.ts`
- Create: `src/app/api/voice/session/route.ts`
- Create: `src/app/api/voice/transcribe/route.ts`
- Create: `src/app/api/voice/reply/route.ts`
- Create: `src/app/api/voice/speak/route.ts`
- Test: `src/app/api/voice/__tests__/routes.test.ts`

**Interfaces:**
- Consumes: `auth` from `@/auth`; `canAccessFeature` from `@/lib/feature-flags-server` (Plan A); `getVoiceCredentials`/`VoiceAccessError` (Task 4); `transcribeAudio`/`synthesizeSpeech` (Task 3); `getUserLLM`/`AIAccessError` from `@/lib/user-llm`; `getAIResponse` from `@/lib/langgraph`; `PROBLEMS` from `@/lib/problems`; `getStepsForProblem` from `@/lib/problem-steps`; `prisma.voiceSession`/`prisma.voiceTurn` (Task 1); `ChatMessage` from `@/types`.
- Produces (all POST, all 401 unauthenticated / 403 when flag denies or funding denies):
  - `POST /api/voice/session` body `{ slug: string; practiceSessionId?: string | null }` → `{ sessionId: string; question: string }` (creates `VoiceSession` + opening interviewer `VoiceTurn`).
  - `POST /api/voice/transcribe` multipart `sessionId` + `audio` (Blob) → `{ transcript: string }` (persists candidate turn).
  - `POST /api/voice/reply` body `{ sessionId: string; transcript: string }` → `{ text: string }` (persists interviewer turn; consumes one AI credit for platform-funded users via `getUserLLM`).
  - `POST /api/voice/speak` body `{ sessionId: string; text: string }` → `audio/mpeg` bytes.

- [ ] **Step 1: Write the failing tests**

Create `src/app/api/voice/__tests__/routes.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));
vi.mock('@/lib/voice-server', () => {
  class VoiceAccessError extends Error {}
  return { getVoiceCredentials: vi.fn(), VoiceAccessError };
});
vi.mock('@/lib/voice-openai', () => ({
  transcribeAudio: vi.fn(),
  synthesizeSpeech: vi.fn(),
  VoiceProviderError: class VoiceProviderError extends Error {},
}));
vi.mock('@/lib/user-llm', () => {
  class AIAccessError extends Error {}
  return { getUserLLM: vi.fn(), AIAccessError };
});
vi.mock('@/lib/langgraph', () => ({ getAIResponse: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    voiceSession: { create: vi.fn(), findUnique: vi.fn() },
    voiceTurn: { create: vi.fn() },
  },
}));

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { transcribeAudio, synthesizeSpeech } from '@/lib/voice-openai';
import { getUserLLM } from '@/lib/user-llm';
import { getAIResponse } from '@/lib/langgraph';
import { prisma } from '@/lib/prisma';
import { POST as postSession } from '@/app/api/voice/session/route';
import { POST as postTranscribe } from '@/app/api/voice/transcribe/route';
import { POST as postReply } from '@/app/api/voice/reply/route';
import { POST as postSpeak } from '@/app/api/voice/speak/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedCreds = vi.mocked(getVoiceCredentials);
const mockedPrisma = vi.mocked(prisma, true);

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function signIn() {
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('voice route gating', () => {
  it('all voice routes return 401 without a session', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const responses = await Promise.all([
      postSession(jsonRequest('http://test/api/voice/session', { slug: 'design-tinyurl' })),
      postReply(jsonRequest('http://test/api/voice/reply', { sessionId: 's', transcript: 'x' })),
      postSpeak(jsonRequest('http://test/api/voice/speak', { sessionId: 's', text: 'x' })),
    ]);
    for (const res of responses) expect(res.status).toBe(401);
  });

  it('all voice routes return 403 while the flag is dark', async () => {
    signIn();
    mockedFlag.mockResolvedValue(false);
    const responses = await Promise.all([
      postSession(jsonRequest('http://test/api/voice/session', { slug: 'design-tinyurl' })),
      postReply(jsonRequest('http://test/api/voice/reply', { sessionId: 's', transcript: 'x' })),
      postSpeak(jsonRequest('http://test/api/voice/speak', { sessionId: 's', text: 'x' })),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(403);
    }
    expect(mockedFlag).toHaveBeenCalledWith('u1', 'voiceInterview');
  });
});

describe('POST /api/voice/session', () => {
  it('404s an unknown problem slug', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    const res = await postSession(
      jsonRequest('http://test/api/voice/session', { slug: 'not-a-problem' })
    );
    expect(res.status).toBe(404);
  });

  it('403s with the funding reason when voice is not funded', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockRejectedValue(new VoiceAccessError('Voice interviews are not included on the Free plan.'));
    const res = await postSession(
      jsonRequest('http://test/api/voice/session', { slug: 'design-tinyurl' })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/free plan/i);
  });

  it('creates a turn-based session with an opening interviewer turn', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockResolvedValue({ apiKey: 'sk', source: 'platform' });
    mockedPrisma.voiceSession.create.mockResolvedValue({ id: 'vs1' } as never);

    const res = await postSession(
      jsonRequest('http://test/api/voice/session', {
        slug: 'design-tinyurl',
        practiceSessionId: 'ps1',
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe('vs1');
    expect(body.question.length).toBeGreaterThan(10);
    const createArg = mockedPrisma.voiceSession.create.mock.calls[0][0];
    expect(createArg.data.engine).toBe('turn-based');
    expect(createArg.data.practiceSessionId).toBe('ps1');
    expect(createArg.data.turns.create[0].role).toBe('interviewer');
  });
});

describe('POST /api/voice/transcribe', () => {
  it('transcribes the audio and persists a candidate turn', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockResolvedValue({ apiKey: 'sk', source: 'byok' });
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({ id: 'vs1', userId: 'u1' } as never);
    vi.mocked(transcribeAudio).mockResolvedValue('use consistent hashing');
    mockedPrisma.voiceTurn.create.mockResolvedValue({} as never);

    const form = new FormData();
    form.append('sessionId', 'vs1');
    form.append('audio', new Blob(['bytes'], { type: 'audio/webm' }), 'a.webm');
    const req = new NextRequest('http://test/api/voice/transcribe', {
      method: 'POST',
      body: form,
    });

    const res = await postTranscribe(req);
    expect(res.status).toBe(200);
    expect((await res.json()).transcript).toBe('use consistent hashing');
    expect(mockedPrisma.voiceTurn.create).toHaveBeenCalledWith({
      data: { voiceSessionId: 'vs1', role: 'candidate', transcript: 'use consistent hashing' },
    });
  });

  it("404s a session that belongs to someone else", async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({ id: 'vs1', userId: 'other' } as never);

    const form = new FormData();
    form.append('sessionId', 'vs1');
    form.append('audio', new Blob(['bytes']), 'a.webm');
    const res = await postTranscribe(
      new NextRequest('http://test/api/voice/transcribe', { method: 'POST', body: form })
    );
    expect(res.status).toBe(404);
  });
});

describe('POST /api/voice/reply', () => {
  it('runs the transcript through the interviewer pipeline and persists the reply', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({
      id: 'vs1',
      userId: 'u1',
      problemId: '1',
      turns: [
        { id: 't1', role: 'interviewer', transcript: 'Opening question', createdAt: new Date() },
      ],
    } as never);
    vi.mocked(getUserLLM).mockResolvedValue({ llm: {} as never, source: 'platform_credits' });
    vi.mocked(getAIResponse).mockResolvedValue({
      id: 'r1',
      role: 'ai',
      content: 'How would you shard the database?',
      timestamp: new Date(),
    });
    mockedPrisma.voiceTurn.create.mockResolvedValue({} as never);

    const res = await postReply(
      jsonRequest('http://test/api/voice/reply', { sessionId: 'vs1', transcript: 'I would cache reads' })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).text).toBe('How would you shard the database?');
    expect(mockedPrisma.voiceTurn.create).toHaveBeenCalledWith({
      data: {
        voiceSessionId: 'vs1',
        role: 'interviewer',
        transcript: 'How would you shard the database?',
      },
    });
  });
});

describe('POST /api/voice/speak', () => {
  it('returns audio/mpeg bytes from TTS', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockResolvedValue({ apiKey: 'sk', source: 'platform' });
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({ id: 'vs1', userId: 'u1' } as never);
    vi.mocked(synthesizeSpeech).mockResolvedValue(new Uint8Array([9, 9]).buffer);

    const res = await postSpeak(
      jsonRequest('http://test/api/voice/speak', { sessionId: 'vs1', text: 'Hello' })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([9, 9]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/voice/__tests__/routes.test.ts`
Expected: FAIL — route modules not found.

- [ ] **Step 3: Implement the guard — `src/app/api/voice/guard.ts`**

```ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';

/**
 * Shared auth + 'voiceInterview' flag gate for all /api/voice/* routes.
 * Returns { userId } on success or a NextResponse (401/403) to return as-is.
 */
export async function requireVoiceAccess(): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await canAccessFeature(session.user.id, 'voiceInterview'))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }
  return { userId: session.user.id };
}
```

- [ ] **Step 4: Implement `src/app/api/voice/session/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { requireVoiceAccess } from '../guard';

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const { slug, practiceSessionId = null } = await req.json();
  const problem = PROBLEMS.find((p) => p.slug === slug);
  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  try {
    await getVoiceCredentials(access.userId);
  } catch (error) {
    if (error instanceof VoiceAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  const question = `Let's begin the voice interview. We're designing ${problem.title}. To start: what are the core functional requirements you would focus on, and what scale should we assume?`;

  const voiceSession = await prisma.voiceSession.create({
    data: {
      userId: access.userId,
      problemId: problem.id,
      practiceSessionId,
      engine: 'turn-based',
      turns: { create: [{ role: 'interviewer', transcript: question }] },
    },
  });

  return NextResponse.json({ sessionId: voiceSession.id, question });
}
```

- [ ] **Step 5: Implement `src/app/api/voice/transcribe/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { transcribeAudio } from '@/lib/voice-openai';
import { requireVoiceAccess } from '../guard';

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const form = await req.formData();
  const sessionId = form.get('sessionId');
  const audio = form.get('audio');
  if (typeof sessionId !== 'string' || !(audio instanceof Blob)) {
    return NextResponse.json({ error: 'sessionId and audio are required' }, { status: 400 });
  }

  const voiceSession = await prisma.voiceSession.findUnique({ where: { id: sessionId } });
  if (!voiceSession || voiceSession.userId !== access.userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let credentials;
  try {
    credentials = await getVoiceCredentials(access.userId);
  } catch (error) {
    if (error instanceof VoiceAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  try {
    const transcript = await transcribeAudio(credentials.apiKey, audio);
    await prisma.voiceTurn.create({
      data: { voiceSessionId: sessionId, role: 'candidate', transcript },
    });
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('voice transcribe error:', error);
    return NextResponse.json(
      { error: 'Transcription failed. Please try again.' },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 6: Implement `src/app/api/voice/reply/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { getStepsForProblem } from '@/lib/problem-steps';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';
import { getAIResponse } from '@/lib/langgraph';
import { requireVoiceAccess } from '../guard';
import type { ChatMessage } from '@/types';

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const { sessionId, transcript } = await req.json();
  if (typeof sessionId !== 'string' || typeof transcript !== 'string' || !transcript.trim()) {
    return NextResponse.json({ error: 'sessionId and transcript are required' }, { status: 400 });
  }

  const voiceSession = await prisma.voiceSession.findUnique({
    where: { id: sessionId },
    include: { turns: { orderBy: { createdAt: 'asc' }, take: 20 } },
  });
  if (!voiceSession || voiceSession.userId !== access.userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const problemMetadata = PROBLEMS.find((p) => p.id === voiceSession.problemId);
  if (!problemMetadata) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }
  const problem = { ...problemMetadata, steps: getStepsForProblem(problemMetadata.slug) };

  const history: ChatMessage[] = voiceSession.turns.map((turn) => ({
    id: turn.id,
    role: turn.role === 'candidate' ? ('user' as const) : ('ai' as const),
    content: turn.transcript,
    timestamp: turn.createdAt,
  }));

  try {
    // Platform-funded users are charged one AI credit per voice turn here.
    const { llm } = await getUserLLM(access.userId, { problemSlug: problemMetadata.slug });
    // NOTE: single swap point — when Plan C lands its interviewer probe persona
    // in src/lib/langgraph.ts, call it here instead of getAIResponse.
    const reply = await getAIResponse(
      problem,
      transcript,
      'voice interview (spoken, turn-based — keep the reply short and conversational)',
      history,
      llm
    );

    await prisma.voiceTurn.create({
      data: { voiceSessionId: sessionId, role: 'interviewer', transcript: reply.content },
    });

    return NextResponse.json({ text: reply.content });
  } catch (error) {
    if (error instanceof AIAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('voice reply error:', error);
    return NextResponse.json(
      { error: 'Failed to generate the interviewer reply. Please try again.' },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 7: Implement `src/app/api/voice/speak/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { synthesizeSpeech } from '@/lib/voice-openai';
import { requireVoiceAccess } from '../guard';

const MAX_TTS_CHARS = 1500;

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const { sessionId, text } = await req.json();
  if (typeof sessionId !== 'string' || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'sessionId and text are required' }, { status: 400 });
  }

  const voiceSession = await prisma.voiceSession.findUnique({ where: { id: sessionId } });
  if (!voiceSession || voiceSession.userId !== access.userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let credentials;
  try {
    credentials = await getVoiceCredentials(access.userId);
  } catch (error) {
    if (error instanceof VoiceAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  try {
    const audio = await synthesizeSpeech(credentials.apiKey, text.slice(0, MAX_TTS_CHARS));
    return new NextResponse(audio, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('voice speak error:', error);
    return NextResponse.json(
      { error: 'Speech synthesis failed. Please try again.' },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/app/api/voice/__tests__/routes.test.ts` → PASS
Run: `npx tsc --noEmit` → clean.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/voice/ 
git commit -m "feat(voice): flag-gated STT/TTS/reply/session API routes"
```

---

### Task 7: VoicePanel client component + practice-page integration

**Files:**
- Create: `src/components/voice/VoicePanel.tsx`
- Modify: `src/app/practice/[slug]/page.tsx` (thread `voiceEnabled` from `canAccessFeature`)
- Modify: `src/components/PracticeUI.tsx` (accept `voiceEnabled` prop; mount `VoicePanel` above `StepByStepChat` at the `<StepByStepChat problem={problem} />` call, around line 416)

**Interfaces:**
- Consumes: `voiceReducer`/`INITIAL_VOICE_STATE` (Task 5); routes from Task 6; `canAccessFeature` (Plan A); browser `MediaRecorder`, `navigator.mediaDevices.getUserMedia`, `Audio`.
- Produces: `VoicePanel({ slug, problemTitle, practiceSessionId }: { slug: string; problemTitle: string; practiceSessionId?: string | null })` (default export). Test ids the e2e spec relies on: `voice-start`, `voice-talk`, `voice-status`, `voice-transcript`, `voice-error`. `PracticeUI` gains optional prop `voiceEnabled?: boolean` (default false → zero visual change while dark).

- [ ] **Step 1: Implement `src/components/voice/VoicePanel.tsx`**

```tsx
'use client';

import { useCallback, useReducer, useRef, useState } from 'react';
import { Mic, Phone, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  INITIAL_VOICE_STATE,
  voiceReducer,
  type VoiceMachineEvent,
} from './voice-machine';

interface TranscriptEntry {
  role: 'interviewer' | 'candidate';
  text: string;
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Hold the button and speak',
  recording: 'Listening… release to send',
  transcribing: 'Transcribing…',
  thinking: 'Interviewer is thinking…',
  speaking: 'Interviewer is speaking…',
  error: 'Something went wrong',
};

export default function VoicePanel({
  slug,
  problemTitle,
  practiceSessionId = null,
}: {
  slug: string;
  problemTitle: string;
  practiceSessionId?: string | null;
}) {
  const [state, dispatch] = useReducer(voiceReducer, INITIAL_VOICE_STATE);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fail = useCallback((message: string) => {
    dispatch({ type: 'FAIL', message });
  }, []);

  /** Fetch TTS audio for `text` and play it; resolves the machine on end/error. */
  const speak = useCallback(
    async (text: string, currentSessionId: string, entryEvent: VoiceMachineEvent) => {
      dispatch(entryEvent);
      const end = () => dispatch({ type: 'PLAYBACK_ENDED' });
      try {
        const res = await fetch('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId, text }),
        });
        if (!res.ok) {
          // No audio is non-fatal: the transcript is on screen. End the turn.
          end();
          return;
        }
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = end;
        audio.onerror = end;
        await audio.play().catch(end);
      } catch {
        end();
      }
    },
    []
  );

  const startSession = useCallback(async () => {
    try {
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, practiceSessionId }),
      });
      const body = await res.json();
      if (!res.ok) {
        fail(body.error ?? 'Could not start the voice session.');
        return;
      }
      setSessionId(body.sessionId);
      setTranscript([{ role: 'interviewer', text: body.question }]);
      await speak(body.question, body.sessionId, { type: 'SPEAK' });
    } catch {
      fail('Could not start the voice session.');
    }
  }, [slug, practiceSessionId, fail, speak]);

  const handlePress = useCallback(async () => {
    if (!sessionId || state.phase !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const form = new FormData();
          form.append('sessionId', sessionId);
          form.append('audio', audio, 'answer.webm');
          const sttRes = await fetch('/api/voice/transcribe', { method: 'POST', body: form });
          const sttBody = await sttRes.json();
          if (!sttRes.ok) {
            fail(sttBody.error ?? 'Transcription failed.');
            return;
          }
          setTranscript((prev) => [...prev, { role: 'candidate', text: sttBody.transcript }]);
          dispatch({ type: 'TRANSCRIBED' });

          const replyRes = await fetch('/api/voice/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, transcript: sttBody.transcript }),
          });
          const replyBody = await replyRes.json();
          if (!replyRes.ok) {
            fail(replyBody.error ?? 'The interviewer did not respond.');
            return;
          }
          setTranscript((prev) => [...prev, { role: 'interviewer', text: replyBody.text }]);
          await speak(replyBody.text, sessionId, { type: 'REPLY_READY' });
        } catch {
          fail('Network error during the voice turn.');
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      dispatch({ type: 'PRESS' });
    } catch {
      fail('Microphone access was denied. Allow the mic to use voice mode.');
    }
  }, [sessionId, state.phase, fail, speak]);

  const handleRelease = useCallback(() => {
    if (state.phase !== 'recording') return;
    dispatch({ type: 'RELEASE' });
    recorderRef.current?.stop();
  }, [state.phase]);

  if (!sessionId && state.phase !== 'error') {
    return (
      <div className="mb-6 rounded-xl border-2 border-border/60 bg-card p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" /> Voice Interview
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Talk through {problemTitle} with the AI interviewer. The diagram canvas stays available below.
          </p>
        </div>
        <Button size="sm" data-testid="voice-start" onClick={startSession}>
          Start Voice Interview
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border-2 border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" /> Voice Interview
        </h3>
        <span data-testid="voice-status" className="text-xs text-muted-foreground">
          {PHASE_LABELS[state.phase]}
        </span>
      </div>

      {state.error && (
        <p role="alert" data-testid="voice-error" className="text-sm text-red-500">
          {state.error}{' '}
          <button className="underline" onClick={() => dispatch({ type: 'RESET' })}>
            Try again
          </button>
        </p>
      )}

      <ul data-testid="voice-transcript" className="space-y-2 max-h-64 overflow-y-auto text-sm">
        {transcript.map((entry, index) => (
          <li
            key={index}
            className={cn(
              'rounded-lg px-3 py-2',
              entry.role === 'interviewer' ? 'bg-muted' : 'bg-primary/10 text-right'
            )}
          >
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
              {entry.role}
            </span>
            {entry.text}
          </li>
        ))}
      </ul>

      <div className="flex justify-center">
        <button
          type="button"
          data-testid="voice-talk"
          disabled={!sessionId || (state.phase !== 'idle' && state.phase !== 'recording')}
          onPointerDown={handlePress}
          onPointerUp={handleRelease}
          onPointerLeave={handleRelease}
          className={cn(
            'flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-colors select-none touch-none',
            state.phase === 'recording'
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-primary text-primary-foreground disabled:opacity-50'
          )}
        >
          <Mic className="h-4 w-4" />
          {state.phase === 'recording' ? 'Release to send' : 'Hold to talk'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Thread the flag through `src/app/practice/[slug]/page.tsx`**

Add the import:

```ts
import { canAccessFeature } from '@/lib/feature-flags-server';
```

Inside `PracticePage`, after the `existingProgress` query, add:

```ts
  const voiceEnabled = await canAccessFeature(session.user.id, 'voiceInterview');
```

and change the return to:

```tsx
  return (
    <PracticeUI
      problem={problem}
      stepMode={stepMode}
      existingProgress={progressForUI}
      voiceEnabled={voiceEnabled}
    />
  );
```

- [ ] **Step 3: Mount the panel in `src/components/PracticeUI.tsx`**

Add the import near the other component imports:

```ts
import VoicePanel from './voice/VoicePanel';
```

Add `voiceEnabled = false` to both the `PracticeUI` wrapper and `PracticeUIContent` props (type `voiceEnabled?: boolean`), passing it through the wrapper. Then, immediately above the `Main Chat Interface` block that renders `<StepByStepChat problem={problem} />` (~line 416), add:

```tsx
          {voiceEnabled && (
            <VoicePanel
              slug={problem.slug}
              problemTitle={problem.title}
              practiceSessionId={existingProgress?.activeSessionId ?? null}
            />
          )}
```

- [ ] **Step 4: Verify compile and dark default**

Run: `npx tsc --noEmit` → clean. Run: `npx vitest run` → all PASS (no regressions).
Manual check: `npm run dev`, open `/practice/design-tinyurl` as a normal user — no voice UI visible (flag is dark).

- [ ] **Step 5: Commit**

```bash
git add src/components/voice/VoicePanel.tsx src/components/PracticeUI.tsx "src/app/practice/[slug]/page.tsx"
git commit -m "feat(voice): push-to-talk VoicePanel wired into practice screen behind flag"
```

---

### Task 8: E2E — mocked-audio happy path + dark-flag 403 gating

**Files:**
- Create: `e2e/helpers/voice-mocks.ts`
- Create: `e2e/voice.spec.ts`
- Modify: `e2e/flag-gating.spec.ts` (append voice 403 tests; created by Plan A Task 10 — if it does not exist yet, create it with just the voice describe below)
- Modify: `playwright.config.ts` (authenticated project `testMatch`)

**Interfaces:**
- Consumes: `E2E_TEST_EMAIL` from `e2e/constants.ts`; `prisma` from `src/lib/prisma`; `FeatureFlagOverride` model (Plan A); test ids from Task 7 (`voice-start`, `voice-talk`, `voice-status`, `voice-transcript`).
- Produces: `fakeMediaRecorder(page)` and `mockVoiceRoutes(page)` helpers; passing `e2e/voice.spec.ts` and voice section in `e2e/flag-gating.spec.ts`.

- [ ] **Step 1: Write the audio mocks helper — `e2e/helpers/voice-mocks.ts`**

```ts
import type { Page } from '@playwright/test';

/** Replaces MediaRecorder + getUserMedia with synchronous fakes (no real mic). */
export async function fakeMediaRecorder(page: Page) {
  await page.addInitScript(() => {
    class FakeMediaRecorder {
      static isTypeSupported() {
        return true;
      }
      state: 'inactive' | 'recording' = 'inactive';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(_stream: MediaStream) {}
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['fake-audio'], { type: 'audio/webm' }) });
        this.onstop?.();
      }
    }
    // @ts-expect-error test double
    window.MediaRecorder = FakeMediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: async () => new MediaStream() },
      configurable: true,
    });
  });
}

/** Stubs all /api/voice/* providers so no real STT/TTS is called. */
export async function mockVoiceRoutes(page: Page) {
  await page.route('**/api/voice/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 'vs-e2e',
        question: 'What are the core requirements?',
      }),
    })
  );
  await page.route('**/api/voice/transcribe', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ transcript: 'I would start with URL shortening and redirects.' }),
    })
  );
  await page.route('**/api/voice/reply', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: 'Good. How would you handle 100 million redirects a day?' }),
    })
  );
  await page.route('**/api/voice/speak', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      // Not a decodable mp3 — VoicePanel treats playback failure as PLAYBACK_ENDED.
      body: Buffer.from([0xff, 0xf3, 0x18, 0xc4]),
    })
  );
}
```

- [ ] **Step 2: Write the happy-path spec — `e2e/voice.spec.ts`**

The flag override is real (server-rendered visibility needs the DB), while all audio providers are network-mocked. Serial mode keeps the dark-check in `flag-gating.spec.ts` from racing the override (CI runs `workers: 1`; locally, run these two files individually if they flake together).

```ts
import { config as loadEnv } from 'dotenv';
import { test, expect } from '@playwright/test';
import { E2E_TEST_EMAIL } from './constants';
import { fakeMediaRecorder, mockVoiceRoutes } from './helpers/voice-mocks';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' });

test.describe.configure({ mode: 'serial' });

// COORDINATION: if Plan C has already landed `e2e/helpers/flags.ts`, delete this
// local helper and use `grantFlagToE2eUser('voiceInterview')` /
// `removeFlagOverrideForE2eUser('voiceInterview')` from it instead.
async function setVoiceOverride(mode: 'granted' | null) {
  const { prisma } = await import('../src/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { email: E2E_TEST_EMAIL },
    select: { id: true },
  });
  if (!user) throw new Error('E2E user missing — global setup did not run');
  if (mode === null) {
    await prisma.featureFlagOverride.deleteMany({
      where: { flagKey: 'voiceInterview', userId: user.id },
    });
    return;
  }
  await prisma.featureFlagOverride.upsert({
    where: { flagKey_userId: { flagKey: 'voiceInterview', userId: user.id } },
    update: { mode },
    create: { flagKey: 'voiceInterview', userId: user.id, mode },
  });
}

test.describe('voice interview (flag granted, audio providers mocked)', () => {
  test.beforeAll(async () => {
    await setVoiceOverride('granted');
  });

  test.afterAll(async () => {
    await setVoiceOverride(null);
  });

  test('completes a full push-to-talk turn', async ({ page }) => {
    await fakeMediaRecorder(page);
    await mockVoiceRoutes(page);

    await page.goto('/practice/design-tinyurl');
    await page.getByTestId('voice-start').click();

    // Opening interviewer question appears in the transcript.
    const transcript = page.getByTestId('voice-transcript');
    await expect(transcript).toContainText('What are the core requirements?');

    // Push-to-talk: press, release → candidate transcript → interviewer reply.
    const talk = page.getByTestId('voice-talk');
    await expect(talk).toBeEnabled();
    await talk.dispatchEvent('pointerdown');
    await expect(page.getByTestId('voice-status')).toContainText(/listening/i);
    await talk.dispatchEvent('pointerup');

    await expect(transcript).toContainText('I would start with URL shortening and redirects.');
    await expect(transcript).toContainText('How would you handle 100 million redirects a day?');

    // Turn completes back to idle (playback error path counts as ended).
    await expect(page.getByTestId('voice-status')).toContainText(/hold the button/i);
  });

  test('voice panel is hidden without the flag', async ({ page }) => {
    await setVoiceOverride(null);
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByTestId('voice-start')).toHaveCount(0);
    await setVoiceOverride('granted');
  });
});
```

- [ ] **Step 3: Append the dark-403 suite to `e2e/flag-gating.spec.ts`**

Append this describe (the file and its authenticated free-user context come from Plan A Task 10; if Plan A has not created it yet, create the file with just this content plus the imports shown):

```ts
import { test, expect } from '@playwright/test';

test.describe('voice APIs are unreachable while voiceInterview is dark', () => {
  test('JSON voice routes return 403 for a signed-in unentitled user', async ({ request }) => {
    const cases: Array<[string, Record<string, string>]> = [
      ['/api/voice/session', { slug: 'design-tinyurl' }],
      ['/api/voice/reply', { sessionId: 'nope', transcript: 'hello' }],
      ['/api/voice/speak', { sessionId: 'nope', text: 'hello' }],
    ];
    for (const [path, data] of cases) {
      const res = await request.post(path, { data });
      expect(res.status(), path).toBe(403);
    }
  });

  test('transcribe route returns 403 before touching the audio', async ({ request }) => {
    const res = await request.post('/api/voice/transcribe', {
      multipart: {
        sessionId: 'nope',
        audio: { name: 'a.webm', mimeType: 'audio/webm', buffer: Buffer.from('fake') },
      },
    });
    expect(res.status()).toBe(403);
  });
});
```

- [ ] **Step 4: Register the specs in `playwright.config.ts`**

In the `authenticated` project, change:

```ts
      testMatch: /(auth|practice|roadmap)\.spec\.ts/,
```

to:

```ts
      testMatch: /(auth|practice|roadmap|voice|flag-gating)\.spec\.ts/,
```

(If Plan A already added `flag-gating`, only add `voice`.)

- [ ] **Step 5: Run the e2e suites**

Run: `npx playwright test e2e/flag-gating.spec.ts e2e/voice.spec.ts`
Expected: PASS — dark 403s first, then the granted happy path.

- [ ] **Step 6: Full regression**

Run: `npx vitest run && npx playwright test`
Expected: all PASS. Flag stays dark (`enabledPlans: []` for `voiceInterview`) — nothing user-visible ships.

- [ ] **Step 7: Commit**

```bash
git add e2e/helpers/voice-mocks.ts e2e/voice.spec.ts e2e/flag-gating.spec.ts playwright.config.ts
git commit -m "test(voice): mocked-audio e2e happy path and dark-flag 403 gating"
```
