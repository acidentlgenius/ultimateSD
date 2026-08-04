import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@excalidraw/excalidraw'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./src/lib/adaptive-coach/skills/**/SKILL.md'],
  },
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      // Preserves inbound link equity for a specific pre-existing URL from
      // when /blog redirected to /guides; the general /blog routes are now
      // served by the real blog feature (src/app/blog).
      { source: '/blog/tinyurl-system-design', destination: '/guides/design-tinyurl', permanent: true },
    ];
  },
};

export default nextConfig;
