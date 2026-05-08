import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'utfs.io' },
    ],
    // Allow local uploads served from /public
    localPatterns: [
      { pathname: '/uploads/**' },
    ],
    unoptimized: true,
  },
}

export default nextConfig
