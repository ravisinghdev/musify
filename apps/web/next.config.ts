import type { NextConfig } from "next";

const isExport =
  process.env.CAPACITOR_BUILD === "true" ||
  process.env.npm_lifecycle_event === "build:export" ||
  process.env.npm_lifecycle_event === "build:apk";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  ...(isExport
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : {
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
      }),
};

export default nextConfig;
