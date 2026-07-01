/** Canonical public URL for SEO, OG tags, sitemap, and email links. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
  'https://ultimate-sd.vercel.app';

export const SITE_NAME = 'Ultimate SD';
