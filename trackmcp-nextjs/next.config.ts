import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Local QA can isolate a production build from a concurrently running
  // dev server with NEXT_DIST_DIR=.next-release. Production keeps .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  reactCompiler: true,
  // This repository contains the web app in a subdirectory. Pin Turbopack to
  // that application root so an unrelated ancestor lockfile cannot expand the
  // filesystem boundary or change module-resolution behavior during a build.
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      // Legacy MCP-directory URLs → new repository home
      { source: "/tools", destination: "/repository", permanent: true },
      { source: "/mcp", destination: "/repository", permanent: true },
      { source: "/directory", destination: "/repository", permanent: true },
      { source: "/tools/test-mcp-server", destination: "/tools/mcp-server-tester", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/tool/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=21600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
