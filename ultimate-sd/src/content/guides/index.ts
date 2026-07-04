import { Guide } from '@/lib/guides';
import { tinyUrlGuide } from './design-tinyurl';
import { whatsappGuide } from './design-whatsapp';
import { distributedCacheGuide } from './design-distributed-cache';

export const guides: Record<string, Guide> = {
  [tinyUrlGuide.metadata.slug]: tinyUrlGuide,
  [whatsappGuide.metadata.slug]: whatsappGuide,
  [distributedCacheGuide.metadata.slug]: distributedCacheGuide,
};

export const getAllGuides = (): Guide[] => Object.values(guides);

export const getGuideBySlug = (slug: string): Guide | undefined => guides[slug];
