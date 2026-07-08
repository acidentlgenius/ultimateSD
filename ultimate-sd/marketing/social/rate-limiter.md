# Rate Limiter — social pack

## LinkedIn caption

Most candidates don't fail the rate limiter question. They fail the follow-ups.

You say "100 requests per minute per user, return 429" and feel good. Then the interviewer asks one more question, and another, and you realize the whole design was a warm-up. This question looks like a utility class — it's actually about algorithms, shared state across servers, and what happens when your protection layer itself goes down.

Swipe through the 3 follow-ups that decide the round:

1. "You picked a fixed window — what's wrong with it?" (the boundary burst: 100 requests at 0:59 plus 100 at 1:01 is 200 in 2 seconds)
2. "Client bursts are legitimate — which algorithm?" (token bucket, and why refill rate and capacity are two different knobs)
3. "Now enforce that limit across 10 servers." (local counters multiply the quota; the fix is Redis plus a Lua script, and a fail-open vs fail-closed position)

I wrote the full walkthrough, with an interactive simulator where you can fire a burst at each algorithm and watch which ones let it through:

Guide: https://ultimate-sd.vercel.app/guides/design-rate-limiter
Practice it out loud (chat + diagram): https://ultimate-sd.vercel.app/practice/design-rate-limiter

Launch offer — 50 slots, ends July 15: 3 months of the Platform free.

#systemdesign #interviewprep #softwareengineering

## X thread

1/ Every rate limiter tutorial lists the algorithms. Almost nobody shows the difference between token bucket and sliding window — watch the same burst hit both: [attach GIF/carousel images]

2/ Start with the classic hole. Fixed window of 100 req/min resets its counter at the boundary. Send 100 requests at 0:59 and 100 at 1:01 — that's 200 requests in 2 seconds, all allowed. This is the most predictable follow-up in the interview.

3/ "But my clients have legitimate bursts" — that's token bucket territory. Bucket of 100 tokens refilling at 10/sec: absorb a burst of 100, then sustain 10 req/sec. Refill rate and capacity are separate knobs. Stripe and AWS both work this way.

4/ Don't need bursts? Sliding window counter is the pragmatic default: a weighted blend of the current and previous windows. Two counters per client, no boundary hole, and the approximation error is under 1% on real traffic (Cloudflare measured it).

5/ The follow-up where candidates run out of runway: "now enforce it across 10 servers." Local counters multiply the limit by 10. Central Redis fixes that — but GET-check-INCR is a race, so you need a Lua script for atomicity. And decide out loud: fail open for normal traffic, fail closed for login endpoints.

6/ Full guide is free, with an interactive simulator — fire a burst at all five algorithms and watch which ones break: https://ultimate-sd.vercel.app/guides/design-rate-limiter

## Media

Run `node scripts/generate-linkedin-media.mjs rate-limiter` — outputs PNGs to marketing/linkedin/output/rate-limiter/.
