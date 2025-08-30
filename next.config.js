/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        buffer: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
      };
    }
    
    // Handle specific modules that should not be bundled
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        '@alpacahq/alpaca-trade-api': 'commonjs @alpacahq/alpaca-trade-api',
        'pg': 'commonjs pg',
      });
    }
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@alpacahq/alpaca-trade-api',
      'pg',
      'crypto',
    ],
  },
}

module.exports = nextConfig;