/**
 * V2 Canvas Data
 * Source of truth for all stage metadata, camera regions, and per-problem content.
 *
 * Spec: docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md
 * Camera region coordinates extracted from prototype JS (Canvas Session.dc.html)
 */

import type {
  StageMeta,
  CameraRegion,
  ProblemCanvasData,
  StageIndex,
} from './canvas-types';

// ─── Stage Metadata ───────────────────────────────────────────────────────────

export const STAGE_META: StageMeta[] = [
  {
    index: 0,
    label: 'Problem',
    budget: 3,
    explainTitle: 'Understand the Problem',
    explainBody:
      'Read the problem carefully. Identify what you\'re building, the scale, and the key constraints. Clarify scope — what\'s in and what\'s out. You have 3 minutes. Don\'t start designing yet.',
  },
  {
    index: 1,
    label: 'Functional Req.',
    budget: 5,
    explainTitle: 'Define Functional Requirements',
    explainBody:
      'List the core features the system must support. Be specific — use verb-noun format (e.g. "User uploads a video"). Rank by priority. Avoid non-functional concerns here (latency, availability). You have 5 minutes.',
  },
  {
    index: 2,
    label: 'Non-Functional Req.',
    budget: 5,
    explainTitle: 'Non-Functional Requirements',
    explainBody:
      'Define the quality attributes: availability, latency, throughput, durability, consistency. Estimate scale (DAU, QPS, storage). These drive your architecture choices.',
  },
  {
    index: 3,
    label: 'Core Entities',
    budget: 5,
    explainTitle: 'Define Core Entities',
    explainBody:
      'List the main data entities and their key fields. This is NOT a full DB schema — just enough to understand data shape and relationships. Focus on what\'s needed for the core flows.',
  },
  {
    index: 4,
    label: 'API Design',
    budget: 5,
    explainTitle: 'Design the API',
    explainBody:
      'Define the primary REST endpoints. Include method, path, key request params, and response shape. Focus on the happy path — don\'t enumerate every error code yet.',
  },
  {
    index: 5,
    label: 'High-Level Design',
    budget: 15,
    explainTitle: 'High-Level Design',
    explainBody:
      'Draw the system components and data flow. Show how a request flows from client → services → storage. This is the core of the interview — be thorough. You have 15 minutes.',
  },
  {
    index: 6,
    label: 'Deep Dives',
    budget: 10,
    explainTitle: 'Deep Dives',
    explainBody:
      'Pick 2–3 hard problems in your design and go deep. Common picks: scalability bottlenecks, consistency trade-offs, hot-shard problems, caching strategy, failure modes.',
  },
];

// ─── Camera Regions ───────────────────────────────────────────────────────────
// Extracted from Canvas Session.dc.html prototype DCLogic class.
// These are the exact values — do NOT modify without updating the spec.

export const CAMERA_REGIONS: CameraRegion[] = [
  { cx: 355,  cy: 300, fitW: 560,  fitH: 340,  maxS: 1    }, // 0: Problem
  { cx: 950,  cy: 280, fitW: 620,  fitH: 340,  maxS: 1    }, // 1: FR
  { cx: 930,  cy: 460, fitW: 620,  fitH: 560,  maxS: 1    }, // 2: NFR
  { cx: 1540, cy: 370, fitW: 680,  fitH: 480,  maxS: 1    }, // 3: Entities
  { cx: 1480, cy: 700, fitW: 560,  fitH: 300,  maxS: 1    }, // 4: API
  { cx: 2385, cy: 460, fitW: 1090, fitH: 720,  maxS: 0.9  }, // 5: HLD
  { cx: 2385, cy: 560, fitW: 1090, fitH: 940,  maxS: 0.85 }, // 6: Deep Dives
];

// ─── Per-Problem Canvas Data ──────────────────────────────────────────────────

// ── YouTube ──────────────────────────────────────────────────────────────────

const YOUTUBE: ProblemCanvasData = {
  slug: 'design-youtube',
  problem: {
    title: 'Design YouTube',
    context:
      '2.7B monthly active users. 500 hours of video uploaded per minute. Videos range from seconds to hours. Users watch on mobile, desktop, and TV. Core flow: upload → process → serve.',
    scopeNote:
      'In scope: video upload, transcoding, streaming, search, recommendations feed. Out of scope: live streaming, comments, monetisation, YouTube Studio analytics.',
  },
  fr: {
    beginner: [
      'User uploads a video',
      'User watches a video',
      'User searches for videos',
      'User subscribes to a channel',
    ],
    midLevel: [
      'User uploads video → gets processed into multiple resolutions',
      'User streams video with adaptive bitrate (ABR)',
      'User searches by keyword → ranked results',
      'User sees personalised home feed',
      'User subscribes and sees new uploads',
    ],
    senior: [
      'Upload → chunk → transcode pipeline (360p / 720p / 1080p / 4K)',
      'ABR streaming via HLS/DASH with CDN edge delivery',
      'Search: inverted index on title/description + ML ranking',
      'Home feed: collaborative filtering + recency signals',
      'Subscription notifications: fan-out at ingest time vs query time',
      'Creator analytics (stretch)',
    ],
    outOfScope: ['Live streaming', 'Comments & moderation', 'Monetisation / ads', 'YouTube Studio'],
  },
  nfr: {
    items: [
      'High availability: 99.99% uptime for video serving',
      'Low latency: < 200ms TTFB for video start',
      'Durability: 3 copies of raw + processed video',
      'Consistency: eventual — stale recommendations are OK',
      'Scalability: handle 10× upload spikes (viral events)',
    ],
    scaleHints: [
      '2.7B MAU → ~400M DAU → ~5M concurrent viewers peak',
      '500 hrs/min upload → ~8 hrs/sec raw video ingestion',
      'Avg video: 7 min → ~420MB raw → ~150MB across 4 resolutions',
      'Read:write ratio ≈ 10,000:1',
      'CDN offloads ~95% of read traffic',
    ],
  },
  entities: {
    entities: [
      {
        name: 'Video',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'uploaderId', type: 'UUID', note: 'FK → User' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'text' },
          { name: 'rawStorageKey', type: 'string', note: 'S3 key of original upload' },
          { name: 'status', type: 'enum', note: 'PENDING | PROCESSING | READY | FAILED' },
          { name: 'durationSec', type: 'int' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'VideoVariant',
        fields: [
          { name: 'videoId', type: 'UUID', note: 'FK → Video' },
          { name: 'resolution', type: 'string', note: '360p | 720p | 1080p | 4K' },
          { name: 'storageKey', type: 'string', note: 'CDN origin key' },
          { name: 'bitrateKbps', type: 'int' },
        ],
      },
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'username', type: 'string' },
          { name: 'channelId', type: 'UUID' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'Subscription',
        fields: [
          { name: 'subscriberId', type: 'UUID', note: 'FK → User' },
          { name: 'channelId', type: 'UUID' },
          { name: 'subscribedAt', type: 'timestamp' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/videos/upload-url', params: '{ title, fileSize, mimeType }', response: '{ uploadUrl, videoId }' },
      { method: 'GET', path: '/videos/:id', response: '{ video, variants[], channelInfo }' },
      { method: 'GET', path: '/videos/:id/stream', params: '?resolution=720p', response: 'HLS manifest (.m3u8)' },
      { method: 'GET', path: '/search?q=&page=', response: '{ results: Video[], total }' },
      { method: 'GET', path: '/feed', params: '?userId=&cursor=', response: '{ videos: Video[], nextCursor }' },
      { method: 'POST', path: '/subscriptions', params: '{ channelId }', response: '{ subscribed: true }' },
    ],
  },
  hld: {
    components: [
      { id: 'client', label: 'Client', sublabel: 'Browser / Mobile / TV', rx: 0.05, ry: 0.45 },
      { id: 'api_gw', label: 'API Gateway', sublabel: 'Auth + Rate Limit', rx: 0.22, ry: 0.45 },
      { id: 'upload_svc', label: 'Upload Service', sublabel: 'Chunked upload + S3', rx: 0.38, ry: 0.2 },
      { id: 'transcode_q', label: 'Transcode Queue', sublabel: 'Kafka / SQS', rx: 0.55, ry: 0.2 },
      { id: 'transcode_workers', label: 'Transcode Workers', sublabel: 'FFmpeg cluster', rx: 0.72, ry: 0.2 },
      { id: 'cdn', label: 'CDN', sublabel: 'CloudFront / Akamai', rx: 0.88, ry: 0.45 },
      { id: 'stream_svc', label: 'Streaming Service', sublabel: 'HLS manifest gen', rx: 0.55, ry: 0.45 },
      { id: 'metadata_db', label: 'Metadata DB', sublabel: 'PostgreSQL', rx: 0.38, ry: 0.7 },
      { id: 'search_svc', label: 'Search Service', sublabel: 'Elasticsearch', rx: 0.55, ry: 0.7 },
      { id: 'rec_svc', label: 'Recommendation', sublabel: 'ML + Redis cache', rx: 0.72, ry: 0.7 },
    ],
    arrows: [
      { from: 'client', to: 'api_gw' },
      { from: 'api_gw', to: 'upload_svc', label: 'Upload' },
      { from: 'upload_svc', to: 'transcode_q', label: 'Enqueue' },
      { from: 'transcode_q', to: 'transcode_workers' },
      { from: 'transcode_workers', to: 'cdn', label: 'Push variants' },
      { from: 'api_gw', to: 'stream_svc', label: 'Watch' },
      { from: 'stream_svc', to: 'cdn', label: 'Origin pull' },
      { from: 'cdn', to: 'client', label: 'Video segments' },
      { from: 'upload_svc', to: 'metadata_db' },
      { from: 'api_gw', to: 'search_svc', label: 'Search' },
      { from: 'api_gw', to: 'rec_svc', label: 'Feed' },
    ],
    deepDives: [
      { title: 'Video transcoding pipeline', description: 'Chunked upload → parallel transcode → segment stitching → CDN push', minutes: 4 },
      { title: 'Adaptive bitrate streaming', description: 'HLS manifest generation, segment sizes, ABR switching logic', minutes: 3 },
      { title: 'Search at scale', description: 'Inverted index, ranking signals, update latency (eventual)', minutes: 3 },
    ],
  },
  guide: [
    { tips: ['Read every word of the problem', 'Identify the core user action', 'Note scale hints'], suggestions: ['Ask about mobile vs desktop split', 'Clarify upload size limits'], feedbackPrompt: 'Describe the problem in your own words...' },
    { tips: ['Verb-noun format: "User uploads video"', 'Max 5 core requirements', 'Rank by importance'], suggestions: ['Consider creator vs viewer flows separately', 'What does "search" mean here?'], feedbackPrompt: 'List your functional requirements...' },
    { tips: ['Derive numbers from DAU', 'Name the latency target (TTFB)', 'State your consistency model'], suggestions: ['CDN offload changes your write vs read design', 'What is your durability SLA?'], feedbackPrompt: 'State your NFRs and scale estimates...' },
    { tips: ['3–5 core entities max', 'Include status enums', 'Show FK relationships'], suggestions: ['VideoVariant is easy to miss', 'Separate Channel from User?'], feedbackPrompt: 'Define your core entities...' },
    { tips: ['Use REST conventions', 'Show the upload flow endpoint', 'Include streaming endpoint'], suggestions: ['Presigned URL pattern for upload', 'HLS manifest endpoint is distinct from video metadata'], feedbackPrompt: 'Define your API endpoints...' },
    { tips: ['Show the upload path AND the watch path', 'Label every arrow with the protocol/data', 'Group by read vs write path'], suggestions: ['Separate upload service from streaming service', 'Show where CDN fits'], feedbackPrompt: 'Walk through your high-level design...' },
    { tips: ['Pick 2 deep dives you can defend', 'Transcoding pipeline is expected', 'Show failure handling'], suggestions: ['How does your system handle a 10× upload spike?', 'What happens if a transcode worker dies?'], feedbackPrompt: 'Choose your deep dive topics...' },
  ],
};

// ── TinyURL ───────────────────────────────────────────────────────────────────

const TINYURL: ProblemCanvasData = {
  slug: 'design-tinyurl',
  problem: {
    title: 'Design TinyURL',
    context:
      '100M URLs shortened per day. 10:1 read-to-write ratio. Short codes must be unique, URL-safe, and ≤ 7 characters. Links should be permanent (no expiry by default).',
    scopeNote:
      'In scope: shorten URL, redirect, custom aliases, basic analytics (click count). Out of scope: link expiry, team workspaces, click-path analytics.',
  },
  fr: {
    beginner: [
      'User pastes a long URL and gets a short link',
      'User visits short link and gets redirected',
      'User can specify a custom alias',
    ],
    midLevel: [
      'Shorten: POST /shorten → 7-char code stored in DB',
      'Redirect: GET /:code → 301/302 to original URL',
      'Custom alias: user provides desired short code',
      'Click analytics: increment counter per redirect',
    ],
    senior: [
      'Shorten with base62 encoding of auto-incremented ID or hash',
      'Redirect via 302 (trackable) vs 301 (browser-cached)',
      'Custom alias: check uniqueness + collision handling',
      'Distributed ID generation (Snowflake / counter service)',
      'Cache hot short codes in Redis (read-heavy, long tail)',
    ],
    outOfScope: ['Link expiry / TTL', 'Team workspaces', 'Detailed click analytics (geo, device)', 'QR code generation'],
  },
  nfr: {
    items: [
      'High availability: 99.99% — redirect latency impacts every downstream click',
      'Low latency: < 10ms redirect (after cache hit)',
      'Durability: short code → long URL mapping must never be lost',
      'Consistency: writes must be immediately readable (short code lookup)',
      'Scalability: 100M writes/day → ~1.2K writes/sec, 1B reads/day → ~12K reads/sec',
    ],
    scaleHints: [
      '100M new URLs/day → 1.2K writes/sec',
      '10:1 read ratio → 12K reads/sec',
      'Average URL: ~100 bytes → 10GB new data/day → 3.6TB/year',
      'Hot URLs skew read traffic — Pareto: 20% URLs get 80% clicks',
      'Cache hit rate target: > 90%',
    ],
  },
  entities: {
    entities: [
      {
        name: 'ShortLink',
        fields: [
          { name: 'code', type: 'varchar(7)', note: 'Primary key, URL-safe base62' },
          { name: 'longUrl', type: 'text' },
          { name: 'userId', type: 'UUID', note: 'nullable — anonymous allowed' },
          { name: 'clickCount', type: 'bigint' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'email', type: 'string' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/shorten', params: '{ longUrl, customAlias? }', response: '{ shortUrl, code }' },
      { method: 'GET', path: '/:code', response: '302 Location: longUrl' },
      { method: 'GET', path: '/links/:code/stats', response: '{ clickCount, createdAt }' },
      { method: 'DELETE', path: '/links/:code', response: '204 No Content' },
    ],
  },
  hld: {
    components: [
      { id: 'client', label: 'Client', rx: 0.05, ry: 0.5 },
      { id: 'lb', label: 'Load Balancer', sublabel: 'L7', rx: 0.2, ry: 0.5 },
      { id: 'api_svc', label: 'API Service', sublabel: 'Shorten / Redirect', rx: 0.38, ry: 0.5 },
      { id: 'redis', label: 'Redis Cache', sublabel: 'code → longUrl', rx: 0.55, ry: 0.25 },
      { id: 'db', label: 'PostgreSQL', sublabel: 'ShortLink table', rx: 0.55, ry: 0.75 },
      { id: 'id_gen', label: 'ID Generator', sublabel: 'Snowflake / Counter', rx: 0.72, ry: 0.5 },
    ],
    arrows: [
      { from: 'client', to: 'lb' },
      { from: 'lb', to: 'api_svc' },
      { from: 'api_svc', to: 'redis', label: 'Cache read' },
      { from: 'api_svc', to: 'db', label: 'Cache miss / write' },
      { from: 'api_svc', to: 'id_gen', label: 'New code' },
    ],
    deepDives: [
      { title: 'ID generation & collision avoidance', description: 'Base62 encoding, counter service vs hash + collision retry, Snowflake IDs', minutes: 4 },
      { title: 'Caching strategy', description: 'Redis LRU for hot codes, write-through vs write-aside, cache stampede', minutes: 3 },
      { title: '301 vs 302 redirect trade-off', description: 'Browser caching vs click tracking — why most systems choose 302', minutes: 3 },
    ],
  },
  guide: [
    { tips: ['Note the 10:1 read bias upfront', 'This is a classic — focus on depth not breadth', 'Confirm what "short" means (7 chars?)'], suggestions: ['Ask about link expiry', 'Ask about custom alias'], feedbackPrompt: 'Describe the problem...' },
    { tips: ['The redirect IS the product', 'Custom alias adds collision complexity', 'Keep it to 3 core FRs'], suggestions: ['Click tracking is often forgotten', 'Link deletion is a good edge case'], feedbackPrompt: 'State your FRs...' },
    { tips: ['Derive QPS from 100M/day', 'Redirect latency is business-critical', 'Consistency model matters here'], suggestions: ['Strong consistency on write; eventually consistent analytics', '90%+ cache hit rate is achievable and important'], feedbackPrompt: 'State NFRs + scale...' },
    { tips: ['ShortLink is the only core entity', 'code is the PK', 'User is optional (anonymous OK)'], suggestions: ['Don\'t add clickEvent entity unless asked for analytics'], feedbackPrompt: 'Define entities...' },
    { tips: ['POST /shorten → code', 'GET /:code → 302 redirect', 'These two are the whole API'], suggestions: ['Show 404 handling for unknown codes', 'Stats endpoint is a nice-to-have'], feedbackPrompt: 'Define API...' },
    { tips: ['Show write path and read path separately', 'Redis between API and DB is the key insight', 'Label the 302 redirect response'], suggestions: ['How does ID generator work?', 'What if Redis is down?'], feedbackPrompt: 'Draw the HLD...' },
    { tips: ['ID generation is the most interesting deep dive', '301 vs 302 shows product thinking', 'Cache stampede shows operational maturity'], suggestions: ['What happens at 100× scale?', 'How do you handle a hotspot code?'], feedbackPrompt: 'Choose deep dives...' },
  ],
};

// ── Twitter ────────────────────────────────────────────────────────────────────

const TWITTER: ProblemCanvasData = {
  slug: 'design-twitter',
  problem: {
    title: 'Design Twitter / X',
    context:
      '300M monthly active users. 500M tweets per day. The hard problem is the home timeline: when a celebrity with 50M followers tweets, we can\'t compute timelines on-demand.',
    scopeNote:
      'In scope: tweet, follow, home timeline, search. Out of scope: DMs, media upload, ads, trending topics, Spaces.',
  },
  fr: {
    beginner: ['User posts a tweet', 'User follows another user', 'User sees a home timeline', 'User searches tweets'],
    midLevel: [
      'Post tweet → stored + fan-out to followers\' timelines',
      'Follow: update follow graph, affects timeline',
      'Home timeline: ranked, recent tweets from followed users',
      'Search: keyword lookup on tweet content',
    ],
    senior: [
      'Tweet post with fan-out: pull vs push vs hybrid (celebrities)',
      'Follow graph stored in graph DB or adjacency list',
      'Timeline: pre-computed fan-out for regular users, pull + merge for celebrity followers',
      'Search: near-real-time indexing with Elasticsearch',
      'Retweet: reference to original tweet, fan-out same as post',
    ],
    outOfScope: ['DMs', 'Media upload / video', 'Ads / promoted tweets', 'Trending topics', 'Spaces / audio'],
  },
  nfr: {
    items: [
      'High availability: 99.99% — any downtime is a news event',
      'Eventual consistency: timeline staleness of a few seconds is OK',
      'Read-heavy: home timeline read:write ≈ 100:1',
      'Write amplification: celebrity tweet fan-out to 50M timelines',
      'Low latency: timeline load < 200ms',
    ],
    scaleHints: [
      '300M MAU → ~50M DAU → 500M tweets/day → ~6K TPS writes',
      '100:1 read ratio → 600K TPS timeline reads',
      'Average tweet: 300 bytes → 150GB new data/day',
      'Celebrity problem: 50M followers × 1 tweet = 50M timeline writes',
    ],
  },
  entities: {
    entities: [
      {
        name: 'Tweet',
        fields: [
          { name: 'id', type: 'bigint', note: 'Snowflake ID' },
          { name: 'userId', type: 'bigint', note: 'FK → User' },
          { name: 'content', type: 'varchar(280)' },
          { name: 'retweetId', type: 'bigint', note: 'nullable — FK → Tweet' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'bigint', note: 'Snowflake ID' },
          { name: 'username', type: 'string' },
          { name: 'followerCount', type: 'int', note: 'Denormalized for display' },
          { name: 'isVerified', type: 'bool' },
        ],
      },
      {
        name: 'Follow',
        fields: [
          { name: 'followerId', type: 'bigint' },
          { name: 'followeeId', type: 'bigint' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'Timeline (cache)',
        fields: [
          { name: 'userId', type: 'bigint', note: 'Owner of this timeline' },
          { name: 'tweetIds', type: 'list<bigint>', note: 'Redis sorted set, capped at 800' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/tweets', params: '{ content, retweetId? }', response: '{ tweet }' },
      { method: 'GET', path: '/timeline', params: '?cursor=&limit=20', response: '{ tweets: Tweet[], nextCursor }' },
      { method: 'POST', path: '/follow', params: '{ followeeId }', response: '{ following: true }' },
      { method: 'DELETE', path: '/follow/:followeeId', response: '204 No Content' },
      { method: 'GET', path: '/search?q=&cursor=', response: '{ tweets: Tweet[], nextCursor }' },
    ],
  },
  hld: {
    components: [
      { id: 'client', label: 'Client', rx: 0.05, ry: 0.5 },
      { id: 'api_gw', label: 'API Gateway', rx: 0.2, ry: 0.5 },
      { id: 'tweet_svc', label: 'Tweet Service', sublabel: 'Write path', rx: 0.38, ry: 0.25 },
      { id: 'fanout_svc', label: 'Fan-out Service', sublabel: 'Async via queue', rx: 0.55, ry: 0.25 },
      { id: 'timeline_svc', label: 'Timeline Service', sublabel: 'Read path', rx: 0.38, ry: 0.75 },
      { id: 'redis_timeline', label: 'Redis', sublabel: 'Timeline cache', rx: 0.55, ry: 0.75 },
      { id: 'db_tweets', label: 'Tweets DB', sublabel: 'Cassandra / Postgres', rx: 0.72, ry: 0.25 },
      { id: 'graph_svc', label: 'Follow Graph', sublabel: 'Adjacency list', rx: 0.72, ry: 0.75 },
      { id: 'search', label: 'Search', sublabel: 'Elasticsearch', rx: 0.88, ry: 0.5 },
    ],
    arrows: [
      { from: 'client', to: 'api_gw' },
      { from: 'api_gw', to: 'tweet_svc', label: 'POST /tweet' },
      { from: 'tweet_svc', to: 'db_tweets', label: 'Persist' },
      { from: 'tweet_svc', to: 'fanout_svc', label: 'Enqueue' },
      { from: 'fanout_svc', to: 'graph_svc', label: 'Get followers' },
      { from: 'fanout_svc', to: 'redis_timeline', label: 'Push to timelines' },
      { from: 'api_gw', to: 'timeline_svc', label: 'GET /timeline' },
      { from: 'timeline_svc', to: 'redis_timeline', label: 'Read timeline IDs' },
      { from: 'timeline_svc', to: 'db_tweets', label: 'Hydrate tweets' },
      { from: 'tweet_svc', to: 'search', label: 'Index async' },
    ],
    deepDives: [
      { title: 'Fan-out strategy (push vs pull vs hybrid)', description: 'Regular users: push on write. Celebrities: pull + merge on read to avoid 50M writes', minutes: 5 },
      { title: 'Timeline storage & ranking', description: 'Redis sorted set capped at 800, score = timestamp, hydration pattern', minutes: 3 },
      { title: 'Follow graph at scale', description: 'Adjacency list in Cassandra, follower count denorm, graph traversal limits', minutes: 2 },
    ],
  },
  guide: [
    { tips: ['The celebrity fan-out problem is the crux', 'Mention it in your problem understanding', 'This tests your write amplification instinct'], suggestions: ['Confirm in-scope: home timeline (not explore)', 'Ask about media (usually out of scope)'], feedbackPrompt: 'Describe the problem...' },
    { tips: ['Tweet + Follow + Timeline are the 3 FRs', 'Retweet is an edge case worth mentioning', 'Search is secondary'], suggestions: ['"User sees home timeline" is vague — be specific about ranking'], feedbackPrompt: 'State FRs...' },
    { tips: ['Eventual consistency is acceptable for timelines', 'Quantify the celebrity problem', 'Read:write ratio is extreme here'], suggestions: ['Timeline staleness tolerance is a design lever', 'Write amplification drives your whole architecture'], feedbackPrompt: 'State NFRs + scale...' },
    { tips: ['Tweet, User, Follow, Timeline (cache)', 'Timeline is a derived/cached entity', 'Snowflake IDs for ordering'], suggestions: ['Don\'t over-normalize — this is denorm-heavy by design'], feedbackPrompt: 'Define entities...' },
    { tips: ['POST /tweet and GET /timeline are the two critical paths', 'Follow is simple', 'Use cursor pagination for timeline'], suggestions: ['Show the cursor token in response'], feedbackPrompt: 'Define API...' },
    { tips: ['Separate write path from read path visually', 'Fan-out service is async (queue)', 'Timeline service reads from Redis, not DB'], suggestions: ['Where does fan-out diverge for celebrities?', 'Show the queue between tweet service and fan-out'], feedbackPrompt: 'Draw HLD...' },
    { tips: ['Fan-out push vs pull is the must-cover deep dive', 'Redis sorted set details show depth', 'Celebrity threshold is a real production pattern'], suggestions: ['What is the cutoff follower count for hybrid?', 'How do you keep celebrity timelines consistent?'], feedbackPrompt: 'Choose deep dives...' },
  ],
};

// ── Uber ──────────────────────────────────────────────────────────────────────

const UBER: ProblemCanvasData = {
  slug: 'design-uber',
  problem: {
    title: 'Design Uber',
    context:
      '5M trips per day. Matching a rider to the nearest available driver must happen in < 1 second. Driver location updates every 4 seconds. The core challenge is real-time geospatial matching at scale.',
    scopeNote:
      'In scope: rider requests ride, driver matching, real-time location tracking, trip lifecycle. Out of scope: surge pricing, driver payments, UberEats, scheduling, driver onboarding.',
  },
  fr: {
    beginner: ['Rider requests a ride', 'Driver accepts and picks up rider', 'Rider sees driver location in real-time', 'Trip ends and fare is calculated'],
    midLevel: [
      'Rider requests → nearby drivers found within radius',
      'Driver matching: nearest available driver notified',
      'Driver location streams every 4s → rider sees live map',
      'Trip state machine: REQUESTED → MATCHED → PICKED_UP → COMPLETED',
      'ETA calculation based on distance + traffic',
    ],
    senior: [
      'Location indexing: geohash / quad-tree for O(1) radius query',
      'Matching: supply-demand balance by zone, not just nearest',
      'Websocket for real-time driver location push to rider',
      'Trip state machine with at-least-once delivery guarantees',
      'ETA: ML model on historical + live traffic signals',
    ],
    outOfScope: ['Surge pricing', 'Driver payments / earnings', 'UberEats', 'Scheduling / advance booking', 'Driver onboarding'],
  },
  nfr: {
    items: [
      'Low latency: driver match < 1s P99',
      'High availability: 99.99% — downtime costs real revenue',
      'Real-time: location updates every 4s, delivered to rider < 500ms',
      'Consistency: trip state transitions must be ACID',
      'Scalability: handle 10× surges (New Year\'s Eve)',
    ],
    scaleHints: [
      '5M trips/day → ~58 TPS average, ~500 TPS peak',
      '5M active drivers → location updates every 4s → ~1.25M location writes/sec peak',
      'Geospatial query: find all drivers within 2km radius < 50ms',
      'Websocket connections: up to 5M concurrent (rider + driver pairs)',
    ],
  },
  entities: {
    entities: [
      {
        name: 'Trip',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'riderId', type: 'UUID' },
          { name: 'driverId', type: 'UUID', note: 'nullable until matched' },
          { name: 'status', type: 'enum', note: 'REQUESTED|MATCHED|PICKED_UP|COMPLETED|CANCELLED' },
          { name: 'pickupLat', type: 'float' },
          { name: 'pickupLng', type: 'float' },
          { name: 'dropoffLat', type: 'float' },
          { name: 'dropoffLng', type: 'float' },
          { name: 'fareEstimate', type: 'decimal' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'DriverLocation',
        fields: [
          { name: 'driverId', type: 'UUID' },
          { name: 'lat', type: 'float' },
          { name: 'lng', type: 'float' },
          { name: 'geohash', type: 'string', note: '6-char precision = ~1.2km' },
          { name: 'isAvailable', type: 'bool' },
          { name: 'updatedAt', type: 'timestamp' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/rides/request', params: '{ pickupLat, pickupLng, dropoffLat, dropoffLng }', response: '{ tripId, estimatedWait, fare }' },
      { method: 'GET', path: '/rides/:tripId', response: '{ trip, driver: { lat, lng, eta } }' },
      { method: 'POST', path: '/drivers/location', params: '{ lat, lng }', response: '200 OK' },
      { method: 'POST', path: '/rides/:tripId/accept', response: '{ trip }' },
      { method: 'POST', path: '/rides/:tripId/complete', response: '{ trip, fare }' },
    ],
  },
  hld: {
    components: [
      { id: 'rider_app', label: 'Rider App', rx: 0.05, ry: 0.3 },
      { id: 'driver_app', label: 'Driver App', rx: 0.05, ry: 0.7 },
      { id: 'api_gw', label: 'API Gateway', rx: 0.2, ry: 0.5 },
      { id: 'match_svc', label: 'Matching Service', sublabel: 'Nearest driver algo', rx: 0.38, ry: 0.3 },
      { id: 'location_svc', label: 'Location Service', sublabel: 'Redis Geo', rx: 0.38, ry: 0.7 },
      { id: 'trip_svc', label: 'Trip Service', sublabel: 'State machine + DB', rx: 0.55, ry: 0.5 },
      { id: 'notification_svc', label: 'Notification', sublabel: 'Push / WebSocket', rx: 0.72, ry: 0.5 },
      { id: 'trips_db', label: 'Trips DB', sublabel: 'PostgreSQL (ACID)', rx: 0.88, ry: 0.3 },
      { id: 'redis_geo', label: 'Redis (Geo)', sublabel: 'Driver locations', rx: 0.88, ry: 0.7 },
    ],
    arrows: [
      { from: 'rider_app', to: 'api_gw', label: 'Request ride' },
      { from: 'driver_app', to: 'api_gw', label: 'Location update' },
      { from: 'api_gw', to: 'location_svc', label: 'Store location' },
      { from: 'location_svc', to: 'redis_geo' },
      { from: 'api_gw', to: 'match_svc', label: 'Find driver' },
      { from: 'match_svc', to: 'redis_geo', label: 'Radius query' },
      { from: 'match_svc', to: 'trip_svc', label: 'Create trip' },
      { from: 'trip_svc', to: 'trips_db' },
      { from: 'trip_svc', to: 'notification_svc', label: 'Notify driver' },
      { from: 'notification_svc', to: 'driver_app', label: 'Push' },
      { from: 'notification_svc', to: 'rider_app', label: 'WebSocket updates' },
    ],
    deepDives: [
      { title: 'Geospatial indexing for driver lookup', description: 'Geohash vs quad-tree, Redis GEO commands, precision vs recall trade-offs', minutes: 4 },
      { title: 'Real-time location streaming', description: 'WebSocket vs SSE vs polling, connection management at 5M concurrent', minutes: 3 },
      { title: 'Trip state machine & consistency', description: 'ACID requirements, idempotency keys, distributed locking for matching', minutes: 3 },
    ],
  },
  guide: [
    { tips: ['Geospatial matching is the hard part', 'State machine is the second hard part', 'Note the 4s location update cadence'], suggestions: ['Ask about surge pricing (usually out of scope)', 'Confirm: matching closest driver vs supply/demand balance?'], feedbackPrompt: 'Describe the problem...' },
    { tips: ['Request ride + accept + complete are the 3 core flows', 'Real-time location is a sub-requirement of the trip flow', 'Keep it to the trip lifecycle'], suggestions: ['Add trip cancellation — it\'s realistic'], feedbackPrompt: 'State FRs...' },
    { tips: ['1.25M location writes/sec is the scary number', 'Derive it: 5M drivers × 1 update/4s', 'P99 match latency < 1s is the SLO'], suggestions: ['WebSocket connection count at scale is a capacity concern', 'Geospatial query latency < 50ms is feasible with Redis GEO'], feedbackPrompt: 'State NFRs + scale...' },
    { tips: ['Trip + DriverLocation are the two entities', 'DriverLocation is ephemeral — store in Redis', 'Trip must be ACID in Postgres'], suggestions: ['Geohash field on DriverLocation is a key insight'], feedbackPrompt: 'Define entities...' },
    { tips: ['Show both rider and driver endpoints', 'Location update is a fire-and-forget POST', 'Trip state transitions need idempotency'], feedbackPrompt: 'Define API...', suggestions: ['Include WebSocket endpoint for live updates'] },
    { tips: ['Separate location write path from matching', 'Redis GEO is the insight', 'Show notification path to both rider and driver'], suggestions: ['How does rider get live driver updates — push or poll?'], feedbackPrompt: 'Draw HLD...' },
    { tips: ['Geospatial indexing is the expected deep dive', 'WebSocket at scale shows infra depth', 'Trip state machine shows reliability thinking'], suggestions: ['What happens if the matched driver goes offline?', 'How do you handle concurrent match requests?'], feedbackPrompt: 'Choose deep dives...' },
  ],
};

// ── WhatsApp ──────────────────────────────────────────────────────────────────

const WHATSAPP: ProblemCanvasData = {
  slug: 'design-whatsapp',
  problem: {
    title: 'Design WhatsApp',
    context:
      '2B monthly active users. 100B messages per day. Core challenge: real-time message delivery with end-to-end encryption, offline storage, and read receipts at scale.',
    scopeNote:
      'In scope: 1-on-1 messaging, group messaging (max 512 members), message delivery receipts, media sharing. Out of scope: calls, stories, business API, payments.',
  },
  fr: {
    beginner: ['User sends a text message', 'User receives a message in real-time', 'User sees when their message was delivered/read', 'User can send images'],
    midLevel: [
      'Send message → delivered in real-time via WebSocket',
      'Offline delivery: messages queued until recipient reconnects',
      'Delivery receipts: sent ✓, delivered ✓✓, read ✓✓ (blue)',
      'Group messaging: 1 send → delivered to all members',
      'Media: upload to S3 → send URL in message',
    ],
    senior: [
      'WebSocket per user session, connection server fan-out',
      'Message queue per user for offline delivery (at-least-once)',
      'Read receipt aggregation for groups (fan-in)',
      'E2E encryption: Signal Protocol, key exchange, sealed sender',
      'Media: client-side compress + server-side virus scan + CDN',
    ],
    outOfScope: ['Voice/video calls', 'WhatsApp Status / Stories', 'Business API', 'Payments'],
  },
  nfr: {
    items: [
      'High availability: 99.99% — messaging is mission-critical for many users',
      'Low latency: message delivery < 100ms when both online',
      'At-least-once delivery: no dropped messages',
      'Durability: messages stored until device confirms receipt',
      'E2E encryption: server never sees plaintext',
    ],
    scaleHints: [
      '2B MAU → 500M DAU → 100B messages/day → 1.16M messages/sec',
      'Average message: 100 bytes → 10TB text data/day',
      'Group size up to 512 → 1 send = 511 deliveries',
      '500M DAU × 1 WebSocket = 500M concurrent connections',
    ],
  },
  entities: {
    entities: [
      {
        name: 'Message',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'conversationId', type: 'UUID' },
          { name: 'senderId', type: 'UUID' },
          { name: 'content', type: 'bytes', note: 'Encrypted ciphertext' },
          { name: 'mediaUrl', type: 'string', note: 'nullable' },
          { name: 'status', type: 'enum', note: 'SENT|DELIVERED|READ' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'Conversation',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'type', type: 'enum', note: 'DIRECT | GROUP' },
          { name: 'memberIds', type: 'UUID[]' },
          { name: 'lastMessageAt', type: 'timestamp' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/messages', params: '{ conversationId, encryptedContent, mediaUrl? }', response: '{ messageId, status: SENT }' },
      { method: 'GET', path: '/conversations/:id/messages', params: '?before=&limit=50', response: '{ messages[], nextCursor }' },
      { method: 'POST', path: '/receipts', params: '{ messageId, status: DELIVERED|READ }', response: '200 OK' },
      { method: 'GET', path: '/ws (WebSocket upgrade)', params: 'Auth token in handshake', response: 'Bidirectional message stream' },
    ],
  },
  hld: {
    components: [
      { id: 'client', label: 'Client App', sublabel: 'iOS / Android', rx: 0.05, ry: 0.5 },
      { id: 'ws_server', label: 'WebSocket Servers', sublabel: 'Connection layer', rx: 0.22, ry: 0.5 },
      { id: 'msg_svc', label: 'Message Service', sublabel: 'Route + persist', rx: 0.42, ry: 0.5 },
      { id: 'offline_q', label: 'Offline Queue', sublabel: 'Per-user queue', rx: 0.42, ry: 0.75 },
      { id: 'msg_db', label: 'Messages DB', sublabel: 'Cassandra', rx: 0.62, ry: 0.5 },
      { id: 'presence_svc', label: 'Presence Service', sublabel: 'Online / offline', rx: 0.62, ry: 0.25 },
      { id: 'media_svc', label: 'Media Service', sublabel: 'S3 + CDN', rx: 0.82, ry: 0.5 },
    ],
    arrows: [
      { from: 'client', to: 'ws_server', label: 'WebSocket' },
      { from: 'ws_server', to: 'msg_svc', label: 'Send message' },
      { from: 'msg_svc', to: 'msg_db', label: 'Persist' },
      { from: 'msg_svc', to: 'ws_server', label: 'Deliver to recipient WS' },
      { from: 'msg_svc', to: 'offline_q', label: 'If offline' },
      { from: 'ws_server', to: 'presence_svc', label: 'Update online status' },
      { from: 'client', to: 'media_svc', label: 'Upload media' },
      { from: 'media_svc', to: 'client', label: 'CDN URL' },
    ],
    deepDives: [
      { title: 'WebSocket connection management at 500M scale', description: 'Consistent hashing to WS servers, reconnect strategy, message ordering', minutes: 4 },
      { title: 'Offline message delivery guarantees', description: 'Per-user queue, at-least-once + dedup, ordering with Cassandra tombstones', minutes: 3 },
      { title: 'Group message fan-out', description: 'Read receipt aggregation for 512 members, fan-out at write vs read', minutes: 3 },
    ],
  },
  guide: [
    { tips: ['100B messages/day is the defining scale constraint', 'WebSocket for real-time is the key tech choice', 'E2E encryption changes your storage model'], suggestions: ['Ask about group size limit (affects fan-out design)', 'Confirm calls are out of scope'], feedbackPrompt: 'Describe the problem...' },
    { tips: ['Send + receive + receipts = the 3 core FRs', 'Offline delivery is the hardest part', 'Group messaging multiplies complexity'], suggestions: ['Be specific: "message delivered" vs "message read" are different states'], feedbackPrompt: 'State FRs...' },
    { tips: ['1.16M messages/sec is the headline number', '500M WebSocket connections is the infra challenge', 'At-least-once delivery is non-negotiable'], suggestions: ['Derive group fan-out worst case: 100B × 512 members = scary'], feedbackPrompt: 'State NFRs + scale...' },
    { tips: ['Message + Conversation are the 2 entities', 'Message content is encrypted bytes', 'Status enum shows the receipt states'], suggestions: ['Offline queue is a 3rd entity worth mentioning'], feedbackPrompt: 'Define entities...' },
    { tips: ['WebSocket is a must-include endpoint', 'Message send + history fetch are the REST endpoints', 'Receipt update is a separate call'], feedbackPrompt: 'Define API...', suggestions: ['Show the WebSocket handshake auth'] },
    { tips: ['WebSocket server layer is distinct from message service', 'Show offline queue explicitly', 'Media is a separate service'], suggestions: ['How does a message get from WS server A to WS server B?', 'Show where Cassandra fits (time-series write pattern)'], feedbackPrompt: 'Draw HLD...' },
    { tips: ['WS connection management is the expected deep dive', 'Group fan-out shows scale thinking', 'Receipt aggregation is often missed'], suggestions: ['What happens when a WS server crashes mid-send?', 'How do you guarantee message ordering?'], feedbackPrompt: 'Choose deep dives...' },
  ],
};

// ── Rate Limiter ───────────────────────────────────────────────────────────────

const RATE_LIMITER: ProblemCanvasData = {
  slug: 'design-rate-limiter',
  problem: {
    title: 'Design a Rate Limiter',
    context:
      'A distributed rate limiter that sits in front of API services. Must enforce per-user and per-IP limits. Used as middleware or as a standalone service. P99 add latency < 5ms.',
    scopeNote:
      'In scope: token bucket / sliding window algorithms, per-user + per-IP limits, distributed state, graceful degradation. Out of scope: billing tiers, geographic rate limiting, DDoS prevention at network layer.',
  },
  fr: {
    beginner: ['Block requests over limit', 'Return 429 with retry-after header', 'Allow burst traffic up to a limit'],
    midLevel: [
      'Enforce X requests per second per user',
      'Enforce X requests per minute per IP',
      'Return 429 Too Many Requests with Retry-After header',
      'Support burst: token bucket allows short spikes',
    ],
    senior: [
      'Token bucket algorithm with Redis INCR + TTL',
      'Sliding window log: exact but memory-heavy',
      'Sliding window counter: approximation with low memory',
      'Distributed: Redis as shared state, Lua script for atomic check-and-decrement',
      'Graceful degradation: fail open vs fail closed on Redis outage',
    ],
    outOfScope: ['Billing tier rate limits', 'Geographic differentiation', 'Network-layer DDoS', 'Rate limit dashboards'],
  },
  nfr: {
    items: [
      'Low latency: < 5ms added P99 latency',
      'High accuracy: ≤ 1% false positives (legit requests blocked)',
      'High availability: must not be a single point of failure',
      'Distributed: consistent limits across all API nodes',
      'Scalability: handle 1M RPS across all services',
    ],
    scaleHints: [
      '1M RPS across all services → 1M Redis operations/sec',
      'Each rate limit check = 1 Redis INCR + 1 TTL read (or Lua atomic)',
      'Redis single-threaded but handles 100K+ ops/sec per node → need cluster or pipelining',
      'In-memory local cache as L1: reduces Redis load by 90% for hot keys',
    ],
  },
  entities: {
    entities: [
      {
        name: 'RateLimitCounter (Redis)',
        fields: [
          { name: 'key', type: 'string', note: '"rl:{userId}:{windowStart}" or "rl:{ip}:{windowStart}"' },
          { name: 'count', type: 'int', note: 'INCR increments atomically' },
          { name: 'ttl', type: 'int', note: 'Auto-expire after window duration' },
        ],
      },
      {
        name: 'RateLimitConfig (DB)',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'entityType', type: 'enum', note: 'USER | IP | API_KEY' },
          { name: 'limit', type: 'int', note: 'Max requests per window' },
          { name: 'windowSec', type: 'int', note: 'Window duration in seconds' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/check', params: '{ userId, ip, apiKey?, endpoint }', response: '{ allowed: bool, remaining: int, resetAt: timestamp }' },
      { method: 'GET', path: '/config', response: '{ rules: RateLimitConfig[] }' },
      { method: 'PUT', path: '/config/:id', params: '{ limit, windowSec }', response: '{ config }' },
    ],
  },
  hld: {
    components: [
      { id: 'client', label: 'API Client', rx: 0.05, ry: 0.5 },
      { id: 'rl_middleware', label: 'Rate Limit Middleware', sublabel: 'Per API node', rx: 0.25, ry: 0.5 },
      { id: 'local_cache', label: 'Local Cache', sublabel: 'In-proc LRU', rx: 0.42, ry: 0.25 },
      { id: 'redis_cluster', label: 'Redis Cluster', sublabel: 'Shared counters', rx: 0.42, ry: 0.75 },
      { id: 'api_service', label: 'API Service', sublabel: 'Business logic', rx: 0.65, ry: 0.5 },
      { id: 'config_db', label: 'Config DB', sublabel: 'Rate limit rules', rx: 0.82, ry: 0.5 },
    ],
    arrows: [
      { from: 'client', to: 'rl_middleware', label: 'Request' },
      { from: 'rl_middleware', to: 'local_cache', label: 'L1 check' },
      { from: 'rl_middleware', to: 'redis_cluster', label: 'L2 INCR + TTL' },
      { from: 'rl_middleware', to: 'api_service', label: 'Allowed → forward' },
      { from: 'rl_middleware', to: 'client', label: '429 → block' },
      { from: 'rl_middleware', to: 'config_db', label: 'Load rules (cached)' },
    ],
    deepDives: [
      { title: 'Algorithm comparison: token bucket vs sliding window', description: 'Token bucket burst handling, sliding window accuracy vs memory, fixed window edge case', minutes: 4 },
      { title: 'Distributed consistency: Lua script atomicity', description: 'MULTI/EXEC vs Lua script, race conditions, local cache sync strategy', minutes: 3 },
      { title: 'Failure modes: what happens when Redis is down', description: 'Fail open vs fail closed, circuit breaker, fallback to local counter', minutes: 3 },
    ],
  },
  guide: [
    { tips: ['Algorithm choice is the core design decision', 'Distributed state via Redis is the key insight', 'Latency budget < 5ms constrains your approach'], suggestions: ['Ask if this is middleware or a standalone service', 'Confirm fail-open vs fail-closed preference'], feedbackPrompt: 'Describe the problem...' },
    { tips: ['Block over-limit requests', 'Return 429 with Retry-After', 'Support burst'], suggestions: ['Per-user AND per-IP limits are different configurations'], feedbackPrompt: 'State FRs...' },
    { tips: ['< 5ms P99 latency is the binding constraint', '< 1% false positives', 'Distributed consistency across nodes'], suggestions: ['Local L1 cache reduces Redis load — mention it here'], feedbackPrompt: 'State NFRs + scale...' },
    { tips: ['Redis counter is the core entity', 'Config table for rules', 'Key schema: "rl:{entity}:{window}"'], suggestions: ['Show the TTL-based auto-expiry approach'], feedbackPrompt: 'Define entities...' },
    { tips: ['POST /check is the core endpoint', 'Config CRUD for ops team', 'Response must include remaining + resetAt'], feedbackPrompt: 'Define API...', suggestions: ['Show the 429 response headers (X-RateLimit-*)'] },
    { tips: ['Middleware on each API node is the right architecture', 'L1 local cache + L2 Redis is the two-tier approach', 'Config is loaded once and cached'], suggestions: ['Show the Lua script check-and-increment path', 'Where does rate limit config get loaded from?'], feedbackPrompt: 'Draw HLD...' },
    { tips: ['Algorithm trade-offs is the classic deep dive here', 'Lua atomicity prevents race conditions', 'Fail-open shows operational maturity'], suggestions: ['What\'s the sliding window counter approximation error?', 'How do you handle the race between two pods checking Redis?'], feedbackPrompt: 'Choose deep dives...' },
  ],
};

// ─── Stub Helper ─────────────────────────────────────────────────────────────

function makeStub(slug: string, title: string, context: string): ProblemCanvasData {
  // TODO: Replace with full per-problem data per spec Section 8
  // Priority: Netflix → Instagram → Google Search → Dropbox → all others
  const emptyGuideStage = {
    tips: ['Focus on the core user action', 'Estimate scale from DAU', 'State your consistency model'],
    suggestions: ['Consider failure modes', 'Think about read vs write ratio'],
    feedbackPrompt: 'Share your thinking...',
  };
  return {
    slug,
    problem: { title, context, scopeNote: 'TODO: fill scope note' },
    fr: { beginner: ['TODO'], midLevel: ['TODO'], senior: ['TODO'], outOfScope: ['TODO'] },
    nfr: { items: ['TODO'], scaleHints: ['TODO'] },
    entities: { entities: [{ name: 'TODO', fields: [{ name: 'id', type: 'UUID' }] }] },
    api: { endpoints: [{ method: 'GET', path: '/TODO', response: '{}' }] },
    hld: {
      components: [
        { id: 'client', label: 'Client', rx: 0.1, ry: 0.5 },
        { id: 'service', label: 'Service', rx: 0.5, ry: 0.5 },
        { id: 'db', label: 'Database', rx: 0.9, ry: 0.5 },
      ],
      arrows: [{ from: 'client', to: 'service' }, { from: 'service', to: 'db' }],
      deepDives: [{ title: 'TODO: Deep Dive 1', description: 'TODO', minutes: 5 }],
    },
    guide: [
      emptyGuideStage,
      emptyGuideStage,
      emptyGuideStage,
      emptyGuideStage,
      emptyGuideStage,
      emptyGuideStage,
      emptyGuideStage,
    ],
  };
}

// ── Netflix ───────────────────────────────────────────────────────────────────

const NETFLIX: ProblemCanvasData = {
  slug: 'design-netflix',
  problem: {
    title: 'Design Netflix',
    context:
      '220M subscribers. 15% of global downstream internet traffic. Core challenge: encode video once into 100+ bitrate/codec combinations and serve it to any device with < 2s startup latency via a global CDN.',
    scopeNote:
      'In scope: video upload + transcoding pipeline, content delivery via CDN, adaptive bitrate streaming, user recommendations. Out of scope: live streaming, downloads/offline, payment, content licensing.',
  },
  fr: {
    beginner: ['User watches a video', 'Video plays smoothly on any device', 'User sees a recommendations feed'],
    midLevel: [
      'Upload/ingest video → transcode to multiple bitrates',
      'Stream video via CDN with adaptive bitrate (ABR)',
      'User home feed: personalized recommendations',
      'Search: find titles by name/genre',
      'Continue watching: resume from last position',
    ],
    senior: [
      'Ingest → scene detection → parallel transcode (H.264/H.265/AV1, 240p→4K)',
      'ABR via DASH/HLS; Open Connect CDN with ISP-embedded appliances',
      'Recommendation: two-stage (candidate generation → ranking) with collaborative filtering',
      'Playback session: client-side ABR algorithm (BOLA/MPC) adapts to bandwidth',
      'A/B test artwork + recommendations with Zuul API gateway',
    ],
    outOfScope: ['Live streaming', 'Downloads / offline playback', 'Payment processing', 'Content licensing / DRM key management'],
  },
  nfr: {
    items: [
      'High availability: 99.99% — downtime is front-page news',
      'Low latency: < 2s startup time globally',
      'Scalability: 200M+ concurrent streams at peak',
      'Durability: source video stored in S3 with 3× redundancy',
      'Eventual consistency: stale recommendations are OK',
    ],
    scaleHints: [
      '220M subscribers → ~80M DAU → peak ~200M concurrent streams',
      '15% of global internet traffic → ~100 Tbps aggregate egress',
      'Avg video: 2 hrs at 5 Mbps = 4.5 GB; 1K new titles/month',
      'Transcode ratio: 1 source → 100+ output variants (codec × resolution × bitrate)',
      'CDN cache hit rate > 99% for popular content',
    ],
  },
  entities: {
    entities: [
      {
        name: 'Video',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'title', type: 'string' },
          { name: 'durationSec', type: 'int' },
          { name: 'status', type: 'enum', note: 'INGESTING|PROCESSING|READY' },
          { name: 'sourceS3Key', type: 'string' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'VideoVariant',
        fields: [
          { name: 'videoId', type: 'UUID' },
          { name: 'codec', type: 'string', note: 'H.264 | H.265 | AV1' },
          { name: 'resolution', type: 'string', note: '240p → 4K' },
          { name: 'bitrateKbps', type: 'int' },
          { name: 'cdnKey', type: 'string' },
        ],
      },
      {
        name: 'PlaybackSession',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'userId', type: 'UUID' },
          { name: 'videoId', type: 'UUID' },
          { name: 'positionSec', type: 'int', note: 'Resume position' },
          { name: 'deviceType', type: 'string' },
          { name: 'updatedAt', type: 'timestamp' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'GET', path: '/videos/:id/manifest', params: '?deviceType=TV&maxBitrate=8000', response: 'DASH/HLS manifest' },
      { method: 'GET', path: '/feed', params: '?userId=&cursor=', response: '{ rows: VideoRow[], nextCursor }' },
      { method: 'GET', path: '/search?q=&filters=', response: '{ titles: Video[] }' },
      { method: 'POST', path: '/playback/:id/position', params: '{ positionSec }', response: '200 OK' },
      { method: 'POST', path: '/ingest', params: '{ title, s3Key, metadata }', response: '{ videoId, jobId }' },
    ],
  },
  hld: {
    components: [
      { id: 'client', label: 'Client', sublabel: 'TV / Mobile / Web', rx: 0.04, ry: 0.5 },
      { id: 'api_gw', label: 'API Gateway', sublabel: 'Zuul / Envoy', rx: 0.18, ry: 0.5 },
      { id: 'ingest_svc', label: 'Ingest Service', sublabel: 'Upload + S3', rx: 0.34, ry: 0.15 },
      { id: 'transcode_q', label: 'Transcode Queue', sublabel: 'Kafka', rx: 0.5, ry: 0.15 },
      { id: 'transcode_workers', label: 'Transcode Workers', sublabel: 'GPU fleet', rx: 0.68, ry: 0.15 },
      { id: 'streaming_svc', label: 'Streaming Service', sublabel: 'Manifest gen', rx: 0.34, ry: 0.5 },
      { id: 'open_connect', label: 'Open Connect CDN', sublabel: 'ISP-embedded', rx: 0.55, ry: 0.5 },
      { id: 'rec_svc', label: 'Recommendation', sublabel: 'Spark ML + Redis', rx: 0.34, ry: 0.82 },
      { id: 'metadata_db', label: 'Metadata DB', sublabel: 'Cassandra', rx: 0.72, ry: 0.82 },
    ],
    arrows: [
      { from: 'client', to: 'api_gw' },
      { from: 'api_gw', to: 'streaming_svc', label: 'Watch' },
      { from: 'streaming_svc', to: 'open_connect', label: 'Manifest + segments' },
      { from: 'open_connect', to: 'client', label: 'Video segments' },
      { from: 'ingest_svc', to: 'transcode_q', label: 'Enqueue' },
      { from: 'transcode_q', to: 'transcode_workers' },
      { from: 'transcode_workers', to: 'open_connect', label: 'Push variants' },
      { from: 'api_gw', to: 'rec_svc', label: 'Feed' },
      { from: 'rec_svc', to: 'metadata_db', label: 'Enrich' },
    ],
    deepDives: [
      { title: 'Transcoding pipeline at scale', description: 'Scene detection, chunk-level parallel encode, codec comparison (H.264 vs AV1), quality ladders', minutes: 5 },
      { title: 'Open Connect CDN architecture', description: 'ISP-embedded appliances, proactive cache fill, anycast routing, cache invalidation', minutes: 3 },
      { title: 'Two-stage recommendation system', description: 'Candidate generation (ALS matrix factorization) → ranking (neural net + feature store)', minutes: 2 },
    ],
  },
  guide: [
    { tips: ['Transcoding pipeline + CDN are the two hard problems', 'Note the 15% of global internet stat', 'Open Connect is a real differentiator worth mentioning'], suggestions: ['Confirm: streaming only, no downloads?', 'Ask about live streaming (usually out of scope)'], feedbackPrompt: 'Describe the Netflix problem...' },
    { tips: ['Watch video + ABR streaming is the core FR', 'Recommendations drive engagement', 'Continue watching shows good product thinking'], suggestions: ['Be specific: adaptive bitrate is a distinct FR from just "watch video"'], feedbackPrompt: 'State your FRs...' },
    { tips: ['< 2s startup time is the binding NFR', '200M concurrent streams is the scale headline', 'CDN hit rate > 99% is achievable and important'], suggestions: ['Derive: 200M streams × 5 Mbps = 1 Pbps aggregate bandwidth'], feedbackPrompt: 'State NFRs + scale...' },
    { tips: ['Video + VideoVariant + PlaybackSession', 'Variant is the output of transcoding', 'Session tracks resume position'], suggestions: ['Don\'t forget PlaybackSession — resume is a core feature'], feedbackPrompt: 'Define entities...' },
    { tips: ['Manifest endpoint is the most important', 'It returns DASH/HLS playlist, not video bytes', 'Ingest is a separate admin-side endpoint'], feedbackPrompt: 'Define API...', suggestions: ['Show how the client uses the manifest to select bitrate'] },
    { tips: ['Draw ingest path separately from streaming path', 'Open Connect CDN is between streaming service and client', 'Transcoding is async via queue'], suggestions: ['How does a new episode get from upload to CDN in < 1 hour?', 'Where does the recommendation service fit?'], feedbackPrompt: 'Draw HLD...' },
    { tips: ['Transcoding pipeline is the expected deep dive', 'Open Connect architecture shows real-world depth', 'Two-stage recommendation shows ML system design'], suggestions: ['What happens if a transcode job fails mid-encode?', 'How does Open Connect know which content to proactively cache?'], feedbackPrompt: 'Choose deep dives...' },
  ],
};

// ── Instagram ─────────────────────────────────────────────────────────────────

const INSTAGRAM: ProblemCanvasData = {
  slug: 'design-instagram',
  problem: {
    title: 'Design Instagram',
    context:
      '2B MAU, 100M photos/day, 500M Stories/day. Core challenge: photo upload pipeline (compress → store → CDN), feed generation at scale, and a massive social graph. Users expect feed to load in < 200ms.',
    scopeNote:
      'In scope: photo upload, home feed, follow graph, likes/comments count, Stories (basic). Out of scope: Reels (video), DMs, Shopping, Creator monetisation, Instagram Live.',
  },
  fr: {
    beginner: ['User uploads a photo', 'User sees a home feed', 'User follows another user', 'User likes a photo'],
    midLevel: [
      'Upload photo → compress → store in S3 → serve via CDN',
      'Follow: update graph, affects feed',
      'Home feed: ranked posts from followed accounts',
      'Like / comment: counts visible in near-real-time',
      'Story: 24-hr ephemeral photo/video, viewed by followers',
    ],
    senior: [
      'Upload: client-side compress → S3 multipart → CDN pre-warm',
      'Feed: fan-out-on-write for regular users; pull-on-read for celebrities',
      'Social graph in graph DB or adjacency list (bidirectional follow)',
      'Like counter: Redis INCR with async flush to DB (approximate OK)',
      'Story expiry: TTL-based cleanup job, edge-cached for 24h',
    ],
    outOfScope: ['Reels / video', 'Direct Messages', 'Instagram Shopping', 'Creator monetisation', 'Instagram Live'],
  },
  nfr: {
    items: [
      'High availability: 99.99% — photo serving must never go down',
      'Low latency: feed load < 200ms P99',
      'Eventual consistency: like counts can lag a few seconds',
      'Scalability: 100M uploads/day → 1,157 uploads/sec',
      'Durability: photos stored with 3× redundancy',
    ],
    scaleHints: [
      '2B MAU → ~500M DAU → 100M uploads/day → 1,157 uploads/sec',
      'Average photo: 3 MB → 300 GB new storage/day → 110 TB/year',
      'Feed read:write ≈ 100:1',
      'Celebrity problem: Kylie Jenner (400M followers) → 400M feed writes per post',
      'Like count at scale: Redis INCR at ~50K likes/sec for viral posts',
    ],
  },
  entities: {
    entities: [
      {
        name: 'Photo',
        fields: [
          { name: 'id', type: 'UUID' },
          { name: 'userId', type: 'UUID' },
          { name: 'cdnUrl', type: 'string' },
          { name: 'caption', type: 'text' },
          { name: 'likeCount', type: 'bigint', note: 'Denormalized from Redis' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'Follow',
        fields: [
          { name: 'followerId', type: 'UUID' },
          { name: 'followeeId', type: 'UUID' },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      {
        name: 'FeedItem (cache)',
        fields: [
          { name: 'userId', type: 'UUID', note: 'Feed owner' },
          { name: 'photoIds', type: 'list<UUID>', note: 'Redis sorted set, score = timestamp' },
        ],
      },
    ],
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/photos/upload-url', params: '{ fileSize, mimeType }', response: '{ uploadUrl, photoId }' },
      { method: 'GET', path: '/feed', params: '?cursor=&limit=20', response: '{ photos: Photo[], nextCursor }' },
      { method: 'POST', path: '/follow', params: '{ followeeId }', response: '{ following: true }' },
      { method: 'POST', path: '/photos/:id/like', response: '{ likeCount }' },
      { method: 'GET', path: '/users/:id/photos', params: '?cursor=', response: '{ photos: Photo[] }' },
    ],
  },
  hld: {
    components: [
      { id: 'client', label: 'Client', sublabel: 'iOS / Android', rx: 0.04, ry: 0.5 },
      { id: 'api_gw', label: 'API Gateway', rx: 0.18, ry: 0.5 },
      { id: 'upload_svc', label: 'Upload Service', sublabel: 'S3 presigned URL', rx: 0.35, ry: 0.2 },
      { id: 'cdn', label: 'CDN', sublabel: 'CloudFront', rx: 0.55, ry: 0.2 },
      { id: 'feed_svc', label: 'Feed Service', sublabel: 'Fan-out write/read', rx: 0.35, ry: 0.5 },
      { id: 'redis_feed', label: 'Redis', sublabel: 'Feed + like cache', rx: 0.55, ry: 0.5 },
      { id: 'graph_svc', label: 'Social Graph', sublabel: 'Follow adjacency', rx: 0.35, ry: 0.8 },
      { id: 'photo_db', label: 'Photo DB', sublabel: 'Cassandra', rx: 0.72, ry: 0.5 },
    ],
    arrows: [
      { from: 'client', to: 'api_gw' },
      { from: 'api_gw', to: 'upload_svc', label: 'Upload' },
      { from: 'upload_svc', to: 'cdn', label: 'Origin push' },
      { from: 'cdn', to: 'client', label: 'Photo delivery' },
      { from: 'api_gw', to: 'feed_svc', label: 'GET /feed' },
      { from: 'feed_svc', to: 'redis_feed', label: 'Read timeline IDs' },
      { from: 'feed_svc', to: 'photo_db', label: 'Hydrate photos' },
      { from: 'feed_svc', to: 'graph_svc', label: 'Get followees' },
      { from: 'upload_svc', to: 'feed_svc', label: 'Fan-out on upload' },
    ],
    deepDives: [
      { title: 'Feed fan-out: push vs pull vs hybrid', description: 'Same celebrity problem as Twitter — push for regular users, pull-merge for high-follower accounts', minutes: 4 },
      { title: 'Photo upload pipeline', description: 'Client-side resize → S3 presigned → CDN pre-warm → metadata write → async feed fan-out', minutes: 3 },
      { title: 'Like counter at scale', description: 'Redis INCR for speed, async flush to Cassandra every 5s, approximate OK for viral posts', minutes: 3 },
    ],
  },
  guide: [
    { tips: ['Feed generation + photo pipeline are the two hard problems', 'Celebrity fan-out is the same problem as Twitter', 'Photo serving is 90% of the traffic'], suggestions: ['Confirm: no video/Reels (simplifies pipeline)', 'Ask about Stories — 24h ephemeral changes the storage model'], feedbackPrompt: 'Describe the Instagram problem...' },
    { tips: ['Upload + feed + follow + like are the 4 core FRs', 'Stories add ephemeral dimension', 'Keep it to 4-5 FRs max'], suggestions: ['Be specific: feed is ranked, not chronological'], feedbackPrompt: 'State FRs...' },
    { tips: ['< 200ms feed load is the binding NFR', '1,157 uploads/sec is manageable', 'Celebrity problem multiplies your write load'], suggestions: ['Derive: Kylie Jenner post → 400M feed writes. That\'s the fan-out problem statement.'], feedbackPrompt: 'State NFRs + scale...' },
    { tips: ['Photo + Follow + FeedItem (cache) are the 3 entities', 'FeedItem lives in Redis, not DB', 'Like count is denormalized from Redis'], suggestions: ['Don\'t put feed items in Postgres — it can\'t support 100M reads/day per user'], feedbackPrompt: 'Define entities...' },
    { tips: ['Upload presigned URL pattern', 'Feed endpoint is the most important', 'Follow and like are simple POSTs'], feedbackPrompt: 'Define API...', suggestions: ['Show the two-step upload: get presigned URL → PUT to S3'] },
    { tips: ['Draw upload path and feed path separately', 'CDN is between upload service and client', 'Redis holds the feed IDs; Cassandra holds the photo data'], suggestions: ['Show the fan-out step after upload', 'How does the celebrity path differ?'], feedbackPrompt: 'Draw HLD...' },
    { tips: ['Fan-out is the must-cover deep dive', 'Photo upload pipeline shows end-to-end thinking', 'Like counter at scale is a nice technical deep dive'], suggestions: ['What\'s the cutoff follower count for hybrid fan-out?', 'How do you handle a CDN cache miss for a new photo?'], feedbackPrompt: 'Choose deep dives...' },
  ],
};

// ─── Canvas Data Map ──────────────────────────────────────────────────────────

export const CANVAS_DATA: Record<string, ProblemCanvasData> = {
  // ── Fully specified (6 core problems) ──
  'design-youtube':      YOUTUBE,
  'design-tinyurl':      TINYURL,
  'design-twitter':      TWITTER,
  'design-uber':         UBER,
  'design-whatsapp':     WHATSAPP,
  'design-rate-limiter': RATE_LIMITER,

  // ── Priority stubs (TODO: fill in next sessions) ──
  'design-netflix':   NETFLIX,
  'design-instagram': INSTAGRAM,
  'design-google-search': makeStub('design-google-search', 'Design Google Search',
    '8.5B searches/day. Core challenge: crawling the web, building an inverted index, and returning ranked results in < 200ms.'),
  'design-dropbox': makeStub('design-dropbox', 'Design Dropbox',
    '700M registered users, 500M files uploaded/day. Core challenge: file sync across devices with conflict resolution.'),
  'design-typeahead': makeStub('design-typeahead', 'Design Typeahead / Autocomplete',
    '10B searches/day at Google. Core challenge: return top-5 suggestions in < 100ms for any prefix.'),
  'design-unique-id-generator': makeStub('design-unique-id-generator', 'Design a Unique ID Generator',
    'Generate 10K unique IDs/sec across distributed services. Must be sortable by time, 64-bit, and no coordination required.'),
  'design-leaderboard': makeStub('design-leaderboard', 'Design a Leaderboard',
    '1M concurrent players. Real-time rank updates. Top-10 and user\'s own rank visible instantly.'),
  'design-notification-system': makeStub('design-notification-system', 'Design a Notification System',
    'Send 10M push/email/SMS notifications per day. Support multiple channels. Guarantee at-least-once delivery with dedup.'),
  'design-key-value-store': makeStub('design-key-value-store', 'Design a Key-Value Store',
    'Build a distributed KV store like Redis or DynamoDB. CAP trade-offs, replication, partitioning, and failure recovery.'),
  'design-message-queue': makeStub('design-message-queue', 'Design a Message Queue',
    'Build a distributed message queue like Kafka. Producers write, consumers read, at-least-once delivery, log retention.'),
  'design-load-balancer': makeStub('design-load-balancer', 'Design a Load Balancer',
    'L7 load balancer handling 1M RPS. Health checks, routing algorithms (round-robin, least-conn, IP-hash), sticky sessions.'),
  'design-cdn': makeStub('design-cdn', 'Design a CDN',
    'Content delivery network with 100+ PoPs. Cache static assets at the edge. < 50ms latency globally. Cache invalidation.'),
  'design-web-crawler': makeStub('design-web-crawler', 'Design a Web Crawler',
    'Crawl 1B pages/month. Handle robots.txt, de-duplication, politeness delays, JavaScript rendering.'),
  'design-lru-cache': makeStub('design-lru-cache', 'Design an LRU Cache',
    'Thread-safe LRU cache with O(1) get/put. Distributed version: consistent hashing, cache invalidation, TTL.'),
  'design-elevator-system': makeStub('design-elevator-system', 'Design an Elevator System',
    'OOD: N elevators in a building with M floors. Dispatching algorithm, state machine, emergency handling.'),
};

/**
 * Get canvas data for a problem slug.
 * Falls back to a generic stub if the problem isn't defined yet.
 */
export function getCanvasData(slug: string): ProblemCanvasData {
  return CANVAS_DATA[slug] ?? makeStub(slug, slug.replace('design-', '').replace(/-/g, ' '), 'Problem description not yet configured for V2 canvas.');
}
