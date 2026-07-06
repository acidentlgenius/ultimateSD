import { Guide } from '@/lib/guides';

export const distributedCacheGuide: Guide = {
  metadata: {
    slug: 'design-distributed-cache',
    problemSlug: 'design-distributed-cache',
    title: 'Design a Distributed Cache (Redis-like)',
    seoTitle: 'Design a Distributed Cache — System Design Interview Guide (Redis)',
    description:
      'Design a Redis-like distributed cache for a system design interview: LRU eviction, consistent hashing, replication, cache stampedes and hot keys — with interactive simulations of eviction and consistent hashing.',
    publishedAt: '2026-07-04',
    updatedAt: '2026-07-04',
    readingTime: '15 min read',
    keywords: [
      'distributed cache system design',
      'design a distributed cache',
      'redis system design',
      'consistent hashing',
      'lru cache eviction',
      'cache stampede thundering herd',
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
            'Every large system you will ever design has a cache in it — so interviewers love making the cache itself the system under design. "Design Redis" tests distributed-systems fundamentals in their purest form: **partitioning, replication, consistency, and failure handling**, without the distraction of product features.\n\nIt is also a question where infrastructure teams (and companies like Redis Labs and Amazon) probe genuinely deep, because a wrong answer here — say, mod-N sharding — has a precise, demonstrable cost you are expected to know.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'An in-memory key-value store, partitioned across nodes with consistent hashing, each partition replicated asynchronously to replicas for availability, LRU eviction when memory fills, TTLs for expiry, and clients (or a smart proxy) routing keys to the right node. Then earn seniority on the failure modes: node death, hot keys, and stampedes.',
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
            '**Functional requirements**\n\n- `get(key)`, `set(key, value, ttl)`, `delete(key)` — that is the whole API, and its simplicity is the point.\n- TTL-based expiry.\n- Eviction when memory is full (LRU by default).\n\n**Non-functional requirements**\n\n- **Latency:** sub-millisecond — the entire reason the cache exists. Everything lives in RAM.\n- **Scale:** say, 1 TB of cached data, 1M requests/sec — more than one machine, hence *distributed*.\n- **Availability over consistency:** a cache that serves slightly stale data is useful; a cache that blocks for consensus is not. This single sentence shapes every choice below.\n- Cache misses must be tolerable — the source of truth is always the database behind it.',
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Name the CAP position early',
          content:
            '"This is an AP system — I will choose availability and asynchronous replication, because the database remains the source of truth" is the framing sentence for the whole interview. It justifies async replication, eventual consistency, and serving through failures.',
        },
      ],
    },
    {
      id: 'single-node',
      title: 'Step 2 — A single node: hash table + eviction',
      blocks: [
        {
          id: 'node-1',
          type: 'markdown',
          content:
            'Start on one machine — interviewers reward building up from a working core.\n\n- **Storage:** an in-memory hash table → O(1) get/set.\n- **Expiry:** lazy deletion (check TTL on read) plus a periodic sampling sweeper — exactly what Redis does. Purely lazy leaks memory for never-read keys; purely active burns CPU.\n- **Eviction:** when memory is full, something must go. **LRU** — evict the least-recently-used key — is the default, implemented as a hash map + doubly-linked list so both lookup and "move to front" are O(1). This exact structure is also a favorite coding question; being fluent in it pays twice.\n- **Concurrency:** Redis famously answers with a single-threaded event loop — no locks, no races, and it is still fast because everything is in RAM and operations are tiny.',
        },
        {
          id: 'node-widget',
          type: 'widget',
          widgetId: 'cache-visualizer',
          title: 'LRU eviction, live',
          caption:
            'Fill the cache and watch which keys get evicted as new ones arrive — then try access patterns that defeat LRU, like a sequential scan.',
        },
        {
          id: 'node-comparison',
          type: 'comparison',
          title: 'Eviction policies',
          headers: ['Policy', 'Evicts', 'Weakness'],
          rows: [
            ['LRU', 'Least recently used key', 'One large scan flushes the whole cache'],
            ['LFU', 'Least frequently used key', 'Old popular keys linger after they stop being hot'],
            ['FIFO', 'Oldest inserted key', 'Ignores actual usage entirely'],
            ['Random', 'A random key', 'Surprisingly decent; zero metadata cost'],
          ],
        },
      ],
    },
    {
      id: 'partitioning',
      title: 'Step 3 — Going distributed: consistent hashing',
      blocks: [
        {
          id: 'part-1',
          type: 'markdown',
          content:
            '1 TB does not fit in one machine\'s RAM, so partition the keyspace. The naive approach — `hash(key) % N` — hides a disaster: **when N changes (a node dies, or you add one), almost every key maps to a different node**, and your hit rate drops to ~0 at the exact moment the cluster is already stressed. The database behind the cache then takes the full traffic. This scenario is why the question is asked.\n\n**Consistent hashing** fixes it: place nodes on a hash ring; each key belongs to the next node clockwise. Adding or removing a node only moves ~`1/N` of the keys. Because raw ring placement is lumpy, each physical node appears as **100–200 virtual nodes** on the ring, smoothing the distribution — and letting a beefier machine take proportionally more vnodes.',
        },
        {
          id: 'part-widget',
          type: 'widget',
          widgetId: 'consistent-hashing-demo',
          title: 'Consistent hashing ring, live',
          caption:
            'Add and remove nodes and watch how many keys actually move — then compare with what mod-N sharding would have done.',
        },
        {
          id: 'part-2',
          type: 'markdown',
          content:
            '**Who routes requests?** Three options: a smart client library that knows the ring (memcached style — fastest, but ring updates must reach every client), a proxy tier (Twemproxy/Envoy — centralizes routing at the cost of a hop), or cluster-native redirects (Redis Cluster\'s MOVED responses). Any is acceptable — name the trade-off you are taking.',
        },
      ],
    },
    {
      id: 'replication',
      title: 'Step 4 — Replication and consistency',
      blocks: [
        {
          id: 'rep-1',
          type: 'markdown',
          content:
            'Without replication, a dead node means a cold shard and a database traffic spike (see the stampede section — the failure compounds). So each partition gets a primary and 1–2 replicas.\n\n- **Asynchronous replication:** the primary acks the write, then streams it to replicas. A crash can lose the last few milliseconds of writes — **for a cache this is fine**, the database is still the source of truth. Synchronous replication would buy consistency at the cost of doubling write latency, inverting the cache\'s purpose.\n- **Failover:** replicas heartbeat the primary; on failure a replica is promoted (Redis Sentinel pattern, or the cluster gossips and votes).\n- **Consistency model:** eventual. A read from a lagging replica may be milliseconds stale. Say the magic words: *stale-read window is bounded by replication lag, and the workload tolerates it*.',
        },
        {
          id: 'rep-tradeoff',
          type: 'tradeoff',
          title: 'Asynchronous replication (the right call for a cache)',
          pros: [
            'Writes stay sub-millisecond — no cross-node round trip on the hot path',
            'Replicas can serve reads, multiplying read throughput',
            'Fast failover with only seconds of possible staleness',
          ],
          cons: [
            'A crashed primary loses its last unreplicated writes',
            'Reads from replicas can be briefly stale',
            'Split-brain needs care — fencing or quorum-based promotion',
          ],
        },
      ],
    },
    {
      id: 'failure-modes',
      title: 'Step 5 — The failure modes that decide the interview',
      blocks: [
        {
          id: 'fail-1',
          type: 'markdown',
          content:
            '### Cache stampede (thundering herd)\n\nA hot key expires; 10,000 concurrent requests all miss, and all 10,000 hit the database for the same value. Defenses, in the order worth mentioning: **request coalescing** (only one loader per key per node; the rest wait), **probabilistic early refresh** (refresh shortly *before* expiry with jittered TTLs), and **serve-stale-while-revalidate**.\n\n### Hot keys\n\nOne celebrity key can saturate a single node no matter how well you shard. Fixes: replicate the hot key to multiple nodes and read from any (`key#1..key#10` suffixing), or promote it to a tiny in-process cache on the application servers.\n\n### Cold start\n\nA freshly restarted (or newly added) node has 0% hit rate. Cache warming — replaying recent keys or snapshotting — plus consistent hashing\'s bounded key movement keeps the blast radius small.\n\n### Big values\n\nA 10 MB value behind a 1M RPS key is a bandwidth problem, not a memory problem. Cap value sizes and compress.',
        },
        {
          id: 'fail-callout',
          type: 'callout',
          variant: 'warning',
          title: 'The trap hidden in this question',
          content:
            'Every failure in a cache becomes a load spike on the database behind it. Strong candidates keep saying "…and this protects the database" — because a cache\'s real job is not being fast, it is absorbing traffic the database cannot take.',
        },
      ],
    },
    {
      id: 'patterns',
      title: 'Step 6 — How applications use it: caching patterns',
      blocks: [
        {
          id: 'pat-comparison',
          type: 'comparison',
          title: 'Caching patterns',
          headers: ['Pattern', 'Write path', 'Read path', 'Use when'],
          rows: [
            [
              'Cache-aside',
              'App writes DB, invalidates cache',
              'App checks cache, on miss reads DB and fills cache',
              'Default choice; app controls everything',
            ],
            [
              'Read-through',
              'App writes DB',
              'Cache itself loads from DB on miss',
              'You want loading logic centralized in the cache layer',
            ],
            [
              'Write-through',
              'App writes cache; cache writes DB synchronously',
              'Cache is always fresh',
              'Read-heavy data that must not be stale',
            ],
            [
              'Write-behind',
              'App writes cache; cache flushes to DB asynchronously',
              'Fastest writes',
              'Can tolerate losing buffered writes on crash',
            ],
          ],
        },
        {
          id: 'pat-1',
          type: 'markdown',
          content:
            'In the interview, **cache-aside with TTLs** is almost always the right default, and invalidation is the follow-up: on a DB write, do you *delete* the cache entry or *update* it? Delete is safer — updating risks writing stale data under race conditions, while delete just costs one extra miss.',
        },
      ],
    },
    {
      id: 'mistakes',
      title: 'Common mistakes that cost offers',
      blocks: [
        {
          id: 'mist-1',
          type: 'markdown',
          content:
            '1. **Mod-N sharding** — the single most damaging answer on this question; it collapses the hit rate on every topology change.\n2. **Reaching for strong consistency** — synchronous quorum writes in a cache betray a missed requirement; the database is the source of truth.\n3. **No stampede story** — hot-key expiry under concurrency is the most-asked follow-up; have coalescing and jittered TTLs ready.\n4. **Ignoring memory management** — a cache without an eviction policy is a memory leak with a network API.\n5. **Persisting everything to disk** — if most reads touch disk you have built a slow database, not a cache. (Optional snapshot/AOF persistence for faster warm-up is fine — as an option, not the hot path.)',
        },
        {
          id: 'mist-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Virtual nodes and why they smooth the ring, request coalescing named as such, hot-key replication with suffixed keys, and bounding staleness in terms of replication lag. Bonus: mention that Redis chose a single-threaded core and why that was the right call.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Why use consistent hashing instead of hash(key) % N?',
      answer:
        'With mod-N sharding, changing the node count remaps almost every key, so the hit rate collapses exactly when a node has just failed and the system is most fragile. Consistent hashing moves only about 1/N of the keys when a node joins or leaves, keeping the cache warm through topology changes.',
    },
    {
      question: 'Should a distributed cache use synchronous or asynchronous replication?',
      answer:
        'Asynchronous. A cache is an availability-and-latency system whose source of truth is the database behind it, so losing a few milliseconds of unreplicated writes on a crash is acceptable, while synchronous replication would add a cross-node round trip to every write and defeat the purpose of the cache.',
    },
    {
      question: 'What is a cache stampede and how do you prevent it?',
      answer:
        'A stampede happens when a popular key expires and thousands of concurrent requests all miss and hit the database simultaneously. Prevent it with request coalescing so only one request loads the key while others wait, jittered TTLs so keys do not expire together, and serving stale data while refreshing in the background.',
    },
    {
      question: 'What is the difference between Redis and Memcached in an interview answer?',
      answer:
        'Memcached is a pure multi-threaded key-value cache; Redis adds rich data structures, optional persistence, replication and cluster mode on a single-threaded core. For a "design a distributed cache" question, designing something Redis-like with consistent hashing, async replication, and LRU eviction covers what interviewers expect.',
    },
    {
      question: 'Which eviction policy should I choose?',
      answer:
        'LRU is the standard default and is implemented with a hash map plus doubly-linked list for O(1) operations. Mention LFU for frequency-skewed workloads and note LRU\'s weakness: a single large scan can flush the entire cache, which approximated variants like Redis\'s sampled LRU mitigate cheaply.',
    },
  ],
};
