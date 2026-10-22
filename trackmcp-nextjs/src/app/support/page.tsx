import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, LifeBuoy, Minus } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { breadcrumbJsonLd, pageMeta, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Pilot support and known limitations | TrackMCP",
  description:
    "Get TrackMCP pilot support, troubleshoot first-event setup, and see the capabilities and limitations covered by the current release.",
  path: "/support",
});

const supported = [
  "Terminal-first activation with `npx @trackmcp/cli init`, browser approval, and CLI-only key redemption.",
  "Existing-key reuse and the bounded `npx @trackmcp/cli doctor --non-interactive` diagnostic summary.",
  "TypeScript/Node.js and Python server-boundary SDK paths with local redaction and fail-open telemetry delivery.",
  "Authenticated, workspace-scoped ingest with bounded payloads, atomic batches, and key revocation checks.",
];

const limited = [
  "Dashboard analytics, catalog history, and Action Queue reads are bounded. The UI may disclose partial or truncated evidence.",
  "Python coverage is server-boundary instrumentation; this pilot does not claim client-side instrumentation for Python.",
  "OTel interoperability is limited to authenticated OTLP/HTTP JSON with bounded MCP mapping and local redaction.",
  "Worker cadence, alert delivery, and scheduler lag depend on the deployed runtime and remain operationally monitored during the pilot.",
];

const excluded = [
  "Automatic authentication during `npm install` or `pip install`; package installation remains silent and activation is explicit.",
  "OTLP/gRPC, arbitrary OTel encodings, or external telemetry export. OTLP/HTTP protobuf is supported only through the bounded metadata-only receiver.",
  "Unlimited analytics windows, zero-latency reads, or a guarantee that a successful tool call means telemetry was accepted.",
  "Self-service destructive deletion. Privacy requests remain review-only until the reviewed deletion workflow is available.",
];

function ScopeList({ items, tone }: { items: string[]; tone: "supported" | "limited" | "excluded" }) {
  const Icon = tone === "supported" ? Check : tone === "limited" ? CircleAlert : Minus;
  const color = tone === "supported" ? "text-brand-strong" : tone === "limited" ? "text-amber-700" : "text-muted";
  return (
    <ul className="mt-5 space-y-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[14px] leading-[1.6] text-body">
          <Icon size={17} className={`mt-0.5 shrink-0 ${color}`} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SupportPage() {
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Pilot support", path: "/support" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="relative overflow-hidden border-b border-line">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-squares dots-mask-top opacity-70" />
            <div className="relative mx-auto max-w-3xl px-6 py-16 text-center">
              <Reveal>
                <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                  <LifeBuoy size={15} aria-hidden /> Pilot support
                </span>
                <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[48px]">
                  Know what TrackMCP measures—and where the pilot stops.
                </h1>
                <p className="mx-auto mt-4 max-w-[58ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                  This page is the source of truth for the current 100-customer pilot. It explains the supported setup path, honest boundaries, and the safe information support needs to help you.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-14" aria-labelledby="start-title">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Reveal>
                <div className="rounded-2xl border border-line bg-white p-7 sm:p-9">
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand">Start here</p>
                  <h2 id="start-title" className="mt-3 text-[28px] font-medium tracking-[-0.025em] text-ink">Activate from a terminal</h2>
                  <p className="mt-3 max-w-[58ch] text-[15px] leading-[1.65] text-muted">
                    Run the command below from the project that owns your MCP server. The CLI installs the SDK when needed, reuses a valid local key, or opens the browser approval flow when activation is required.
                  </p>
                  <pre className="mt-6 overflow-x-auto rounded-xl bg-ink p-4 text-[13px] leading-[1.6] text-white"><code>npx @trackmcp/cli init</code></pre>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                    <Link href="/docs" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:text-ink">Read the setup docs <ArrowRight size={15} /></Link>
                    <Link href="/contact" className="inline-flex items-center gap-1.5 font-medium text-brand-strong hover:text-ink">Contact support <ArrowRight size={15} /></Link>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.08} y={22}>
                <div className="rounded-2xl border border-brand/20 bg-brand-soft/40 p-7 sm:p-9">
                  <h2 className="text-[21px] font-medium tracking-[-0.02em] text-ink">When support needs evidence</h2>
                  <p className="mt-3 text-[14px] leading-[1.65] text-body">Share the CLI/SDK version, runtime, command, approximate UTC time, and the safe status category. Never share an API key, `.env` file, device code, cookie, authorization header, or raw request/response body.</p>
                  <pre className="mt-5 overflow-x-auto rounded-xl border border-brand/20 bg-white p-4 text-[12.5px] leading-[1.6] text-ink"><code>npx @trackmcp/cli doctor --non-interactive</code></pre>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-16" aria-labelledby="scope-title">
            <Reveal>
              <div className="max-w-2xl">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand">Pilot boundary</p>
                <h2 id="scope-title" className="mt-3 text-[30px] font-medium tracking-[-0.025em] text-ink">The release scope in plain language</h2>
                <p className="mt-3 text-[15px] leading-[1.65] text-muted">“Supported” means the documented contract exists. “Limited” means the product intentionally exposes a bounded or partial view. Items marked out of scope are not promises for this pilot.</p>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <Reveal y={20}><div className="h-full rounded-2xl border border-brand/25 bg-brand-soft/25 p-6"><h3 className="text-[18px] font-medium text-ink">Supported</h3><ScopeList items={supported} tone="supported" /></div></Reveal>
              <Reveal delay={0.07} y={20}><div className="h-full rounded-2xl border border-amber-200 bg-amber-50/70 p-6"><h3 className="text-[18px] font-medium text-ink">Limited by design</h3><ScopeList items={limited} tone="limited" /></div></Reveal>
              <Reveal delay={0.14} y={20}><div className="h-full rounded-2xl border border-line bg-mist/45 p-6"><h3 className="text-[18px] font-medium text-ink">Not in this pilot</h3><ScopeList items={excluded} tone="excluded" /></div></Reveal>
            </div>
          </section>

          <section className="border-t border-line bg-paper" aria-labelledby="first-event-title">
            <div className="mx-auto max-w-6xl px-6 py-14">
              <Reveal>
                <h2 id="first-event-title" className="text-[26px] font-medium tracking-[-0.025em] text-ink">If activation succeeds but the dashboard is empty</h2>
                <ol className="mt-5 grid gap-3 text-[14px] leading-[1.6] text-body sm:grid-cols-2">
                  <li><strong className="font-medium text-ink">1.</strong> Confirm `TRACKMCP_KEY` is available to the process that starts the server.</li>
                  <li><strong className="font-medium text-ink">2.</strong> Make one real tool call; a successful call alone does not prove telemetry was accepted.</li>
                  <li><strong className="font-medium text-ink">3.</strong> Check the documented ingest endpoint and use “Check for data” once.</li>
                  <li><strong className="font-medium text-ink">4.</strong> Contact support with safe diagnostics—never with the key or raw payload.</li>
                </ol>
              </Reveal>
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
