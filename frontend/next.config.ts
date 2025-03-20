import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/node/:path*',
        destination: 'https://zipscape-production.up.railway.app/node/:path*',
      },
    ];
  },
};

export default nextConfig;
