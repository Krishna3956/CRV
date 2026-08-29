import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
};

export default nextConfig;
