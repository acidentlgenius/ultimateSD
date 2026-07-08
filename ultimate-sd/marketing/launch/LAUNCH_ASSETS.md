# Launch Asset Pack — ready to post

**Created:** 2026-07-04 · All copy follows brand.json voice (founder-style, plain language, no buzzwords).
**Sequencing (from MARKETING_PLAN.md):** Show HN first → same-week r/developersIndia → Peerlist → Product Hunt 2–3 weeks later once testimonials exist.

> ⚠️ Nothing here is posted automatically. Review, tweak, and post manually — each platform bans obvious automation, and founder replies in comments are where these launches are actually won.

---

## 1. Show HN (Hacker News)

**When:** Tuesday–Thursday, ~8:00am ET (5:30–6:30pm IST). Clear your calendar for 4 hours after posting — reply to every comment within minutes.

**Best link target:** the guides index (free, no login, interactive). If a dedicated `/simulations` gallery page existed, that would be even stronger — consider shipping one before posting.

**Title (pick one, A is recommended):**

- A: `Show HN: Interactive simulations of 47 distributed-systems concepts`
- B: `Show HN: Learn system design by breaking things – 47 interactive simulations`
- C: `Show HN: I made consistent hashing, rate limiting, and flash sales playable`

**First comment (post immediately after submitting — this is your pitch, the submission text stays empty for Show HN):**

> I kept freezing on follow-ups in system design interviews — not the intro, the "what if traffic 10x's or a region goes down" part. Reading articles didn't fix it; I understood the words but had never *watched* the systems fail.
>
> So I built interactive simulations instead: kill a cache node and watch p99 latency spike, add servers to a consistent-hash ring and see which keys move, run a flash sale and watch the queue absorb the burst. There are 47 of them now — rate limiting (token bucket vs sliding window, side by side), bloom filters, leader election, chunking/dedup like Dropbox, adaptive bitrate like YouTube, and so on.
>
> They're free and don't need a login. The written guides embed them so you can play with the concept right where it's explained.
>
> Tech: Next.js, all simulations are client-side React (no backend to melt if this gets traffic).
>
> The business model, since HN will ask: there's a paid tier with more practice problems and an AI interviewer that asks follow-ups while you talk through a design on a canvas. The simulations and guides stay free — they're the part I wish had existed when I was prepping.
>
> Would love to know which simulation is most confusing or most wrong. I'll be here all day.

**Comment-reply guidelines:**
- Never defensive. "Good catch, fixing it" beats any justification.
- Someone will say "this is just marketing for a paid course" → agree cheerfully: "Yep, the paid tier funds it. The 47 simulations stay free either way."
- Someone will find a bug in a simulation → fix it live during the launch if possible and reply with the fix. This is the single highest-leverage thing you can do on HN.

---

## 2. r/developersIndia — free-tool post

**When:** same week as HN, different day. Flair: "I Made This" / resources flair.
**Rules check before posting:** read the sub's self-promo rules that day; posts with any pricing mention get removed. Zero pricing talk.

**Title:**
`I built 47 free interactive simulations for system design prep (no login) — kill a cache node, watch p99 spike`

**Body:**

> System design prep resources are mostly reading — you read about consistent hashing, nod, and then blank in the interview when they ask "what happens when a node dies?"
>
> So I built simulations you can poke: a consistent-hash ring where you add/remove nodes and watch keys remap, a rate limiter where token bucket and sliding window run side by side against the same traffic, a flash-sale queue you can overload, Dropbox-style chunking where you edit a file and see which chunks re-upload.
>
> 47 of them, free, no login: [link to guides index]
>
> Built this because I kept failing the follow-up questions, not the intro. If something is confusing or plain wrong, tell me — I'd rather hear it here than have someone learn it wrong.

**Do not** link the pricing page. If someone asks about paid stuff in comments, answer honestly in a comment — that's allowed; promoting it in the post isn't.

---

## 3. X/Twitter thread (repeatable format — this is thread #1 of a 2–3/week cadence)

**Format:** hook tweet with GIF/video of a simulation → 4–6 explainer tweets → link tweet. Screen-record the rate-limiter widget with `scripts/generate-linkedin-media.mjs`-style tooling or QuickTime.

**Thread: "watch a rate limiter fail"**

1. `Every system design article explains token bucket vs sliding window. Almost nobody shows you the difference. Watch what happens when the same burst of traffic hits both: [GIF]`
2. `Fixed window: 100 req/min sounds safe. But 100 requests at 0:59 + 100 at 1:01 = 200 requests in 2 seconds. The window boundary is a hole. Interviewers love asking about this.`
3. `Token bucket: tokens drip in at a steady rate, requests spend them. Bursts are allowed until the bucket is empty — which is usually what you actually want. APIs like Stripe's work this way.`
4. `Sliding window counter: weighted average of two fixed windows. Not perfectly accurate, but cheap (one counter per user vs a log of every request). This is the pragmatic production default.`
5. `The senior-level follow-up: "now do it across 10 servers." Local counters = 10x your limit. Central Redis = atomicity problems unless you use Lua. This is where most candidates run out of runway.`
6. `I built an interactive version where you control the traffic and watch each algorithm respond — free, no login: [guide link]. Full rate-limiter interview guide included.`

**Reusable thread formula for future weeks:** pick one simulation → one failure mode as the hook ("watch X break") → 3–4 tweets of the concept → free guide link. Queue: cache stampede, consistent hashing node death, flash-sale overload, Dropbox chunking.

---

## 4. Peerlist Launchpad

**When:** week after HN. Low effort, India-focused (core INR market).

**Tagline:** `Practice system design by doing — 47 interactive simulations + AI interviewer`

**Description:**

> Most system design prep is reading someone else's design. Ultimate SD is practice: pick a problem, talk through your design with an AI interviewer that asks follow-ups, draw on a canvas, and play with 47 interactive simulations (rate limiting, consistent hashing, flash sales, file chunking) embedded in free guides.
>
> Free tier: 8 full problems + 20 AI credits/month + all simulations. Launch offer: first 50 people get 3 months of Platform free.

---

## 5. Product Hunt (hold until testimonials exist — 2–3 weeks post-HN)

**Prep checklist before launching:**
- [ ] 5+ named testimonials on the landing page
- [ ] 60-second demo video/GIF: one simulation + the AI interviewer asking a follow-up
- [ ] Hunt at 12:01am PT
- [ ] First-comment draft written (reuse HN first comment, warmer tone)

**Tagline options:**
- `Don't read system design. Practice it.`
- `System design prep you can actually interact with`

---

## Posting log (fill in as you go — feeds the weekly scorecard)

| Date | Channel | Link | Traffic (24h) | Signups | Payers |
|---|---|---|---|---|---|
| | | | | | |
