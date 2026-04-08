import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next",
  serverExternalPackages: [],
  outputFileTracingRoot: __dirname,
  // Edge Runtime configuration for API routes
  // Individual routes can specify runtime: 'edge' in their config
};

export default nextConfig;
