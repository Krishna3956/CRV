import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Send, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { Button } from "@/components/Button";
import { breadcrumbJsonLd, pageMeta, serializeJsonLd, SITE_URL } from "@/lib/seo";

const PAGE_PATH = "/mcp-servers/social-media";
const LAST_VERIFIED = "September 12, 2026";
const DESCRIPTION =
  "Compare free and open-source social media MCP servers for publishing and scheduling, with honest notes on hosting, authentication, platform scope, and limits.";

export const metadata: Metadata = pageMeta({
  title: "Free Social Media and Autoposting MCP Servers | TrackMCP",
  description: DESCRIPTION,
  path: PAGE_PATH,
});

type ServerOption = {
  name: string;
  model: string;
  capabilities: string;
  verify: string;
  href: string;
};

const serverOptions: ServerOption[] = [
  {
    name: "PostEverywhere MCP",
    model: "Hosted API integration",
    capabilities: "Documents publishing and scheduling across Instagram, TikTok, YouTube, LinkedIn, Facebook, X, Threads, and Pinterest.",
    verify: "Check the current API key requirements, supported account types, media rules, and plan limits.",
    href: "https://github.com/posteverywhere/mcp",
  },
  {
    name: "SocialCannon",
    model: "Hosted free tier",
    capabilities: "Presents a free tier with connected accounts, monthly post limits, REST access, and an MCP interface.",
    verify: "Confirm the current free-tier allowance, platform coverage, approval flow, and how credentials are stored.",
    href: "https://socialcannon.app/",
  },
  {
    name: "1social MCP",
    model: "Remote MCP with OAuth",
    capabilities: "Documents publishing, scheduling, media workflows, receipts, retries, and browser-based sign-in.",
    verify: "Review OAuth scopes, supported networks, media constraints, retry behavior, and whether the free access terms still apply.",
    href: "https://1social.dev/mcp",
  },
  {
    name: "Social MCP",
    model: "Local or self-hosted open source",
    capabilities: "Documents integrations with official social APIs, scheduling, analytics, encrypted tokens, and platform-specific limitations.",
    verify: "You own deployment, API applications, credentials, rate limits, and the maintenance burden for each platform.",
    href: "https://github.com/IhsanKabir/social-mcp",
  },
  {
    name: "PostLake",
    model: "Agent-native hosted API",
    capabilities: "Documents a free-to-start social API with MCP access, normalized responses, idempotency, and human approval workflows.",
    verify: "Confirm current platform availability, approval defaults, quotas, and whether the API matches your publishing workflow.",
    href: "https://postlake.dev/agents/claude",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE_URL}${PAGE_PATH}#webpage`,
  url: `${SITE_URL}${PAGE_PATH}`,
  name: "Free Social Media and Autoposting MCP Servers | TrackMCP",
  description: DESCRIPTION,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@type": "Thing", name: "Social media MCP servers" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: serverOptions.map((option, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: option.name,
      url: option.href,
    })),
  },
};

export default function SocialMediaMcpPage() {
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "MCP Repository", path: "/repository" },
    { name: "Social Media MCP Servers", path: PAGE_PATH },
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
                <Link href="/free-mcp-servers" className="text-[13px] font-medium text-brand-strong hover:underline">Free MCP servers</Link>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px] text-faint">
                  <span>Social media collection</span>
                  <span aria-hidden>·</span>
                  <span>Last verified {LAST_VERIFIED}</span>
                </div>
                <h1 className="mt-4 max-w-[17ch] text-[40px] font-medium leading-[1.04] tracking-[-0.04em] text-ink sm:text-[58px]">Free autoposting MCP servers, compared honestly</h1>
                <p className="mt-5 max-w-[65ch] text-[17px] leading-[1.6] text-muted sm:text-[19px]">A practical guide to MCP servers that connect AI clients to social publishing workflows. Compare hosted free tiers, remote OAuth services, and local open source projects before you give an agent permission to post.</p>
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Button href="/tools/mcp-server-tester" variant="brand" size="lg">Inspect an MCP server <ArrowRight size={16} /></Button>
                  <Link href="/repository" className="inline-flex items-center gap-1.5 px-2 py-2 text-[14px] font-medium text-brand-strong hover:underline">Browse the MCP directory <ArrowRight size={15} /></Link>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="border-b border-line bg-mist">
            <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
              <Reveal className="max-w-2xl">
                <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand"><Send size={14} /> Quick answer</span>
                <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">The best free option depends on where you want the trust boundary.</h2>
                <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.55] text-muted">Hosted services reduce setup but require trust in a third party and may limit accounts or posts. Local and self-hosted projects offer more control, but you operate deployments, OAuth applications, API quotas, and platform changes yourself.</p>
              </Reveal>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Hosted free tier", "Fastest path to a first post. Verify quotas, data handling, and account permissions."],
                  ["Remote MCP", "Convenient agent connection. Verify OAuth scopes, approval steps, and the endpoint owner."],
                  ["Local or self-hosted", "More control over credentials and runtime. You own maintenance and platform APIs."],
                ].map(([title, body], index) => (
                  <Reveal key={title} delay={index * 0.06} y={18}>
                    <div className="h-full rounded-2xl border border-line bg-white p-5 sm:p-6">
                      <span className="font-mono text-[11px] text-brand">0{index + 1}</span>
                      <h3 className="mt-5 text-[17px] font-semibold text-ink">{title}</h3>
                      <p className="mt-2 text-[13.5px] leading-[1.6] text-muted">{body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <Reveal className="max-w-2xl">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Options to investigate</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">Use the first-party project page as the source of truth.</h2>
              <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.55] text-muted">The ecosystem changes quickly. The summary below is a discovery aid, not a guarantee that a project supports every account type, network, media format, or free-tier limit today.</p>
            </Reveal>
            <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="hidden grid-cols-[1.1fr_0.85fr_1.5fr_1.5fr] gap-4 border-b border-line bg-paper px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-faint md:grid">
                <span>Project</span><span>Delivery model</span><span>Documented scope</span><span>Verify before use</span>
              </div>
              {serverOptions.map((option, index) => (
                <Reveal key={option.name} y={12}>
                  <div className={`grid gap-4 px-5 py-6 md:grid-cols-[1.1fr_0.85fr_1.5fr_1.5fr] ${index < serverOptions.length - 1 ? "border-b border-line" : ""}`}>
                    <div>
                      <a href={option.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[16px] font-medium text-brand-strong hover:underline">{option.name} <ExternalLink size={14} /></a>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-faint md:hidden">{option.model}</p>
                    </div>
                    <p className="text-[13.5px] leading-[1.6] text-body"><span className="font-semibold text-ink md:hidden">Delivery model: </span>{option.model}</p>
                    <p className="text-[13.5px] leading-[1.6] text-body"><span className="font-semibold text-ink md:hidden">Documented scope: </span>{option.capabilities}</p>
                    <p className="text-[13.5px] leading-[1.6] text-muted"><span className="font-semibold text-ink md:hidden">Verify: </span>{option.verify}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="border-y border-line bg-paper">
            <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
              <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                <Reveal>
                  <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand-strong"><ShieldCheck size={14} /> Permissions matter</span>
                  <h2 className="mt-3 max-w-[16ch] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[38px]">Autoposting is an action boundary, not just a content task.</h2>
                  <p className="mt-4 max-w-[45ch] text-[16px] leading-[1.6] text-muted">A server that can publish or schedule posts may hold credentials and act on behalf of a person or organization. Start with the smallest set of accounts and permissions, and keep human approval for consequential actions.</p>
                  <a href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-strong hover:underline">Review an official API setup example <ExternalLink size={14} /></a>
                </Reveal>
                <Reveal delay={0.1} y={24}>
                  <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_30px_80px_-50px_rgba(10,10,10,0.35)] sm:p-8">
                    {["Confirm the server owner and source", "Review OAuth scopes or API keys", "Test with a non-production account", "Require approval before publishing", "Log the request, result, and failure path"].map((item) => (
                      <div key={item} className="flex items-start gap-3 border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0">
                        <Check size={17} className="mt-0.5 shrink-0 text-brand" />
                        <p className="text-[14px] leading-[1.55] text-body">{item}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <Reveal className="max-w-2xl">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Where TrackMCP fits</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">TrackMCP helps you understand the server boundary.</h2>
              <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.55] text-muted">TrackMCP is not an autoposting provider and does not publish to social networks. For an MCP server you operate and instrument, it can show which clients connect, which tools are called, observed latency, errors, sessions, and explicit workflow outcomes. That evidence helps you evaluate a publishing server after discovery.</p>
            </Reveal>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[14px]">
              <Link href="/mcp-observability" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:underline">Explore MCP observability <ArrowRight size={15} /></Link>
              <Link href="/blog/mcp-server-security-checklist" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:underline">Read the server security checklist <ArrowRight size={15} /></Link>
              <Link href="/free-mcp-servers" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:underline">Find more free MCP server links <ArrowRight size={15} /></Link>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
            <Reveal y={24}>
              <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center text-white sm:px-12">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" />
                <div className="relative">
                  <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-emerald-300">Before the first production post</p>
                  <h2 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">Inspect the MCP endpoint you plan to trust.</h2>
                  <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-white/65">Use the public tester for a bounded check, then instrument the server you control for deeper production evidence.</p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button href="/tools/mcp-server-tester" variant="white" size="lg">Open the MCP tester <ArrowRight size={16} /></Button>
                    <EarlyAccessButton size="lg" label="Observe your server" />
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
