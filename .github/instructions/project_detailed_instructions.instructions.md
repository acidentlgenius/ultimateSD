---
applyTo: '**'
---
**Prompt for AI Developer/Builder (e.g., to an advanced coding assistant like Grok or Claude):**

You are an expert full-stack developer with deep expertise in modern web development stacks, AI integrations, and UX design for educational platforms. Your task is to build a Minimum Viable Product (MVP) for an AI-based system design practice platform called "SysDesignAI" (or similar), exactly replicating the core features of HelloInterview.com's Guided Practice for system design interviews, but without any authentication requirements. This means the app is fully public and session-based—no user accounts, logins, or persistence across sessions. Focus solely on system design practice, emphasizing interactive AI-driven mock interviews with step-by-step guidance, instant personalized feedback, and a comprehensive library of problems.

#### Core Research and Replication Basis
Based on detailed analysis of HelloInterview.com (via site browsing and reviews from sources like Reddit, Medium, and tech blogs as of November 2025):

- **Platform Overview**: HelloInterview is a tech interview prep tool specializing in FAANG-level content. Its "Guided Practice" feature (desktop-only in original) simulates real system design interviews with AI/personalized coaching from FAANG engineers. Users select a problem, engage in a conversational flow where the AI acts as an interviewer, provides hints if stuck, asks follow-ups, and delivers structured feedback on structure, trade-offs, edge cases, and communication. It's interactive, not passive—users explain designs verbally/textually, and AI responds in real-time. Free tier offers limited access; premium unlocks full problems and deep dives. UI is clean, modern, with problem lists, chat interfaces, and visual aids (e.g., diagrams). Reviews praise its realism over videos/books, but note it's "performance enhancer" not full curriculum—our MVP mirrors this focus.

- **Key User Interactions (Exact Replication)**:
  - **Problem Selection**: Browse/search a categorized list of 100+ system design problems (e.g., "Design TinyURL", "Design YouTube"). Problems are tagged by difficulty (Easy/Medium/Hard), company (e.g., Meta, Amazon), and topics (e.g., Scalability, Databases).
  - **Session Start**: Click "Practice" on a problem → AI loads as "Interviewer" with a prompt like: "Let's design [Problem]. Start by clarifying requirements."
  - **Conversational Flow**: Real-time chat where user types/responds (simulate verbal with text). AI asks clarifying questions, probes decisions (e.g., "Why sharding over replication?"), offers hints (e.g., "Consider CAP theorem"), and iterates (e.g., "Now deep-dive into APIs").
  - **Step-by-Step Guidance**: Break interview into phases: Requirements → High-Level Design (HLD) → Low-Level Design (LLD) → Trade-offs/Edge Cases → Scalability/Bottlenecks.
  - **Feedback Mechanism**: End-session summary with scores (e.g., 7/10 on Structure), strengths/weaknesses, and actionable tips (e.g., "Missed fault tolerance—review redundancy patterns"). Instant during chat for stuck moments.
  - **Visual Aids**: Simple diagramming tool (e.g., drag-drop boxes for components) integrated into chat; AI comments on user diagrams.
  - **No Auth Impact**: All sessions ephemeral; problems always accessible.

- **Comprehensive Problem List**: Include at least 100 problems, curated from FAANG sources (e.g., Grokking the System Design Interview, LeetCode, Exponent, DesignGurus). Categorize into: Basics (20), Core Services (30), Advanced/FAANG-Specific (30), ML-Infused (10), Edge Cases (10). Examples:
  - **Basics**: Design a URL Shortener (TinyURL), Design a Parking Lot System, Design an Elevator System.
  - **Core Services**: Design YouTube (Video Streaming), Design Twitter (Real-time Feeds), Design Instagram (Photo Sharing + Stories), Design Uber (Ride-Sharing with ETA), Design Netflix (Recommendation + Streaming).
  - **Advanced**: Design a Distributed Cache (Redis-like), Design a News Feed (Facebook), Design a Typeahead Suggestion (Google Search), Design a Chat System (WhatsApp), Design an E-commerce Platform (Amazon Checkout).
  - **ML-Infused**: Design a Recommendation Engine (Netflix Top Picks), Design Fraud Detection System, Design Personalized Search Ranking.
  - **Edge Cases**: Design a Rate Limiter, Design a Leaderboard (Real-time Ranking), Design A/B Testing Framework.
  Full list in Appendix A (embed as JSON in code for dynamic rendering).

- **Differentiation for MVP**: Keep it free/public. Add subtle enhancements like session export (PDF transcript) and difficulty-based randomization for replays. Ensure mobile-responsive (unlike original's desktop limit).

Your build must use: **Next.js 14+ (App Router) for SSR/SSG**, **TypeScript** for robustness, **Shadcn/UI + Tailwind CSS** for simple, customizable components (e.g., buttons, modals, chat bubbles). For AI: **LangGraph (LangChain.js)** to orchestrate conversational graphs (nodes for interviewer prompts, user input, feedback generation). Backend: Minimal—Vercel deployment, with Grok API (xAI) or OpenAI for LLM calls (fallback to Grok for cost/simplicity). No database needed (static problems, in-memory sessions).

#### High-Level Architecture
- **Frontend**: Next.js app with pages: `/` (Home/Dashboard with problem grid), `/practice/[slug]` (Session page with chat + diagram pane).
- **Backend/API**: Next.js API routes for AI orchestration (LangGraph workflows).
- **AI Flow**: LangGraph graph with states: Init (load problem), ChatLoop (user-AI exchange), Feedback (summarize), End. Use prompts tuned for FAANG-style probing.
- **UI/UX Principles**: Clean, distraction-free (white/dark mode toggle). Intuitive: Large cards for problems, responsive chat (left: conversation, right: notes/diagram). Accessibility: ARIA labels, keyboard nav. Performance: Lazy-load problems, optimistic UI for chat.
- **Deployment**: Vercel for simplicity. Env vars for API keys.

Build step-by-step. Output: Complete, runnable code in a monorepo structure. Explain each step with rationale, code snippets, and testing notes. Ensure ~10,000 words total (detailed explanations). If code exceeds limits, provide zipped repo link simulation.


## UI Revamp Plan

This section provides a concrete plan to revamp the UI for the SysDesignAI MVP. The goal is to make the practice experience clearer, more modern, and more usable across devices while keeping risk low and changes incremental.

### Goals
- Make the practice flow clearer and more focused (chat-first, diagram/notes secondary).
- Improve visual hierarchy and accessibility (color tokens, spacing, contrast, keyboard navigation).
- Modernize components using the existing `shadcn/ui` primitives and Tailwind tokens.
- Keep sessions ephemeral and zero-auth; changes are UI-only unless an API improvement is required.

### Scope (what we'll change)
- Visual system: add a tokens section (colors, spacing, type scale), dark-mode-friendly palette.
- Page layout: update `/practice/[slug]/page.tsx` to a 2-column responsive layout with a collapsible right pane for diagrams/notes.
- Components: restyle and, where needed, refactor `ProblemCard`, `ChatInterface`, `DiagramCanvas`, `FeedbackModal`, and shared `ui/*` primitives.
- Small UX additions: phase progress indicator (Requirements → HLD → LLD → Trade-offs → Feedback), session export (transcript PDF), and improved diagram export (PNG/SVG).

### Deliverables
1. `UI Revamp` section added to project docs (this file).
2. Visual tokens (new/updated Tailwind config snippets and a `src/styles/tokens.ts` or equivalent if required).
3. Component-level updates in `src/components/*` (minimal API changes, prefer props compatibility).
4. Updated `/practice/[slug]/page.tsx` layout and header with phase progress.
5. Accessibility adjustments and keyboard shortcuts list in the repo docs.
6. Automated checks: `pnpm build`, `pnpm lint`, and `pnpm test` pass for touched files.

### Timeline & Phases (suggested)
- Phase A (1 day): Plan & audit — produce this plan (done) and run a component audit.
- Phase B (2 days): Visual system & tokenization — update Tailwind, add color tokens and small theme utilities.
- Phase C (3 days): Component updates — restyle `ProblemCard`, `ChatInterface`, `DiagramCanvas`, `FeedbackModal`, and `ui/*` primitives.
- Phase D (1 day): Practice page layout and integration — wire updated components into `/practice/[slug]` and add phase progress + export actions.
- Phase E (1 day): Tests & QA — run build/lint/tests, fix issues, and add a couple of unit tests for new behavior.

### Component-level tasks (quick mapping)
- `src/components/ProblemCard.tsx` — improve card layout, add difficulty badge, hover actions, ensure keyboard focus styles.
- `src/components/ChatInterface.tsx` — restyle messages, add phase header, quick-send keyboard (Cmd/Ctrl+Enter), compact message composer, and accessibility attributes.
- `src/components/DiagramCanvas.tsx` — add snap-to-grid toggle, basic toolbar (rectangle, connector, text), and export button.
- `src/components/FeedbackModal.tsx` — standardize modal layout and make feedback actionable (scores + short tips list).
- `src/components/ui/*` — update `button`, `card`, `input`, `textarea` primitives for consistent spacing and states.

### Quality gates
- Build: `pnpm build` should pass after changes.
- Lint/Types: `pnpm lint` and TypeScript checks must pass for edited files.
- Tests: Add minimal unit tests (Vitest) for `ProblemCard` rendering and `ChatInterface` basic interactions. Tests should pass locally.

### Assumptions & Constraints
- No authentication or persistence changes will be introduced.
- LangGraph/AI flows remain the same; only UI hooks / display change unless a UX bug forces minor API tweaks.
- Keep changes minimal and reversible — prefer feature flags or small PR-sized commits.

### Next steps (immediate)
1. Audit current components to create a short inventory of props/styles used (I will run this if you want me to). 
2. Apply visual tokens and small Tailwind updates.
3. Begin component restyles one-by-one, starting with `ProblemCard` and `ChatInterface`.

If you want, I can now run the component audit (scan `src/components` and list what needs edits) and then begin implementing the `ProblemCard` and `ChatInterface` restyles. Tell me whether to proceed with the audit now, or if you'd like changes to the plan first.
