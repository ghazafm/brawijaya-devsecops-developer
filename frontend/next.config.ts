import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "YOUR_API_URL"

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
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  }
};

export default nextConfig;
