const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  
  // Replit hosting configuration to fix cross-origin requests
  allowedDevOrigins: ["*"],
  
  // Replitでのビルド時のメモリ制限対策
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      minimize: !isServer,
    };
    return config;
  },
  // 静的ファイルのコピー設定 - moved from experimental in Next.js 15
  outputFileTracingIncludes: {
    "/api/*": ["./node_modules/**/*"],
  },
};

module.exports = nextConfig;
