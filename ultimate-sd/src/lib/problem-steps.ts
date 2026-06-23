import { StepData } from '@/types';

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

const COLLAB_EDITOR_STEPS: Record<string, StepData[]> = {
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

const AD_SERVING_STEPS: Record<string, StepData[]> = {
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

const FEED_STEPS: Record<string, StepData[]> = {
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

const COMPLIANCE_STEPS: Record<string, StepData[]> = {
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


const VECTOR_DB_STEPS: Record<string, StepData[]> = {
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

const RAG_STEPS: Record<string, StepData[]> = {
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

const AGENT_STEPS: Record<string, StepData[]> = {
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

const SERVICE_MESH_STEPS: Record<string, StepData[]> = {
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

const TRACING_STEPS: Record<string, StepData[]> = {
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



const LRU_CACHE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'api',
      title: 'API Design',
      prompt: 'Define the API for the LRU Cache. What methods are required (e.g., get, put)? What are their expected time complexities?',
      inputType: 'textarea',
      placeholder: 'e.g., get(key): returns value, put(key, value): inserts or updates value...'
    }
  ],
  data_structures: [
    {
      phase: 'Data Structures',
      subStep: 'core',
      title: 'Core Data Structures',
      prompt: 'What data structures will you use to achieve O(1) time complexity for both get and put operations? Explain how they work together.',
      inputType: 'textarea',
      placeholder: 'e.g., Hash Map for O(1) lookups, Doubly Linked List for O(1) evictions...'
    }
  ],
  eviction: [
    {
      phase: 'Eviction',
      subStep: 'policy',
      title: 'Eviction Policy & Visualizer',
      prompt: 'Explain how the eviction process works when the cache reaches capacity. Try adding items in the visualizer to see it in action.',
      inputType: 'textarea',
      placeholder: 'e.g., When capacity is reached, remove the tail of the linked list and delete it from the hash map...',
      widgetId: 'CacheVisualizer'
    }
  ],
  concurrency: [
    {
      phase: 'Concurrency',
      subStep: 'thread_safety',
      title: 'Concurrency & Thread Safety',
      prompt: 'How would you make this LRU Cache thread-safe in a multi-threaded environment? Discuss locks, ReadWriteLocks, or concurrent data structures.',
      inputType: 'textarea',
      placeholder: 'e.g., Use a ReentrantReadWriteLock or partition the cache to reduce lock contention...'
    }
  ]
};


export const GENERIC_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Requirements',
      prompt: 'List the core features for your custom problem.',
      inputType: 'list',
      placeholder: 'e.g., User can do X...'
    },
    {
      phase: 'Requirements',
      subStep: 'non-functional',
      title: 'Scale & Constraints',
      prompt: 'Calculate the traffic (QPS), storage requirements, and list non-functional requirements.',
      inputType: 'textarea',
      placeholder: 'Do some back-of-the-envelope calculations...'
    }
  ],
  architecture: [
    {
      phase: 'Architecture',
      subStep: 'high-level',
      title: 'High-Level Design',
      prompt: 'Identify the core components and outline the high-level architecture.',
      inputType: 'textarea',
      placeholder: 'e.g., Client -> Load Balancer -> App Server -> DB...'
    }
  ],
  deep_dive: [
    {
      phase: 'Deep Dive',
      subStep: 'core_components',
      title: 'Core Components',
      prompt: 'Explain the internal logic and design of the critical components in your architecture.',
      inputType: 'textarea',
      placeholder: 'Explain data structures, algorithms, etc...'
    },
    {
      phase: 'Deep Dive',
      subStep: 'data_flow',
      title: 'Data Flow',
      prompt: 'Describe step-by-step how data flows through your system for a key operation.',
      inputType: 'textarea',
      placeholder: '1. User clicks... 2. Request goes to...'
    }
  ]
};

export const PROBLEM_STEPS: Record<string, Record<string, StepData[]>> = {
  'design-tinyurl': TINYURL_STEPS,
  'design-youtube': YOUTUBE_STEPS,
  'design-twitter': TWITTER_STEPS,
  'design-instagram': INSTAGRAM_STEPS,
  'design-uber': UBER_STEPS,
  'design-netflix': NETFLIX_STEPS,
  'design-whatsapp': WHATSAPP_STEPS,
  'design-facebook-news-feed': FACEBOOK_STEPS,
  'design-google-search': GOOGLE_SEARCH_STEPS,
  'design-dropbox': DROPBOX_STEPS,
  'design-distributed-cache': DISTRIBUTED_CACHE_STEPS,
  'design-typeahead-suggestion': TYPEAHEAD_STEPS,
  'design-unique-id-generator': UNIQUE_ID_STEPS,
  'design-leaderboard': LEADERBOARD_STEPS,
  'design-rate-limiter': RATE_LIMITER_STEPS,
  'design-notification-system': NOTIFICATION_STEPS,
  'design-metrics-monitoring': METRICS_STEPS,
  'design-key-value-store': KEY_VALUE_STEPS,
  'design-message-queue': MESSAGE_QUEUE_STEPS,
  'design-load-balancer': LOAD_BALANCER_STEPS,
  'design-cdn': CDN_STEPS,
  'design-web-crawler': WEB_CRAWLER_STEPS,
  'design-distributed-file-system': DFS_STEPS,
  'design-leader-election-system': LEADER_ELECTION_STEPS,
  'design-configuration-management-system': CONFIG_MGMT_STEPS,
  'design-secret-management-system': SECRET_MGMT_STEPS,
  'design-ci-cd-pipeline': CICD_STEPS,
  'design-microservices-architecture': MICROSERVICES_STEPS,
  'design-graphql-api': GRAPHQL_STEPS,
  'design-rest-api': REST_API_STEPS,
  'design-websocket-system': WEBSOCKET_STEPS,
  'design-collaborative-editor': COLLAB_EDITOR_STEPS,
  'design-ad-serving-system': AD_SERVING_STEPS,
  'design-personalized-feed': FEED_STEPS,
  'design-feature-flag-system': FEATURE_FLAG_STEPS,
  'design-service-mesh': SERVICE_MESH_STEPS,
  'design-distributed-tracing-system': TRACING_STEPS,
  'design-compliance-auditing-system': COMPLIANCE_STEPS,
  'design-gdpr-compliant-system': GDPR_STEPS,
  'design-blockchain-system': BLOCKCHAIN_STEPS,
  'design-vector-database': VECTOR_DB_STEPS,
  'design-autonomous-agent-orchestrator': AGENT_STEPS,
  'design-rag-system': RAG_STEPS,
  'design-task-scheduler': TASK_SCHEDULER_STEPS,
  'design-flash-sale-system': FLASH_SALE_STEPS,
  'design-payment-system': PAYMENT_STEPS,
  'design-lru-cache': LRU_CACHE_STEPS,
};

export function getStepsForProblem(slug: string): Record<string, StepData[]> | undefined {
  if (slug.startsWith('custom-')) {
    return GENERIC_STEPS;
  }
  return PROBLEM_STEPS[slug];
}
