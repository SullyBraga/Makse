import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'utfs.io' },
    ],
    // Allow local uploads served from /public
    localPatterns: [
      { pathname: '/uploads/**' },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

export default nextConfig
