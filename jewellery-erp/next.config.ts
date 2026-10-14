import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the server bundle (native engine).
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Enable Next.js 16 cache components (PPR + 'use cache')
  cacheComponents: true,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    staleTimes: {
      dynamic: 30, // seconds
    },
  },
};

export default nextConfig;

