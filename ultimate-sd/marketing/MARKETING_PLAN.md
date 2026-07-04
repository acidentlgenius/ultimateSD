# SysDesignAI — Organic Growth & Marketing Plan

**Date:** 2026-07-04
**Goal:** 1,000 paying customers, organically (no ad budget)
**Product:** ultimate-sd.vercel.app — system design interview prep with 87 problems, 47 interactive simulations, AI evaluation
**Pricing:** Free (8 problems, BYOK) · ₹499/mo · ₹1,499–1,999 lifetime · $29 lifetime global

---

## Part 1: Why LinkedIn didn't work (and won't)

This isn't a failure of effort — it's the wrong channel for this product:

1. **Nobody buys interview prep from a feed.** People buy it the week they get an interview scheduled. At that moment they **search Google** ("design whatsapp system design interview") or **ask on Reddit/Discord/Blind**. LinkedIn is where they announce the job *after* they got it.
2. **LinkedIn rewards personal brands, not product posts.** Product promo posts from small accounts get ~0 organic reach. The people who win on LinkedIn (ByteByteGo's Alex Xu) spent years posting free educational content before selling anything.
3. **Your buyers are anonymous when job-hunting.** Engineers hide interview prep from their network (their manager is on LinkedIn!). They're active on Reddit, Blind, and Discord precisely because those are anonymous.

**Lesson:** Go where people are *actively preparing*, at the moment of high intent.

---

## Part 2: The honest math to 1,000 paying customers

Work backwards. Typical funnel for prosumer prep tools:

| Stage | Rate | Numbers needed |
|---|---|---|
| Visitor → Signup | 5–15% (high-intent SEO traffic converts best) | ~150,000–400,000 visitors |
| Signup → Activated (does 1 real practice session) | 30–50% | ~20,000–40,000 signups |
| Activated → Paid | 3–8% (interview-scheduled users convert much higher) | 1,000 paid |

**Implications:**
- 1,000 customers is a **9–15 month** goal, not a 30-day goal. Anyone promising faster is selling you something.
- Milestones that matter: **first 10 (manual, weeks 1–4) → first 100 (launch spikes, months 2–3) → 1,000 (SEO compounding, months 9–15)**.
- Every 1% improvement in the funnel is worth as much as months of traffic work. Fix conversion **before** scaling traffic.
- Revenue check: 1,000 × blended ~₹1,200 ≈ ₹12L (~$14k). Real, but this is a volume business — global $29 buyers matter a lot (2–3× ARPU of INR buyers).

---

## Part 3: Strategy — content-led + free-tool-led growth

Your unfair advantage is the **47 interactive simulations**. Every competitor (ByteByteGo, DesignGurus, Hello Interview) sells *reading*. You sell *doing*. Interactive explainers are catnip for Hacker News, Twitter, and Reddit — and nobody can screenshot-pirate an interactive widget.

### Pillar A — SEO problem guides (the compounding engine) ⭐ highest priority

**The gap today:** your 87 `/practice/*` pages are in the sitemap, but they're interactive apps — Google sees a UI shell, not rankable content. Hello Interview built their entire business on free, excellent, *readable* guides that rank for "design X interview".

**The play:** for each problem, publish a public, no-login, genuinely excellent written guide at `/guides/<slug>` (or make `/practice/<slug>` SSR a full written guide above the interactive app):

- 1,500–3,000 words: requirements → HLD → deep dives → trade-offs (you already have per-problem curricula — repackage, don't rewrite)
- **Embed the relevant interactive simulation directly in the page, free, no login** — this is the moat; guides that let you *play* with consistent hashing beat static articles
- Architecture diagram as a real image (crawlable + shows in image search + OG share cards — you already have media-generation scripts)
- CTA at the end: "Practice this problem with an AI interviewer → free"
- Proper `generateMetadata`, JSON-LD Article schema, internal links between related guides

**Target keywords** (in rough priority): "design whatsapp system design", "design url shortener", "rate limiter system design", "design dropbox", "system design interview questions 2026", "consistent hashing explained", plus the emerging-topic gap almost nobody covers well: **"design a RAG system", "AI agent system design interview"** — you have simulations for these and competition is thin.

**Cadence:** 2–3 guides/week. All 87 live within ~3 months. SEO takes 3–6 months to pay — start this week, everything else runs in parallel.

### Pillar B — Launch moments (traffic spikes + backlinks that feed SEO)

Sequence them, don't fire all at once:

1. **Show HN** (Hacker News) — frame around the *free interactive simulations*, never the paid course: *"Show HN: Interactive simulations of 47 distributed-systems concepts (rate limiting, consistent hashing, flash sales)"*. HN loves interactive explainers and hates promo. Post ~8am ET Tue–Thu. Reply to every comment fast. A front-page hit = 20–50k visitors + backlinks that permanently boost SEO.
2. **Product Hunt** — 2–3 weeks after HN, once testimonials exist. Prepare a 60-sec demo GIF/video of a simulation.
3. **Peerlist Launchpad** — India-focused, low effort, your core INR market.
4. **r/developersIndia, r/leetcode free-resource posts** — "I built free interactive system design simulations" with zero sales pitch. These subs are allergic to promotion but generous to genuinely free tools.

### Pillar C — Be where buyers ask questions (30 min/day, forever)

- **Reddit** (r/leetcode 1M+, r/ExperiencedDevs, r/cscareerquestions, r/developersIndia): answer actual system design questions substantively. Link only when it truly answers the question, ~1 in 5 replies. Reddit karma → Google also indexes those threads.
- **Twitter/X:** 2–3 visual threads/week — screen-record a simulation as GIF ("watch what happens to p99 latency when the cache dies"), explain the concept, link the free guide. This format built ByteByteGo. Reuse your `generate-linkedin-media.mjs` pipeline for X-sized media.
- **Blind:** interview-prep threads for specific companies — highest buying intent anywhere.
- **Discord:** CS Career Hub and similar prep servers — be a helpful regular, not a spammer.

### Pillar D — Do things that don't scale (first 10–50 customers, this month)

1. Search Reddit/Blind for "system design interview next week" posts (there are dozens daily). DM or reply offering **free Pro access in exchange for 20 minutes of feedback**. Do 20 of these.
2. Watch 5 of them use the product (screen share). You will find your biggest conversion leaks in the first 3 sessions.
3. Convert the happy ones to paid with a personal founder discount; collect **named testimonials with outcomes** ("passed my L5 loop at ___") — these become your landing page social proof.
4. Personally onboard every paying customer for the first 100. Ask each one: "where did you hear about us?" — this tells you which pillar to double down on.

### Pillar E — Conversion plumbing (do before scaling traffic)

- **Global payments:** Razorpay INR-only leaves your highest-ARPU buyers ($29 global) stranded. Add Lemon Squeezy or Polar (merchant-of-record, handles global tax, days to integrate) for non-India buyers. Geo-detect and show the right currency.
- **Time-to-aha under 3 minutes:** guest users should hit one simulation + one AI-evaluated answer before any signup wall. Measure this funnel in PostHog (you already have it wired) — landing → simulation touched → signup → first practice → paywall hit → paid.
- **Email capture + drip (Resend is already integrated):** Day 0 welcome + best free guide · Day 2 "try the WhatsApp problem" · Day 5 testimonial + interview-prep checklist · Day 8 launch offer expiring. People prepping for interviews *want* useful emails.
- **Interview-date urgency:** ask at signup "when is your interview?" — someone answering "in 2 weeks" should get a tailored 14-day plan and is your hottest lead. This single question segments free-riders from buyers.
- **Social proof on landing + pricing pages:** even 5 real testimonials with names/roles measurably lift conversion. You have zero right now; Pillar D fixes that.

---

## Part 4: 90-day roadmap

### Weeks 1–2 — Foundation (no marketing yet)
- [ ] Instrument the PostHog funnel (landing → sim → signup → practice → paywall → paid)
- [ ] Add Lemon Squeezy/Polar for global $; geo-priced pricing page
- [ ] Ship first 5 SEO guides (pick the highest-volume: WhatsApp, TinyURL, rate limiter, Dropbox, YouTube), with embedded free simulations
- [ ] Landing page: lead with "Don't read system design. **Practice it.**" + a live embedded simulation above the fold
- [ ] Set up the Day 0–8 email drip in Resend

### Weeks 3–4 — First 10 customers, manually
- [ ] 20 free-Pro-for-feedback outreaches on Reddit/Blind; 5 recorded user sessions
- [ ] Fix the top 3 friction points you observe
- [ ] Collect 5 testimonials → landing + pricing pages
- [ ] 6 more guides live (total ~11); start 2–3 X threads/week
- [ ] **Milestone: 10 paying customers, each interviewed**

### Weeks 5–8 — Launch season
- [ ] Week 5: **Show HN** (simulations angle) + same-week r/developersIndia free-tool post
- [ ] Week 6: **Peerlist launch**; capture HN/Reddit traffic into email drip
- [ ] Week 7: **Product Hunt** (demo GIF, testimonials ready, hunt at 12:01am PT)
- [ ] Throughout: 2–3 guides/week (total ~25), daily 30-min Reddit/Discord presence
- [ ] **Milestone: 100 paying customers, ~1,000 email subscribers**

### Weeks 9–12 — Find what worked, double down
- [ ] PostHog: which source produced *payers* (not just visitors)? Put 60% of your time there
- [ ] Keep guide cadence (total ~40 by day 90); update titles/descriptions of any guide getting impressions but no clicks (Google Search Console)
- [ ] Start 1 YouTube video/week if any appetite: screen-recorded "let's design X together" using your own canvas — YouTube is the #2 channel in this niche (NeetCode playbook) and compounds like SEO
- [ ] Add an in-product referral: "give a friend 20% off, get a free month"
- [ ] **Milestone: 150–250 paying customers, clear #1 channel identified**

### Months 4–12 — Compound to 1,000
- All 87 guides live and iterating on Search Console data; SEO becomes your top acquisition source around months 5–7
- Weekly cadence: 1 guide refresh, 3 X threads, 1 YouTube video, daily community presence
- Consider: campus ambassadors / bootcamp partnerships in India (bulk lifetime deals), a free "system design interview checklist" lead magnet, annual plan

---

## Part 5: What NOT to do (new-founder traps)

1. **Don't buy ads** until organic conversion is proven (>3% activated→paid). Ads amplify a funnel; they can't fix one.
2. **Don't build more features.** 87 problems and 47 simulations is already more product than distribution. Every hour on features is an hour not spent on the guides that will actually rank.
3. **Don't keep broadcasting on LinkedIn.** If you enjoy it, switch to personal build-in-public stories (numbers, lessons, failures) — those get reach; product promos don't.
4. **Don't discount-spam.** One credible launch offer with a real deadline beats permanent "50% off" (which trains people to never pay full price).
5. **Don't measure vanity metrics.** Visitors and signups feel good; the only weekly numbers that matter are **activated users** and **new payers by source**.

## Weekly scorecard (fill every Monday, 10 minutes)

| Metric | Target trend |
|---|---|
| Guide pages live | +2–3/week |
| Organic visitors (Search Console) | growing from ~month 3 |
| Signups → activated % | ≥ 40% |
| New paying customers (by source) | the number to obsess over |
| Testimonials collected | +1/week early on |
