import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    localPatterns: [
      {
        pathname: '/api/filesystem/image',
      },
    ],
  },
};

export default nextConfig;
