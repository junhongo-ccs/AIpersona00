const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Replitでのビルド時のメモリ制限対策
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      minimize: !isServer,
    };
    return config;
  },
  // 静的ファイルのコピー設定
  experimental: {
    outputFileTracingIncludes: {
      "/api/*": ["./node_modules/**/*"],
    },
  },
};

module.exports = nextConfig;
