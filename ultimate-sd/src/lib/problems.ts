import { SystemDesignProblem, StepData } from '@/types';

const TINYURL_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Requirements',
      prompt: 'List the core features for TinyURL. (e.g., Shorten URL, Redirect, Custom alias, Expiration)',
      inputType: 'list',
      placeholder: 'e.g., User provides long URL -> gets short URL'
    },
    {
      phase: 'Requirements',
      subStep: 'non-functional',
      title: 'Scale & Constraints',
      prompt: 'Calculate the traffic (QPS) and storage requirements for 100M URLs/day. What is the read/write ratio?',
      inputType: 'textarea',
      placeholder: 'Do some back-of-the-envelope calculations...'
    }
  ],
  algorithm: [
    {
      phase: 'Algorithm',
      subStep: 'encoding',
      title: 'Shortening Algorithm',
      prompt: 'How will you generate unique short keys? Discuss Base62 vs MD5/SHA1 + truncation. How do you handle collisions?',
      inputType: 'textarea',
      placeholder: 'Explain your choice of algorithm...',
      widgetId: 'encoding-visualizer'
    }
  ],
  database: [
    {
      phase: 'Database',
      subStep: 'schema',
      title: 'Database Schema',
      prompt: 'Design the schema for storing URLs and user data. Consider the high read/write ratio.',
      inputType: 'schema',
      placeholder: 'Define ShortLink table...'
    },
    {
      phase: 'Database',
      subStep: 'choice',
      title: 'SQL vs NoSQL',
      prompt: 'Would you choose SQL (Postgres/MySQL) or NoSQL (Cassandra/DynamoDB)? Why?',
      inputType: 'textarea',
      placeholder: 'Justify your database choice...'
    }
  ],
  hld: [
    {
      phase: 'HLD',
      subStep: 'architecture',
      title: 'High-Level Architecture',
      prompt: 'Draw the system architecture including Web Service, Database, and Cache.',
      inputType: 'textarea',
      placeholder: 'Describe the components...'
    }
  ],
  "deep-dive": [
    {
      phase: 'Deep Dive',
      subStep: 'redirects',
      title: '301 vs 302 Redirect',
      prompt: 'What is the difference between 301 and 302 redirects in this context? Which one serves analytics better?',
      inputType: 'textarea',
      placeholder: 'Explain the detailed behavior...'
    }
  ],
  cleanup: [
    {
      phase: 'Cleanup',
      subStep: 'db-cleanup',
      title: 'Database Cleanup',
      prompt: 'How do you handle expired URLs? Lazy cleanup vs scheduled jobs?',
      inputType: 'list',
      placeholder: 'e.g. Cron job every 24h'
    }
  ]
};

const YOUTUBE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'core',
      title: 'Functional Specs',
      prompt: 'Define core features: Video Upload, Streaming, View Counter, Likes/Comments.',
      inputType: 'list',
      placeholder: 'e.g., Creator uploads video -> processed -> available for streaming'
    },
    {
      phase: 'Requirements',
      subStep: 'capacity',
      title: 'Storage & Bandwidth',
      prompt: 'Estimate storage for new videos (1TB/min?). Estimate bandwidth for streaming.',
      inputType: 'textarea',
      placeholder: 'Crunch the numbers...',
      widgetId: 'capacity-calculator'
    }
  ],
  processing: [
    {
      phase: 'Video Processing',
      subStep: 'transcoding',
      title: 'Transcoding Pipeline',
      prompt: 'How do you handle different resolutions/codecs? DAG model for processing tasks?',
      inputType: 'textarea',
      placeholder: 'Explain the pipeline...'
    },
    {
      phase: 'Video Processing',
      subStep: 'cdn',
      title: 'CDN Strategy',
      prompt: 'How do you distribute content globally? Cached at edge vs origin?',
      inputType: 'textarea',
      placeholder: 'Discuss CDN usage...'
    }
  ],
  database: [
    {
      phase: 'Database',
      subStep: 'metadata',
      title: 'Metadata Storage',
      prompt: 'Where do you store video metadata vs actual video files? Sharding strategy?',
      inputType: 'schema',
      placeholder: 'Schema for Video, User, Comment...'
    }
  ],
  hld: [
    {
      phase: 'System Architecture',
      subStep: 'diagram',
      title: 'High Level Design',
      prompt: 'Draw the components: Upload Service, Transcoder, Metadata DB, CDN, Client.',
      inputType: 'textarea',
      placeholder: 'Describe the flow...'
    }
  ]
};

const TWITTER_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'features',
      title: 'Core Features',
      prompt: 'Tweet, Timeline, Follow, Search.',
      inputType: 'list',
      placeholder: 'List features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Read vs Write',
      prompt: 'Twitter is read-heavy. Calculate Read/Write ratio. 300K QPS for reads?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "fan-out": [
    {
      phase: 'Fan-out',
      subStep: 'strategy',
      title: 'Fan-out Service',
      prompt: 'Push (Fan-out on write) vs Pull (Fan-out on read). Which one for celebrities? Hybrid approach?',
      inputType: 'textarea',
      placeholder: 'Compare approaches...',
      widgetId: 'fanout-visualizer'
    }
  ],
  database: [
    {
      phase: 'Data Storage',
      subStep: 'schema',
      title: 'Schema Design',
      prompt: 'User Table, Tweet Table, Follow Table. How to store timeline?',
      inputType: 'schema',
      placeholder: 'Define tables...'
    },
    {
      phase: 'Data Storage',
      subStep: 'cache',
      title: 'Caching Strategy',
      prompt: 'Redis for timelines? How many tweets to cache per user?',
      inputType: 'textarea',
      placeholder: 'Caching details...'
    }
  ],
  hld: [
    {
      phase: 'Architecture',
      subStep: 'hld',
      title: 'System Diagram',
      prompt: 'Draw Load Balancer, API Gateway, Fanout Service, Redis, DB.',
      inputType: 'textarea',
      placeholder: 'Architecture overview...'
    }
  ]
};

const INSTAGRAM_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'List core features: Photo Upload, News Feed, Following, Stories.',
      inputType: 'list',
      placeholder: 'e.g. User uploads photo -> followers see it in feed'
    },
    {
      phase: 'Requirements',
      subStep: 'non-functional',
      title: 'Constraints',
      prompt: 'Assume 500M DAU. 1B photos/day. Heavy read/write ratio. High availability.',
      inputType: 'textarea',
      placeholder: 'Calculate storage per day...'
    }
  ],
  "data-modeling": [
    {
      phase: 'Data Modeling',
      subStep: 'graph',
      title: 'User Graph',
      prompt: 'How to model follows? Adjacency list (Postgres) vs Graph DB (Neo4j)?',
      inputType: 'textarea',
      placeholder: 'Discuss data model trade-offs...'
    }
  ],
  "feed-generation": [
    {
      phase: 'Feed Gen',
      subStep: 'ranking',
      title: 'Feed Ranking',
      prompt: 'How do you rank posts? Weigh Recency vs Affinity vs Popularity. Test the algorithm below.',
      inputType: 'textarea',
      placeholder: 'Explain your ranking factors...',
      widgetId: 'feed-ranking-simulator'
    }
  ],
  "storage": [
    {
      phase: 'Storage',
      subStep: 'blobs',
      title: 'Photo Storage',
      prompt: 'How to store PBs of photos? Object storage (S3) + CDN. Hot vs Cold handling?',
      inputType: 'textarea',
      placeholder: 'Storage strategy...'
    }
  ]
};

const UBER_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Core Features',
      prompt: 'Rider: Request ride, see ETA. Driver: Accept ride, see route. System: Match maker.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale & Latency',
      prompt: 'Real-time requirements are strict. How many driver position updates per second? (e.g. 1M drivers * update every 3s)',
      inputType: 'textarea',
      placeholder: 'Calculate TPS...'
    }
  ],
  "marketplace": [
    {
      phase: 'Marketplace',
      subStep: 'matching',
      title: 'Matching Service',
      prompt: 'How do you match a rider with the nearest driver? Naive distance calc vs geospatial index.',
      inputType: 'textarea',
      placeholder: 'Explain matching logic...'
    }
  ],
  "geospatial": [
    {
      phase: 'Geospatial',
      subStep: 'quadtree',
      title: 'Geospatial Index',
      prompt: 'Visualize how a QuadTree (or Geohash) partitions the map to find nearby neighbors efficiently.',
      inputType: 'textarea',
      placeholder: 'Interact with the map...',
      widgetId: 'quadtree-visualizer'
    }
  ],
  "hld": [
    {
      phase: 'Architecture',
      subStep: 'diagram',
      title: 'High Level Design',
      prompt: 'Components: Location Service (Write heavy), Map Service (Read heavy), Notification Service.',
      inputType: 'textarea',
      placeholder: 'Draw the HLD...'
    }
  ]
};


const NETFLIX_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'core',
      title: 'Core Features',
      prompt: 'Upload movie, Transcode, Distribute, Stream. Personalized Homepage.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: 'Global traffic. High bandwidth consumption. Latency sensitivity vs Consistency?',
      inputType: 'textarea',
      placeholder: 'Discuss scale...'
    }
  ],
  "content-delivery": [
    {
      phase: 'Content Delivery',
      subStep: 'transcoding',
      title: 'Transcoding (DAG)',
      prompt: 'How to convert raw 8K master file into 50+ formats (Mobile, TV, 4K, 1080p)? Parallel processing?',
      inputType: 'textarea',
      placeholder: 'Explain DAG model...'
    },
    {
      phase: 'Content Delivery',
      subStep: 'open-connect',
      title: 'Open Connect (CDN)',
      prompt: 'Netflix builds their own ISP appliances (Open Connect). Why? Proactive caching during off-peak hours.',
      inputType: 'textarea',
      placeholder: 'Explain CDN strategy...'
    }
  ],
  "streaming": [
    {
      phase: 'Streaming',
      subStep: 'abr',
      title: 'Adaptive Bitrate',
      prompt: 'How does the client decide which quality to request? Test the ABR algorithm below.',
      inputType: 'textarea',
      placeholder: 'Observe switching behavior...',
      widgetId: 'abr-simulator'
    }
  ],
  "hld": [
    {
      phase: 'Architecture',
      subStep: 'diagram',
      title: 'High Level Design',
      prompt: 'Draw components: Asset DB, Control Plane, Open Connect Appliances, Client.',
      inputType: 'textarea',
      placeholder: 'Architecture diagram...'
    }
  ]
};

const WHATSAPP_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: '1:1 Chat, Group Chat, Online Status, Sent/Delivered/Read Receipts.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: '2B users. 100B messages/day. High throughput, low latency. Store-and-forward?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "messaging": [
    {
      phase: 'Messaging',
      subStep: 'protocol',
      title: 'Communication Protocol',
      prompt: 'WebSocket (or XMPP/MQTT)? Why persistent connection? How to handle offline users?',
      inputType: 'textarea',
      placeholder: 'Explain connection model...'
    },
    {
      phase: 'Messaging',
      subStep: 'encryption',
      title: 'E2E Encryption',
      prompt: 'How does the Signal Protocol work? Public/Private Keys, Double Ratchet. Visualize it below.',
      inputType: 'textarea',
      placeholder: 'Interact with the demo...',
      widgetId: 'e2e-encryption-demo'
    }
  ],
  "storage": [
    {
      phase: 'Storage',
      subStep: 'db',
      title: 'Message Storage',
      prompt: 'Do you store messages on server forever? Or delete after delivery? Chat history backup?',
      inputType: 'textarea',
      placeholder: 'Storage strategy...'
    }
  ]
};

const FACEBOOK_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'News Feed, Friends, Posting, Likes/Comments. What is the core product?',
      inputType: 'list',
      placeholder: 'List features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale Estimation',
      prompt: '2B DAU. Each user sees 50 posts/load. Heavy read/write ratio. Latency < 200ms.',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "feed-generation": [
    {
      phase: 'Feed Generation',
      subStep: 'fanout',
      title: 'Feed Architecture',
      prompt: 'How is the feed constructed? "Pull" (generate on load) vs "Push" (fan-out on write). Visualize the flow below.',
      inputType: 'textarea',
      placeholder: 'Interact with the architecture...',
      widgetId: 'feed-architect'
    }
  ],
  "ranking": [
    {
      phase: 'Ranking',
      subStep: 'algorithm',
      title: 'EdgeRank / Ranking',
      prompt: 'How do you order posts? Affinity * Weight * Time Decay. Machine Learning models used today.',
      inputType: 'textarea',
      placeholder: 'Explain ranking logic...'
    }
  ]
};


const GOOGLE_SEARCH_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Crawling, Indexing, Serving Search Results. Typeahead (separate problem).',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale Estimation',
      prompt: 'Billions of pages. Petabytes of data. QPS? Index size?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "indexing": [
    {
      phase: 'Indexing',
      subStep: 'crawling',
      title: 'Web Crawler',
      prompt: 'URL Frontier, BFS traversal, Politeness policy, DNS resolution.',
      inputType: 'textarea',
      placeholder: 'Explain crawling...'
    },
    {
      phase: 'Indexing',
      subStep: 'inverted-index',
      title: 'Inverted Index',
      prompt: 'How to map "keywords" -> "documents"? Build an index below.',
      inputType: 'textarea',
      placeholder: 'Build the index...',
      widgetId: 'inverted-index-visualizer'
    }
  ],
  "ranking": [
    {
      phase: 'Ranking',
      subStep: 'pagerank',
      title: 'PageRank Algorithm',
      prompt: 'Recursive algorithm based on incoming links. Scoring = Relevance + PageRank + Quality.',
      inputType: 'textarea',
      placeholder: 'Explain PageRank...'
    }
  ]
};

const DROPBOX_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Core Features',
      prompt: 'File Sync, Sharing, Versioning. Cross-device support.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: '1B files per day? Read heavy (sync) or Write heavy (backup)?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "sync-engine": [
    {
      phase: 'Sync Engine',
      subStep: 'chunking',
      title: 'Chunking & Deduplication',
      prompt: 'How to save bandwidth? Split files into fixed 4MB chunks. Hash them. Only upload new chunks.',
      inputType: 'textarea',
      placeholder: 'Observe savings...',
      widgetId: 'chunking-dedupe-demo'
    },
    {
      phase: 'Sync Engine',
      subStep: 'metadata',
      title: 'Metadata DB',
      prompt: 'Separate file metadata (Namespace/Path) from block data (S3). Why? ACID compliance.',
      inputType: 'textarea',
      placeholder: 'Explain metadata...'
    }
  ]
};

const RATE_LIMITER_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Throttle based on IP/User ID. Distributed environment. Low latency.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: '1M QPS? How much memory for counters?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "algorithms": [
    {
      phase: 'Algorithms',
      subStep: 'token-bucket',
      title: 'Token Bucket Algorithm',
      prompt: 'A bucket holds tokens. Each request consumes one. Refills at fixed rate. Visualize below.',
      inputType: 'textarea',
      placeholder: 'Interact with the limiter...',
      widgetId: 'rate-limiter-demo'
    },
    {
      phase: 'Algorithms',
      subStep: 'others',
      title: 'Other Algos',
      prompt: 'Leaky Bucket (Queue), Fixed Window (Spikes), Sliding Window Log (Expensive). Compare them.',
      inputType: 'textarea',
      placeholder: 'Comparisons...'
    }
  ],
  "distributed-cache": [
    {
      phase: 'Distributed State',
      subStep: 'redis',
      title: 'Redis & Lua Scripts',
      prompt: 'How to handle concurrency? Race conditions? Use Redis atomic counters or Lua scripts.',
      inputType: 'textarea',
      placeholder: 'Implementation details...'
    }
  ]
};

const DISTRIBUTED_CACHE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Fast KV access. Expiry (TTL). Eviction. Consistency models.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: 'TB of RAM? 100k QPS? Network bandwidth bottleneck?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "eviction": [
    {
      phase: 'Eviction Policy',
      subStep: 'lru',
      title: 'LRU Eviction',
      prompt: 'Least Recently Used policy is standard. When cache is full, remove the item accessed longest ago. Visualize below.',
      inputType: 'textarea',
      placeholder: 'Experiment with eviction...',
      widgetId: 'cache-visualizer'
    }
  ],
  "partitioning": [
    {
      phase: 'Partitioning',
      subStep: 'sharding',
      title: 'Sharding Strategy',
      prompt: 'Mod-N vs Consistent Hashing. How to add nodes without reshuffling all keys?',
      inputType: 'textarea',
      placeholder: 'Explain partitioning...'
    }
  ]
};

const TYPEAHEAD_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Suggest top 5 completions. Low latency (<100ms). Real-time updates?',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: 'Google search scale. Billions of distinct queries. Read query size?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "data-structure": [
    {
      phase: 'Data Structure',
      subStep: 'trie',
      title: 'Prefix Trie',
      prompt: 'A tree where each node is a character. Path from root = word. Visualize below.',
      inputType: 'textarea',
      placeholder: 'Build the trie...',
      widgetId: 'trie-visualizer'
    },
    {
      phase: 'Data Structure',
      subStep: 'optimization',
      title: 'Optimizations',
      prompt: 'Store top-k searches at each node? Typeahead on server vs client?',
      inputType: 'textarea',
      placeholder: 'Optimization techniques...'
    }
  ]
};

const UNIQUE_ID_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Unique, Sortable by time, 64-bit numeric (fit in long). Handling collisions?',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: '10k IDs/sec? Max datacenter count?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "implementation": [
    {
      phase: 'Implementation',
      subStep: 'snowflake',
      title: 'Snowflake Strategy',
      prompt: 'Twitter Snowflake uses 41-bit timestamp, 10-bit machine ID, 12-bit sequence. Visualize bit distribution below.',
      inputType: 'textarea',
      placeholder: 'Describe the bits...',
      widgetId: 'snowflake-demo'
    }
  ]
};

const LEADERBOARD_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Real-time score updates. Top 10 leaderboards globally and regionally. Get rank of any user.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: '10M DAU? 100k updates/sec? How to avoid locking the DB?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "data-structure": [
    {
      phase: 'Data Structure',
      subStep: 'redis-zset',
      title: 'Redis Sorted Set',
      prompt: 'Internal implementation uses Skip Lists. O(log N) for insert, update, rank lookup. Optimize for write-heavy loads.',
      inputType: 'textarea',
      placeholder: 'Explain ZSET...',
      widgetId: 'leaderboard-simulation'
    }
  ]
};

const NOTIFICATION_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Push vs Pull. iOS/Android/Email/SMS support. Delivery guarantees (At least once).',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: '10M notifications/minute? Latency requirements?',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "components": [
    {
      phase: 'Components',
      subStep: 'pub-sub',
      title: 'Pub/Sub Architecture',
      prompt: 'Decouple senders from receivers using Message Queues (Kafka/RabbitMQ). Workers process the queues. Visualize below.',
      inputType: 'textarea',
      placeholder: 'Describe the flow...',
      widgetId: 'notification-system-demo'
    }
  ]
};

const METRICS_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Data collection (Pull vs Push). Visualization (Grafana). Alerting.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale',
      prompt: 'Write-heavy. Billions of points/day using Time Series DB (InfluxDB/Prometheus). Downsampling.',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "aggregation": [
    {
      phase: 'Aggregation',
      subStep: 'rollup',
      title: 'Data Rollups',
      prompt: 'Raw high-frequency data is aggregated into lower-resolution blocks for long-term storage efficiency.',
      inputType: 'textarea',
      placeholder: 'Explain rollups...',
      widgetId: 'metrics-dashboard'
    }
  ]
};

const KEY_VALUE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Performance (low latency). Scalability (unlimited keys). Availability.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'cap',
      title: 'CAP Theorem',
      prompt: 'Consistency vs Availability vs Partition Tolerance. Choose CP or AP?',
      inputType: 'textarea',
      placeholder: 'Trade-offs...'
    }
  ],
  "partitioning": [
    {
      phase: 'Partitioning',
      subStep: 'consistent-hashing',
      title: 'Consistent Hashing',
      prompt: 'Distribute keys across a ring of servers to minimize re-mapping when nodes join/leave. Visualize the ring below.',
      inputType: 'textarea',
      placeholder: 'Explain the ring strategy...',
      widgetId: 'consistent-hashing-demo'
    }
  ]
};

const LOAD_BALANCER_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Distribute incoming traffic efficiently. Health checks to avoid dead servers. Session persistence (sticky sessions).',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'algorithms',
      title: 'Routing Algorithms',
      prompt: 'Round Robin, Least Connections, Random, IP Hash. Which one fits?',
      inputType: 'textarea',
      placeholder: 'Trade-offs...'
    }
  ],
  "routing": [
    {
      phase: 'Routing',
      subStep: 'simulation',
      title: 'Traffic Simulation',
      prompt: 'Visualize how various algorithms distribute requests to backend servers. Observe effect of Health Checks.',
      inputType: 'textarea',
      placeholder: 'Describe distribution...',
      widgetId: 'load-balancer-visualizer'
    }
  ]
};

const MESSAGE_QUEUE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Decouple producers/consumers. Ensure high throughput. Delivery semantics (At-least-once, Exactly-once).',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scalability',
      prompt: 'Partitioning topics enables parallel consumption. Order is guaranteed only within a partition.',
      inputType: 'textarea',
      placeholder: 'Explain partitioning...'
    }
  ],
  "partitioning": [
    {
      phase: 'Partitioning',
      subStep: 'consumer-groups',
      title: 'Topics & Groups',
      prompt: 'Producers write to partitions (Load Balanced). Consumer Groups allow scaling reads (one consumer per partition).',
      inputType: 'textarea',
      placeholder: 'Describe the flow...',
      widgetId: 'message-queue-visualizer'
    }
  ]
};

const CDN_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Reduce latency for static assets (images, js, css). Offload Origin servers. Global availability.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'caching',
      title: 'Caching Strategy',
      prompt: 'Push vs Pull. TTL (Time To Live). Cache Invalidation.',
      inputType: 'textarea',
      placeholder: 'Explain strategy...'
    }
  ],
  "geo-routing": [
    {
      phase: 'Geo Routing',
      subStep: 'map',
      title: 'Global Distribution',
      prompt: 'Users are routed to the nearest Edge Server (PoP). First request is slow (MISS), subsequent are fast (HIT).',
      inputType: 'textarea',
      placeholder: 'Observe latency...',
      widgetId: 'cdn-map'
    }
  ]
};

const WEB_CRAWLER_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Crawl entire web. Extract links. Store content. Politeness to servers.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'frontier',
      title: 'URL Frontier',
      prompt: 'Prioritization (PageRank) vs Freshness. How to schedule 10B URLs?',
      inputType: 'textarea',
      placeholder: 'Scheduling logic...',
    }
  ],
  "scheduler": [
    {
      phase: 'Scheduler',
      subStep: 'politeness',
      title: 'Politeness & Priority',
      prompt: 'Use separate queues for priorities. Ensure we don\'t hammer a single domain (Politeness Delay).',
      inputType: 'textarea',
      placeholder: 'Explain politeness...',
      widgetId: 'crawler-frontier'
    }
  ]
};

const DFS_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Store petabytes. Streaming access (write-once, read-many). Commodity hardware (Node failure is common).',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'blocks',
      title: 'Block Storage',
      prompt: 'Split files into large blocks (e.g., 64MB/128MB). Metadata (NameNode) vs Block Data (DataNodes).',
      inputType: 'textarea',
      placeholder: 'Explain architecture...'
    }
  ],
  "replication": [
    {
      phase: 'Replication',
      subStep: 'strategy',
      title: 'Rack Awareness',
      prompt: 'Replicate blocks 3x for fault tolerance. Policy: 1 local, 1 remote rack, 1 same remote rack.',
      inputType: 'textarea',
      placeholder: 'Observe replication...',
      widgetId: 'dfs-visualizer'
    }
  ]
};

const LEADER_ELECTION_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Single Leader coordinates writes. Followers replicate. High Availability (Auto-failover).',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'consensus',
      title: 'Consensus',
      prompt: 'Paxos vs Raft. Leader Heartbeats suppress new elections.',
      inputType: 'textarea',
      placeholder: 'Explain consensus...'
    }
  ],
  "election": [
    {
      phase: 'Election',
      subStep: 'raft',
      title: 'Raft Simulation',
      prompt: 'Nodes behave as Followers by default. If Leader dies (heartbeat timeout), they become Candidates.',
      inputType: 'textarea',
      placeholder: 'Observe election...',
      widgetId: 'leader-election-demo'
    }
  ]
};

const CONFIG_MGMT_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Centralized config. Dynamic updates (no restart). Versioning & Rollback.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'propagation',
      title: 'Propagation',
      prompt: 'Push (Watch) vs Pull (Poll). Consistency vs Latency.',
      inputType: 'textarea',
      placeholder: 'Explain tradeoffs...'
    }
  ],
  "update": [
    {
      phase: 'Update',
      subStep: 'rollout',
      title: 'Dynamic Rollout',
      prompt: 'Update a feature flag. Observe it propagating to services without restart. Rollback if needed.',
      inputType: 'textarea',
      placeholder: 'Observe rollout...',
      widgetId: 'config-propagator'
    }
  ]
};

const SECRET_MGMT_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Centralized storage. Encryption at rest & transit. Access leases (Rotation).',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Design',
      subStep: 'encryption',
      title: 'Envelope Encryption',
      prompt: 'DEK (Data Encryption Key) encrypted by KEK (Key Encryption Key).',
      inputType: 'textarea',
      placeholder: 'Explain encryption...'
    }
  ],
  "access": [
    {
      phase: 'Access Control',
      subStep: 'leasing',
      title: 'Secret Leasing',
      prompt: 'Apps request a temporary lease. If lease expires, access is revoked. Store a secret and request access.',
      inputType: 'textarea',
      placeholder: 'Observe leasing...',
      widgetId: 'secret-vault'
    }
  ]
};

const CICD_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Automated Build, Test, Deploy. Feedback loops. Rollbacks.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Pipeline Design',
      subStep: 'stages',
      title: 'Pipeline Stages',
      prompt: 'Commit -> Build (Artifact) -> Test (Unit/Integration) -> Deploy (Staging/Prod).',
      inputType: 'textarea',
      placeholder: 'Describe stages...'
    }
  ],
  "execution": [
    {
      phase: 'Execution',
      subStep: 'run',
      title: 'Run Pipeline',
      prompt: 'Trigger a build. Observe it passing through stages. Try simulating a test failure.',
      inputType: 'textarea',
      placeholder: 'Observe pipeline...',
      widgetId: 'pipeline-visualizer'
    }
  ]
};

const MICROSERVICES_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Decomposition by business capability. Decentralized data. Service Discovery.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Communication',
      subStep: 'patterns',
      title: 'Communication Patterns',
      prompt: 'Sync (REST/gRPC) vs Async (Events). Service Mesh (Sidecars) for observability.',
      inputType: 'textarea',
      placeholder: 'Explain communication...'
    }
  ],
  "tracing": [
    {
      phase: 'Observability',
      subStep: 'tracing',
      title: 'Distributed Tracing',
      prompt: 'Trace a request across multiple services. Visualize the path via Proxy Sidecars.',
      inputType: 'textarea',
      placeholder: 'Observe trace...',
      widgetId: 'service-mesh-viz'
    }
  ]
};

const GRAPHQL_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Flexible data fetching (Client-specified query). Single Endpoint. Strongly Typed Schema.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Schema Design',
      subStep: 'schema',
      title: 'Schema Definition (SDL)',
      prompt: 'Define Types (User, Post) and Root Query (getUser).',
      inputType: 'textarea',
      placeholder: 'type User { ... }'
    }
  ],
  "querying": [
    {
      phase: 'Query Execution',
      subStep: 'playground',
      title: 'Graph Playground',
      prompt: 'Construct a query by selecting fields. Execute to see JSON response. Notice no over-fetching.',
      inputType: 'textarea',
      placeholder: 'Run query...',
      widgetId: 'graphql-playground'
    }
  ]
};

const REST_API_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Resource-based URLs. Standard Methods (GET, POST, PUT, DELETE). Stateless.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Design',
      subStep: 'resources',
      title: 'Resource Design',
      prompt: 'Design endpoints: GET /users, POST /users, GET /users/{id}.',
      inputType: 'textarea',
      placeholder: 'List endpoints...'
    }
  ],
  "exploration": [
    {
      phase: 'Exploration',
      subStep: 'methods',
      title: 'REST Explorer',
      prompt: 'Interact with the API. Try GET to list, POST to create, and DELETE to remove. Observe status codes.',
      inputType: 'textarea',
      placeholder: 'Observe responses...',
      widgetId: 'rest-explorer'
    }
  ]
};

const WEBSOCKET_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Real-time, bidirectional, full-duplex. Persistent connection. Low latency.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Protocol',
      subStep: 'handshake',
      title: 'WebSocket Handshake',
      prompt: 'HTTP Upgrade header. Switching Protocols (101). Connection remains open.',
      inputType: 'textarea',
      placeholder: 'Describe handshake...'
    }
  ],
  "realtime": [
    {
      phase: 'Communication',
      subStep: 'pulse',
      title: 'Socket Pulse',
      prompt: 'Connect to the server. Send a message and wait for an echo. Watch for server-initiated pushes.',
      inputType: 'textarea',
      placeholder: 'Interact with socket...',
      widgetId: 'socket-pulse'
    }
  ]
};

export const COLLAB_EDITOR_STEPS: Record<string, StepData[]> = {
  'collaborative-editor-flow': [
    {
      phase: 'Requirements',
      subStep: 'Core Features',
      title: 'Real-time Constraints',
      prompt: 'For a smooth typing experience, what is the maximum acceptable latency for seeing your own keystrokes vs remote ones?',
      inputType: 'textarea',
      placeholder: 'e.g. 100ms',
    },
    {
      phase: 'Core Algorithm',
      subStep: 'Conflict Resolution',
      title: 'Operational Transformation',
      prompt: 'When two users edit the same document simultaneously, we need a way to merge their changes consistently without blocking.',
      inputType: 'textarea',
      placeholder: 'Experiment with the OT Visualizer below...',
      widgetId: 'ot-visualizer'
    }
  ]
};

export const AD_SERVING_STEPS: Record<string, StepData[]> = {
  'ad-serving-flow': [
    {
      phase: 'The Auction',
      subStep: 'Real-Time Bidding',
      title: 'The 100ms Auction',
      prompt: 'When a user loads a page, an auction runs instantly. How do we determine the winner and the price they pay?',
      inputType: 'textarea',
      placeholder: 'Simulate the auction below...',
      widgetId: 'rtb-simulator'
    }
  ]
};

export const FEED_STEPS: Record<string, StepData[]> = {
  'personalized-feed-flow': [
    {
      phase: 'Ranking',
      subStep: 'Scoring Algorithm',
      title: 'Feed Ranking',
      prompt: 'We have 1000 candidate posts. How do we order them for the user?',
      inputType: 'textarea',
      placeholder: 'Adjust weighting signals below...',
      widgetId: 'feed-ranker'
    }
  ]
};

export const COMPLIANCE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Immutability (Append-only). Access Controls. Search capabilities. Retention Policies.',
      inputType: 'list',
      placeholder: 'Features...'
    },
    {
      phase: 'Requirements',
      subStep: 'scale',
      title: 'Scale & Durability',
      prompt: 'High Write throughput. Low Read frequency (except during audits). 100% durability required.',
      inputType: 'textarea',
      placeholder: 'Estimates...'
    }
  ],
  "audit-trail": [
    {
      phase: 'Audit Trail',
      subStep: 'tamper-proof',
      title: 'Tamper Proofing',
      prompt: 'How to ensure logs aren\'t modified? Cryptographic chaining (Merkle Tree / Blockchain logic).',
      inputType: 'textarea',
      placeholder: 'Explain security model...',
      widgetId: 'audit-log-visualizer'
    }
  ]
};

const GDPR_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'GDPR Rights',
      prompt: 'Right to Access, Right to Rectification, Right to Erasure (RTBF). Data Portability.',
      inputType: 'list',
      placeholder: 'List rights...'
    }
  ],
  "deletion-flow": [
    {
      phase: 'Deletion Flow',
      subStep: 'orchestration',
      title: 'Right to Be Forgotten',
      prompt: 'How do you coordinate deletion across 50+ microservices and backups? Centralized Orchestrator?',
      inputType: 'textarea',
      placeholder: 'Explain the workflow...',
      widgetId: 'privacy-request-manager'
    }
  ]
};

const BLOCKCHAIN_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Core Concepts',
      prompt: 'Decentralization, Consensus (PoW/PoS), Ledger Immutability, Smart Contracts.',
      inputType: 'list',
      placeholder: 'Concepts...'
    }
  ],
  "mining": [
    {
      phase: 'Mining',
      subStep: 'pow',
      title: 'Proof of Work',
      prompt: 'Understand how blocks are mined. Finding a nonce such that Hash(Data + Nonce) < Target.',
      inputType: 'textarea',
      placeholder: 'Experiment with mining...',
      widgetId: 'blockchain-demo'
    }
  ]
};


export const VECTOR_DB_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'concepts',
      title: 'Vector Embeddings',
      prompt: 'How do we represent objects as vectors? Explain how similarity is calculated (Cosine/Euclidean).',
      inputType: 'textarea',
      placeholder: 'Explain embeddings...'
    }
  ],
  visualization: [
    {
      phase: 'Visualization',
      subStep: 'demo',
      title: 'Vector Space Visualizer',
      prompt: 'Explore the 2D vector space. Observe how the "Query Point" finds nearest neighbors using distance metrics.',
      inputType: 'textarea',
      widgetId: 'vector-db-visualizer',
      placeholder: 'Interact with the widget...'
    }
  ]
};

export const RAG_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'problem',
      title: 'The Hallucination Problem',
      prompt: 'LLMs lack private data. How does RAG bridge this gap?',
      inputType: 'textarea',
      placeholder: 'Define RAG...'
    }
  ],
  pipeline: [
    {
      phase: 'RAG Pipeline',
      subStep: 'simulation',
      title: 'RAG Architect',
      prompt: 'Simulate the Retrieval-Augmented Generation flow. Ask a question and watch the context retrieval.',
      inputType: 'textarea',
      widgetId: 'rag-architect',
      placeholder: 'Run the simulation...'
    }
  ]
};

export const AGENT_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'loop',
      title: 'The ReAct Loop',
      prompt: 'Explain the "Thought-Action-Observation" cycle allowing agents to use tools.',
      inputType: 'textarea',
      placeholder: 'Explain ReAct...'
    }
  ],
  orchestration: [
    {
      phase: 'Orchestration',
      subStep: 'demo',
      title: 'Agent Orchestrator',
      prompt: 'Watch the agent reason through a multi-step problem using the Calculator and Search tools.',
      inputType: 'textarea',
      widgetId: 'agent-orchestrator',
      placeholder: 'Start the agent...'
    }
  ]
};

const FEATURE_FLAG_STEPS: Record<string, StepData[]> = {
  'feature-flag-flow': [
    {
      phase: 'Requirements',
      subStep: 'Rollout Strategy',
      title: 'Gradual Rollout',
      prompt: 'We need to deploy a new feature to 5% of users to test for bugs. How do we ensure consistent experiences?',
      inputType: 'textarea',
      placeholder: 'Simulate rollout below...',
      widgetId: 'feature-toggle-demo'
    }
  ]
};

export const SERVICE_MESH_STEPS: Record<string, StepData[]> = {
  'service-mesh-flow': [
    {
      phase: 'Architecture',
      subStep: 'Sidecar Pattern',
      title: 'The Sidecar Pattern',
      prompt: 'To handle retries, timeouts, and mTLS without modifying app code, where do we place the logic?',
      inputType: 'textarea',
      placeholder: 'Visualize sidecars below...',
      widgetId: 'sidecar-visualizer'
    }
  ]
};

export const TRACING_STEPS: Record<string, StepData[]> = {
  'tracing-flow': [
    {
      phase: 'Observability',
      subStep: 'Span Visualization',
      title: 'Request Analyis',
      prompt: 'A user reports "Slow Checkout". How do we identify which microservice is the bottleneck?',
      inputType: 'textarea',
      placeholder: 'Analyze traces below...',
      widgetId: 'trace-waterfall'
    }
  ]
};

const TASK_SCHEDULER_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Distributed cron jobs. Dependency management (DAG). Retries & Alerts.',
      inputType: 'list',
      placeholder: 'Features...'
    }
  ],
  "scheduler-logic": [
    {
      phase: 'Scheduler',
      subStep: 'execution',
      title: 'Job Execution Flow',
      prompt: 'Visualize the Task execution flow. Workers pick up ready tasks. Scheduler manages dependencies (DAG).',
      inputType: 'textarea',
      placeholder: 'Run the scheduler...',
      widgetId: 'job-scheduler-viz'
    }
  ]
};

const FLASH_SALE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'High concurrency (1M active users). Limited inventory. No overselling allowed.',
      inputType: 'list',
      placeholder: 'Features...'
    }
  ],
  "concurrency": [
    {
      phase: 'Concurrency',
      subStep: 'race-conditions',
      title: 'Inventory Race Conditions',
      prompt: 'Simulate high concurrency. Without locking, inventory goes negative (overselling). With locking, it is safe but slower.',
      inputType: 'textarea',
      placeholder: 'Start the sale...',
      widgetId: 'flash-sale-demo'
    }
  ]
};

const PAYMENT_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Specs',
      prompt: 'Money transfer between accounts. ACID compliance. Idempotency (Exactly-once delivery).',
      inputType: 'list',
      placeholder: 'Features...'
    }
  ],
  "ledger": [
    {
      phase: 'Ledger',
      subStep: 'transaction',
      title: 'Double-Entry Ledger',
      prompt: 'Every transaction has a debit and credit. Idempotency keys prevent duplicate payments.',
      inputType: 'textarea',
      placeholder: 'Make a transfer...',
      widgetId: 'payment-ledger'
    }
  ]
};

export const PROBLEMS: SystemDesignProblem[] = [
  {
    id: '1',
    title: 'Design TinyURL',
    slug: 'design-tinyurl',
    description: 'A URL shortening service like bit.ly. Handle 100M redirects/day.',
    difficulty: 'Easy',
    category: 'Basics',
    companies: ['Amazon', 'Google'],
    requirements: ['Unique short codes', 'Analytics on clicks'],
    steps: TINYURL_STEPS
  },
  {
    id: '2',
    title: 'Design YouTube',
    slug: 'design-youtube',
    description: 'Video streaming platform with recommendations and real-time comments.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Netflix', 'YouTube'],
    requirements: ['Streaming at scale', 'Recommendations', 'Real-time features'],
    steps: YOUTUBE_STEPS
  },
  {
    id: '3',
    title: 'Design Twitter',
    slug: 'design-twitter',
    description: 'Real-time social media platform for tweets and follows.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Twitter', 'Meta'],
    requirements: ['Real-time feeds', 'Scalable writes', 'Timeline generation'],
    steps: TWITTER_STEPS
  },
  {
    id: '4',
    title: 'Design Instagram',
    slug: 'design-instagram',
    description: 'Photo sharing with stories and reels.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Meta', 'Snapchat'],
    requirements: ['Photo storage', 'Stories expiration', 'Reels algorithm'],
    steps: INSTAGRAM_STEPS
  },
  {
    id: '5',
    title: 'Design Uber',
    slug: 'design-uber',
    description: 'Ride-sharing with real-time matching and ETA.',
    difficulty: 'Hard',
    category: 'Core Services',
    companies: ['Uber', 'Lyft'],
    requirements: ['Real-time matching', 'ETA calculation', 'Payment processing'],
    steps: UBER_STEPS
  },
  {
    id: '6',
    title: 'Design Netflix',
    slug: 'design-netflix',
    description: 'Video streaming with personalized recommendations.',
    difficulty: 'Hard',
    category: 'Core Services',
    companies: ['Netflix', 'Amazon'],
    requirements: ['Content delivery', 'Recommendation engine', 'Offline viewing'],
    steps: NETFLIX_STEPS
  },
  {
    id: '7',
    title: 'Design WhatsApp',
    slug: 'design-whatsapp',
    description: 'Real-time messaging with end-to-end encryption.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Meta', 'Signal'],
    requirements: ['Real-time messaging', 'Encryption', 'Group chats'],
    steps: WHATSAPP_STEPS
  },
  {
    id: '8',
    title: 'Design Facebook News Feed',
    slug: 'design-facebook-news-feed',
    description: 'Algorithmic feed with posts from friends and pages.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Meta', 'LinkedIn'],
    requirements: ['Feed ranking', 'Scalable reads', 'Ad integration'],
    steps: FACEBOOK_STEPS
  },
  {
    id: '9',
    title: 'Design Google Search',
    slug: 'design-google-search',
    description: 'Web search with indexing and ranking.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Google', 'Bing'],
    requirements: ['Web crawling', 'Indexing', 'Page ranking'],
    steps: GOOGLE_SEARCH_STEPS
  },
  {
    id: '10',
    title: 'Design Dropbox',
    slug: 'design-dropbox',
    description: 'File storage and synchronization across devices.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Dropbox', 'Google Drive'],
    requirements: ['File sync', 'Versioning', 'Sharing'],
    steps: DROPBOX_STEPS
  },
  // Add more problems here to reach 100+
  // For brevity, adding a few more
  {
    id: '11',
    title: 'Design a Parking Lot System',
    slug: 'design-parking-lot',
    description: 'Automated parking with entry/exit management.',
    difficulty: 'Easy',
    category: 'Basics',
    companies: ['Local Systems'],
    requirements: ['Entry validation', 'Space allocation', 'Payment']
  },
  {
    id: '12',
    title: 'Design an Elevator System',
    slug: 'design-elevator-system',
    description: 'Multi-floor elevator control system.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Building Systems'],
    requirements: ['Request handling', 'Optimization', 'Safety']
  },
  {
    id: '13',
    title: 'Design a Distributed Cache (Redis-like)',
    slug: 'design-distributed-cache',
    description: 'In-memory data store with replication.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Redis Labs', 'Amazon'],
    requirements: ['Data partitioning', 'Replication', 'Consistency'],
    steps: DISTRIBUTED_CACHE_STEPS
  },
  {
    id: '14',
    title: 'Design a Typeahead Suggestion',
    slug: 'design-typeahead-suggestion',
    description: 'Autocomplete for search queries.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Google', 'Amazon'],
    requirements: ['Prefix matching', 'Ranking', 'Scalability'],
    steps: TYPEAHEAD_STEPS
  },
  {
    id: '15',
    title: 'Design a Unique ID Generator',
    slug: 'design-unique-id-generator',
    description: 'Generate unique IDs at scale.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: [],
    requirements: ['Uniqueness', 'Scalability', 'Distribution'],
    steps: UNIQUE_ID_STEPS
  },
  {
    id: '16',
    title: 'Design a Leaderboard',
    slug: 'design-leaderboard',
    description: 'Real-time ranking system.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Gaming', 'Sports'],
    requirements: ['Ranking updates', 'Real-time', 'Scalability'],
    steps: LEADERBOARD_STEPS
  },
  {
    id: '17',
    title: 'Design a Rate Limiter',
    slug: 'design-rate-limiter',
    description: 'Limit requests per user/time.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['API Providers'],
    requirements: ['Request tracking', 'Throttling', 'Distributed'],
    steps: RATE_LIMITER_STEPS
  },
  {
    id: '18',
    title: 'Design a Recommendation Engine',
    slug: 'design-recommendation-engine',
    description: 'Personalized content recommendations.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Netflix', 'Amazon'],
    requirements: ['User profiling', 'Content similarity', 'Real-time updates']
  },
  {
    id: '19',
    title: 'Design Fraud Detection System',
    slug: 'design-fraud-detection',
    description: 'Detect fraudulent transactions.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['PayPal', 'Stripe'],
    requirements: ['Pattern recognition', 'Real-time processing', 'False positives']
  },
  {
    id: '20',
    title: 'Design Personalized Search Ranking',
    slug: 'design-personalized-search',
    description: 'Search results tailored to user.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Google', 'Bing'],
    requirements: ['User intent', 'Personalization', 'A/B testing']
  },
  {
    id: '21',
    title: 'Design A/B Testing Framework',
    slug: 'design-ab-testing',
    description: 'Experimentation platform for features.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Google', 'Meta'],
    requirements: ['Traffic splitting', 'Statistical significance', 'Rollbacks']
  },
  {
    id: '22',
    title: 'Design a Notification System',
    slug: 'design-notification-system',
    description: 'Push notifications with scheduling.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Slack', 'Gmail'],
    requirements: ['Scheduling', 'Delivery guarantees', 'User preferences'],
    steps: NOTIFICATION_STEPS
  },
  {
    id: '23',
    title: 'Design a File Storage System',
    slug: 'design-file-storage',
    description: 'Cloud storage with versioning.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['AWS S3', 'Google Drive'],
    requirements: ['File operations', 'Versioning', 'Access control']
  },
  {
    id: '24',
    title: 'Design a Task Scheduler',
    slug: 'design-task-scheduler',
    description: 'Distributed job scheduling.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Airflow', 'Kubernetes'],
    requirements: ['Job dependencies', 'Fault tolerance', 'Scalability'],
    steps: TASK_SCHEDULER_STEPS
  },
  {
    id: '25',
    title: 'Design a Video Call System',
    slug: 'design-video-call',
    description: 'Real-time video conferencing.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Zoom', 'Google Meet'],
    requirements: ['Media streaming', 'Signaling', 'Quality adaptation']
  },
  {
    id: '26',
    title: 'Design a Logging System',
    slug: 'design-logging-system',
    description: 'Centralized log aggregation.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['ELK Stack', 'Splunk'],
    requirements: ['Log collection', 'Search', 'Alerting']
  },
  {
    id: '27',
    title: 'Design a Metrics Monitoring System',
    slug: 'design-metrics-monitoring',
    description: 'System metrics collection and visualization.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Prometheus', 'Grafana'],
    requirements: ['Data collection', 'Visualization', 'Alerting'],
    steps: METRICS_STEPS
  },
  {
    id: '28',
    title: 'Design a Key-Value Store',
    slug: 'design-key-value-store',
    description: 'Distributed key-value database.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Redis', 'DynamoDB'],
    requirements: ['Partitioning', 'Replication', 'Consistency'],
    steps: KEY_VALUE_STEPS
  },
  {
    id: '29',
    title: 'Design a Message Queue',
    slug: 'design-message-queue',
    description: 'Asynchronous message processing.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Kafka', 'RabbitMQ'],
    requirements: ['Publish-subscribe', 'Scalability', 'Durability'],
    steps: MESSAGE_QUEUE_STEPS
  },
  {
    id: '30',
    title: 'Design a Load Balancer',
    slug: 'design-load-balancer',
    description: 'Distribute traffic across servers.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['AWS ELB', 'NGINX'],
    requirements: ['Traffic distribution', 'Health checks', 'Scalability'],
    steps: LOAD_BALANCER_STEPS
  },
  {
    id: '31',
    title: 'Design a CDN',
    slug: 'design-cdn',
    description: 'Content delivery network.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Cloudflare', 'Akamai'],
    requirements: ['Edge caching', 'Global distribution', 'Performance'],
    steps: CDN_STEPS
  },
  {
    id: '32',
    title: 'Design a Web Crawler',
    slug: 'design-web-crawler',
    description: 'Crawl and index web pages.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Google', 'Bing'],
    requirements: ['URL frontier', 'Politeness', 'Scalability'],
    steps: WEB_CRAWLER_STEPS
  },
  {
    id: '33',
    title: 'Design a Distributed File System',
    slug: 'design-distributed-file-system',
    description: 'Store files across multiple nodes.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['HDFS', 'Ceph'],
    requirements: ['Replication', 'Fault tolerance', 'Scalability'],
    steps: DFS_STEPS
  },
  {
    id: '34',
    title: 'Design a Leader Election System',
    slug: 'design-leader-election-system',
    description: 'Elect a leader in distributed systems.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['ZooKeeper', 'etcd'],
    requirements: ['Consensus', 'Fault tolerance', 'Scalability'],
    steps: LEADER_ELECTION_STEPS
  },
  {
    id: '35',
    title: 'Design a Configuration Management System',
    slug: 'design-configuration-management-system',
    description: 'Manage application configurations.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Consul', 'Spring Cloud Config'],
    requirements: ['Versioning', 'Distribution', 'Security'],
    steps: CONFIG_MGMT_STEPS
  },
  {
    id: '36',
    title: 'Design a Secret Management System',
    slug: 'design-secret-management-system',
    description: 'Store and manage secrets securely.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Vault', 'AWS Secrets Manager'],
    requirements: ['Encryption', 'Access control', 'Rotation'],
    steps: SECRET_MGMT_STEPS
  },
  {
    id: '37',
    title: 'Design a CI/CD Pipeline',
    slug: 'design-ci-cd-pipeline',
    description: 'Continuous integration and deployment.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Jenkins', 'GitLab CI'],
    requirements: ['Automation', 'Testing', 'Deployment'],
    steps: CICD_STEPS
  },
  {
    id: '38',
    title: 'Design a Microservices Architecture',
    slug: 'design-microservices-architecture',
    description: 'Break down monolithic app into services.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Netflix', 'Uber'],
    requirements: ['Service discovery', 'Communication', 'Monitoring'],
    steps: MICROSERVICES_STEPS
  },
  {
    id: '39',
    title: 'Design a GraphQL API',
    slug: 'design-graphql-api',
    description: 'Flexible API with schema.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['GitHub', 'Shopify'],
    requirements: ['Schema design', 'Resolvers', 'Caching'],
    steps: GRAPHQL_STEPS
  },
  {
    id: '40',
    title: 'Design a REST API',
    slug: 'design-rest-api',
    description: 'RESTful web service.',
    difficulty: 'Easy',
    category: 'Basics',
    companies: ['Twitter', 'GitHub'],
    requirements: ['Resources', 'HTTP methods', 'Status codes'],
    steps: REST_API_STEPS
  },
  {
    id: '41',
    title: 'Design a WebSocket System',
    slug: 'design-websocket-system',
    description: 'Real-time bidirectional communication.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Slack', 'Discord'],
    requirements: ['Connection management', 'Scalability', 'Security'],
    steps: WEBSOCKET_STEPS
  },
  {
    id: '42',
    title: 'Design a Collaborative Editor',
    slug: 'design-collaborative-editor',
    description: 'Real-time document editing.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Google Docs', 'Notion'],
    requirements: ['Conflict resolution', 'Operational transform', 'Scalability'],
    steps: COLLAB_EDITOR_STEPS
  },
  {
    id: '43',
    title: 'Design an Ad Serving System',
    slug: 'design-ad-serving-system',
    description: 'Serve ads with targeting.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Google Ads', 'Meta Ads'],
    requirements: ['Targeting', 'Auction', 'Real-time bidding'],
    steps: AD_SERVING_STEPS
  },
  {
    id: '44',
    title: 'Design a Personalized Feed',
    slug: 'design-personalized-feed',
    description: 'Tailored content feed.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['TikTok', 'Instagram'],
    requirements: ['User modeling', 'Content ranking', 'Engagement'],
    steps: FEED_STEPS
  },
  {
    id: '45',
    title: 'Design a Feature Flag System',
    slug: 'design-feature-flag-system',
    description: 'Toggle features dynamically.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['LaunchDarkly', 'Split'],
    requirements: ['Dynamic toggles', 'Targeting', 'Monitoring'],
    steps: FEATURE_FLAG_STEPS
  },
  {
    id: '46',
    title: 'Design a Service Mesh',
    slug: 'design-service-mesh',
    description: 'Manage service-to-service communication.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Istio', 'Linkerd'],
    requirements: ['Traffic management', 'Observability', 'Security'],
    steps: SERVICE_MESH_STEPS
  },
  {
    id: '47',
    title: 'Design a Distributed Tracing System',
    slug: 'design-distributed-tracing-system',
    description: 'Trace requests across services.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Jaeger', 'Zipkin'],
    requirements: ['Span collection', 'Visualization', 'Performance'],
    steps: TRACING_STEPS
  },
  {
    id: '48',
    title: 'Design a Compliance Auditing System',
    slug: 'design-compliance-auditing-system',
    description: 'Audit for regulatory compliance.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Compliance tools'],
    requirements: ['Log auditing', 'Reporting', 'Alerts'],
    steps: COMPLIANCE_STEPS
  },
  {
    id: '49',
    title: 'Design a GDPR Compliant System',
    slug: 'design-gdpr-compliant-system',
    description: 'Data privacy and compliance.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['EU regulations'],
    requirements: ['Data minimization', 'Consent', 'Right to erasure'],
    steps: GDPR_STEPS
  },
  {
    id: '50',
    title: 'Design a Blockchain System',
    slug: 'design-blockchain-system',
    description: 'Decentralized ledger.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Bitcoin', 'Ethereum'],
    requirements: ['Consensus', 'Immutability', 'Scalability'],
    steps: BLOCKCHAIN_STEPS
  },
  {
    id: '51',
    title: 'Design an IoT Platform',
    slug: 'design-iot-platform',
    description: 'Manage Internet of Things devices.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['AWS IoT', 'Google IoT'],
    requirements: ['Device management', 'Data ingestion', 'Analytics']
  },
  {
    id: '52',
    title: 'Design an AR/VR System',
    slug: 'design-ar-vr-system',
    description: 'Augmented/Virtual reality platform.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Oculus', 'Magic Leap'],
    requirements: ['3D rendering', 'Tracking', 'Networking']
  },
  {
    id: '53',
    title: 'Design a Quantum Computing System',
    slug: 'design-quantum-computing-system',
    description: 'Harness quantum mechanics for computation.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['IBM Quantum', 'Google Quantum'],
    requirements: ['Qubits', 'Error correction', 'Algorithms']
  },
  {
    id: '54',
    title: 'Design a Metaverse Platform',
    slug: 'design-metaverse-platform',
    description: 'Virtual shared space.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Meta', 'Decentraland'],
    requirements: ['Virtual worlds', 'Avatars', 'Economy']
  },
  {
    id: '55',
    title: 'Design a Brain-Computer Interface',
    slug: 'design-brain-computer-interface',
    description: 'Direct brain-to-computer communication.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Neuralink', 'Kernel'],
    requirements: ['Signal processing', 'Safety', 'Privacy']
  },
  {
    id: '56',
    title: 'Design a Space Debris Tracking System',
    slug: 'design-space-debris-tracking-system',
    description: 'Track and manage space junk.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['NASA', 'ESA'],
    requirements: ['Orbital mechanics', 'Collision prediction', 'Mitigation']
  },
  {
    id: '57',
    title: 'Design a Personalized Learning Platform',
    slug: 'design-personalized-learning-platform',
    description: 'Adaptive education system.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Coursera', 'Khan Academy'],
    requirements: ['Learner modeling', 'Content adaptation', 'Assessment']
  },
  {
    id: '58',
    title: 'Design a Climate Model Simulator',
    slug: 'design-climate-model-simulator',
    description: 'Simulate climate change.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['NOAA', 'IPCC'],
    requirements: ['Data processing', 'Modeling', 'Visualization']
  },
  {
    id: '59',
    title: 'Design a Global Supply Chain Optimizer',
    slug: 'design-global-supply-chain-optimizer',
    description: 'Optimize logistics worldwide.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['DHL', 'Amazon'],
    requirements: ['Routing', 'Inventory', 'Risk management']
  },
  {
    id: '60',
    title: 'Design a Zero-Trust Network',
    slug: 'design-zero-trust-network',
    description: 'Security model with no implicit trust.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Google', 'Microsoft'],
    requirements: ['Identity verification', 'Micro-segmentation', 'Monitoring']
  },
  {
    id: '61',
    title: 'Design a Carbon Footprint Tracker',
    slug: 'design-carbon-footprint-tracker',
    description: 'Track environmental impact.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Green tech'],
    requirements: ['Data collection', 'Calculation', 'Reporting']
  },
  {
    id: '62',
    title: 'Design a Sustainable Data Center',
    slug: 'design-sustainable-data-center',
    description: 'Energy-efficient computing infrastructure.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Google', 'Microsoft'],
    requirements: ['Cooling', 'Renewable energy', 'Efficiency']
  },
  {
    id: '63',
    title: 'Design a Federated Learning System',
    slug: 'design-federated-learning-system',
    description: 'Train ML models without sharing data.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Google', 'Apple'],
    requirements: ['Privacy', 'Aggregation', 'Security']
  },
  {
    id: '64',
    title: 'Design an Explainable AI System',
    slug: 'design-explainable-ai-system',
    description: 'Make AI decisions interpretable.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['OpenAI', 'Google'],
    requirements: ['Model interpretability', 'Transparency', 'Trust']
  },
  {
    id: '65',
    title: 'Design a Vector Database',
    slug: 'design-vector-database',
    description: 'Store and query vector embeddings.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Pinecone', 'Weaviate'],
    requirements: ['Similarity search', 'Scalability', 'Indexing'],
    steps: VECTOR_DB_STEPS
  },
  {
    id: '66',
    title: 'Design a Multi-Modal Search Engine',
    slug: 'design-multi-modal-search-engine',
    description: 'Search across text, images, audio.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Google', 'Bing'],
    requirements: ['Feature extraction', 'Fusion', 'Ranking']
  },
  {
    id: '67',
    title: 'Design an Autonomous Agent Orchestrator',
    slug: 'design-autonomous-agent-orchestrator',
    description: 'Coordinate AI agents.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['OpenAI', 'Anthropic'],
    requirements: ['Task allocation', 'Communication', 'Safety'],
    steps: AGENT_STEPS
  },
  {
    id: '68',
    title: 'Design a Generative AI Content Moderator',
    slug: 'design-generative-ai-content-moderator',
    description: 'Moderate AI-generated content.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['OpenAI', 'Stability AI'],
    requirements: ['Content detection', 'Filtering', 'Feedback']
  },
  {
    id: '69',
    title: 'Design a RAG System',
    slug: 'design-rag-system',
    description: 'Retrieval-Augmented Generation.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['LangChain', 'Pinecone'],
    requirements: ['Retrieval', 'Generation', 'Integration'],
    steps: RAG_STEPS
  },
  {
    id: '70',
    title: 'Design a Conversational AI Platform',
    slug: 'design-conversational-ai-platform',
    description: 'Build chatbots and virtual assistants.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Dialogflow', 'Rasa'],
    requirements: ['NLP', 'Dialog management', 'Integration']
  },
  {
    id: '71',
    title: 'Design a Real-Time Analytics System',
    slug: 'design-real-time-analytics-system',
    description: 'Process and analyze streaming data.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Snowflake', 'Databricks'],
    requirements: ['Stream processing', 'Aggregation', 'Visualization']
  },
  {
    id: '72',
    title: 'Design a Data Lake',
    slug: 'design-data-lake',
    description: 'Store diverse data for analytics.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['AWS', 'Azure'],
    requirements: ['Data ingestion', 'Storage', 'Querying']
  },
  {
    id: '73',
    title: 'Design a Data Warehouse',
    slug: 'design-data-warehouse',
    description: 'Centralized data repository.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Redshift', 'BigQuery'],
    requirements: ['ETL', 'Schema design', 'Query optimization']
  },
  {
    id: '74',
    title: 'Design a ETL Pipeline',
    slug: 'design-etl-pipeline',
    description: 'Extract, Transform, Load data.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Talend', 'Informatica'],
    requirements: ['Data extraction', 'Transformation', 'Loading']
  },
  {
    id: '75',
    title: 'Design a Backup and Recovery System',
    slug: 'design-backup-recovery-system',
    description: 'Ensure data durability.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Veeam', 'Commvault'],
    requirements: ['Backup strategies', 'Recovery', 'Testing']
  },
  {
    id: '76',
    title: 'Design a Disaster Recovery System',
    slug: 'design-disaster-recovery-system',
    description: 'Recover from catastrophic failures.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['AWS DR', 'Azure DR'],
    requirements: ['Failover', 'Replication', 'Testing']
  },
  {
    id: '77',
    title: 'Design a High-Availability System',
    slug: 'design-high-availability-system',
    description: 'Minimize downtime.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Netflix', 'Amazon'],
    requirements: ['Redundancy', 'Failover', 'Monitoring']
  },
  {
    id: '78',
    title: 'Design a Scalable API Gateway',
    slug: 'design-scalable-api-gateway',
    description: 'Manage API traffic.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Kong', 'Apigee'],
    requirements: ['Routing', 'Authentication', 'Rate limiting']
  },
  {
    id: '79',
    title: 'Design a Event-Driven Architecture',
    slug: 'design-event-driven-architecture',
    description: 'Decouple services with events.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Eventbrite', 'Stripe'],
    requirements: ['Event sourcing', 'Pub/sub', 'Scalability']
  },
  {
    id: '80',
    title: 'Design a Saga Pattern Implementation',
    slug: 'design-saga-pattern-implementation',
    description: 'Manage distributed transactions.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Microservices patterns'],
    requirements: ['Compensation', 'Orchestration', 'Consistency']
  },
  {
    id: '81',
    title: 'Design a Circuit Breaker Pattern',
    slug: 'design-circuit-breaker-pattern',
    description: 'Prevent cascading failures.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Netflix Hystrix'],
    requirements: ['Failure detection', 'Fallback', 'Recovery']
  },
  {
    id: '82',
    title: 'Design a Strangler Fig Migration',
    slug: 'design-strangler-fig-migration',
    description: 'Migrate legacy systems incrementally.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Migration strategies'],
    requirements: ['Incremental migration', 'Compatibility', 'Testing']
  },
  {
    id: '83',
    title: 'Design a Blue-Green Deployment',
    slug: 'design-blue-green-deployment',
    description: 'Zero-downtime deployments.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Deployment strategies'],
    requirements: ['Environment switching', 'Rollback', 'Testing']
  },
  {
    id: '84',
    title: 'Design a Flash Sale System',
    slug: 'design-flash-sale-system',
    description: 'High concurrency ticket booking.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Ticketmaster', 'Amazon'],
    requirements: ['High concurrency', 'Inventory management', 'Fairness'],
    steps: FLASH_SALE_STEPS
  },
  {
    id: '85',
    title: 'Design a Payment System',
    slug: 'design-payment-system',
    description: 'Financial transaction processing.',
    difficulty: 'Hard',
    category: 'Core Services',
    companies: ['Stripe', 'PayPal'],
    requirements: ['ACID transactions', 'Idempotency', 'Reconciliation'],
    steps: PAYMENT_STEPS
  }
];