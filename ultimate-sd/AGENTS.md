# AGENTS.md — SysDesignAI (`ultimate-sd`)

> Operational briefing for autonomous coding agents (Jules, Cursor, Codex, and peers).
> Read this file before planning or editing. Prefer these instructions over generic defaults.

---

## At a glance

| Field | Value |
|---|---|
| **Product** | SysDesignAI — AI-powered system design interview practice |
| **Stack** | Next.js 16 · React 19 · TypeScript 5.9 · Prisma 7 · PostgreSQL |
| **AI** | LangChain + LangGraph · Google Gemini `gemini-2.5-flash-lite` |
| **Auth** | NextAuth v5 (Google OAuth + credentials) |
| **Payments** | Razorpay (India) |
| **UI** | Tailwind CSS 4 · shadcn/ui · Geist fonts |
| **Tests** | Vitest 4 · Testing Library · jsdom · Playwright E2E |
| **Package manager** | `pnpm` (preferred). `npm` works. Do not use `yarn`. |
| **Path alias** | `@/*` → `src/*` |

---

## Environment setup (Jules VM)

Run these commands in order when bootstrapping a fresh environment:

```bash
pnpm install          # runs postinstall → prisma generate
```

Create a minimal `.env` at the repo root so `build` and Prisma can run:

```bash
cat > .env <<'EOF'
DATABASE_URL="postgresql://user:pass@localhost:5432/sysdesignai?schema=public"
AUTH_SECRET="jules-dev-secret-at-least-32-characters-long"
GOOGLE_API_KEY="optional-for-ai-routes"
EOF
```

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Build, Prisma, runtime | **Build fails without it** (`scripts/check-env.ts` exits 1) |
| `AUTH_SECRET` | NextAuth | Any 32+ char string for local/CI |
| `GOOGLE_API_KEY` | AI routes | Optional in tests; routes degrade gracefully without it |
| `RAZORPAY_*` | Checkout | Optional — checkout disabled when missing |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client checkout | Optional |

Do **not** commit `.env`, `.env.local`, or any file containing API keys.

For production deployment details, see [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md).

---

## Commands

Use these exact commands. Do not invent alternatives.

```bash
# Development
pnpm dev                          # http://localhost:3000

# Quality gate (run before marking work complete)
pnpm lint                         # ESLint (eslint-config-next)
pnpm test run                     # Vitest — single non-watch pass
pnpm build                        # check-env + next build (type-check included)

# Run a single test file
pnpm test run src/lib/__tests__/fetchUtils.test.ts

# E2E (PostgreSQL required; seeds test@e2e.sysdesignai.local)
npx prisma db push
pnpm test:e2e
pnpm test:e2e -- e2e/smoke.spec.ts
pnpm test:e2e:ui

# Run tests matching a name
pnpm test run -t "renders the home page"

# Database
npx prisma generate               # Regenerate client after schema changes
npx prisma db push                # Apply schema locally (no migration file)
npx prisma studio                 # Visual DB browser
```

**Definition of done:** `pnpm lint && pnpm test run && pnpm build` all pass with no new warnings in changed files. Run `pnpm test:e2e` when touching user-facing flows.

---

## Architecture

```
Browser (React client components)
    │
    ├─ Practice flow ──► StepByStepChat / DiagramCanvas / HelpAssistant
    │                         │
    │                         └─ fetchWithRetry ──► /api/ai/*
    │
    ├─ Session state ──► localStorage (src/lib/session-storage.ts)
    │
    └─ Auth ──► NextAuth (src/auth.ts) ──► Prisma ──► PostgreSQL

Server
    ├─ App Router pages      src/app/**
    ├─ API routes            src/app/api/**
    ├─ Server actions        src/app/actions/**
    ├─ AI orchestration      src/lib/langgraph.ts, help-langgraph.ts, user-llm.ts
    ├─ Access control        src/lib/access.ts, src/lib/plans.ts
    └─ Prisma client         src/lib/prisma.ts (Pg adapter)
```

### Practice phases (domain model)

Problems progress through structured phases:

`Requirements → HLD → LLD → Trade-offs → Scalability`

- Problem definitions live in `src/lib/problems.ts`.
- Free-tier problems are listed in `FREE_PROBLEM_SLUGS` (`src/lib/plans.ts`).
- Step submissions and progress persist server-side via Prisma; in-session draft state uses `localStorage`.

### Subscription tiers

| Plan | `planType` | Access |
|---|---|---|
| Free | `free` | Free problems only; limited AI |
| Platform | `platform` | All problems |
| AI | `ai` | All problems + monthly AI credits (`AI_MONTHLY_CREDITS`) |

Access logic is centralized in `src/lib/access.ts`. **Never duplicate gating checks** in components — call `canAccessProblem`, `canUseAI`, or read session token fields from `auth()`.

---

## AI agents & services in this codebase

This repo contains several AI-backed agents. Jules should understand their roles and boundaries.

### 1. Interview Agent (`src/lib/langgraph.ts`)

- **Purpose:** Simulates a FAANG system design interviewer during practice.
- **Entry:** `POST /api/ai/chat`
- **Model:** `gemini-2.5-flash-lite` via `getUserLLM()` or server `GOOGLE_API_KEY`.
- **I/O:** Accepts problem context, phase, message history; returns conversational `ChatMessage`.
- **Constraint:** Responses must stay under ~150 words; probe decisions, do not solve.

### 2. Evaluation Agent (`src/app/api/ai/evaluate/route.ts`)

- **Purpose:** Scores user answers per phase with strengths, weaknesses, and missed points.
- **Entry:** `POST /api/ai/evaluate`
- **Constraint:** Evaluation is phase-scoped — do not leak answers from future phases.

### 3. Help Assistant (`src/lib/help-langgraph.ts` + `src/components/HelpAssistant.tsx`)

- **Purpose:** Context-aware hints without revealing full solutions.
- **Entry:** `POST /api/ai/help`
- **Context inputs:** `currentPhase`, `completedSteps`, `savedStepData`, `conversationHistory`.
- **Hard rules (never violate):** No complete architectures, no copy-pasteable answers, no implementation code. Socratic guidance only.
- **Docs:** [`HELP_ASSISTANT_DOCS.md`](./HELP_ASSISTANT_DOCS.md)

### 4. User LLM resolver (`src/lib/user-llm.ts`)

- **Purpose:** Selects LLM source per user: BYOK key → platform credits → server key.
- **Throws:** `AIAccessError` when access denied — API routes must catch and return 402/403, not 500.
- **Never** return `geminiApiKey` / `xaiApiKey` to the client.

---

## Code conventions

### TypeScript & React

- **Strict mode** is on. Fix type errors; do not `@ts-ignore` without a comment explaining why.
- Use **function components** only. No class components.
- Prefer **Server Components** by default; add `"use client"` only when hooks, browser APIs, or event handlers are required.
- Place **imports at the top** of every file. No inline/dynamic imports unless breaking a documented circular dependency.
- For discriminated unions and enums, use **exhaustive `switch`** with a `never` default case.
- Path alias: always `@/lib/foo`, never relative `../../lib/foo` from deep trees.

### Styling & UI

- Follow [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — the single source of truth for tokens, typography, and glass effects.
- Use existing shadcn primitives in `src/components/ui/`.
- Geist Sans for UI; Geist Mono for code and numeric data.
- Reuse utility classes (`.glass`, `.glass-card`, `.gradient-text`) before inventing new patterns.

### API routes

- Authenticate with `auth()` from `@/auth` before mutating user data.
- Use `fetchWithRetry` from `@/lib/fetchUtils` for outbound HTTP — never raw `fetch` without timeout/`AbortController`.
- Group related Prisma writes in `prisma.$transaction([...])` for atomicity.
- Return structured JSON errors: `{ error: string }` with appropriate HTTP status.

### Prisma

- Schema: `prisma/schema.prisma`. Config: `prisma.config.ts`.
- Client uses `@prisma/adapter-pg` with a `pg` Pool — do not switch to the default Prisma engine without discussion.
- After schema edits: `npx prisma generate` then `npx prisma db push` (or create a migration if the team requests it).

### Error handling

- `localStorage` JSON parse failures: log, then `localStorage.removeItem(key)` so the UI can recover on next render.
- AI timeouts: surface user-visible errors; never leave components in infinite loading state.

---

## Testing

Tests live beside source in `__tests__/` directories. Config: `vitest.config.ts`, setup: `test-setup.ts`.

```bash
pnpm test run                     # full suite
pnpm test run --reporter=verbose  # debug failures
```

### Required mocks for Server Components / Next.js

When testing pages or components that import auth, Prisma, or server actions, mock these modules:

```typescript
vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    // add only models the test touches
  },
}));
```

Also mock browser APIs already handled globally in `test-setup.ts` (`matchMedia`, `ResizeObserver`, `IntersectionObserver`).

### What to test

- **Do** test user-visible behavior, access gating, localStorage recovery, and pure utilities.
- **Do** add a test when fixing a regression (see learnings in [`.jules/squash.md`](./.jules/squash.md)).
- **Do not** call live LLM APIs in tests — mock `getUserLLM` or the route handler.
- **Do not** require a running PostgreSQL instance for unit tests.

Reference tests:

| Area | Example |
|---|---|
| Server page render | `src/app/page.test.tsx` |
| Component + localStorage | `src/components/__tests__/DiagramCanvas.test.tsx` |
| Fetch utility | `src/lib/__tests__/fetchUtils.test.ts` |
| Session storage | `src/components/__tests__/session-storage.test.ts` |
| E2E guest smoke | `e2e/smoke.spec.ts` |
| E2E auth + practice | `e2e/auth.spec.ts`, `e2e/practice.spec.ts` |
| E2E roadmap unlocks | `e2e/roadmap.spec.ts` |

---

## Do not touch

| Path / artifact | Reason |
|---|---|
| `.env`, `.env.local` | Secrets — never read, commit, or log |
| `.next/`, `node_modules/` | Generated / installed |
| `src/prisma_debug_4.d.ts` | Debug artifact; eslint-ignored |
| User API keys in DB | `geminiApiKey`, `xaiApiKey` — server-only, never expose |
| `FREE_PROBLEM_SLUGS` without product sign-off | Affects monetization |
| Razorpay webhook signature verification | Security-critical — do not weaken |

---

## Key files map

| Concern | Location |
|---|---|
| Auth & session | `src/auth.ts` |
| Prisma client | `src/lib/prisma.ts` |
| Plans & pricing | `src/lib/plans.ts`, `src/components/landing/PricingSection.tsx` |
| Access control | `src/lib/access.ts` |
| Problems catalog | `src/lib/problems.ts` |
| Practice UI shell | `src/components/PracticeUI.tsx` |
| Step-by-step flow | `src/components/StepByStepChat.tsx` |
| Diagram canvas | `src/components/DiagramCanvas.tsx` (Excalidraw wrapper) |
| Diagram context | `src/components/diagram/DiagramCanvasContext.tsx` — wrap practice/draw trees with `DiagramCanvasProvider` |
| Diagram persistence | `src/lib/diagram-persistence.ts` — localStorage, `resolveBestDiagramSnapshot`, `exportSceneToPng` |
| Session persistence | `src/lib/session-storage.ts` |
| PDF export | `src/lib/exportUtils.ts` |
| Progress server actions | `src/app/actions/progress.ts` |
| Env validation | `scripts/check-env.ts` |

---

## Git & pull requests

- Branch from `main`: `feature/<short-description>` or `fix/<short-description>`.
- Keep PRs focused — one concern per PR.
- Commit messages: imperative mood, present tense (`Add retry to help route`, not `Added`).
- Do **not** commit unless explicitly asked.
- Do **not** force-push `main`.
- Update this `AGENTS.md` in the same PR when you introduce a new convention, agent, or build step.

---

## Known pitfalls (from prior Jules runs)

Recorded in [`.jules/squash.md`](./.jules/squash.md). Highlights:

1. **Vitest + RSC:** Mock `@/auth`, `@/lib/prisma`, and server actions before rendering Server Components.
2. **Hanging fetches:** Always use `fetchWithRetry` with timeouts for AI and external calls.
3. **Prisma partial writes:** Use `$transaction` for multi-step progress/XP updates.
4. **Corrupt localStorage:** Remove bad keys on parse failure, don't leave poisoned state.

---

## Documentation index

| Doc | When to read |
|---|---|
| [`README.md`](./README.md) | Human onboarding |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Any UI work |
| [`HELP_ASSISTANT_DOCS.md`](./HELP_ASSISTANT_DOCS.md) | Help assistant changes |
| [`SESSION_PERSISTENCE.md`](./SESSION_PERSISTENCE.md) | localStorage session behavior |
| [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) | Deployment & env vars |
| [`.jules/squash.md`](./.jules/squash.md) | Past agent learnings |

---

## Agent behavior contract

When working in this repository:

1. **Read before write** — inspect neighboring files and match existing patterns.
2. **Minimize diff scope** — change only what the task requires.
3. **Run the quality gate** — lint, test, build before declaring done.
4. **Preserve product boundaries** — Help Assistant hints only; Evaluation scores only; Interview probes only.
5. **Prefer extension over reinvention** — reuse `access.ts`, `user-llm.ts`, shadcn components, and design tokens.
6. **Ask via plan, not code** — if requirements are ambiguous, note assumptions in the plan rather than guessing architecture.

---

*Last updated: June 2026 · Maintained alongside codebase conventions.*
