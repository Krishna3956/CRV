import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, CircleAlert, Target, Wrench } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { Button } from "@/components/Button";
import { DotGrid } from "@/components/DotGrid";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "MCP Tool Usage Analytics: Adoption, Errors, and Completion | TrackMCP",
  description: "Measure MCP tool adoption, selection, errors, retries, latency, and workflow completion so you can improve the server agents actually use.",
  path: "/mcp-tool-analytics",
});

const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "@id": "https://trackmcp.com/mcp-tool-analytics#webpage", url: "https://trackmcp.com/mcp-tool-analytics", name: "MCP Tool Usage Analytics: Adoption, Errors, and Completion | TrackMCP", description: "Measure MCP tool adoption, selection, errors, retries, latency, and workflow completion.", about: { "@id": "https://trackmcp.com/#organization" } };

const metrics = [
  ["search_docs", "14,208 calls", "100%", "bg-brand"],
  ["create_issue", "9,841 calls", "69%", "bg-ink"],
  ["run_query", "6,502 calls", "46%", "bg-ink"],
  ["deploy_service", "0 calls", "unused", "bg-line-strong"],
];

const questions = [
  [BarChart3, "Adoption", "Which tools carry the product, and which ones are never selected?", "bg-violet-100 text-violet-600"],
  [Wrench, "Selection", "Do agents understand the tool names, descriptions, and input schemas?", "bg-sky-100 text-sky-600"],
  [CircleAlert, "Errors", "Which tools fail, retry, or return application errors inside a 200 response?", "bg-amber-100 text-amber-600"],
  [Target, "Completion", "Do the calls add up to a completed workflow or an abandoned session?", "bg-brand-soft text-brand-strong"],
];

function ToolBoard() {
  return <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_30px_80px_-50px_rgba(10,10,10,0.35)] sm:p-7"><DotGrid className="scale-125 opacity-40" /><div className="relative"><div className="mb-6 flex items-center justify-between"><span className="font-mono text-[12px] uppercase tracking-[0.08em] text-faint">tool adoption · last 7 days</span><span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-medium text-mint-ink">live</span></div><div className="space-y-4">{metrics.map(([name, calls, share, color]) => <div key={name}><div className="mb-1.5 flex items-center justify-between gap-4 text-[12.5px]"><span className="font-mono text-body">{name}</span><span className="font-mono text-muted">{calls} · {share}</span></div><div className="h-2 overflow-hidden rounded-full bg-mist"><div className={`h-full rounded-full ${color}`} style={{ width: share === "unused" ? "3%" : share }} /></div></div>)}</div><div className="mt-7 grid grid-cols-3 gap-2.5 border-t border-line pt-5 text-center"><div><p className="font-mono text-[20px] font-semibold text-ink">8</p><p className="text-[11px] uppercase tracking-wide text-faint">tools</p></div><div><p className="font-mono text-[20px] font-semibold text-ink">3</p><p className="text-[11px] uppercase tracking-wide text-faint">need work</p></div><div><p className="font-mono text-[20px] font-semibold text-brand-strong">75%</p><p className="text-[11px] uppercase tracking-wide text-faint">completion</p></div></div></div></div>;
}

export default function McpToolAnalyticsPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><Nav /><main className="flex-1"><PageFrame>
    <section className="relative overflow-hidden border-b border-line"><div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[450px] bg-[radial-gradient(54%_40%_at_50%_-8%,rgba(22,163,74,0.08),transparent_72%)]" /><div aria-hidden className="bg-squares dots-mask-top pointer-events-none absolute inset-x-0 top-0 h-[400px] opacity-70" /><div className="relative mx-auto max-w-3xl px-6 pb-10 pt-14 text-center sm:pb-14 sm:pt-20"><Reveal><span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-brand shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> MCP tool usage analytics</span></Reveal><Reveal delay={0.06}><h1 className="mx-auto mt-5 max-w-[16ch] text-balance text-[38px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[56px]">Know which MCP tools agents actually use</h1></Reveal><Reveal delay={0.12}><p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-[1.55] text-muted sm:text-[18px]">Measure adoption, selection, errors, latency, retries, and completion. Improve the tools that make a workflow work—not the ones that only look good in a schema.</p></Reveal><Reveal delay={0.18}><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><EarlyAccessButton size="lg" label="Measure tool usage" /><Button href="/mcp-server-analytics/quickstart" variant="ghost" size="lg">Start with the quickstart <ArrowRight size={16} /></Button></div></Reveal></div></section>

    <section className="relative overflow-hidden border-b border-line bg-mist"><div className="mx-auto max-w-4xl px-6 py-12 sm:py-20"><Reveal><ToolBoard /></Reveal></div></section>

    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24"><Reveal className="mx-auto max-w-2xl text-center"><span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">A tool is more than its schema</span><h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">The usage signal tells you what to improve.</h2><p className="mx-auto mt-4 max-w-[54ch] text-[16px] leading-[1.5] text-muted">A tool can be valid, documented, and deployed—and still be ignored by agents. Connect selection to the result of the workflow.</p></Reveal><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{questions.map(([Icon, title, body, color], i) => { const IconComponent = Icon as typeof BarChart3; return <Reveal key={title as string} delay={i * 0.06} y={20}><article className="lift h-full rounded-2xl border border-line bg-white p-5"><div className={`grid h-10 w-10 place-items-center rounded-lg ${color}`}><IconComponent size={18} /></div><h3 className="mt-5 text-[16px] font-semibold text-ink">{title as string}</h3><p className="mt-2 text-[13.5px] leading-[1.6] text-muted">{body as string}</p></article></Reveal>; })}</div></section>

    <section className="border-y border-line bg-paper"><div className="mx-auto max-w-6xl px-6 py-20 sm:py-24"><div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20"><Reveal><span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">From catalog to outcome</span><h2 className="mt-3 max-w-[15ch] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[38px]">Find the leak between discovery and completion.</h2><p className="mt-4 max-w-[44ch] text-[16px] leading-[1.55] text-muted">See where agents drop off after discovering your tools, which calls get retried, and whether a schema or dependency is costing you completed work.</p><Link href="/mcp-observability" className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-strong hover:underline">Read MCP observability <ArrowRight size={15} /></Link></Reveal><Reveal delay={0.1} y={22}><div className="rounded-2xl border border-line bg-white p-6 shadow-[0_30px_80px_-50px_rgba(10,10,10,0.35)] sm:p-8"><div className="flex items-center justify-between border-b border-line pb-4"><span className="text-[13px] font-semibold text-ink">Workflow drop-off</span><span className="font-mono text-[11px] text-faint">last 7 days</span></div><div className="mt-6 space-y-3">{[["Connected", 100], ["Discovered tools", 93], ["Called a tool", 81], ["Completed", 75]].map(([label, value], i) => <div key={label as string} className="flex items-center gap-3"><span className="w-28 shrink-0 text-[12.5px] text-body">{label as string}</span><span className="h-6 flex-1 overflow-hidden rounded-md bg-mist"><span className={`block h-full rounded-md ${i === 3 ? "bg-brand" : "bg-ink"}`} style={{ width: `${value}%` }} /></span><span className="w-9 text-right font-mono text-[11px] text-muted">{value}%</span></div>)}</div><div className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-[13px] text-muted"><Check size={16} className="text-brand" /> 75 of 100 sessions reached a result</div></div></Reveal></div></div></section>

    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24"><Reveal y={24}><div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center text-white sm:px-12"><div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" /><div className="relative"><p className="text-[12px] font-medium uppercase tracking-[0.1em] text-emerald-300">MCP tool analytics</p><h2 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">Build for the tools people use.</h2><p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-white/65">Start measuring your catalog with one server, one key, and one real workflow.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><EarlyAccessButton variant="white" size="lg" label="Get started" /><Link href="/mcp-server-analytics" className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium text-white/75 hover:text-white">See MCP analytics <ArrowRight size={15} /></Link></div></div></div></Reveal></section>
  </PageFrame></main><Footer /></>;
}
