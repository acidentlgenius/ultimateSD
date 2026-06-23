import { NextRequest, NextResponse } from 'next/server';
import { HumanMessage } from '@langchain/core/messages';
import { auth } from '@/auth';
import { getSolution } from '@/lib/solutions';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';

// Detailed evaluation prompts for each phase
const EVALUATION_GUIDES = {
  requirements: {
    functional: {
      criteria: [
        'Core user-facing features clearly listed (WHAT users can do)',
        'Features describe system capabilities from user perspective',
        'Cover main user types/personas if applicable',
        'Features are specific to the problem domain',
        'OK to mention HOW at high level (e.g., "authenticate via vehicle number", "allocate spots automatically")',
        'Avoid low-level implementation (e.g., "use Redis cache", "implement sharding")'
      ],
      guidelines: {
        acceptable: [
          '✅ "Automatically allocate parking spots" (high-level HOW is OK)',
          '✅ "Authenticate users via vehicle number" (describes the feature)',
          '✅ "Track vehicle entries in system" (what system does)',
          '✅ "Generate bill based on parking duration" (describes capability)',
          '✅ "Support multiple vehicle types" (feature description)',
          '✅ "Display real-time space availability" (user-facing feature)'
        ],
        notAcceptable: [
          '❌ "Use PostgreSQL for storing vehicle data" (tech choice = HLD)',
          '❌ "Implement consistent hashing for distribution" (algorithm = LLD)',
          '❌ "Cache with Redis TTL of 5 minutes" (implementation = LLD)',
          '❌ "Use microservices architecture" (architecture = HLD)'
        ]
      },
      examples: {
        'Design Twitter': ['Post tweets', 'Follow users', 'View timeline/feed', 'Like/retweet', 'Search tweets', 'Send direct messages', 'Receive notifications'],
        'Design YouTube': ['Upload videos', 'Watch videos', 'Subscribe to channels', 'Like/comment', 'Search videos', 'Create playlists', 'Live streaming'],
        'Design Uber': ['Request ride', 'Accept ride (driver)', 'Track location', 'Payment', 'Rate driver/rider', 'View ride history', 'Estimate fare'],
        'Design a Parking Lot System': [
          'Enter parking lot (autonomous/automated entry)',
          'Exit parking lot (automated with payment)',
          'View available spaces (real-time availability)',
          'Receive parking spot guidance (dynamic allocation)',
          'Pay parking fee (via payment gateway)',
          'Authenticate via vehicle number plate',
          'Support different vehicle types (car, bike, truck)',
          'Track entry/exit times',
          'View parking history (for users)',
          'View analytics dashboard (admin)',
          'Manage pricing and rates (admin)',
          'Generate billing automatically'
        ]
      }
    },
    'non-functional': {
      criteria: [
        'Scalability targets mentioned (DAU, QPS)',
        'Availability requirements (99.9%, 99.99%)',
        'Latency requirements',
        'Consistency vs Availability trade-offs',
        'Data durability needs'
      ],
      examples: {
        'Design Twitter': ['Support 200M DAU', '99.9% availability', '<200ms timeline load', 'Eventual consistency OK', 'Store tweets permanently'],
        'Design YouTube': ['Billions of videos', 'Handle 1M concurrent streams', '<100ms video start time', 'Strong consistency for upload', '99.95% availability']
      }
    },
    constraints: {
      criteria: [
        'Traffic estimates (reads vs writes)',
        'Storage estimates',
        'Bandwidth calculations',
        'Geographic distribution',
        'Technology constraints'
      ],
      examples: {
        'Design Twitter': ['Read-heavy (100:1 ratio)', '500M tweets/day', 'Average tweet 280 chars', 'Global audience', 'Mobile-first']
      }
    }
  },
  hld: {
    api: {
      criteria: [
        'RESTful or appropriate API style',
        'All CRUD operations covered for main entities',
        'Request/response formats specified',
        'Authentication/authorization approach mentioned',
        'Query parameters for filtering/pagination',
        'Error responses considered'
      ],
      examples: {
        'Design Twitter': [
          'POST /api/v1/tweets {text, media}',
          'GET /api/v1/timeline?user_id=X&cursor=Y',
          'POST /api/v1/follow {user_id}',
          'GET /api/v1/tweets/:id'
        ],
        'Design a Parking Lot System': [
          'POST /api/v1/entries {vehicle_number, vehicle_type}',
          'POST /api/v1/exits {ticket_id, payment_method}',
          'GET /api/v1/spots/available?vehicle_type=car',
          'GET /api/v1/spots/:id',
          'PUT /api/v1/spots/:id {status, vehicle_id}',
          'GET /api/v1/analytics/occupancy?start_date=X&end_date=Y'
        ]
      }
    },
    'data-model': {
      criteria: [
        'All main entities identified',
        'Key attributes for each entity listed',
        'Relationships between entities clear (1:1, 1:N, M:N)',
        'Primary keys and important indexes mentioned',
        'Data types appropriate for use case',
        'Schema supports the functional requirements'
      ],
      examples: {
        'Design Twitter': [
          'Users (id, username, email, bio)',
          'Tweets (id, user_id, text, created_at)',
          'Follows (follower_id, followee_id)',
          'Likes (user_id, tweet_id)',
          'Indexes on user_id, created_at for fast queries'
        ],
        'Design a Parking Lot System': [
          'ParkingSpots (id, spot_number, type, floor, status)',
          'Vehicles (id, license_plate, type, entry_time, exit_time)',
          'Tickets (id, vehicle_id, spot_id, entry_time, exit_time, amount)',
          'Payments (id, ticket_id, amount, payment_method, status, timestamp)',
          'Users (id, role, email) - for admin access',
          'Indexes on license_plate, spot_id, entry_time for fast lookups'
        ]
      }
    },
    architecture: {
      criteria: [
        'Load balancer mentioned',
        'Application servers for business logic',
        'Database layer (SQL/NoSQL choice justified)',
        'Caching layer (Redis, Memcached)',
        'Message queues if async processing needed',
        'CDN for static content',
        'Object storage for media'
      ],
      examples: {
        'Design Twitter': [
          'Load Balancer → App Servers',
          'PostgreSQL for users, tweets',
          'Redis for timeline cache',
          'Kafka for async fanout',
          'S3 for media',
          'CloudFront CDN'
        ]
      }
    }
  },
  lld: {
    components: {
      criteria: [
        'At least one critical component deep-dived',
        'Internal algorithms/logic explained',
        'Data structures used and why',
        'Concurrency handling if applicable',
        'Error handling and edge cases',
        'Performance optimizations mentioned'
      ],
      examples: {
        'Design a Parking Lot System': [
          'Spot Allocation Algorithm: Find available spot by vehicle type → Sort by proximity to entrance → Use min-heap for O(log n) retrieval',
          'Billing Calculator: Calculate duration → Apply rate based on vehicle type and time → Handle promotions/discounts',
          'Concurrency: Use distributed locks (Redis) when allocating spots to prevent race conditions',
          'Number Plate Scanner Integration: OCR processing → Validation → Fuzzy matching for damaged plates'
        ]
      }
    },
    'data-flow': {
      criteria: [
        'Complete end-to-end flow for a key operation',
        'Each step clearly numbered/ordered',
        'Components involved at each step',
        'Database operations specified',
        'Cache interactions if applicable',
        'Error paths and fallbacks considered'
      ],
      examples: {
        'Design a Parking Lot System': [
          'Vehicle Entry Flow: 1) Camera scans license plate → 2) OCR service extracts plate number → 3) Check DB for existing vehicle → 4) Spot Allocator finds available spot by vehicle type → 5) Update spot status in DB → 6) Generate ticket with QR code → 7) Display spot location on entry screen → 8) Open barrier gate',
          'Vehicle Exit Flow: 1) Scan exit ticket/plate → 2) Retrieve ticket from DB → 3) Calculate parking duration → 4) Billing service computes charges → 5) Display amount on payment screen → 6) Process payment → 7) Update ticket and spot status → 8) Open exit gate'
        ]
      }
    }
  },
  tradeoffs: {
    decisions: {
      criteria: [
        'Key decisions listed',
        'Alternatives considered',
        'Reasoning for choice',
        'Trade-offs acknowledged'
      ]
    },
    bottlenecks: {
      criteria: [
        'Bottlenecks identified',
        'Solutions proposed',
        'Scalability implications discussed'
      ]
    }
  },
  scalability: {
    scaling: {
      criteria: [
        'Horizontal scaling strategy',
        'Database sharding/partitioning',
        'Replication strategy',
        'Load distribution',
        'Auto-scaling triggers'
      ]
    },
    monitoring: {
      criteria: [
        'Key metrics identified',
        'Monitoring tools mentioned',
        'Alerting strategy',
        'Logging approach',
        'Health checks'
      ]
    }
  }
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { problem, phase, subStep, userAnswer, problemDetails } = body;

  let llm;
  try {
    ({ llm } = await getUserLLM(session.user.id, {
      temperature: 0.3,
      problemSlug: problemDetails?.slug,
    }));
  } catch (error) {
    const message = error instanceof AIAccessError
      ? error.message
      : 'AI evaluation not available.';
    return NextResponse.json({
      feedback: {
        score: 0,
        accuracy: 0,
        strengths: [],
        weaknesses: [message],
        missed: [],
        isAcceptable: false
      }
    }, { status: error instanceof AIAccessError ? 403 : 500 });
  }

  try {
    // Get evaluation criteria
    const phaseKey = phase.toLowerCase().replace('-', '').replace(' ', '') as keyof typeof EVALUATION_GUIDES;
    const stepKey = subStep as string;
    const phaseGuide = EVALUATION_GUIDES[phaseKey];
    const guide: any = phaseGuide ? (phaseGuide as any)[stepKey] : null;

    const problemTitle = problemDetails?.title || problem;
    const problemDesc = problemDetails?.description || '';
    const problemSlug = problemDetails?.slug || '';
    const expertSolution = getSolution(problemSlug);

    // Dynamic Context Builder
    let expertContext = '';
    if (expertSolution) {
      if (phase.toLowerCase().includes('requirement') && expertSolution.requirements) {
        const type = subStep.toLowerCase().includes('non') ? 'nonFunctional' : 'functional';
        const reqs = expertSolution.requirements[type] || expertSolution.requirements.functional;
        expertContext = `\n**Expert Solution Context (Reference):**\n- ${reqs.join('\n- ')}`;
      } else if (phase.toLowerCase().includes('architecture') || phase.toLowerCase().includes('hld')) {
        const comps = expertSolution.components.map(c => `${c.name}: ${c.description}`).join('\n');
        expertContext = `\n**Expert Solution Components (Reference):**\n${comps}`;
        if (expertSolution.architectureMermaid) {
          expertContext += `\n(The expert solution uses a diagram with nodes like: ${expertSolution.components.map(c => c.name).join(', ')})`;
        }
      }
    }

    const evaluationPrompt = `You are an expert FAANG system design interviewer (ex-Meta, Google, Amazon). 
You are evaluating a candidate's answer for the problem: "${problemTitle}" - ${problemDesc}

**Current Phase:** ${phase}
**Current Step:** ${subStep}

**Evaluation Criteria:**
${guide?.criteria ? JSON.stringify(guide.criteria, null, 2) : 'General system design principles'}

**Expected Elements (Examples):**
${expertContext ? expertContext : (guide?.examples?.[problemTitle] ? guide.examples[problemTitle].join('\n') : 'Use your expertise for this problem')}

**Candidate's Answer:**
${userAnswer}

**Your Task:**
Evaluate the answer critically but fairly. Consider:
1. Completeness - Did they cover the key points for this specific step?
2. Depth - Is their understanding appropriate for THIS PHASE? (Don't expect API details in Requirements, or workflows in Functional Requirements)
3. Correctness - Are there any technical errors?
4. Relevance - Is it appropriate for "${problemTitle}"?
5. Phase-appropriateness - Are they providing the RIGHT LEVEL of detail for the "${phase}" phase, "${subStep}" step?

**CRITICAL EVALUATION RULES:**

**For "Functional Requirements" (current phase):**
- ✅ ACCEPT: High-level descriptions of system capabilities (e.g., "automatically allocate spots", "authenticate via vehicle number", "track entries")
- ✅ ACCEPT: Mentioning HOW users interact at a high level (e.g., "scan vehicle plate", "pay via gateway", "view on screen")
- ✅ ACCEPT: Security/quality mentions when part of feature description (e.g., "secure payment", "real-time availability")
- ❌ REJECT: Only low-level tech choices (e.g., "use Redis", "PostgreSQL with sharding", "implement consistent hashing")
- ❌ REJECT: Architecture details (e.g., "microservices", "load balancer", "CDN")
- 🎯 SCORING: If they list 7-10 relevant features covering core user actions → 8-10/10. Don't be overly strict about "nice-to-have" features.

**For OTHER phases (not now, but for context):**
- "API Design": Expect CRUD operations, endpoints, request/response formats
- "Data Flow": Expect detailed step-by-step workflows
- "Component Deep-Dive": Expect internal algorithms and implementation details

**DON'T penalize for:**
- Not mentioning every possible edge-case feature (reservations, attendants, etc.) unless critical to the problem
- Mixing a tiny bit of "how" if it clarifies "what" (e.g., "authenticate via vehicle number" is clearer than just "authenticate")
- Phrasing variations (e.g., "creates entry in database" = "track vehicle entries")

**BE GENEROUS for Functional Requirements - they're learning!**

**Respond in VALID JSON format only (no markdown, no extra text):**
{
  "score": <number 1-10>,
  "accuracy": <percentage 0-100>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "missed": ["key point they missed 1", "key point they missed 2"],
  "isAcceptable": <boolean - true if score >= 7 AND accuracy >= 70>
}

**Scoring Guide:**
- 9-10: Excellent, comprehensive (covers 10+ features for parking lot, includes admin features)
- 7-8: Good, covers most core points (7-9 features, minor gaps OK)
- 5-6: Adequate but missing key elements (4-6 features, missing major areas like admin or payment)
- 3-4: Incomplete, significant gaps (1-3 features, very basic)
- 1-2: Very weak, fundamental misunderstandings (generic or off-topic)

**For Functional Requirements specifically:**
- Prioritize BREADTH (covering multiple user actions) over DEPTH (implementation details)
- If answer covers: entry, exit, payment, space availability, allocation, admin → likely 8-9/10
- Don't over-penalize for phrasing or minor "how" mentions
- Focus on: "Did they identify what users/admins can do with this system?"

Be constructive, encouraging, but honest. This is practice for a real interview.`;

    const response = await llm.invoke([new HumanMessage(evaluationPrompt)]);
    let content = response.content as string;

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const feedback = JSON.parse(content);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json({
      feedback: {
        score: 0,
        accuracy: 0,
        strengths: [],
        weaknesses: ['Error processing your answer. Please try again.'],
        missed: [],
        isAcceptable: false
      }
    });
  }
}
