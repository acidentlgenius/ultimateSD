
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
    'design-task-scheduler': {
        slug: 'design-task-scheduler',
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
,
    'design-lru-cache': {
        slug: 'design-lru-cache',
        title: 'LRU Cache (Expert Guide)',
        overview: 'An in-memory data structure that provides O(1) time complexity for both get and put operations, while automatically evicting the least recently used item when capacity is reached.',
        components: [
            {
                name: 'Hash Map',
                description: 'Stores keys mapped to pointers of the corresponding node in the Doubly Linked List, enabling O(1) lookups.',
                technologies: ['Hash Table / Dictionary']
            },
            {
                name: 'Doubly Linked List',
                description: 'Maintains the access order of items. Most recently used items are moved to the head, and least recently used items naturally fall to the tail for O(1) eviction.',
                technologies: ['Pointers', 'Linked Nodes']
            },
            {
                name: 'Concurrency Controller (Optional)',
                description: 'For thread-safe environments, controls access to the cache to prevent race conditions during concurrent reads and writes.',
                technologies: ['Mutex', 'ReadWriteLock', 'ConcurrentHashMap']
            }
        ],
        dataFlow: [
            'Get(key): Look up the key in the Hash Map.',
            'If found, move the corresponding node to the head of the Doubly Linked List (marking it as most recently used) and return its value.',
            'If not found, return -1 or null.',
            'Put(key, value): Look up the key in the Hash Map.',
            'If it exists, update the nodes value and move it to the head of the list.',
            'If it does not exist, create a new node and add it to the head of the list, then add it to the Hash Map.',
            'If adding a new node exceeds capacity, remove the tail node from the list and delete its corresponding key from the Hash Map.'
        ],
        tradeoffs: {
            pros: [
                'O(1) time complexity for get and put operations.',
                'Predictable memory usage bounded by capacity.'
            ],
            cons: [
                'High memory overhead per item due to storing pointers for the doubly linked list.',
                'Lock contention can become a bottleneck in highly concurrent environments.'
            ]
        },
        requirements: {
            functional: [
                'Initialize cache with positive capacity.',
                'get(key) returns value if exists, else -1.',
                'put(key, value) updates value if key exists, inserts if not.',
                'Evict least recently used key if put exceeds capacity.'
            ],
            nonFunctional: [
                'O(1) time complexity for get and put.',
                'Thread safety in concurrent environments.'
            ]
        }
    }
,
    'design-parking-lot': {
        slug: 'design-parking-lot',
        title: 'Parking Lot System (Expert Guide)',
        overview: 'A gate-driven allocation system for a 4-level, ~2,000-spot facility with 6 camera gates. At peak (10 vehicles/min per gate) the whole facility does about 1 spot assignment per second — the data is tiny, so the defining decision is not scale but correctness: making the spot claim atomic (conditional UPDATE / compare-and-set on a single spots table) so 6 concurrent gates can never double-allocate, while keeping every gate decision under 2 seconds and gates moving through a 10-minute payment outage.',
        architectureMermaid: `
graph TD
    EntryCam[Entry Camera] --> Gate[Gate Controller x6]
    ExitCam[Exit Camera] --> Gate
    Gate -->|POST /entry, POST /exit| Alloc[Spot Allocation Service]
    Alloc -->|Atomic claim: UPDATE where status=free| SpotDB[(Spot Inventory DB)]
    Alloc --> Billing[Pricing and Billing Service]
    Billing -->|Charge| PSP[Payment Provider]
    Billing -->|If PSP down: queue charge| Outbox[(Pending Charges Outbox)]
    SpotDB --> Occupancy[Occupancy Service]
    Occupancy -->|Live counts per level| Displays[Gate Displays]
    Occupancy --> Dashboard[Operator Dashboard]
    Dashboard -->|Pricing, close levels| SpotDB
`,
        components: [
            {
                name: 'Gate Controller (x6)',
                description: 'Edge device per gate: plate camera + barrier. Sends entry/exit requests with { gateId, plate, vehicleType } and must get a decision back within 2 seconds. Opens the gate on backend approval; falls back to degraded mode rules if payments are down.',
                technologies: ['ANPR camera', 'Embedded controller']
            },
            {
                name: 'Spot Allocation Service',
                description: 'The single source of truth for spot state. Picks the nearest free spot matching vehicle size (free list / min-heap per level+size, ordered by distance from the gate) and claims it atomically — a conditional UPDATE (status free -> occupied) or SELECT FOR UPDATE. If the claim loses the race (0 rows updated), it retries with the next-nearest spot. This is what guarantees no double-allocation across 6 concurrent gates.',
                technologies: ['Node.js/Go service', 'PostgreSQL transactions']
            },
            {
                name: 'Spot Inventory DB',
                description: 'Relational store for Level, Spot(id, level_id, size, status), Vehicle, and ParkingSession(plate, spot_id, entered_at, exited_at, fee). ~2,000 spot rows — a single Postgres instance handles 1 write/sec trivially; the DB is chosen for its atomicity, not its scale. Per-level PricingRule rows let operators change rates without a deploy.',
                technologies: ['PostgreSQL', 'MySQL']
            },
            {
                name: 'Pricing & Billing Service',
                description: 'On exit: looks up the open session by plate, computes fee = duration x rate(vehicleType, level), and charges via the payment provider. Reads per-level pricing rules managed by operators.',
                technologies: ['Stateless service', 'Rules table in SQL']
            },
            {
                name: 'Payment Provider + Pending-Charges Outbox',
                description: 'External PSP integration with a degraded mode: if the PSP is unreachable, the exit gate still opens — the fee is written to a durable outbox and retried when the provider recovers (up to the 10-minute outage window and beyond). Availability of the physical gate beats payment synchronicity.',
                technologies: ['Stripe/Adyen (illustrative)', 'DB outbox table + retry worker']
            },
            {
                name: 'Occupancy Service',
                description: 'Derives per-level free counts from the same transactional spot table (counter updated in the claim/release transaction), so counts are accurate within 1 spot by construction. Pushes updates to gate displays and the operator dashboard.',
                technologies: ['SQL counters', 'WebSocket/SSE push']
            },
            {
                name: 'Operator Dashboard',
                description: 'Live occupancy per level, pricing management, and level open/close control (closing a level marks its free spots unallocatable).',
                technologies: ['React admin UI']
            }
        ],
        dataFlow: [
            'Entry: camera reads plate -> Gate Controller POST /entry { gateId, plate, vehicleType } -> Allocation Service pops nearest free spot for (size, gate) -> atomic claim UPDATE spots SET status=occupied WHERE id=? AND status=free -> on success, create ParkingSession(entered_at), decrement level free-count in the same transaction -> respond { spotId, level } well under 2s -> gate opens, display shows the spot.',
            'Concurrent claim race: two gates pick the same nearest spot in the same second -> both issue the conditional UPDATE -> exactly one succeeds (1 row updated), the loser gets 0 rows and retries with the next-nearest spot. No locks held across the network, no double-allocation.',
            'Exit (happy path): exit camera reads plate -> lookup open session -> fee = duration x rate(vehicleType, level) -> charge via payment provider -> mark session closed, free the spot + increment free-count atomically -> gate opens.',
            'Exit (payments down, up to 10 min): fee is computed and written to the pending-charges outbox -> gate opens anyway and the spot is freed immediately, so occupancy stays accurate within 1 spot -> a retry worker drains the outbox when the PSP recovers (invoice/plate-billing as final fallback).',
            'Sizing sanity check: 6 gates x 10 vehicles/min = 1 assignment/sec facility-wide against ~2,000 rows — the design is correctness-bound, not throughput-bound.'
        ],
        tradeoffs: {
            pros: [
                'Conditional UPDATE (compare-and-set) makes the no-double-allocation invariant a one-liner enforced by the database, with no lock manager to operate and no locks held while a gate camera is deciding.',
                'Retry-with-next-spot degrades gracefully: a lost race costs one extra ~1ms query, comfortably inside the 2s gate budget.',
                'Fail-open exits with a durable outbox keep gates moving through a 10-minute PSP outage and free spots immediately, protecting both throughput and occupancy accuracy.',
                'A single relational source of truth keeps occupancy counts transactionally exact — no reconciliation job needed for the within-1-spot NFR.'
            ],
            cons: [
                'Per-spot compare-and-set means concurrent gates targeting the same "nearest" spot contend; under pathological contention a gate may retry several spots (mitigated by biasing each gate toward a different starting spot).',
                'A single-writer allocator (serialize all claims through one process) would eliminate races entirely but adds a component that must itself be made highly available — overkill at 1 claim/sec.',
                'Coarse per-level locks are simpler to reason about but serialize unrelated gates on the same level and hurt the 2s latency tail.',
                'Fail-open exits accept revenue risk during PSP outages (some queued charges will never collect); the alternative — holding cars at the gate — violates the availability NFR.'
            ]
        },
        requirements: {
            functional: [
                'Admit a vehicle and assign the nearest free spot matching its size (car, motorcycle, truck), with size fallback rules (a smaller vehicle may take a larger spot when its own size is full, never the reverse)',
                'Track entry and exit times per vehicle via plate recognition at all 6 gates',
                'Compute parking fees from duration and vehicle type (and per-level rate) on exit',
                'Show real-time space availability per level at gate displays and online',
                'Let operators manage per-level pricing, close levels for maintenance, and view occupancy analytics'
            ],
            nonFunctional: [
                'Gate decision (spot assignment) in under 2 seconds per vehicle',
                'No double-allocation of a spot even with 6 gates operating concurrently — claims must be atomic (compare-and-set or equivalent)',
                'Gates keep admitting and releasing vehicles (degraded mode with queued charges) if the payment provider is down for up to 10 minutes',
                'Occupancy counts accurate within 1 spot at all times — counts derived transactionally from spot state, not a separate eventually-consistent store',
                'Modest scale: ~1 assignment/sec facility-wide at peak (6 gates x 10 vehicles/min) over ~2,000 spots — a single relational DB suffices'
            ]
        }
    }
,
    'design-elevator-system': {
        slug: 'design-elevator-system',
        title: 'Elevator System (Expert Guide)',
        overview: 'A control system for 8 cars in a 40-floor tower (~10,000 trips/day) split into two layers with different guarantees: a central Dispatcher that optimizes (ETA-based car assignment in <100ms, LOOK stop ordering, up-peak lobby zoning) and per-car Controllers that guarantee safety (state-machine interlocks that fail closed and treat every dispatcher command as a request to validate, never an order). This split is the defining decision: a scheduler bug can cost seconds of wait time but can never move a car with open doors.',
        architectureMermaid: `
graph TD
    Hall[Hall Call Panels floors 1-40] -->|hallCall floor+direction| Dispatcher[Dispatcher]
    Standby[Hot-Standby Dispatcher] -.->|takes over on heartbeat loss| Dispatcher
    Dispatcher -->|assign hall call| Car1[Car Controller 1..8]
    Car1 -->|telemetry: floor, direction, doors, load| Dispatcher
    CarPanel[Car Call Buttons inside car] --> Car1
    Car1 --> FSM[Car State Machine + LOOK queue]
    FSM -->|motion commands validated| Interlock[Safety Interlocks - fail closed]
    Interlock --> Motor[Motor and Door Hardware]
    Ops[Maintenance Console] -->|service modes| Dispatcher
`,
        components: [
            {
                name: 'Hall Call Panels',
                description: 'Up/down buttons on each of 40 floors. Send hallCall { floor, direction } to the dispatcher; show assigned-car indication. If the dispatcher is unreachable, calls broadcast directly to all car controllers (fallback mode).',
                technologies: ['Building bus (CAN/serial)', 'Simple firmware']
            },
            {
                name: 'Dispatcher',
                description: 'Central scheduler. Holds an in-memory model of all 8 cars (floor, direction, door state, load, service mode, committed stops) refreshed by telemetry. For each hall call it scores every car by estimated time to serve (travel time + committed stop dwell) and assigns the lowest ETA — scoring 8 cars is microseconds of work, easily inside the 100ms budget. Applies up-peak lobby zoning at morning rush and wait-time aging so no call starves. Stateless enough to rebuild its model from car telemetry in seconds.',
                technologies: ['Real-time process (Go/C++)', 'In-memory state model']
            },
            {
                name: 'Hot-Standby Dispatcher',
                description: 'Second dispatcher instance watching a heartbeat; takes over and rebuilds state from telemetry on failure. Even with both dispatchers dead, cars degrade to standalone mode (serve broadcast hall calls with their own LOOK queue) — the bank keeps operating, just less optimally.',
                technologies: ['Heartbeat failover', 'Same binary as primary']
            },
            {
                name: 'Car Controller (x8)',
                description: 'Owns one car: merges assigned hall calls and in-car car calls into a LOOK stop queue (keep direction, serve stops along the way, reverse when none remain ahead), runs the car state machine, and reports telemetry (floor, direction, doorState, loadKg, mode) every few hundred ms. Treats dispatcher commands as requests — it rejects any command its state machine or interlocks forbid.',
                technologies: ['Embedded RTOS controller', 'Explicit state machine']
            },
            {
                name: 'Car State Machine',
                description: 'States: Idle, MovingUp, MovingDown, DoorsOpening, DoorsOpen, DoorsClosing, Overloaded, Fault. Legal transitions only — Moving* is reachable solely from DoorsClosed/Idle; DoorsOpen -> Moving is structurally absent, and Overloaded blocks DoorsClosing until load drops. Encoding safety as missing transitions (not runtime checks scattered in scheduler code) is what makes "scheduler bugs can never violate safety" true.',
                technologies: ['Finite state machine', 'Formal transition table']
            },
            {
                name: 'Safety Interlocks',
                description: 'The last line of defense, implemented in hardware/firmware below the state machine: door-lock circuit in series with the motor (car physically cannot move with doors open), overload sensor, over-speed governor. Fail closed: on any fault or ambiguity the car stops at the nearest floor and opens doors. Independent of — and unoverridable by — dispatcher software.',
                technologies: ['Hardwired safety circuit', 'Overload/over-speed sensors']
            },
            {
                name: 'Maintenance Console',
                description: 'Operator control for service modes: independent service (car obeys only in-car calls), fire service (recall to lobby, hall calls ignored), and maintenance lockout (removed from dispatch pool). Mode changes flow to both dispatcher (stop assigning) and car controller (enforce mode).',
                technologies: ['Ops UI', 'Mode flags in car state']
            }
        ],
        dataFlow: [
            'Hall call: rider presses Down on floor 12 -> panel sends hallCall{12, down} -> Dispatcher scores all 8 cars by ETA (distance at rated speed + dwell for committed stops, skipping cars that are full, faulted, or in a service mode) -> assigns lowest-ETA car in well under 100ms -> that Car Controller inserts floor 12 into its LOOK queue.',
            'Stop ordering (LOOK): a car at floor 12 heading up with stops {5, 30, 8} serves 30 first (on the way up), then reverses and serves 8 and 5 — versus FCFS zig-zagging 12->5->30->8, which wastes ~60 floors of travel. LOOK is what makes the 30s average wait achievable with 8 cars over 40 floors; wait-time aging boosts any call passed over too long so a rider to floor 38 is never starved.',
            'Morning rush (8:55am, ~10,000 trips/day concentrated lobby-to-upper): dispatcher switches to up-peak zoning — idle cars are parked at the lobby, and lobby departures are batched by destination bands (low/mid/high floors) so cars make fewer stops per round trip.',
            'Car fault mid-trip: controller enters Fault, stops at nearest floor, opens doors (fail closed), reports fault telemetry -> Dispatcher removes it from the pool and re-scores its unserved hall calls across the remaining 7 cars; car calls of onboard riders end at the evacuation floor.',
            'Dispatcher fault: standby detects missed heartbeats, rebuilds the 8-car model from telemetry, resumes assigning within seconds. If both dispatchers are down, hall panels broadcast calls and each car serves nearby broadcast calls with local LOOK — degraded wait times, but the building never stalls.'
        ],
        tradeoffs: {
            pros: [
                'Safety lives in the car (state machine + hardwired interlocks), so no dispatcher bug, crash, or malicious command can move a car with doors open — the fail-closed NFR holds by construction, not by testing the scheduler harder.',
                'ETA-based dispatch measurably beats nearest-car: nearest-car ignores committed stops, so a "near" car with 6 queued stops loses to a slightly farther empty car; scoring 8 cars costs microseconds against the 100ms budget.',
                'LOOK gives near-optimal travel with O(1) decision logic and inherent fairness in its sweep; adding wait-time aging closes its one gap (a low-traffic floor waiting through repeated sweeps).',
                'Central dispatcher with hot standby + standalone car fallback survives any single car failure and the dispatcher failing — matching the availability NFR without distributed consensus machinery an 8-car bank does not need.'
            ],
            cons: [
                'A central dispatcher is a single point of optimization: failover gaps (a few seconds) temporarily degrade assignment quality; fully decentralized car-bidding avoids this but makes up-peak coordination like lobby zoning much harder.',
                'ETA scoring depends on dwell-time estimates that vary with crowds; a simpler nearest-car rule is more predictable but demonstrably worse at rush hour.',
                'LOOK sacrifices strict FCFS fairness — a rider on the sweep path is served before an earlier caller behind the car; aging bounds but does not eliminate this.',
                'Up-peak lobby zoning improves morning throughput at the cost of longer waits on upper floors during the same window — a deliberate, tunable bias, and mis-detecting the peak period misallocates cars.'
            ]
        },
        requirements: {
            functional: [
                'Accept hall calls (up/down button per floor) and car calls (target floor pressed inside the car) as distinct request types',
                'Dispatch the best car to each hall call to minimize average wait time (ETA-based scoring across all 8 cars)',
                'Order each car\'s stops efficiently (LOOK: serve stops in the direction of travel, then reverse) rather than first-come-first-served',
                'Handle car fault states by removing the car from the pool and re-assigning its pending hall calls to other cars',
                'Support service modes: independent service, fire-service recall, and maintenance lockout'
            ],
            nonFunctional: [
                'Average passenger wait under 30 seconds at peak load (morning up-peak, lunch down-peak of the ~10,000 trips/day)',
                'Dispatch decision computed in under 100ms per hall call (scoring 8 cars is trivially within budget)',
                'Safety invariants (never move with doors open, respect weight limits) can never be violated by scheduler bugs — enforced fail-closed in the car\'s state machine and hardware interlocks, below the dispatcher',
                'System keeps operating with any single car failed or with the dispatcher itself failed (hot standby, plus standalone car fallback)',
                'No hall call is starved: wait-time aging guarantees eventual service even under directional peak traffic'
            ]
        }
    }
};

export const getSolution = (slug: string): ExpertSolution | null => {
    return SOLUTIONS[slug] || null;
};
