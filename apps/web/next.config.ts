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
          const target = (
            process.env.API_URL || "https://musify-4fzw.onrender.com"
          ).replace(/\/+$/, "");
          return [
            {
              source: "/api/:path*",
              destination: `${target}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
