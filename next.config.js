const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    // Server components external packages for database compatibility
    serverComponentsExternalPackages: ["better-sqlite3"]
  }
};

module.exports = nextConfig;