import { Guide } from '@/lib/guides';

export const tinyUrlGuide: Guide = {
  metadata: {
    slug: 'design-tinyurl',
    problemSlug: 'design-tinyurl',
    title: 'Design a URL Shortener (TinyURL)',
    seoTitle: 'Design a URL Shortener (TinyURL) — System Design Interview Guide',
    description:
      'Step-by-step guide to the TinyURL system design interview question: requirements, capacity estimation, base62 encoding, database schema, caching, and the trade-offs interviewers probe. Includes an interactive encoding simulator.',
    publishedAt: '2026-07-04',
    updatedAt: '2026-07-04',
    readingTime: '14 min read',
    keywords: [
      'url shortener system design',
      'tinyurl system design',
      'design tinyurl interview',
      'base62 encoding',
      'bitly system design',
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
            'A URL shortener takes a long URL and returns a short alias (like `bit.ly/3xYzAbc`) that redirects to the original. It looks trivial — and that is exactly why interviewers love it. In 45 minutes it tests whether you can clarify requirements, estimate scale, design a clean API, pick a database with a reason, and handle a **read-heavy workload** with caching.\n\nIt is the most common warm-up question at every level. Junior candidates are expected to get a working design; senior candidates are expected to nail the trade-offs: encoding strategy, collision handling, and what happens at 100M redirects per day.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'Generate a unique ID per URL, encode it in base62 to get a 7-character code, store the mapping in a key-value-friendly database, put a cache in front for redirects, and return a 302. Everything else in the interview is justifying those choices.',
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
            '**Functional requirements**\n\n- Given a long URL, generate a short, unique alias.\n- Visiting the short URL redirects to the original URL.\n- Links can have an expiration time (default + user-specified).\n- (Clarify) Custom aliases — nice-to-have, easy to support.\n- (Clarify) Click analytics — call it out, then explicitly de-scope it.\n\n**Non-functional requirements**\n\n- **High availability.** If redirection is down, every shared link on the internet breaks.\n- **Low latency** on redirects — this is on the critical path of a user click.\n- Short codes should not be **predictable** (guessing sequential codes leaks private links).\n- Read-heavy: assume a **100:1 read-to-write ratio**.',
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Say the ratio out loud',
          content:
            'The single most important sentence in this interview is: "This system is extremely read-heavy, so I will optimize the redirect path." It tells the interviewer your whole design will be shaped by the workload, not by habit.',
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
            'Assume a bit.ly-scale service:\n\n- **Writes:** 5M new URLs/day ≈ `5M / 86,400s` ≈ **~60 writes/sec** (peak ~300/sec).\n- **Reads:** 100M redirects/day ≈ **~1,200 reads/sec** (peak ~6,000/sec).\n- **Storage:** 5M/day × 365 × 5 years ≈ 9B records. At ~500 bytes each ≈ **~4.5 TB** — small enough that storage is not the hard part.\n- **Cache:** follow the 80/20 rule — 20% of URLs drive 80% of traffic. Caching one day of hot redirects ≈ 20M × 500B ≈ **~10 GB**. That fits on a single Redis node.',
        },
        {
          id: 'cap-callout',
          type: 'callout',
          variant: 'info',
          title: 'Why bother with numbers?',
          content:
            'The estimates drive real decisions: 4.5 TB means you do not need exotic storage; 6,000 peak reads/sec means one database with a cache is plenty; 10 GB of hot data means the entire redirect path can be served from memory.',
        },
        {
          id: 'cap-widget',
          type: 'widget',
          widgetId: 'capacity-calculator',
          title: 'Capacity calculator',
          caption:
            'Plug in your own assumptions (DAU, requests per user, object size) and watch QPS and storage estimates update live.',
        },
      ],
    },
    {
      id: 'api',
      title: 'Step 3 — API design',
      blocks: [
        {
          id: 'api-1',
          type: 'markdown',
          content: 'Two endpoints cover the core product: create a short URL, and redirect.',
        },
        {
          id: 'api-create',
          type: 'code',
          language: 'http',
          filename: 'Create a short URL',
          code: `POST /api/v1/urls
{
  "longUrl": "https://example.com/very/long/path?with=params",
  "customAlias": "launch2026",   // optional
  "expiresAt": "2027-01-01"      // optional
}

201 Created
{ "shortUrl": "https://tny.app/launch2026" }`,
        },
        {
          id: 'api-redirect',
          type: 'code',
          language: 'http',
          filename: 'Redirect',
          code: `GET /{shortCode}

302 Found
Location: https://example.com/very/long/path?with=params`,
        },
        {
          id: 'api-301',
          type: 'callout',
          variant: 'warning',
          title: '301 vs 302 — a classic follow-up',
          content:
            'A 301 (permanent) lets browsers cache the redirect, reducing load on your servers — but you lose every subsequent click for analytics and cannot change or expire the mapping. A 302 keeps each click flowing through your service. If analytics matter (they always do for a link shortener business), answer 302.',
        },
      ],
    },
    {
      id: 'short-code',
      title: 'Step 4 — Generating the short code (the core of the interview)',
      blocks: [
        {
          id: 'code-1',
          type: 'markdown',
          content:
            'This is where the interview is won or lost. You need a function that maps each long URL to a short, unique, hard-to-guess code.\n\n**How long should the code be?** With base62 (`a-z`, `A-Z`, `0-9`), a 7-character code gives `62^7 ≈ 3.5 trillion` combinations — enough for ~9B URLs over 5 years with lots of headroom.\n\nThere are three standard approaches:',
        },
        {
          id: 'code-comparison',
          type: 'comparison',
          title: 'Short-code generation strategies',
          headers: ['Approach', 'How it works', 'Pros', 'Cons'],
          rows: [
            [
              'Hash + truncate',
              'MD5/SHA the long URL, take the first 7 base62 chars',
              'Stateless, same URL → same code',
              'Collisions need retry loops; birthday paradox bites at scale',
            ],
            [
              'Auto-increment counter + base62',
              'Global counter; encode the ID in base62',
              'Zero collisions, trivially simple',
              'Sequential codes are guessable; counter is a single point of contention',
            ],
            [
              'Key Generation Service (KGS)',
              'Pre-generate random unique keys offline; hand them out from a pool',
              'No collisions at request time, not guessable, fast',
              'One more service to run; keys must be marked used atomically',
            ],
          ],
        },
        {
          id: 'code-2',
          type: 'markdown',
          content:
            'A strong answer: start with **counter + base62** for simplicity, then address its two weaknesses — add a random offset or shuffle to stop guessability, and shard the counter (e.g., each server leases ranges like 1–1M, 1M–2M from ZooKeeper or a ticket table) to remove the contention point. Mentioning the **KGS** pattern as the "productionized" version signals depth.',
        },
        {
          id: 'code-widget',
          type: 'widget',
          widgetId: 'encoding-visualizer',
          title: 'Base62 encoding, live',
          caption:
            'Type any number and watch it convert to a base62 short code character by character — this is exactly what the counter approach does in production.',
        },
      ],
    },
    {
      id: 'database',
      title: 'Step 5 — Database and schema',
      blocks: [
        {
          id: 'db-1',
          type: 'markdown',
          content:
            'The data model is a single mapping table — this workload is a textbook **key-value lookup**:',
        },
        {
          id: 'db-schema',
          type: 'code',
          language: 'sql',
          filename: 'urls table',
          code: `CREATE TABLE urls (
  short_code   VARCHAR(10) PRIMARY KEY,  -- the base62 code
  long_url     TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT now(),
  expires_at   TIMESTAMP,
  user_id      BIGINT                     -- for quotas / analytics
);`,
        },
        {
          id: 'db-2',
          type: 'markdown',
          content:
            '**SQL or NoSQL?** Either works, and saying so earns points — what matters is the reasoning. There are no joins, no transactions across rows, and simple access patterns, so a key-value or wide-column store (DynamoDB, Cassandra) scales horizontally with no ceremony. A single Postgres instance also comfortably handles 60 writes/sec and, with read replicas plus the cache absorbing most reads, this never becomes the bottleneck. Pick one, justify it, and move on — spending ten minutes agonizing here is a common mistake.',
        },
      ],
    },
    {
      id: 'caching',
      title: 'Step 6 — The redirect path: caching for 100M reads/day',
      blocks: [
        {
          id: 'cache-1',
          type: 'markdown',
          content:
            'The redirect path is: `GET /{code}` → load balancer → app server → **cache** → database (on miss).\n\n- Use **cache-aside**: check Redis for the code; on miss, read the DB and populate the cache with a TTL.\n- ~10 GB of hot mappings means the vast majority of redirects never touch the database.\n- URL mappings are **immutable** (a code never re-points to a different URL), which makes caching gloriously simple — no invalidation problem, the hardest problem in caching just does not exist here.\n- For expired links, check `expires_at` before redirecting and return `410 Gone`.',
        },
        {
          id: 'cache-tradeoff',
          type: 'tradeoff',
          title: 'Adding a cache layer',
          pros: [
            'Sub-millisecond redirects for hot links',
            'Database load drops by ~90%+ for a read-heavy workload',
            'Immutable data means no cache invalidation complexity',
          ],
          cons: [
            'One more component to operate and monitor',
            'Cold start / cache failure sends a thundering herd to the DB — mention request coalescing',
            'Slightly stale reads on expiry (acceptable: seconds of staleness on a dead link)',
          ],
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
            '1. **Jumping straight to architecture** without stating the read:write ratio — the whole design follows from it.\n2. **Hand-waving the encoding**: "I\'ll just hash it" with no collision story is the most common failure on this question.\n3. **Answering 301 without mentioning analytics** — it signals you have not thought about why the product exists.\n4. **Over-engineering**: proposing Kafka, microservices, and multi-region for 60 writes/sec. Scale the design to the numbers you estimated.\n5. **Forgetting expiration cleanup** — a lazy check at read time plus a periodic batch delete is a perfectly good answer.',
        },
        {
          id: 'mistakes-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Rate limiting on the create endpoint (stop abuse), request coalescing on cache misses, and separating the read path and write path for independent scaling. Any one of these, mentioned unprompted, moves your grade up a notch.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Is the TinyURL question easy?',
      answer:
        'It is rated Easy because a working design is straightforward, but it has depth: encoding strategy, collision handling, 301 vs 302, and cache design separate junior from senior answers. It is the most frequently asked system design question, so it is worth mastering completely.',
    },
    {
      question: 'How long should a short URL code be?',
      answer:
        'Seven base62 characters give about 3.5 trillion unique combinations, which covers roughly 9 billion URLs over five years with large headroom. Six characters (57 billion combinations) also works for smaller scale assumptions.',
    },
    {
      question: 'Should I use a 301 or 302 redirect for a URL shortener?',
      answer:
        'Use a 302 (temporary) redirect if you need click analytics or the ability to expire and change links, because every click passes through your servers. A 301 (permanent) lets browsers cache the redirect, which reduces server load but permanently gives up analytics and control.',
    },
    {
      question: 'Should I use SQL or NoSQL for a URL shortener?',
      answer:
        'Both are defensible. The workload is a simple key-value lookup with no joins or multi-row transactions, so a key-value store like DynamoDB scales naturally; a single relational database with read replicas and a cache in front also easily handles the write volume. Interviewers grade the justification, not the brand name.',
    },
  ],
};
