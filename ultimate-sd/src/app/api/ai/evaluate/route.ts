import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';

const llm = process.env.GOOGLE_API_KEY ? new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash-exp',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
}) : null;

// Detailed evaluation prompts for each phase
const EVALUATION_GUIDES = {
  requirements: {
    functional: {
      criteria: [
        'Core user-facing features identified',
        'CRUD operations for main entities',
        'Key user workflows covered',
        'Authentication/authorization mentioned if needed',
        'Search/filter capabilities if relevant'
      ],
      examples: {
        'Design Twitter': ['Post tweets', 'Follow users', 'View timeline/feed', 'Like/retweet', 'Search tweets'],
        'Design YouTube': ['Upload videos', 'Watch videos', 'Subscribe to channels', 'Like/comment', 'Search videos'],
        'Design Uber': ['Request ride', 'Accept ride (driver)', 'Track location', 'Payment', 'Rate driver/rider']
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
        'All CRUD operations covered',
        'Request/response formats specified',
        'Authentication headers mentioned',
        'Pagination/filtering parameters'
      ],
      examples: {
        'Design Twitter': [
          'POST /api/v1/tweets {text, media}',
          'GET /api/v1/timeline?user_id=X&cursor=Y',
          'POST /api/v1/follow {user_id}',
          'GET /api/v1/tweets/:id'
        ]
      }
    },
    'data-model': {
      criteria: [
        'All main entities identified',
        'Relationships between entities clear',
        'Primary keys and indexes mentioned',
        'Normalization appropriate for use case',
        'Schema supports query patterns'
      ],
      examples: {
        'Design Twitter': [
          'Users (id, username, email, bio)',
          'Tweets (id, user_id, text, created_at)',
          'Follows (follower_id, followee_id)',
          'Likes (user_id, tweet_id)',
          'Indexes on user_id, created_at for fast queries'
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
        'Critical component identified',
        'Internal algorithms explained',
        'Data structures used',
        'Concurrency handling',
        'Error handling mentioned'
      ]
    },
    'data-flow': {
      criteria: [
        'Request path traced from client',
        'Each component role explained',
        'Database queries specified',
        'Cache hit/miss flows',
        'Response formation described'
      ]
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
  if (!llm) {
    return NextResponse.json({
      feedback: {
        score: 0,
        accuracy: 0,
        strengths: [],
        weaknesses: ['AI evaluation not available. Please set GOOGLE_API_KEY in your environment.'],
        missed: [],
        isAcceptable: false
      }
    });
  }

  try {
    const { problem, phase, subStep, userAnswer, problemDetails } = await req.json();

    // Get evaluation criteria
    const phaseKey = phase.toLowerCase().replace('-', '').replace(' ', '') as keyof typeof EVALUATION_GUIDES;
    const stepKey = subStep as string;
    const phaseGuide = EVALUATION_GUIDES[phaseKey];
    const guide: any = phaseGuide ? (phaseGuide as any)[stepKey] : null;

    const problemTitle = problemDetails?.title || problem;
    const problemDesc = problemDetails?.description || '';

    const evaluationPrompt = `You are an expert FAANG system design interviewer (ex-Meta, Google, Amazon). 
You are evaluating a candidate's answer for the problem: "${problemTitle}" - ${problemDesc}

**Current Phase:** ${phase}
**Current Step:** ${subStep}

**Evaluation Criteria:**
${guide?.criteria ? JSON.stringify(guide.criteria, null, 2) : 'General system design principles'}

**Expected Elements (Examples):**
${guide?.examples?.[problemTitle] ? guide.examples[problemTitle].join('\n') : 'Use your expertise for this problem'}

**Candidate's Answer:**
${userAnswer}

**Your Task:**
Evaluate the answer critically but fairly. Consider:
1. Completeness - Did they cover the key points for this specific step?
2. Depth - Is their understanding deep enough?
3. Correctness - Are there any technical errors?
4. Relevance - Is it appropriate for "${problemTitle}"?

**IMPORTANT:** Be specific to the problem "${problemTitle}". Generic answers should score lower.

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
- 9-10: Excellent, comprehensive, demonstrates deep understanding
- 7-8: Good, covers most points, minor gaps
- 5-6: Adequate but missing key elements
- 3-4: Incomplete, significant gaps
- 1-2: Very weak, fundamental misunderstandings

Be constructive but honest. This is practice for a real interview.`;

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
