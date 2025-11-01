import { SystemDesignProblem } from '@/types';

export const PROBLEMS: SystemDesignProblem[] = [
  {
    id: '1',
    title: 'Design TinyURL',
    slug: 'design-tinyurl',
    description: 'A URL shortening service like bit.ly. Handle 100M redirects/day.',
    difficulty: 'Easy',
    category: 'Basics',
    companies: ['Amazon', 'Google'],
    requirements: ['Unique short codes', 'Analytics on clicks']
  },
  {
    id: '2',
    title: 'Design YouTube',
    slug: 'design-youtube',
    description: 'Video streaming platform with recommendations and real-time comments.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Netflix', 'YouTube'],
    requirements: ['Streaming at scale', 'Recommendations', 'Real-time features']
  },
  {
    id: '3',
    title: 'Design Twitter',
    slug: 'design-twitter',
    description: 'Real-time social media platform for tweets and follows.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Twitter', 'Meta'],
    requirements: ['Real-time feeds', 'Scalable writes', 'Timeline generation']
  },
  {
    id: '4',
    title: 'Design Instagram',
    slug: 'design-instagram',
    description: 'Photo sharing with stories and reels.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Meta', 'Snapchat'],
    requirements: ['Photo storage', 'Stories expiration', 'Reels algorithm']
  },
  {
    id: '5',
    title: 'Design Uber',
    slug: 'design-uber',
    description: 'Ride-sharing with real-time matching and ETA.',
    difficulty: 'Hard',
    category: 'Core Services',
    companies: ['Uber', 'Lyft'],
    requirements: ['Real-time matching', 'ETA calculation', 'Payment processing']
  },
  {
    id: '6',
    title: 'Design Netflix',
    slug: 'design-netflix',
    description: 'Video streaming with personalized recommendations.',
    difficulty: 'Hard',
    category: 'Core Services',
    companies: ['Netflix', 'Amazon'],
    requirements: ['Content delivery', 'Recommendation engine', 'Offline viewing']
  },
  {
    id: '7',
    title: 'Design WhatsApp',
    slug: 'design-whatsapp',
    description: 'Real-time messaging with end-to-end encryption.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Meta', 'Signal'],
    requirements: ['Real-time messaging', 'Encryption', 'Group chats']
  },
  {
    id: '8',
    title: 'Design Facebook News Feed',
    slug: 'design-facebook-news-feed',
    description: 'Algorithmic feed with posts from friends and pages.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Meta', 'LinkedIn'],
    requirements: ['Feed ranking', 'Scalable reads', 'Ad integration']
  },
  {
    id: '9',
    title: 'Design Google Search',
    slug: 'design-google-search',
    description: 'Web search with indexing and ranking.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Google', 'Bing'],
    requirements: ['Web crawling', 'Indexing', 'Page ranking']
  },
  {
    id: '10',
    title: 'Design Dropbox',
    slug: 'design-dropbox',
    description: 'File storage and synchronization across devices.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Dropbox', 'Google Drive'],
    requirements: ['File sync', 'Versioning', 'Sharing']
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
    requirements: ['Data partitioning', 'Replication', 'Consistency']
  },
  {
    id: '14',
    title: 'Design a Typeahead Suggestion',
    slug: 'design-typeahead-suggestion',
    description: 'Autocomplete for search queries.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Google', 'Amazon'],
    requirements: ['Prefix matching', 'Ranking', 'Scalability']
  },
  {
    id: '15',
    title: 'Design a Chat System',
    slug: 'design-chat-system',
    description: 'Real-time chat with multiple rooms.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Slack', 'Discord'],
    requirements: ['Real-time delivery', 'Persistence', 'User management']
  },
  {
    id: '16',
    title: 'Design a News Feed',
    slug: 'design-news-feed',
    description: 'Aggregated content feed with personalization.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Meta', 'Reddit'],
    requirements: ['Content aggregation', 'Personalization', 'Real-time updates']
  },
  {
    id: '17',
    title: 'Design a Unique ID Generator',
    slug: 'design-unique-id-generator',
    description: 'Generate unique IDs at scale.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: [],
    requirements: ['Uniqueness', 'Scalability', 'Distribution']
  },
  {
    id: '18',
    title: 'Design a Leaderboard',
    slug: 'design-leaderboard',
    description: 'Real-time ranking system.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Gaming', 'Sports'],
    requirements: ['Ranking updates', 'Real-time', 'Scalability']
  },
  {
    id: '19',
    title: 'Design a Rate Limiter',
    slug: 'design-rate-limiter',
    description: 'Limit requests per user/time.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['API Providers'],
    requirements: ['Request tracking', 'Throttling', 'Distributed']
  },
  {
    id: '20',
    title: 'Design an API Rate Limiter',
    slug: 'design-api-rate-limiter',
    description: 'Rate limiting for APIs.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Stripe', 'Twilio'],
    requirements: ['Per-user limits', 'Sliding window', 'Caching']
  },
  {
    id: '21',
    title: 'Design a Recommendation Engine',
    slug: 'design-recommendation-engine',
    description: 'Personalized content recommendations.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Netflix', 'Amazon'],
    requirements: ['User profiling', 'Content similarity', 'Real-time updates']
  },
  {
    id: '22',
    title: 'Design Fraud Detection System',
    slug: 'design-fraud-detection',
    description: 'Detect fraudulent transactions.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['PayPal', 'Stripe'],
    requirements: ['Pattern recognition', 'Real-time processing', 'False positives']
  },
  {
    id: '23',
    title: 'Design Personalized Search Ranking',
    slug: 'design-personalized-search',
    description: 'Search results tailored to user.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Google', 'Bing'],
    requirements: ['User intent', 'Personalization', 'A/B testing']
  },
  {
    id: '24',
    title: 'Design A/B Testing Framework',
    slug: 'design-ab-testing',
    description: 'Experimentation platform for features.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Google', 'Meta'],
    requirements: ['Traffic splitting', 'Statistical significance', 'Rollbacks']
  },
  {
    id: '25',
    title: 'Design a Notification System',
    slug: 'design-notification-system',
    description: 'Push notifications with scheduling.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Slack', 'Gmail'],
    requirements: ['Scheduling', 'Delivery guarantees', 'User preferences']
  },
  {
    id: '26',
    title: 'Design a File Storage System',
    slug: 'design-file-storage',
    description: 'Cloud storage with versioning.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['AWS S3', 'Google Drive'],
    requirements: ['File operations', 'Versioning', 'Access control']
  },
  {
    id: '27',
    title: 'Design a Task Scheduler',
    slug: 'design-task-scheduler',
    description: 'Distributed job scheduling.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Airflow', 'Kubernetes'],
    requirements: ['Job dependencies', 'Fault tolerance', 'Scalability']
  },
  {
    id: '28',
    title: 'Design a Video Call System',
    slug: 'design-video-call',
    description: 'Real-time video conferencing.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Zoom', 'Google Meet'],
    requirements: ['Media streaming', 'Signaling', 'Quality adaptation']
  },
  {
    id: '29',
    title: 'Design a Logging System',
    slug: 'design-logging-system',
    description: 'Centralized log aggregation.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['ELK Stack', 'Splunk'],
    requirements: ['Log collection', 'Search', 'Alerting']
  },
  {
    id: '30',
    title: 'Design a Metrics Monitoring System',
    slug: 'design-metrics-monitoring',
    description: 'System metrics collection and visualization.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Prometheus', 'Grafana'],
    requirements: ['Data collection', 'Visualization', 'Alerting']
  },
  // Add more as needed to reach 100
  {
    id: '31',
    title: 'Design a Video Streaming Service',
    slug: 'design-video-streaming-service',
    description: 'Build a platform for streaming videos with adaptive bitrate.',
    difficulty: 'Hard',
    category: 'Core Services',
    companies: ['Netflix', 'YouTube'],
    requirements: ['Adaptive streaming', 'CDN integration', 'Content protection']
  },
  {
    id: '32',
    title: 'Design a Social Media Feed',
    slug: 'design-social-media-feed',
    description: 'Algorithmic feed for posts from connections.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Meta', 'Twitter'],
    requirements: ['Feed ranking', 'Real-time updates', 'Scalable reads']
  },
  {
    id: '33',
    title: 'Design a Search Engine',
    slug: 'design-search-engine',
    description: 'Web search with indexing and relevance.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Google', 'Bing'],
    requirements: ['Crawling', 'Indexing', 'Ranking algorithm']
  },
  {
    id: '34',
    title: 'Design a File Storage System',
    slug: 'design-file-storage-system',
    description: 'Cloud storage with sync and sharing.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Dropbox', 'Google Drive'],
    requirements: ['File operations', 'Sync', 'Access control']
  },
  {
    id: '35',
    title: 'Design a Task Scheduler',
    slug: 'design-task-scheduler',
    description: 'Distributed job scheduling system.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Airflow', 'Kubernetes'],
    requirements: ['Job dependencies', 'Fault tolerance', 'Scalability']
  },
  {
    id: '36',
    title: 'Design a Video Call System',
    slug: 'design-video-call-system',
    description: 'Real-time video conferencing.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Zoom', 'Google Meet'],
    requirements: ['Media streaming', 'Signaling', 'Quality adaptation']
  },
  {
    id: '37',
    title: 'Design a Logging System',
    slug: 'design-logging-system',
    description: 'Centralized log aggregation.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['ELK Stack', 'Splunk'],
    requirements: ['Log collection', 'Search', 'Alerting']
  },
  {
    id: '38',
    title: 'Design a Metrics Monitoring System',
    slug: 'design-metrics-monitoring-system',
    description: 'System metrics collection and visualization.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Prometheus', 'Grafana'],
    requirements: ['Data collection', 'Visualization', 'Alerting']
  },
  {
    id: '39',
    title: 'Design a Notification Service',
    slug: 'design-notification-service',
    description: 'Push notifications with scheduling.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Slack', 'Gmail'],
    requirements: ['Scheduling', 'Delivery guarantees', 'User preferences']
  },
  {
    id: '40',
    title: 'Design a URL Shortener',
    slug: 'design-url-shortener',
    description: 'Shorten URLs with analytics.',
    difficulty: 'Easy',
    category: 'Basics',
    companies: ['Bitly', 'TinyURL'],
    requirements: ['Unique codes', 'Redirects', 'Analytics']
  },
  {
    id: '41',
    title: 'Design a Key-Value Store',
    slug: 'design-key-value-store',
    description: 'Distributed key-value database.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Redis', 'DynamoDB'],
    requirements: ['Partitioning', 'Replication', 'Consistency']
  },
  {
    id: '42',
    title: 'Design a Message Queue',
    slug: 'design-message-queue',
    description: 'Asynchronous message processing.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Kafka', 'RabbitMQ'],
    requirements: ['Publish-subscribe', 'Scalability', 'Durability']
  },
  {
    id: '43',
    title: 'Design a Load Balancer',
    slug: 'design-load-balancer',
    description: 'Distribute traffic across servers.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['AWS ELB', 'NGINX'],
    requirements: ['Traffic distribution', 'Health checks', 'Scalability']
  },
  {
    id: '44',
    title: 'Design a CDN',
    slug: 'design-cdn',
    description: 'Content delivery network.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Cloudflare', 'Akamai'],
    requirements: ['Edge caching', 'Global distribution', 'Performance']
  },
  {
    id: '45',
    title: 'Design a Web Crawler',
    slug: 'design-web-crawler',
    description: 'Crawl and index web pages.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Google', 'Bing'],
    requirements: ['URL frontier', 'Politeness', 'Scalability']
  },
  {
    id: '46',
    title: 'Design a Distributed File System',
    slug: 'design-distributed-file-system',
    description: 'Store files across multiple nodes.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['HDFS', 'Ceph'],
    requirements: ['Replication', 'Fault tolerance', 'Scalability']
  },
  {
    id: '47',
    title: 'Design a Rate Limiting System',
    slug: 'design-rate-limiting-system',
    description: 'Limit requests per user/time.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Stripe', 'Twilio'],
    requirements: ['Request tracking', 'Throttling', 'Distributed']
  },
  {
    id: '48',
    title: 'Design a Leader Election System',
    slug: 'design-leader-election-system',
    description: 'Elect a leader in distributed systems.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['ZooKeeper', 'etcd'],
    requirements: ['Consensus', 'Fault tolerance', 'Scalability']
  },
  {
    id: '49',
    title: 'Design a Configuration Management System',
    slug: 'design-configuration-management-system',
    description: 'Manage application configurations.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Consul', 'Spring Cloud Config'],
    requirements: ['Versioning', 'Distribution', 'Security']
  },
  {
    id: '50',
    title: 'Design a Secret Management System',
    slug: 'design-secret-management-system',
    description: 'Store and manage secrets securely.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Vault', 'AWS Secrets Manager'],
    requirements: ['Encryption', 'Access control', 'Rotation']
  },
  {
    id: '51',
    title: 'Design a CI/CD Pipeline',
    slug: 'design-ci-cd-pipeline',
    description: 'Continuous integration and deployment.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Jenkins', 'GitLab CI'],
    requirements: ['Automation', 'Testing', 'Deployment']
  },
  {
    id: '52',
    title: 'Design a Microservices Architecture',
    slug: 'design-microservices-architecture',
    description: 'Break down monolithic app into services.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Netflix', 'Uber'],
    requirements: ['Service discovery', 'Communication', 'Monitoring']
  },
  {
    id: '53',
    title: 'Design a GraphQL API',
    slug: 'design-graphql-api',
    description: 'Flexible API with schema.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['GitHub', 'Shopify'],
    requirements: ['Schema design', 'Resolvers', 'Caching']
  },
  {
    id: '54',
    title: 'Design a REST API',
    slug: 'design-rest-api',
    description: 'RESTful web service.',
    difficulty: 'Easy',
    category: 'Basics',
    companies: ['Twitter', 'GitHub'],
    requirements: ['Resources', 'HTTP methods', 'Status codes']
  },
  {
    id: '55',
    title: 'Design a WebSocket System',
    slug: 'design-websocket-system',
    description: 'Real-time bidirectional communication.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Slack', 'Discord'],
    requirements: ['Connection management', 'Scalability', 'Security']
  },
  {
    id: '56',
    title: 'Design a Collaborative Editor',
    slug: 'design-collaborative-editor',
    description: 'Real-time document editing.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Google Docs', 'Notion'],
    requirements: ['Conflict resolution', 'Operational transform', 'Scalability']
  },
  {
    id: '57',
    title: 'Design a Recommendation System',
    slug: 'design-recommendation-system',
    description: 'Personalized content recommendations.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Netflix', 'Amazon'],
    requirements: ['User profiling', 'Similarity', 'Real-time']
  },
  {
    id: '58',
    title: 'Design a Fraud Detection System',
    slug: 'design-fraud-detection-system',
    description: 'Detect fraudulent activities.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['PayPal', 'Stripe'],
    requirements: ['Pattern recognition', 'Real-time processing', 'Accuracy']
  },
  {
    id: '59',
    title: 'Design an Ad Serving System',
    slug: 'design-ad-serving-system',
    description: 'Serve ads with targeting.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Google Ads', 'Meta Ads'],
    requirements: ['Targeting', 'Auction', 'Real-time bidding']
  },
  {
    id: '60',
    title: 'Design a Personalized Feed',
    slug: 'design-personalized-feed',
    description: 'Tailored content feed.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['TikTok', 'Instagram'],
    requirements: ['User modeling', 'Content ranking', 'Engagement']
  },
  {
    id: '61',
    title: 'Design an A/B Testing Platform',
    slug: 'design-ab-testing-platform',
    description: 'Experimentation framework.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Optimizely', 'Google Optimize'],
    requirements: ['Traffic splitting', 'Statistics', 'Rollbacks']
  },
  {
    id: '62',
    title: 'Design a Feature Flag System',
    slug: 'design-feature-flag-system',
    description: 'Toggle features dynamically.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['LaunchDarkly', 'Split'],
    requirements: ['Dynamic toggles', 'Targeting', 'Monitoring']
  },
  {
    id: '63',
    title: 'Design a Service Mesh',
    slug: 'design-service-mesh',
    description: 'Manage service-to-service communication.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Istio', 'Linkerd'],
    requirements: ['Traffic management', 'Observability', 'Security']
  },
  {
    id: '64',
    title: 'Design a Distributed Tracing System',
    slug: 'design-distributed-tracing-system',
    description: 'Trace requests across services.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Jaeger', 'Zipkin'],
    requirements: ['Span collection', 'Visualization', 'Performance']
  },
  {
    id: '65',
    title: 'Design a Compliance Auditing System',
    slug: 'design-compliance-auditing-system',
    description: 'Audit for regulatory compliance.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Compliance tools'],
    requirements: ['Log auditing', 'Reporting', 'Alerts']
  },
  {
    id: '66',
    title: 'Design a GDPR Compliant System',
    slug: 'design-gdpr-compliant-system',
    description: 'Data privacy and compliance.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['EU regulations'],
    requirements: ['Data minimization', 'Consent', 'Right to erasure']
  },
  {
    id: '67',
    title: 'Design a Blockchain System',
    slug: 'design-blockchain-system',
    description: 'Decentralized ledger.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Bitcoin', 'Ethereum'],
    requirements: ['Consensus', 'Immutability', 'Scalability']
  },
  {
    id: '68',
    title: 'Design an IoT Platform',
    slug: 'design-iot-platform',
    description: 'Manage Internet of Things devices.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['AWS IoT', 'Google IoT'],
    requirements: ['Device management', 'Data ingestion', 'Analytics']
  },
  {
    id: '69',
    title: 'Design an AR/VR System',
    slug: 'design-ar-vr-system',
    description: 'Augmented/Virtual reality platform.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Oculus', 'Magic Leap'],
    requirements: ['3D rendering', 'Tracking', 'Networking']
  },
  {
    id: '70',
    title: 'Design a Quantum Computing System',
    slug: 'design-quantum-computing-system',
    description: 'Harness quantum mechanics for computation.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['IBM Quantum', 'Google Quantum'],
    requirements: ['Qubits', 'Error correction', 'Algorithms']
  },
  {
    id: '71',
    title: 'Design a Metaverse Platform',
    slug: 'design-metaverse-platform',
    description: 'Virtual shared space.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Meta', 'Decentraland'],
    requirements: ['Virtual worlds', 'Avatars', 'Economy']
  },
  {
    id: '72',
    title: 'Design a Brain-Computer Interface',
    slug: 'design-brain-computer-interface',
    description: 'Direct brain-to-computer communication.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Neuralink', 'Kernel'],
    requirements: ['Signal processing', 'Safety', 'Privacy']
  },
  {
    id: '73',
    title: 'Design a Space Debris Tracking System',
    slug: 'design-space-debris-tracking-system',
    description: 'Track and manage space junk.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['NASA', 'ESA'],
    requirements: ['Orbital mechanics', 'Collision prediction', 'Mitigation']
  },
  {
    id: '74',
    title: 'Design a Personalized Learning Platform',
    slug: 'design-personalized-learning-platform',
    description: 'Adaptive education system.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Coursera', 'Khan Academy'],
    requirements: ['Learner modeling', 'Content adaptation', 'Assessment']
  },
  {
    id: '75',
    title: 'Design a Climate Model Simulator',
    slug: 'design-climate-model-simulator',
    description: 'Simulate climate change.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['NOAA', 'IPCC'],
    requirements: ['Data processing', 'Modeling', 'Visualization']
  },
  {
    id: '76',
    title: 'Design a Global Supply Chain Optimizer',
    slug: 'design-global-supply-chain-optimizer',
    description: 'Optimize logistics worldwide.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['DHL', 'Amazon'],
    requirements: ['Routing', 'Inventory', 'Risk management']
  },
  {
    id: '77',
    title: 'Design a Zero-Trust Network',
    slug: 'design-zero-trust-network',
    description: 'Security model with no implicit trust.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Google', 'Microsoft'],
    requirements: ['Identity verification', 'Micro-segmentation', 'Monitoring']
  },
  {
    id: '78',
    title: 'Design a Carbon Footprint Tracker',
    slug: 'design-carbon-footprint-tracker',
    description: 'Track environmental impact.',
    difficulty: 'Medium',
    category: 'Edge Cases',
    companies: ['Green tech'],
    requirements: ['Data collection', 'Calculation', 'Reporting']
  },
  {
    id: '79',
    title: 'Design a Sustainable Data Center',
    slug: 'design-sustainable-data-center',
    description: 'Energy-efficient computing infrastructure.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Google', 'Microsoft'],
    requirements: ['Cooling', 'Renewable energy', 'Efficiency']
  },
  {
    id: '80',
    title: 'Design a Federated Learning System',
    slug: 'design-federated-learning-system',
    description: 'Train ML models without sharing data.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Google', 'Apple'],
    requirements: ['Privacy', 'Aggregation', 'Security']
  },
  {
    id: '81',
    title: 'Design an Explainable AI System',
    slug: 'design-explainable-ai-system',
    description: 'Make AI decisions interpretable.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['OpenAI', 'Google'],
    requirements: ['Model interpretability', 'Transparency', 'Trust']
  },
  {
    id: '82',
    title: 'Design a Vector Database',
    slug: 'design-vector-database',
    description: 'Store and query vector embeddings.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Pinecone', 'Weaviate'],
    requirements: ['Similarity search', 'Scalability', 'Indexing']
  },
  {
    id: '83',
    title: 'Design a Multi-Modal Search Engine',
    slug: 'design-multi-modal-search-engine',
    description: 'Search across text, images, audio.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Google', 'Bing'],
    requirements: ['Feature extraction', 'Fusion', 'Ranking']
  },
  {
    id: '84',
    title: 'Design an Autonomous Agent Orchestrator',
    slug: 'design-autonomous-agent-orchestrator',
    description: 'Coordinate AI agents.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['OpenAI', 'Anthropic'],
    requirements: ['Task allocation', 'Communication', 'Safety']
  },
  {
    id: '85',
    title: 'Design a Generative AI Content Moderator',
    slug: 'design-generative-ai-content-moderator',
    description: 'Moderate AI-generated content.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['OpenAI', 'Stability AI'],
    requirements: ['Content detection', 'Filtering', 'Feedback']
  },
  {
    id: '86',
    title: 'Design a RAG System',
    slug: 'design-rag-system',
    description: 'Retrieval-Augmented Generation.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['LangChain', 'Pinecone'],
    requirements: ['Retrieval', 'Generation', 'Integration']
  },
  {
    id: '87',
    title: 'Design a Conversational AI Platform',
    slug: 'design-conversational-ai-platform',
    description: 'Build chatbots and virtual assistants.',
    difficulty: 'Hard',
    category: 'ML-Infused',
    companies: ['Dialogflow', 'Rasa'],
    requirements: ['NLP', 'Dialog management', 'Integration']
  },
  {
    id: '88',
    title: 'Design a Real-Time Analytics System',
    slug: 'design-real-time-analytics-system',
    description: 'Process and analyze streaming data.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Snowflake', 'Databricks'],
    requirements: ['Stream processing', 'Aggregation', 'Visualization']
  },
  {
    id: '89',
    title: 'Design a Data Lake',
    slug: 'design-data-lake',
    description: 'Store diverse data for analytics.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['AWS', 'Azure'],
    requirements: ['Data ingestion', 'Storage', 'Querying']
  },
  {
    id: '90',
    title: 'Design a Data Warehouse',
    slug: 'design-data-warehouse',
    description: 'Centralized data repository.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Redshift', 'BigQuery'],
    requirements: ['ETL', 'Schema design', 'Query optimization']
  },
  {
    id: '91',
    title: 'Design a ETL Pipeline',
    slug: 'design-etl-pipeline',
    description: 'Extract, Transform, Load data.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Talend', 'Informatica'],
    requirements: ['Data extraction', 'Transformation', 'Loading']
  },
  {
    id: '92',
    title: 'Design a Backup and Recovery System',
    slug: 'design-backup-recovery-system',
    description: 'Ensure data durability.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Veeam', 'Commvault'],
    requirements: ['Backup strategies', 'Recovery', 'Testing']
  },
  {
    id: '93',
    title: 'Design a Disaster Recovery System',
    slug: 'design-disaster-recovery-system',
    description: 'Recover from catastrophic failures.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['AWS DR', 'Azure DR'],
    requirements: ['Failover', 'Replication', 'Testing']
  },
  {
    id: '94',
    title: 'Design a High-Availability System',
    slug: 'design-high-availability-system',
    description: 'Minimize downtime.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Netflix', 'Amazon'],
    requirements: ['Redundancy', 'Failover', 'Monitoring']
  },
  {
    id: '95',
    title: 'Design a Scalable API Gateway',
    slug: 'design-scalable-api-gateway',
    description: 'Manage API traffic.',
    difficulty: 'Medium',
    category: 'Core Services',
    companies: ['Kong', 'Apigee'],
    requirements: ['Routing', 'Authentication', 'Rate limiting']
  },
  {
    id: '96',
    title: 'Design a Event-Driven Architecture',
    slug: 'design-event-driven-architecture',
    description: 'Decouple services with events.',
    difficulty: 'Medium',
    category: 'Advanced',
    companies: ['Eventbrite', 'Stripe'],
    requirements: ['Event sourcing', 'Pub/sub', 'Scalability']
  },
  {
    id: '97',
    title: 'Design a Saga Pattern Implementation',
    slug: 'design-saga-pattern-implementation',
    description: 'Manage distributed transactions.',
    difficulty: 'Hard',
    category: 'Advanced',
    companies: ['Microservices patterns'],
    requirements: ['Compensation', 'Orchestration', 'Consistency']
  },
  {
    id: '98',
    title: 'Design a Circuit Breaker Pattern',
    slug: 'design-circuit-breaker-pattern',
    description: 'Prevent cascading failures.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Netflix Hystrix'],
    requirements: ['Failure detection', 'Fallback', 'Recovery']
  },
  {
    id: '99',
    title: 'Design a Strangler Fig Migration',
    slug: 'design-strangler-fig-migration',
    description: 'Migrate legacy systems incrementally.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Migration strategies'],
    requirements: ['Incremental migration', 'Compatibility', 'Testing']
  },
  {
    id: '100',
    title: 'Design a Blue-Green Deployment',
    slug: 'design-blue-green-deployment',
    description: 'Zero-downtime deployments.',
    difficulty: 'Medium',
    category: 'Basics',
    companies: ['Deployment strategies'],
    requirements: ['Environment switching', 'Rollback', 'Testing']
  }
];