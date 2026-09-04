import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      // Legacy MCP-directory URLs → new repository home
      { source: "/tools", destination: "/repository", permanent: true },
      { source: "/mcp", destination: "/repository", permanent: true },
      { source: "/directory", destination: "/repository", permanent: true },
    ];
  },
  async headers() {
    return [
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
