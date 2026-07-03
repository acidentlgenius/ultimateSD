# Feature Discoverability & Product Communication — Analysis and Improvement Plan

**Date:** 2026-07-03
**Status:** Approved design (brainstorm output)
**Scope:** In-app discovery & placement, landing/marketing communication, pricing & upsell UX, UI polish. All three user segments (job-seekers, working engineers upskilling, freshers/students).

## Context

Ultimate SD has shipped four flagship AI features — **Interview Mode**, **AI Probe**, **Voice Interview**, and **Fresher Track** — behind the flag engine (`src/lib/plans.ts` → `FEATURE_SEED_DEFAULTS` all `[]`, i.e. dark). The staged rollout is intentional (validate correctness before release), and eventually each feature launches to its intended plans (`FEATURE_INTENDED_PLANS`).

The problem: even when the flags flip, the features will remain nearly invisible. Their entry points are buried, nothing announces them, the landing page never mentions them, and locked users get silence instead of an upsell. This document audits those gaps and lays out a phased improvement plan aligned with the flag rollout.

**Approved strategy:** Approach A → B → C phased.
- **A (now):** incremental surfacing — nav fixes, locked-state teasers, announcement surfaces. Ships before any flag flips.
- **B (destination):** "Modes" restructure — an Interview hub as a first-class product surface.
- **C (layer):** segment-driven personalization on top.

---

## Section 1 — Audit Findings

Each finding lists evidence and severity. Severity = (impact on conversion/retention) × (number of users affected).

### Critical

**F1. Flagship features are invisible even when enabled.**
- Interview Mode's only entry is a "Start Interview" button in the practice-screen sidebar footer (`src/components/PracticeUI.tsx:443-445`, `StartInterviewDialog.tsx`) — inside a problem, below the fold of the user's attention.
- AI Probe is triple-gated: flag on + step evaluation `isAcceptable` + feedback modal open (`FeedbackModal.tsx:400-403`, `StepByStepChat.tsx:1127-1140`). No standalone entry, no mention anywhere.
- Voice Interview mounts unannounced at the top of the practice column when `voiceEnabled` (`PracticeUI.tsx:512-518`). No introduction, no deliberate opt-in moment.
- Net effect: a paying AI-plan user could use the product for weeks without learning these exist.

**F2. Dark flags fail silently — lost conversion moments.**
- A non-entitled user hitting `/practice/[slug]?interview=lite` gets the param silently stripped (`src/app/practice/[slug]/page.tsx:63-70`, the "dark flag" redirect). No message, no upsell, no explanation. Every locked touchpoint is currently a dead end instead of a pricing funnel.

**F3. `/blog` is fully orphaned.**
- A complete articles system with interactive widget embeds (`src/app/blog/`, `src/components/widgets/` — ~50 simulators) has zero inbound links from header, footer, mobile menu, or dashboard. Content marketing and SEO surface exists but is unreachable.

### High

**F4. `/draw` is unreachable for logged-in desktop users.**
- The free canvas appears only in logged-out CTAs (`Hero.tsx`, `DashboardClient.tsx`) and the mobile menu. Desktop header (`src/components/Header.tsx`) omits it entirely.

**F5. Desktop and mobile navigation disagree.**
- Desktop: Home / Roadmap / Pricing. Mobile (`MobileMenu.tsx`): Home / Draw / Roadmap. Pricing missing on mobile directly hurts conversion; Draw missing on desktop hurts activation.

**F6. No announcement mechanism exists.**
- No changelog, feature tour, coach marks, or "what's new" surface anywhere in the codebase. A staged rollout with no announcement channel means launches land silently. (Addressed by its own deliverable: the **What's New page**, Section 2.7.)

**F7. Landing page never mentions the differentiated AI features.**
- `Hero.tsx` / `FeatureShowcase.tsx` advertise simulations, structured steps, and the canvas — but not the AI interviewer, voice practice, or adversarial probe. The features hardest for competitors to copy are absent from marketing.

### Medium

**F8.** Onboarding wizard (`OnboardingModal.tsx`) asks companies/difficulty/focus but never asks *intent* (interview soon vs upskilling vs learning) — the single highest-leverage personalization signal for three-segment surfacing.

**F9.** Vestigial routes create dead weight: `/home` is a bare redirect; `/u/[username]` always 404s (`notFound()`), a disabled social/viral loop.

**F10.** Solution viewing is gated (plan or completion, `PracticeUI.tsx:434`) but the gate is undiscoverable until hit — no upfront communication of what unlocks it.

**F11.** The launch-offer banner is the only urgency/marketing surface in-app; everything else is static.

**F12.** Help Assistant, Probe, and Voice have no unified identity — three disconnected AI touchpoints instead of one recognizable "AI coach" the brand can market.

---

## Section 2 — Per-Feature Placement Recommendations

Format per feature: **current home → recommended home → locked-state behavior during staged rollout.**

### 2.1 Interview Mode
- **Current:** button in practice sidebar footer, flag-dark.
- **Recommended:** a first-class **Interview hub at `/interview`** (Approach B): pick a problem, pick a variant — Lite (45 min) / Full (60 min) / Voice — and see past interview debriefs (reusing `InterviewSummaryPanel` data). The in-problem "Start Interview" button remains as a secondary, contextual entry. The hub gets a desktop nav slot (see 2.8).
- **Locked state:** the hub and its nav entry are always visible once Phase 1 ships. Locked users see the full page with a 🔒 plan badge, a "how it works" preview (screenshots or a short animation of the timer + debrief), and a CTA to `/pricing?feature=interviewMode`. Never silent.

### 2.2 Voice Interview
- **Current:** ambient panel auto-mounted at the top of the practice column.
- **Recommended:** voice becomes a **variant of Interview Mode chosen at start** (in the Interview hub and `StartInterviewDialog`), not an always-present panel. For normal (non-interview) practice, voice becomes an explicit **"Practice aloud" toggle in the practice sidebar** — off by default, deliberate opt-in, with a one-line explainer on first use.
- **Locked state:** the variant option shows disabled with plan badge + tooltip; selecting it deep-links to pricing.

### 2.3 AI Probe
- **Current:** "Probe this answer" button appearing only after an acceptable step evaluation, inside the feedback modal; internal name "The Skeptic".
- **Recommended:** rename user-facing to **"Defend your design"** (self-explanatory, benefit-framed). Two entries:
  1. The feedback-modal button becomes **always rendered** when an answer is acceptable — enabled or visibly disabled — never conditionally removed.
  2. A post-session **"Defend this design"** CTA on the session review page (`profile/SessionPhaseReview.tsx`), turning finished sessions into re-engagement.
- **Locked state:** disabled button + tooltip "Available on the AI plan — an AI skeptic challenges your design like a real interviewer" + pricing deep-link.

### 2.4 Draw (free canvas)
- **Current:** mobile menu + logged-out CTAs only.
- **Recommended:** desktop header nav link; unified with mobile (see 2.8). It's a free, login-optional acquisition surface — it should be everywhere.

### 2.5 Blog
- **Current:** orphaned.
- **Recommended:** nav entry under **"Learn"** (grouping Roadmap + Blog, see 2.8); cross-links from related practice problems ("Read the deep-dive") and from widgets to the articles embedding them. Footer link as well.

### 2.6 Fresher Track
- **Current:** flag-gated link on landing (`showFresherPath` → `/roadmap?track=fresher`).
- **Recommended:** surfaced via the onboarding **intent question** (F8): users who answer "learning from scratch" land on the fresher track; plus a persistent entry card on `/roadmap`.
- **Locked state:** visible roadmap card with plan badge.

### 2.7 What's New page (dedicated deliverable)
- **New surface, two parts:**
  1. **`/whats-new` page** — the changelog of record. Reverse-chronological entries (title, date, description, screenshot/GIF, optional "try it" deep-link, plan-availability badge). Content sourced from a simple data file (e.g. `src/lib/whats-new.ts`) or MDX so entries ship with feature PRs — no CMS. Linked from the header user-menu and footer.
  2. **Header notifier** — a small bell/sparkle popover on the header showing the latest 2–3 entries with an unread dot (last-seen entry id in localStorage; consistent with the app's existing localStorage patterns). Each item links into `/whats-new`.
- This becomes the **standard launch channel for every flag flip**: flip the flag → publish an entry → the unread dot announces it to every active user. Entries for still-dark features can double as "coming soon" teasers.

### 2.8 Navigation restructure (ties the above together)
- **Desktop header:** Home · **Learn** (Roadmap, Blog) · **Practice** (Problems, Custom, Draw) · **Interview** (hub, phase 2) · Pricing. Learn and Practice are hover dropdowns; Interview and Pricing are direct links.
- **Mobile menu:** identical item set as desktop (fixes F5), including Pricing.
- **User menu:** unchanged (Profile, Settings, Admin) + "What's New" link.

---

## Section 3 — Landing, Pricing & Upsell

### 3.1 Landing page
- Add an **"AI Interviewer" section** as the hero differentiator: voice interview + timed mock + defend-your-design, with a short demo (animated mock of the debrief report is the most convincing artifact).
- **While features are dark:** ship the section early with a "Coming soon — join the waitlist" variant (email capture). Marketing leads product; the waitlist doubles as launch-day distribution and validates demand before flags flip.
- Segment the messaging: hero keeps the current learning-focused headline; the AI Interviewer section speaks to job-seekers; the existing simulation showcase covers learners/upskillers.

### 3.2 Pricing page
- Each plan card lists flagship features with **badges matching `FEATURE_INTENDED_PLANS`** (e.g. "AI Interviewer" on AI/Lifetime). Dark features show "coming soon" on their intended plan rather than being absent — sell the roadmap.
- Support **`/pricing?feature=<key>`**: scrolls to and highlights the plan row containing that feature, so every locked touchpoint lands the user on exactly the right upgrade.

### 3.3 Upsell interstitial (replaces silent flag-stripping)
- Replace the silent redirect in `practice/[slug]/page.tsx:63-70` with an **interstitial/modal**: feature name, one-paragraph value pitch, plan badge, CTA to `/pricing?feature=interviewMode`, secondary "continue without" that proceeds to normal practice.
- Same component powers all locked touchpoints (Probe button tooltip-click, Interview hub CTA, voice variant) — one `FeatureUpsell` component, configured per feature.

---

## Section 4 — Phased Improvement Plan

Effort: S ≤ 1 day, M = 2–4 days, L = 1–2 weeks.

### Phase 1 — Pre-flag-flip quick wins (Approach A)

| # | Item | Effort | Key files | Success metric |
|---|------|--------|-----------|----------------|
| 1.1 | Unified nav: add Draw + Blog (Learn/Practice grouping), mobile menu = desktop set incl. Pricing | S | `Header.tsx`, `MobileMenu.tsx` | /draw + /blog sessions from nav; mobile pricing-page visits |
| 1.2 | `/whats-new` page + header notifier with unread dot | M | new `app/whats-new/`, `src/lib/whats-new.ts`, `Header.tsx` | notifier open rate; entry click-through |
| 1.3 | `FeatureUpsell` interstitial replacing silent flag-strip | M | `practice/[slug]/page.tsx`, new `components/FeatureUpsell.tsx` | pricing-page CTR from locked touchpoints |
| 1.4 | Pricing: feature badges per `FEATURE_INTENDED_PLANS` + `?feature=` highlight | S | `pricing/PricingClient.tsx` | conversion on deep-linked visits |
| 1.5 | Landing "AI Interviewer — coming soon" section + waitlist capture | M | `Hero.tsx`/new landing section, small API route | waitlist signups |
| 1.6 | Onboarding intent question (interview soon / upskilling / from scratch), stored in prefs | S | `OnboardingModal.tsx`, prefs schema | % completing onboarding; segment distribution |
| 1.7 | Remove vestigial `/home`; decide `/u/[username]` (remove or ticket for Phase 3) | S | `app/home/`, `app/u/` | — |

### Phase 2 — Ships with flag rollout (Approach B)

| # | Item | Effort | Key files | Success metric |
|---|------|--------|-----------|----------------|
| 2.1 | **Interview hub `/interview`**: problem picker, variant picker (Lite/Full/Voice), past debriefs; nav entry | L | new `app/interview/`, reuse `StartInterviewDialog`, `InterviewSummaryPanel` | % of sessions that are interview mode; hub → start rate |
| 2.2 | Voice as interview variant + "Practice aloud" sidebar toggle (remove ambient auto-mount) | M | `PracticeUI.tsx`, `voice/VoicePanel.tsx`, `StartInterviewDialog.tsx` | voice opt-in rate; completion rate |
| 2.3 | Probe → "Defend your design": rename, always-rendered feedback-modal button, session-review CTA | M | `FeedbackModal.tsx`, `ProbePanel.tsx`, `profile/SessionPhaseReview.tsx` | probe starts per acceptable answer |
| 2.4 | Landing AI Interviewer section switches from waitlist to live demo + CTA | S | landing section from 1.5 | landing → interview-hub CTR |
| 2.5 | What's New entries per flag flip (process, not code): flip flag → publish entry | S | `whats-new.ts` | feature adoption in first week post-flip |
| 2.6 | Interview debrief as shareable artifact (public link or polished PDF) | M | `InterviewSummaryPanel.tsx`, `pdf-export-compact.ts` | share/export rate |

### Phase 3 — Post-launch personalization & identity (Approach C)

| # | Item | Effort | Key files | Success metric |
|---|------|--------|-----------|----------------|
| 3.1 | Segment-driven dashboard: reorder modules by onboarding intent (job-seekers → Interview hub first; freshers → roadmap/track; upskillers → problems/widgets) | M | `DashboardClient.tsx`, `UserHero.tsx` | activation per segment (first key action within first session) |
| 3.2 | Unified "AI Coach" identity across Help Assistant / Probe / Voice (shared naming, icon, intro copy) | M | `HelpAssistant.tsx`, `ProbePanel.tsx`, `VoicePanel.tsx` | qualitative; feature cross-usage |
| 3.3 | Blog ↔ problem cross-linking (related articles on practice pages; "try the problem" in articles) | M | `PracticeUI.tsx`, blog templates | blog → practice conversion |
| 3.4 | Public profiles (`/u/[username]`) revival: shareable stats/debrief pages as viral loop | L | `app/u/`, schema additions | profile shares; referral signups |

### Sequencing rule
Phase 1 fully ships **before** the first flag flip so every launch lands on prepared surfaces (teasers → live, waitlist → announcement, upsell paths in place). Phase 2 items 2.1–2.3 gate on their respective flags going live; 2.4–2.6 follow immediately after. Phase 3 starts once at least Interview Mode and one more flagship feature are live for their intended plans.

---

## UI Polish Audit (cross-cutting, fold into phases above)

- **Nav inconsistency** (F5) — fixed by 1.1.
- **Voice panel visual weight** — the always-mounted panel pushes core practice content down; fixed by 2.2.
- **Locked problems** open `ProModal` on dashboard but redirect to `/pricing?locked=slug` from direct practice URLs — unify both on the `FeatureUpsell` pattern (1.3) for a consistent locked-state language.
- **Solution gating** (F10) — show a lock-with-tooltip on the solution tab from the start ("Unlocks on Platform plan or after completing the problem") instead of surprising on click; fold into 1.3's component family.
- **Header user-menu** is the sole path to Profile/Settings — acceptable, but add "What's New" (1.2) and keep the menu the single account-surface entry.

## Error handling & edge cases

- Locked-feature touchpoints must never dead-end: every gate resolves to either `FeatureUpsell` or a disabled control with an explanatory tooltip.
- What's New unread state is localStorage-only — no schema change; guard JSON parsing per the existing corrupt-localStorage fix (PR #136).
- `/pricing?feature=<key>` with an unknown key falls back to the plain pricing page.
- Waitlist capture (1.5) must validate email server-side and be idempotent per address.

## Testing approach

- Component tests for `FeatureUpsell` states (each feature key, entitled vs not).
- Route tests: locked `?interview=` shows interstitial rather than silent redirect; `?feature=` highlight; `/whats-new` renders entries.
- Nav snapshot tests asserting desktop and mobile item parity.
- Analytics events (PostHog is already set up) on every new surface: notifier open, upsell CTA click, hub start, voice opt-in — these are the success metrics in the tables above.

## Out of scope

- New pricing tiers or price changes.
- Any change to AI evaluation/probe logic itself.
- Full visual redesign of the landing page (only the added section).
- CMS for blog or What's New content (data-file/MDX only).
