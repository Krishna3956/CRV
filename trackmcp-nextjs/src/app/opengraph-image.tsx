import { ImageResponse } from "next/og";

export const alt = "TrackMCP — analytics for your MCP server";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
        {/* brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
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
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#171717" }}>track</span>
            <span style={{ color: "#16a34a" }}>mcp</span>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: 900 }}>
            Analytics for your MCP server
          </div>
          <div style={{ fontSize: 30, color: "#525252", maxWidth: 860 }}>
            See who uses it, what they do, whether the work gets done, and what to fix. One line of code.
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: "#737373" }}>
          <div style={{ width: 10, height: 10, borderRadius: 10, background: "#16a34a" }} />
          trackmcp.com
        </div>
      </div>
    ),
    { ...size }
  );
}
