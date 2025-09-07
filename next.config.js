const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    // API で Playwright を使うため node ランタイムを明示
    serverComponentsExternalPackages: ["better-sqlite3", "playwright"]
  }
};

module.exports = nextConfig;