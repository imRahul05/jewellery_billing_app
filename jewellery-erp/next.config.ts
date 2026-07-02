import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the server bundle (native engine).
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
