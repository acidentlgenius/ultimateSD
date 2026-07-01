import { Article } from "@/lib/blog";

export const tinyUrlArticle: Article = {
  metadata: {
    id: "tinyurl-system-design",
    slug: "tinyurl-system-design",
    title: "System Design: TinyURL (URL Shortener)",
    description: "Learn how to design a URL shortening service like bit.ly. We cover base62 encoding, database schema, caching, and more.",
    date: "2024-03-15",
    author: "System Design Prep",
    readingTime: "15 min read",
    difficulty: "Beginner",
    tags: ["System Design", "Backend", "Databases"],
    featured: true,
  },
  sections: [
    {
      id: "problem-statement",
      title: "Problem Statement",
      defaultExpanded: true,
      collapsible: true,
      blocks: [
        {
          id: "ps-1",
          type: "markdown",
          content: "A URL shortener is a service that creates a shorter alias for a long URL. Users can click on the short URL, and they will be redirected to the original long URL. This is useful for saving space, especially in environments with character limits like Twitter, or for making URLs easier to read and share."
        },
        {
          id: "ps-callout-1",
          type: "callout",
          variant: "tip",
          title: "Why is this asked?",
          content: "Designing a URL shortener is a classic, introductory system design question. It tests your basic understanding of API design, databases, hashing/encoding, and how to scale a read-heavy system."
        }
      ]
    },
    {
      id: "requirements",
      title: "Requirements",
      defaultExpanded: true,
      collapsible: true,
      blocks: [
        {
          id: "req-1",
          type: "markdown",
          content: "Before jumping into the design, it's crucial to clarify the requirements. Never assume you know what the interviewer wants."
        },
        {
          id: "req-func",
          type: "markdown",
          content: "**Functional Requirements:**\n- Given a long URL, our service should generate a shorter and unique alias of it.\n- When users access a short link, our service should redirect them to the original link.\n- Links will expire after a standard default timespan, but users should be able to specify the expiration time."
        },
        {
          id: "req-non-func",
          type: "markdown",
          content: "**Non-Functional Requirements:**\n- The system must be highly available. If the service is down, all URL redirections will start failing.\n- URL redirection should happen in real-time with minimal latency.\n- Shortened links should not be predictable (to prevent malicious users from guessing URLs)."
        },
        {
          id: "req-interview",
          type: "interviewNote",
          title: "Clarify the scope",
          content: "Always ask about custom aliases and analytics. For this guide, we'll assume analytics (tracking clicks) is a \"nice-to-have\" follow-up, but we won't prioritize it in the core design."
        }
      ]
    },
    {
      id: "capacity-estimation",
      title: "Capacity Estimation",
      defaultExpanded: false,
      collapsible: true,
      blocks: [
        {
          id: "cap-1",
          type: "markdown",
          content: "Let's assume a write-to-read ratio of 1:10 (it's a heavily read-dominated system)."
        },
        {
          id: "cap-assumptions",
          type: "markdown",
          content: "- **New URLs per month:** 100 Million\n- **Read requests per month:** 100M * 10 = 1 Billion\n- **QPS (Writes):** 100M / (30 * 24 * 3600) = ~40 URLs/sec\n- **QPS (Reads):** 1 Billion / (30 * 24 * 3600) = ~400 URLs/sec"
        },
        {
          id: "cap-storage",
          type: "markdown",
          content: "**Storage Estimates:**\nAssume we store URLs for 10 years. We will have 100M * 12 * 10 = 12 Billion records. If each record is roughly 500 bytes, we need 12B * 500 bytes = **6 TB of storage**."
        }
      ]
    },
    {
      id: "api-design",
      title: "API Design",
      defaultExpanded: false,
      collapsible: true,
      blocks: [
        {
          id: "api-1",
          type: "markdown",
          content: "We need two main REST APIs: one for creating a short URL, and one for redirecting."
        },
        {
          id: "api-create",
          type: "code",
          language: "typescript",
          filename: "POST /api/v1/data/shorten",
          code: `// Request
{
  "longUrl": "https://www.educative.io/courses/grokking-the-system-design-interview",
  "customAlias": "grokking", // optional
  "expireDate": "2025-01-01" // optional
}

// Response (201 Created)
{
  "shortUrl": "https://tinyurl.com/grokking"
}`
        },
        {
          id: "api-redirect",
          type: "code",
          language: "http",
          filename: "GET /{shortUrl}",
          code: `GET /grokking HTTP/1.1
Host: tinyurl.com

HTTP/1.1 301 Moved Permanently
Location: https://www.educative.io/courses/...`
        },
        {
          id: "api-redirect-tradeoff",
          type: "tradeoff",
          title: "301 vs 302 Redirect",
          pros: [
            "301 (Permanent): Browsers cache the response. Reduces load on our servers.",
            "302 (Temporary): Browsers contact our server every time. Good for analytics (tracking clicks)."
          ],
          cons: [
            "301: We can't track analytics reliably since the browser skips our server after the first visit.",
            "302: Higher latency for the user and higher load on our servers."
          ]
        }
      ]
    },
    {
      id: "database-schema",
      title: "Database Schema",
      defaultExpanded: false,
      collapsible: true,
      blocks: [
        {
          id: "db-1",
          type: "markdown",
          content: "What kind of database should we use? We have billions of records, but each record is very small (< 1KB). There are no relationships between records. It's a read-heavy system."
        },
        {
          id: "db-compare",
          type: "comparison",
          title: "SQL vs NoSQL",
          headers: ["Feature", "SQL (e.g., PostgreSQL)", "NoSQL (e.g., DynamoDB/Cassandra)"],
          rows: [
            ["Scalability", "Harder to scale horizontally (sharding is complex)", "Easy to scale horizontally natively"],
            ["Schema flexibility", "Rigid", "Flexible"],
            ["Relationships", "Great, but we don't need them", "Not great, but we don't care"]
          ]
        },
        {
          id: "db-callout",
          type: "callout",
          variant: "success",
          title: "Conclusion",
          content: "A NoSQL database like DynamoDB or Cassandra is a great fit here because we need high availability, easy horizontal scaling, and a simple key-value structure."
        },
        {
          id: "db-schema",
          type: "code",
          language: "sql",
          filename: "URL Table",
          code: `Table: URL
- hash (PK) : varchar(10)
- original_url: varchar(2048)
- created_at: timestamp
- expiration_date: timestamp
- user_id: int`
        }
      ]
    },
    {
      id: "url-generation",
      title: "URL Generation Strategy",
      defaultExpanded: false,
      collapsible: true,
      blocks: [
        {
          id: "url-1",
          type: "markdown",
          content: "How do we generate the 7-character string? There are two main approaches: Hashing and Base62 Encoding."
        },
        {
          id: "url-hash",
          type: "markdown",
          content: "### Approach 1: Hashing (MD5 or SHA256)\nWe can hash the long URL using MD5, which gives a 128-bit string. We can take the first 7 characters. **Problem:** Two different long URLs might hash to the same first 7 characters (Collision). We'd need to handle collisions by appending a sequence number and re-hashing."
        },
        {
          id: "url-base62",
          type: "markdown",
          content: "### Approach 2: Base62 Encoding (Recommended)\nBase62 uses [a-z, A-Z, 0-9] (26 + 26 + 10 = 62 characters). \nA 7-character base62 string can represent 62^7 = ~3.5 Trillion unique URLs. This is more than enough!\n\nInstead of hashing the URL, we use a global, auto-incrementing ID generator. We take that unique numeric ID and convert it to Base62."
        },
        {
          id: "url-quiz",
          type: "quiz",
          question: "Why use Base62 instead of Base64?",
          options: [
            "Base62 is faster to compute.",
            "Base64 includes characters like + and / which are not URL-safe.",
            "Base62 generates shorter strings.",
            "Base62 provides better security."
          ],
          correctAnswerIndex: 1,
          explanation: "Base64 includes '+' and '/' (or '-' and '_'). While URL-safe Base64 exists, Base62 strictly uses alphanumeric characters, ensuring zero ambiguity in any URL or text parsing scenario."
        }
      ]
    },
    {
      id: "architecture",
      title: "High Level Architecture",
      defaultExpanded: false,
      collapsible: true,
      blocks: [
        {
          id: "arch-diag",
          type: "diagram",
          title: "System Flow",
          diagramId: "tinyurl-architecture" // Placeholder for an actual SVG diagram ID
        },
        {
          id: "arch-steps",
          type: "markdown",
          content: "1. Client sends a `POST` request to shorten a URL.\n2. The Web Server talks to a Token Generation Service (or Ticket Server) to get a unique numeric ID.\n3. The Web Server encodes the ID to Base62 to get the short code.\n4. The Web Server saves the `(short_code, original_url)` mapping in the NoSQL database.\n5. The short URL is returned to the client."
        }
      ]
    },
    {
      id: "optimizations",
      title: "Optimizations & Scalability",
      defaultExpanded: false,
      collapsible: true,
      blocks: [
        {
          id: "opt-cache",
          type: "markdown",
          content: "### Caching\nSince our system is read-heavy, caching is crucial. We should cache frequently accessed URLs using an in-memory cache like **Redis** or **Memcached**."
        },
        {
          id: "opt-cache-rule",
          type: "callout",
          variant: "info",
          title: "Cache Eviction Policy",
          content: "We don't have space to cache all URLs. We should use an LRU (Least Recently Used) eviction policy. A good rule of thumb is to cache 20% of daily read traffic."
        },
        {
          id: "opt-cleanup",
          type: "markdown",
          content: "### Data Cleanup\nIf a link expires, how do we delete it? \n- **Lazy Cleanup:** Delete it only when someone tries to visit it.\n- **Background Worker:** A cron job periodically sweeps the database and removes expired links. (Best approach is a combination of both)."
        }
      ]
    }
  ]
};
