import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  assetPrefix: undefined,
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
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    }
  }
}

export default nextConfig
