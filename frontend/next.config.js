/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // CRITICAL: Add output configuration for Vercel
  output: 'standalone',
  
  images: {
    domains: ['d1234567890.cloudfront.net'], // Add your CloudFront domain
    unoptimized: false, // Changed from true to false for production
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  
  // Add these for better Vercel deployment
  swcMinify: true,
  
  // Ensure proper trailing slash handling
  trailingSlash: false,
  
  // Add proper redirects if needed
  async redirects() {
    return [];
  },
  
  // Handle rewrites if needed
  async rewrites() {
    return [];
  },
}

module.exports = nextConfig