import { Guide } from '@/lib/guides';

export const elevatorSystemGuide: Guide = {
  metadata: {
    slug: 'design-elevator-system',
    problemSlug: 'design-elevator-system',
    title: 'Design an Elevator System',
    seoTitle: 'Design an Elevator System — System Design Interview Guide',
    description:
      'Step-by-step guide to the elevator system design interview question: requirements, the car state machine, SCAN/LOOK scheduling versus FCFS, multi-elevator dispatching, starvation avoidance, morning-rush handling, and fault tolerance.',
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-10',
    readingTime: '13 min read',
    keywords: [
      'elevator system design',
      'design an elevator interview',
      'elevator scheduling algorithm',
      'SCAN LOOK algorithm elevator',
      'elevator dispatching system design',
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
            'An elevator control system decides, for every button press in a building, which car should answer and in what order floors get served. There are no servers to shard and no petabytes to store — the entire question is **algorithms and state machines applied to a physical system**. Interviewers use it to test three things: can you model a stateful machine cleanly (a car with doors, direction, and load), can you reason about a scheduling algorithm and its failure modes (starvation, thrashing), and can you keep **safety invariants** separate from optimization logic.\n\nIt is a staple beginner question precisely because there is nowhere to hide behind buzzwords. Candidates who answer "first come, first served" and stop have missed the question; candidates who explain why elevators sweep in one direction — and what breaks that rule — stand out.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'Each car runs a state machine (idle, moving up, moving down, doors open) and serves floors using LOOK: keep moving in the current direction, stopping at requested floors, and reverse only when no requests remain ahead. A central dispatcher assigns each hall call to the car with the lowest estimated arrival cost, with aging so no call starves. Safety interlocks (doors, weight) live below the scheduler and cannot be overridden by it. If the dispatcher dies, cars fall back to serving their own calls independently.',
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
            'The building: a bank of **8 elevators in a 40-floor office tower** serving **~10,000 trips/day**. Morning rush concentrates traffic from the lobby to upper floors; lunch reverses it.\n\n**Functional requirements**\n\n- Accept **hall calls** (up/down buttons on each floor) and **car calls** (target floor pressed inside a car).\n- **Dispatch the best car** to each hall call to minimize average wait time.\n- Handle **car fault states** by re-assigning that car\'s pending calls to other cars.\n- Support **service modes**: independent service, fire service, and maintenance lockout.\n\n**Non-functional requirements**\n\n- Average passenger wait **under 30 seconds at peak load**.\n- Dispatch decision computed in **under 100ms** per hall call.\n- **Safety invariants** (doors, overload) can never be violated by scheduler bugs — **fail closed**.\n- System keeps operating with **any single car — or the dispatcher itself — failed**.\n\nOne clarification worth making: a hall call only says *up* or *down*, not the destination. The system learns the target floor only after the passenger boards and presses a car button. (If the interviewer offers destination-input panels in the lobby, that changes the problem — you can group passengers by destination — but assume classic two-button halls unless told otherwise.)',
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Separate the two sub-problems out loud',
          content:
            'Say early: "There are two distinct problems here — how one car orders its stops, and which car the dispatcher assigns to a hall call." Interviewers grade structure heavily on this question, and candidates who blur the per-car algorithm into the fleet-level dispatching usually get lost in their own answer.',
        },
      ],
    },
    {
      id: 'scale',
      title: 'Step 2 — Scale check: the constraint is physics, not throughput',
      blocks: [
        {
          id: 'scale-1',
          type: 'markdown',
          content:
            '10,000 trips/day is about **one hall call every 3–4 seconds on average**, with rush-hour peaks of maybe a few calls per second. Any single process handles this; the 100ms dispatch budget exists for passenger experience (the hall lantern should light immediately), not because computation is expensive.\n\nWhat is actually scarce is **car-seconds**: a car takes real time to travel 40 floors and every stop costs roughly 10 seconds of door cycling. The scheduler\'s job is to spend that scarce physical capacity well. This is why the interesting content of this interview is the algorithm, the state machine, and failure handling — say so, and do not spend time on databases or horizontal scaling. The system state (8 cars × position, direction, door state, pending calls) fits in a few kilobytes of memory.',
        },
      ],
    },
    {
      id: 'state-machine',
      title: 'Step 3 — The car state machine and safety invariants',
      blocks: [
        {
          id: 'sm-1',
          type: 'markdown',
          content:
            'Model each car as a state machine before touching scheduling — it is the foundation everything else sits on.\n\n**States:** `IDLE`, `MOVING_UP`, `MOVING_DOWN`, `DOORS_OPENING`, `DOORS_OPEN`, `DOORS_CLOSING`, plus out-of-service states: `FAULTED`, `MAINTENANCE`, `FIRE_SERVICE`, `INDEPENDENT`.\n\n**Legal transitions** encode the safety rules: the only path from `DOORS_OPEN` to `MOVING_*` runs through `DOORS_CLOSING` → doors-locked confirmation. There is deliberately **no transition** from any doors-open state to any moving state.',
        },
        {
          id: 'sm-code',
          type: 'code',
          language: 'text',
          filename: 'Car state machine (simplified)',
          code: `IDLE ──(assigned call)──▶ MOVING_UP / MOVING_DOWN
MOVING_* ──(arrive at stop)──▶ DOORS_OPENING ──▶ DOORS_OPEN
DOORS_OPEN ──(dwell timer, no obstruction)──▶ DOORS_CLOSING
DOORS_CLOSING ──(locked + not overloaded)──▶ MOVING_* or IDLE
DOORS_CLOSING ──(obstruction sensor)──▶ DOORS_OPENING   // reopen

any state ──(fault detected)──▶ FAULTED   // stop at next floor, open doors
FAULTED ──(technician reset)──▶ IDLE

// No edge exists from DOORS_OPEN/OPENING/CLOSING to MOVING_*.
// Overload sensor blocks the DOORS_CLOSING → MOVING_* edge.`,
        },
        {
          id: 'sm-2',
          type: 'markdown',
          content:
            'The requirement says scheduler bugs can never violate safety — which dictates an **architecture**, not just careful coding. Put safety in a layer *below* the dispatcher:\n\n- The **car controller** (in real systems, dedicated hardware plus interlocks) owns the state machine and refuses illegal transitions. It treats dispatcher output as *suggestions*: "go to floor 23" is obeyed only when the doors are locked and the car is under its weight limit.\n- The **dispatcher** optimizes assignments but physically cannot command "move with doors open" — no such input exists on the controller\'s interface.\n- **Fail closed:** on any fault or lost heartbeat, a car stops at the next floor, opens its doors, and takes itself out of the dispatch pool. A stopped elevator is safe; an optimally-scheduled one that moves with open doors is not.\n\nService modes are top-priority states that bypass scheduling entirely: **fire service** recalls the car to a designated floor and gives control to firefighters; **independent** serves only in-car buttons; **maintenance** locks the car out of the pool.',
        },
        {
          id: 'sm-callout',
          type: 'callout',
          variant: 'warning',
          title: 'Do not put safety checks inside the scheduler',
          content:
            'A common answer is "the scheduler checks the door sensor before sending a move command." That fails the requirement: a scheduler bug then violates safety. The invariant must be enforced by the layer that executes movement, so that even a malicious dispatcher could not break it. This layering pattern — optimization above, invariants below — generalizes to many systems and is worth stating explicitly.',
        },
      ],
    },
    {
      id: 'single-car',
      title: 'Step 4 — Scheduling one car: FCFS vs SCAN vs LOOK',
      blocks: [
        {
          id: 'sched-1',
          type: 'markdown',
          content:
            'Start with a single car and a stream of floor requests. The naive strategy is **FCFS** — serve requests in arrival order. Walk through why it fails: a car at floor 1 gets requests for 30, then 2, then 28. FCFS travels 1→30→2→28, about 85 floors of movement for three stops. The car ping-pongs across the building, and average wait explodes.\n\nThe fix is the same idea disk schedulers use: **sweep**. Keep moving in one direction, serving every pending request you pass, and only then reverse.\n\n- **SCAN**: sweep all the way to the top floor, then all the way to the bottom, like a windshield wiper — even if the upper floors have no requests.\n- **LOOK**: same sweep, but reverse as soon as **no requests remain ahead** in the current direction. This is what real elevators do — it is SCAN without the wasted travel to empty extremes.\n\nSame example under LOOK: 1→2→28→30, about 29 floors. Implementation is simple: keep two sorted sets of pending stops (above and below current position); while moving up, serve the ascending set; when it empties, flip direction.',
        },
        {
          id: 'sched-comparison',
          type: 'comparison',
          title: 'Single-car scheduling strategies',
          headers: ['Strategy', 'How it works', 'Pros', 'Cons'],
          rows: [
            [
              'FCFS',
              'Serve requests strictly in arrival order',
              'Trivially fair — no request ever starves',
              'Car criss-crosses the building; terrible average wait; never used in practice',
            ],
            [
              'SCAN',
              'Sweep to each end of the building, serving requests passed on the way',
              'Predictable, bounded wait for every floor',
              'Wastes travel to empty extremes when no one is there',
            ],
            [
              'LOOK (use this)',
              'Sweep, but reverse when no requests remain ahead',
              'Near-optimal movement; simple to implement; matches real elevators',
              'Directional bias: a floor "just behind" the car waits for a full sweep — the dispatcher must account for this',
            ],
          ],
        },
        {
          id: 'sched-2',
          type: 'markdown',
          content:
            'One subtlety earns points: a hall call has a **direction**. A car sweeping up should stop at floor 15\'s *up* call, but not its *down* call — picking up a down-bound passenger while heading up drags them the wrong way and adds a stop for everyone aboard. Serve a hall call only when the car\'s sweep direction matches the call\'s direction (or when the call\'s floor is the reversal point).',
        },
      ],
    },
    {
      id: 'dispatching',
      title: 'Step 5 — Multi-elevator dispatching, starvation, and the morning rush',
      blocks: [
        {
          id: 'dispatch-1',
          type: 'markdown',
          content:
            'With 8 cars, a new hall call needs an owner. The classic baseline is **nearest-car** dispatch: assign the call to the closest elevator. It fails in an obvious way — the nearest car may be moving *away*, full, or already committed to many stops.\n\nThe standard answer is a **cost function**: for each in-service car, estimate the time it would take to serve this call, and assign the call to the cheapest car.\n\n`cost(car, call) ≈ travel time to the call floor (respecting current direction and LOOK order) + ~10s door-cycle time × stops already committed before reaching it + penalty if the car is near its weight limit`\n\nEvaluating a closed-form estimate across 8 cars is microseconds of work — comfortably inside the 100ms dispatch budget. Assignments should be **re-evaluated** while the call is still unserved: if a better car becomes available (a car ahead of it faults, or finishes early), reassign. Only the final commitment (the car decelerating for the floor) is irrevocable.',
        },
        {
          id: 'dispatch-starve',
          type: 'markdown',
          content:
            '**Starvation avoidance.** Pure cost minimization has a failure mode: a call on a quiet floor (say floor 37 at lunch) keeps losing the cost comparison as new, cheaper calls arrive, and waits indefinitely. Two standard guards:\n\n- **Aging:** subtract a growing amount from a call\'s cost the longer it waits (e.g., after 45–60 seconds it wins any comparison). Simple and sufficient for the 30-second average-wait target — remember averages hide tails, and the aged call is the tail.\n- **Assignment stickiness:** once a car is en route, do not steal it for a marginally cheaper new call; reassign only on significant cost improvements or car failure. This prevents thrashing, the fleet-level cousin of starvation.',
        },
        {
          id: 'dispatch-peak',
          type: 'markdown',
          content:
            '**Morning rush (up-peak).** From 8–10am nearly all traffic is lobby → upper floors, and generic dispatching underperforms because the real bottleneck becomes **lobby loading throughput**. Peak-mode tactics:\n\n- **Return-to-lobby:** when a car empties upstairs, send it back to the lobby immediately instead of idling — the next demand is predictably there.\n- **Sector/zoning:** dedicate cars to floor bands (cars 1–4 serve floors 2–20, cars 5–8 serve 21–40). Each car makes fewer stops per round trip, so round-trip time drops and lobby throughput rises — at the cost of longer waits for the rare off-pattern call.\n- Detect the peak either by schedule (weekday mornings) or dynamically (sustained lobby up-call rate above a threshold). Lunch is the mirror image: **down-peak**, position idle cars at upper floors.\n\nMentioning up-peak unprompted is a strong signal — it shows you connected the traffic pattern in the requirements to a scheduling-mode change rather than treating the algorithm as static.',
        },
        {
          id: 'dispatch-tradeoff',
          type: 'tradeoff',
          title: 'Central dispatcher with cost-based assignment',
          pros: [
            'Global view yields much better average wait than independent cars — it can balance load and avoid sending two cars to one call',
            'One place to implement aging, peak modes, and fault re-assignment',
            'Cost function is tunable (wait time vs energy vs crowding) without touching car controllers',
          ],
          cons: [
            'Single point of failure — requires a degraded mode where cars self-schedule (see step 6)',
            'Estimates are guesses: boarding times vary and hall calls hide destinations, so "optimal" assignments are frequently wrong in hindsight',
            'Reassignment logic needs damping or the fleet thrashes, canceling and re-issuing assignments',
          ],
        },
      ],
    },
    {
      id: 'faults',
      title: 'Step 6 — Fault handling: losing a car, losing the dispatcher',
      blocks: [
        {
          id: 'fault-1',
          type: 'markdown',
          content:
            'The requirements demand the system survives **any single car failure and a dispatcher failure**. Handle each explicitly.\n\n**A car faults.** Its controller fails closed (stop at next floor, open doors, leave the pool) and the dispatcher observes the state change via heartbeat/telemetry. Recovery is straightforward because of a key distinction: the dispatcher can **re-assign the car\'s pending hall calls** to other cars via the normal cost function — but **car calls** (passengers already inside who pressed buttons) cannot be reassigned; those passengers exit at the fault floor and press a fresh hall call. Making this distinction shows you understand what state lives where.\n\n**The dispatcher faults.** Cars must not stop working when the coordinator dies:\n\n- Each car keeps a copy of its own assigned calls and continues serving them with LOOK — assignments already made keep progressing.\n- **Degraded mode for new calls:** hall call buttons broadcast on the shared bus; with no dispatcher heartbeat, every car sees every call and applies a deterministic claim rule (e.g., the car with the lowest cost claims it; ties broken by car ID). Service quality drops toward independent operation, but no button goes dead.\n- Run a **standby dispatcher** that takes over on heartbeat loss. State reconstruction is easy — the fleet state is small and cars re-report position and pending calls on request, so the standby can rebuild the world in seconds rather than replicating state continuously.',
        },
        {
          id: 'fault-note',
          type: 'interviewNote',
          title: 'The physical-world framing',
          content:
            'A sentence that lands well: "In this system, availability degrades gracefully to dumber scheduling — worst case, each car is a working single elevator — while safety never degrades at all." It compresses the whole fault-tolerance design into the two guarantees the requirements actually ask for.',
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
            '1. **FCFS as the final answer.** Serving floors in request order makes the car ping-pong across 40 floors. If you name only one algorithm, name LOOK.\n2. **Blurring hall calls and car calls.** They have different information (direction only vs exact floor), different owners (dispatcher vs car), and different fault behavior (reassignable vs not).\n3. **Safety inside the scheduler.** The requirement says scheduler bugs cannot violate safety — that forces interlocks into a lower layer, not an if-statement in dispatch code.\n4. **Ignoring starvation.** Any cost-minimizing dispatcher starves quiet floors without aging. Interviewers ask "can any request wait forever?" — have the answer ready.\n5. **No story for dispatcher failure.** Central coordination is fine, but the requirements explicitly demand the system survives it. Degraded self-scheduling plus a standby is a complete answer.\n6. **Treating the load as constant.** The prompt hands you the morning rush; a static algorithm leaves the biggest wait-time win on the table.\n7. **Scaling the wrong thing.** Proposing distributed databases and message brokers for 8 cars and 10,000 trips/day misreads where the difficulty lives.',
        },
        {
          id: 'mistakes-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Unprompted mentions of: LOOK by name and why real elevators use it over SCAN; direction-matched hall-call pickup; an explicit cost function with aging; up-peak/down-peak mode switching; and the safety-below-optimization layering. Connecting LOOK to disk-arm scheduling shows you recognize the pattern rather than having memorized an elevator answer.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What algorithm do real elevators use?',
      answer:
        'Individual cars use a sweep strategy equivalent to LOOK: keep traveling in the current direction, stopping at requested floors whose call direction matches, and reverse only when no requests remain ahead. Fleet-level dispatching assigns each hall call to the car with the lowest estimated arrival cost, with adjustments for traffic peaks and waiting-time fairness.',
    },
    {
      question: 'Why is first-come-first-served a bad elevator scheduling algorithm?',
      answer:
        'FCFS serves floors in request arrival order, which makes the car criss-cross the building — for example floor 1 to 30, back to 2, then up to 28. Travel distance and average wait become far worse than a directional sweep that serves all requests along the way. Its only virtue, guaranteed fairness, is recovered in better algorithms by aging waiting calls.',
    },
    {
      question: 'What is the difference between a hall call and a car call?',
      answer:
        'A hall call is the up or down button on a floor — it states a direction but not a destination, and the dispatcher chooses which car answers it. A car call is a floor button pressed inside a specific car — it binds to that car and cannot be reassigned. If a car fails, its pending hall calls are redistributed to other cars, while its passengers exit and issue new hall calls.',
    },
    {
      question: 'How do you prevent starvation in elevator scheduling?',
      answer:
        'Add aging to the dispatch cost function: the longer a hall call waits, the larger the bonus it receives in car-assignment comparisons, so after a bounded time it wins over newer, cheaper calls. Combined with a sweep algorithm per car, which naturally serves every floor it passes, no request can wait indefinitely.',
    },
    {
      question: 'How does an elevator system handle the morning rush?',
      answer:
        'By switching to an up-peak mode. Cars return to the lobby as soon as they empty upstairs, and the fleet may be zoned so each car serves a band of floors, reducing stops per round trip and increasing lobby throughput. The mode is triggered by schedule or by detecting a sustained surge of lobby up-calls, and reversed at lunch when traffic flows downward.',
    },
  ],
};
