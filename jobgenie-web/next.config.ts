import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Temporarily disable ESLint during development
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
