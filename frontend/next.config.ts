import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://backend:3000';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/api/docs/:path*', destination: `${backendUrl}/api/docs/:path*` },
      { source: '/api', destination: `${backendUrl}/` },
      { source: '/api/:path*', destination: `${backendUrl}/:path*` },
    ];
  },
};

export default nextConfig;
