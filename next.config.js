/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/sign-in',
        destination: '/sign-in',
        has: [{ type: 'header', key: 'x-clerk-redirect', value: '' }],
        permanent: false,
      },
      {
        source: '/sign-up',
        destination: '/sign-up',
        has: [{ type: 'header', key: 'x-clerk-redirect', value: '' }],
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
