import { StepData } from '@/types';

export const DEFAULT_PHASE_STEPS: { [key: string]: StepData[] } = {
    requirements: [
        {
            phase: 'Requirements',
            subStep: 'functional',
            title: 'Functional Requirements',
            prompt: 'What are the core features your system must provide? List the key functionalities users will interact with.',
            inputType: 'list',
            placeholder: 'e.g., User can post tweets'
        },
        {
            phase: 'Requirements',
            subStep: 'non-functional',
            title: 'Non-Functional Requirements',
            prompt: 'What are the quality attributes? Consider scalability, availability, latency, consistency, etc.',
            inputType: 'list',
            placeholder: 'e.g., System should handle 100M DAU'
        },
        {
            phase: 'Requirements',
            subStep: 'constraints',
            title: 'Constraints & Assumptions',
            prompt: 'What are the constraints and assumptions? Consider traffic estimates, data size, limitations.',
            inputType: 'list',
            placeholder: 'e.g., Average tweet size is 280 characters'
        }
    ],
    hld: [
        {
            phase: 'HLD',
            subStep: 'api',
            title: 'API Design',
            prompt: 'Define the key APIs/endpoints your system will expose. What operations will clients perform?',
            inputType: 'list',
            placeholder: 'e.g., POST /api/v1/tweets - Create a new tweet'
        },
        {
            phase: 'HLD',
            subStep: 'data-model',
            title: 'Data Model',
            prompt: 'What are your main entities and their relationships? Design your database schema with tables, fields, and relationships.',
            inputType: 'schema',
            placeholder: 'Build your schema using the visual builder below'
        },
        {
            phase: 'HLD',
            subStep: 'architecture',
            title: 'High-Level Architecture',
            prompt: 'Describe your system architecture. What are the major components and how do they interact?',
            inputType: 'textarea',
            placeholder: 'Describe load balancers, app servers, databases, caches, etc...'
        }
    ],
    lld: [
        {
            phase: 'LLD',
            subStep: 'components',
            title: 'Component Deep-Dive',
            prompt: 'Detail the internal design of critical components. How do they work internally?',
            inputType: 'textarea',
            placeholder: 'Explain algorithms, data structures, internal workflows...'
        },
        {
            phase: 'LLD',
            subStep: 'data-flow',
            title: 'Data Flow',
            prompt: 'Trace a typical request through your system. What happens at each step?',
            inputType: 'textarea',
            placeholder: 'Walk through a complete flow from user action to response...'
        }
    ],
    tradeoffs: [
        {
            phase: 'Trade-offs',
            subStep: 'decisions',
            title: 'Key Decisions & Trade-offs',
            prompt: 'What major technical decisions did you make? What were the alternatives and why did you choose this approach?',
            inputType: 'list',
            placeholder: 'e.g., Chose NoSQL over SQL for horizontal scalability'
        },
        {
            phase: 'Trade-offs',
            subStep: 'bottlenecks',
            title: 'Bottlenecks & Solutions',
            prompt: 'What are potential bottlenecks in your design? How would you address them?',
            inputType: 'list',
            placeholder: 'e.g., Database writes - use write-through cache'
        }
    ],
    scalability: [
        {
            phase: 'Scalability',
            subStep: 'scaling',
            title: 'Scaling Strategy',
            prompt: 'How will your system scale to millions of users? Describe horizontal/vertical scaling approaches.',
            inputType: 'textarea',
            placeholder: 'Explain sharding, replication, load balancing strategies...'
        },
        {
            phase: 'Scalability',
            subStep: 'monitoring',
            title: 'Monitoring & Reliability',
            prompt: 'How will you monitor and ensure reliability? What metrics matter?',
            inputType: 'list',
            placeholder: 'e.g., Monitor API latency, error rates, database load'
        }
    ]
};

/** Generic HLD/LLD backfill for OOD/class-design problems (e.g. parking lot, elevator system). */
export const GENERIC_OOD_PHASE_STEPS: { [key: string]: StepData[] } = {
    requirements: [
        {
            phase: 'Requirements',
            subStep: 'functional',
            title: 'Functional Requirements',
            prompt: 'What operations must your objects/classes support? List the key use-cases a client of your system will invoke.',
            inputType: 'list',
            placeholder: 'e.g., Vehicle can enter and exit a parking spot'
        },
        {
            phase: 'Requirements',
            subStep: 'non-functional',
            title: 'Non-Functional Requirements',
            prompt: 'What quality attributes matter? Consider thread-safety, extensibility, and multi-instance scaling.',
            inputType: 'list',
            placeholder: 'e.g., Support concurrent access from 50 entry gates'
        },
        {
            phase: 'Requirements',
            subStep: 'constraints',
            title: 'Constraints & Assumptions',
            prompt: 'What are the constraints and assumptions? Consider the physical/business rules your objects must respect.',
            inputType: 'list',
            placeholder: 'e.g., Each spot fits exactly one vehicle of its size class'
        }
    ],
    hld: [
        {
            phase: 'HLD',
            subStep: 'class-design',
            title: 'Class & Interface Design',
            prompt: 'Identify the core classes and interfaces in your design. What is each one responsible for?',
            inputType: 'list',
            placeholder: 'e.g., ParkingSpot, Ticket, PaymentProcessor'
        },
        {
            phase: 'HLD',
            subStep: 'architecture',
            title: 'Component Interaction',
            prompt: 'How do your classes collaborate to fulfill a use-case end to end? Describe the object graph and key relationships (composition vs inheritance).',
            inputType: 'textarea',
            placeholder: 'Walk through a use-case across your classes...'
        }
    ],
    lld: [
        {
            phase: 'LLD',
            subStep: 'state-machine',
            title: 'State & Behavior',
            prompt: 'Model the internal state transitions for your core entity. What states can it be in, and what triggers a transition?',
            inputType: 'textarea',
            placeholder: 'e.g., SPOT: FREE -> RESERVED -> OCCUPIED -> FREE'
        },
        {
            phase: 'LLD',
            subStep: 'concurrency',
            title: 'Concurrency & Edge Cases',
            prompt: 'How do you handle concurrent access and edge cases (e.g., two threads claiming the same resource)? What locking or synchronization is needed?',
            inputType: 'textarea',
            placeholder: 'Explain your locking/synchronization strategy...'
        }
    ],
    tradeoffs: [
        {
            phase: 'Trade-offs',
            subStep: 'decisions',
            title: 'Key Decisions & Trade-offs',
            prompt: 'What major design decisions did you make (e.g., composition over inheritance, interface segregation)? What alternatives did you consider?',
            inputType: 'list',
            placeholder: 'e.g., Chose composition over inheritance for VehicleType'
        },
        {
            phase: 'Trade-offs',
            subStep: 'bottlenecks',
            title: 'Extensibility & Bottlenecks',
            prompt: 'How would you extend this design for a new requirement without modifying existing classes (Open/Closed Principle)? What would become a bottleneck at scale?',
            inputType: 'list',
            placeholder: 'e.g., Adding a new vehicle type requires no changes to ParkingLot'
        }
    ],
    scalability: [
        {
            phase: 'Scalability',
            subStep: 'scaling',
            title: 'Scaling Strategy',
            prompt: 'How would this design scale across multiple instances/locations (e.g., multiple parking garages)? What state needs to be shared vs local?',
            inputType: 'textarea',
            placeholder: 'Explain how state is partitioned across instances...'
        },
        {
            phase: 'Scalability',
            subStep: 'monitoring',
            title: 'Monitoring & Reliability',
            prompt: 'How would you monitor and ensure reliability of the system? What metrics and failure modes matter?',
            inputType: 'list',
            placeholder: 'e.g., Monitor spot-occupancy drift, gate failure rate'
        }
    ]
};
