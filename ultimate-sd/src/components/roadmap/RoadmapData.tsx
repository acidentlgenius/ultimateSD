import { RoadmapPhase, TrackInfo } from './RoadmapTypes';
import {
    Layout,
    Server,
    Globe,
    Shield,
    Database,
    Layers,
    Zap,
    MessageSquare,
    Bot,
    BookOpen,
    Cpu,
    Brain,
    FileText,
    Camera,
    PlayCircle,
    Search,
    ShieldAlert,
    Share2,
    Code,
    Activity,
    Terminal
} from 'lucide-react';

// Re-using some generic icons
const Play = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const KeyIcon = ({ className }: { className?: string }) => ( // Lucide 'Key' component
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>
);

export const TRACKS: TrackInfo[] = [
    {
        id: 'se',
        label: 'Software Engineer',
        description: 'Master the fundamentals of building scalable web applications.',
        icon: Code
    },
    {
        id: 'sse',
        label: 'Senior SE',
        description: 'Design complex, highly available distributed systems.',
        icon: Server
    },
    {
        id: 'mlops',
        label: 'MLOps & MLE',
        description: 'Build infrastructure for training and serving AI models.',
        icon: Database
    },
    {
        id: 'agentic-ai',
        label: 'Agentic AI',
        description: 'Architect autonomous agent systems and memory pipelines.',
        icon: Bot
    }
];

// --- Software Engineer Track (Fundamentals) ---
const SE_ROADMAP: RoadmapPhase[] = [
    {
        id: 'phase-1-se',
        title: 'Phase 1: Web Fundamentals',
        description: 'Start with the basics of HTTP, APIs, and data consistency.',
        steps: [
            {
                id: 'step-se-1',
                title: 'Design TinyURL',
                description: 'Understand hash functions, base62 encoding, and redirect strategies.',
                problemId: '1',
                problemSlug: 'design-tinyurl',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: Globe
            },
            {
                id: 'step-se-2',
                title: 'Design a REST API',
                description: 'Learn resource modeling, HTTP methods, and status codes.',
                problemId: '40',
                problemSlug: 'design-rest-api',
                difficulty: 'Beginner',
                status: 'locked',
                icon: Terminal
            },
            {
                id: 'step-se-3',
                title: 'Design a Unique ID Generator',
                description: 'Generate unique IDs in a distributed environment (Snowflake).',
                problemId: '15',
                problemSlug: 'design-unique-id-generator',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: KeyIcon
            }
        ]
    },
    {
        id: 'phase-2-se',
        title: 'Phase 2: Scalability Basics',
        description: 'Protecting your services and handling async tasks.',
        steps: [
            {
                id: 'step-se-4',
                title: 'Design a Rate Limiter',
                description: 'Protect your API from abuse using Token Bucket algorithm.',
                problemId: '17',
                problemSlug: 'design-rate-limiter',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Shield
            },
            {
                id: 'step-se-5',
                title: 'Design a Notification System',
                description: 'Design a publish-subscribe system for push notifications.',
                problemId: '22',
                problemSlug: 'design-notification-system',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: MessageSquare
            },
            {
                id: 'step-se-6',
                title: 'Design a Key-Value Store',
                description: 'Introduction to simple distributed storage.',
                problemId: '28',
                problemSlug: 'design-key-value-store',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Database
            }
        ]
    },
    {
        id: 'phase-3-se',
        title: 'Phase 3: Real-Time & Storage',
        description: 'Handling persistent connections and large file data.',
        steps: [
            {
                id: 'step-se-7',
                title: 'Design WhatsApp',
                description: 'Real-time messaging with end-to-end encryption basics.',
                problemId: '7',
                problemSlug: 'design-whatsapp',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: MessageSquare
            },
            {
                id: 'step-se-8',
                title: 'Design Dropbox',
                description: 'File synchronization and chunked storage strategies.',
                problemId: '10',
                problemSlug: 'design-dropbox',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Database
            },
            {
                id: 'step-se-9',
                title: 'Design a Logging System',
                description: 'Centralized log aggregation and search (ELK stack basics).',
                problemId: '26',
                problemSlug: 'design-logging-system',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: FileText
            }
        ]
    }
];

// --- Senior Software Engineer Track (High Scale) ---
const SSE_ROADMAP: RoadmapPhase[] = [
    {
        id: 'phase-1-sse',
        title: 'Phase 1: Core Infrastructure',
        description: 'The building blocks of massive scale.',
        steps: [
            {
                id: 'step-sse-1',
                title: 'Design a Distributed Cache',
                description: 'Design a scalable key-value store (Redis) with eviction policies.',
                problemId: '13',
                problemSlug: 'design-distributed-cache',
                difficulty: 'Advanced',
                status: 'unlocked',
                icon: Layers
            },
            {
                id: 'step-sse-2',
                title: 'Design a Load Balancer',
                description: 'Distribute traffic efficiently using various algorithms.',
                problemId: '30',
                problemSlug: 'design-load-balancer',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Server
            },
            {
                id: 'step-sse-3',
                title: 'Design a Message Queue',
                description: 'Decouple services with Kafka/RabbitMQ patterns.',
                problemId: '29',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Activity
            }
        ]
    },
    {
        id: 'phase-2-sse',
        title: 'Phase 2: Complex Systems',
        description: 'Handling millions of concurrent requests and transactions.',
        steps: [
            {
                id: 'step-sse-4',
                title: 'Design a Flash Sale System',
                description: 'Handle extreme traffic spikes and inventory management.',
                problemId: '84',
                problemSlug: 'design-flash-sale-system',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Zap
            },
            {
                id: 'step-sse-5',
                title: 'Design a Payment System',
                description: 'Design an idempotent financial ledger with reconciliation.',
                problemId: '85',
                problemSlug: 'design-payment-system',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Shield
            },
            {
                id: 'step-sse-6',
                title: 'Design Uber',
                description: 'Geospatial indexing and real-time matching.',
                problemId: '5',
                problemSlug: 'design-uber',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Globe
            },
            {
                id: 'step-sse-7',
                title: 'Design YouTube',
                description: 'Large scale media streaming and storage.',
                problemId: '2',
                problemSlug: 'design-youtube',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Play
            },
            {
                id: 'step-sse-8',
                title: 'Design Twitter',
                description: 'Fan-out services and timeline generation at scale.',
                problemId: '3',
                problemSlug: 'design-twitter',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Globe
            },
            {
                id: 'step-sse-9',
                title: 'Design Instagram',
                description: 'Handling graph data and photo storage at massive scale.',
                problemId: '4',
                problemSlug: 'design-instagram',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Camera
            },
            {
                id: 'step-sse-10',
                title: 'Design Netflix',
                description: 'Global content delivery (CDN) and adaptive bitrate streaming.',
                problemId: '6',
                problemSlug: 'design-netflix',
                difficulty: 'Advanced',
                status: 'locked',
                icon: PlayCircle
            },
            {
                id: 'step-sse-11',
                title: 'Design Google Search',
                description: 'Web crawling, indexing, and ranking at internet scale.',
                problemId: '9',
                problemSlug: 'design-google-search',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Search
            }
        ]
    }
];

// --- MLOps & MLE Track (Data & AI Infra) ---
const MLOPS_ROADMAP: RoadmapPhase[] = [
    {
        id: 'phase-1-ml',
        title: 'Phase 1: Data Ingestion',
        description: 'Pipelines for acquiring and processing data.',
        steps: [
            {
                id: 'step-ml-1',
                title: 'Design a Web Crawler',
                description: 'Ingest data from the web for training datasets.',
                problemId: '32',
                problemSlug: 'design-web-crawler',
                difficulty: 'Intermediate',
                status: 'unlocked',
                icon: Globe
            },
            {
                id: 'step-ml-2',
                title: 'Design a Metrics Monitoring System',
                description: 'Time-series data for model performance tracking.',
                problemId: '27',
                problemSlug: 'design-metrics-monitoring',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Activity
            }
        ]
    },
    {
        id: 'phase-2-ml',
        title: 'Phase 2: Model Serving & Ranking',
        description: 'Serve predictions at scale.',
        steps: [
            {
                id: 'step-ml-3',
                title: 'Design a Vector Database',
                description: 'Store and query embeddings for similarity search.',
                problemId: '65',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Database
            },
            {
                id: 'step-ml-4',
                title: 'Design a Recommendation Engine',
                description: 'Personalized content delivery using ML models.',
                problemId: '18',
                problemSlug: 'design-recommendation-engine',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Brain
            },
            {
                id: 'step-ml-5',
                title: 'Design an Ad Serving System',
                description: 'Real-time bidding and low latency inference.',
                problemId: '43',
                problemSlug: 'design-ad-serving-system',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Zap
            }
        ]
    },
    {
        id: 'phase-3-ml',
        title: 'Phase 3: Data Engineering',
        description: 'Processing big data for robust ML pipelines.',
        steps: [
            {
                id: 'step-ml-6',
                title: 'Design Real-Time Analytics',
                description: 'Stream processing for immediate insights.',
                problemId: '71',
                problemSlug: 'design-real-time-analytics-system',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Zap
            },
            {
                id: 'step-ml-7',
                title: 'Design a Data Lake',
                description: 'Storage for vast amounts of raw data.',
                problemId: '72',
                problemSlug: 'design-data-lake',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Database
            },
            {
                id: 'step-ml-8',
                title: 'Design Fraud Detection',
                description: 'Real-time anomaly detection in financial transactions.',
                problemId: '19',
                problemSlug: 'design-fraud-detection',
                difficulty: 'Advanced',
                status: 'locked',
                icon: ShieldAlert
            }
        ]
    }
];

// --- Agentic AI Track (Autonomous Systems) ---
const AGENTIC_ROADMAP: RoadmapPhase[] = [
    {
        id: 'phase-1-agent',
        title: 'Phase 1: Agent Foundations',
        description: 'Memory, Retrieval, and Interaction.',
        steps: [
            {
                id: 'step-agent-1',
                title: 'Design a Conversational AI Platform',
                description: 'Build the backbone for chatbots and agents.',
                problemId: '70',
                problemSlug: 'design-conversational-ai-platform',
                difficulty: 'Advanced',
                status: 'unlocked',
                icon: MessageSquare
            },
            {
                id: 'step-agent-2',
                title: 'Design a Multi-Modal Search Engine',
                description: 'Searching across text, images, and audio using embeddings.',
                problemId: '66',
                problemSlug: 'design-multi-modal-search-engine',
                difficulty: 'Advanced',
                status: 'unlocked',
                icon: Search
            },
            {
                id: 'step-agent-3',
                title: 'Design a Vector Database',
                description: 'Store and query embeddings for similarity search.',
                problemId: '65',
                problemSlug: 'design-vector-database',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Database
            },
            {
                id: 'step-agent-3b',
                title: 'Design a RAG System',
                description: 'Retrieval-Augmented Generation for factually accurate AI.',
                problemId: '69',
                problemSlug: 'design-rag-system',
                difficulty: 'Advanced',
                status: 'locked',
                icon: BookOpen
            }
        ]
    },
    {
        id: 'phase-2-agent',
        title: 'Phase 2: Orchestration & Safety',
        description: 'Managing multi-agent systems reliably.',
        steps: [
            {
                id: 'step-agent-4',
                title: 'Design an Autonomous Agent Orchestrator',
                description: 'Coordinate multiple agents to solve complex tasks.',
                problemId: '67',
                problemSlug: 'design-autonomous-agent-orchestrator',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Bot
            },
            {
                id: 'step-agent-5',
                title: 'Design a Gen AI Content Moderator',
                description: 'Ensure agent outputs are safe and compliant.',
                problemId: '68',
                problemSlug: 'design-generative-ai-content-moderator',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Shield
            },
            {
                id: 'step-agent-6',
                title: 'Design an Explainable AI System',
                description: 'Trace and audit agent decision making.',
                problemId: '64',
                problemSlug: 'design-explainable-ai-system',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Activity
            },
            {
                id: 'step-agent-7',
                title: 'Design Federated Learning System',
                description: 'Collaborative model training while preserving data privacy.',
                problemId: '63',
                problemSlug: 'design-federated-learning-system',
                difficulty: 'Advanced',
                status: 'locked',
                icon: Share2
            }
        ]
    }
];

export const getRoadmapData = (trackId: string): RoadmapPhase[] => {
    switch (trackId) {
        case 'se': return SE_ROADMAP;
        case 'sse': return SSE_ROADMAP;
        case 'mlops': return MLOPS_ROADMAP;
        case 'agentic-ai': return AGENTIC_ROADMAP;
        default: return SE_ROADMAP;
    }
};
