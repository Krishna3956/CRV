import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Clock3, ListTree, LockKeyhole, Waves } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PageFrame } from "@/components/PageFrame";
import { breadcrumbJsonLd, pageMeta, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Test an MCP Server with Approved Fixtures | TrackMCP",
  description: "Explore the approved MCP fixture scenarios for safe, read-only browser testing of HTTPS Streamable HTTP servers.",
  path: "/tools/test-mcp-server",
});

const fixtures = [
  { icon: Check, name: "Echo catalog", body: "A minimal healthy catalog with one descriptive, read-only tool definition.", color: "bg-brand-soft text-brand-strong" },
  { icon: LockKeyhole, name: "Authentication challenge", body: "A controlled response that lets the tester distinguish authentication from browser blocking.", color: "bg-violet-100 text-violet-700" },
  { icon: ListTree, name: "Paginated catalog", body: "Multiple tools/list pages for checking bounded cursor handling and truncation findings.", color: "bg-sky-100 text-sky-700" },
  { icon: Clock3, name: "Slow response", body: "A delayed response scenario for checking cancellation, timeout, and incomplete verdicts.", color: "bg-amber-100 text-amber-700" },
  { icon: CircleAlert, name: "Protocol error", body: "Malformed or JSON-RPC error responses for verifying safe error classification.", color: "bg-red-100 text-red-700" },
  { icon: Waves, name: "Complex catalog", body: "A larger catalog with schema variety for checking catalog quality and bounded rendering.", color: "bg-mint text-mint-ink" },
];

export default function TestMcpServerPage() {
  const jsonLd = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Test an MCP Server", path: "/tools/test-mcp-server" }]);
  return <>
    <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>
    <Nav />
    <main className="flex-1"><PageFrame>
      <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(50%_38%_at_50%_0%,rgba(22,163,74,0.08),transparent_74%)]"><div aria-hidden className="bg-squares dots-mask-top pointer-events-none absolute inset-x-0 top-0 h-[360px] opacity-60" /><div className="relative mx-auto max-w-4xl px-6 pb-14 pt-16 text-center sm:pb-20 sm:pt-24"><p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">Approved fixture catalogue</p><h1 className="mx-auto mt-4 max-w-[16ch] text-balance text-[40px] font-medium leading-[1.05] tracking-[-0.04em] text-ink sm:text-[58px]">Test an MCP server with safe fixture scenarios</h1><p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-[1.6] text-muted sm:text-[18px]">Use these scenarios to validate how a browser-direct MCP tester reports success, failure, authentication, pagination, and timeout behavior.</p></div></section>
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fixtures.map(({ icon: Icon, name, body, color }) => <article key={name} className="lift rounded-2xl border border-line bg-white p-5"><div className={`grid h-10 w-10 place-items-center rounded-lg ${color}`}><Icon size={18} /></div><h2 className="mt-5 text-[17px] font-semibold text-ink">{name}</h2><p className="mt-2 text-[13.5px] leading-[1.6] text-muted">{body}</p><div className="mt-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-faint"><span className="h-1.5 w-1.5 rounded-full bg-line-strong" /> Fixture endpoint publishing is separate</div></article>)}</div></section>
      <section className="border-y border-line bg-paper"><div className="mx-auto max-w-3xl px-6 py-14 text-center sm:py-20"><p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand-strong">Fixture boundary</p><h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink">This page does not fetch or host a mock server</h2><p className="mx-auto mt-4 max-w-[58ch] text-[15px] leading-[1.6] text-muted">The approved scenarios are listed here while their HTTPS fixture endpoints are published in a separate milestone. The tester itself remains browser-direct and never uses a server-side proxy.</p><Link href="/tools/mcp-server-tester" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-[14px] font-medium text-white hover:bg-brand-strong">Open the MCP tester <ArrowRight size={16} /></Link></div></section>
    </PageFrame></main>
    <Footer />
  </>;
}
