import { Guide } from '@/lib/guides';

export const whatsappGuide: Guide = {
  metadata: {
    slug: 'design-whatsapp',
    problemSlug: 'design-whatsapp',
    title: 'Design WhatsApp (Real-Time Chat)',
    seoTitle: 'Design WhatsApp — System Design Interview Guide (Chat System)',
    description:
      'How to design WhatsApp in a system design interview: WebSocket gateways, message delivery and ordering, offline storage, group fan-out, and end-to-end encryption — with interactive simulations of the hard parts.',
    publishedAt: '2026-07-04',
    updatedAt: '2026-07-04',
    readingTime: '16 min read',
    keywords: [
      'whatsapp system design',
      'design whatsapp interview',
      'chat system design',
      'messenger system design',
      'websocket architecture',
      'end to end encryption system design',
    ],
  },
  sections: [
    {
      id: 'why-this-question',
      title: 'Why interviewers ask this question',
      blocks: [
        {
          id: 'why-1',
          type: 'markdown',
          content:
            'Designing WhatsApp (or Messenger, Signal, Slack — the same question in different clothes) tests things a CRUD app never touches: **persistent connections**, **message delivery guarantees**, **ordering**, and **fan-out**. It is a staple at Meta, and common everywhere for mid-to-senior roles.\n\nThe question has a distinctive shape: the hard part is not storage or compute, it is that **both ends of the system are unreliable phones** that connect, disconnect, and change networks constantly — and users still expect every message to arrive exactly once, in order.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'Each phone holds a WebSocket to a chat gateway. A session service tracks which gateway each user is on. Messages route sender → gateway → chat service → recipient\'s gateway; if the recipient is offline, the message parks in a per-user inbox and a push notification fires. Acks at each hop give at-least-once delivery; per-conversation sequence numbers give ordering; E2E encryption means servers only ever see ciphertext.',
        },
      ],
    },
    {
      id: 'requirements',
      title: 'Step 1 — Requirements',
      blocks: [
        {
          id: 'req-1',
          type: 'markdown',
          content:
            '**Functional requirements**\n\n- 1:1 real-time text messaging with delivery states (sent ✓, delivered ✓✓, read).\n- Group chats (cap them — WhatsApp allows 1,024 members; say the number out loud).\n- Offline delivery: messages sent while a user is offline arrive when they reconnect.\n- Online/last-seen presence.\n- (De-scope after mentioning) media messages, voice/video calls, stories.\n\n**Non-functional requirements**\n\n- **Scale:** ~2B users, ~100B messages/day ≈ **1.2M messages/sec** average, several × at peak.\n- **Latency:** sub-second delivery when both parties are online.\n- **Delivery guarantee:** at-least-once with idempotent handling — losing messages is the one unforgivable sin in chat.\n- **Privacy:** end-to-end encryption; the server must not be able to read messages.',
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Scope it fast',
          content:
            'Candidates who try to design messaging + calls + stories in 45 minutes design none of them. Say: "I\'ll design 1:1 messaging deeply, extend it to groups, and touch encryption — calls and media are out of scope unless you want them." Interviewers respect controlled scope.',
        },
      ],
    },
    {
      id: 'connections',
      title: 'Step 2 — The connection layer: why WebSockets',
      blocks: [
        {
          id: 'conn-1',
          type: 'markdown',
          content:
            'HTTP request/response cannot deliver a message *to* a phone — the server cannot initiate. Three options exist:',
        },
        {
          id: 'conn-comparison',
          type: 'comparison',
          title: 'Getting messages to the client',
          headers: ['Technique', 'How', 'Verdict for chat'],
          rows: [
            [
              'Short polling',
              'Client asks "anything new?" every few seconds',
              'Wasteful at 2B users; seconds of latency — no',
            ],
            [
              'Long polling',
              'Server holds the request open until a message arrives',
              'Better, but reconnect churn and one-directional — fallback only',
            ],
            [
              'WebSocket',
              'One persistent, bidirectional TCP connection',
              'The answer: server pushes instantly, client sends on the same socket',
            ],
          ],
        },
        {
          id: 'conn-2',
          type: 'markdown',
          content:
            'Each user keeps one WebSocket to a **chat gateway** server. A tuned server holds on the order of **a few hundred thousand to 1M idle connections**, so ~500M concurrent users needs a fleet of roughly a thousand gateways.\n\nThat creates the routing problem the whole design hinges on: *user B is connected to some gateway — which one?* A **session service** (backed by Redis) maps `userId → gatewayId`, written on connect and cleared on disconnect. Message flow: sender → their gateway → chat service → look up B\'s gateway in the session service → push down B\'s socket.',
        },
        {
          id: 'conn-widget',
          type: 'widget',
          widgetId: 'socket-pulse',
          title: 'WebSocket vs polling, live',
          caption:
            'Watch how messages flow over a persistent socket versus repeated polling — and what happens to latency and wasted requests as message rate changes.',
        },
      ],
    },
    {
      id: 'delivery',
      title: 'Step 3 — Delivery guarantees, ordering, and offline users',
      blocks: [
        {
          id: 'del-1',
          type: 'markdown',
          content:
            'This section is where senior candidates separate from junior ones. Walk the lifecycle of one message:\n\n1. **A sends.** Client assigns a client-generated message ID (for idempotency) and sends over its socket.\n2. **Server persists first, acks second.** The chat service writes the message to storage *before* acking — an ack means "durable", not "I saw it". A\'s app shows ✓.\n3. **Deliver to B.** Session lookup finds B\'s gateway; the message is pushed. B\'s device acks receipt → A sees ✓✓. Read receipts are the same mechanism, triggered on view.\n4. **B is offline?** The session lookup fails, so the message stays in B\'s **inbox** (a per-user queue of undelivered messages), and a push notification fires via APNs/FCM. On reconnect, B drains the inbox, acking each message; acked messages are deleted.\n\n**At-least-once + idempotency = effectively exactly-once.** Retries can cause duplicates, so B deduplicates by the client-generated message ID.\n\n**Ordering:** timestamps lie (clock skew, retries). Use a **per-conversation monotonic sequence number** assigned by whichever chat-service shard owns that conversation. Devices sort by it and can detect gaps ("message 41, 42, 44 — request 43").',
        },
        {
          id: 'del-widget',
          type: 'widget',
          widgetId: 'message-queue-visualizer',
          title: 'Queues and acknowledgements, live',
          caption:
            'See how messages park in a queue for an offline consumer, and how acks remove them — the exact mechanic behind the offline inbox.',
        },
        {
          id: 'del-callout',
          type: 'callout',
          variant: 'warning',
          title: 'Follow-up they will ask',
          content:
            '"What if the gateway crashes after the server ack but before delivery to B?" Answer: nothing is lost — the message is already durable in B\'s inbox; delivery is retried until B acks. This is exactly why you persist before acking.',
        },
      ],
    },
    {
      id: 'storage',
      title: 'Step 4 — Storage: 100B messages/day',
      blocks: [
        {
          id: 'store-1',
          type: 'markdown',
          content:
            '100B messages/day at ~200 bytes is ~20 TB/day of writes — this is a **write-heavy, append-only** workload with reads that are almost always "recent messages in one conversation". That access pattern points directly at a wide-column store (Cassandra/HBase — Discord famously runs on Cassandra, then ScyllaDB):\n\n- **Partition key:** `conversation_id` — all messages of a chat live together.\n- **Clustering key:** `sequence_number` (descending) — "load the last 50 messages" is one contiguous read.\n- Writes go to any replica (leaderless, tunable consistency), which is what lets it absorb 1M+ writes/sec.\n\nWhatsApp\'s actual model is even cheaper: the server is a **relay, not an archive** — messages are deleted once delivered, and history lives on devices. Offering both models and their trade-off (server history = multi-device sync + storage cost; device history = privacy + cheap servers) is a strong senior move.',
        },
        {
          id: 'store-schema',
          type: 'code',
          language: 'sql',
          filename: 'messages table (Cassandra-style)',
          code: `CREATE TABLE messages (
  conversation_id  UUID,
  seq              BIGINT,        -- per-conversation sequence number
  sender_id        BIGINT,
  ciphertext       BLOB,          -- E2E encrypted; server never sees plaintext
  sent_at          TIMESTAMP,
  PRIMARY KEY ((conversation_id), seq)
) WITH CLUSTERING ORDER BY (seq DESC);`,
        },
      ],
    },
    {
      id: 'groups',
      title: 'Step 5 — Group chats: the fan-out problem',
      blocks: [
        {
          id: 'group-1',
          type: 'markdown',
          content:
            'A message to a 1,024-member group is not one message — it is **one write, 1,024 deliveries**. The chat service reads the member list, then for each member does the same session-lookup-and-push (or inbox-park) as the 1:1 case.\n\n- Fan-out happens **asynchronously** via a queue — the sender\'s ack must not wait for 1,024 pushes.\n- This is precisely why WhatsApp caps group size: fan-out cost grows linearly with members. Saying "the cap is a deliberate architectural choice, not a product whim" is a great line.\n- Presence has the same explosion: naively broadcasting online/offline to every contact is O(contacts) per status flap — batch it, debounce it, and only push presence for open conversations.',
        },
        {
          id: 'group-tradeoff',
          type: 'tradeoff',
          title: 'Fan-out on write (push to every member immediately)',
          pros: [
            'Instant delivery to online members',
            'Simple read path — each user just reads their own inbox',
          ],
          cons: [
            'Large groups amplify every message ×N',
            'Wasted work for members who never open the chat',
            'Hot groups (breaking-news channels) need special-casing toward fan-out-on-read',
          ],
        },
      ],
    },
    {
      id: 'encryption',
      title: 'Step 6 — End-to-end encryption',
      blocks: [
        {
          id: 'enc-1',
          type: 'markdown',
          content:
            'You will not be asked to derive the Signal protocol, but you must get the model right:\n\n- **E2E means the server relays ciphertext it cannot read.** TLS alone is *not* E2E — TLS protects the pipe, but the server sees plaintext.\n- Each user has a **public/private key pair**; private keys never leave the device. Senders encrypt with the recipient\'s public key (in practice, a session key established via Diffie-Hellman key exchange — the Signal protocol adds forward secrecy by ratcheting keys every message).\n- **Consequences for your design** (this is what interviewers actually probe): the server cannot search message content, cannot moderate content server-side, and multi-device support becomes genuinely hard — each device has its own keys, so messages are encrypted per-device.',
        },
        {
          id: 'enc-widget',
          type: 'widget',
          widgetId: 'e2e-encryption-demo',
          title: 'End-to-end encryption, live',
          caption:
            'Step through key exchange and message encryption to see exactly what the server can and cannot read.',
        },
      ],
    },
    {
      id: 'mistakes',
      title: 'Common mistakes that cost offers',
      blocks: [
        {
          id: 'mist-1',
          type: 'markdown',
          content:
            '1. **Designing chat over HTTP polling** — the workload is push; reach for WebSockets in the first five minutes.\n2. **No session service.** "The gateway pushes to B" without explaining *how you find B\'s gateway* means the design does not actually work.\n3. **Acking before persisting** — one crash loses messages, and lost messages are game-over for a chat product.\n4. **Ordering by timestamp** — clock skew makes cross-device timestamps unreliable; per-conversation sequence numbers are the answer.\n5. **Ignoring offline delivery** — half of all deliveries in the real system go through the inbox + push-notification path, not the live socket.\n6. **Claiming TLS gives end-to-end encryption** — instant credibility loss on this question.',
        },
        {
          id: 'mist-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Graceful gateway drain on deploy (reconnect storms are real), idempotency keys end to end, backpressure when a device reconnects to a 10,000-message backlog, and the server-relay vs server-archive storage trade-off. Two of these unprompted is a strong-hire signal.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Why does WhatsApp use WebSockets instead of HTTP polling?',
      answer:
        'Chat requires the server to push messages to clients instantly. Polling wastes enormous resources at 2 billion users and adds seconds of latency, while a persistent WebSocket lets both sides send at any moment over one connection. Long polling survives only as a fallback for restrictive networks.',
    },
    {
      question: 'How does WhatsApp deliver messages to offline users?',
      answer:
        'Undelivered messages are stored in a per-user inbox queue on the server and a push notification is sent through APNs or FCM. When the device reconnects, it drains the inbox, acknowledges each message, and the server deletes acknowledged messages.',
    },
    {
      question: 'How do you guarantee message ordering in a chat system?',
      answer:
        'Assign a monotonically increasing sequence number per conversation from the service shard that owns the conversation, rather than trusting timestamps, which suffer from clock skew. Clients sort by sequence number and can detect and re-request missing messages.',
    },
    {
      question: 'What database should I propose for a chat system in an interview?',
      answer:
        'A wide-column store like Cassandra or ScyllaDB fits best: the workload is write-heavy and append-only, and partitioning by conversation ID with messages clustered by sequence number makes "recent messages in this chat" a single fast read. Also mention WhatsApp\'s alternative: delete on delivery and keep history on devices.',
    },
    {
      question: 'Is TLS the same as end-to-end encryption?',
      answer:
        'No. TLS encrypts the connection between client and server, but the server still sees plaintext. End-to-end encryption means only the communicating devices hold the decryption keys, so the server relays ciphertext it can never read.',
    },
  ],
};
