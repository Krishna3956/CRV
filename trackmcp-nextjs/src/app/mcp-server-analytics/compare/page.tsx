import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { Button } from "@/components/Button";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "MCP Analytics Compared with Logs, APM, and Uptime Monitoring | TrackMCP",
  description: "Compare MCP server analytics with logs, APM, uptime monitoring, and building telemetry in-house. Choose the layer that fits your problem.",
  path: "/mcp-server-analytics/compare",
});

const rows = [
  ["Individual request detail", true, true, true, true],
  ["Endpoint availability", false, true, true, true],
  ["MCP client breakdown", true, false, false, "Depends"],
  ["Tool adoption and unused tools", true, false, false, "Depends"],
  ["MCP application errors inside 200 responses", true, false, false, "Depends"],
  ["Ordered sessions and workflow paths", true, false, false, "Depends"],
  ["Custom control over data model", "Some", "Some", "Some", true],
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} className="text-brand" aria-label="Yes" />;
  if (value === false) return <Minus size={16} className="text-faint" aria-label="No" />;
  return <span className="text-[12px] text-muted">{value}</span>;
}

export default function McpAnalyticsComparePage() {
  return <><Nav /><main className="flex-1"><PageFrame>
    <section className="relative overflow-hidden border-b border-line"><div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[430px] bg-[radial-gradient(54%_40%_at_50%_-8%,rgba(22,163,74,0.08),transparent_72%)]" /><div aria-hidden className="bg-squares dots-mask-top pointer-events-none absolute inset-x-0 top-0 h-[380px] opacity-70" /><div className="relative mx-auto max-w-3xl px-6 pb-10 pt-14 text-center sm:pb-14 sm:pt-20"><Reveal><span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-brand shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> MCP analytics comparison</span></Reveal><Reveal delay={0.06}><h1 className="mx-auto mt-5 max-w-[17ch] text-balance text-[38px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[56px]">Which observability layer does your MCP server need?</h1></Reveal><Reveal delay={0.12}><p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-[1.55] text-muted sm:text-[18px]">Logs, APM, uptime checks, and custom telemetry all have a place. This comparison shows where MCP-specific analytics adds useful context.</p></Reveal><Reveal delay={0.18}><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><EarlyAccessButton size="lg" label="Try TrackMCP" /><Button href="/mcp-server-analytics/quickstart" variant="ghost" size="lg">Read the quickstart <ArrowRight size={16} /></Button></div></Reveal></div></section>

    <section className="border-b border-line bg-mist"><div className="mx-auto max-w-6xl overflow-x-auto px-6 py-12 sm:py-20"><Reveal><div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-50px_rgba(10,10,10,0.3)]"><table className="w-full min-w-[760px] border-collapse text-left"><caption className="border-b border-line bg-paper px-5 py-5 text-left text-[14px] leading-[1.6] text-muted sm:px-6">A capability comparison. “Depends” means the approach can support it with additional instrumentation or custom analysis.</caption><thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.1em] text-faint"><th className="w-[34%] px-5 py-4 sm:px-6">Question</th><th className="bg-brand-soft/45 px-4 py-4 text-brand-strong">TrackMCP</th><th className="px-4 py-4">Logs</th><th className="px-4 py-4">APM</th><th className="px-4 py-4">In-house</th></tr></thead><tbody>{rows.map(([label, track, logs, apm, custom], index) => <tr key={String(label)} className={index < rows.length - 1 ? "border-b border-line" : ""}><th className="px-5 py-4 text-[13.5px] font-medium text-ink sm:px-6">{label}</th><td className="bg-brand-soft/20 px-4 py-4"><Cell value={track} /></td><td className="px-4 py-4"><Cell value={logs} /></td><td className="px-4 py-4"><Cell value={apm} /></td><td className="px-4 py-4"><Cell value={custom} /></td></tr>)}</tbody></table></div></Reveal></div></section>

    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24"><Reveal className="mx-auto max-w-2xl text-center"><span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Choose by the question</span><h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">Keep every layer that earns its place.</h2><p className="mx-auto mt-4 max-w-[54ch] text-[16px] leading-[1.5] text-muted">TrackMCP complements logs, APM, and uptime monitoring. The right choice depends on the decision your team needs to make.</p></Reveal><div className="mt-12 grid gap-4 md:grid-cols-2"><Reveal y={22}><article className="lift h-full rounded-2xl border border-brand/25 bg-brand-soft/35 p-6 sm:p-8"><p className="text-[12px] font-medium uppercase tracking-[0.1em] text-brand-strong">Choose TrackMCP when</p><ul className="mt-6 space-y-4 text-[14px] leading-[1.6] text-body">{["You need to know which clients and tools create demand.", "Monitoring misses application errors inside successful transport responses.", "You want sessions, retries, and workflow completion—not only request logs.", "You want MCP-specific telemetry without rewriting your tools."].map((item) => <li key={item} className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-brand" />{item}</li>)}</ul></article></Reveal><Reveal delay={0.08} y={22}><article className="lift h-full rounded-2xl border border-line bg-white p-6 sm:p-8"><p className="text-[12px] font-medium uppercase tracking-[0.1em] text-faint">Use another layer when</p><ul className="mt-6 space-y-4 text-[14px] leading-[1.6] text-muted">{["You only need to know whether an endpoint responds.", "Your existing APM already answers your MCP-specific questions.", "You need a deeply customized internal data model.", "You are investigating one request and structured logs are sufficient."].map((item) => <li key={item} className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-muted" />{item}</li>)}</ul></article></Reveal></div></section>

    <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24"><Reveal y={24}><div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center text-white sm:px-12"><div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" /><div className="relative"><p className="text-[12px] font-medium uppercase tracking-[0.1em] text-emerald-300">A practical evaluation</p><h2 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">Test one real workflow.</h2><p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-white/65">Instrument one server, make one call, and see whether the added context changes a decision.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><EarlyAccessButton variant="white" size="lg" label="Start measuring" /><Link href="/mcp-observability" className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium text-white/75 hover:text-white">Read MCP observability <ArrowRight size={15} /></Link></div></div></div></Reveal></section>
  </PageFrame></main><Footer /></>;
}
