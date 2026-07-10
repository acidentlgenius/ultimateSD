import { Guide } from '@/lib/guides';

export const parkingLotGuide: Guide = {
  metadata: {
    slug: 'design-parking-lot',
    problemSlug: 'design-parking-lot',
    title: 'Design a Parking Lot System',
    seoTitle: 'Design a Parking Lot System — System Design Interview Guide',
    description:
      'Step-by-step guide to the parking lot system design interview question: requirements, entity model, concurrent spot allocation across multiple gates without double-assignment, pricing and exit flow, and handling payment outages gracefully.',
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-10',
    readingTime: '13 min read',
    keywords: [
      'parking lot system design',
      'design a parking lot interview',
      'parking lot low level design',
      'spot allocation concurrency',
      'object oriented design parking lot',
      'system design interview',
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
            'A parking lot system runs an automated garage: cameras read license plates at the gates, the system assigns each vehicle a free spot of the right size, and it computes a fee when the vehicle leaves. There is no web-scale traffic here — and that is the point. Interviewers use this question to see whether you can **model a real-world domain cleanly** (spots, vehicles, tickets, rates) and whether you understand **concurrency at small scale**: six gates admitting vehicles at the same time must never assign the same spot twice.\n\nIt is a classic first system design question and a favorite for testing object-oriented modeling. Beginners often treat it as a pure class-diagram exercise; the stronger answer also covers the two operational realities in the prompt — the allocation race between gates, and keeping gates moving when the payment provider is down.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'Model spots, vehicles, and parking sessions (tickets) in a relational database. On entry, atomically claim the nearest free spot that fits the vehicle — a single conditional UPDATE inside a transaction, so two gates can never grab the same spot. On exit, compute the fee from entry time, duration, and vehicle type. If payments are down, open the gate anyway and record the amount owed. Occupancy counts are derived from spot states, not tracked separately.',
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
            'The facility: **4 levels, ~2,000 spots** across car, motorcycle, and truck sizes, with **camera-based plate recognition at 6 entry/exit gates**. Peak flow is **~10 vehicles/minute per gate** at rush hour.\n\n**Functional requirements**\n\n- Admit a vehicle and assign the **nearest free spot** matching its size.\n- Track entry and exit times per vehicle via plate recognition.\n- Compute parking fees from **duration and vehicle type** on exit.\n- Show real-time space availability per level at gates and online.\n- Let operators manage pricing, close levels, and view occupancy analytics.\n\n**Non-functional requirements**\n\n- **Gate decision (spot assignment) in under 2 seconds** per vehicle — a slow gate backs up traffic onto the street.\n- **No double-allocation of a spot**, even with 6 gates operating concurrently.\n- Gates keep admitting vehicles (**degraded mode**) if payments are down for up to 10 minutes.\n- Occupancy counts **accurate within 1 spot** at all times.',
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Name the hard requirement early',
          content:
            'The sentence that shapes this whole design is: "Six gates allocate spots concurrently, so correctness of allocation matters more than throughput." Saying this in the first five minutes tells the interviewer you found the actual problem — most of the system is straightforward CRUD around one contested operation.',
        },
      ],
    },
    {
      id: 'scale',
      title: 'Step 2 — Scale check: this is a correctness problem, not a scale problem',
      blocks: [
        {
          id: 'scale-1',
          type: 'markdown',
          content:
            'Run the numbers before reaching for distributed-systems machinery:\n\n- **Peak entry rate:** 6 gates × 10 vehicles/min = 60 vehicles/min = **1 allocation per second**. Off-peak it is far less.\n- **Data volume:** 2,000 spot rows, a few thousand parking sessions per day. Years of history fit in a few gigabytes.\n- **Read load:** occupancy displays refresh every few seconds — trivial.\n\nOne modest relational database handles this with three orders of magnitude of headroom. The design challenge is not "how do I scale?" but "how do I make one operation — claim a spot — **atomic** across concurrent gates, and how do I keep the gates open when a dependency fails?"',
        },
        {
          id: 'scale-callout',
          type: 'callout',
          variant: 'info',
          title: 'Why say this out loud?',
          content:
            'Explicitly stating "1 write per second — a single Postgres instance is enough" prevents the most common failure mode on easy questions: over-engineering. Sharding, Kafka, or microservices for 2,000 parking spots signals you scale designs by habit rather than by numbers.',
        },
      ],
    },
    {
      id: 'data-model',
      title: 'Step 3 — Entities and data model',
      blocks: [
        {
          id: 'model-1',
          type: 'markdown',
          content:
            'Four core entities cover the domain:\n\n- **Spot** — one row per physical spot: level, spot number, size class, and current status. This row is the unit of contention.\n- **Vehicle** — identified by license plate (the cameras give you this for free); carries the size class used for matching and pricing.\n- **ParkingSession** (the "ticket") — one row per visit: plate, assigned spot, entry time, exit time, computed fee, payment status.\n- **RatePlan** — per vehicle type and per level, editable by operators.\n\nSpot sizes nest: a motorcycle fits in a car spot, a car fits in a truck spot — but not the reverse. Encode this as an ordered size class and allocate the smallest class that fits, so trucks are not blocked by cars sitting in the only large spots.',
        },
        {
          id: 'model-schema',
          type: 'code',
          language: 'sql',
          filename: 'Core tables',
          code: `CREATE TABLE spots (
  id          BIGINT PRIMARY KEY,
  level       INT NOT NULL,             -- 1..4
  spot_number INT NOT NULL,
  size        SMALLINT NOT NULL,        -- 1=motorcycle, 2=car, 3=truck
  status      TEXT NOT NULL DEFAULT 'FREE',  -- FREE | OCCUPIED | CLOSED
  distance_rank INT NOT NULL            -- precomputed "nearness" to gates
);

CREATE TABLE parking_sessions (
  id           BIGINT PRIMARY KEY,
  plate        TEXT NOT NULL,
  vehicle_size SMALLINT NOT NULL,
  spot_id      BIGINT REFERENCES spots(id),
  entered_at   TIMESTAMP NOT NULL DEFAULT now(),
  exited_at    TIMESTAMP,
  fee_cents    INT,
  payment_status TEXT NOT NULL DEFAULT 'PENDING'  -- PENDING | PAID | OWED
);

CREATE INDEX idx_spots_free
  ON spots (size, distance_rank) WHERE status = 'FREE';`,
        },
        {
          id: 'model-2',
          type: 'markdown',
          content:
            '"Nearest suitable spot" needs a definition of *near*. Do not compute geometry at gate time — precompute a `distance_rank` per spot (per gate, if gates differ meaningfully) when the lot is configured. Allocation then becomes "lowest-ranked FREE spot of a fitting size", which is a single indexed query. The partial index above makes that lookup fast and keeps it fast as the lot fills.',
        },
      ],
    },
    {
      id: 'allocation',
      title: 'Step 4 — Concurrent spot allocation (the core of the interview)',
      blocks: [
        {
          id: 'alloc-1',
          type: 'markdown',
          content:
            'Here is the race that decides this interview. The naive gate logic is:\n\n1. `SELECT` the nearest free spot for this vehicle size.\n2. `UPDATE` it to OCCUPIED and create the session.\n\nWith one gate this works. With six gates, two vehicles arriving in the same second can both run step 1, see the **same free spot**, and both "win" step 2 — two cars sent to one spot. This is a textbook **read-then-write race**, and fixing it is the whole point of the question.\n\nThree standard fixes, in increasing order of ceremony:',
        },
        {
          id: 'alloc-comparison',
          type: 'comparison',
          title: 'Preventing double-allocation',
          headers: ['Approach', 'How it works', 'Pros', 'Cons'],
          rows: [
            [
              'Atomic conditional claim (recommended)',
              'One statement: UPDATE the best spot only if it is still FREE; row locking makes concurrent claimers take different rows',
              'Correct by construction, one round-trip, easily meets the 2-second gate budget',
              'Ties allocation logic to the database; needs care with lock waits under contention',
            ],
            [
              'Pessimistic lock (SELECT ... FOR UPDATE)',
              'Lock the candidate row inside a transaction, then update it',
              'Simple to reason about; standard SQL',
              'A second gate blocks on the same row; use SKIP LOCKED so it takes the next spot instead of waiting',
            ],
            [
              'Single allocator process / queue',
              'All 6 gates send requests to one serialized allocator (in-process or via a queue)',
              'No DB-level concurrency at all; trivial to reason about',
              'The allocator is a single point of failure and adds a component — overkill at 1 request/sec, but a fine mention',
            ],
          ],
        },
        {
          id: 'alloc-code',
          type: 'code',
          language: 'sql',
          filename: 'Atomic claim — one statement, no race',
          code: `UPDATE spots
SET status = 'OCCUPIED'
WHERE id = (
  SELECT id FROM spots
  WHERE status = 'FREE'
    AND size >= :vehicle_size          -- smallest fitting class first
  ORDER BY size ASC, distance_rank ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED               -- concurrent gates skip contested rows
)
RETURNING id, level, spot_number;`,
        },
        {
          id: 'alloc-2',
          type: 'markdown',
          content:
            'Walk through why this is safe: the inner `SELECT ... FOR UPDATE SKIP LOCKED` locks the chosen row, and any other gate running the same query at the same instant *skips* that locked row and picks the next-nearest spot. Both vehicles get valid, distinct spots in one round-trip each. If the query returns no row, the lot (or that size class) is full — reject at the gate and show "FULL" on the display.\n\nTwo details worth mentioning unprompted:\n\n- **Idempotency:** cameras can double-fire on one vehicle. Key the session on `(plate, open session)` — if a plate already has an open session, return the existing assignment instead of allocating a second spot.\n- **Closed levels:** operators can close a level; add `AND level NOT IN (SELECT ...closed levels)` or fold a `CLOSED` status into the spot rows so allocation respects it automatically.',
        },
        {
          id: 'alloc-note',
          type: 'interviewNote',
          title: 'The follow-up you should expect',
          content:
            '"What if you had 100 garages, each with its own gates?" The answer stays the same shape: contention is per-spot and per-garage, so each garage\'s database (or partition) serializes its own claims. This question tests whether you know the atomic-claim pattern generalizes — it is the same pattern as seat booking, inventory reservation, and ride-hailing driver assignment.',
        },
      ],
    },
    {
      id: 'exit-pricing',
      title: 'Step 5 — Exit flow, pricing, and surviving a payment outage',
      blocks: [
        {
          id: 'exit-1',
          type: 'markdown',
          content:
            'The exit flow mirrors entry: the camera reads the plate, the system finds the open session, computes the fee, takes payment, frees the spot, and opens the gate.\n\n**Pricing** is a function of duration and vehicle type — `fee = rate(vehicle_type, level) × billable_hours`, with common wrinkles like a grace period (first 15 minutes free) and a daily cap. Keep rates in the `RatePlan` table so operators can change them without a deploy; **snapshot the rate onto the session at entry** so a mid-stay price change does not surprise the driver.\n\n**Freeing the spot and closing the session must be atomic** — one transaction sets `exited_at`, writes the fee, and flips the spot back to FREE. If these were separate writes and the second failed, you would leak a spot (marked occupied forever) or double-free it.',
        },
        {
          id: 'exit-2',
          type: 'markdown',
          content:
            'Now the requirement that separates good answers: **gates keep admitting vehicles if payments are down for up to 10 minutes**. The insight is that payment is not actually required to operate a gate — the plate is the identity, and the debt can be collected later.\n\n- **Exit during outage:** compute the fee, mark the session `OWED` instead of `PAID`, open the gate. Retry the charge in the background; if the driver returns, settle the balance on the next visit.\n- **Entry during outage:** entry never touches the payment provider at all — allocation is purely internal, so entries are unaffected by design. Point this out; it shows you decomposed the dependencies.\n- Queue failed charges durably (a simple `pending_charges` table works) and process them when the provider recovers.',
        },
        {
          id: 'exit-tradeoff',
          type: 'tradeoff',
          title: 'Fail-open gates during payment outages',
          pros: [
            'Traffic keeps flowing — a blocked exit lane at rush hour is a physical-world incident, not just an error rate',
            'Plate recognition means identity survives the outage; revenue is deferred, not lost',
            'Decouples the gate-decision path (must be fast and available) from the payment path (can be async)',
          ],
          cons: [
            'Some fees become uncollectable if a driver never returns — an explicit, bounded revenue risk',
            'Needs a reconciliation job and an OWED state, adding a little lifecycle complexity',
            'Requires a business sign-off: engineering alone cannot decide to let cars leave without paying',
          ],
        },
      ],
    },
    {
      id: 'occupancy',
      title: 'Step 6 — Occupancy counts and the operator dashboard',
      blocks: [
        {
          id: 'occ-1',
          type: 'markdown',
          content:
            'The requirement is occupancy **accurate within 1 spot at all times**. There are two ways to produce a per-level count:\n\n1. **Derive it:** `SELECT level, count(*) FROM spots WHERE status = \'FREE\' GROUP BY level`. Always consistent with the source of truth, because it *is* the source of truth. At 2,000 rows this query is effectively free — cache it for a second if you like.\n2. **Maintain counters:** increment/decrement a per-level counter on every entry/exit. Faster in theory, but every code path that touches a spot must also touch the counter, and any missed update makes the count silently drift.\n\nAt this scale, **derive it**. Counters are the right tool when counting rows is genuinely expensive (millions of rows, thousands of updates/sec) — earning the "accurate within 1 spot" guarantee for free by deriving from spot state is the better trade here.\n\nFor gate displays and the online availability view, poll the derived count every 1–2 seconds or push updates over a WebSocket/SSE channel; either comfortably meets a "real-time" bar for parking. The operator dashboard reads the same data plus session history for analytics (peak hours, average stay, revenue per level).',
        },
      ],
    },
    {
      id: 'mistakes',
      title: 'Common mistakes that cost offers',
      blocks: [
        {
          id: 'mistakes-1',
          type: 'markdown',
          content:
            '1. **Class diagrams only.** Modeling `Vehicle`, `Spot`, and inheritance for 20 minutes without ever addressing the six-gate allocation race — the concurrency story is the question.\n2. **Check-then-act allocation.** Presenting SELECT-then-UPDATE as the answer. If the interviewer asks "what if two gates do this at once?" and you have to patch it live, you have lost the core point.\n3. **Over-engineering.** Sharded databases, Kafka, and a microservice per entity for 1 write/sec. Match the design to the numbers you stated in step 2.\n4. **Coupling gates to payments.** If your exit gate cannot open without a successful charge, the 10-minute-outage requirement fails. Payment is deferrable; gate movement is not.\n5. **Forgetting spot-size nesting.** Assigning a motorcycle to the last truck spot, then turning away a truck. Allocate smallest-fitting-class first.\n6. **No idempotency at the gate.** Cameras re-fire; without an open-session check, one car consumes two spots.',
        },
        {
          id: 'mistakes-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Unprompted mentions of: SKIP LOCKED (or an equivalent atomic-claim pattern) by name; snapshotting the rate plan onto the session at entry; a reconciliation job for OWED sessions; and the observation that this is the same reservation pattern as ticket booking and inventory systems. Any one of these moves your grade up a notch.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Is the parking lot question a system design or object-oriented design question?',
      answer:
        'It is asked both ways. As an OOD question the focus is classes and state machines; as a system design question the focus shifts to the data model, the concurrent spot-allocation race across multiple gates, and operational concerns like payment outages. A strong answer covers the entity model briefly and spends most of the time on allocation correctness and the exit flow.',
    },
    {
      question: 'How do you prevent two gates from assigning the same parking spot?',
      answer:
        'Make the claim atomic. In a relational database, use a single conditional UPDATE that selects the nearest free spot with FOR UPDATE SKIP LOCKED, so concurrent gates lock different rows and each receives a distinct spot. Alternatives are a pessimistic transaction that locks the candidate row, or serializing all allocations through a single allocator process.',
    },
    {
      question: 'Do you need a distributed system for a parking lot?',
      answer:
        'No. Six gates at ten vehicles per minute each is about one allocation per second, and two thousand spots is a tiny dataset. A single relational database with an atomic claim query meets the two-second gate budget with large headroom. The interview rewards recognizing this and focusing on correctness instead of scale.',
    },
    {
      question: 'What happens if the payment system goes down?',
      answer:
        'Gates fail open. Entry never depends on payments, and on exit the system computes the fee, marks the session as owed, opens the gate, and retries the charge in the background. License plate recognition preserves identity, so the debt can be settled later or on the next visit. Blocking exits during an outage creates a physical traffic incident, which is worse than deferred revenue.',
    },
  ],
};
