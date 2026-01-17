/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Vercel / Next.js production optimizations
  output: 'standalone',
  swcMinify: true,
  trailingSlash: false,

  // CloudFront images
  images: {
    domains: ['d1234567890.cloudfront.net'], // replace with real CF domain
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
  },

  // Public environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },

  // KaTeX optimization (SAFE)
  experimental: {
    optimizePackageImports: ['katex'],
  },

  async redirects() {
    return [];
  },

  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
