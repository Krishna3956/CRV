import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Search, ShieldCheck, Wrench } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { Button } from "@/components/Button";
import { breadcrumbJsonLd, pageMeta, serializeJsonLd, SITE_URL } from "@/lib/seo";

const PAGE_PATH = "/free-mcp-servers";
const LAST_VERIFIED = "September 12, 2026";
const DESCRIPTION =
  "Find free MCP servers and useful links, then verify installation, licensing, authentication, and production readiness before you connect a client.";

export const metadata: Metadata = pageMeta({
  title: "Free MCP Servers and Links: Browse, Verify, and Install | TrackMCP",
  description: DESCRIPTION,
  path: PAGE_PATH,
});

const sources = [
  {
    title: "TrackMCP MCP server directory",
    description: "Browse MCP servers and tools by repository metadata, category, language, and popularity.",
    href: "/repository",
    label: "Browse TrackMCP",
    internal: true,
  },
  {
    title: "Official MCP Registry",
    description: "Find published server metadata from the official Model Context Protocol registry.",
    href: "https://registry.modelcontextprotocol.io/",
    label: "Open the registry",
  },
  {
    title: "Official MCP servers repository",
    description: "Review reference and example servers maintained by the Model Context Protocol organization.",
    href: "https://github.com/modelcontextprotocol/servers",
    label: "Open GitHub",
  },
  {
    title: "MCP server categories",
    description: "Start with a category when you know the job you need a server to perform.",
    href: "/categories",
    label: "Browse categories",
    internal: true,
  },
];

const checks = [
  ["Free to inspect", "The repository, README, or registry metadata is publicly available."],
  ["Free to run", "The server can run without a paid hosted account, or documents a meaningful free tier."],
  ["Free of secrets", "A server may be open source but still require a paid provider API key."],
  ["Free of limits", "Free access can still have quotas, rate limits, model costs, or platform restrictions."],
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE_URL}${PAGE_PATH}#webpage`,
  url: `${SITE_URL}${PAGE_PATH}`,
  name: "Free MCP Servers and Links: Browse, Verify, and Install | TrackMCP",
  description: DESCRIPTION,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@type": "Thing", name: "Free Model Context Protocol servers" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: sources.map((source, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: source.title,
      url: source.internal ? `${SITE_URL}${source.href}` : source.href,
    })),
  },
};

export default function FreeMcpServersPage() {
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "MCP Repository", path: "/repository" },
    { name: "Free MCP Servers", path: PAGE_PATH },
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
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(54%_40%_at_50%_-8%,rgba(22,163,74,0.09),transparent_72%)]" />
            <div aria-hidden className="bg-squares dots-mask-top pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70" />
            <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-14 sm:pb-16 sm:pt-20">
              <Reveal>
                <Link href="/repository" className="text-[13px] font-medium text-brand-strong hover:underline">
                  MCP Repository
                </Link>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px] text-faint">
                  <span>Discovery guide</span>
                  <span aria-hidden>·</span>
                  <span>Last verified {LAST_VERIFIED}</span>
                </div>
                <h1 className="mt-4 max-w-[17ch] text-[40px] font-medium leading-[1.04] tracking-[-0.04em] text-ink sm:text-[58px]">
                  Free MCP servers, with links you can actually use
                </h1>
                <p className="mt-5 max-w-[65ch] text-[17px] leading-[1.6] text-muted sm:text-[19px]">
                  A practical starting point for finding free Model Context Protocol servers, reading the source, checking the license, and deciding whether a server is ready for your client or workflow.
                </p>
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Button href="/repository" variant="brand" size="lg">
                    Browse the MCP directory <ArrowRight size={16} />
                  </Button>
                  <Link href="/categories" className="inline-flex items-center gap-1.5 px-2 py-2 text-[14px] font-medium text-brand-strong hover:underline">
                    Browse by category <ArrowRight size={15} />
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="border-b border-line bg-mist">
            <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
              <Reveal className="max-w-2xl">
                <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">The useful distinction</span>
                <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">“Free” can describe four different things.</h2>
                <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-muted">A public GitHub repository is not automatically a free hosted service. A free server may still need credentials for the API it connects to, and a free tier may have limits that matter in production.</p>
              </Reveal>
              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {checks.map(([title, body], index) => (
                  <Reveal key={title} delay={index * 0.05} y={18}>
                    <div className="h-full rounded-2xl border border-line bg-white p-5">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand-strong"><Check size={17} /></div>
                      <h3 className="mt-5 text-[16px] font-semibold text-ink">{title}</h3>
                      <p className="mt-2 text-[13.5px] leading-[1.6] text-muted">{body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <Reveal className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand"><Search size={14} /> Where to find MCP server links</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">Start with a source, then verify the details.</h2>
              <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-muted">The pages below serve different jobs. The official registry is useful for standardized metadata. GitHub is where you inspect the implementation and license. A directory helps you compare options and find a useful starting point.</p>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {sources.map((source, index) => (
                <Reveal key={source.title} delay={index * 0.05} y={18}>
                  <div className="lift h-full rounded-2xl border border-line bg-paper p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-line">
                        {index === 0 || index === 3 ? <Search size={18} /> : <ExternalLink size={18} />}
                      </div>
                      <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-faint">{source.internal ? "TrackMCP" : "First-party source"}</span>
                    </div>
                    <h3 className="mt-5 text-[19px] font-medium tracking-[-0.02em] text-ink">{source.title}</h3>
                    <p className="mt-2 text-[14.5px] leading-[1.65] text-muted">{source.description}</p>
                    {source.internal ? (
                      <Link href={source.href} className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-strong hover:underline">{source.label} <ArrowRight size={15} /></Link>
                    ) : (
                      <a href={source.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-strong hover:underline">{source.label} <ExternalLink size={14} /></a>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="border-y border-line bg-paper">
            <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
              <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                <Reveal>
                  <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand-strong"><ShieldCheck size={14} /> Before you install</span>
                  <h2 className="mt-3 max-w-[16ch] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[38px]">A free link is the beginning of the review.</h2>
                  <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-muted">Read the setup instructions as if you were reviewing a production dependency. The important questions are usually about trust, scope, credentials, and failure behavior.</p>
                  <Link href="/blog/mcp-server-security-checklist" className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-strong hover:underline">Read the MCP security checklist <ArrowRight size={15} /></Link>
                </Reveal>
                <Reveal delay={0.1} y={24}>
                  <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_30px_80px_-50px_rgba(10,10,10,0.35)] sm:p-8">
                    {[
                      ["1", "License", "Can you use, modify, and redistribute it for your project?"],
                      ["2", "Credentials", "What API keys, OAuth scopes, or provider accounts leave your process?"],
                      ["3", "Tool scope", "Can the server read, write, delete, send, or administer anything important?"],
                      ["4", "Maintenance", "Is the repository active, versioned, and clear about supported clients?"],
                      ["5", "Failure path", "What happens when the upstream API, server, or network is unavailable?"],
                    ].map(([number, title, body]) => (
                      <div key={number} className="flex gap-4 border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0">
                        <span className="font-mono text-[12px] text-brand">{number}</span>
                        <div><p className="text-[14px] font-semibold text-ink">{title}</p><p className="mt-1 text-[13.5px] leading-[1.55] text-muted">{body}</p></div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <Reveal className="max-w-2xl">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Beyond discovery</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">Find a server, then understand how it behaves.</h2>
              <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-muted">TrackMCP is not a hosting marketplace or a promise that every listed server is safe for every workload. It helps teams discover MCP servers, inspect the boundary, and, for servers instrumented with the SDK, understand clients, tools, latency, errors, sessions, and explicit outcomes.</p>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: Search, title: "Discover", body: "Use the directory and category pages to find a plausible server for the job." },
                { icon: Wrench, title: "Inspect", body: "Run a bounded browser check on a server you control before connecting a client." },
                { icon: ShieldCheck, title: "Observe", body: "Instrument the server boundary so production usage and failure signals have context." },
              ].map(({ icon: Icon, title, body }) => (
                <Reveal key={title} y={18}>
                  <div className="rounded-2xl border border-line bg-paper p-6">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-strong"><Icon size={18} /></div>
                    <h3 className="mt-5 text-[18px] font-medium text-ink">{title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-muted">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[14px]">
              <Link href="/tools/mcp-server-tester" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:underline">Inspect an MCP server <ArrowRight size={15} /></Link>
              <Link href="/mcp-observability" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:underline">Explore MCP observability <ArrowRight size={15} /></Link>
              <Link href="/mcp-servers/social-media" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:underline">Browse social media MCP servers <ArrowRight size={15} /></Link>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
            <Reveal y={24}>
              <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center text-white sm:px-12">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" />
                <div className="relative">
                  <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-emerald-300">For MCP server teams</p>
                  <h2 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">Know what happens after someone finds your server.</h2>
                  <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-white/65">Add one boundary wrapper, keep telemetry bounded, and see which clients and tools create real production demand.</p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <EarlyAccessButton variant="white" size="lg" label="Start with TrackMCP" />
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
