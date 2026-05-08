import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin-dashboard',
        destination: '/dashboard/admin',
        permanent: true,
      },
      {
        source: '/admin-dashboard/:path*',
        destination: '/dashboard/admin/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
