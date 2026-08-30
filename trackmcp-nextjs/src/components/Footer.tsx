import Link from "next/link";
import { TrackMCPAppIcon } from "./TrackMCPAppIcon";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "MCP Repository", href: "/repository" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "TypeScript SDK", href: "/docs/typescript" },
      { label: "Python SDK", href: "/docs/python" },
      { label: "API reference", href: "/docs/api" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const socials: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/trackmcp",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com/trackmcp",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.24 2.25h3.31l-7.23 8.26L23 21.75h-6.66l-5.21-6.82-5.97 6.82H1.85l7.73-8.84L1 2.25h6.83l4.71 6.23 5.7-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/trackmcp",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              aria-label="TrackMCP home"
              className="group inline-flex items-center gap-2"
            >
              <TrackMCPAppIcon size={26} className="transition-transform duration-200 group-hover:-rotate-3" />
              <span className="font-display text-[21px] font-medium lowercase tracking-[-0.045em]">
                <span className="text-[#171717]">track</span>
                <span className="text-brand">mcp</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[32ch] text-sm text-muted">
              Analytics for the Model Context Protocol. See how your MCP server is
              being used.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h5 className="mb-3.5 text-[13px] font-semibold uppercase tracking-wide text-faint">
                {c.title}
              </h5>
              {c.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="mb-2.5 block text-[14.5px] text-body transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[13px] text-muted">
          <div className="flex flex-wrap items-center gap-2.5">
            <span>© 2026 TrackMCP. All rights reserved.</span>
            <span aria-hidden className="hidden text-line-strong sm:inline">·</span>
            <span className="font-mono">trackmcp.com</span>
          </div>
          <div className="flex items-center gap-1.5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* oversized faded wordmark */}
      <div aria-hidden className="pointer-events-none relative select-none px-6">
        <span className="block bg-gradient-to-b from-[#e9edea] to-[#f4f6f5] bg-clip-text text-center font-display text-[19vw] font-black leading-[0.78] tracking-[-0.05em] text-transparent">
          trackmcp
        </span>
      </div>
    </footer>
  );
}
