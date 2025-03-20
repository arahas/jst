import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/node/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/node/:path*`,
      },
    ];
  },
};

export default nextConfig;
