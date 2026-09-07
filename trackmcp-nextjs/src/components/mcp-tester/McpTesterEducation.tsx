import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheck, ExternalLink, LockKeyhole, Network, ShieldCheck } from "lucide-react";

export const MCP_TESTER_FAQS = [
  {
    question: "What does the MCP server tester send?",
    answer: "It sends the MCP initialize request, the required initialized notification, and bounded catalog requests for tools, resources, and prompts when those capabilities are advertised. It never executes tools or retrieves resource and prompt contents.",
  },
  {
    question: "Why can a healthy server appear browser blocked?",
    answer: "The browser enforces CORS and network policy. A server can be reachable from another client while refusing a browser-direct request. The report separates browser or CORS blocking from an HTTP server failure when the browser exposes enough evidence to do so.",
  },
  {
    question: "Can hostname checks prevent DNS rebinding?",
    answer: "No. Browser-side hostname validation reduces obvious private-target risk but cannot guarantee the IP address resolved when the request is made. Test only endpoints you trust. TrackMCP does not use a server-side proxy.",
  },
  {
    question: "Are credentials saved or sent to TrackMCP?",
    answer: "No. Custom headers stay in memory for the current browser run, are omitted from reports, and are cleared after the run. The tester does not send test input or credentials to TrackMCP ingest or analytics.",
  },
] as const;

const checks = [
  { icon: Network, title: "Reachability and transport", body: "Checks an HTTPS Streamable HTTP endpoint directly from your browser with bounded time and response limits." },
  { icon: CircleCheck, title: "Protocol and identity", body: "Negotiates MCP, confirms the initialized session when required, and records the server name, version, and capabilities." },
  { icon: ShieldCheck, title: "Catalog discovery", body: "Lists tools and, only when advertised, resources and prompts. Catalog contents are inspected without reading or executing anything." },
  { icon: CircleAlert, title: "Health evidence", body: "Reports latency, pagination, catalog quality, browser compatibility, authentication, findings, and an evidence-based verdict." },
];

export function McpTesterEducation() {
  return (
    <div className="border-t border-line">
      <section id="what-it-checks" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">Read-only coverage</p>
          <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">What this MCP server test checks</h2>
          <p className="mt-4 text-[15px] leading-[1.65] text-muted">The tester builds a bounded snapshot of what a browser can observe from your endpoint today. It is designed for diagnosis, not uptime monitoring or production certification.</p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {checks.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-line bg-white p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand-strong"><Icon size={18} /></div>
              <h3 className="mt-5 text-[16px] font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-to-test" className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">Quick start</p>
            <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">How to test an MCP server</h2>
            <p className="mt-4 text-[15px] leading-[1.65] text-muted">Use an endpoint you control or have permission to test. The browser sends requests directly to that endpoint and clears custom headers after each run.</p>
          </div>
          <ol className="space-y-3">
            {[
              ["Enter the endpoint", "Paste an HTTPS Streamable HTTP MCP endpoint. Local, private, metadata, credential-bearing, and unsupported targets are rejected."],
              ["Add a short-lived header only if needed", "Custom headers are optional, bounded, kept in memory, and never included in the report or sent to TrackMCP."],
              ["Test MCP server", "Run the read-only handshake and catalog discovery. Cancel or reset at any time."],
              ["Read the evidence", "Use the verdict, dimensions, timeline, catalog summary, latency, and incomplete-result indicators to decide what to investigate next."],
            ].map(([title, body], index) => (
              <li key={title} className="flex gap-4 rounded-xl border border-line bg-white p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white">{index + 1}</span>
                <div><h3 className="text-[14px] font-semibold text-ink">{title}</h3><p className="mt-1 text-[13px] leading-[1.55] text-muted">{body}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="common-outcomes" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">Read the verdict</p>
          <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">Common errors and troubleshooting</h2>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {[
            ["Healthy now", "The endpoint negotiated MCP and completed the bounded discovery flow without material findings."],
            ["Degraded", "The endpoint responded, but latency, pagination, catalog quality, or another health dimension needs attention."],
            ["Authentication required", "The server asked for credentials or the supplied authentication was not accepted. Use only a short-lived credential you are authorized to test."],
            ["Browser or CORS blocked", "The browser could not expose a usable response because of CORS or a browser network policy. This does not prove the server is down."],
            ["Protocol error or unsupported", "The response was malformed, negotiated an unsupported protocol, or advertised a transport outside this tool's boundary."],
            ["Unreachable or incomplete", "A network failure, timeout, cancellation, or bound prevented enough evidence for a complete result."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border border-line bg-paper px-4 py-4"><h3 className="text-[14px] font-semibold text-ink">{title}</h3><p className="mt-1.5 text-[13px] leading-[1.55] text-muted">{body}</p></article>
          ))}
        </div>
      </section>

      <section id="supported-transports" className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">Transport boundary</p>
            <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">Supported transports</h2>
            <p className="mt-4 text-[15px] leading-[1.65] text-muted">This public tester supports browser-direct HTTPS Streamable HTTP only. It does not proxy requests or use a server-side arbitrary URL fetcher.</p>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft/40 p-4"><Network size={17} className="mt-0.5 shrink-0 text-brand-strong" /><p className="text-[13px] leading-[1.55] text-brand-strong">Supported: HTTPS MCP Streamable HTTP with browser CORS behavior and bounded, read-only JSON-RPC discovery.</p></div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="text-[16px] font-semibold text-ink">Outside this tool</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] leading-[1.5] text-muted">
              {[
                "STDIO and local process transports",
                "WebSockets and standalone SSE",
                "OAuth registration or credential exchange",
                "Tool execution, resources/read, and prompts/get",
                "Server-side proxying or arbitrary URL fetching",
              ].map((item) => <li key={item} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section id="security-privacy" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">Safety first</p>
            <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">Security and privacy limitations</h2>
          </div>
          <div className="space-y-3">
            {[
              ["Browser-only execution", "The engine is designed for a browser runtime and the UI injects the browser fetch implementation. Browser runtime detection is a heuristic, not a cryptographic guarantee."],
              ["Private-target checks", "Non-HTTPS, localhost, private IP, link-local, cloud-metadata, credential-bearing, and unsafe header targets are rejected before a request."],
              ["DNS rebinding limitation", "Hostname validation cannot guarantee the IP address resolved at request time. Browser-direct testing avoids server-side SSRF, but users should test only endpoints they trust."],
              ["Bounded and redacted output", "Response bodies, JSON, pagination, timelines, duration, and serialized reports are bounded. Credential-like values are redacted from findings, reports, and displayed evidence."],
            ].map(([title, body]) => <div key={title} className="rounded-xl border border-line bg-paper p-4"><div className="flex gap-3"><LockKeyhole size={16} className="mt-0.5 shrink-0 text-brand-strong" /><div><h3 className="text-[14px] font-semibold text-ink">{title}</h3><p className="mt-1 text-[13px] leading-[1.55] text-muted">{body}</p></div></div></div>)}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-line bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">FAQ</p>
          <h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">Questions before you run a test</h2>
          <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white px-5">
            {MCP_TESTER_FAQS.map(({ question, answer }) => <details key={question} className="group py-4"><summary className="cursor-pointer list-none pr-6 text-[14px] font-semibold text-ink marker:hidden group-open:text-brand-strong">{question}</summary><p className="mt-2 text-[13px] leading-[1.6] text-muted">{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section id="related-tools" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">Keep exploring</p><h2 className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">Tools and MCP documentation</h2></div><Link href="#mcp-endpoint" className="inline-flex items-center gap-2 text-[13px] font-medium text-brand-strong hover:underline">Test another server <ArrowRight size={15} /></Link></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["MCP Health Check", "Focus on reachability, protocol negotiation, latency, and browser compatibility.", "/tools/mcp-health-check"],
            ["MCP Inspector", "Review server identity, capabilities, and read-only catalogs.", "/tools/mcp-inspector"],
            ["MCP documentation", "Read the supported browser boundary and SDK documentation.", "/docs"],
          ].map(([title, body, href]) => <Link key={title} href={href} className="group rounded-xl border border-line bg-white p-5 hover:border-line-strong"><div className="flex items-center justify-between gap-3"><h3 className="text-[15px] font-semibold text-ink">{title}</h3><ExternalLink size={15} className="text-faint transition-colors group-hover:text-brand-strong" /></div><p className="mt-2 text-[13px] leading-[1.55] text-muted">{body}</p></Link>)}
        </div>
      </section>
    </div>
  );
}
