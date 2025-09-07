import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // API で Playwright を使うため node ランタイムを明示
    serverComponentsExternalPackages: ["better-sqlite3", "playwright"]
  }
};

export default nextConfig;
