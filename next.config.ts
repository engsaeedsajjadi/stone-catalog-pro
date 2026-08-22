import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: { workerThreads: false, cpus: 1 },
  images: { remotePatterns: [] },
};

export default nextConfig;
