import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@excalidraw/excalidraw'],
  async redirects() {
    return [{ source: '/home', destination: '/', permanent: true }];
  },
};

export default nextConfig;
