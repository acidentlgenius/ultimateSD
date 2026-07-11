# SysDesignAI (Ultimate SD) — Complete Application Documentation

> **Generated:** 2026-07-10  
> **Product:** SysDesignAI — AI-powered system design interview practice  
> **Production URL:** https://ultimate-sd.vercel.app  
> **Repository path:** `ultimate-sd/`  

---

## Document Purpose

This document is the authoritative, end-to-end reference for the SysDesignAI application.
It covers product intent, information architecture, every user-facing route, UI/UX patterns,
interaction flows, state management, backend contracts, AI behavior, billing, and operational
concerns. It is written for engineers, designers, product managers, and technical writers who
need to understand or extend the platform without reading the entire codebase.

### How to Use This Document

| Audience | Start here |
|----------|------------|
| New engineer onboarding | §1 Product Overview → §3 Architecture → §5 Route Map |
| Designer / UX | §7 Design System → §8 Global Chrome → §9–§20 Page UX |
| Backend / API work | §4 Data Model → §22 API Reference → §23 Server Actions |
| AI / prompt work | §24 AI Agents → §25 Evaluation Rubrics |
| Content author | §27 Problem Catalog → §28 Step Journey Authoring |
| QA / E2E | §30 User Journeys → §31 Edge Cases → §32 Testing |

### Table of Contents

- [1. Product Overview](#1.-product-overview)
- [2. Technology Stack](#2.-technology-stack)
- [3. System Architecture](#3.-system-architecture)
- [4. Data Model (PostgreSQL / Prisma)](#4.-data-model-postgresql--prisma)
- [5. Complete Route Map](#5.-complete-route-map)
- [6. Navigation & Information Architecture](#6.-navigation--information-architecture)
- [7. Design System & Visual Language](#7.-design-system--visual-language)
- [8. Global Chrome (Header, Theme, Toasts)](#8.-global-chrome-header,-theme,-toasts)
- [9. Landing Page & Dashboard UX](#9.-landing-page--dashboard-ux)
- [10. Problems Catalog UX](#10.-problems-catalog-ux)
- [11. Practice Session — Shell Layout](#11.-practice-session--shell-layout)
- [12. Practice Session — Step-by-Step Flow](#12.-practice-session--step-by-step-flow)
- [13. Practice Session — Input Types & Widgets](#13.-practice-session--input-types--widgets)
- [14. Practice Session — Diagram Canvas](#14.-practice-session--diagram-canvas)
- [15. Practice Session — Help Assistant](#15.-practice-session--help-assistant)
- [16. Practice Session — Evaluation & Feedback](#16.-practice-session--evaluation--feedback)
- [17. Practice Session — Timer & Tour](#17.-practice-session--timer--tour)
- [18. Interview Mode](#18.-interview-mode)
- [19. Voice Interview](#19.-voice-interview)
- [20. Roadmap Feature](#20.-roadmap-feature)
- [21. Guides & Educational Content](#21.-guides--educational-content)
- [22. API Reference](#22.-api-reference)
- [23. Server Actions Reference](#23.-server-actions-reference)
- [24. AI Agents & LLM Resolution](#24.-ai-agents--llm-resolution)
- [25. Evaluation Rubrics & Scoring](#25.-evaluation-rubrics--scoring)
- [26. Interactive Widget Catalog](#26.-interactive-widget-catalog)
- [27. Problem Catalog (All 86 Problems)](#27.-problem-catalog-all-86-problems)
- [28. Step Journey Authoring](#28.-step-journey-authoring)
- [29. Authentication & Account Flows](#29.-authentication--account-flows)
- [30. Subscription, Billing & Access Control](#30.-subscription,-billing--access-control)
- [31. Session Persistence & State](#31.-session-persistence--state)
- [32. Gamification & Progress](#32.-gamification--progress)
- [33. Profile, History & Session Review](#33.-profile,-history--session-review)
- [34. Settings & BYOK](#34.-settings--byok)
- [35. Admin Panel](#35.-admin-panel)
- [36. Custom Problems & Free Draw](#36.-custom-problems--free-draw)
- [37. Onboarding & First-Run UX](#37.-onboarding--first-run-ux)
- [38. Complete User Journey Catalog](#38.-complete-user-journey-catalog)
- [39. Mobile & Responsive UX](#39.-mobile--responsive-ux)
- [40. Error States & Recovery](#40.-error-states--recovery)
- [41. Feature Flags](#41.-feature-flags)
- [42. Testing Strategy](#42.-testing-strategy)
- [43. Deployment & Environment](#43.-deployment--environment)
- [44. File Index & Key Modules](#44.-file-index--key-modules)
- [45. Glossary](#45.-glossary)

---

## 1. Product Overview

### 1.1 Mission

SysDesignAI helps software engineers prepare for system design interviews at top technology
companies. Unlike static blog posts or video courses, the product simulates a **live interview**:
users work through structured phases (Requirements → HLD → LLD → Trade-offs → Scalability),
draw architecture diagrams on an Excalidraw canvas, receive **AI evaluation** on each answer,
and can ask a **Socratic help assistant** for hints without receiving full solutions.

### 1.2 Core Value Propositions

1. **Structured practice** — Every problem follows an interview-realistic phase progression.
2. **AI feedback** — Per-step scoring with strengths, weaknesses, and missed points.
3. **Interactive learning** — 49 embedded simulations (rate limiters, consistent hashing, RAG, etc.).
4. **Visual design** — Excalidraw diagram canvas integrated into HLD/LLD steps.
5. **Progress tracking** — Server-side sessions, spaced repetition, roadmaps, XP/levels.
6. **Flexible AI funding** — Platform credits, BYOK (7 providers), or hybrid.

### 1.3 Product Metrics (Content)

| Metric | Value |
|--------|-------|
| Total problems | 86 |
| Free-tier problems | 8 |
| Interactive widgets | 49 |
| Practice phases (full) | 5 |
| Guides (published) | 8 |
| Roadmap tracks | 5 (1 feature-flagged) |

### 1.4 Subscription Tiers

| Plan | Price (INR) | Problem access | AI access |
|------|-------------|----------------|-----------|
| Free | ₹0 | 8 starter problems | 20 monthly credits on free problems; BYOK fallback |
| Platform | ₹299/mo | All problems | BYOK required for AI |
| Lifetime | ₹1,999 one-time | All problems (never expires) | BYOK required for AI |
| AI | ₹699/mo | All problems | 500 monthly credits + BYOK fallback |

### 1.5 Primary User Personas

**Interview prep candidate** — Has 4–8 weeks before FAANG interviews. Uses daily pick,
roadmap, and timed interview mode. Cares about realistic feedback and diagram practice.

**Upskilling engineer** — Already employed; uses distributed cache, rate limiter, and
advanced problems to deepen knowledge. May use guides + widgets heavily.

**Fresher / campus hire** — Follows fresher roadmap track. Starts with TinyURL, parking lot,
elevator. Needs gentler lite step journeys on easy problems.

**Platform power user** — Brings own API keys (Gemini, OpenAI, etc.). Wants all problems
without recurring AI subscription cost.

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI library | React 19 |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Fonts | Geist Sans, Geist Mono (next/font) |
| Database | PostgreSQL via Prisma 7 (@prisma/adapter-pg) |
| Auth | NextAuth v5 (JWT strategy, Prisma adapter) |
| AI orchestration | LangChain + LangGraph |
| Default LLM | Google Gemini 2.5 Flash Lite |
| Diagrams | Excalidraw (dynamic import, SSR disabled) |
| Payments | Razorpay (INR) |
| Email | Resend (verification, password reset) |
| Analytics | PostHog (client events) |
| Unit tests | Vitest 4 + Testing Library + jsdom |
| E2E tests | Playwright |
| Package manager | pnpm 11+ |
| Node | 22+ (.nvmrc) |

## 3. System Architecture

```
Browser (React Client Components)
    │
    ├─ Practice ──► PracticeUI / StepByStepChat / DiagramCanvas / HelpAssistant
    │                    │
    │                    └─ fetchWithRetry ──► /api/ai/*
    │
    ├─ Session drafts ──► localStorage (session-storage.ts, diagram-persistence.ts)
    │
    └─ Auth ──► NextAuth (auth.ts) ──► Prisma ──► PostgreSQL

Server
    ├─ App Router pages          src/app/**
    ├─ API routes                src/app/api/**
    ├─ Server actions            src/app/actions/**
    ├─ AI orchestration          langgraph.ts, help-langgraph.ts, user-llm.ts
    ├─ Access control            access.ts, plans.ts
    └─ Prisma client             prisma.ts (Pg Pool adapter)
```

### 3.1 Rendering Strategy

- **Default:** React Server Components (RSC) for pages that fetch auth/DB data.
- **Client components:** Any UI with hooks, browser APIs, event handlers, or Excalidraw.
- **No route middleware:** Auth is enforced per-page via `auth()` + redirects.
- **Path alias:** `@/*` → `src/*`

### 3.2 Cross-Cutting Concerns

| Concern | Central module | Rule |
|---------|----------------|------|
| Problem access | `access.ts` → `canAccessProblem` | Never duplicate gating in components |
| AI access | `access.ts` → `canUseAI` | API routes catch `AIAccessError` → 402/403 |
| Feature flags | `feature-flags-server.ts` | DB-driven; seed dark by default |
| HTTP outbound | `fetchUtils.ts` | Always use `fetchWithRetry` with timeout |
| BYOK keys | `user-llm.ts` | Never expose raw keys to client |

## 5. Complete Route Map

### Route: `/`

- **Purpose:** Home / Dashboard
- **Authentication:** Public
- **Key components:** DashboardClient, Hero, ProblemExplorer

#### UX entry points

Users reach `/` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/problems`

- **Purpose:** Problem library browser
- **Authentication:** Public
- **Key components:** ProblemExplorer

#### UX entry points

Users reach `/problems` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/practice/[slug]`

- **Purpose:** Core practice session
- **Authentication:** Auth required
- **Key components:** PracticeUI

#### UX entry points

Users reach `/practice/[slug]` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/custom`

- **Purpose:** Custom problem builder
- **Authentication:** Public
- **Key components:** Form → custom practice

#### UX entry points

Users reach `/custom` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/custom/practice`

- **Purpose:** Practice custom problem
- **Authentication:** Auth + paid
- **Key components:** PracticeUI

#### UX entry points

Users reach `/custom/practice` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/draw`

- **Purpose:** Free Excalidraw canvas
- **Authentication:** Public
- **Key components:** DiagramCanvas

#### UX entry points

Users reach `/draw` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/roadmap`

- **Purpose:** Learning roadmap
- **Authentication:** Public
- **Key components:** RoadmapClient

#### UX entry points

Users reach `/roadmap` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/guides`

- **Purpose:** Guide index
- **Authentication:** Public
- **Key components:** Guide cards

#### UX entry points

Users reach `/guides` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/guides/[slug]`

- **Purpose:** Guide article
- **Authentication:** Public
- **Key components:** GuideWidgetEmbed

#### UX entry points

Users reach `/guides/[slug]` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/interview`

- **Purpose:** Interview hub
- **Authentication:** Auth required
- **Key components:** InterviewHubClient

#### UX entry points

Users reach `/interview` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/share/debrief/[token]`

- **Purpose:** Shared debrief
- **Authentication:** Public
- **Key components:** InterviewDebriefViewer

#### UX entry points

Users reach `/share/debrief/[token]` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/pricing`

- **Purpose:** Subscription plans
- **Authentication:** Public
- **Key components:** PricingClient

#### UX entry points

Users reach `/pricing` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/login`

- **Purpose:** Sign in
- **Authentication:** Public
- **Key components:** Credentials + Google OAuth

#### UX entry points

Users reach `/login` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/signup`

- **Purpose:** Create account
- **Authentication:** Public
- **Key components:** Signup form

#### UX entry points

Users reach `/signup` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/forgot-password`

- **Purpose:** Password reset request
- **Authentication:** Public
- **Key components:** Email form

#### UX entry points

Users reach `/forgot-password` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/reset-password`

- **Purpose:** Set new password
- **Authentication:** Public
- **Key components:** Token + password form

#### UX entry points

Users reach `/reset-password` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/profile`

- **Purpose:** User profile & stats
- **Authentication:** Auth required
- **Key components:** ProfileHeader, HistoryList

#### UX entry points

Users reach `/profile` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/profile/history/[sessionId]`

- **Purpose:** Session detail
- **Authentication:** Auth required
- **Key components:** SessionPhaseReview

#### UX entry points

Users reach `/profile/history/[sessionId]` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/settings`

- **Purpose:** Account settings
- **Authentication:** Auth required
- **Key components:** SettingsClient

#### UX entry points

Users reach `/settings` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/admin`

- **Purpose:** Admin dashboard
- **Authentication:** ADMIN role
- **Key components:** AdminDashboard

#### UX entry points

Users reach `/admin` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/whats-new`

- **Purpose:** Changelog
- **Authentication:** Public
- **Key components:** WHATS_NEW_ENTRIES

#### UX entry points

Users reach `/whats-new` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/privacy`

- **Purpose:** Privacy policy
- **Authentication:** Public
- **Key components:** Static

#### UX entry points

Users reach `/privacy` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.

### Route: `/terms`

- **Purpose:** Terms of service
- **Authentication:** Public
- **Key components:** Static

#### UX entry points

Users reach `/terms` via global navigation, deep links, CTAs on landing pages,
or post-auth redirects (`callbackUrl`).

#### Loading & error behavior

- Server pages call `auth()` before rendering protected content.
- Practice routes use `practice/[slug]/error.tsx` for problem-not-found.
- Global `error.tsx` and `global-error.tsx` catch unhandled errors.


## 7. Design System & Visual Language

Source of truth: `DESIGN_SYSTEM.md` + `src/app/globals.css`

### 7.1 Typography

| Token | Size | Usage |
|-------|------|-------|
| Geist Sans | 16px body | All UI text, headings |
| Geist Mono | — | Code, IDs, pricing numbers |
| `--type-lg` | 20px | Section headings |
| `--type-md` | 16px | Body default |
| `--type-sm` | 14px | Metadata, captions |

Heading line-height: `1.1` with `-0.02em` letter-spacing for modern tight tracking.
Body line-height: `1.6` for readability.

### 7.2 Color System (Light Mode)

| Role | HSL | Usage |
|------|-----|-------|
| background | `hsl(220 17% 97%)` | Page background |
| foreground | `hsl(222.2 84% 4.9%)` | Primary text |
| primary | `hsl(221.2 83.2% 53.3%)` | CTAs, active states (Blue-600) |
| card | `hsl(0 0% 100%)` | Elevated surfaces |
| muted-foreground | `hsl(215.4 16.3% 46.9%)` | Secondary text |
| destructive | `hsl(0 84.2% 60.2%)` | Errors, delete |
| border | `hsl(214.3 31.8% 91.4%)` | Dividers, inputs |

### 7.3 Color System (Dark Mode)

Dark mode uses deep blue-black backgrounds (`hsl(224 71% 4%)`) with brighter primary
(`hsl(217.2 91.2% 59.8%)`). Theme toggled via `next-themes` `ThemeProvider` with
`attribute="class"` and `defaultTheme="system"`.

### 7.4 Glassmorphism

`.glass` — sticky header backdrop: `backdrop-blur-xl`, semi-transparent background.
`.glass-card` — interactive cards: blur + hover lift (`translateY(-4px)`) + primary border glow.

### 7.5 Animations

| Class | Effect |
|-------|--------|
| `.animate-fade-in` | Opacity + translateY entry |
| `.animate-slide-in` | Slide from left |
| `.animate-slide-up` | List item entry |
| `.animate-float` | Hero decorative motion |
| `.animate-shimmer` | Skeleton loading |
| `.animate-confetti` | Feedback modal celebration |

### 7.6 Component Patterns

- **Primary button:** Solid `primary` background, `radius-md`
- **Ghost button:** Secondary actions, reduces visual noise
- **Badge:** Phase labels, difficulty, interview variant
- **Sheet:** Mobile sidebar (practice), left slide-in `w-80`
- **Dialog:** Feedback modal, solution gating, confirmations
- **Toast (sonner):** XP awards, timer warnings, payment success

## 11. Practice Session — Shell Layout

The practice experience is the product core. `PracticeUI` wraps all sub-components.

### 11.1 Layout ASCII

```
┌──────────────────────────────────────────────────────────────────┐
│ MOBILE HEADER (md:hidden)                                      │
│ [☰ Menu]  Problem Title                              [Theme]     │
├──────────────┬───────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT (flex-1, overflow-y-auto)          │
│ w-80 fixed   │                                                   │
│ (md:flex)    │  ┌─ VoicePanel (conditional) ─────────────────┐  │
│              │  │ StepByStepChat [data-tour=chat]            │  │
│ • Title      │  │  - Phase badge                             │  │
│ • Badges     │  │  - Step title + prompt                     │  │
│ • Timer      │  │  - Input (list/textarea/schema)            │  │
│ • Phase nav  │  │  - Widget (optional)                       │  │
│ • Step list  │  │  - Submit / Skip / Back                    │  │
│ • Footer     │  └────────────────────────────────────────────┘  │
│   actions    │  ┌─ DiagramCanvas [data-tour=canvas] ─────────┐  │
│              │  │ Excalidraw 600px (when diagram step)       │  │
│              │  └────────────────────────────────────────────┘  │
├──────────────┴───────────────────────────────────────────────────┤
│ HelpAssistant FAB (bottom-right) [data-tour=help]                │
│ PracticeTour overlay (first visit)                               │
└──────────────────────────────────────────────────────────────────┘
```

### 11.2 Sidebar Sections

**Header block**
- Problem title (truncated on mobile)
- Category theme icon from `getThemeForProblem()`
- Interview badge when `?interview=lite|full|voice`

**Timer block** (`TimerWidget`)
- Practice: count-up with pause; server-synced when authenticated
- Interview: strict countdown

**Step navigation** (`data-tour="steps"`)
- Phases grouped with Roman-style numbered labels
- Each step: circle indicator (empty / in-progress / complete)
- Click dispatches `sd-navigate-step` custom event

**Footer actions**
- View Solution (gated)
- Practice Aloud toggle
- Start Interview dialog
- End Interview (interview mode)
- Export PDF
- Take the tour

### 11.3 Mobile Adaptations

- Sidebar hidden; hamburger opens `Sheet` from left
- Tour spotlight on sidebar steps may be zero-size → tour falls back to centered card
- Help assistant panel scales to viewport
- Diagram canvas full-width; 600px height when visible

## 12. Practice Session — Step-by-Step Flow

`StepByStepChat.tsx` owns journey state machine.

### 12.1 State Variables

| State | Type | Purpose |
|-------|------|---------|
| `currentPhase` | string | Active phase key (e.g. `requirements`) |
| `currentStepIndex` | number | Index within phase steps array |
| `savedStepData` | Map | Draft + submitted content per step key |
| `completedSteps` | Set | Steps that passed evaluation |
| `showFeedback` | boolean | Locks inputs during feedback review |
| `sessionInit` | boolean | Parent session ready gate |

### 12.2 Step Key Format

`{phaseKey}-{stepIndex}` — e.g. `hld-1` for second HLD step.
Built via `buildStepKey()` in `step-journey.ts`.

### 12.3 Navigation Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Submit | Primary CTA | AI evaluate → feedback modal |
| Continue | Feedback modal | `handleNext()` advance |
| Skip | Skip button | Save empty draft, no evaluation |
| Back | Back button | Previous step or prior phase last step |
| Sidebar jump | Step button | Free navigation to any step |
| Start Over | Sidebar | Abandon session, clear localStorage |

### 12.4 Phase Progression (Default Full Journey)

**Requirements** (`requirements`)
- Step 0: subStep `functional`
- Step 1: subStep `non-functional`
- Step 2: subStep `constraints`

**HLD** (`hld`)
- Step 0: subStep `api`
- Step 1: subStep `data-model`
- Step 2: subStep `architecture`

**LLD** (`lld`)
- Step 0: subStep `components`
- Step 1: subStep `data-flow`

**Trade-offs** (`tradeoffs`)
- Step 0: subStep `decisions`
- Step 1: subStep `bottlenecks`

**Scalability** (`scalability`)
- Step 0: subStep `scaling`
- Step 1: subStep `monitoring`

### 12.5 Resume Logic

On page load with existing DB session:
1. `getActiveSession(problemId)` fetches submissions + completed step IDs
2. `reconstructFromSubmissions()` rebuilds `savedStepData`
3. `findResumePosition()` lands **after** furthest completed step
4. Green 'Session restored' banner shows for 5 seconds

Rationale: skipped steps remain reachable until everything beyond them is done.

## 16. Practice Session — Evaluation & Feedback

### 16.1 Evaluation Pipeline

```
User clicks Submit
    → Serialize input (list join / textarea / schema JSON)
    → Append diagram description if diagram sub-step
    → POST /api/ai/evaluate
        → auth() + getUserLLM()
        → resolveEvaluationPhaseKey + resolveEvaluationSubStepKey
        → Inject EVALUATION_GUIDES rubric + expert solution context
        → Gemini JSON response
        → Zod validate (1 retry on malformed)
    → isAcceptable = score >= 7 AND accuracy >= 70
```

### 16.2 FeedbackModal UX

- **Pass:** confetti animation, strengths list, XP toast (+20), streak update
- **Fail:** weaknesses + missed points; persistent red banner when modal closed
- **Probe (optional):** `ProbePanel` — adversarial follow-ups via `/api/ai/chat?mode=probe`

### 16.3 Error vs Fail Distinction

| Outcome | UI | Data written |
|---------|-----|--------------|
| Fail (low score) | Red feedback modal | Submission recorded |
| Network/AI error | Amber banner | Nothing recorded |
| Auth/credits denied | Toast + upgrade CTA | Nothing recorded |

## 26. Interactive Widget Catalog

Total widgets: **49**. Registered in `src/components/widgets/registry.tsx`.
Dynamically imported via `next/dynamic` with `WidgetLoader` fallback.

### Widget: `encoding-visualizer`

- **Component:** `EncodingVisualizer.tsx`
- **Purpose:** URL/base62 encoding for short links
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `capacity-calculator`

- **Component:** `CapacityCalculator.tsx`
- **Purpose:** Back-of-envelope capacity math
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `fanout-visualizer`

- **Component:** `FanoutVisualizer.tsx`
- **Purpose:** Fan-out write patterns
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `feed-ranking-simulator`

- **Component:** `FeedRankingSimulator.tsx`
- **Purpose:** Feed ranking signals
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `quadtree-visualizer`

- **Component:** `QuadTreeVisualizer.tsx`
- **Purpose:** Spatial indexing for maps
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `abr-simulator`

- **Component:** `ABRSimulator.tsx`
- **Purpose:** Adaptive bitrate streaming
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `e2e-encryption-demo`

- **Component:** `E2EEncryptionDemo.tsx`
- **Purpose:** End-to-end encryption flows
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `feed-architect`

- **Component:** `FeedArchitect.tsx`
- **Purpose:** News feed architecture builder
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `inverted-index-visualizer`

- **Component:** `InvertedIndexVisualizer.tsx`
- **Purpose:** Search inverted index
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `chunking-dedupe-demo`

- **Component:** `ChunkingDedupeDemo.tsx`
- **Purpose:** File chunking and deduplication
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `rate-limiter-demo`

- **Component:** `RateLimiterDemo.tsx`
- **Purpose:** Token bucket / sliding window
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `cache-visualizer`

- **Component:** `CacheVisualizer.tsx`
- **Purpose:** Cache hit/miss patterns
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `trie-visualizer`

- **Component:** `TrieVisualizer.tsx`
- **Purpose:** Prefix tree for typeahead
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `snowflake-demo`

- **Component:** `SnowflakeDemo.tsx`
- **Purpose:** Distributed ID generation
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `leaderboard-simulation`

- **Component:** `LeaderboardSimulation.tsx`
- **Purpose:** Real-time leaderboard updates
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `notification-system-demo`

- **Component:** `NotificationSystemDemo.tsx`
- **Purpose:** Push/email/SMS fan-out
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `metrics-dashboard`

- **Component:** `MetricsDashboard.tsx`
- **Purpose:** Observability dashboards
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `consistent-hashing-demo`

- **Component:** `ConsistentHashingDemo.tsx`
- **Purpose:** Ring hashing for sharding
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `load-balancer-visualizer`

- **Component:** `LoadBalancerVisualizer.tsx`
- **Purpose:** LB algorithms
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `message-queue-visualizer`

- **Component:** `MessageQueueVisualizer.tsx`
- **Purpose:** Queue consumers/producers
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `cdn-map`

- **Component:** `CDNMap.tsx`
- **Purpose:** CDN edge caching geography
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `crawler-frontier`

- **Component:** `CrawlerFrontier.tsx`
- **Purpose:** Web crawler URL frontier
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `dfs-visualizer`

- **Component:** `DFSVisualizer.tsx`
- **Purpose:** Graph traversal
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `leader-election-demo`

- **Component:** `LeaderElectionDemo.tsx`
- **Purpose:** Raft/Paxos concepts
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `config-propagator`

- **Component:** `ConfigPropagator.tsx`
- **Purpose:** Config rollout propagation
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `secret-vault`

- **Component:** `SecretVault.tsx`
- **Purpose:** Secrets management
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `pipeline-visualizer`

- **Component:** `PipelineVisualizer.tsx`
- **Purpose:** Data/CI pipelines
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `service-mesh-viz`

- **Component:** `ServiceMeshViz.tsx`
- **Purpose:** Sidecar proxy mesh
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `graphql-playground`

- **Component:** `GraphQLPlayground.tsx`
- **Purpose:** GraphQL schema explorer
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `rest-explorer`

- **Component:** `RESTExplorer.tsx`
- **Purpose:** REST API design
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `socket-pulse`

- **Component:** `SocketPulse.tsx`
- **Purpose:** WebSocket real-time pulses
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `ot-visualizer`

- **Component:** `OTVisualizer.tsx`
- **Purpose:** Operational transformation
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `rtb-simulator`

- **Component:** `RTBSimulator.tsx`
- **Purpose:** Real-time bidding
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `feed-ranker`

- **Component:** `FeedRanker.tsx`
- **Purpose:** ML feed ranking
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `feature-toggle-demo`

- **Component:** `FeatureToggleDemo.tsx`
- **Purpose:** Feature flag rollout
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `sidecar-visualizer`

- **Component:** `SidecarVisualizer.tsx`
- **Purpose:** Sidecar pattern
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `trace-waterfall`

- **Component:** `TraceWaterfall.tsx`
- **Purpose:** Distributed tracing waterfall
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `audit-log-visualizer`

- **Component:** `AuditLogVisualizer.tsx`
- **Purpose:** Compliance audit logs
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `privacy-request-manager`

- **Component:** `PrivacyRequestManager.tsx`
- **Purpose:** GDPR data requests
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `blockchain-demo`

- **Component:** `BlockchainDemo.tsx`
- **Purpose:** Blockchain ledger basics
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `vector-db-visualizer`

- **Component:** `VectorDBVisualizer.tsx`
- **Purpose:** Vector similarity search
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `rag-architect`

- **Component:** `RAGArchitect.tsx`
- **Purpose:** RAG pipeline design
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `agent-orchestrator`

- **Component:** `AgentOrchestrator.tsx`
- **Purpose:** Multi-agent orchestration
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `job-scheduler-viz`

- **Component:** `JobSchedulerViz.tsx`
- **Purpose:** Distributed job scheduling
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `flash-sale-demo`

- **Component:** `FlashSaleDemo.tsx`
- **Purpose:** Flash sale traffic spike
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `payment-ledger`

- **Component:** `PaymentLedger.tsx`
- **Purpose:** Payment ledger consistency
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `bloom-filter-viz`

- **Component:** `BloomFilterViz.tsx`
- **Purpose:** Probabilistic membership
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `parking-gate-race`

- **Component:** `ParkingGateRace.tsx`
- **Purpose:** Concurrency race conditions
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer

### Widget: `elevator-dispatch-sim`

- **Component:** `ElevatorDispatchSim.tsx`
- **Purpose:** Elevator dispatch algorithms
- **Used in:** Practice steps (`widgetId` on `StepData`), guide pages (`GuideWidgetEmbed`), landing (`FeatureShowcase` for select widgets)

#### UX behavior

- Renders inline above the step input area in `StepByStepChat`
- Does not gate submission — supplementary learning aid
- Interactive controls (sliders, buttons, animations) run client-side only
- No data sent to evaluation unless user references widget insights in their answer


## 27. Problem Catalog (All 86 Problems)

Problems defined in `src/lib/problems.ts`. Steps attached at runtime from `problem-steps.ts`.

### Category: Advanced (33 problems)

#### Design Facebook News Feed

| Field | Value |
|-------|-------|
| Slug | `design-facebook-news-feed` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Meta, LinkedIn |
| Practice URL | `/practice/design-facebook-news-feed` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design Google Search

| Field | Value |
|-------|-------|
| Slug | `design-google-search` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Google, Bing |
| Practice URL | `/practice/design-google-search` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Blockchain System

| Field | Value |
|-------|-------|
| Slug | `design-blockchain-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Bitcoin, Ethereum |
| Practice URL | `/practice/design-blockchain-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Brain-Computer Interface

| Field | Value |
|-------|-------|
| Slug | `design-brain-computer-interface` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Neuralink, Kernel |
| Practice URL | `/practice/design-brain-computer-interface` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a CDN

| Field | Value |
|-------|-------|
| Slug | `design-cdn` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Cloudflare, Akamai |
| Practice URL | `/practice/design-cdn` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Collaborative Editor

| Field | Value |
|-------|-------|
| Slug | `design-collaborative-editor` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Google Docs, Notion |
| Practice URL | `/practice/design-collaborative-editor` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Data Lake

| Field | Value |
|-------|-------|
| Slug | `design-data-lake` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | AWS, Azure |
| Practice URL | `/practice/design-data-lake` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Data Warehouse

| Field | Value |
|-------|-------|
| Slug | `design-data-warehouse` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | Redshift, BigQuery |
| Practice URL | `/practice/design-data-warehouse` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Disaster Recovery System

| Field | Value |
|-------|-------|
| Slug | `design-disaster-recovery-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | AWS DR, Azure DR |
| Practice URL | `/practice/design-disaster-recovery-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Distributed Cache (Redis-like) **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-distributed-cache` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Redis Labs, Amazon |
| Practice URL | `/practice/design-distributed-cache` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design a Distributed File System

| Field | Value |
|-------|-------|
| Slug | `design-distributed-file-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | HDFS, Ceph |
| Practice URL | `/practice/design-distributed-file-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Distributed Tracing System

| Field | Value |
|-------|-------|
| Slug | `design-distributed-tracing-system` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | Jaeger, Zipkin |
| Practice URL | `/practice/design-distributed-tracing-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Event-Driven Architecture

| Field | Value |
|-------|-------|
| Slug | `design-event-driven-architecture` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | Eventbrite, Stripe |
| Practice URL | `/practice/design-event-driven-architecture` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Flash Sale System

| Field | Value |
|-------|-------|
| Slug | `design-flash-sale-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Ticketmaster, Amazon |
| Practice URL | `/practice/design-flash-sale-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Global Supply Chain Optimizer

| Field | Value |
|-------|-------|
| Slug | `design-global-supply-chain-optimizer` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | DHL, Amazon |
| Practice URL | `/practice/design-global-supply-chain-optimizer` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a High-Availability System

| Field | Value |
|-------|-------|
| Slug | `design-high-availability-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Netflix, Amazon |
| Practice URL | `/practice/design-high-availability-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Key-Value Store

| Field | Value |
|-------|-------|
| Slug | `design-key-value-store` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | Redis, DynamoDB |
| Practice URL | `/practice/design-key-value-store` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Leader Election System

| Field | Value |
|-------|-------|
| Slug | `design-leader-election-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | ZooKeeper, etcd |
| Practice URL | `/practice/design-leader-election-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Metaverse Platform

| Field | Value |
|-------|-------|
| Slug | `design-metaverse-platform` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Meta, Decentraland |
| Practice URL | `/practice/design-metaverse-platform` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Microservices Architecture

| Field | Value |
|-------|-------|
| Slug | `design-microservices-architecture` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Netflix, Uber |
| Practice URL | `/practice/design-microservices-architecture` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Quantum Computing System

| Field | Value |
|-------|-------|
| Slug | `design-quantum-computing-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | IBM Quantum, Google Quantum |
| Practice URL | `/practice/design-quantum-computing-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Real-Time Analytics System

| Field | Value |
|-------|-------|
| Slug | `design-real-time-analytics-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Snowflake, Databricks |
| Practice URL | `/practice/design-real-time-analytics-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Saga Pattern Implementation

| Field | Value |
|-------|-------|
| Slug | `design-saga-pattern-implementation` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Microservices patterns |
| Practice URL | `/practice/design-saga-pattern-implementation` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Service Mesh

| Field | Value |
|-------|-------|
| Slug | `design-service-mesh` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Istio, Linkerd |
| Practice URL | `/practice/design-service-mesh` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Task Scheduler

| Field | Value |
|-------|-------|
| Slug | `design-task-scheduler` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Airflow, Kubernetes |
| Practice URL | `/practice/design-task-scheduler` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Typeahead Suggestion **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-typeahead-suggestion` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | Google, Amazon |
| Practice URL | `/practice/design-typeahead-suggestion` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design a Vector Database

| Field | Value |
|-------|-------|
| Slug | `design-vector-database` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | Pinecone, Weaviate |
| Practice URL | `/practice/design-vector-database` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Video Call System

| Field | Value |
|-------|-------|
| Slug | `design-video-call` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Zoom, Google Meet |
| Practice URL | `/practice/design-video-call` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Web Crawler

| Field | Value |
|-------|-------|
| Slug | `design-web-crawler` |
| Difficulty | Medium |
| Category | Advanced |
| Companies | Google, Bing |
| Practice URL | `/practice/design-web-crawler` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design an AR/VR System

| Field | Value |
|-------|-------|
| Slug | `design-ar-vr-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Oculus, Magic Leap |
| Practice URL | `/practice/design-ar-vr-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design an Ad Serving System

| Field | Value |
|-------|-------|
| Slug | `design-ad-serving-system` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | Google Ads, Meta Ads |
| Practice URL | `/practice/design-ad-serving-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design an Autonomous Agent Orchestrator

| Field | Value |
|-------|-------|
| Slug | `design-autonomous-agent-orchestrator` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | OpenAI, Anthropic |
| Practice URL | `/practice/design-autonomous-agent-orchestrator` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design an IoT Platform

| Field | Value |
|-------|-------|
| Slug | `design-iot-platform` |
| Difficulty | Hard |
| Category | Advanced |
| Companies | AWS IoT, Google IoT |
| Practice URL | `/practice/design-iot-platform` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

### Category: Basics (22 problems)

#### Design TinyURL **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-tinyurl` |
| Difficulty | Easy |
| Category | Basics |
| Companies | Amazon, Google |
| Practice URL | `/practice/design-tinyurl` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design a Backup and Recovery System

| Field | Value |
|-------|-------|
| Slug | `design-backup-recovery-system` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Veeam, Commvault |
| Practice URL | `/practice/design-backup-recovery-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Blue-Green Deployment

| Field | Value |
|-------|-------|
| Slug | `design-blue-green-deployment` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Deployment strategies |
| Practice URL | `/practice/design-blue-green-deployment` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a CI/CD Pipeline

| Field | Value |
|-------|-------|
| Slug | `design-ci-cd-pipeline` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Jenkins, GitLab CI |
| Practice URL | `/practice/design-ci-cd-pipeline` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Circuit Breaker Pattern

| Field | Value |
|-------|-------|
| Slug | `design-circuit-breaker-pattern` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Netflix Hystrix |
| Practice URL | `/practice/design-circuit-breaker-pattern` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Compliance Auditing System

| Field | Value |
|-------|-------|
| Slug | `design-compliance-auditing-system` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Compliance tools |
| Practice URL | `/practice/design-compliance-auditing-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Configuration Management System

| Field | Value |
|-------|-------|
| Slug | `design-configuration-management-system` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Consul, Spring Cloud Config |
| Practice URL | `/practice/design-configuration-management-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a ETL Pipeline

| Field | Value |
|-------|-------|
| Slug | `design-etl-pipeline` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Talend, Informatica |
| Practice URL | `/practice/design-etl-pipeline` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Feature Flag System

| Field | Value |
|-------|-------|
| Slug | `design-feature-flag-system` |
| Difficulty | Medium |
| Category | Basics |
| Companies | LaunchDarkly, Split |
| Practice URL | `/practice/design-feature-flag-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a GDPR Compliant System

| Field | Value |
|-------|-------|
| Slug | `design-gdpr-compliant-system` |
| Difficulty | Medium |
| Category | Basics |
| Companies | EU regulations |
| Practice URL | `/practice/design-gdpr-compliant-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Load Balancer

| Field | Value |
|-------|-------|
| Slug | `design-load-balancer` |
| Difficulty | Medium |
| Category | Basics |
| Companies | AWS ELB, NGINX |
| Practice URL | `/practice/design-load-balancer` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Logging System

| Field | Value |
|-------|-------|
| Slug | `design-logging-system` |
| Difficulty | Medium |
| Category | Basics |
| Companies | ELK Stack, Splunk |
| Practice URL | `/practice/design-logging-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Metrics Monitoring System

| Field | Value |
|-------|-------|
| Slug | `design-metrics-monitoring` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Prometheus, Grafana |
| Practice URL | `/practice/design-metrics-monitoring` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Parking Lot System **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-parking-lot` |
| Difficulty | Easy |
| Category | Basics |
| Companies | Local Systems |
| Practice URL | `/practice/design-parking-lot` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design a REST API

| Field | Value |
|-------|-------|
| Slug | `design-rest-api` |
| Difficulty | Easy |
| Category | Basics |
| Companies | Twitter, GitHub |
| Practice URL | `/practice/design-rest-api` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Secret Management System

| Field | Value |
|-------|-------|
| Slug | `design-secret-management-system` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Vault, AWS Secrets Manager |
| Practice URL | `/practice/design-secret-management-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Strangler Fig Migration

| Field | Value |
|-------|-------|
| Slug | `design-strangler-fig-migration` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Migration strategies |
| Practice URL | `/practice/design-strangler-fig-migration` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Sustainable Data Center

| Field | Value |
|-------|-------|
| Slug | `design-sustainable-data-center` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Google, Microsoft |
| Practice URL | `/practice/design-sustainable-data-center` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Unique ID Generator **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-unique-id-generator` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Twitter, Meta, Amazon |
| Practice URL | `/practice/design-unique-id-generator` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design a Zero-Trust Network

| Field | Value |
|-------|-------|
| Slug | `design-zero-trust-network` |
| Difficulty | Medium |
| Category | Basics |
| Companies | Google, Microsoft |
| Practice URL | `/practice/design-zero-trust-network` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design an Elevator System **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-elevator-system` |
| Difficulty | Easy |
| Category | Basics |
| Companies | Building Systems |
| Practice URL | `/practice/design-elevator-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design an LRU Cache

| Field | Value |
|-------|-------|
| Slug | `design-lru-cache` |
| Difficulty | Easy |
| Category | Basics |
| Companies | Google, Amazon, Meta |
| Practice URL | `/practice/design-lru-cache` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

### Category: Core Services (14 problems)

#### Design Dropbox **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-dropbox` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Dropbox, Google Drive |
| Practice URL | `/practice/design-dropbox` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design Instagram

| Field | Value |
|-------|-------|
| Slug | `design-instagram` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Meta, Snapchat |
| Practice URL | `/practice/design-instagram` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design Netflix

| Field | Value |
|-------|-------|
| Slug | `design-netflix` |
| Difficulty | Hard |
| Category | Core Services |
| Companies | Netflix, Amazon |
| Practice URL | `/practice/design-netflix` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design Twitter

| Field | Value |
|-------|-------|
| Slug | `design-twitter` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Twitter, Meta |
| Practice URL | `/practice/design-twitter` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design Uber

| Field | Value |
|-------|-------|
| Slug | `design-uber` |
| Difficulty | Hard |
| Category | Core Services |
| Companies | Uber, Lyft |
| Practice URL | `/practice/design-uber` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design WhatsApp **[FREE]**

| Field | Value |
|-------|-------|
| Slug | `design-whatsapp` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Meta, Signal |
| Practice URL | `/practice/design-whatsapp` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Free for all authenticated users.

#### Design YouTube

| Field | Value |
|-------|-------|
| Slug | `design-youtube` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Netflix, YouTube |
| Practice URL | `/practice/design-youtube` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a File Storage System

| Field | Value |
|-------|-------|
| Slug | `design-file-storage` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | AWS S3, Google Drive |
| Practice URL | `/practice/design-file-storage` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a GraphQL API

| Field | Value |
|-------|-------|
| Slug | `design-graphql-api` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | GitHub, Shopify |
| Practice URL | `/practice/design-graphql-api` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Message Queue

| Field | Value |
|-------|-------|
| Slug | `design-message-queue` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Kafka, RabbitMQ |
| Practice URL | `/practice/design-message-queue` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Notification System

| Field | Value |
|-------|-------|
| Slug | `design-notification-system` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Slack, Gmail |
| Practice URL | `/practice/design-notification-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Payment System

| Field | Value |
|-------|-------|
| Slug | `design-payment-system` |
| Difficulty | Hard |
| Category | Core Services |
| Companies | Stripe, PayPal |
| Practice URL | `/practice/design-payment-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Scalable API Gateway

| Field | Value |
|-------|-------|
| Slug | `design-scalable-api-gateway` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Kong, Apigee |
| Practice URL | `/practice/design-scalable-api-gateway` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a WebSocket System

| Field | Value |
|-------|-------|
| Slug | `design-websocket-system` |
| Difficulty | Medium |
| Category | Core Services |
| Companies | Slack, Discord |
| Practice URL | `/practice/design-websocket-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

### Category: Edge Cases (5 problems)

#### Design A/B Testing Framework

| Field | Value |
|-------|-------|
| Slug | `design-ab-testing` |
| Difficulty | Medium |
| Category | Edge Cases |
| Companies | Google, Meta |
| Practice URL | `/practice/design-ab-testing` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Carbon Footprint Tracker

| Field | Value |
|-------|-------|
| Slug | `design-carbon-footprint-tracker` |
| Difficulty | Medium |
| Category | Edge Cases |
| Companies | Green tech |
| Practice URL | `/practice/design-carbon-footprint-tracker` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Leaderboard

| Field | Value |
|-------|-------|
| Slug | `design-leaderboard` |
| Difficulty | Medium |
| Category | Edge Cases |
| Companies | Gaming, Sports |
| Practice URL | `/practice/design-leaderboard` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Rate Limiter

| Field | Value |
|-------|-------|
| Slug | `design-rate-limiter` |
| Difficulty | Medium |
| Category | Edge Cases |
| Companies | API Providers |
| Practice URL | `/practice/design-rate-limiter` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Space Debris Tracking System

| Field | Value |
|-------|-------|
| Slug | `design-space-debris-tracking-system` |
| Difficulty | Medium |
| Category | Edge Cases |
| Companies | NASA, ESA |
| Practice URL | `/practice/design-space-debris-tracking-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

### Category: ML-Infused (12 problems)

#### Design Fraud Detection System

| Field | Value |
|-------|-------|
| Slug | `design-fraud-detection` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | PayPal, Stripe |
| Practice URL | `/practice/design-fraud-detection` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design Personalized Search Ranking

| Field | Value |
|-------|-------|
| Slug | `design-personalized-search` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | Google, Bing |
| Practice URL | `/practice/design-personalized-search` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Climate Model Simulator

| Field | Value |
|-------|-------|
| Slug | `design-climate-model-simulator` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | NOAA, IPCC |
| Practice URL | `/practice/design-climate-model-simulator` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Conversational AI Platform

| Field | Value |
|-------|-------|
| Slug | `design-conversational-ai-platform` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | Dialogflow, Rasa |
| Practice URL | `/practice/design-conversational-ai-platform` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Federated Learning System

| Field | Value |
|-------|-------|
| Slug | `design-federated-learning-system` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | Google, Apple |
| Practice URL | `/practice/design-federated-learning-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Generative AI Content Moderator

| Field | Value |
|-------|-------|
| Slug | `design-generative-ai-content-moderator` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | OpenAI, Stability AI |
| Practice URL | `/practice/design-generative-ai-content-moderator` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Multi-Modal Search Engine

| Field | Value |
|-------|-------|
| Slug | `design-multi-modal-search-engine` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | Google, Bing |
| Practice URL | `/practice/design-multi-modal-search-engine` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Personalized Feed

| Field | Value |
|-------|-------|
| Slug | `design-personalized-feed` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | TikTok, Instagram |
| Practice URL | `/practice/design-personalized-feed` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Personalized Learning Platform

| Field | Value |
|-------|-------|
| Slug | `design-personalized-learning-platform` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | Coursera, Khan Academy |
| Practice URL | `/practice/design-personalized-learning-platform` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a RAG System

| Field | Value |
|-------|-------|
| Slug | `design-rag-system` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | LangChain, Pinecone |
| Practice URL | `/practice/design-rag-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design a Recommendation Engine

| Field | Value |
|-------|-------|
| Slug | `design-recommendation-engine` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | Netflix, Amazon |
| Practice URL | `/practice/design-recommendation-engine` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.

#### Design an Explainable AI System

| Field | Value |
|-------|-------|
| Slug | `design-explainable-ai-system` |
| Difficulty | Hard |
| Category | ML-Infused |
| Companies | OpenAI, Google |
| Practice URL | `/practice/design-explainable-ai-system` |

**Typical user flow:** Browse → click card → auth (if needed) → plan check → PracticeUI.

**Step journey:** Custom steps if defined in `PROBLEM_STEPS['{slug}']`; else generic
fallback based on difficulty/tags (full / lite / OOD).

**Diagram steps:** Present when journey includes `architecture`, `data-flow`, `high-level`, or `diagram` sub-steps.

**Access:** Requires Platform, Lifetime, or AI plan.


## 38. Complete User Journey Catalog

### Journey A: Guest quick start

1. **Start:** `/`
2. **Trigger:** Hero 'Start Solving'
3. **Destination:** `/practice/design-tinyurl`
4. **Outcome:** Login redirect → practice

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey B: Browse problems

1. **Start:** `/`
2. **Trigger:** ProblemExplorer card click
3. **Destination:** `/practice/[slug]`
4. **Outcome:** ProModal if locked

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey C: SEO problems page

1. **Start:** `/problems`
2. **Trigger:** Same explorer
3. **Destination:** `/practice/[slug]`
4. **Outcome:** Progress overlay if logged in

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey D: Beginner track

1. **Start:** `/`
2. **Trigger:** StartHereTrack
3. **Destination:** `/practice/design-tinyurl`
4. **Outcome:** Sequential free problems

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey E: Roadmap guided

1. **Start:** `/roadmap`
2. **Trigger:** Unlocked node click
3. **Destination:** `/practice/[slug]`
4. **Outcome:** Progress-gated unlocks

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey F: Guide to practice

1. **Start:** `/guides/[slug]`
2. **Trigger:** Bottom CTA
3. **Destination:** `/practice/[slug]`
4. **Outcome:** Read + simulate first

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey G: Interview mode

1. **Start:** `/interview`
2. **Trigger:** Pick variant
3. **Destination:** `/practice/[slug]?interview=`
4. **Outcome:** Timed, no help

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey H: Custom problem

1. **Start:** `/custom`
2. **Trigger:** Submit form
3. **Destination:** `/custom/practice`
4. **Outcome:** Paid plan required

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey I: Free canvas

1. **Start:** `/draw`
2. **Trigger:** Hero or nav
3. **Destination:** `/draw`
4. **Outcome:** No auth, PNG export

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey J: Upgrade path

1. **Start:** `any locked`
2. **Trigger:** ProModal
3. **Destination:** `/pricing?locked=`
4. **Outcome:** Razorpay checkout

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey K: Onboarding

1. **Start:** `/`
2. **Trigger:** First login
3. **Destination:** `OnboardingModal`
4. **Outcome:** Intent → recommended problem

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey L: Session resume

1. **Start:** `/practice/[slug]`
2. **Trigger:** Return visit
3. **Destination:** `same`
4. **Outcome:** DB restore + banner

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey M: Share debrief

1. **Start:** `/interview`
2. **Trigger:** Share button
3. **Destination:** `/share/debrief/[token]`
4. **Outcome:** Public read-only

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey N: BYOK setup

1. **Start:** `/settings`
2. **Trigger:** API Keys tab
3. **Destination:** `POST /api/user/keys`
4. **Outcome:** Enables AI on platform plan

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)

### Journey O: Admin grant

1. **Start:** `/admin`
2. **Trigger:** Set plan
3. **Destination:** `user table action`
4. **Outcome:** 3-month admin expiry

#### UX states along the path

- Loading spinners on server pages fetching auth/DB
- Redirect chains preserve `callbackUrl` query param
- Toast notifications on success/failure at terminal states
- Empty states with CTAs when no data (e.g. no debriefs yet)


## 22. API Reference

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| POST | `/api/ai/chat` | Interview agent + probe mode | `{ input, slug, messages?, phase?, mode? }` | `{ message, phase, messages }` |
| POST | `/api/ai/evaluate` | Step evaluation | `{ problem, phase, subStep, userAnswer, ... }` | `{ feedback: { score, accuracy, strengths, weaknesses, missed, isAcceptable } }` |
| POST | `/api/ai/help` | Help assistant | `{ problem, messages, currentPhase?, completedSteps?, savedStepData? }` | `{ message }` |
| POST | `/api/auth/signup` | Create account | `{ name?, email, password, callbackUrl? }` | `201 + emailSent` |
| GET | `/api/auth/verify-email` | Verify email | `?token&callbackUrl` | `Redirect /login?verified=1` |
| POST | `/api/auth/resend-verification` | Resend verify | `{ email }` | `{ message }` |
| POST | `/api/auth/forgot-password` | Reset request | `{ email }` | `{ message }` |
| POST | `/api/auth/reset-password` | Set password | `{ token, password }` | `{ message }` |
| POST | `/api/orders` | Create Razorpay order | `{ planType }` | `{ orderId, amount, currency }` |
| POST | `/api/orders/verify` | Verify payment | `{ razorpay_* fields, planType }` | `{ success, planType }` |
| POST | `/api/webhooks/razorpay` | Payment webhook | `Raw Razorpay body` | `{ received: true }` |
| GET/POST | `/api/user/keys` | BYOK keys | `Provider fields` | `Booleans only on GET` |
| POST | `/api/interview/summary` | Interview debrief | `{ slug, answers[], variant? }` | `{ summary, debriefId }` |
| GET | `/api/interview/debriefs` | List debriefs | `—` | `{ debriefs[] }` |
| POST | `/api/interview/share` | Share debrief | `{ debriefId }` | `{ url }` |
| POST | `/api/voice/session` | Start voice session | `{ slug }` | `{ sessionId, question }` |
| POST | `/api/voice/transcribe` | STT | `FormData audio` | `{ transcript }` |
| POST | `/api/voice/reply` | AI voice reply | `{ sessionId, transcript }` | `{ text }` |
| POST | `/api/voice/speak` | TTS | `{ sessionId, text }` | `audio/mpeg` |

## 4. Data Model (PostgreSQL / Prisma)

| Model | Description |
|-------|-------------|
| `User` | Central identity; preferences, gamification, subscription, BYOK keys |
| `Account` | OAuth provider linkage (Google) |
| `Session` | NextAuth DB sessions (JWT strategy; kept for adapter) |
| `VerificationToken` | Email verify + password reset tokens |
| `PracticeSession` | One attempt: timer, status, diagram snapshot, final score |
| `ProblemProgress` | Per-user per-problem rollup; SRS nextRepetitionDate |
| `StepSubmission` | Append-only step answers with feedback JSON |
| `FeatureFlag` | key → enabledPlans[] |
| `FeatureFlagOverride` | Per-user grant/deny |
| `VoiceSession` | Voice interview turns (decoupled FK) |
| `VoiceTurn` | interviewer | candidate transcripts |
| `InterviewDebrief` | Post-interview AI summary JSON |
| `InterviewDebriefShare` | Public share token |
| `LaunchOfferRedemption` | Platform launch / AI giveaway grants |
| `LaunchOfferEntry` | Giveaway eligibility |
| `WaitlistSignup` | Feature waitlist emails |

## 45. Glossary

- **BYOK:** Bring Your Own Key — user supplies LLM API credentials in Settings
- **HLD:** High-Level Design — architecture, APIs, data model
- **LLD:** Low-Level Design — components, data flows, algorithms
- **SRS:** Spaced Repetition System — nextRepetitionDate for review scheduling
- **subStep:** Evaluation rubric key on a StepData entry
- **stepKey:** Unique step identifier: {phaseKey}-{index}
- **Probe:** Adversarial AI follow-up questioning after a passed step
- **Debrief:** Post-interview hiring-committee style summary
- **OOD:** Object-Oriented Design — alternate step journey for tagged problems
- **RSC:** React Server Component
- **ProModal:** Paywall modal for locked problems

## 39. Mobile & Responsive UX

| Breakpoint | Width | UX changes |
|------------|-------|------------|
| `default` | < 640px | Single column; mobile menu; sheet sidebar |
| `sm` | ≥ 640px | Logo subtitle visible |
| `md` | ≥ 768px | Practice sidebar visible; mobile header hidden |
| `lg` | ≥ 1024px | Desktop nav pill bar visible |
| `2xl` | ≥ 1536px | 'AI Powered Practice' badge in header |

### Touch targets

Practice sidebar step buttons, Help FAB, and voice push-to-talk meet minimum 44px touch targets.
Excalidraw canvas supports touch drawing on tablets.

## Appendix A.requirements: Requirements Phase UX Deep Dive

The **Requirements** phase is keyed `requirements` in the step journey.

#### Sub-step: `functional` (step index 0)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the requirements appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'list'` — bullet list UI with add/remove/edit

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.

#### Sub-step: `non-functional` (step index 1)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the requirements appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'list'` — bullet list UI with add/remove/edit

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.

#### Sub-step: `constraints` (step index 2)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the requirements appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'list'` — bullet list UI with add/remove/edit

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.


## Appendix A.hld: HLD Phase UX Deep Dive

The **HLD** phase is keyed `hld` in the step journey.

#### Sub-step: `api` (step index 0)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the hld appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'list'` — bullet list UI with add/remove/edit

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.

#### Sub-step: `data-model` (step index 1)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the hld appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'schema'` — SchemaBuilder visual entity editor

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.

#### Sub-step: `architecture` (step index 2)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the hld appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'textarea'` — free-form prose, min-height 200px

**Diagram canvas:** Visible — user should sketch architecture.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.


## Appendix A.lld: LLD Phase UX Deep Dive

The **LLD** phase is keyed `lld` in the step journey.

#### Sub-step: `components` (step index 0)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the lld appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'textarea'` — free-form prose, min-height 200px

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.

#### Sub-step: `data-flow` (step index 1)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the lld appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'textarea'` — free-form prose, min-height 200px

**Diagram canvas:** Visible — user should sketch architecture.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.


## Appendix A.tradeoffs: Trade-offs Phase UX Deep Dive

The **Trade-offs** phase is keyed `tradeoffs` in the step journey.

#### Sub-step: `decisions` (step index 0)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the trade-offs appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'list'` — bullet list UI with add/remove/edit

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.

#### Sub-step: `bottlenecks` (step index 1)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the trade-offs appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'list'` — bullet list UI with add/remove/edit

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.


## Appendix A.scalability: Scalability Phase UX Deep Dive

The **Scalability** phase is keyed `scalability` in the step journey.

#### Sub-step: `scaling` (step index 0)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the scalability appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'textarea'` — free-form prose, min-height 200px

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.

#### Sub-step: `monitoring` (step index 1)

**Interviewer intent:** Evaluates whether the candidate addresses this dimension
of the scalability appropriately for the problem's scale and constraints.

**Input type mapping:**
- `inputType: 'list'` — bullet list UI with add/remove/edit

**Diagram canvas:** Hidden for this sub-step.

**Evaluation rubric key:** `resolveEvaluationSubStepKey('{ss}')`

**Placeholder guidance:** Shows answer *shape*, not content (e.g. 'e.g. Rate limiting, Caching, CDN').

**Submit disabled when:** Empty input; during `isEvaluating` loading state; when `showFeedback` locks inputs.

**After submit — pass path:** FeedbackModal → XP toast → recordStepSubmission → optional completeSession if last step.

**After submit — fail path:** Modal shows weaknesses; persistent banner; user edits and retries.


## Appendix B: Interview Variant `lite`

- **Duration:** 45 min
- **Steps:** 3 phases compact
- **Help assistant:** Disabled
- **Timer:** Strict countdown; expiry triggers debrief generation
- **Entry URL:** `/practice/[slug]?interview=lite`

#### Minute-by-minute UX expectation (segment 0-3)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 3-6)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 6-9)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 9-12)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 12-15)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 15-18)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 18-21)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 21-24)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 24-27)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 27-30)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 30-33)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 33-36)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 36-39)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 39-42)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 42-45)

User discusses trade-offs or wraps up. End Interview available before timer expiry.


## Appendix B: Interview Variant `full`

- **Duration:** 60 min
- **Steps:** full step set
- **Help assistant:** Disabled
- **Timer:** Strict countdown; expiry triggers debrief generation
- **Entry URL:** `/practice/[slug]?interview=full`

#### Minute-by-minute UX expectation (segment 0-3)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 3-6)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 6-9)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 9-12)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 12-15)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 15-18)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 18-21)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 21-24)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 24-27)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 27-30)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 30-33)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 33-36)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 36-39)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 39-42)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 42-45)

User discusses trade-offs or wraps up. End Interview available before timer expiry.


## Appendix B: Interview Variant `voice`

- **Duration:** 45 min
- **Steps:** lite + VoicePanel
- **Help assistant:** Disabled
- **Timer:** Strict countdown; expiry triggers debrief generation
- **Entry URL:** `/practice/[slug]?interview=voice`

#### Minute-by-minute UX expectation (segment 0-3)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 3-6)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 6-9)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 9-12)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 12-15)

User clarifies requirements and scope. Sidebar shows Requirements phase active.

#### Minute-by-minute UX expectation (segment 15-18)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 18-21)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 21-24)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 24-27)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 27-30)

User sketches HLD on diagram canvas. Timer visible with warning color below 5 min.

#### Minute-by-minute UX expectation (segment 30-33)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 33-36)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 36-39)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 39-42)

User discusses trade-offs or wraps up. End Interview available before timer expiry.

#### Minute-by-minute UX expectation (segment 42-45)

User discusses trade-offs or wraps up. End Interview available before timer expiry.


## 29. Authentication & Account Flows

### Google OAuth

Click Google on /login → OAuth consent → adapter creates/links Account → JWT enriched → redirect callbackUrl

**UX copy:** Errors shown inline on forms; verification success via `?verified=1` query on login.

### Email signup

POST /api/auth/signup → VerificationToken → Resend email → GET verify-email → emailVerified set → /login

**UX copy:** Errors shown inline on forms; verification success via `?verified=1` query on login.

### Email login

credentials provider → bcrypt verify → requires emailVerified → JWT session

**UX copy:** Errors shown inline on forms; verification success via `?verified=1` query on login.

### Forgot password

POST forgot-password → token 1h → /reset-password?token= → POST reset-password

**UX copy:** Errors shown inline on forms; verification success via `?verified=1` query on login.

### Session refresh

JWT callback loads User from DB → toAccessSnapshot → plan/credits in session

**UX copy:** Errors shown inline on forms; verification success via `?verified=1` query on login.


## 44. File Index & Key Modules

- **`src/components/PracticeUI.tsx`** — Practice shell layout, sidebar, cross-component events
- **`src/components/StepByStepChat.tsx`** — Step journey state machine, submit/evaluate
- **`src/components/DiagramCanvas.tsx`** — Excalidraw wrapper, import/export PNG
- **`src/components/HelpAssistant.tsx`** — Floating help chat widget
- **`src/components/FeedbackModal.tsx`** — Evaluation results + confetti
- **`src/components/ProblemExplorer.tsx`** — Searchable problem grid/table
- **`src/components/OnboardingModal.tsx`** — First-login 3-step onboarding
- **`src/components/PracticeTour.tsx`** — First-run practice overlay tour
- **`src/components/TimerWidget.tsx`** — Practice + interview timers
- **`src/components/Header.tsx`** — Global sticky nav
- **`src/lib/access.ts`** — canAccessProblem, canUseAI, canViewExpertSolution
- **`src/lib/plans.ts`** — FREE_PROBLEM_SLUGS, pricing constants
- **`src/lib/langgraph.ts`** — Interview AI agent
- **`src/lib/help-langgraph.ts`** — Help assistant prompts
- **`src/lib/user-llm.ts`** — BYOK + credits LLM resolver
- **`src/lib/step-journey.ts`** — Phase resolution, diagram sub-steps
- **`src/lib/problem-steps.ts`** — Per-problem custom step journeys
- **`src/lib/problems.ts`** — 86 problem definitions
- **`src/lib/solutions.ts`** — Expert solutions for evaluation context
- **`src/lib/session-storage.ts`** — localStorage session drafts
- **`src/lib/diagram-persistence.ts`** — Diagram localStorage + PNG export
- **`src/auth.ts`** — NextAuth configuration
- **`prisma/schema.prisma`** — Database schema

## Appendix C: Per-Route UX State Machines

### `/` — UX States

**Purpose:** Home / Dashboard | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/problems` — UX States

**Purpose:** Problem library browser | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/practice/[slug]` — UX States

**Purpose:** Core practice session | **Auth:** Auth required

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/custom` — UX States

**Purpose:** Custom problem builder | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/custom/practice` — UX States

**Purpose:** Practice custom problem | **Auth:** Auth + paid

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/draw` — UX States

**Purpose:** Free Excalidraw canvas | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/roadmap` — UX States

**Purpose:** Learning roadmap | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/guides` — UX States

**Purpose:** Guide index | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/guides/[slug]` — UX States

**Purpose:** Guide article | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/interview` — UX States

**Purpose:** Interview hub | **Auth:** Auth required

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/share/debrief/[token]` — UX States

**Purpose:** Shared debrief | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/pricing` — UX States

**Purpose:** Subscription plans | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/login` — UX States

**Purpose:** Sign in | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/signup` — UX States

**Purpose:** Create account | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/forgot-password` — UX States

**Purpose:** Password reset request | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/reset-password` — UX States

**Purpose:** Set new password | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/profile` — UX States

**Purpose:** User profile & stats | **Auth:** Auth required

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/profile/history/[sessionId]` — UX States

**Purpose:** Session detail | **Auth:** Auth required

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/settings` — UX States

**Purpose:** Account settings | **Auth:** Auth required

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/admin` — UX States

**Purpose:** Admin dashboard | **Auth:** ADMIN role

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/whats-new` — UX States

**Purpose:** Changelog | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/privacy` — UX States

**Purpose:** Privacy policy | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.

### `/terms` — UX States

**Purpose:** Terms of service | **Auth:** Public

- **initial_load:** Server fetches data; skeleton or spinner if slow.
- **authenticated:** Full feature set for logged-in user with entitlements.
- **unauthenticated:** Public preview or redirect to /login with callbackUrl.
- **error:** Inline error banner or error.tsx boundary; retry CTA.
- **empty:** Empty state illustration + primary CTA (e.g. 'Start first problem').
- **loading:** Client-side loading during mutations (checkout, evaluate).
- **success:** Toast confirmation; navigational handoff to next step.

**Primary CTA hierarchy:** Most important action is visually dominant (primary button).
Secondary actions use ghost/outline variants.


## 9. Landing Page & Dashboard UX

### Section: Hero

Gradient headline, dual CTAs (Start Solving → TinyURL, Free Canvas → /draw), launch offer pill, capability chips (AI feedback, 86+ problems, diagrams). Guest-only.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: UserHero

Logged-in welcome, XP bar, level badge, streak flame, daily pick card, secondary recommendation. Replaces Hero.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: StartHereTrack

5 curated free problems as horizontal stepper. 'Start the track' → design-tinyurl. Shows completion checkmarks.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: MostAskedSection

Company collection chips (Google, Meta, Amazon, etc.). Click filters ProblemExplorer below via scroll + filter state.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: ProblemExplorer

Fuse.js search, category/difficulty/status filters, grid/list toggle, ProblemCard with lock icon for paid problems.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: FeatureShowcase

3 live widgets: FlashSaleDemo, SecretVault, GraphQLPlayground. Guest marketing only.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: AiInterviewerSection

3-column feature pitch. Waitlist form or 'Start mock interview' if entitled.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: RoadmapPreview

4 track cards linking to /roadmap?track=...

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: ClaimPlatformAccessBanner

Launch offer CTA for eligible logged-in users.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: OnboardingModal

3-step modal overlay on first login.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: Bottom CTA

'Ready to Design?' → /draw. Guest only.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.

### Section: Footer

Links: Pricing, Terms, Privacy.

**Visual treatment:** Uses `glass-card` for cards, `gradient-text` for headlines,
`animate-fade-in` on scroll entry where applicable.

**Responsive behavior:** Stacks to single column on mobile; company chips scroll horizontally.


## 23. Server Actions Reference

| Action | File | Input | Behavior |
|--------|------|-------|----------|
| `startPracticeSession` | `progress/sessions.ts` | `problemId` | Idempotent session start; reuses ACTIVE session |
| `togglePracticeTimer` | `progress/sessions.ts` | `problemId` | Pause/resume with totalPausedSeconds |
| `completeSession` | `progress/sessions.ts` | `sessionId, finalScore, diagramSnapshot?` | Mark COMPLETED, SRS date |
| `abandonSession` | `progress/sessions.ts` | `problemId` | ABANDONED + new session for Start Over |
| `recordStepSubmission` | `progress/submissions.ts` | `sessionId, stepId, content, feedback, score` | Append-only submission row |
| `awardStepXp` | `progress/submissions.ts` | `problemId, stepId` | +20 XP, level-up check |
| `getActiveSession` | `progress/summary.ts` | `problemId` | Restore session + submissions |
| `getSessionDetail` | `progress/summary.ts` | `sessionId` | Full phase-grouped review data |
| `getUserProgressMap` | `progress/summary.ts` | `—` | Map for ProblemExplorer overlays |
| `saveUserPreferences` | `progress/preferences.ts` | `companies, difficulty, focus, intent` | Onboarding prefs |
| `skipOnboarding` | `progress/preferences.ts` | `—` | Set onboardingCompleted=true |
| `updateProfile` | `settings.ts` | `FormData` | Name, bio, public toggle |
| `deleteAccount` | `settings.ts` | `—` | Cascade delete user, redirect / |
| `getUserRecommendations` | `recommendations.ts` | `—` | dailyPick, needsReview, recommended |
| `updateUserPlan` | `admin.ts` | `userId, planType` | Admin grant with optional launch slot |
| `claimLaunchPlatformAction` | `launch-offer.ts` | `—` | User claims platform launch offer |
| `listFeatureFlags` | `feature-flags.ts` | `—` | Admin flag management |

## 24. AI Agents & LLM Resolution

### 24.1 LLM Resolution Priority (`getUserLLM`)

1. `canUseAI()` access check
2. **BYOK** — user's `preferredProvider` key (gemini, openai, xai, anthropic, azure, aws, ollama)
3. **Platform credits** — server `GOOGLE_API_KEY`, decrement `aiCredits`
4. Throw `AIAccessError` → API returns 403, never 500

### 24.2 Interview Agent Constraints

- Persona: FAANG system design interviewer (ex-Meta)
- Max ~150 words per response
- Probe decisions; never solve the problem
- Phase auto-advance: requirements → hld → lld → tradeoffs → scalability → done

### 24.3 Help Assistant Hard Rules

- No complete system designs or architectures
- No implementation code
- No diagrams or exact component layouts
- Do not solve the problem directly
- No copy-pasteable answers
- Socratic questions and concept explanations only
- Reference user's completed steps and weakness feedback
- Stay under 150 words; temperature 0.7


## 31. Session Persistence & State

### 31.1 Dual-Layer Model

| Layer | When | Storage |
|-------|------|---------|
| Server (authoritative) | Authenticated | PostgreSQL: PracticeSession, StepSubmission, ProblemProgress |
| Client draft | Guest / defensive | localStorage: `sd-practice-v1-{slug}` |
| Diagram | Always | localStorage: `diagram-{stepKey}` |
| Timer (fallback) | Client | localStorage: `timer_{problemId}_*` |

### 31.2 localStorage Keys

- `sd-practice-v1-{slug}` — Phase, step index, savedStepData, completedSteps, lastUpdated
- `diagram-{phaseKey}-{index}` — Excalidraw scene JSON
- `sd_practice_tour_done_v1` — Practice tour completion flag
- `sd_first_step_hint_dismissed` — First-step hint dismissed
- `whats-new:last-seen` — Changelog read position
- `timer_interview-{variant}-{problemId}_*` — Interview countdown state

### 31.3 Corruption Recovery

JSON parse failure → `localStorage.removeItem(key)` → fresh start on next render.
Quota exceeded → clears other `sd-practice-*` keys.

## 41. Feature Flags

| Flag | Purpose | Intended plans at launch |
|------|---------|--------------------------|
| `fresherTrack` | Fresher roadmap track visibility | free, platform, lifetime, ai |
| `interviewMode` | Timed interview variants | platform, lifetime, ai |
| `aiProbe` | Adversarial probe after passed steps | ai |
| `lifetimePlan` | Lifetime pricing card visibility | all |
| `voiceInterview` | Voice panel + voice interview variant | ai |

All flags seed as `enabledPlans: []` (dark). Admin can enable per-plan or per-user override.

## 42. Testing Strategy

### 42.1 Quality Gate

```bash
pnpm lint && pnpm test run && pnpm build
```

### 42.2 E2E Specs

- `e2e/smoke.spec.ts` — Guest home page smoke
- `e2e/auth.spec.ts` — Login/signup flows
- `e2e/practice.spec.ts` — Practice session path
- `e2e/roadmap.spec.ts` — Roadmap unlock progression
- `e2e/interview-mode.spec.ts` — Interview timer and debrief
- `e2e/fresher-track.spec.ts` — Fresher track feature flag

E2E practice specs must call `suppressFirstRunUx(page)` to bypass PracticeTour overlay.

## 28. Step Journey Authoring

Custom steps live in `PROBLEM_STEPS['<slug>']` in `src/lib/problem-steps.ts`.

### StepData schema

```typescript
interface StepData {
  phase: string;       // Display name in sidebar
  subStep: string;     // Evaluation rubric key
  title: string;
  prompt: string;      // The interview question
  inputType: 'list' | 'textarea' | 'schema';
  placeholder?: string;
  widgetId?: string;   // From widgets/registry.tsx
}
```

### Established subStep keys

**Requirements:** `functional`, `non-functional`, `constraints`
**HLD:** `api`, `high-level`, `database`, `data-model`, `architecture`
**LLD:** `components`, `data-flow`, `deep-dive`, `algorithms`
**Trade-offs:** `decisions`, `bottlenecks`
**Scalability:** `scaling`, `monitoring`

### Authoring rules

- 6–10 steps total per problem (45–60 min interview)
- One question per step; anchor prompts in problem context/NFRs
- Include at least one diagram sub-step (architecture or data-flow)
- Must resolve both HLD and LLD phases or validate:problems fails
- Custom phases merge OVER generic fallback — undefined tradeoffs/scalability leak generic steps
- Attach widgetId where a registry widget teaches the concept being asked

## 40. Error States & Recovery

| Scenario | User-visible behavior | Technical handling |
|----------|----------------------|-------------------|
| AI evaluation timeout | Amber banner; no submission written; retry submit | fetchWithRetry 15s timeout |
| Corrupt localStorage | Key removed; session starts fresh | try/catch in session-storage.ts |
| Expired plan | Effective plan downgrades to free; locked problems redirect /pricing | getEffectivePlanType() |
| Unverified email | Login blocked; resend verification available | credentials authorize returns null |
| Missing GOOGLE_API_KEY | AI routes return graceful error if no BYOK/credits | user-llm.ts |
| Razorpay not configured | Checkout returns 503; pricing page shows disabled state | orders/route.ts |
| Feature flag off | Interview param shows FeatureUpsell instead of silent strip | practice page |
| Diagram empty on submit | Submission proceeds without diagram appendix | isDiagramSubStep check |
| Timer expiry in interview | Toast + TIME_EXPIRED event → InterviewSummaryPanel | TimerWidget |
| Admin non-admin access | Redirect to / | admin/page.tsx |

## 43. Deployment & Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL; build fails without (check-env.ts) |
| `AUTH_SECRET` | Yes | NextAuth JWT signing, 32+ chars |
| `GOOGLE_API_KEY` | Optional | Server AI fallback |
| `GOOGLE_CLIENT_ID/SECRET` | Optional | Google OAuth |
| `RAZORPAY_KEY_ID/SECRET` | Optional | Payments |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Client checkout |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Webhook verification |
| `RESEND_API_KEY` | Optional | Transactional email |
| `EMAIL_FROM` | Optional | Sender address |
| `OPENAI_API_KEY` | Optional | Voice STT/TTS |

## 30. Subscription, Billing & Access Control

### 30.1 Pricing Page UX (`/pricing`)

**Layout:** Plan cards in responsive grid. AI plan highlighted with 'POPULAR' badge and ring.

**Query params:**
- `?locked={slug}` — scroll/highlight plan after locked problem click
- `?feature=interviewMode|voiceInterview|aiProbe` — feature-specific upsell

**Checkout flow:**
1. User clicks Subscribe → `POST /api/orders`
2. Razorpay modal opens with orderId + amount in paise
3. On success → `POST /api/orders/verify` with signature
4. Server validates HMAC + order notes (not client planType)
5. `activateUserPlan()` → toast + session refresh

**Coming soon badges:** Feature rows show live vs coming-soon based on feature flags.

### 30.2 Access Control Functions

- `isProblemFree(slug)` — True for 8 FREE_PROBLEM_SLUGS
- `canAccessProblem(user, slug)` — Free slugs always; else hasPlatformAccess
- `canUseAI(user, slug?)` — Returns allowed, reason, source (byok|platform_credits|server)
- `canViewExpertSolution(user, opts)` — Platform access OR fully complete
- `hasPlatformAccess(user)` — platform | lifetime | ai with active plan
- `getEffectivePlanType(user)` — Downgrades expired to free

## 33. Profile, History & Session Review

### 33.1 Profile Page Layout

Three-column responsive grid on desktop; stacks on mobile.

**ProfileHeader:** Avatar (OAuth image or initials), name, email, level badge with
gradient ring, streak badge with flame icon, XP progress bar.

**StatsOverview:** 4 stat cards in 2x2 grid — Problems Solved, Average Score,
Current Streak, Focus Area (static 'System Design').

**HistoryList:** Filter tabs (All / In Progress / Completed / Review Due).
Each row: problem title, score badge, attempt count, duration, relative timestamp.
Completed rows link to `/profile/history/{sessionId}`.

### 33.2 Session Phase Review

Tabbed interface per phase (Requirements, HLD, LLD, etc.).
Each step shows `StepAttemptCard` with answer text, score, feedback JSON rendered.
`DiagramSnapshotViewer` for saved Excalidraw PNG from session completion.
AI Probe panel when `aiProbe` entitled — 'Defend your design' follow-ups.

## 34. Settings & BYOK

### 34.1 Settings Tabs

**General:** Display name, username, bio, public profile toggle, read-only email

**Billing:** Current plan label, expiry, AI credits remaining, upgrade CTA

**API Keys:** 7 provider key inputs with save badges; preferred provider selector

**Advanced:** Delete account with confirmation dialog

### 34.2 BYOK Provider Matrix

| Provider | Fields stored | Used for |
|----------|---------------|----------|
| Gemini | geminiApiKey | Default evaluation, help, chat |
| OpenAI | openaiApiKey | Optional LLM; required for voice STT/TTS on platform plan |
| xAI | xaiApiKey | Grok models |
| Anthropic | anthropicApiKey | Claude models |
| Azure OpenAI | key + endpoint | Enterprise Azure |
| AWS Bedrock | region + access + secret | Bedrock models |
| Ollama | endpoint + model | Local inference |

## 20. Roadmap Feature

| Track ID | Label | Structure | Phases |
|----------|-------|-----------|--------|
| `fresher` | Fresher & Campus | 5 phases, feature-flagged | Foundations → OOP → First HLD → Scale → Interview Ready |
| `se` | Software Engineer | 3 phases, 9 problems | TinyURL through Logging |
| `sse` | Senior SE | 2 phases, 11 problems | Distributed Cache through Google Search |
| `mlops` | MLOps & MLE | 3 phases, 8 problems | ML pipeline problems |
| `agentic-ai` | Agentic AI | 2 phases, 7 problems | RAG, agents, orchestration |

**Unlock rule:** Problem step N unlocks when step N-1's problem is COMPLETED or REVIEW_NEEDED.
Concept-only steps (no problemSlug) are informational and never block.

**8-week schedule:** Shown for `se` and `fresher` tracks only (~4-6 hrs/week).

## 21. Guides & Educational Content

Published guides in `src/content/guides/`:

- `/guides/design-tinyurl` → practice at `/practice/design-tinyurl`
- `/guides/design-parking-lot` → practice at `/practice/design-parking-lot`
- `/guides/design-elevator-system` → practice at `/practice/design-elevator-system`
- `/guides/design-dropbox` → practice at `/practice/design-dropbox`
- `/guides/design-rate-limiter` → practice at `/practice/design-rate-limiter`
- `/guides/design-distributed-cache` → practice at `/practice/design-distributed-cache`
- `/guides/design-whatsapp` → practice at `/practice/design-whatsapp`
- `/guides/design-youtube` → practice at `/practice/design-youtube`

**Block types:** markdown, callout, code, quiz, tradeoff, comparison, diagram, interviewNote, widget

**Guide UX:** Long-form scrollable article; widgets embedded inline; bottom CTA 'Practice this problem free'.

## Appendix D: UI Component Inventory (shadcn/ui)

### `src/components/ui/button.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/card.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/dialog.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/sheet.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/input.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/textarea.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/badge.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/avatar.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/dropdown-menu.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/separator.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/switch.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/slider.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/table.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.

### `src/components/ui/theme-toggle.tsx`

shadcn/ui primitive used across the app. Styled with Tailwind + CSS variables from globals.css.
Follows design tokens: primary, muted, destructive, radius-md/lg.


## 17. Practice Session — Timer & Tour

### 17.1 PracticeTour Steps

1. **`[data-tour=steps]`** — Sidebar step navigation. Shows how to jump between phases and steps
2. **`[data-tour=chat]`** — Main step input area. Where you answer each interview question
3. **`[data-tour=canvas]`** — Excalidraw diagram. Draw architecture on diagram-relevant steps
4. **`[data-tour=help]`** — Help Assistant FAB. Socratic hints without revealing solutions

Auto-starts 800ms after first visit if `sd_practice_tour_done_v1` not set.
Replay via sidebar 'Take the tour' → `sd-start-tour` event.
Backdrop click skips. Analytics: `practice tour completed` / `practice tour skipped`.

## 32. Gamification & Progress

| Mechanism | Value | Trigger | Display |
|-----------|-------|---------|---------|
| XP | +20 per step pass | awardStepXp on first pass | UserHero, ProfileHeader, admin |
| Level | floor(sqrt(xp/100)) + 1 | XP threshold | Level badge |
| Streak | Daily practice count | updateStreak on pass | Flame badge |
| SRS | nextRepetitionDate | completeSession | 'Review Due' filter |
| Roadmap unlock | Prior problem complete | ProblemProgress status | RoadmapNode state |

## 36. Custom Problems & Free Draw

### 36.1 Custom Problem Flow

`/custom` — public form with title (required) + description (optional).
Submit navigates to `/custom/practice?title=...&description=...`.
Auth required; `canAccessProblem` for `custom-{normalized-title}` requires paid plan.
Steps from `getStepsForProblem()` → GENERIC_STEPS template.

### 36.2 Free Draw (`/draw`)

No auth. User picks HLD or LLD diagram type.
Full Excalidraw via DiagramCanvas with stepKey `free-draw-hld` or `free-draw-lld`.
Actions: Download PNG, fullscreen, switch type (with confirm + clear).
Persistence via diagram localStorage keys.

## 37. Onboarding & First-Run UX

### 37.1 OnboardingModal Steps

1. **Goal** — pick intent: interview / upskill / learn
2. **Ready** — recommended first problem per intent (WhatsApp / Cache / TinyURL)
3. **Prefs** (optional) — companies, difficulty, focus areas → saveUserPreferences

Skip calls `skipOnboarding()` without blocking app usage.

### 37.2 Other First-Run Surfaces

| Surface | Trigger | Dismiss |
|---------|---------|---------|
| PracticeTour | First practice visit | Complete or skip |
| First-step hint | First step ever | Dismiss button |
| WhatsNewNotifier | New changelog entry | Visit /whats-new |
| Session restored banner | DB/local restore | 5s auto-dismiss |

## 25. Evaluation Rubrics & Scoring

Rubrics defined in `EVALUATION_GUIDES` within `/api/ai/evaluate/route.ts`.
Phase-scoped: evaluator does not expect API details during Requirements phase.

### Rubric: `functional`

**Criteria:** Lists concrete features users can perform. Generous scoring: 7-10 features → 8-10/10.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `non-functional`

**Criteria:** Scale, latency, availability, consistency targets aligned with problem NFRs.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `constraints`

**Criteria:** Business/technical limits: budget, team size, regulatory, existing systems.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `api`

**Criteria:** REST/GraphQL endpoints, request/response shapes, idempotency, versioning.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `data-model`

**Criteria:** Entities, relationships, indexes, partitioning strategy.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `architecture`

**Criteria:** Major components, data flow between services, technology choices.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `high-level`

**Criteria:** System boxes and arrows; separation of concerns.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `components`

**Criteria:** Service breakdown, class/module responsibilities.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `data-flow`

**Criteria:** Sequence of operations for key use cases; diagram expected.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `decisions`

**Criteria:** Explicit trade-offs with rationale (CAP, SQL vs NoSQL, etc.).

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `bottlenecks`

**Criteria:** Identified single points of failure and mitigation.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `scaling`

**Criteria:** Horizontal scaling, sharding, caching, read replicas.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `monitoring`

**Criteria:** Metrics, alerts, SLIs/SLOs, on-call runbooks.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `deep-dive`

**Criteria:** Algorithm or data structure choice for core operation.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.

### Rubric: `algorithms`

**Criteria:** Time/space complexity, correctness arguments.

**Pass threshold:** score >= 7 AND accuracy >= 70 (both required).

**Expert solution injection:** When `solutions.ts` has entry for problem,
evaluator compares against reference architecture without leaking to user.


## 19. Voice Interview

### 19.1 VoicePanel UX

Push-to-talk button with visual recording indicator.
Transcript displayed in chat-bubble style (interviewer left, candidate right).
State machine: idle → recording → transcribing → thinking → speaking → idle

### 19.2 API Sequence

```
POST /api/voice/session     → { sessionId, openingQuestion }
POST /api/voice/speak       → TTS audio for interviewer text
[User holds push-to-talk]
POST /api/voice/transcribe  → { transcript } from audio blob
POST /api/voice/reply       → { text } AI follow-up (1 credit)
POST /api/voice/speak       → TTS for reply
```

### 19.3 Entitlement & Funding

- Feature flag: `voiceInterview` (AI plan at launch)
- STT/TTS: OpenAI Whisper + TTS
- AI plan: platform OPENAI_API_KEY; platform/lifetime: user's openaiApiKey
- Appears in `?interview=voice` or Practice Aloud toggle during practice

## 35. Admin Panel

**Access:** `user.role === 'ADMIN'` only.

### 35.1 Dashboard Metrics

- Total users, premium users, AI plan users, total problems solved
- Launch offer: platform slots claimed, AI giveaway winners, eligible count

### 35.2 Tabs

1. **User Management** — paginated table (50/page): XP, level, streak, plan.
   Actions: set Free/Platform/AI, revoke, view activity, platform grant dialog.
2. **User Activities** — AdminSessionExplorer with session summaries.
3. **Launch Offer** — redemptions and claimants list.
4. **Feature Flags** — per-plan toggles + per-user email overrides.

## 18. Interview Mode

Distinct from practice mode: timed, no help, debrief at end.

### 18.1 Entry Points

- `/interview` hub — problem picker + variant selector + past debriefs
- `StartInterviewDialog` on practice sidebar
- Direct URL: `/practice/[slug]?interview=lite|full|voice`

### 18.2 InterviewSummaryPanel

Shown when timer expires or user clicks End Interview.
Displays: overallScore 1-10, verdict (Strong Hire / Hire / Lean Hire / No Hire),
strengths[], improvements[], phaseNotes[].
Actions: PDF export, share debrief (creates `/share/debrief/[token]`).

### 18.3 vs Practice Mode Comparison

| Aspect | Practice | Interview |
|--------|----------|-----------|
| Help Assistant | Yes | No |
| Practice Tour | Yes | No |
| Timer | Soft count-up | Strict countdown |
| Step journey | Full or custom | Lite or full per variant |
| End state | CompletionUI | InterviewSummaryPanel + debrief DB |
| Voice | Optional (Practice Aloud) | Required for voice variant |

## 8. Global Chrome (Header, Theme, Toasts)

### 8.1 Header (`Header.tsx`)

Sticky top, `z-50`, glass backdrop blur.

**Left:** Logo (40x40 rounded-xl) + 'Ultimate SD' / 'AI System Design' (sm+).

**Center (lg+):** Pill nav bar with NAV_ITEMS — Home, Problems, Learn dropdown,
Interview, Pricing. Learn dropdown: Roadmap, Guides, Custom Problem, Draw.

**Right:** 'AI Powered Practice' badge (2xl+), divider, WhatsNewNotifier bell,
ThemeToggle (sun/moon), UserMenu or Sign in / Get Started, MobileMenu hamburger.

### 8.2 UserMenu (authenticated)

- Admin Panel (ADMIN only)
- Profile, Settings, What's New, Log out

### 8.3 Toasts (sonner)

Used for: XP awards, level up, payment success, timer warnings, errors.
