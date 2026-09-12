import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { EarlyAccessButton } from "./EarlyAccessButton";
import { TrackMCPAppIcon } from "./TrackMCPAppIcon";

const groups = [
  {
    title: "Product",
    links: [
      { label: "MCP observability", href: "/mcp-observability" },
      { label: "Server analytics", href: "/mcp-server-analytics" },
      { label: "Tool analytics", href: "/mcp-tool-analytics" },
      { label: "Remote HTTP", href: "/mcp-observability/remote-http" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Quickstart", href: "/mcp-server-analytics/quickstart" },
      { label: "TypeScript SDK", href: "/docs/typescript" },
      { label: "Python SDK", href: "/docs/python" },
      { label: "API reference", href: "/docs/api" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "MCP Repository", href: "/repository" },
      { label: "Popular servers", href: "/top-mcp" },
      { label: "Categories", href: "/categories" },
      { label: "Free MCP servers", href: "/free-mcp-servers" },
      { label: "Social media servers", href: "/mcp-servers/social-media" },
    ],
  },
  {
    title: "MCP Observability",
    links: [
      { label: "Observability guide", href: "/blog/mcp-observability-guide" },
      { label: "Best tools", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "TrackMCP vs Sentry", href: "/mcp-observability/compare/trackmcp-vs-sentry" },
      { label: "TrackMCP vs Datadog", href: "/mcp-observability/compare/trackmcp-vs-datadog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Releases", href: "/blog/releases" },
      { label: "About", href: "/about" },
      { label: "Security", href: "/security" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const socials = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/trackmcp",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
    viewBox: "0 0 24 24",
  },
  {
    label: "X",
    href: "https://x.com/trackmcp",
    path: "M18.24 2.25h3.31l-7.23 8.26L23 21.75h-6.66l-5.21-6.82-5.97 6.82H1.85l7.73-8.84L1 2.25h6.83l4.71 6.23 5.7-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z",
    viewBox: "0 0 24 24",
  },
  {
    label: "GitHub",
    href: "https://github.com/trackmcp",
    path: "M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z",
    viewBox: "0 0 24 24",
  },
];

export function Footer() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 pt-14 sm:pt-20">
        <section className="relative overflow-hidden rounded-2xl bg-ink px-6 py-10 text-white sm:px-10 sm:py-12" aria-labelledby="footer-cta-title">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-emerald-300">For MCP server teams</p>
              <h2 id="footer-cta-title" className="mt-3 max-w-[23ch] text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-white sm:text-[34px]">See what happens after your server ships.</h2>
              <p className="mt-3 max-w-[55ch] text-[15px] leading-[1.6] text-white/65">Track clients, tools, latency, errors, sessions, and explicit workflow outcomes at the MCP server boundary.</p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
              <EarlyAccessButton variant="white" size="lg" label="Start with TrackMCP" />
              <a href="/docs" className="inline-flex items-center gap-1.5 px-1 py-2 text-[14px] font-medium text-white/80 transition-colors hover:text-white">Read the docs <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-[1.45fr_repeat(5,minmax(0,1fr))] lg:gap-x-7 lg:gap-y-8">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" aria-label="TrackMCP home" className="group inline-flex items-center gap-2">
              <TrackMCPAppIcon size={28} className="transition-transform duration-200 group-hover:-rotate-3" />
              <span className="font-display text-[21px] font-medium lowercase tracking-[-0.045em]"><span className="text-[#171717]">track</span><span className="text-brand">mcp</span></span>
            </Link>
            <p className="mt-4 max-w-[29ch] text-[14px] leading-[1.65] text-muted">Analytics and observability for Model Context Protocol servers.</p>
            <div className="mt-5 flex items-center gap-1.5">
              {socials.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-paper text-muted transition-colors hover:border-line-strong hover:text-ink">
                  <svg width="15" height="15" viewBox={social.viewBox} fill="currentColor" aria-hidden><path d={social.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          <nav className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-10 sm:col-span-3 sm:grid-cols-3 sm:gap-x-8 lg:col-span-5 lg:contents" aria-label="Footer navigation">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">{group.title}</h3>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}><a href={link.href} className="text-[14px] leading-[1.4] text-body transition-colors hover:text-ink">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>© 2026 TrackMCP. All rights reserved.</span>
            <span aria-hidden className="hidden text-line-strong sm:inline">·</span>
            <a href="/privacy" className="transition-colors hover:text-ink">Privacy</a>
            <a href="/terms" className="transition-colors hover:text-ink">Terms</a>
          </div>
          <span className="font-mono text-[12px] text-faint">trackmcp.com</span>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none relative select-none px-6">
        <span className="block bg-gradient-to-b from-[#e9edea] to-[#f4f6f5] bg-clip-text text-center font-display text-[19vw] font-black leading-[0.78] tracking-[-0.05em] text-transparent">trackmcp</span>
      </div>
    </footer>
  );
}
