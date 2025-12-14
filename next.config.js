/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Exclude streaming API routes from static generation
  experimental: {
    staticPageGenerationTimeout: 120, // Increase timeout for other pages
  },
  // Configure which routes should not be statically generated
  async rewrites() {
    return [];
  },
  webpack: (config, { isServer }) => {
    // Fix for dockerode and other node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
