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
    Terminal,
    GraduationCap,
    Car
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

// --- Fresher & Campus Track (flag: fresherTrack) ---
// Rendered only when the fresherTrack feature flag allows (see getVisibleTracks).
export const FRESHER_TRACK_INFO: TrackInfo = {
    id: 'fresher',
    label: 'Fresher & Campus',
    description: 'Start from zero: OOP classics to your first HLD, placement-ready in 8 weeks.',
    icon: GraduationCap
};

const FRESHER_ROADMAP: RoadmapPhase[] = [
    {
        id: 'phase-0-fresher',
        title: 'Phase 0: Foundations',
        description: 'No code, no problems yet — learn what system design interviews actually expect from freshers.',
        steps: [
            {
                id: 'step-fresher-0a',
                title: 'What Is System Design?',
                description: 'HLD vs LLD, and why fresher interviews start with Parking Lot — not Netflix.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: BookOpen,
                resources: [
                    {
                        title: 'Warm up on the free diagram canvas',
                        type: 'widget',
                        url: '/draw',
                        duration: '10 min'
                    }
                ]
            },
            {
                id: 'step-fresher-0b',
                title: 'Requirements & Trade-offs',
                description: 'Functional vs non-functional requirements, CAP, and consistency vs availability with everyday examples.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: FileText,
                resources: [
                    {
                        title: 'See TinyURL simulations before you design one',
                        type: 'widget',
                        url: '/practice/design-tinyurl',
                        duration: '10 min'
                    }
                ]
            },
            {
                id: 'step-fresher-0c',
                title: 'The 4-Step Interview Framework',
                description: 'Clarify → rough scale → 5-box diagram + API → one trade-off. The lite framework fresher rounds expect.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: Layout,
                resources: [
                    {
                        title: 'Practice the 5-box diagram on the canvas',
                        type: 'widget',
                        url: '/draw',
                        duration: '15 min'
                    }
                ]
            }
        ]
    },
    {
        id: 'phase-1-fresher',
        title: 'Phase 1: OOP & LLD Classics',
        description: 'The problems service companies actually ask freshers — objects, states, and clean APIs.',
        steps: [
            {
                id: 'step-fresher-1',
                title: 'Design a Parking Lot',
                description: 'Classes, entities, and allocation strategy — the canonical fresher LLD problem.',
                problemId: '11',
                problemSlug: 'design-parking-lot',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: Car
            },
            {
                id: 'step-fresher-2',
                title: 'Design an Elevator',
                description: 'State machines and scheduling — reason about a system that moves.',
                problemId: '12',
                problemSlug: 'design-elevator-system',
                difficulty: 'Beginner',
                status: 'locked',
                icon: Layers
            }
        ]
    },
    {
        id: 'phase-2-fresher',
        title: 'Phase 2: Your First HLD',
        description: 'Cross into high-level design with the two friendliest HLD problems.',
        steps: [
            {
                id: 'step-fresher-3',
                title: 'Design TinyURL',
                description: 'Hashing, base62 encoding, and redirects — the classic first HLD interview.',
                problemId: '1',
                problemSlug: 'design-tinyurl',
                difficulty: 'Beginner',
                status: 'locked',
                icon: Globe
            },
            {
                id: 'step-fresher-4',
                title: 'Design a REST API',
                description: 'Resource modeling, HTTP methods, and status codes done right.',
                problemId: '40',
                problemSlug: 'design-rest-api',
                difficulty: 'Beginner',
                status: 'locked',
                icon: Terminal
            }
        ]
    },
    {
        id: 'phase-3-fresher',
        title: 'Phase 3: Scale Basics',
        description: 'Your first taste of scalability — protecting services and fanning out messages.',
        steps: [
            {
                id: 'step-fresher-5',
                title: 'Design a Rate Limiter',
                description: 'Token bucket and sliding windows — protect an API from abuse.',
                problemId: '17',
                problemSlug: 'design-rate-limiter',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Shield
            },
            {
                id: 'step-fresher-6',
                title: 'Design a Notification System',
                description: 'Publish-subscribe basics for push notifications.',
                problemId: '22',
                problemSlug: 'design-notification-system',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: MessageSquare
            }
        ]
    },
    {
        id: 'phase-4-fresher',
        title: 'Phase 4: Interview Ready',
        description: 'Put it together under interview conditions.',
        steps: [
            {
                id: 'step-fresher-7a',
                title: 'Run a Timed Mock',
                description: 'Re-attempt Parking Lot or TinyURL in one 45-minute sitting: clarify, diagram, one trade-off.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: PlayCircle,
                resources: [
                    {
                        title: 'Re-attempt Parking Lot under time pressure',
                        type: 'challenge',
                        url: '/practice/design-parking-lot',
                        duration: '45 min'
                    }
                ]
            },
            {
                id: 'step-fresher-7b',
                title: 'Design WhatsApp',
                description: 'Capstone: real-time chat basics — your bridge to the Software Engineer track.',
                problemId: '7',
                problemSlug: 'design-whatsapp',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: MessageSquare
            }
        ]
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
                problemSlug: 'design-message-queue',
                difficulty: 'Advanced',
                status: 'unlocked',
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
                problemSlug: 'design-vector-database',
                difficulty: 'Advanced',
                status: 'unlocked',
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
        case 'fresher': return FRESHER_ROADMAP;
        default: return SE_ROADMAP;
    }
};
