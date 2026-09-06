import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Minus } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { Button } from "@/components/Button";
import { breadcrumbJsonLd, pageMeta, serializeJsonLd } from "@/lib/seo";

const PAGE_PATH = "/mcp-observability/compare/trackmcp-vs-sentry";
const LAST_VERIFIED = "September 7, 2026";

export const metadata: Metadata = pageMeta({
  title: "TrackMCP vs Sentry for MCP Server Observability | TrackMCP",
  description:
    "Compare TrackMCP and Sentry for MCP server observability, including tool analytics, client context, errors, latency, traces, privacy, and infrastructure monitoring.",
  path: PAGE_PATH,
});

type CellValue = "yes" | "partial" | "not documented";

const rows: Array<{ question: string; trackmcp: CellValue; sentry: CellValue }> = [
  { question: "Primary category", trackmcp: "yes", sentry: "yes" },
  { question: "MCP server-side telemetry", trackmcp: "yes", sentry: "yes" },
  { question: "Client metadata", trackmcp: "yes", sentry: "yes" },
  { question: "Tool usage and adoption", trackmcp: "yes", sentry: "partial" },
  { question: "Resource visibility", trackmcp: "partial", sentry: "yes" },
  { question: "Application errors inside successful transport responses", trackmcp: "yes", sentry: "partial" },
  { question: "Observed tool latency", trackmcp: "yes", sentry: "yes" },
  { question: "Explicit workflow or outcome signals", trackmcp: "yes", sentry: "not documented" },
  { question: "Authenticated trace exploration", trackmcp: "yes", sentry: "partial" },
  { question: "Local redaction and bounded payload controls", trackmcp: "yes", sentry: "not documented" },
  { question: "General infrastructure monitoring", trackmcp: "partial", sentry: "yes" },
  { question: "TypeScript and Python MCP SDK parity", trackmcp: "yes", sentry: "not documented" },
];

function Cell({ value }: { value: CellValue }) {
  if (value === "yes") return <Check size={16} className="text-brand" aria-label="Documented" />;
  if (value === "partial") return <span className="text-[12px] text-muted">Partial</span>;
  return <Minus size={16} className="text-faint" aria-label="Not documented" />;
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `https://trackmcp.com${PAGE_PATH}#webpage`,
  url: `https://trackmcp.com${PAGE_PATH}`,
  name: "TrackMCP vs Sentry for MCP Server Observability | TrackMCP",
  description: metadata.description,
  dateModified: "2026-09-07",
  about: [
    { "@type": "SoftwareApplication", name: "TrackMCP", url: "https://trackmcp.com/track-mcp" },
    { "@type": "SoftwareApplication", name: "Sentry", url: "https://sentry.io/" },
  ],
  isPartOf: { "@id": "https://trackmcp.com/#website" },
};

export default function TrackMcpVsSentryPage() {
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "MCP Observability", path: "/mcp-observability" },
    { name: "TrackMCP vs Sentry", path: PAGE_PATH },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([jsonLd, breadcrumbSchema]) }}
      />
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="relative overflow-hidden border-b border-line">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(54%_40%_at_50%_-8%,rgba(22,163,74,0.08),transparent_72%)]" />
            <div aria-hidden className="bg-squares dots-mask-top pointer-events-none absolute inset-x-0 top-0 h-[390px] opacity-70" />
            <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-14 sm:pb-16 sm:pt-20">
              <Reveal>
                <Link href="/mcp-observability" className="text-[13px] font-medium text-brand-strong hover:underline">
                  MCP observability
                </Link>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px] text-faint">
                  <span>Comparison</span>
                  <span aria-hidden>·</span>
                  <span>Last verified {LAST_VERIFIED}</span>
                </div>
                <h1 className="mt-4 max-w-[18ch] text-[38px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[56px]">
                  TrackMCP vs Sentry for MCP server observability
                </h1>
                <p className="mt-5 max-w-[65ch] text-[17px] leading-[1.6] text-muted sm:text-[19px]">
                  Both products can help teams see MCP server activity. The important difference is the center of gravity: TrackMCP is focused on MCP server adoption, protocol behavior, and workflow signals, while Sentry brings documented MCP monitoring into a broader error and performance platform.
                </p>
                <p className="mt-4 max-w-[65ch] text-[13.5px] leading-[1.6] text-faint">
                  This comparison reflects publicly documented capabilities reviewed on September 7, 2026. “Not documented” means the reviewed public documentation did not establish the capability; it does not prove that the capability is unavailable.
                </p>
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <EarlyAccessButton size="lg" label="Start monitoring an MCP server" />
                  <Button href="/docs" variant="ghost" size="lg">
                    Read the documentation <ArrowRight size={16} />
                  </Button>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="border-b border-line bg-mist">
            <div className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
              <Reveal>
                <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_30px_80px_-50px_rgba(10,10,10,0.3)]">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <caption className="border-b border-line bg-paper px-5 py-5 text-left text-[14px] leading-[1.6] text-muted sm:px-6">
                      Factual comparison of the documented product boundaries. Partial means the capability is adjacent, conditional, or requires additional instrumentation.
                    </caption>
                    <thead>
                      <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                        <th className="w-[52%] px-5 py-4 sm:px-6">Question</th>
                        <th className="bg-brand-soft/45 px-4 py-4 text-brand-strong">TrackMCP</th>
                        <th className="px-4 py-4">Sentry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.question} className={index < rows.length - 1 ? "border-b border-line" : ""}>
                          <th className="px-5 py-4 text-[13.5px] font-medium text-ink sm:px-6">{row.question}</th>
                          <td className="bg-brand-soft/20 px-4 py-4"><Cell value={row.trackmcp} /></td>
                          <td className="px-4 py-4"><Cell value={row.sentry} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <Reveal className="max-w-2xl">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">The practical distinction</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">Start with the decision your team needs to make.</h2>
              <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-muted">A feature checklist is useful only when it maps to an owner, a failure mode, or a production decision.</p>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <Reveal y={22}>
                <article className="h-full rounded-2xl border border-brand/25 bg-brand-soft/35 p-6 sm:p-8">
                  <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-brand-strong">TrackMCP is a better fit when</p>
                  <ul className="mt-6 space-y-4 text-[14px] leading-[1.6] text-body">
                    {[
                      "The MCP server team needs client, catalog, tool, session, and adoption context.",
                      "A tool can return an application error inside a successful transport response and that distinction matters.",
                      "You want observed server-boundary latency and explicit workflow signals in a focused dashboard.",
                      "You need bounded, redacted telemetry with metadata-only capture available when payloads are out of scope.",
                    ].map((item) => <li key={item} className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-brand" />{item}</li>)}
                  </ul>
                </article>
              </Reveal>
              <Reveal delay={0.08} y={22}>
                <article className="h-full rounded-2xl border border-line bg-white p-6 sm:p-8">
                  <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-faint">Sentry is a better fit when</p>
                  <ul className="mt-6 space-y-4 text-[14px] leading-[1.6] text-muted">
                    {[
                      "Your team already uses Sentry as the primary error and performance workflow.",
                      "The MCP server runs in a supported server-side JavaScript environment.",
                      "You want MCP activity alongside Sentry's existing issue, performance, and debugging context.",
                      "You need a broader application observability platform and MCP monitoring is one part of that system.",
                    ].map((item) => <li key={item} className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-muted" />{item}</li>)}
                  </ul>
                </article>
              </Reveal>
            </div>
          </section>

          <section className="border-y border-line bg-paper">
            <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
              <Reveal className="max-w-2xl">
                <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Know the boundary</span>
                <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">What neither server-side view automatically knows</h2>
                <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-muted">Instrumentation at the MCP server is useful precisely because it is explicit. It is not the same as access to every event in the agent host.</p>
              </Reveal>
              <div className="mt-12 grid gap-4 md:grid-cols-2">
                <Reveal y={22}>
                  <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
                    <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-faint">TrackMCP limitation</p>
                    <p className="mt-4 text-[15px] leading-[1.7] text-body">TrackMCP does not claim to see private model reasoning, hidden host prompts, provider-side behavior, token costs, or a final answer that never crosses the server boundary.</p>
                  </div>
                </Reveal>
                <Reveal delay={0.08} y={22}>
                  <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
                    <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-faint">Sentry documentation boundary</p>
                    <p className="mt-4 text-[15px] leading-[1.7] text-body">The public MCP monitoring documentation reviewed here establishes server-side JavaScript MCP coverage, but does not establish every TrackMCP-specific workflow, redaction, SDK-parity, or outcome semantic.</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <Reveal className="max-w-2xl">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Teams may use both</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">MCP analytics and application error tracking can coexist.</h2>
              <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-muted">A team might use TrackMCP to understand which clients and tools create demand, then use Sentry to investigate application exceptions and performance in the broader service. The right choice depends on which unanswered question is most urgent.</p>
            </Reveal>
            <div className="mt-8 flex flex-wrap gap-3 text-[14px]">
              <a href="https://sentry.io/changelog/mcp-monitoring---generally-available/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-strong underline underline-offset-2 hover:text-ink">Read Sentry&apos;s MCP monitoring documentation <ExternalLink size={14} /></a>
              <Link href="/mcp-server-analytics/compare" className="inline-flex items-center gap-1.5 font-medium text-brand-strong underline underline-offset-2 hover:text-ink">Compare MCP analytics with logs and APM <ArrowRight size={14} /></Link>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
            <Reveal y={24}>
              <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center text-white sm:px-12">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" />
                <div className="relative">
                  <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-emerald-300">A practical evaluation</p>
                  <h2 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">Test the boundary on one real server.</h2>
                  <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-white/65">Start with the TrackMCP quickstart, make one representative tool call, and check whether the resulting context changes a production decision.</p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <EarlyAccessButton variant="white" size="lg" label="Explore TrackMCP" />
                    <Button href="/mcp-server-analytics/quickstart" size="lg" className="border border-white/20 bg-transparent text-white hover:bg-white/10">Read the quickstart <ArrowRight size={16} /></Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
