# Adaptive Coach — Skill-Based Personalized Practice

> **Status:** Approved (2026-07-14; revised 2026-07-15 for skill-based architecture)  
> **Spec version:** v1.0  
> **App root:** `ultimate-sd/`  
> **Problem this solves:** AI practice is not user-specific. The same pass bar (`score ≥ 7` ∧ `accuracy ≥ 70`) and fixed step scripts apply to everyone, so a “45 min” session becomes a 2+ hour rewrite grind. Onboarding prefs (`targetCompanies`, `preferredDifficulty`, `focusAreas`, `practiceIntent`) exist but are ignored by evaluate/help/chat.

---

## Executive summary

Ship a **mid-2026 skill-based Adaptive Coach**: a LangGraph Coach Supervisor that personalizes practice from who the user is and what they want, generates the next moves on the fly (within curated stage rails), and **never traps** learners with infinite gatekeeping.

- **Practice mode** = personal coach (calibrated bar · attempt caps · stage time budgets · teach-forward).  
- **Mock / Interview mode** = realistic interviewer (stricter bar · optional probes · hard timer end).  
- **Judgment** = invocable Coach Skills (`SKILL.md` progressive disclosure + RAG).  
- **Invariants** = Policy Tools (pure TypeScript) — pass bar, tries, budgets, earned vs coached outcomes.  
- **Shared AI core** with thin adapters into Problem Flow V2 and classic practice.

Ship dark behind a feature flag; wire Flow V2 first, then classic + interview adapters.

---

## Decisions log

| Question | Decision |
|----------|----------|
| Scope | Full Adaptive Coach stack (profile → pacing → live agenda), phased |
| Product feel | Mode-switching hybrid: Practice = coach, Mock = interviewer |
| Generation | Stage **rails** as spine + **live agenda** with authored gold as RAG |
| Progress | Layered: profile-calibrated bar + attempt cap + time budget + mastery ledger |
| Learner model | Declared level/role + competency ledger + cross-session memory notes |
| Product home | Shared AI core → Flow V2 first, adapters into classic + interview |
| Architecture | **Skill-based Coach Graph** (LangGraph + policy tools + SKILL.md skills), not prompt-only retrofit and not a single fat agent |
| Pass logic | Code (`progress_gate` tool) — never left to model vibes |
| Flag | DB feature flag `adaptiveCoach` (dark seed); intended plans set in implementation plan (default seed target: `platform`, `lifetime`, `ai`) |

---

## 1. Goals and non-goals

### Goals

1. Every evaluate / agenda / teach / probe call sees a compact **learner profile pack**.  
2. Practice sessions finish within the posted time budget for the user’s level (no infinite rewrite loops).  
3. Next 1–3 moves are **planned live** from profile + performance + RAG, inside stage rails.  
4. Mastery distinguishes **earned** (passed gate) vs **coached** (taught forward after caps).  
5. Same core powers Flow V2, classic `StepByStepChat`, and Interview/Mock modes.

### Non-goals (v1)

- Replacing authored expert solutions or the problem catalog (they remain RAG gold).  
- Fully open chat with no stage rails.  
- New LLM providers beyond the existing `getUserLLM()` stack.  
- Voice-specific skills (Voice reuses the same Director later).  
- Shipping Deep Agents as a new runtime dependency if JS LangGraph tooling already covers Skills — prefer patterns compatible with current LangChain/LangGraph JS usage; `SKILL.md` packs are first-class either way.

---

## 2. Architecture

```
UI adapters: FlowV2Adapter | ClassicAdapter | InterviewAdapter
                    │  events: start / submit / tick / finish
                    ▼
┌──────────── CoachSupervisor (LangGraph StateGraph) ─────────────┐
│  SessionState + checkpointer (in-process or thread id = session) │
│                                                                   │
│  POLICY TOOLS (TypeScript only — unit-tested)                     │
│    progress_gate · load_profile · write_memory                    │
│    stage_rails · budget_tick · record_outcome                     │
│                                                                   │
│  COACH SKILLS (SKILL.md progressive disclosure + RAG)             │
│    plan-agenda · evaluate-for-level · teach-forward               │
│    mock-probe · session-debrief · profile-reflect                 │
│                                                                   │
│  STORE  CompetencySignal + CoachMemoryNote (Postgres)             │
└───────────────────────────────────────────────────────────────────┘
```

**Hard split:** Skills may propose narrative and next asks. Only `progress_gate` / `budget_tick` / `record_outcome` may advance stages or write mastery outcomes.

Pattern reference: LangChain multi-agent [Skills](https://docs.langchain.com/oss/javascript/langchain/multi-agent/skills) (progressive disclosure of specialized prompts/domain packs).

---

## 3. Module layout

```
ultimate-sd/src/lib/adaptive-coach/
├── index.ts                 # public API for adapters
├── types.ts                 # LearnerProfile, SessionState, AgendaMove, GateDecision
├── graph/
│   └── coach-supervisor.ts  # StateGraph wiring
├── tools/
│   ├── progress-gate.ts     # pure policy
│   ├── stage-rails.ts
│   ├── budget-tick.ts
│   ├── load-profile.ts
│   ├── write-memory.ts
│   └── record-outcome.ts
├── skills/
│   ├── plan-agenda/SKILL.md
│   ├── evaluate-for-level/SKILL.md
│   ├── teach-forward/SKILL.md
│   ├── mock-probe/SKILL.md
│   ├── session-debrief/SKILL.md
│   └── profile-reflect/SKILL.md
├── rag/
│   └── retrieve-gold.ts     # expert solution + step chunks
├── adapters/
│   ├── flow-v2.ts
│   ├── classic.ts
│   └── interview.ts
└── __tests__/
```

Feature flag key: `adaptiveCoach`. When off, existing `/api/ai/evaluate` and help paths behave byte-identically.

---

## 4. Core types

```ts
type PracticeMode = 'practice' | 'mock';
type ExperienceLevel = 'fresher' | 'sde1' | 'sde2' | 'senior';

type LearnerProfile = {
  userId: string;
  level: ExperienceLevel;
  targetRole?: string;
  companies: string[];
  intent: 'interview' | 'upskill' | 'learn' | '';
  interviewDate?: string; // ISO date
  competencies: CompetencySignal[];
  memoryNotes: MemoryNote[]; // hydrated cap: last 20 (~≤4k tokens)
};

type CompetencySignal = {
  skillId: string; // e.g. 'caching' | 'consistency' | 'api-design'
  earned: number;  // 0..1
  coached: number; // 0..1
  updatedAt: string;
};

type MemoryNote = {
  id: string;
  text: string;      // ≤200 tokens intent
  tags: string[];
  problemSlug?: string;
  createdAt: string;
};

type AgendaMove = {
  id: string;
  kind: 'ask' | 'probe' | 'teach' | 'skip' | 'advance';
  prompt: string;
  skillFocus: string[];
  source: 'rail' | 'rag' | 'planner';
};

type GateDecision = {
  action: 'pass' | 'retry' | 'teach_forward' | 'advance_budget' | 'end_mock';
  reason: string;
  threshold?: number;
  tipSkillId?: 'teach-forward';
};

type SessionState = {
  version: 'adaptive-1';
  mode: PracticeMode;
  problemSlug: string;
  stageId: string;
  agenda: AgendaMove[];
  attempts: Record<string, number>;
  stageStartedAt: string;
  sessionBudgetSec: number;
  status: 'running' | 'complete' | 'summary-error';
};
```

---

## 5. Policy tools (invariants)

### 5.1 `progress_gate` (pure)

Inputs: `mode`, `level`, `score`, `accuracy`, `attempts`, `stageElapsedSec`, `stageBudgetSec`, `sessionRemainingSec`.

Calibration (initial constants — tune behind flag):

| Mode × level | Pass score | Max tries / stage |
|--------------|------------|-------------------|
| practice · fresher/learn | ≥ 5 | 3 |
| practice · sde1 / mid | ≥ 6 | 3 |
| practice · sde2 | ≥ 7 | 2 |
| practice · senior | ≥ 7 | 2 |
| mock · fresher | ≥ 6 | 2 |
| mock · sde1/sde2 | ≥ 7 | 2 |
| mock · senior | ≥ 8 | 2 |

Decision order:

1. Mock + session/stage timer exhausted → `end_mock`.  
2. Stage budget elapsed (practice) → `advance_budget`.  
3. `score ≥ threshold` → `pass`. Accuracy remains in the feedback payload for UI but does **not** gate advance in v1 (avoids double-penalty with calibrated score).  
4. `attempts < max` → `retry`.  
5. Else → `teach_forward`.

**Replace** the evaluate route’s hardcoded `isAcceptable: score >= 7 && accuracy >= 70` when Adaptive Coach is on. The model still returns raw `score`/`accuracy`; the tool computes acceptability.

### 5.2 `stage_rails`

Maps problem → ordered stages from existing Flow V2 journey / `getPracticeSteps`. Declares `budgetMinutes` per stage from difficulty × level. Allows **skip** only when AgendaPlanner emits `kind: 'skip'` and policy permits (practice only; competency already high).

### 5.3 `budget_tick`

Called on timer ticks / stage entry. Emits soft warnings in practice; hard `end_mock` in mock when session budget hits 0.

### 5.4 `load_profile` / `write_memory` / `record_outcome`

- Missing profile → defaults: `level: 'sde1'`, intent from onboarding or `'upskill'`, empty competencies.  
- `record_outcome(earned | coached)` updates competency + optional StepSubmission metadata (`gateAction`, `outcome`).  
- Memory writes are non-blocking on session completion.

---

## 6. Coach skills

Each skill is a directory with `SKILL.md` (YAML frontmatter `name` + `description` + instructions). The supervisor loads **skill metadata** always and full body **only when invoked** (progressive disclosure).

| Skill | When | Output |
|-------|------|--------|
| `plan-agenda` | Session start + after gate advance | 1–3 `AgendaMove`s; schema-validated |
| `evaluate-for-level` | On submit | Strengths/weaknesses/missed + raw score/accuracy; receives profile pack |
| `teach-forward` | Gate = teach_forward | One focused tip grounded in RAG gold; no full solution dump |
| `mock-probe` | Mock after pass (optional) | 1 adversarial probe; 2–3 round cap (align with existing probe constants) |
| `session-debrief` | Mock/session end | Summary for UI + PDF |
| `profile-reflect` | Session end (async ok) | 0–3 memory notes + competency deltas |

**Deterministic fallback:** if `plan-agenda` fails, emit the current stage’s rail prompt as a single `ask` move. Never invent a bare chat with no stage.

**RAG:** `retrieve-gold(problemSlug, stageId, skillFocus[])` pulls from expert solutions + relevant `PROBLEM_STEPS` / Flow V2 tips — read-only.

---

## 7. Turn data flow

### Practice

```
start → load_profile → stage_rails → plan-agenda
submit → evaluate-for-level → progress_gate
  pass           → record_outcome(earned) → plan-agenda (next)
  retry          → tighter ask (reuse / refresh agenda)
  teach_forward  → teach-forward skill → record_outcome(coached) → advance
  advance_budget → coach note → advance
```

### Mock

```
start → load_profile → stage_rails (lite|full) → plan-agenda (stricter)
submit → evaluate-for-level → [mock-probe?] → progress_gate
tick / TIME_EXPIRED → end_mock → session-debrief → profile-reflect
```

No HelpAssistant during mock (existing interview rule). Incomplete work is a signal; do not grind past T=0.

### Context pack (every skill invoke)

Compact profile (~1–2k tokens) + active skill instructions + current rail + last 1–2 answers + RAG chunks + rolling session digest. Do **not** dump full chat forever or all skill bodies at once.

---

## 8. Persistence

### User fields (extend)

- `experienceLevel` (`String`, default `''` → resolved to `sde1` in `load_profile`)  
- `targetRole` (`String?`)  
- `interviewDate` (`DateTime?`)

Existing: `targetCompanies`, `preferredDifficulty`, `focusAreas`, `practiceIntent`, `onboardingCompleted`.

### New models

```
CompetencySignal  userId · skillId · earned · coached · updatedAt  @@unique([userId, skillId])
CoachMemoryNote   id · userId · text · tags[] · problemSlug? · createdAt
```

Hydrate at most last 20 notes into the profile pack.

### Session

Store adaptive `SessionState` in `PracticeSession.flowState` (Flow V2) or a versioned JSON sibling for classic (`adaptiveState`), keyed `version: 'adaptive-1'`.

### Submissions

Reuse `StepSubmission`; add nullable `gateAction` + `outcome` (`earned` | `coached`) when Adaptive Coach is on.

---

## 9. API / adapter seam

Prefer one server entry that adapters call:

- `POST /api/ai/coach/turn` — `{ event, sessionId, problemSlug, mode, payload }` → `{ sessionState, ui: { agenda, feedback, gate, tip } }`  
- Or server actions mirroring the same contract from Flow V2 / classic.

Evaluate bridge: when flag on, classic `/api/ai/evaluate` may delegate scoring to `evaluate-for-level` + `progress_gate` so both UIs stay consistent. Flag off → legacy prompt + hardcoded `isAcceptable`.

Funding: unchanged — `getUserLLM()` / `canUseAI()` / credits. Skill invokes consume the same AI budget as today’s evaluate/help.

---

## 10. Errors and resilience

| Failure | Behavior |
|---------|----------|
| Skill LLM error | Fallback rail agenda; surface retryable UI error for evaluate |
| Evaluate provider 429/502 | Same as today — no fake score, no advance |
| Memory write fail | Log; session still completes |
| Missing profile | Safe defaults (§5.4) |
| RAG miss | Skill proceeds with rail context only |

Telemetry (PostHog): `coach_turn`, `skillId`, `gateAction`, `outcome`, latency, mode, level — no raw answer bodies in analytics.

---

## 11. Testing

1. **ProgressGate matrix** — mode × level × score × tries × elapsed (product invariant).  
2. StageRails budgets and allowed skips.  
3. Skill output Zod schemas + planner fallback.  
4. Profile hydrate/merge and memory cap.  
5. Adapter smoke: Flow V2 submit and classic evaluate both hit CoachSupervisor when flag on.  
6. E2E: practice — fail N times → teach_forward → advances within stage budget; mock — timer → debrief without HelpAssistant.

Definition of done for “time-lie fixed”: for a default mid/sde1 practice TinyURL run, median session wall-clock ≤ advertised budget + 20% under flag-on A/B, with ≥1 teach_forward path exercised in tests.

---

## 12. Rollout phases

| Phase | Deliverable |
|-------|-------------|
| P0 | Types, ProgressGate, StageRails, profile fields, flag dark |
| P1 | CoachSupervisor + evaluate-for-level + gate wired into Flow V2 |
| P2 | plan-agenda + teach-forward + RAG; competency outcomes |
| P3 | Cross-session memory + profile-reflect; classic adapter |
| P4 | Mock/Interview adapter + mock-probe + session-debrief |

Each phase ships flag-dark; enable per-user for dogfood before plan-wide.

---

## 13. Risks

| Risk | Mitigation |
|------|------------|
| Skills reopen rewrite loops | Gate is code; skills cannot set `isAcceptable` |
| Context cost / latency | Progressive skill load; compact profile; rolling digest |
| Dual UI drift | Shared `/coach/turn` contract; adapters only map UI |
| Over-soft practice underprepares | Mock mode keeps hard bar; mastery shows earned vs coached |
| Skill sprawl | Cap at the six named skills in v1 |

---

## 14. Open points deferred to implementation plan

- Exact `FEATURE_INTENDED_PLANS` for `adaptiveCoach` (seed target assumed: platform + lifetime + ai).  
- Whether Deep Agents JS package is adopted or Skills are loaded via a thin in-repo loader compatible with Agent Skills frontmatter.  
- Canonical `skillId` taxonomy list (seed ~12 system-design competencies).
