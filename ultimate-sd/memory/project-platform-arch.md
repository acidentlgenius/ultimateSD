---
name: project-platform-arch
description: Platform tech stack — Next.js 14, Prisma, Neon, pnpm, auth, feature flags
metadata:
  type: project
---

# Platform Architecture

## Stack
- **Framework:** Next.js 14 with App Router
- **Dev bundler:** Turbopack (fast HMR)
- **Package manager:** pnpm
- **Database:** Neon (Postgres) via Prisma ORM
- **Auth:** next-auth v5
- **Styling:** Tailwind CSS + shadcn/ui components
- **Analytics:** PostHog
- **AI:** Anthropic Claude (via LangGraph for structured flows)
- **Voice:** OpenAI Whisper (transcription) + TTS

## Key Source Paths

```
src/app/                    App router pages
src/components/             Shared UI components (V1)
src/features/               Feature modules (V2 goes here)
src/lib/                    Business logic, AI, utilities
src/app/api/                API routes
src/app/actions/            Server actions
prisma/schema.prisma        DB schema
```

## Feature Flag System

Feature flags are per-user, stored in DB. The `canAccessFeature(userId, feature)` function in `src/lib/feature-flags-server.ts` is the gate.

Current flags relevant to V2:
- `problemFlowV2` — enables canvas UI
- `aiProbe` — enables AI probing in V1
- `interviewMode` — enables interview mode
- `voiceInterview` — enables voice

## Authentication Pattern

```typescript
const session = await auth();
if (!session?.user?.id) redirect('/login?callbackUrl=...');
```

`session.user.id` is always available after this check.

## Prisma Usage

```typescript
import { prisma } from '@/lib/prisma';
// Prisma client is a singleton via lib/prisma.ts
```

## Problem Library

All problems defined in `src/lib/problems.ts` as `PROBLEMS: SystemDesignProblem[]`.
Per-problem step data in `src/lib/problem-steps.ts`.
V2 canvas data will live in `src/features/problem-flow-v2/data/canvas-data.ts`.
