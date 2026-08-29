import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
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
  title: "REST API | TrackMCP Docs",
  description:
    "Query your MCP analytics programmatically: tools, sessions, clients, and outcomes over a simple REST API.",
  path: "/docs/api",
});

const endpoints: { method: string; path: string; desc: string }[] = [
  { method: "GET", path: "/v1/tools", desc: "Tool call volume, success rate, latency" },
  { method: "GET", path: "/v1/tools/{name}", desc: "A single tool's metrics and recent errors" },
  { method: "GET", path: "/v1/sessions", desc: "Recent sessions with steps and outcome" },
  { method: "GET", path: "/v1/clients", desc: "Client mix, new and returning connections" },
  { method: "GET", path: "/v1/workflows", desc: "Common paths and completion rates" },
  { method: "GET", path: "/v1/insights", desc: "The latest AI synthesis for a workspace" },
];

export default function ApiDocsPage() {
  return (
    <DocsShell active="/docs/api">
      <DocTitle eyebrow="Reference">REST API</DocTitle>
      <DocLead>
        Pull any metric TrackMCP computes into your own tools. The API is available on
        Pro and Enterprise plans.
      </DocLead>

      <DocSection title="Authentication">
        <Para>
          Send your API key as a bearer token. Keys are scoped to a workspace and can
          be read-only.
        </Para>
        <Code>{`curl https://api.trackmcp.com/v1/tools \\
  -H "Authorization: Bearer $TRACKMCP_KEY" \\
  -G --data-urlencode "range=7d" --data-urlencode "env=production"`}</Code>
      </DocSection>

      <DocSection title="Send telemetry">
        <Para>
          SDKs send canonical batches to the ingest endpoint automatically. You normally
          do not call it directly, but the wire format is useful when integrating another
          runtime.
        </Para>
        <Code>{`curl https://trackmcp.com/api/v1/ingest \\
  -H "Authorization: Bearer $TRACKMCP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"events":[{
    "event_id":"unique-id",
    "event_type":"tool_call",
    "service":"my-mcp-server",
    "environment":"production",
    "tool_name":"search",
    "started_at":"2026-01-01T00:00:00Z",
    "duration_ms":42,
    "success":true,
    "is_error":false,
    "payload":{"args":{}}
  }]}'`}</Code>
      </DocSection>

      <DocSection title="Endpoints">
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="grid grid-cols-[64px_1fr] gap-2 border-b border-line bg-paper px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
            <span>Method</span>
            <span>Endpoint</span>
          </div>
          {endpoints.map((e) => (
            <div
              key={e.path}
              className="grid grid-cols-[64px_1fr] items-baseline gap-2 border-b border-line px-4 py-3 last:border-0"
            >
              <span className="font-mono text-[11px] font-semibold text-brand-strong">{e.method}</span>
              <span>
                <span className="font-mono text-[13px] text-ink">{e.path}</span>
                <span className="mt-0.5 block text-[13px] text-muted">{e.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Example response">
        <Para>
          All responses are JSON. Timestamps are ISO 8601, and ranges accept{" "}
          <Inline>24h</Inline>, <Inline>7d</Inline>, or <Inline>30d</Inline>.
        </Para>
        <Code>{`{
  "range": "7d",
  "tools": [
    { "name": "search_docs", "calls": 14208, "success": 0.998, "p95_ms": 210 },
    { "name": "send_email",  "calls": 412,   "success": 0.06,  "p95_ms": 1240 }
  ]
}`}</Code>
      </DocSection>

      <DocSection title="Rate limits">
        <Para>
          The API allows 600 requests per minute per workspace. Exceeding it returns{" "}
          <Inline>429</Inline> with a <Inline>Retry-After</Inline> header.
        </Para>
      </DocSection>
    </DocsShell>
  );
}
