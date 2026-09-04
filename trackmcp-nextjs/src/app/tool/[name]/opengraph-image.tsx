import { ImageResponse } from "next/og";
import { getToolByName } from "@/lib/repository/queries";

export const alt = "MCP server on TrackMCP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 21600;
export const dynamic = "force-static";

export default async function ToolOgImage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const tool = await getToolByName(name);
  const repo = tool?.repo_name || decodeURIComponent(name);
  const desc = (tool?.description || "A Model Context Protocol server in the TrackMCP directory.").slice(0, 140);
  const stars = tool?.stars || 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <g stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round">
                <path d="M16 16 Q20.5 10 25 7" />
                <path d="M16 16 Q10 20.5 7 25" />
                <path d="M16 16 Q22.5 20 25 25" />
              </g>
              <g fill="#ffffff">
                <circle cx="6.6" cy="6.6" r="4.4" />
                <circle cx="7" cy="25" r="4" />
                <circle cx="25" cy="25" r="4" />
                <circle cx="25" cy="7" r="4" />
                <circle cx="16" cy="16" r="4.4" />
              </g>
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#171717" }}>track</span>
            <span style={{ color: "#16a34a" }}>mcp</span>
          </div>
          <div style={{ fontSize: 22, color: "#a3a3a3", marginLeft: 8 }}>· MCP Repository</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.02, maxWidth: 1000 }}>
            {repo}
          </div>
          <div style={{ fontSize: 30, color: "#525252", maxWidth: 960, lineHeight: 1.3 }}>{desc}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 26, color: "#404040" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#f59e0b">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {stars.toLocaleString()} stars
          </div>
          {tool?.language ? <div>{tool.language}</div> : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
