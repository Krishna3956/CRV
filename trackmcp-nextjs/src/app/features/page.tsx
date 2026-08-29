import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import {
  BarChart3,
  Bell,
  Boxes,
  Check,
  Database,
  Gauge,
  GitBranch,
  Plug,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Terminal,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { LoopBars, LatencyGauge, ClientDonut } from "@/components/SignalGraphics";

export const metadata: Metadata = pageMeta({
  title: "Features | TrackMCP",
  description:
    "Tool analytics, latency and error tracking, silent-failure detection, client breakdown, sessions, alerts, and actionable insights for the MCP server you ship.",
  path: "/features",
});

/* ── in-card visuals (distinct from the home bento) ── */

function SilentFailureViz() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-[12.5px]">
        <span className="text-body">POST /mcp</span>
        <span className="rounded-full bg-mint px-2 py-0.5 text-[11px] text-mint-ink">200 OK</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 font-mono text-[12.5px]">
        <span className="text-amber-900">tools/call · send_email</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">isError: true</span>
      </div>
      <p className="pt-1 text-[12.5px] leading-relaxed text-faint">
        Your APM sees the green 200. TrackMCP reads the payload and counts the failure inside it.
      </p>
    </div>
  );
}

function CallInspectorViz() {
  const rows: [string, string, boolean?][] = [
    ["tool", "send_email"],
    ["client", "Claude"],
    ["duration", "1,240ms"],
    ["status", "error", true],
    ["error", "to: expected array", true],
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-line font-mono text-[12px]">
      {rows.map(([k, v, bad], i) => (
        <div
          key={k}
          className={`flex items-center justify-between px-3 py-2 ${
            i < rows.length - 1 ? "border-b border-line" : ""
          }`}
        >
          <span className="text-faint">{k}</span>
          <span className={bad ? "text-amber-600" : "text-body"}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function LatencyViz() {
  return (
    <div>
      <LatencyGauge className="mx-auto max-w-[220px]" />
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-line bg-paper py-2.5">
          <div className="font-mono text-[16px] font-semibold text-ink">142ms</div>
          <div className="text-[11px] uppercase tracking-wide text-faint">p50</div>
        </div>
        <div className="rounded-lg border border-line bg-paper py-2.5">
          <div className="font-mono text-[16px] font-semibold text-ink">1.2s</div>
          <div className="text-[11px] uppercase tracking-wide text-faint">p95</div>
        </div>
      </div>
    </div>
  );
}

function ClientMixViz() {
  const rows: [string, number][] = [
    ["Claude", 46],
    ["Cursor", 31],
    ["ChatGPT", 18],
    ["Custom agent", 5],
  ];
  return (
    <div className="flex items-center gap-5">
      <ClientDonut className="w-28 shrink-0" />
      <div className="flex-1 space-y-2">
        {rows.map(([n, p]) => (
          <div key={n} className="flex items-center gap-2 text-[13px]">
            <span className="text-body">{n}</span>
            <span className="ml-auto font-mono text-faint">{p}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelViz() {
  const steps: [string, number][] = [
    ["Connected", 100],
    ["Listed tools", 93],
    ["Called a tool", 81],
    ["Completed", 75],
  ];
  return (
    <div className="space-y-2.5">
      {steps.map(([s, p], i) => (
        <div key={s} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-[12.5px] text-body">{s}</span>
          <span className="relative h-5 flex-1 overflow-hidden rounded bg-mist">
            <span
              className={`absolute inset-y-0 left-0 rounded ${i === steps.length - 1 ? "bg-brand" : "bg-ink"}`}
              style={{ width: `${p}%` }}
            />
          </span>
          <span className="w-8 text-right font-mono text-[11px] text-faint">{p}%</span>
        </div>
      ))}
    </div>
  );
}

function ToolBarsViz() {
  const tools: { n: string; p: number; dead?: boolean }[] = [
    { n: "search_docs", p: 100 },
    { n: "create_issue", p: 70 },
    { n: "run_query", p: 46 },
    { n: "deploy_service", p: 0, dead: true },
    { n: "get_customer", p: 0, dead: true },
  ];
  return (
    <div className="space-y-2.5">
      {tools.map((t) => (
        <div key={t.n} className="flex items-center gap-3">
          <span className={`w-28 shrink-0 truncate font-mono text-[12px] ${t.dead ? "text-faint" : "text-body"}`}>
            {t.n}
          </span>
          <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-mist">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${t.dead ? "bg-line-strong" : "bg-brand"}`}
              style={{ width: `${t.dead ? 4 : t.p}%` }}
            />
          </span>
          <span className="w-14 text-right font-mono text-[11px] text-faint">{t.dead ? "0 calls" : ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ── data ── */

type Detail = {
  icon: ComponentType<{ size?: number; className?: string }>;
  tile: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: ReactNode;
};

const reliability: Detail[] = [
  {
    icon: BarChart3,
    tile: "bg-violet-100 text-violet-600",
    eyebrow: "Tool analytics",
    title: "Every call, ranked and trended",
    body: "See which tools get called, how often, and how that shifts week over week. The ones pulling weight and the ones just sitting there both surface immediately.",
    points: ["Call volume and share per tool", "Trends across any time range", "Break any metric down by tool"],
    visual: (
      <div className="h-40">
        <LoopBars />
      </div>
    ),
  },
  {
    icon: Gauge,
    tile: "bg-amber-100 text-amber-600",
    eyebrow: "Latency & errors",
    title: "Know which tool is slow before your users do",
    body: "Every tool gets a latency and error-rate profile. p50 for the typical call, p95 for the tail that quietly ruins agent sessions.",
    points: ["p50 and p95 latency per tool", "Error rate trended over time", "Sort tools by slowest or flakiest"],
    visual: <LatencyViz />,
  },
  {
    icon: ShieldAlert,
    tile: "bg-rose-100 text-rose-600",
    eyebrow: "Silent failures",
    title: "Catch the errors hiding inside a 200 OK",
    body: "MCP returns tool errors inside a successful response. Your HTTP logs and APM show green while agents retry and give up. TrackMCP reads the payload and counts the real failures.",
    points: [
      "Detects isError responses your logs miss",
      "Separates transport health from tool health",
      "Flags the exact tool and failure reason",
    ],
    visual: <SilentFailureViz />,
  },
  {
    icon: ScanSearch,
    tile: "bg-sky-100 text-sky-600",
    eyebrow: "Call inspector",
    title: "Open any call and see everything",
    body: "Arguments in, result out, timing, client, and the error if there was one. The full record of a single call, without grepping a log file.",
    points: ["Full arguments and result payloads", "Per-call timing and client", "Jump from a failure straight to its cause"],
    visual: <CallInspectorViz />,
  },
];

const adoption: Detail[] = [
  {
    icon: Users,
    tile: "bg-sky-100 text-sky-600",
    eyebrow: "Client breakdown",
    title: "See exactly who is calling your server",
    body: "Split every metric by the agent behind it: Claude, Cursor, ChatGPT, or a custom agent. Know where your adoption actually comes from.",
    points: ["Usage share per client", "Growth per client over time", "Filter any view by client"],
    visual: <ClientMixViz />,
  },
  {
    icon: GitBranch,
    tile: "bg-brand-soft text-brand-strong",
    eyebrow: "Sessions & funnels",
    title: "Follow one agent session end to end",
    body: "Replay a session in the exact order calls happened, and see the step where agents stall or drop off before they finish the job.",
    points: ["Full call sequence per session", "Drop-off at each step", "Completed vs failed outcomes"],
    visual: <FunnelViz />,
  },
  {
    icon: Boxes,
    tile: "bg-teal-100 text-teal-600",
    eyebrow: "Adoption & dead tools",
    title: "Find the tools nobody calls",
    body: "The tools carrying your product and the ones no agent has ever touched, side by side. Stop maintaining code and schema clutter that nothing uses.",
    points: ["Most and least used tools", "Zero-call tools flagged", "Adoption trend per tool"],
    visual: <ToolBarsViz />,
  },
];

function FeatureDetail({ item, reverse }: { item: Detail; reverse: boolean }) {
  const Icon = item.icon;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="flex items-center gap-2.5">
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${item.tile}`}>
            <Icon size={16} />
          </span>
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">{item.eyebrow}</span>
        </div>
        <h3 className="mt-3 text-[22px] font-medium tracking-[-0.02em] text-ink sm:text-[26px]">{item.title}</h3>
        <p className="mt-3 max-w-[48ch] text-[16px] leading-relaxed text-muted">{item.body}</p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {item.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[14.5px] text-body">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint">
                <Check size={12} className="text-mint-ink" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <div className="lift rounded-2xl border border-line bg-white p-6">{item.visual}</div>
      </div>
    </div>
  );
}

const aiCards = [
  {
    icon: ScanSearch,
    tile: "bg-sky-100 text-sky-600",
    title: "Detect",
    body: "Finds the tools failing silently and the ones no agent calls, without you writing a single query.",
  },
  {
    icon: Sparkles,
    tile: "bg-brand-soft text-brand-strong",
    title: "Diagnose",
    body: "Explains the root cause in plain English: the schema mismatch, the retry loop, the slow dependency.",
  },
  {
    icon: Zap,
    tile: "bg-amber-100 text-amber-600",
    title: "Project",
    body: "Estimates the calls each fix wins back, so you know what to ship first.",
  },
];

const integrations = [
  { icon: Terminal, tile: "bg-slate-100 text-slate-600", title: "TypeScript SDK", body: "Wrap the official MCP server in one line." },
  { icon: Terminal, tile: "bg-sky-100 text-sky-600", title: "Python SDK", body: "Same one-line wrap for Python servers." },
  { icon: Bell, tile: "bg-amber-100 text-amber-600", title: "Slack alerts", body: "A message the moment a tool starts failing." },
  { icon: Webhook, tile: "bg-violet-100 text-violet-600", title: "Webhooks", body: "Push events into anything you already run." },
  { icon: Plug, tile: "bg-teal-100 text-teal-600", title: "REST API", body: "Query your own metrics programmatically." },
  { icon: Database, tile: "bg-rose-100 text-rose-600", title: "OpenTelemetry export", body: "Send spans to your SIEM or warehouse." },
];

export default function FeaturesPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
       <PageFrame>
        {/* ── hero ── */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-squares dots-mask-top opacity-70" />
          <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
            <Reveal>
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Features</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mx-auto mt-4 max-w-[18ch] text-balance text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[48px]">
                Everything you get with TrackMCP
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto mt-5 max-w-[54ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                See who uses your MCP server, what they are trying to do, whether
                the work gets done, and what to fix next. All from one line of code.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <EarlyAccessButton size="lg" />
                <Button href="/docs" variant="ghost" size="lg">
                  Read the docs
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {[
                  ["Adoption", "#adoption"],
                  ["Reliability", "#reliability"],
                  ["Actionable insights", "#ai"],
                  ["Integrations", "#integrations"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-body transition-colors hover:border-line-strong"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── reliability ── */}
        <section id="reliability" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <Reveal className="max-w-2xl">
            <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Know it&apos;s working</span>
            <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
              Prove the server is healthy
            </h2>
            <p className="mt-4 text-[16px] leading-[1.5] text-muted">
              Everything an owner needs to answer one question: is my server doing its job right now?
            </p>
          </Reveal>
          <div className="mt-16 flex flex-col gap-20">
            {reliability.map((item, i) => (
              <Reveal key={item.title} y={24}>
                <FeatureDetail item={item} reverse={i % 2 === 1} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── adoption ── */}
        <section id="adoption" className="border-y border-line bg-paper">
          <div className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
            <Reveal className="max-w-2xl">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Know it&apos;s growing</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                See who uses it, and how
              </h2>
              <p className="mt-4 text-[16px] leading-[1.5] text-muted">
                The adoption side of the story: which AI clients call you, where they drop
                off, and which tools actually matter.
              </p>
            </Reveal>
            <div className="mt-16 flex flex-col gap-20">
              {adoption.map((item, i) => (
                <Reveal key={item.title} y={24}>
                  <FeatureDetail item={item} reverse={i % 2 === 1} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Actionable insights ── */}
        <section id="ai" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
              <Sparkles size={14} /> Actionable insights
            </span>
            <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
              The layer that reads the data for you
            </h2>
            <p className="mt-4 text-[16px] leading-[1.5] text-muted">
              Dashboards show numbers. TrackMCP tells you what they mean, and what to do about it.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {aiCards.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.07} y={22}>
                <div className="h-full lift rounded-2xl border border-line bg-white p-6">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${c.tile}`}>
                    <c.icon size={18} />
                  </div>
                  <h3 className="mt-4 text-[18px] font-medium text-ink">{c.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal y={20}>
            <div className="mt-4 rounded-2xl border border-line bg-white p-6 shadow-[0_30px_80px_-50px_rgba(10,10,10,0.35)] sm:p-7">
              <div className="flex items-center gap-2.5 border-b border-line pb-4">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand">
                  <Sparkles size={14} className="text-white" />
                </span>
                <span className="text-[14px] font-medium text-ink">This week&apos;s insight</span>
              </div>
              <p className="mt-4 text-[14.5px] leading-relaxed text-body">
                <span className="font-semibold text-ink">send_email is your biggest leak.</span> It failed 94% of the
                time this week. Agents tried three times, then gave up. Your schema wants{" "}
                <span className="font-mono text-brand-strong">to</span> as an array, but most agents send a plain string.
                Accept a string too and you win back about 2,100 calls a week.
              </p>
            </div>
          </Reveal>
        </section>

        {/* ── integrations ── */}
        <section id="integrations" className="border-t border-line bg-paper">
          <div className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Integrations</span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                Fits the stack you already run
              </h2>
              <p className="mt-4 text-[16px] leading-[1.5] text-muted">
                One line to install. Then send the data wherever your team already looks.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {integrations.map((c, i) => (
                <Reveal key={c.title} delay={(i % 3) * 0.06} y={20}>
                  <div className="flex h-full items-start gap-4 lift rounded-2xl border border-line bg-white p-5">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${c.tile}`}>
                      <c.icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-[15.5px] font-medium text-ink">{c.title}</h3>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{c.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
              See it on your own server
            </h2>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <EarlyAccessButton size="lg" />
              <Button href="/docs" variant="ghost" size="lg">
                Read the docs
              </Button>
            </div>
          </Reveal>
        </section>
       </PageFrame>
      </main>
      <Footer />
    </>
  );
}
