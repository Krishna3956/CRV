import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Terminal, Braces, Plug, SlidersHorizontal, Check, ShieldCheck } from "lucide-react";
import {
  DocsShell,
  DocTitle,
  DocLead,
  DocSection,
  Para,
  Code,
  Inline,
} from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "Docs | TrackMCP",
  description:
    "Get up and running with TrackMCP in minutes. Install the SDK, wrap your server, and start seeing analytics.",
  path: "/docs",
});

const cards = [
  { icon: Terminal, t: "TypeScript SDK", d: "Wrap a Node MCP server in one line.", href: "/docs/typescript" },
  { icon: Braces, t: "Python SDK", d: "Wrap a Python MCP server and capture calls, sessions, and clients.", href: "/docs/python" },
  { icon: Plug, t: "REST API", d: "Query your own metrics programmatically.", href: "/docs/api" },
  { icon: SlidersHorizontal, t: "Configuration", d: "Every option, event, and metric.", href: "/docs/reference" },
];

export default function DocsPage() {
  return (
    <DocsShell active="/docs">
      <DocTitle eyebrow="Docs">Get started with TrackMCP</DocTitle>
      <DocLead>
        TrackMCP is the observability layer for MCP servers. Add it at the server
        boundary, keep your tools unchanged, and turn protocol traffic into usage,
        reliability, and outcome signals.
      </DocLead>

      <DocSection id="quickstart" title="Quickstart">
        <Para>
          Install the SDK, create a workspace key, wrap your server, and deploy. Data
          appears in your dashboard after the first telemetry flush.
        </Para>
        <Code>{`# TypeScript
npm i @trackmcp/sdk
# Create a key at https://app.trackmcp.com/dashboard

          # Python
          python3 -m pip install trackmcp
# Create your key at https://app.trackmcp.com/dashboard`}</Code>
        <Code>{`import { withTrackMCP } from "@trackmcp/sdk";
import { server } from "./mcp";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
  service: "acme-mcp-server",
  environment: "production",
});`}</Code>
        <Para>
          That&apos;s the whole setup. The wrapper observes the MCP protocol layer and
          tool calls without changing your tool implementations. Errors returned
          inside a successful <Inline>200 OK</Inline> are preserved in the captured
          result.
        </Para>
      </DocSection>

      <DocSection id="how-it-works" title="How TrackMCP works">
        <Para>
          MCP clients first initialize a connection and discover the server catalog.
          They then call tools, receive results, and may retry or stop. TrackMCP
          observes this lifecycle at the server boundary and sends small batched
          telemetry events to your workspace.
        </Para>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Observe", "Capture protocol methods, tool calls, sessions, clients, and errors."],
            ["2", "Protect", "Redact sensitive paths in your process before telemetry leaves your server."],
            ["3", "Explain", "Group events into traces and actionable signals in the dashboard."],
          ].map(([number, title, body]) => (
            <div key={title} className="rounded-xl border border-line bg-white p-4">
              <span className="font-mono text-xs text-brand">{number}</span>
              <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Choose your integration">
        <Para>
          Use the SDK that matches the language of the process hosting your MCP
          server. The wrapper is additive: it records telemetry without changing
          tool definitions or the responses your clients receive.
        </Para>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/docs/typescript" className="rounded-xl border border-line bg-white p-4 hover:border-line-strong">
            <span className="flex items-center gap-2 text-sm font-medium text-ink"><Terminal size={16} className="text-brand" /> TypeScript / Node.js</span>
            <p className="mt-2 text-xs leading-relaxed text-muted">For MCP servers running in Node.js. Install the published npm package and wrap your server.</p>
          </Link>
          <Link href="/docs/python" className="rounded-xl border border-line bg-white p-4 hover:border-line-strong">
            <span className="flex items-center gap-2 text-sm font-medium text-ink"><Braces size={16} className="text-brand" /> Python</span>
            <p className="mt-2 text-xs leading-relaxed text-muted">For Python MCP servers. Install the published package and wrap your server object.</p>
          </Link>
        </div>
      </DocSection>

      <DocSection id="verify-data" title="Verify your first event">
        <Para>
          After starting the instrumented server, make one real tool call from your
          MCP client. Return to the dashboard and choose Check for data. A successful
          connection shows an event, a session, the discovered catalog, and the
          client name when the client provides one.
        </Para>
        <div className="rounded-xl border border-brand/20 bg-brand-soft/40 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-ink"><Check size={16} className="text-brand" /> What success looks like</p>
          <p className="mt-2 text-sm leading-relaxed text-body">The dashboard changes from the sample workspace to your live workspace. If it does not, check that the key belongs to this workspace, the server can reach the ingest URL, and the process has made a tool call.</p>
        </div>
      </DocSection>

      <DocSection title="Privacy and failure behavior">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4"><ShieldCheck size={18} className="text-brand" /><h3 className="mt-3 text-sm font-semibold text-ink">Redaction happens locally</h3><p className="mt-1.5 text-xs leading-relaxed text-muted">Use redact rules for secrets and personal data. The SDK replaces matching values before sending the batch.</p></div>
          <div className="rounded-xl border border-line bg-white p-4"><Plug size={18} className="text-brand" /><h3 className="mt-3 text-sm font-semibold text-ink">Telemetry is fail-open</h3><p className="mt-1.5 text-xs leading-relaxed text-muted">If TrackMCP is unavailable, the SDK requeues telemetry and does not block the MCP call.</p></div>
        </div>
      </DocSection>

      <DocSection id="troubleshooting" title="Troubleshooting">
        <div className="space-y-3">
          {[
            ["No data appears", "Confirm TRACKMCP_KEY is set in the same process that runs the MCP server, then make a fresh tool call."],
            ["Invalid or revoked API key", "Generate a new key in the signed-in workspace and restart the server after updating the environment."],
            ["The install command fails", "Use Node.js 18 or newer for TypeScript, or Python 3.9 or newer for Python. Confirm the package name exactly."],
          ].map(([title, body]) => <div key={title} className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-medium text-ink">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{body}</p></div>)}
        </div>
      </DocSection>

      <DocSection title="Explore">
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-start gap-3.5 rounded-xl border border-line bg-white p-4 transition-colors hover:border-line-strong"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-paper">
                <c.icon size={17} className="text-brand" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[14.5px] font-medium text-ink">
                  {c.t}
                  <ArrowRight size={13} className="text-faint transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{c.d}</span>
              </span>
            </Link>
          ))}
        </div>
      </DocSection>
    </DocsShell>
  );
}
