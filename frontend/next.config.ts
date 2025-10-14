import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  swcMinify: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-select'
    ]
  },

  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://task-management-app:8080/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
