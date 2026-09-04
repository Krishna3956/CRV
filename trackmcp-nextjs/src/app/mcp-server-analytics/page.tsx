import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, Check, Gauge, ShieldCheck, Users, Wrench } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/Button";
import { HeroDashboardScene } from "@/components/HeroDashboardScene";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "MCP Server Analytics and Observability | TrackMCP",
  description:
    "TrackMCP is analytics and observability for MCP servers. Measure clients, tools, sessions, errors, latency, retries, and workflow completion.",
  path: "/mcp-server-analytics",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": "https://trackmcp.com/mcp-server-analytics#webpage", url: "https://trackmcp.com/mcp-server-analytics", name: "MCP Server Analytics and Observability | TrackMCP", about: { "@id": "https://trackmcp.com/#organization" } },
    { "@type": "SoftwareApplication", "@id": "https://trackmcp.com/mcp-server-analytics#software", name: "TrackMCP", description: "Analytics and observability for Model Context Protocol servers.", applicationCategory: "DeveloperApplication", operatingSystem: "Cross-platform", isAccessibleForFree: true, url: "https://trackmcp.com/mcp-server-analytics", publisher: { "@id": "https://trackmcp.com/#organization" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://trackmcp.com/" }, { "@type": "ListItem", position: 2, name: "MCP Server Analytics", item: "https://trackmcp.com/mcp-server-analytics" }] },
  ],
};

const signals = [
  { icon: Users, label: "Who", title: "Clients and connections", body: "See which clients connect, where usage comes from, and which environments are actually active.", tile: "bg-sky-100 text-sky-600" },
  { icon: Wrench, label: "What", title: "Tools and workflows", body: "Understand the tools agents reach for, the paths they take, and the catalog gaps that block them.", tile: "bg-violet-100 text-violet-600" },
  { icon: Activity, label: "Where", title: "Failures and drop-off", body: "Find the first broken call, retry loop, slow dependency, or silent application error inside a 200 OK.", tile: "bg-rose-100 text-rose-600" },
];

const measures = [
  ["01", "Adoption", "Which clients and tools create real demand?", "46%", "Claude"],
  ["02", "Reliability", "Which calls are slow, retried, or failing?", "1.2s", "p95 latency"],
  ["03", "Outcomes", "Did the workflow finish the job?", "75%", "completion"],
];

function InstallPill() {
  return <div className="inline-flex items-center gap-3 rounded-lg border border-line bg-paper px-4 py-2.5 font-mono text-[13px] text-body"><span className="text-faint">$</span><span>npm i <span className="text-brand">@trackmcp/sdk</span></span><CopyButton text="npm i @trackmcp/sdk" size={14} className="text-faint hover:text-ink" /></div>;
}

export default function McpServerAnalyticsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Nav />
      <main className="flex-1"><PageFrame>
        <section className="relative overflow-hidden border-b border-line">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(54%_40%_at_50%_-8%,rgba(22,163,74,0.08),transparent_72%)]" />
          <div aria-hidden className="bg-squares dots-mask-top pointer-events-none absolute inset-x-0 top-0 h-[440px] opacity-70" />
          <div className="relative mx-auto max-w-3xl px-6 pb-10 pt-14 text-center sm:pb-14 sm:pt-20">
            <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-brand shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> MCP server analytics</span></Reveal>
            <Reveal delay={0.06}><h1 className="mx-auto mt-5 max-w-[16ch] text-balance text-[38px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[56px]">See how your MCP server is being used</h1></Reveal>
            <Reveal delay={0.12}><p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-[1.55] text-muted sm:text-[18px]">Track clients, tools, sessions, failures, and workflow outcomes from one line at the server boundary. Know what to fix before another agent gets stuck.</p></Reveal>
            <Reveal delay={0.18}><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><EarlyAccessButton size="lg" label="Start measuring" /><InstallPill /></div></Reveal>
            <Reveal delay={0.22}><p className="mt-4 text-[13px] text-faint">TypeScript and Python · asynchronous telemetry · fail-open by design</p></Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-line bg-mist"><div className="mx-auto max-w-[1040px] px-6 pb-16 pt-10 sm:pb-24 sm:pt-14"><Reveal className="relative z-10"><HeroDashboardScene /></Reveal></div></section>

        <section className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <Reveal className="mx-auto max-w-2xl text-center"><span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">The questions that matter</span><h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">Your server is talking. Start listening.</h2><p className="mx-auto mt-4 max-w-[54ch] text-[16px] leading-[1.5] text-muted">Transport logs tell you that a request happened. MCP analytics tells you whether the agent got where it was going.</p></Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">{signals.map(({ icon: Icon, label, title, body, tile }, i) => <Reveal key={title} delay={i * 0.07} y={22}><article className="lift h-full rounded-2xl border border-line bg-white p-6"><div className={`grid h-10 w-10 place-items-center rounded-lg ${tile}`}><Icon size={18} /></div><p className="mt-5 text-[12px] font-medium uppercase tracking-[0.04em] text-brand">{label}</p><h3 className="mt-2 text-[20px] font-medium tracking-[-0.02em] text-ink">{title}</h3><p className="mt-3 text-[14.5px] leading-[1.6] text-muted">{body}</p></article></Reveal>)}</div>
        </section>

        <section className="relative overflow-hidden border-y border-line bg-paper"><div className="mx-auto max-w-6xl px-6 py-20 sm:py-24"><div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20"><Reveal><span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">From signal to decision</span><h2 className="mt-3 max-w-[15ch] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[38px]">A clearer picture of every workflow.</h2><p className="mt-5 max-w-[44ch] text-[16px] leading-[1.55] text-muted">Connect what happened at the protocol layer to the product question behind it: who tried, where they stopped, and what change is worth shipping next.</p><div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-[14px] font-medium"><Link href="/features" className="inline-flex items-center gap-1.5 text-brand-strong hover:underline">See every feature <ArrowRight size={15} /></Link><Link href="/mcp-server-analytics/quickstart" className="inline-flex items-center gap-1.5 text-brand-strong hover:underline">Open the quickstart <ArrowRight size={15} /></Link></div></Reveal><div className="space-y-3">{measures.map(([number, label, question, value, note], i) => <Reveal key={number} delay={i * 0.07} y={18}><div className="lift grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4 sm:px-6 sm:py-5"><span className="font-mono text-[11px] text-brand">{number}</span><div className="min-w-0"><p className="text-[14px] font-semibold text-ink">{label}</p><p className="mt-1 text-[13.5px] leading-[1.45] text-muted">{question}</p></div><div className="text-right"><p className="font-mono text-[20px] font-semibold tracking-[-0.04em] text-ink">{value}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-faint">{note}</p></div></div></Reveal>)}</div></div></div></section>

        <section className="relative overflow-hidden bg-[#f0fdf4]"><div className="mx-auto max-w-6xl px-6 py-20 sm:py-24"><div className="grid items-center gap-12 lg:grid-cols-2"><Reveal><div className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand-strong"><ShieldCheck size={14} /> Built for the server boundary</div><h2 className="mt-3 max-w-[17ch] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[38px]">Useful telemetry without changing your tools.</h2><p className="mt-4 max-w-[46ch] text-[16px] leading-[1.55] text-muted">Wrap the server you already ship. Redact locally, send only the metadata you need, and keep serving even if telemetry is unavailable.</p><ul className="mt-7 space-y-3 text-[14px] text-body">{["No manual event tagging", "Application errors remain visible inside 200 responses", "TypeScript and Python SDKs"].map((item) => <li key={item} className="flex items-center gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-mint"><Check size={12} className="text-mint-ink" /></span>{item}</li>)}</ul></Reveal><Reveal delay={0.1} y={24}><div className="rounded-2xl border border-brand/20 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(10,10,10,0.35)] sm:p-8"><div className="flex items-center justify-between border-b border-line pb-4"><span className="font-mono text-[12px] text-faint">server.ts</span><span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-medium text-mint-ink">one line at the boundary</span></div><pre className="mt-5 overflow-x-auto font-mono text-[13px] leading-[1.8] text-body"><code><span className="text-violet">export default</span> <span className="text-brand-strong">withTrackMCP</span>(server, &#123;{`\n`}  apiKey: process.env.TRACKMCP_KEY,{`\n`}  service: <span className="text-violet">&quot;acme-mcp-server&quot;</span>,{`\n`}&#125;);</code></pre><div className="mt-6 flex items-center gap-3 border-t border-line pt-5 text-[13px] text-muted"><Gauge size={16} className="text-brand" /> Async flush · fail-open · privacy-aware</div></div></Reveal></div></div></section>

        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24"><Reveal y={24}><div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center text-white sm:px-12"><div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" /><div className="relative"><p className="text-[12px] font-medium uppercase tracking-[0.1em] text-emerald-300">Analytics for MCP servers</p><h2 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">Make the next call a better one.</h2><p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-white/65">Start with one server, one key, and one real workflow.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><EarlyAccessButton variant="white" size="lg" label="Start measuring" /><Button href="/docs" size="lg" className="border border-white/20 bg-transparent text-white hover:bg-white/10">Read the docs</Button></div></div></div></Reveal></section>
      </PageFrame></main>
      <Footer />
    </>
  );
}
