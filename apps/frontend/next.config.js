/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required by apps/frontend/Dockerfile: emits .next/standalone/server.js
  output: 'standalone',
  transpilePackages: ['@dh-araria/ui', '@dh-araria/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    // `images.domains` was removed in Next 16; remotePatterns is the supported
    // way to allow remote hosts. Omitted fields match any value.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
}

module.exports = nextConfig