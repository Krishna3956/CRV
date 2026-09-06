import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16a34a",
        }}
      >
        <svg width="126" height="126" viewBox="0 0 32 32" fill="none">
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
    ),
    { ...size },
  );
}
