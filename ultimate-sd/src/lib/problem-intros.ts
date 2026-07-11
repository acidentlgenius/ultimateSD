import type { ProblemIntroContent } from '@/types';

// Hand-authored intros for the pilot set. Keyed by slug like PROBLEM_STEPS in
// problem-steps.ts. `source` is stamped at resolution time, never stored here.
// Content standard (enforced by problem-intro.test.ts): hook ≥100 chars,
// 2–4 concepts with real blurbs.
export const PROBLEM_INTROS: Record<string, Omit<ProblemIntroContent, 'source'>> = {
  'design-tinyurl': {
    hook: "Marketing links are wrecking your company's SMS campaigns — full URLs blow past character limits and nobody trusts them. You've been asked to build the link layer for the whole business: turn any URL into a 7-character link, then redirect billions of clicks a month with the reliability of DNS. Shortening can be slow-ish; redirects can never be.",
    concepts: [
      { term: 'Base62 encoding', blurb: "Map a numeric ID onto [a-zA-Z0-9] to get short, URL-safe keys without collisions." },
      { term: 'Read-heavy caching', blurb: "Redirects outnumber shortens ~100:1 — a cache in front of the store absorbs almost all reads." },
      { term: 'Collision handling', blurb: "Decide up front how two URLs can never map to the same key: counters, ranges, or retry-on-conflict." },
    ],
  },
  'design-youtube': {
    hook: "You've joined the video infrastructure team the week creators started uploading 4K. Every video must be ingested, transcoded into a ladder of resolutions, and served to viewers on flaky mobile networks across the globe — while the homepage keeps recommending fresh uploads within minutes of processing.",
    concepts: [
      { term: 'Chunked upload', blurb: "Split multi-GB files into resumable parts so one dropped packet does not restart the upload." },
      { term: 'Transcoding pipeline', blurb: "An async worker fleet converts each upload into multiple codecs/resolutions — queue it, never do it inline." },
      { term: 'CDN delivery', blurb: "Serve video bytes from edge servers near the viewer; the origin only fills cache misses." },
      { term: 'Metadata vs blob split', blurb: "Titles and view counts live in a database; the video bytes live in object storage. Different systems, different guarantees." },
    ],
  },
  'design-twitter': {
    hook: "Your social app just hit the growth curve every founder dreams about — and the timeline is now the slowest page in the product. A single celebrity post has to reach 100M followers, while an average user's feed must assemble from hundreds of follows in under 200ms. Precompute, or compute on read? That tension is this whole problem.",
    concepts: [
      { term: 'Fan-out on write vs read', blurb: "Push each post into follower timelines at write time, or assemble timelines at read time — each breaks at a different scale." },
      { term: 'The celebrity problem', blurb: "Accounts with millions of followers make write fan-out explode; hybrid approaches special-case them." },
      { term: 'Timeline caching', blurb: "Keep each user's materialized feed in memory (e.g. Redis lists) so reads are one lookup, not a join." },
    ],
  },
  'design-whatsapp': {
    hook: "You're building the messaging backbone for an app people use instead of SMS — which means a message can never be lost, even when the recipient's phone is off for a week. Billions of tiny messages a day flow through long-lived connections, and every one needs sent/delivered/read receipts that actually tell the truth.",
    concepts: [
      { term: 'Persistent connections', blurb: "WebSockets/TCP keep a socket open per online device so the server can push instantly." },
      { term: 'Offline delivery queues', blurb: "Messages for offline users park in a per-user queue and drain when the device reconnects." },
      { term: 'Delivery acknowledgements', blurb: "Each tick (sent, delivered, read) is a distinct ack event flowing back through the pipeline." },
    ],
  },
  'design-distributed-cache': {
    hook: "Your product team keeps buying bigger database instances and it keeps not being enough. You're going to build the shared cache layer every service will depend on: a fleet of memory nodes that survives machines dying mid-traffic, rebalances without a thundering herd of misses, and answers in under a millisecond.",
    concepts: [
      { term: 'Consistent hashing', blurb: "Place keys on a hash ring so adding or losing a node remaps only a small slice of keys." },
      { term: 'Eviction policy', blurb: "Memory is finite — LRU/LFU decide which entries die when the cache fills." },
      { term: 'Replication vs availability', blurb: "Copies of hot keys survive node loss, but every copy risks serving stale data. Pick your trade-off deliberately." },
    ],
  },
  'design-rate-limiter': {
    hook: "Last Tuesday one buggy client retried itself into 40,000 requests per second and took the public API down for everyone. You own the fix: a rate limiter in front of every endpoint that makes fair, per-user decisions in microseconds — across dozens of API servers that each see only a slice of the traffic.",
    concepts: [
      { term: 'Token bucket', blurb: "Each user gets tokens at a steady rate; a request spends one. Allows short bursts, enforces the average." },
      { term: 'Distributed counters', blurb: "Limits must hold across all API servers — shared state (e.g. Redis) or sticky routing keeps counts honest." },
      { term: 'Fail-open vs fail-closed', blurb: "When the limiter itself is down: let traffic through (protect availability) or block it (protect the backend)?" },
    ],
  },
};
