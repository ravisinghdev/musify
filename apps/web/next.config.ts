import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  async rewrites() {
    if (process.env.API_URL) {
      const target = process.env.API_URL.replace(/\/+$/, "");
      return [
        {
          source: "/api/:path*",
          destination: `${target}/api/:path*`,
        },
      ];
    }
    return [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
