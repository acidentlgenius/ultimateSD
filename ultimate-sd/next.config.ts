import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@excalidraw/excalidraw'],
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      // Blog was replaced by the public SEO guides.
      { source: '/blog', destination: '/guides', permanent: true },
      { source: '/blog/tinyurl-system-design', destination: '/guides/design-tinyurl', permanent: true },
      { source: '/blog/:slug', destination: '/guides', permanent: true },
    ];
  },
};

export default nextConfig;
