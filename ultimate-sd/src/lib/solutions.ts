
export interface ExpertSolution {
    slug: string;
    title: string;
    architectureImage?: string; // URL to diagram (Deprecated)
    architectureMermaid?: string; // Mermaid code for diagram
    overview: string;
    components: {
        name: string;
        description: string;
        technologies: string[];
    }[];
    dataFlow: string[];
    tradeoffs: {
        pros: string[];
        cons: string[];
    };
    requirements?: {
        functional: string[];
        nonFunctional: string[];
    };
}

export const SOLUTIONS: Record<string, ExpertSolution> = {
    'design-distributed-job-scheduler': {
        slug: 'design-distributed-job-scheduler',
        title: 'Distributed Job Scheduler (Expert Guide)',
        overview: 'A robust, scalable distributed job scheduler designed to handle millions of jobs with high availability and fault tolerance. This architecture uses a leader-follower pattern for scheduling and a partitioned worker pool for execution.',
        architectureMermaid: `
graph TD
    Client[Client] -->|Submit Job| API[API Gateway]
    API -->|Validate & Push| Queue[Distributed Queue (Kafka)]
    
    subgraph Scheduler Cluster
    Scheduler[Scheduler Service] -->|Consume| Queue
    Scheduler -->|Elect Leader| ZK[Zookeeper]
    end
    
    subgraph Execution Layer
    Scheduler -->|Dispatch| Workers[Worker Pool]
    Workers -->|Update Status| DB[(Metadata DB)]
    Workers -->|Heartbeat| Scheduler
    end
    
    DB -->|Read History| API
`,
        components: [
            {
                name: 'API Server (Gateway)',
                description: 'Entry point for job submission and status checks. Validates requests and pushes jobs to the queue.',
                technologies: ['Node.js/Go', 'Nginx']
            },
            {
                name: 'Distributed Queue (Kafka/Pulsar)',
                description: 'Persistent message bus to buffer incoming jobs. Ensures durability and ordering.',
                technologies: ['Kafka', 'RabbitMQ']
            },
            {
                name: 'Scheduler Service (Leader-Follower)',
                description: 'Core logic. Reads from queue, assigns jobs to workers based on capacity and priority. Uses Zookeeper/etcd for leader election.',
                technologies: ['Java/Go', 'Zookeeper']
            },
            {
                name: 'Worker Pool',
                description: 'Stateless workers that execute the actual tasks. Auto-scales based on load.',
                technologies: ['Kubernetes', 'Docker']
            },
            {
                name: 'Metadata Store (DB)',
                description: 'Stores job status, history, and configurations. Sharded by Job ID.',
                technologies: ['PostgreSQL', 'Cassandra']
            }
        ],
        dataFlow: [
            'Client submits job -> API Server -> Validates -> Pushes to Kafka Topic "jobs-submitted"',
            'Scheduler (Leader) consumes "jobs-submitted" -> Calculates schedule -> Writes metadata "SCHEDULED" -> Pushes to "jobs-ready" queue',
            'Worker consumes "jobs-ready" -> Executes task -> Updates DB status "RUNNING" -> "COMPLETED"',
            'If Worker fails -> Heartbeat timeout -> Scheduler re-queues job'
        ],
        tradeoffs: {
            pros: [
                'High Scalability: Decoupled components allow independent scaling.',
                'Fault Tolerance: No single point of failure; jobs are persistent in Kafka.',
                'Flexibility: Workers can be language-agnostic.'
            ],
            cons: [
                'Complexity: Requires managing Zookeeper, Kafka, and distributed coordination.',
                'Latency: Queueing introduces some overhead vs direct execution.',
                'Debugging: Tracing requests across distributed services is challenging.'
            ]
        },
        requirements: {
            functional: [
                'Submit Job (Immediate or Scheduled)',
                'Query Job Status',
                'Cancel Job',
                'Handle Dependencies',
                'Retry Mechanism'
            ],
            nonFunctional: [
                'High Availability (Leader Election)',
                'Fault Tolerance',
                'Scalability',
                'Durability'
            ]
        }
    },
    'design-flash-sale-system': {
        slug: 'design-flash-sale-system',
        title: 'Flash Sale System (Expert Guide)',
        overview: 'High-concurrency architecture optimized for extreme read/write spikes. Prioritizes availability and eventual consistency for inventory, utilizing heavy caching and rate limiting.',
        architectureMermaid: `
graph TD
    User[User] -->|Click Buy| CDN[CDN/Edge]
    CDN -->|Forward Request| LB[Load Balancer]
    
    subgraph Protection Layer
    LB --> RateLimiter[Rate Limiter]
    end
    
    subgraph Core Logic
    RateLimiter -->|Allowed| Backend[Backend Service]
    Backend -->|Atomic Decr| Redis[(Redis Inventory)]
    end
    
    subgraph Async Processing
    Backend -->|Order Created| Kafka[Kafka Order Queue]
    Kafka -->|Consume| OrderService[Order Worker]
    OrderService -->|Persist| DB[(SQL Database)]
    end
`,
        components: [
            {
                name: 'CDN & Edge',
                description: 'Caches static assets and product pages. Blocks bot traffic at the edge.',
                technologies: ['Cloudflare', 'Akamai']
            },
            {
                name: 'Rate Limiter',
                description: 'Protects backend from surges. Uses token bucket algorithm.',
                technologies: ['Redis Keys']
            },
            {
                name: 'Inventory Cache (Redis)',
                description: 'Atomic counters for stock decrements. The "source of truth" during the sale.',
                technologies: ['Redis (Lua Scripts)']
            },
            {
                name: 'Order Queue',
                description: 'Asynchronous processing of confirmed orders to prevent DB lock contention.',
                technologies: ['Kafka']
            }
        ],
        dataFlow: [
            'User clicks "Buy" -> Edge/CDN serves page',
            'Request -> Load Balancer -> Rate Limiter (Reject excess)',
            'Backend -> Redis DECR stock. If < 0, return "Sold Out".',
            'If success -> Push "Order Created" event to Kafka -> Return "Order Pending" to user',
            'Order Service consumes Kafka -> Writes to SQL DB (Payment/Order tables)'
        ],
        tradeoffs: {
            pros: [
                'Performance: In-memory operations (Redis) handle 100k+ TPS.',
                'Protection: Backend DB is shielded from traffic spikes.',
                'User Experience: Fast feedback even under load.'
            ],
            cons: [
                'Overselling Risk: Redis/DB sync delay (mitigated by reconciliation).',
                'Complexity: Specialized infrastructure just for sales events.',
                'Bot Wars: Constant battle against scripted attacks.'
            ]
        },
        requirements: {
            functional: [
                'View Flash Sale Items',
                'Purchase Item (Atomic)',
                'Prevent Overselling',
                'Rate Limit Per User',
                'Real-time Stock'
            ],
            nonFunctional: [
                'High Concurrency',
                'Low Latency',
                'Eventual vs Strong Consistency',
                'Anti-Bot Protection'
            ]
        }
    },
    'design-payment-system': {
        slug: 'design-payment-system',
        title: 'Payment System (Expert Guide)',
        overview: 'Focuses on ACID compliance, idempotency, and security. Ensures money is never lost or double-spent using robust transaction management and reconciliation jobs.',
        architectureMermaid: `
graph TD
    Client[Client] -->|Pay| Service[Payment Service]
    
    subgraph Transaction Management
    Service -->|Check Key| DB[(Ledger DB)]
    Service -->|1. Create Pending| DB
    end
    
    subgraph External
    Service -->|2. Charge| PSP[PSP (Stripe/Paypal)]
    PSP -->|Webhook| WebhookHandler[Webhook Handler]
    end
    
    subgraph Reconciliation
    WebhookHandler -->|Update| DB
    Cron[Reconciliation Job] -->|Read Daily Report| PSP
    Cron -->|Compare| DB
    end
`,
        components: [
            {
                name: 'Payment Service',
                description: 'Orchestrates the payment flow. Handles idempotency keys.',
                technologies: ['Java/Go']
            },
            {
                name: 'PSP Interface',
                description: 'Standardized adapter for Stripe, Paypal, etc.',
                technologies: ['Adapter Pattern']
            },
            {
                name: 'Ledger DB',
                description: 'Double-entry bookkeeping system. Immutable transaction logs.',
                technologies: ['PostgreSQL']
            },
            {
                name: 'Reconciliation Job',
                description: 'Nightly batch process to match internal DB vs PSP reports.',
                technologies: ['Spark', 'Cron']
            }
        ],
        dataFlow: [
            'Client -> Payment Service (with Idempotency Key)',
            'Service checks DB for Key. If exists, return result.',
            'If new -> Create DB Entry "PENDING" -> Call PSP API',
            'PSP responds -> Update DB "SUCCESS"/"FAILED"',
            'Webhook from PSP (Async) -> Updates DB if timeout occurred previously'
        ],
        tradeoffs: {
            pros: [
                'Reliability: Double-entry guarantees consistency.',
                'Auditability: Complete history of all movements.',
                'Safety: Idempotency prevents double charging.'
            ],
            cons: [
                'Latency: ACID transactions are slower than eventual consistency.',
                'Vendor Lock-in: Switching PSPs requires updating adapters.',
                'Storage: Ledger grows very fast.'
            ]
        },
        requirements: {
            functional: [
                'Process Payment',
                'Refund Transaction',
                'Payment History',
                'Idempotency',
                'Reconciliation'
            ],
            nonFunctional: [
                'ACID Compliance',
                'Strong Consistency',
                'Security (PCI-DSS)',
                'Reliability (Five 9s)'
            ]
        }
    },
    'design-tinyurl': {
        slug: 'design-tinyurl',
        title: 'TinyURL (Expert Guide)',
        overview: 'A highly scalable URL shortening service focusing on fast redirects and unique ID generation. Uses a pre-generated key strategy (KGS) to avoid collisions and reduce latency.',
        architectureMermaid: `
graph TD
    User[User] -->|1. Shorten| LB[Load Balancer]
    User -->|2. Visit Short Link| LB
    LB --> Server[App Server]
    
    subgraph Optimization
    Server -->|Get Key| KGS[Key Generation Service]
    KGS -->|Pre-gen Keys| KGS_DB[(Key DB)]
    end
    
    subgraph Data Layer
    Server -->|Read/Write| Cache[Redis Cache]
    Cache -->|Persist| DB[(NoSQL / SQL)]
    end
`,
        components: [
            {
                name: 'API Server',
                description: 'Handles shortening and redirect requests. Stateless.',
                technologies: ['Node.js', 'Python']
            },
            {
                name: 'Key Generation Service (KGS)',
                description: 'Pre-generates unique 6-character strings to ensure no collisions and fast writes.',
                technologies: ['Internal Service']
            },
            {
                name: 'Redis Cache',
                description: 'Caches hot URLs for fast redirects (90% read traffic).',
                technologies: ['Redis']
            }
        ],
        dataFlow: [
            'Shorten: Client -> Server -> Fetch unused ID from KGS -> Write to DB/Cache -> Return Short URL',
            'Redirect: Client -> Server -> Check Cache -> (If miss) Check DB -> Return 301/302 Redirect'
        ],
        tradeoffs: {
            pros: [
                'Performance: KGS removes collision checks at runtime.',
                'Simplicity: Decoupled unique ID logic.',
                'Scalability: Read/Write can be scaled independently.'
            ],
            cons: [
                'SPOF: KGS is a critical point (needs failover).',
                'Storage: Keys can run out if not managed (Base62 allows 56B combinations).'
            ]
        },
        requirements: {
            functional: [
                'Shorten URL',
                'Redirect (301 vs 302)',
                'Custom Alias',
                'Expiration Date'
            ],
            nonFunctional: [
                'High Availability',
                'Low Latency (Redirect < 10ms)',
                'Read Heavy (100:1 ratio)'
            ]
        }
    }
};

export const getSolution = (slug: string): ExpertSolution | null => {
    return SOLUTIONS[slug] || null;
};
