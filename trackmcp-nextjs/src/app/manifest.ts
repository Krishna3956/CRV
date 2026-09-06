import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrackMCP",
    short_name: "TrackMCP",
    description:
      "Analytics and observability for your MCP server, plus an MCP server directory.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      { src: "/favicon.png", sizes: "96x96", type: "image/png" },
      { src: "/favicon.png", sizes: "96x96", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
