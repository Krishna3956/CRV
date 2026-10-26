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
  DocsNextSteps,
} from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "REST API | TrackMCP Docs",
  description:
    "Send bounded MCP telemetry or query workspace analytics programmatically over a simple REST API.",
  path: "/docs/api",
});

const endpoints: { method: string; path: string; desc: string }[] = [
  { method: "POST", path: "/api/v1/ingest", desc: "Submit a validated telemetry batch" },
  { method: "POST", path: "/api/v1/otel/v1/traces", desc: "Accept bounded OTLP/HTTP JSON or protobuf MCP span metadata; gRPC is unsupported" },
  { method: "GET", path: "/api/v1/analytics?days=30[&workspace_id=...]", desc: "Workspace metrics, tools, clients, sessions, and insights" },
  { method: "GET", path: "/api/v1/tool-quality?days=30[&workspace_id=...]", desc: "Bounded tool-quality metrics, catalog history, workflow associations, and insufficient-data states" },
  { method: "GET", path: "/api/v1/alerts?limit=50[&workspace_id=...]", desc: "List authenticated workspace alert configurations" },
  { method: "GET", path: "/api/v1/alert-incidents?limit=50[&workspace_id=...]", desc: "List bounded regression incidents and their data status" },
  { method: "GET", path: "/api/v1/alert-incidents/{id}/deliveries", desc: "Inspect bounded webhook delivery attempts without secrets" },
  { method: "POST", path: "/api/v1/alert-destinations", desc: "Create a generic HTTPS webhook destination using an external secret reference" },
  { method: "GET", path: "/api/v1/traces?session_id=...|correlation_handle=...[&workspace_id=...]", desc: "Inspect ordered events for one protocol session or bounded correlation handle" },
  { method: "GET", path: "/api/v2/overview?days=30", desc: "Versioned Founder OS overview with data-trust metadata" },
  { method: "GET", path: "/api/v2/tools?days=30[&limit=50&cursor=...]", desc: "Bounded tool performance and catalog projection with optional cursor pagination" },
  { method: "GET", path: "/api/v2/tools/{name}?days=30", desc: "One tool's observed calls, errors, and latency" },
  { method: "GET", path: "/api/v2/catalogs?days=30", desc: "Current bounded catalog snapshot projection" },
  { method: "GET", path: "/api/v2/reliability?days=30", desc: "Conservative observed reliability evidence, not uptime" },
  { method: "GET", path: "/api/v2/outcomes?days=30", desc: "Evidence-backed outcomes with unknown states preserved" },
  { method: "GET", path: "/api/v2/journeys?days=30", desc: "Bounded correlated sessions, not unique people" },
  { method: "GET", path: "/api/v2/tasks?days=30", desc: "Opaque task lifecycle evidence with explicit state and no abandonment inference" },
  { method: "GET", path: "/api/v2/action-queue?status=open", desc: "Workspace-scoped action items; lifecycle mutations remain protected" },
  { method: "GET", path: "/api/v2/data-trust?days=30", desc: "Query window, freshness, counts, and truncation provenance" },
  { method: "GET", path: "/api/v2/people?days=30", desc: "Resolver coverage and client observations; no unique-user claims" },
  { method: "GET", path: "/api/v2/protocol-activity?days=30", desc: "Bounded protocol-family activity and explicit outcome states with evidence source" },
  { method: "GET", path: "/api/v2/resources?days=30", desc: "Observed resource protocol methods; entities are not inferred" },
  { method: "GET", path: "/api/v2/prompts?days=30", desc: "Observed prompt protocol methods; arguments are not exposed" },
];

export default function ApiDocsPage() {
  return (
    <DocsShell active="/docs/api">
      <DocTitle eyebrow="Reference">REST API</DocTitle>
      <DocLead>
          Send bounded MCP telemetry or query the analytics currently exposed by your
          workspace. Requests use the same TrackMCP domain as the dashboard.
      </DocLead>
      <DocsNextSteps nativeHref="/docs/reference" />

      <DocSection title="Authentication">
        <Para>
          Send your API key as a bearer token. Keys are scoped to a workspace. Browser
          dashboard requests must include the selected <Inline>workspace_id</Inline>;
          API-key requests derive the workspace from the key. Keep keys in a secret
          manager and never put them in tool arguments.
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
    "schema_version":"1",
    "event_id":"unique-id",
    "event_type":"tool_call",
    "observation_source":"server",
    "service":"my-mcp-server",
    "environment":"production",
    "tool_name":"search",
    "started_at":"2026-01-01T00:00:00Z",
    "duration_ms":42,
    "success":true,
    "is_error":false,
    "payload_policy":"redacted",
    "payload":{"args":{}}
  }]}'`}</Code>
      </DocSection>

      <DocSection title="OpenTelemetry interoperability">
        <Para>
          If you already emit OpenTelemetry spans, TrackMCP accepts a narrow
          <Inline>OTLP/HTTP JSON or protobuf</Inline> adapter at
          <Inline>/api/v1/otel/v1/traces</Inline>. Send the same workspace bearer key
          and only MCP-relevant metadata is mapped: operation, tool name, protocol,
          transport, session/request identifiers, client metadata, timing, and status.
          Span attributes, exception bodies, trace IDs, logs, baggage, arguments, and
          results are not retained by this endpoint.
        </Para>
        <Code>{`curl https://trackmcp.com/api/v1/otel/v1/traces \\
  -H "Authorization: Bearer $TRACKMCP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resourceSpans": [{
      "resource": {"attributes": [
        {"key": "service.name", "value": {"stringValue": "my-mcp-server"}},
        {"key": "deployment.environment.name", "value": {"stringValue": "production"}}
      ]},
      "scopeSpans": [{"spans": [{
        "name": "tools/call",
        "startTimeUnixNano": "1760832000000000000",
        "endTimeUnixNano": "1760832000042000000",
        "attributes": [
          {"key": "mcp.method.name", "value": {"stringValue": "tools/call"}},
          {"key": "gen_ai.tool.name", "value": {"stringValue": "search"}},
          {"key": "mcp.transport", "value": {"stringValue": "stdio"}}
        ]
      }]}]
    }]
  }'`}</Code>
        <Para>
          This is not a general-purpose trace archive and it is not a full OTel
          integration. The endpoint accepts either JSON or protobuf, up to 256 KiB and
          100 spans per request. Protobuf is metadata-only, like JSON; OTLP/gRPC
          and TrackMCP-managed external OTel export are not supported. The response
          reports accepted and rejected span counts—verify a first accepted event in the
          dashboard before relying on the integration.
        </Para>
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
          "intent_sources": { "context_parameter": 24, "external_callback": 8, "fallback": 3, "missing": 107 },
          "missing_capabilities": [{ "name": "bulk_export", "reports": 4 }],
          "tools": [{ "name": "search_docs", "calls": 14208, "error_rate": 0.002 }],
  "insights": []
}`}</Code>
      </DocSection>

      <DocSection title="Versioned Founder OS reads">
        <Para>
          The <Inline>/api/v2</Inline> family is the forward-compatible read plane for
          the Founder OS dashboard. Every endpoint is workspace-scoped and read-only;
          responses include <Inline>data_trust</Inline> so consumers can see the query
          window, source count, truncation state, and observed watermark. Unknown or
          ambiguous evidence remains unknown. In particular, client metadata is not a
          verified person identity, and resources/prompts currently expose protocol
          observations rather than inferred entities.
        </Para>
        <Para>
          Tool projections remain bounded for predictable response sizes. Add
          <Inline>limit</Inline> (1–100) to opt into paging; follow the opaque
          <Inline>page.next_cursor</Inline> until it is <Inline>null</Inline>. Existing
          requests without <Inline>limit</Inline> retain the original response shape.
        </Para>
        <Para>
          <Inline>GET /api/v2/tasks</Inline> reports only task IDs that were observed
          in bounded telemetry. Handles are one-way hashes, and the latest state is
          taken from an explicit task status. Missing events are not labeled as
          abandonment, and a completed protocol task is not treated as proof of a
          customer business outcome.
        </Para>
      </DocSection>

      <DocSection title="Trace response">
        <Para>
          <Inline>GET /api/v1/traces</Inline> requires <Inline>session_id</Inline> or
          <Inline>correlation_handle</Inline> and returns only events belonging to the
          authenticated workspace and session scope supplied by the caller. Browser
          sessions must also provide <Inline>workspace_id</Inline>; a handle is never treated as a
          session ID. The default limit is 200; callers may request 1–1,000 with <Inline>limit</Inline>.
        </Para>
        <Code>{`{
  "session_id": "session-123",
  "correlation_handle": null,
  "correlation_handle_source": "missing",
  "event_count": 2,
  "truncated": false,
  "completion_source": "session_heuristic",
  "correlation_quality": "session_id",
  "context": "Find the relevant documentation",
  "intent_source": "context_parameter",
  "missing_capability": null,
  "events": [{
    "event_id": "event-1",
    "event_type": "tool_call",
    "observation_source": "server",
    "mcp_method": "tools/call",
    "tool_name": "search_docs",
    "duration_ms": 42,
    "payload_policy": "redacted"
  }]
}`}</Code>
        <Para>
          <Inline>POST /api/v1/ingest</Inline> is the canonical write plane. It
          validates event IDs, timestamps, types, numeric fields, and batch/request
          limits; duplicate event IDs are idempotently ignored. Trace and analytics
          endpoints are read-only views of stored server-boundary telemetry.
        </Para>
      </DocSection>

      <DocSection title="Client observation provenance">
        <Para>
          The optional Node client adapter emits the same canonical event types with
          <Inline>observation_source: &quot;client&quot;</Inline>; server SDK events are
          emitted with <Inline>&quot;server&quot;</Inline>. This top-level field is
          persisted and returned in trace events. Legacy events without the versioned
          field remain nullable and are documented as <Inline>legacy_unknown</Inline>.
          Aggregate analytics and Tool Quality exclude client and legacy-unknown events
          by default, so observing a call at both boundaries does not double count it.
        </Para>
      </DocSection>

      <DocSection title="Tool-quality response">
        <Para>
          <Inline>GET /api/v1/tool-quality</Inline> is an authenticated, workspace-scoped
          read separate from aggregate analytics. <Inline>days</Inline> accepts integer
          values from 1 through 90 and defaults to 30. The source scan is bounded at
          10,000 events; <Inline>truncated</Inline> and <Inline>insufficient_data</Inline>
          make incomplete evidence visible.
        </Para>
        <Code>{`{
  "range_days": 30,
  "source_event_count": 1200,
  "truncated": false,
  "tools": [{
    "name": "search_docs",
    "metrics": {
      "tool_call_share": 0.18,
      "error_rate": 0.0333,
      "observable_empty_result_rate": 0.025,
      "retry_rate": 0.025,
      "observed_repeat_call_rate": 0.1
    },
    "completion_association": {
      "completion_rate": 0.75,
      "terminal_workflow_count": 20,
      "status": "associated_with_low_explicit_completion"
    },
    "insufficient_data": []
  }]
}`}</Code>
        <Para>
          <Inline>tool_call_share</Inline> is the tool&apos;s share of observed eligible
          tool calls, not a selection rate. Error rate uses failed calls divided by
          calls with known outcomes. Observable empty-result rate uses only successful,
          present, inspectable, non-truncated results. Retry rate uses calls with known
          retry metadata. An observed repeat call is the same tool called at least twice
          within five minutes in the same session or correlation group, excluding explicit
          retries; it is not a confirmed re-ask.
        </Para>
        <Para>
          The fixed low-completion association label requires an explicit completion rate
          strictly below <Inline>0.80</Inline>, at least 20 eligible workflows with an
          explicit completed or failed terminal outcome, and at least 30 associated
          eligible calls. Missing or unknown outcomes are excluded. The label means
          “Associated with low explicit completion” and is an association for investigation,
          never evidence of cause or an LLM/model problem. Below-volume rates are null
          with an insufficient-data reason.
        </Para>
      </DocSection>

      <DocSection title="Regression alerts">
        <Para>
          Regression alerts are disabled until a workspace explicitly configures them. The evaluator runs hourly using the latest complete UTC day compared with the preceding seven complete UTC days. It requires the metric-specific minimum volume before a finding can fire; insufficient or partial data is returned explicitly and never treated as zero.
        </Para>
        <Para>
          P1-05 evaluates server-observed events only. The fixed v1 metrics are tool error-rate spike, p95 latency regression, observable empty-result spike, retry-loop spike, catalog/description drift, workflow-completion drop, authorization-failure spike, and deployment comparison. Values in alert evidence are bounded aggregate facts and derived comparisons, not causal claims.
        </Para>
        <Code>{`{
  "metric": "tool_error_rate_spike",
  "tool_name": "search_docs",
  "environment": "production",
  "destination_ids": ["destination-id"],
  "enabled": true
}`}</Code>
        <Para>
          Generic webhook destinations use HTTPS and a secret reference managed outside the API response. Public, non-local destinations are validated at creation and again before delivery; redirects are never followed. Delivery requests are HMAC-SHA-256 signed, include an idempotency key, time out after five seconds, and retry at most three times with bounded exponential backoff. Destination secrets, raw events, payloads, prompts, completions, tokens, and private reasoning are never returned or logged.
        </Para>
        <Para>
          The recurring worker calls the authenticated internal evaluator once per hour. Its AWS SAM schedule is disabled until staging migration, shadow evaluation, delivery, and failure-recovery checks are complete. The SQL Editor migration and read-only verification steps are documented in <Code>docs/p1-05-alerts-migration-apply.md</Code>.
        </Para>
      </DocSection>

      <DocSection title="Intent and missing-capability signals">
        <Para>
          Events may include bounded <Inline>context</Inline> and an explicit
          <Inline>intent_source</Inline>: <Inline>context_parameter</Inline>,
          <Inline>external_callback</Inline>, <Inline>fallback</Inline>, or
          <Inline>missing</Inline>. Analytics responses include counts by source in
          <Inline>intent_sources</Inline> and explicit missing-tool reports in
          <Inline>missing_capabilities</Inline>. These fields never represent private
          model reasoning or an inferred user goal.
        </Para>
        <Code>{`server.trackmcp.reportMissing("bulk_export", "Export all matching records")

// A missing-capability event has:
// event_type: "custom"
// mcp_method: "trackmcp_report_missing"
// missing_capability: "bulk_export"`}</Code>
      </DocSection>

    </DocsShell>
  );
}
