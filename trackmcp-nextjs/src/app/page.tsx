import {
  Activity,
  Check,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { CopyButton } from "@/components/CopyButton";
import { Reveal } from "@/components/Reveal";
import { ClientMark } from "@/components/ClientLogos";
import { PageFrame } from "@/components/PageFrame";
import { HeroDashboardScene } from "@/components/HeroDashboardScene";
import { TrackMCPMark } from "@/components/TrackMCPMark";
import { DotGrid } from "@/components/DotGrid";
import { SectionCurve } from "@/components/SectionCurve";
import { SystemStoryScene } from "@/components/scenes/SystemStoryScene";
import { ClientAdoptionScene } from "@/components/scenes/ClientAdoptionScene";
import { WorkflowScene } from "@/components/scenes/WorkflowScene";
import { OutcomeScene } from "@/components/scenes/OutcomeScene";
import { SilentFailureScene } from "@/components/scenes/SilentFailureScene";
import { CodeWindow, K, Fn, Str, Cm, Pn } from "@/components/CodeWindow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
       <PageFrame>
        {/* ══════════ HERO — centered statement ══════════ */}
        <section className="relative">
          {/* background: faint grid + soft glow, faded before the copy */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(54%_40%_at_50%_-8%,rgba(22,163,74,0.07),transparent_72%)]" />
            <div className="bg-squares dots-mask-top absolute inset-x-0 top-0 h-[440px] opacity-70" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-14 pt-16 text-center sm:pb-16 sm:pt-24">
            <Reveal delay={0.08}>
              <h1 className="mx-auto max-w-[16ch] text-balance text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[48px]">
                See how your MCP is being used
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                Track and analyze who uses your MCP server, what they are trying to
                do, whether the work gets done, and what to fix next. All from one
                line of code.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <EarlyAccessButton size="lg" />
                <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-[13px] font-mono text-[13.5px]">
                  <span className="text-body">
                    <Pn>$</Pn> npm i <span className="text-brand">@trackmcp/sdk</span>
                  </span>
                  <CopyButton text="npm i @trackmcp/sdk" size={15} className="text-faint hover:text-ink" />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-4 text-[13.5px] text-faint">
                Add one line. Start learning
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══════════ FIRST-FOLD DIVISION — stepped white bridge → tag stack → dashboard ══════════ */}
        <section className="relative bg-mist">
          {/* white bridge: a sharp trapezoid dips from the hero into the mist,
              holding the tag stack */}
          <div className="relative mx-auto hidden w-full max-w-[680px] px-6 md:block">
            <div
              aria-hidden
              className="absolute inset-0 bg-white"
              style={{
                clipPath: "polygon(0 0, 100% 0, calc(100% - 60px) 100%, 60px 100%)",
                filter: "drop-shadow(0 20px 32px rgba(10,10,10,0.05))",
              }}
            />
            <div className="relative flex flex-wrap items-center justify-center gap-2.5 px-8 pb-6 pt-5">
              {[
                { icon: Users, label: "See who is using it", tile: "bg-sky-100 text-sky-600" },
                { icon: Wrench, label: "See what they use", tile: "bg-violet-100 text-violet-600" },
                { icon: TrendingUp, label: "Know what to improve", tile: "bg-brand-soft text-brand-strong" },
              ].map((t, i) => (
                <Reveal key={t.label} delay={0.3 + i * 0.08}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-body shadow-[0_2px_8px_-4px_rgba(10,10,10,0.15)]">
                    <span className={`grid h-6 w-6 place-items-center rounded-full ${t.tile}`}>
                      <t.icon size={13} />
                    </span>
                    {t.label}
                  </span>
                </Reveal>
              ))}
            </div>
          </div>

          {/* dashboard — the single central product object, in the mist */}
          <Reveal y={28} className="relative z-10 mx-auto mt-12 hidden max-w-[1000px] px-6 md:block">
            <HeroDashboardScene />
          </Reveal>

          {/* client compatibility */}
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-8 md:pt-16">
            <p className="text-center text-[12px] font-medium uppercase tracking-wide text-faint">
              Works with every MCP client
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-slate-500">
              {(
                [
                  { name: "Claude", label: "Claude" },
                  { name: "Cursor", label: "Cursor" },
                  { name: "ChatGPT", label: "ChatGPT" },
                  { name: "Custom", label: "Custom agents" },
                ] as const
              ).map((c, i) => (
                <Reveal key={c.name} as="span" y={6} delay={i * 0.08}>
                  <span className="flex items-center gap-2.5">
                    <ClientMark name={c.name} size={19} />
                    <span className="text-[15px] font-medium">{c.label}</span>
                  </span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ CHAPTER 5 · MCP ANALYTICS SOFTWARE → TOOL ANALYTICS PROOF ══════════ */}
        <section className="relative">
          <div
            aria-hidden
            className="bg-dots mask-fade-soft pointer-events-none absolute inset-0 -z-10 opacity-50"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            {/* editorial — category intro */}
            <Reveal className="max-w-[420px]">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                Understand usage
              </span>
              <h2 className="mt-4 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                See who is using your MCP server
              </h2>
              <p className="mt-5 text-[16px] leading-[1.5] text-muted">
                See which AI clients connect, how many are new, and how many keep
                coming back
              </p>
            </Reveal>

            {/* product proof — the live TrackMCP dashboard tour */}
            <Reveal delay={0.1} y={28} className="min-w-0 lg:pl-2">
              <ClientAdoptionScene />
            </Reveal>
          </div>
        </section>

        {/* ══════════ CHAPTER 7 · AGENT JOURNEY PRODUCT SCENE ══════════ */}
        <section className="relative overflow-hidden border-y border-line bg-mist py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <Reveal y={28} className="order-2 lg:order-1 lg:pr-6">
                <WorkflowScene />
              </Reveal>
              <Reveal className="order-1 lg:order-2">
                <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                  Workflows
                </span>
                <h2 className="mt-3 max-w-[15ch] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                  See what people are trying to do
                </h2>
                <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.5] text-muted">
                  Follow the path from the first request to a useful result. See
                  which tools people use, in what order, and where sessions stop
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════════ CHAPTER 7.5 · OUTCOMES & RETURNING USAGE ══════════ */}
        <section className="relative overflow-hidden border-t border-line bg-paper py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                Outcomes
              </span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                Know whether the work gets done
              </h2>
              <p className="mx-auto mt-4 max-w-[52ch] text-[16px] leading-[1.5] text-muted">
                See which workflows reach a result, which ones need another look,
                and whether clients come back
              </p>
            </Reveal>
            <Reveal y={28} className="relative mx-auto mt-12 max-w-[960px]">
              <OutcomeScene />
            </Reveal>
          </div>
        </section>

        {/* ══════════ CHAPTER 8 · RELIABILITY (SUPPORTING) ══════════ */}
        <section className="relative overflow-hidden border-b border-line bg-white py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="max-w-[48ch]">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                Reliability
              </span>
              <h2 className="mt-3 max-w-[18ch] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                Know where the job stops
              </h2>
              <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.5] text-muted">
                Some calls look successful but never finish the task. TrackMCP
                shows where a request stalls, gets retried, or ends without the
                result the agent wanted
              </p>
            </Reveal>
            <Reveal y={28} className="mt-12">
              <SilentFailureScene />
            </Reveal>
          </div>
        </section>

        {/* ══════════ CHAPTER 10 · ONE-LINE INSTALLATION ══════════ */}
        <section className="border-t border-line bg-paper pb-14 pt-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Reveal>
                <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                  One line of code
                </span>
                <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                  Add one line. That&apos;s it
                </h2>
                <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.5] text-muted">
                  Add one line to your server. TrackMCP takes care of the rest,
                  and your data shows up in the dashboard right away
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "Works with the official TypeScript and Python SDKs",
                    "No manual event tagging",
                    "Data shows up in your dashboard in real time",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-[15px] text-body">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-mint">
                        <Check size={12} className="text-mint-ink" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 font-mono text-[12.5px] text-body">
                  <Pn>$</Pn> npm i <span className="text-brand">@trackmcp/sdk</span>
                  <CopyButton text="npm i @trackmcp/sdk" size={13} className="ml-1 text-faint hover:text-ink" />
                </div>
              </Reveal>

              <Reveal delay={0.1} y={28} className="relative lg:pl-4">
                <DotGrid className="scale-125" />
                <div className="relative">
                  {/* floating SDK badge */}
                  <div className="absolute -right-3 -top-4 z-10 hidden items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 shadow-[0_18px_50px_-24px_rgba(10,10,10,0.4)] sm:flex">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-ink font-mono text-[11px] font-semibold text-white">
                      ts
                    </span>
                    <span className="text-[12px] text-body">
                      @trackmcp/sdk <span className="text-muted">v1.0</span>
                    </span>
                  </div>
                  <CodeWindow
                    file="server.ts"
                    copyText={`import { withTrackMCP } from "@trackmcp/sdk";
import { server } from "./mcp";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
  service: "acme-mcp-server",
});`}
                  >
                  <div>
                    <Cm>{"// wrap your existing MCP server"}</Cm>
                  </div>
                  <div>
                    <K>import</K> {"{ withTrackMCP }"} <K>from</K>{" "}
                    <Str>&quot;@trackmcp/sdk&quot;</Str>
                  </div>
                  <div>
                    <K>import</K> {"{ server }"} <K>from</K>{" "}
                    <Str>&quot;./mcp&quot;</Str>
                  </div>
                  <div>&nbsp;</div>
                  <div>
                    <K>export default</K> <Fn>withTrackMCP</Fn>(server, {"{"}
                  </div>
                  <div>
                    {"  "}apiKey: process.env.<Pn>TRACKMCP_KEY</Pn>,
                  </div>
                  <div>
                    {"  "}service: <Str>&quot;acme-mcp-server&quot;</Str>,
                  </div>
                  <div>{"})"}</div>
                  </CodeWindow>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════════ CHAPTER 11 · HOW IT WORKS (ANIMATED) ══════════ */}
        <section className="relative overflow-hidden border-b border-line bg-paper pb-24">
          {/* connector from the install code above */}
          <div className="flex flex-col items-center">
            <span aria-hidden className="h-10 w-px bg-line-strong/60" />
            <span className="rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-muted shadow-sm">
              One line in. Here&apos;s what happens next.
            </span>
            <span aria-hidden className="h-10 w-px bg-line-strong/60" />
          </div>

          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="mx-auto mb-12 max-w-2xl text-center">
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                How it works
              </span>
              <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                What happens after one line of code
              </h2>
              <p className="mx-auto mt-4 max-w-[56ch] text-[16px] leading-[1.5] text-muted">
                Agents call tools on your MCP server. TrackMCP captures every call,
                turns it into sessions and outcomes, then writes you the answer in
                plain English
              </p>
            </Reveal>
            <Reveal y={28} className="relative mx-auto max-w-[720px]">
              <DotGrid className="scale-110" />
              <div className="relative">
                <SystemStoryScene />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════ CHAPTER 9 · OBSERVABILITY STACK (after how it works) ══════════ */}
        <section className="relative mx-auto max-w-6xl px-6 py-24">
          <div
            aria-hidden
            className="bg-diag mask-fade-soft pointer-events-none absolute inset-0 -z-10 opacity-60"
          />
          <Reveal className="max-w-[52ch]">
            <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
              The observability stack
            </span>
            <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
              Logs recorded it. APM watched it. TrackMCP explains it
            </h2>
          </Reveal>

          {/* compact stepped comparison — unequal layers, TrackMCP emphasized */}
          <div className="mt-10 space-y-2.5">
            <Reveal>
              <div className="mx-auto flex items-center gap-4 rounded-xl border border-line bg-white px-5 py-3.5 lg:w-[calc(100%-6rem)]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-slate-500">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium text-ink">Server logs</p>
                  <p className="text-[13px] text-muted">Records what happened</p>
                </div>
                <span className="hidden shrink-0 font-mono text-[11px] uppercase tracking-wide text-faint sm:block">
                  Layer 01
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="mx-auto flex items-center gap-4 rounded-xl border border-line bg-white px-5 py-3.5 lg:w-[calc(100%-3rem)]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-slate-500">
                  <Activity size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium text-ink">APM &amp; tracing</p>
                  <p className="text-[13px] text-muted">Shows technical performance</p>
                </div>
                <span className="hidden shrink-0 font-mono text-[11px] uppercase tracking-wide text-faint sm:block">
                  Layer 02
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="flex items-center gap-4 rounded-xl border border-brand/40 bg-brand-soft/30 px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white">
                  <TrackMCPMark size={22} topAccent={false} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">TrackMCP</p>
                  <p className="text-[13px] text-body">
                    Shows who is using the server, what they are trying to do, and
                    what to improve
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-medium text-white sm:block">
                  Analytics layer
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════ CHAPTER 12 · ACTIONABLE INSIGHTS ══════════ */}
        <section className="relative overflow-hidden border-b border-line bg-[#f0fdf4] pb-24">
          <SectionCurve color="#ffffff" />
          <div className="relative mx-auto max-w-6xl px-6 pt-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Reveal>
                <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand-strong">
                  <Sparkles size={14} /> Actionable insights
                </span>
                <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
                  Get the answer, not another dashboard
                </h2>
                <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.5] text-muted">
                  TrackMCP turns your usage data into a short explanation of what
                  is working and what to improve, with a useful next step
                </p>
                <div className="mt-6">
                  <Button href="/features" variant="primary" size="md">
                    See how it works
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.1} y={28} className="relative">
                <DotGrid green className="scale-125" />
                {/* floating status badge */}
                <div className="absolute -left-3 -top-4 z-10 hidden items-center gap-1.5 rounded-full border border-brand/30 bg-white px-3 py-1.5 text-[12px] font-medium text-brand-strong shadow-[0_16px_40px_-20px_rgba(22,163,74,0.5)] sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Generated weekly
                </div>
                <div className="relative rounded-2xl border border-line bg-white p-6 shadow-[0_30px_80px_-50px_rgba(10,10,10,0.35)]">
                  <div className="flex items-center gap-2.5 border-b border-line pb-4">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand">
                      <Sparkles size={14} className="text-white" />
                    </span>
                    <span className="text-[14px] font-medium text-ink">Weekly insight</span>
                  </div>
                  <div className="mt-4 space-y-3.5 text-[14.5px] leading-relaxed text-body">
                    <p>
                      <span className="font-semibold text-ink">
                        send_email is your biggest leak.
                      </span>{" "}
                      It failed 94% of the time this week. Agents retried three
                      times, then gave up. Your schema expects{" "}
                      <span className="font-mono text-brand-strong">to</span> as an
                      array, but most agents send a plain string.
                    </p>
                    <div className="flex items-start gap-2.5 rounded-lg border border-line bg-mint/50 p-3">
                      <Zap size={15} className="mt-0.5 shrink-0 text-brand-strong" />
                      <span className="text-body">
                        Fix: accept a{" "}
                        <span className="font-mono text-brand-strong">string</span> too.
                        Estimated recovery: about 2,100 calls per week.
                      </span>
                    </div>
                    <p>
                      <span className="font-semibold text-ink">
                        3 tools are dead.
                      </span>{" "}
                      <span className="font-mono text-muted">
                        list_repos, get_customer, deploy_service
                      </span>{" "}
                      received zero calls this week.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════════ CHAPTER 13 · FINAL CTA ══════════ */}
        <section className="mx-auto max-w-6xl px-6 pb-4 pt-20">
          <Reveal y={24}>
            <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center text-white">
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.10]" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(22,163,74,0.28),transparent_70%)]"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12.5px] font-medium text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Analytics
                  for MCP servers
                </span>
                <h2 className="mt-5 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">
                  Make your MCP measurable
                </h2>
                <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-white/70">
                  Add one line of code and start understanding how your server is
                  being used
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <EarlyAccessButton variant="white" size="lg" />
                  <Button
                    href="/docs"
                    size="lg"
                    className="border border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    Read the docs
                  </Button>
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
