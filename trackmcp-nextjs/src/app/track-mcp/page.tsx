import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Eye, Gauge, Users } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { pageMeta, serializeJsonLd } from "@/lib/seo";

const TITLE = "Track MCP: analytics for Model Context Protocol servers | TrackMCP";
const DESCRIPTION =
  "Track MCP, written as TrackMCP, is analytics and observability for Model Context Protocol servers. See clients, tools, failures, latency, and workflow outcomes.";

const features = [
  { icon: Users, title: "See who connects", body: "Identify the MCP clients, environments, and sessions creating real demand." },
  { icon: Eye, title: "Understand tool use", body: "See which tools agents discover, choose, retry, and leave unused." },
  { icon: Gauge, title: "Improve the workflow", body: "Find slow calls, silent application errors, and the point where work stopped." },
];

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/track-mcp" });

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://trackmcp.com/track-mcp#webpage",
      url: "https://trackmcp.com/track-mcp",
      name: TITLE,
      description: DESCRIPTION,
      about: { "@id": "https://trackmcp.com/#webapplication" },
      isPartOf: { "@id": "https://trackmcp.com/#website" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Track MCP?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Track MCP, written as TrackMCP, is analytics and observability for Model Context Protocol servers. It shows which clients connect, which tools agents use, where calls fail, and whether workflows complete.",
          },
        },
        {
          "@type": "Question",
          name: "How do I start using Track MCP?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Install the TrackMCP TypeScript or Python SDK, wrap the MCP server at its boundary, create a workspace key, and make one real tool call. The first event then appears in the TrackMCP dashboard.",
          },
        },
      ],
    },
  ],
};

export default function TrackMcpPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="border-b border-line bg-paper">
            <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand">Track MCP</p>
              <h1 className="mt-4 max-w-[18ch] text-[40px] font-medium leading-[1.04] tracking-[-0.04em] text-ink sm:text-[58px]">
                Track MCP servers from connection to outcome.
              </h1>
              <p className="mt-6 max-w-[60ch] text-[17px] leading-[1.65] text-body sm:text-[19px]">
                Track MCP, written as TrackMCP, is the analytics and observability layer for teams shipping Model Context Protocol servers. See who connects, what agents call, where a workflow breaks, and what to improve next.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <EarlyAccessButton size="lg" label="Start measuring" />
                <Link href="/docs" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-strong hover:underline">
                  Read the docs <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="grid gap-4 md:grid-cols-3">
              {features.map(({ icon: FeatureIcon, title, body }) => {
                return (
                  <article key={title} className="rounded-2xl border border-line bg-white p-6">
                    <FeatureIcon size={19} className="text-brand" />
                    <h2 className="mt-5 text-[19px] font-medium tracking-[-0.02em] text-ink">{title}</h2>
                    <p className="mt-2 text-[14.5px] leading-[1.6] text-muted">{body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="border-y border-line bg-mist">
            <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
              <h2 className="text-[28px] font-medium tracking-[-0.03em] text-ink">How Track MCP works</h2>
              <p className="mt-4 max-w-[65ch] text-[15.5px] leading-[1.7] text-muted">
                Add the SDK at the server boundary. TrackMCP captures protocol methods, tool calls, sessions, clients, errors, latency, retries, and workflow signals while leaving your tools and responses unchanged.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                {["Install the TypeScript or Python SDK", "Wrap your existing MCP server", "Make one real tool call and inspect the result"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-body">
                    <Check size={17} className="mt-0.5 shrink-0 text-brand" /> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[14px] font-medium">
                <Link href="/mcp-server-analytics" className="inline-flex items-center gap-1.5 text-brand-strong hover:underline">MCP server analytics <ArrowRight size={15} /></Link>
                <Link href="/mcp-server-analytics/quickstart" className="inline-flex items-center gap-1.5 text-brand-strong hover:underline">Open the quickstart <ArrowRight size={15} /></Link>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
            <h2 className="text-[28px] font-medium tracking-[-0.03em] text-ink">Frequently asked questions</h2>
            <div className="mt-7 space-y-6">
              <div>
                <h3 className="text-[17px] font-medium text-ink">What is Track MCP?</h3>
                <p className="mt-2 text-[15px] leading-[1.7] text-muted">Track MCP is the spaced way to write TrackMCP, the analytics and observability product for Model Context Protocol servers.</p>
              </div>
              <div>
                <h3 className="text-[17px] font-medium text-ink">Who is Track MCP for?</h3>
                <p className="mt-2 text-[15px] leading-[1.7] text-muted">Track MCP is for teams that build or operate MCP servers and need to understand adoption, reliability, tool usage, and workflow outcomes.</p>
              </div>
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
