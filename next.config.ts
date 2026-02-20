import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/filesystem/image',
      },
    ],
  },
};

export default nextConfig;
