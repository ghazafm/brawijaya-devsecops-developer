import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "YOUR_API_URL"
const endpoints = ['auth', 'todos']

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
    return endpoints.map((ep) => ({
      source: `/${ep}/:path*`,
      destination: `${API_URL}/${ep}/:path*`,
    }));
  },
};

export default nextConfig;
