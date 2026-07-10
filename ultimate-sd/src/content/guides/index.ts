import { Guide } from '@/lib/guides';
import { tinyUrlGuide } from './design-tinyurl';
import { whatsappGuide } from './design-whatsapp';
import { distributedCacheGuide } from './design-distributed-cache';
import { rateLimiterGuide } from './design-rate-limiter';
import { dropboxGuide } from './design-dropbox';
import { youtubeGuide } from './design-youtube';
import { parkingLotGuide } from './design-parking-lot';
import { elevatorSystemGuide } from './design-elevator-system';

export const guides: Record<string, Guide> = {
  [tinyUrlGuide.metadata.slug]: tinyUrlGuide,
  [whatsappGuide.metadata.slug]: whatsappGuide,
  [distributedCacheGuide.metadata.slug]: distributedCacheGuide,
  [rateLimiterGuide.metadata.slug]: rateLimiterGuide,
  [dropboxGuide.metadata.slug]: dropboxGuide,
  [youtubeGuide.metadata.slug]: youtubeGuide,
  [parkingLotGuide.metadata.slug]: parkingLotGuide,
  [elevatorSystemGuide.metadata.slug]: elevatorSystemGuide,
};

export const getAllGuides = (): Guide[] => Object.values(guides);

export const getGuideBySlug = (slug: string): Guide | undefined => guides[slug];
