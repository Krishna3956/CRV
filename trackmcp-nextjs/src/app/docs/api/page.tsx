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
  { method: "POST", path: "/api/v1/ingest", desc: "Submit a validated telemetry batch" },
  { method: "GET", path: "/api/v1/analytics?days=30", desc: "Workspace metrics, tools, clients, sessions, and insights" },
  { method: "GET", path: "/api/v1/traces?session_id=...", desc: "Inspect the ordered events for one session" },
];

export default function ApiDocsPage() {
  return (
    <DocsShell active="/docs/api">
      <DocTitle eyebrow="Reference">REST API</DocTitle>
      <DocLead>
          Query the analytics currently exposed by your workspace. Requests use the
          same TrackMCP domain as the dashboard.
      </DocLead>

      <DocSection title="Authentication">
        <Para>
          Send your API key as a bearer token. Keys are scoped to a workspace and can
          be read-only.
        </Para>
        <Code>{`curl "https://trackmcp.com/api/v1/analytics?days=7" \\
  -H "Authorization: Bearer $TRACKMCP_KEY"`}</Code>
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

      <DocSection title="Example analytics response">
        <Para>
          Analytics responses are JSON. The <Inline>days</Inline> query parameter
          accepts 1-90 days and defaults to 30.
        </Para>
        <Code>{`{
  "range_days": 7,
  "tool_calls": 14208,
  "sessions": 3120,
  "errors": 412,
  "completion_rate": 0.75,
  "tools": [{ "name": "search_docs", "calls": 14208, "error_rate": 0.002 }],
  "insights": []
}`}</Code>
      </DocSection>

    </DocsShell>
  );
}
