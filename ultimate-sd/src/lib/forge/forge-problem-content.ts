import type { ForgeJourneyStep } from './types';

type StepOverride = Partial<
  Pick<ForgeJourneyStep, 'prompt' | 'objectives' | 'pitfalls' | 'idealMinutes'>
>;

export type ForgeProblemContent = {
  immersionHighlight?: string;
  /** Entity names for the data-model frame template. */
  entities?: string[];
  /** Starter API endpoint lines for the API frame template. */
  apiEndpoints?: string[];
  stepOverrides?: Partial<Record<string, StepOverride>>;
};

const FORGE_PROBLEM_CONTENT: Record<string, ForgeProblemContent> = {
  'design-tinyurl': {
    immersionHighlight: 'Read-heavy redirects (100:1) with hot-key spikes on viral links.',
    entities: ['LongUrl', 'ShortCode', 'ClickEvent'],
    apiEndpoints: ['POST /api/v1/urls — shorten long URL', 'GET /{code} — redirect to original'],
    stepOverrides: {
      'hld-architecture': {
        prompt: 'Trace a redirect end-to-end: client → CDN/edge → cache → DB. Where do hot keys land?',
        objectives: ['Show read path vs write path', 'Cache layer for redirects', 'ID generation strategy'],
      },
      'tradeoffs-decisions': {
        prompt: 'Hash vs counter IDs? SQL vs NoSQL for mappings? Cache invalidation on expiry?',
      },
    },
  },
  'design-youtube': {
    immersionHighlight: '500 hours uploaded per minute; playback must start in under 2 seconds globally.',
    entities: ['Video', 'Channel', 'TranscodeJob', 'ViewEvent'],
    apiEndpoints: ['POST /videos — initiate multipart upload', 'GET /watch/{id} — stream manifest'],
    stepOverrides: {
      'hld-architecture': {
        prompt: 'Separate upload/transcode pipeline from playback CDN. How does adaptive bitrate reach the client?',
        objectives: ['Upload → object store → transcode workers', 'CDN for segments', 'Recommendation service boundary'],
      },
    },
  },
  'design-uber': {
    immersionHighlight: '1.25M GPS writes/sec at peak; matches must complete in under 30 seconds.',
    entities: ['Rider', 'Driver', 'Trip', 'LocationPing'],
    apiEndpoints: ['POST /trips/request — match rider to driver', 'PUT /drivers/{id}/location — stream GPS'],
    stepOverrides: {
      'hld-architecture': {
        prompt: 'Geospatial matching at scale: how do you index driver locations and handle surge pricing?',
        objectives: ['Real-time location index', 'Matching service', 'Payment + trip state machine'],
      },
    },
  },
  'design-twitter': {
    immersionHighlight: 'Fan-out on write vs pull on read — the celebrity tweet problem.',
    entities: ['User', 'Tweet', 'Timeline', 'FollowEdge'],
    apiEndpoints: ['POST /tweets — publish tweet', 'GET /timeline/home — merged feed'],
    stepOverrides: {
      'hld-architecture': {
        prompt: 'Hybrid fan-out: when do you push to timelines vs pull at read time?',
      },
    },
  },
  'design-netflix': {
    immersionHighlight: 'Global streaming with regional catalogs and offline downloads.',
    entities: ['Title', 'EncodingProfile', 'PlaybackSession', 'Recommendation'],
    apiEndpoints: ['GET /catalog/{region} — browse titles', 'GET /play/{id} — signed stream URL'],
  },
  'design-whatsapp': {
    immersionHighlight: 'End-to-end encrypted messaging at billions of daily messages.',
    entities: ['User', 'Chat', 'Message', 'DeviceSession'],
    apiEndpoints: ['POST /messages — send encrypted payload', 'GET /chats/{id}/messages — sync history'],
  },
  'design-dropbox': {
    immersionHighlight: 'File sync across devices with conflict resolution and block-level dedup.',
    entities: ['User', 'File', 'Block', 'Revision'],
    apiEndpoints: ['PUT /files/{path} — upload block', 'GET /delta — sync changes since cursor'],
  },
  'design-google-search': {
    immersionHighlight: 'Crawl billions of pages; serve ranked results in under 200ms.',
    entities: ['Document', 'InvertedIndex', 'CrawlJob', 'QueryLog'],
    apiEndpoints: ['GET /search?q= — ranked results', 'POST /crawl — enqueue URL frontier'],
  },
  'design-distributed-cache': {
    immersionHighlight: 'Consistent hashing, replication, and eviction under memory pressure.',
    entities: ['CacheNode', 'KeySlot', 'Replica', 'EvictionPolicy'],
    apiEndpoints: ['GET /cache/{key} — read through ring', 'PUT /cache/{key} — write with TTL'],
  },
  'design-parking-lot': {
    immersionHighlight: 'Classic OOP-to-systems bridge: spots, vehicles, and payment gates.',
    entities: ['ParkingLot', 'ParkingSpot', 'Vehicle', 'Ticket'],
    apiEndpoints: ['POST /entry — issue ticket', 'POST /exit — calculate fee and release spot'],
  },
};

export const FORGE_PORTED_PROBLEM_SLUGS = Object.keys(FORGE_PROBLEM_CONTENT);

export function getForgeProblemContent(slug: string): ForgeProblemContent | null {
  return FORGE_PROBLEM_CONTENT[slug] ?? null;
}

export function applyForgeProblemOverrides(
  steps: ForgeJourneyStep[],
  slug: string
): ForgeJourneyStep[] {
  const content = getForgeProblemContent(slug);
  if (!content?.stepOverrides) return steps;

  return steps.map((step) => {
    const override = content.stepOverrides?.[step.stepId];
    if (!override) return step;
    return { ...step, ...override };
  });
}
