import { Guide } from '@/lib/guides';

export const rateLimiterGuide: Guide = {
  metadata: {
    slug: 'design-rate-limiter',
    problemSlug: 'design-rate-limiter',
    title: 'Design a Rate Limiter',
    seoTitle: 'Design a Rate Limiter — System Design Interview Guide',
    description:
      'Step-by-step guide to the rate limiter system design interview question: requirements, capacity estimation, the five limiting algorithms compared (token bucket vs sliding window), distributed rate limiting with Redis + Lua, and fail-open vs fail-closed. Includes an interactive algorithm simulator.',
    publishedAt: '2026-07-04',
    updatedAt: '2026-07-04',
    readingTime: '14 min read',
    keywords: [
      'rate limiter system design',
      'design a rate limiter interview',
      'token bucket vs sliding window',
      'distributed rate limiting',
      'token bucket algorithm',
      'system design interview',
    ],
  },
  sections: [
    {
      id: 'why-this-question',
      title: 'Why interviewers ask this question',
      blocks: [
        {
          id: 'why-1',
          type: 'markdown',
          content:
            'A rate limiter caps how many requests a client can make in a window of time — 100 requests per minute per user, say — and rejects the rest with a `429`. It looks like a utility class, and that is the trap. In 45 minutes it tests whether you know **five classic algorithms and their trade-offs**, whether you can reason about **shared state across servers** (the distributed part is the real question), and whether you think about **failure modes** — what happens when the limiter itself goes down.\n\nIt is also one of the few interview questions where the algorithm choice genuinely matters. Junior candidates name one algorithm; senior candidates compare token bucket against sliding window, explain race conditions on a Redis counter, and take a position on fail-open vs fail-closed.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'Run the limiter as middleware in the API gateway. Keep per-client counters in Redis, updated atomically with a Lua script. Use a token bucket (or sliding window counter) per client, return 429 with a Retry-After header when the bucket is empty, and fail open if Redis is unreachable. Everything else in the interview is justifying those choices.',
        },
      ],
    },
    {
      id: 'requirements',
      title: 'Step 1 — Requirements',
      blocks: [
        {
          id: 'req-1',
          type: 'markdown',
          content:
            "**Functional requirements**\n\n- Limit requests per client per time window (e.g., 100 req/min per user, per API key, or per IP).\n- Reject over-limit requests with `429 Too Many Requests` and tell the client when to retry.\n- Support different limits per endpoint or per pricing tier (free: 10/min, pro: 1,000/min).\n- (Clarify) Hard limit vs soft limit with burst allowance — this decides your algorithm.\n\n**Non-functional requirements**\n\n- **Low latency.** The limiter sits on the critical path of *every* request — its overhead budget is ~1 ms.\n- **Accurate.** Under-counting lets abusers through; over-counting throttles paying customers.\n- **Fault tolerant.** The limiter failing must not take the API down with it.\n- Works across a **distributed** fleet — clients hit many servers behind a load balancer.\n\n**Where does it sit?** Say this explicitly: the limiter runs as **middleware in the API gateway** (or a sidecar), before requests reach application servers. That placement means rejected requests are cheap — they never touch your business logic or database — and one implementation covers every service behind the gateway.",
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Ask what you are limiting by',
          content:
            'The single best clarifying question is: "Are we limiting by user ID, API key, or IP address?" IP-based limiting punishes users behind shared NATs (a university can be thousands of people on one IP); user-based limiting requires authentication first. Saying this out loud shows you know the identifier choice is a product decision, not a technical detail.',
        },
      ],
    },
    {
      id: 'capacity',
      title: 'Step 2 — Capacity estimation',
      blocks: [
        {
          id: 'cap-1',
          type: 'markdown',
          content:
            'Assume the limiter fronts an API with **10M daily active users**:\n\n- **Throughput:** 10M DAU × 50 requests/day ≈ 500M requests/day ≈ `500M / 86,400s` ≈ **~5,800 req/sec** average, **~30,000 req/sec** peak. Every one of those hits the limiter.\n- **Memory per counter:** a token bucket needs a key (~40 bytes), a token count (8 bytes), and a last-refill timestamp (8 bytes) — call it **~100 bytes with overhead** per client per rule.\n- **Total memory:** 10M users × 100 bytes ≈ **~1 GB** per rule. Even with 5 rules (per-endpoint limits), ~5 GB fits comfortably on one Redis node.\n- **Counter operations:** ~30,000 peak req/sec means ~30,000 Redis ops/sec — a single Redis instance handles ~100,000 ops/sec, so one node with a replica covers it.',
        },
        {
          id: 'cap-callout',
          type: 'callout',
          variant: 'info',
          title: 'Why bother with numbers?',
          content:
            'The estimates kill the over-engineering instinct: 1 GB of counters means you do not need a sharded counter cluster on day one, and 30,000 ops/sec means a single Redis node with a replica is plenty. The interesting problems here are algorithmic and about failure handling — not raw scale.',
        },
        {
          id: 'cap-widget',
          type: 'widget',
          widgetId: 'capacity-calculator',
          title: 'Capacity calculator',
          caption:
            'Plug in your own assumptions (DAU, requests per user, bytes per counter) and watch QPS and memory estimates update live.',
        },
      ],
    },
    {
      id: 'api',
      title: 'Step 3 — API and interface design',
      blocks: [
        {
          id: 'api-1',
          type: 'markdown',
          content:
            'The limiter has no public API of its own — its interface is the **response it adds to every request**. Two things matter: rejecting cleanly, and telling well-behaved clients how to back off.\n\nOn every response (allowed or not), return the standard headers:',
        },
        {
          id: 'api-headers',
          type: 'code',
          language: 'http',
          filename: 'Rate limit headers on every response',
          code: `HTTP/1.1 200 OK
X-RateLimit-Limit: 100        // requests allowed per window
X-RateLimit-Remaining: 37     // requests left in this window
X-RateLimit-Reset: 1751630400 // when the window resets (unix ts)`,
        },
        {
          id: 'api-429',
          type: 'code',
          language: 'http',
          filename: 'When the client is over the limit',
          code: `HTTP/1.1 429 Too Many Requests
Retry-After: 23               // seconds until the client may retry
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1751630423

{ "error": "rate_limit_exceeded", "retryAfterSeconds": 23 }`,
        },
        {
          id: 'api-callout',
          type: 'callout',
          variant: 'warning',
          title: '429, not 403 — and always send Retry-After',
          content:
            'A 403 tells the client "never" ; a 429 tells it "not yet". Without a Retry-After header, clients retry immediately in a tight loop and make the overload worse — the header turns your limiter into a back-pressure mechanism instead of just a bouncer.',
        },
      ],
    },
    {
      id: 'algorithms',
      title: 'Step 4 — The algorithms (the core of the interview)',
      blocks: [
        {
          id: 'algo-1',
          type: 'markdown',
          content:
            'This is where the interview is won or lost. There are five standard algorithms, and the differences that matter are: **does it allow bursts, is it accurate at window boundaries, and how much memory does it need per client?**',
        },
        {
          id: 'algo-comparison',
          type: 'comparison',
          title: 'Rate limiting algorithms compared',
          headers: ['Algorithm', 'How it works', 'Memory/client', 'Weakness'],
          rows: [
            [
              'Fixed window counter',
              'One counter per window (e.g., per minute); reset at the boundary',
              '~1 counter (tiny)',
              'Boundary burst: 100 req at 0:59 + 100 at 1:01 = 2× the limit in 2 seconds',
            ],
            [
              'Sliding window log',
              'Store a timestamp per request; count entries in the last window',
              'O(limit) timestamps — heavy',
              'Perfectly accurate but memory scales with the limit; overkill at scale',
            ],
            [
              'Sliding window counter',
              'Weighted blend of the current and previous fixed windows',
              '~2 counters (tiny)',
              'Slight approximation (assumes even spread in the previous window)',
            ],
            [
              'Token bucket',
              'Bucket refills at a steady rate; each request spends a token',
              '~2 values (tiny)',
              'Burst size = bucket size must be tuned; two parameters to explain',
            ],
            [
              'Leaky bucket',
              'Queue drains at a fixed rate; overflow is rejected',
              'Queue up to bucket size',
              'Smooths bursts away entirely — bursty-but-legitimate traffic waits or drops',
            ],
          ],
        },
        {
          id: 'algo-2',
          type: 'markdown',
          content:
            'A strong answer takes a position instead of listing options:\n\n- **Recommend token bucket** when clients have legitimately bursty traffic (almost all real APIs): a bucket of 100 tokens refilling at 10/sec allows a burst of 100, then sustains 10 req/sec. This is what Stripe and AWS use, and citing that is fair game.\n- **Recommend sliding window counter** as the pragmatic default when you want smooth limits with almost no memory: two counters per client, no boundary-burst problem, and the approximation error is negligible in practice (Cloudflare measured it at well under 1% mismatch on real traffic).\n- **Name fixed window only to reject it** — its boundary problem is the classic follow-up trap — and mention that leaky bucket is really a traffic *shaper* (smoothing output rate), not just a limiter.',
        },
        {
          id: 'algo-widget',
          type: 'widget',
          widgetId: 'rate-limiter-demo',
          title: 'Rate limiting algorithms, live',
          caption:
            'Fire requests at each algorithm and watch which ones get through — try a burst at a window boundary to see fixed window fail and token bucket absorb it.',
        },
        {
          id: 'algo-note',
          type: 'interviewNote',
          title: 'The boundary-burst question is coming',
          content:
            '"What happens if a client sends the full limit just before the window resets, and again just after?" is the most predictable follow-up on this question. With a fixed window, the client gets 2× the limit in seconds. Answering it before the interviewer asks — and naming sliding window counter or token bucket as the fix — is an instant senior signal.',
        },
      ],
    },
    {
      id: 'distributed',
      title: 'Step 5 — Distributed rate limiting',
      blocks: [
        {
          id: 'dist-1',
          type: 'markdown',
          content:
            'One server is easy — an in-memory counter works. The real question is: your API runs on **20 gateway nodes behind a load balancer**, and a client\'s requests land on all of them. Where does the counter live?\n\n**Option A — sticky, per-node counters.** Each node keeps local counters and enforces `limit / 20`. No shared state, zero added latency — but the load balancer does not distribute perfectly, so clients get throttled below their real limit on some nodes while sneaking over it in aggregate. Acceptable only for rough abuse protection.\n\n**Option B — shared state in Redis.** All nodes read and update one counter per client in a central Redis. Accurate, and the ~1 GB of counters and ~30,000 ops/sec from Step 2 fit on one node. This is the standard answer.\n\nBut a naive Redis implementation has a **race condition**: `GET count` → check → `INCR` is two round trips, and two nodes can both read 99, both decide "under 100", and both allow — the check and the update are not atomic. The fix is a **Lua script**, which Redis executes atomically as a single operation:',
        },
        {
          id: 'dist-lua',
          type: 'code',
          language: 'lua',
          filename: 'Atomic token bucket in Redis (Lua)',
          code: `-- KEYS[1] = bucket key, ARGV = rate, capacity, now
local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens') or ARGV[2])
local last   = tonumber(redis.call('HGET', KEYS[1], 'ts') or ARGV[3])

-- refill based on elapsed time, capped at capacity
tokens = math.min(ARGV[2], tokens + (ARGV[3] - last) * ARGV[1])

local allowed = tokens >= 1
if allowed then tokens = tokens - 1 end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[3])
redis.call('EXPIRE', KEYS[1], 3600)  -- idle buckets clean themselves up
return allowed`,
        },
        {
          id: 'dist-tradeoff',
          type: 'tradeoff',
          title: 'Centralized Redis counter store',
          pros: [
            'Accurate global limits regardless of which node serves the request',
            'One Lua script eliminates the check-then-update race entirely',
            'Counters expire naturally with TTLs — no cleanup job needed',
          ],
          cons: [
            'Adds a network hop (~1 ms) to every single request',
            'Redis becomes a critical dependency on the hot path — it must have a failure plan (Step 6)',
            'At extreme scale you must shard by client key, and cross-shard limits get harder',
          ],
        },
        {
          id: 'dist-2',
          type: 'markdown',
          content:
            'A polished answer offers the **hybrid**: each node keeps a small local cache and syncs deltas to Redis every few hundred milliseconds. You trade a bounded amount of accuracy (a client might briefly exceed the limit by a few percent) for removing Redis from the synchronous path. Rate limits are not billing — slight overshoot is fine, and saying so shows judgment.',
        },
      ],
    },
    {
      id: 'failure',
      title: 'Step 6 — When the limiter itself fails',
      blocks: [
        {
          id: 'fail-1',
          type: 'markdown',
          content:
            'This section separates candidates who have run production systems from those who have not. Redis will eventually be slow or unreachable. Your middleware times out after, say, 10 ms — then what?',
        },
        {
          id: 'fail-callout',
          type: 'callout',
          variant: 'warning',
          title: 'Fail open vs fail closed',
          content:
            'Fail open: if the limiter cannot answer, allow the request. Fail closed: reject it. For a rate limiter the default answer is fail open — the limiter exists to protect the API, and a protection system that takes the API down when it hiccups is worse than no protection. The exception is security-critical limits (login attempts, OTP verification), which should fail closed because letting a brute-force attack through is worse than blocking users for a few minutes. Giving the rule and the exception is the complete answer.',
        },
        {
          id: 'fail-2',
          type: 'markdown',
          content:
            "Round out the design with the client side and operations:\n\n- **Well-behaved clients** should honor `Retry-After` and use **exponential backoff with jitter** — jitter matters, or every throttled client retries in the same second and you get a synchronized retry storm.\n- **Monitor the 429 rate.** A spike means either an attack (good — the limiter is working) or a legitimate client outgrew its tier (a sales conversation, not an incident). You need dashboards to tell them apart.\n- **Ship rules as config**, not code: limits per endpoint and per tier change weekly, and redeploying the gateway to raise a customer's quota is a smell.",
        },
      ],
    },
    {
      id: 'mistakes',
      title: 'Common mistakes that cost offers',
      blocks: [
        {
          id: 'mistakes-1',
          type: 'markdown',
          content:
            '1. **Designing for one server.** An in-memory counter is a warm-up, not an answer — the interviewer is waiting for the multi-node story.\n2. **Missing the race condition.** Check-then-increment against Redis without atomicity is the most common technical failure on this question. Say "Lua script" or "atomic INCR with TTL".\n3. **Reciting all five algorithms without picking one.** A comparison with no recommendation reads as memorization. Take a position: token bucket for bursts, sliding window counter as the smooth default.\n4. **Never mentioning failure.** If you finish the design without saying what happens when Redis is down, expect the interviewer to ask — and it is much better volunteered than extracted.\n5. **Forgetting the response contract.** No 429, no Retry-After, no X-RateLimit headers means you designed the limiter but not the product around it.',
        },
        {
          id: 'mistakes-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Tiered limits per pricing plan, fail-open with a fail-closed exception for auth endpoints, the local-cache-plus-async-sync hybrid to get Redis off the hot path, and monitoring 429 rates to distinguish abuse from growth. Any one of these, mentioned unprompted, moves your grade up a notch.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What is the difference between token bucket and leaky bucket?',
      answer:
        'A token bucket refills tokens at a steady rate and lets clients spend saved-up tokens in a burst, so short spikes above the average rate are allowed. A leaky bucket drains requests at a fixed rate and smooths bursts away entirely, making it a traffic shaper. Choose token bucket when bursts are legitimate, leaky bucket when downstream systems need a perfectly steady request rate.',
    },
    {
      question: 'Which rate limiting algorithm should I pick in an interview?',
      answer:
        'Recommend token bucket if the interviewer cares about allowing bursts, or sliding window counter as a pragmatic default that avoids the fixed-window boundary problem with only two counters per client. Mention fixed window only to explain its boundary-burst flaw. Interviewers grade the justification and the trade-off awareness, not the specific choice.',
    },
    {
      question: 'How do you rate limit across multiple servers?',
      answer:
        'Store counters in a shared store like Redis so every gateway node checks the same per-client state, and use a Lua script or atomic increment so the check and update happen as one operation, avoiding race conditions. For very high scale, a hybrid works: each node keeps a local cache and syncs to Redis asynchronously, trading a small accuracy loss for lower latency.',
    },
    {
      question: 'Should a rate limiter fail open or fail closed?',
      answer:
        'Fail open by default: if the limiter or its backing store is unreachable, allow requests through, because a protection layer should not become the outage. The exception is security-sensitive limits like login or OTP attempts, which should fail closed since letting a brute-force attack through is worse than temporarily blocking users.',
    },
  ],
};
