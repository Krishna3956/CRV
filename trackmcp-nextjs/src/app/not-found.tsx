import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Home, LayoutGrid, Radio } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { TrackMCPMark } from "@/components/TrackMCPMark";

function MissingSignalGraphic() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]" aria-hidden="true">
      <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_52%_46%,rgba(22,163,74,0.12),transparent_52%)]" />
      <svg viewBox="0 0 560 430" className="relative h-auto w-full" fill="none">
        <defs>
          <filter id="not-found-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <linearGradient id="not-found-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e5e5e5" stopOpacity="0" />
            <stop offset="0.45" stopColor="#bbf7d0" />
            <stop offset="1" stopColor="#e5e5e5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* blueprint frame */}
        <path d="M42 64v-18h18M518 64v-18h-18M42 366v18h18M518 366v18h-18" stroke="#d4d4d4" />
        <path d="M42 88v258M518 88v258" stroke="#f0f0f0" strokeDasharray="2 8" />
        <path d="M66 82h428M66 348h428" stroke="#f0f0f0" strokeDasharray="2 8" />

        {/* disconnected route */}
        <path d="M94 188C150 188 165 188 206 218" stroke="#e5e5e5" strokeWidth="2" />
        <path d="M354 218C398 184 423 164 476 164" stroke="#e5e5e5" strokeWidth="2" />
        <path d="M94 188C150 188 165 188 206 218" stroke="url(#not-found-fade)" strokeWidth="2" strokeDasharray="6 10" className="wire-flow" />
        <path d="M354 218C398 184 423 164 476 164" stroke="url(#not-found-fade)" strokeWidth="2" strokeDasharray="6 10" className="wire-flow" style={{ animationDelay: "-2s" }} />

        {/* left agent */}
        <g className="animate-bob" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <rect x="62" y="156" width="64" height="64" rx="18" fill="#fff" stroke="#d4d4d4" strokeWidth="2" />
          <circle cx="84" cy="185" r="4" fill="#0a0a0a" />
          <circle cx="104" cy="185" r="4" fill="#0a0a0a" />
          <path d="M82 199c7 6 17 6 24 0" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        </g>
        <text x="94" y="248" textAnchor="middle" fill="#6b7280" fontFamily="monospace" fontSize="12">request</text>

        {/* central missing hub */}
        <g className="animate-breathe" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx="280" cy="218" r="72" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4 8" />
          <circle cx="280" cy="218" r="56" fill="#0a0a0a" />
          <circle cx="280" cy="218" r="64" stroke="#bbf7d0" strokeOpacity="0.45" filter="url(#not-found-glow)" />
          <g transform="translate(256 194) scale(1.5)">
            <TrackMCPMark size={32} topAccent={false} className="text-white" />
          </g>
        </g>
        <text x="280" y="318" textAnchor="middle" fill="#6b7280" fontFamily="monospace" fontSize="12">signal missing</text>

        {/* lonely tool */}
        <g className="animate-wiggle" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <rect x="434" y="132" width="74" height="64" rx="18" fill="#fff" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="457" cy="164" r="5" fill="#f59e0b" />
          <path d="M469 157h24M469 168h18" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          <circle cx="500" cy="132" r="10" fill="#f59e0b" />
          <path d="M500 127v6M500 137v1" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </g>
        <text x="471" y="224" textAnchor="middle" fill="#6b7280" fontFamily="monospace" fontSize="12">no route</text>

        {/* small telemetry readout */}
        <g transform="translate(160 358)">
          <rect width="240" height="32" rx="16" fill="#fafafa" stroke="#e5e5e5" />
          <circle cx="18" cy="16" r="4" fill="#f59e0b" />
          <text x="32" y="20" fill="#6b7280" fontFamily="monospace" fontSize="11">404 / endpoint unavailable</text>
        </g>
      </svg>
    </div>
  );
}

const exits = [
  { href: "/repository", label: "Browse the MCP directory", icon: LayoutGrid },
  { href: "/mcp-server-analytics", label: "See MCP analytics", icon: Radio },
  { href: "/docs", label: "Read the docs", icon: BookOpen },
];

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="relative isolate overflow-hidden border-b border-line bg-paper">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="bg-squares dots-mask-top absolute inset-x-0 top-0 h-[520px] opacity-70" />
              <div className="absolute left-1/2 top-0 h-[460px] w-[min(720px,100vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(22,163,74,0.09),transparent_68%)]" />
            </div>

            <div className="mx-auto grid max-w-6xl items-center gap-4 px-6 pb-20 pt-12 sm:pb-28 sm:pt-20 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8 lg:pt-24">
              <div className="relative z-10 max-w-[520px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted shadow-[0_4px_16px_-10px_rgba(10,10,10,0.2)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  404 · signal lost
                </div>
                <h1 className="mt-6 max-w-[11ch] text-balance text-[44px] font-medium leading-[0.98] tracking-[-0.04em] text-ink sm:text-[64px]">
                  This route wandered off.
                </h1>
                <p className="mt-6 max-w-[47ch] text-[16px] leading-[1.55] text-muted sm:text-[17px]">
                  The page you were looking for isn&apos;t connected to the network anymore. It may never have been. Let&apos;s get you back to useful MCP territory.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-[18px] py-[11px] text-[15px] font-medium text-white transition duration-150 hover:bg-black active:scale-[0.97]"
                  >
                    <Home size={16} />
                    Back to home
                  </Link>
                  <Link
                    href="/repository"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-[18px] py-[11px] text-[15px] font-medium text-ink transition duration-150 hover:border-muted hover:bg-paper active:scale-[0.97]"
                  >
                    Find an MCP <ArrowRight size={16} />
                  </Link>
                </div>

                <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted transition-colors hover:text-ink">
                  <ArrowLeft size={15} />
                  Or return to the starting point
                </Link>
              </div>

              <MissingSignalGraphic />
            </div>
          </section>

          <section className="bg-white">
            <div className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
              <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Useful next signals</p>
                  <h2 className="mt-2 text-[24px] font-medium tracking-[-0.025em] text-ink">Keep exploring TrackMCP</h2>
                </div>
                <p className="max-w-[34ch] text-[14px] leading-relaxed text-muted sm:text-right">
                  The directory is full of tools. The dashboard is full of answers.
                </p>
              </div>
              <div className="grid gap-3 pt-6 md:grid-cols-3">
                {exits.map((exit) => (
                  <Link
                    key={exit.href}
                    href={exit.href}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-paper p-3.5 transition duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:bg-white hover:shadow-[0_14px_30px_-22px_rgba(10,10,10,0.35)]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                      <exit.icon size={17} />
                    </span>
                    <span className="flex-1 text-[14px] font-medium text-body">{exit.label}</span>
                    <ArrowRight size={15} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
