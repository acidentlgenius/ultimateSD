export type ProblemTagCategory = 'pattern' | 'infrastructure' | 'capability' | 'domain';

export interface ProblemTag {
  id: string;
  label: string;
  category: ProblemTagCategory;
}

export const TAG_CATEGORY_LABELS: Record<ProblemTagCategory, string> = {
  pattern: 'Pattern',
  infrastructure: 'Infrastructure',
  capability: 'Capability',
  domain: 'Domain',
};

export const TAG_CATEGORY_STYLES: Record<ProblemTagCategory, string> = {
  pattern:
    'text-violet-700 bg-violet-500/10 border-violet-500/25 dark:text-violet-300 dark:border-violet-500/30',
  infrastructure:
    'text-sky-700 bg-sky-500/10 border-sky-500/25 dark:text-sky-300 dark:border-sky-500/30',
  capability:
    'text-amber-700 bg-amber-500/10 border-amber-500/25 dark:text-amber-300 dark:border-amber-500/30',
  domain:
    'text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-300 dark:border-emerald-500/30',
};

/** Controlled vocabulary of interview-relevant system design topics. */
export const TAG_REGISTRY = {
  // Patterns
  'id-generation': { label: 'ID Generation', category: 'pattern' },
  'consistent-hashing': { label: 'Consistent Hashing', category: 'pattern' },
  'rate-limiting': { label: 'Rate Limiting', category: 'pattern' },
  'leader-election': { label: 'Leader Election', category: 'pattern' },
  'fan-out-on-write': { label: 'Fan-out on Write', category: 'pattern' },
  'typeahead': { label: 'Typeahead', category: 'pattern' },
  'crdt': { label: 'CRDT / OT', category: 'pattern' },
  saga: { label: 'Saga', category: 'pattern' },
  'circuit-breaker': { label: 'Circuit Breaker', category: 'pattern' },
  'strangler-fig': { label: 'Strangler Fig', category: 'pattern' },
  'blue-green': { label: 'Blue-Green Deploy', category: 'pattern' },
  sharding: { label: 'Sharding', category: 'pattern' },
  replication: { label: 'Replication', category: 'pattern' },
  'event-driven': { label: 'Event-Driven', category: 'pattern' },
  consensus: { label: 'Consensus', category: 'pattern' },
  idempotency: { label: 'Idempotency', category: 'pattern' },
  'inverted-index': { label: 'Inverted Index', category: 'pattern' },
  'chunking': { label: 'Chunking', category: 'pattern' },
  auction: { label: 'Auction', category: 'pattern' },
  scheduling: { label: 'Scheduling', category: 'pattern' },
  'state-machine': { label: 'State Machine', category: 'pattern' },
  'oop-design': { label: 'OOP Design', category: 'pattern' },
  hashing: { label: 'Hashing', category: 'pattern' },
  matching: { label: 'Matching', category: 'pattern' },
  eviction: { label: 'Eviction Policies', category: 'pattern' },
  experimentation: { label: 'Experimentation', category: 'pattern' },
  metadata: { label: 'Metadata', category: 'pattern' },
  'health-checks': { label: 'Health Checks', category: 'pattern' },
  rollout: { label: 'Rollout', category: 'pattern' },
  deployment: { label: 'Deployment', category: 'pattern' },
  automation: { label: 'Automation', category: 'pattern' },
  'data-structures': { label: 'Data Structures', category: 'pattern' },

  // Infrastructure
  caching: { label: 'Caching', category: 'infrastructure' },
  cdn: { label: 'CDN', category: 'infrastructure' },
  'load-balancer': { label: 'Load Balancer', category: 'infrastructure' },
  'message-queue': { label: 'Message Queue', category: 'infrastructure' },
  'kv-store': { label: 'Key-Value Store', category: 'infrastructure' },
  'object-storage': { label: 'Object Storage', category: 'infrastructure' },
  'distributed-filesystem': { label: 'Distributed FS', category: 'infrastructure' },
  'api-gateway': { label: 'API Gateway', category: 'infrastructure' },
  'service-mesh': { label: 'Service Mesh', category: 'infrastructure' },
  'vector-db': { label: 'Vector DB', category: 'infrastructure' },
  'data-pipeline': { label: 'Data Pipeline', category: 'infrastructure' },
  etl: { label: 'ETL', category: 'infrastructure' },
  websockets: { label: 'WebSockets', category: 'infrastructure' },
  pubsub: { label: 'Pub/Sub', category: 'infrastructure' },

  // Capabilities
  'real-time': { label: 'Real-time', category: 'capability' },
  streaming: { label: 'Streaming', category: 'capability' },
  'search-ranking': { label: 'Search & Ranking', category: 'capability' },
  geospatial: { label: 'Geospatial', category: 'capability' },
  notifications: { label: 'Notifications', category: 'capability' },
  analytics: { label: 'Analytics', category: 'capability' },
  observability: { label: 'Observability', category: 'capability' },
  encryption: { label: 'Encryption', category: 'capability' },
  'high-availability': { label: 'High Availability', category: 'capability' },
  ml: { label: 'Machine Learning', category: 'capability' },
  llm: { label: 'LLM', category: 'capability' },
  rag: { label: 'RAG', category: 'capability' },
  security: { label: 'Security', category: 'capability' },
  compliance: { label: 'Compliance', category: 'capability' },
  'api-design': { label: 'API Design', category: 'capability' },
  crawling: { label: 'Web Crawling', category: 'capability' },
  sync: { label: 'Sync & Conflict', category: 'capability' },
  payments: { label: 'Payments', category: 'capability' },
  'content-moderation': { label: 'Content Moderation', category: 'capability' },
  recommendation: { label: 'Recommendations', category: 'capability' },
  batch: { label: 'Batch Processing', category: 'capability' },
  graph: { label: 'Graph Algorithms', category: 'capability' },
  indexing: { label: 'Indexing', category: 'capability' },
  orchestration: { label: 'Orchestration', category: 'capability' },
  'stream-processing': { label: 'Stream Processing', category: 'capability' },
  failover: { label: 'Failover', category: 'capability' },
  resilience: { label: 'Resilience', category: 'capability' },
  consistency: { label: 'Consistency', category: 'capability' },
  'time-series': { label: 'Time Series', category: 'capability' },

  // Domains
  'social-feed': { label: 'Social Feed', category: 'domain' },
  messaging: { label: 'Messaging', category: 'domain' },
  video: { label: 'Video', category: 'domain' },
  'e-commerce': { label: 'E-commerce', category: 'domain' },
  ads: { label: 'Ad Serving', category: 'domain' },
  iot: { label: 'IoT', category: 'domain' },
  'ai-agents': { label: 'AI Agents', category: 'domain' },
  inventory: { label: 'Inventory', category: 'domain' },
} as const satisfies Record<string, { label: string; category: ProblemTagCategory }>;

export type ProblemTagId = keyof typeof TAG_REGISTRY;

/** Curated tags per problem slug — 2–4 specific interview topics each. */
export const PROBLEM_TAG_IDS: Record<string, ProblemTagId[]> = {
  'design-tinyurl': ['id-generation', 'hashing', 'caching', 'analytics'],
  'design-youtube': ['streaming', 'cdn', 'ml', 'video'],
  'design-twitter': ['fan-out-on-write', 'social-feed', 'real-time', 'caching'],
  'design-instagram': ['object-storage', 'cdn', 'social-feed', 'ml'],
  'design-uber': ['geospatial', 'real-time', 'matching', 'payments'],
  'design-netflix': ['streaming', 'cdn', 'ml', 'video'],
  'design-whatsapp': ['messaging', 'encryption', 'real-time', 'pubsub'],
  'design-facebook-news-feed': ['fan-out-on-write', 'social-feed', 'caching', 'ml'],
  'design-google-search': ['inverted-index', 'crawling', 'search-ranking', 'typeahead'],
  'design-dropbox': ['sync', 'object-storage', 'chunking', 'replication'],
  'design-parking-lot': ['oop-design', 'state-machine', 'scheduling'],
  'design-elevator-system': ['oop-design', 'state-machine', 'scheduling'],
  'design-distributed-cache': ['caching', 'consistent-hashing', 'replication', 'eviction'],
  'design-typeahead-suggestion': ['typeahead', 'caching', 'search-ranking'],
  'design-unique-id-generator': ['id-generation', 'sharding', 'consensus'],
  'design-leaderboard': ['real-time', 'caching', 'analytics'],
  'design-rate-limiter': ['rate-limiting', 'kv-store', 'caching'],
  'design-recommendation-engine': ['ml', 'data-pipeline', 'analytics'],
  'design-fraud-detection': ['ml', 'real-time', 'analytics', 'payments'],
  'design-personalized-search': ['search-ranking', 'ml', 'inverted-index'],
  'design-ab-testing': ['analytics', 'experimentation', 'data-pipeline'],
  'design-notification-system': ['notifications', 'pubsub', 'fan-out-on-write'],
  'design-file-storage': ['object-storage', 'replication', 'sync', 'metadata'],
  'design-task-scheduler': ['scheduling', 'message-queue', 'leader-election'],
  'design-video-call': ['real-time', 'streaming', 'websockets', 'video'],
  'design-logging-system': ['observability', 'analytics', 'search-ranking'],
  'design-metrics-monitoring': ['observability', 'analytics', 'time-series'],
  'design-key-value-store': ['kv-store', 'sharding', 'replication', 'consistency'],
  'design-message-queue': ['message-queue', 'pubsub', 'replication'],
  'design-load-balancer': ['load-balancer', 'health-checks', 'caching'],
  'design-cdn': ['cdn', 'caching', 'geospatial'],
  'design-web-crawler': ['crawling', 'scheduling', 'distributed-filesystem'],
  'design-distributed-file-system': ['distributed-filesystem', 'replication', 'metadata'],
  'design-leader-election-system': ['leader-election', 'consensus', 'distributed-filesystem'],
  'design-configuration-management-system': ['api-design', 'replication', 'rollout'],
  'design-secret-management-system': ['encryption', 'security', 'compliance'],
  'design-ci-cd-pipeline': ['deployment', 'automation', 'api-design'],
  'design-microservices-architecture': ['api-design', 'service-mesh', 'event-driven'],
  'design-graphql-api': ['api-design', 'caching', 'api-gateway'],
  'design-rest-api': ['api-design', 'rate-limiting', 'security'],
  'design-websocket-system': ['websockets', 'real-time', 'pubsub'],
  'design-collaborative-editor': ['crdt', 'real-time', 'sync'],
  'design-ad-serving-system': ['ads', 'auction', 'real-time', 'ml'],
  'design-personalized-feed': ['social-feed', 'ml', 'caching', 'search-ranking'],
  'design-feature-flag-system': ['rollout', 'api-design', 'caching'],
  'design-service-mesh': ['service-mesh', 'observability', 'security'],
  'design-distributed-tracing-system': ['observability', 'analytics', 'service-mesh'],
  'design-compliance-auditing-system': ['compliance', 'analytics', 'encryption'],
  'design-gdpr-compliant-system': ['compliance', 'encryption', 'data-pipeline'],
  'design-blockchain-system': ['consensus', 'replication', 'encryption'],
  'design-iot-platform': ['iot', 'pubsub', 'analytics', 'real-time'],
  'design-ar-vr-system': ['streaming', 'real-time', 'video'],
  'design-quantum-computing-system': ['scheduling', 'distributed-filesystem'],
  'design-metaverse-platform': ['real-time', 'sync', 'object-storage'],
  'design-brain-computer-interface': ['real-time', 'streaming', 'analytics'],
  'design-space-debris-tracking-system': ['geospatial', 'real-time', 'analytics'],
  'design-personalized-learning-platform': ['ml', 'analytics', 'recommendation'],
  'design-climate-model-simulator': ['data-pipeline', 'analytics', 'batch'],
  'design-global-supply-chain-optimizer': ['analytics', 'scheduling', 'graph'],
  'design-zero-trust-network': ['security', 'encryption', 'api-gateway'],
  'design-carbon-footprint-tracker': ['analytics', 'data-pipeline', 'iot'],
  'design-sustainable-data-center': ['analytics', 'scheduling', 'iot'],
  'design-federated-learning-system': ['ml', 'encryption', 'distributed-filesystem'],
  'design-explainable-ai-system': ['ml', 'analytics', 'compliance'],
  'design-vector-database': ['vector-db', 'search-ranking', 'indexing'],
  'design-multi-modal-search-engine': ['search-ranking', 'ml', 'vector-db'],
  'design-autonomous-agent-orchestrator': ['ai-agents', 'llm', 'orchestration'],
  'design-generative-ai-content-moderator': ['content-moderation', 'ml', 'llm'],
  'design-rag-system': ['rag', 'vector-db', 'llm'],
  'design-conversational-ai-platform': ['llm', 'real-time', 'messaging'],
  'design-real-time-analytics-system': ['analytics', 'stream-processing', 'real-time'],
  'design-data-lake': ['data-pipeline', 'object-storage', 'etl'],
  'design-data-warehouse': ['etl', 'analytics', 'data-pipeline'],
  'design-etl-pipeline': ['etl', 'data-pipeline', 'scheduling'],
  'design-backup-recovery-system': ['replication', 'object-storage', 'high-availability'],
  'design-disaster-recovery-system': ['high-availability', 'replication', 'failover'],
  'design-high-availability-system': ['high-availability', 'replication', 'load-balancer'],
  'design-scalable-api-gateway': ['api-gateway', 'rate-limiting', 'load-balancer'],
  'design-event-driven-architecture': ['event-driven', 'pubsub', 'message-queue'],
  'design-saga-pattern-implementation': ['saga', 'event-driven', 'idempotency'],
  'design-circuit-breaker-pattern': ['circuit-breaker', 'resilience', 'observability'],
  'design-strangler-fig-migration': ['strangler-fig', 'api-gateway', 'event-driven'],
  'design-blue-green-deployment': ['blue-green', 'deployment', 'high-availability'],
  'design-flash-sale-system': ['e-commerce', 'caching', 'rate-limiting', 'inventory'],
  'design-ai-coding-agent-workspace': ['ai-agents', 'security', 'real-time', 'cloud-infrastructure'],
  'design-payment-system': ['payments', 'idempotency', 'consistency', 'security'],
  'design-lru-cache': ['caching', 'data-structures'],
};

export function resolveTag(id: string): ProblemTag | null {
  const entry = TAG_REGISTRY[id as ProblemTagId];
  if (!entry) return null;
  return { id, label: entry.label, category: entry.category };
}

export function getProblemTags(slug: string, legacyTags?: string[]): ProblemTag[] {
  const ids = PROBLEM_TAG_IDS[slug];
  if (ids?.length) {
    return ids.map((id) => resolveTag(id)).filter((t): t is ProblemTag => t !== null);
  }

  // Fallback: normalize legacy free-text tags into best-effort labels
  if (!legacyTags?.length) return [];
  return legacyTags.map((raw) => ({
    id: raw.toLowerCase().replace(/\s+/g, '-'),
    label: raw,
    category: 'capability' as ProblemTagCategory,
  }));
}

export function getAllFilterTags(problems: { slug: string; tags?: string[] }[]): ProblemTag[] {
  const seen = new Map<string, ProblemTag>();
  for (const problem of problems) {
    for (const tag of getProblemTags(problem.slug, problem.tags)) {
      if (!seen.has(tag.id)) {
        seen.set(tag.id, tag);
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function problemMatchesTag(
  slug: string,
  legacyTags: string[] | undefined,
  tagId: string
): boolean {
  return getProblemTags(slug, legacyTags).some((t) => t.id === tagId);
}
