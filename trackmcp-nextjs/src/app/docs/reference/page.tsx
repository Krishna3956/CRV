import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import {
  DocsShell,
  DocTitle,
  DocLead,
  DocSection,
  Para,
  Inline,
} from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "Configuration Reference | TrackMCP Docs",
  description:
    "Every TrackMCP SDK option, the data captured on each call, and the metrics TrackMCP computes.",
  path: "/docs/reference",
});

const options: { name: string; type: string; def: string; desc: string }[] = [
  { name: "apiKey", type: "string", def: "required", desc: "Your workspace ingest key." },
  { name: "service", type: "string", def: '"mcp-server"', desc: "Name shown for this server." },
  { name: "environment", type: "string", def: '"production"', desc: "Splits data by environment." },
  { name: "sampleRate", type: "number", def: "1.0", desc: "Fraction of calls captured (0-1)." },
  { name: "payloadMode", type: '"metadata" | "redacted" | "full"', def: '"redacted"', desc: "Payload capture policy. Full is still bounded." },
  { name: "redact", type: "string[]", def: "[]", desc: "Existing dotted argument/result paths to replace locally." },
  { name: "redactKeys", type: "string[]", def: "[]", desc: "Additional case-insensitive sensitive key names." },
  { name: "maxPayloadBytes", type: "number", def: "32768", desc: "Maximum serialized payload bytes." },
  { name: "maxPayloadDepth", type: "number", def: "6", desc: "Maximum nested payload depth." },
  { name: "maxPayloadKeys", type: "number", def: "50", desc: "Maximum keys/items retained per container." },
  { name: "maxStringLength", type: "number", def: "2048", desc: "Maximum retained string length." },
  { name: "redactEvent", type: "function", def: "undefined", desc: "Mutate a sanitized event or return null to drop it." },
  { name: "endpoint", type: "string", def: "https://trackmcp.com/api/v1/ingest", desc: "Override with a compatible ingest endpoint; TrackMCP does not proxy hosted servers." },
  { name: "disabled", type: "boolean", def: "false", desc: "Turn capture off without removing the wrapper." },
  { name: "correlation", type: "object", def: "{ mode: 'none' }", desc: "Optional external or compatibility-limited issued correlation mode; disabled by default." },
  { name: "intentFallback", type: "function", def: "undefined", desc: "Optional bounded fallback context for clients that omit the context parameter; labeled fallback." },
];

const captured = [
  "Tool name and bounded sanitized arguments/results (after automatic and configured redaction)",
  "Capture policy and whether fields were truncated",
  "Client name and version when the MCP initialize exchange provides them",
  "Protocol method, transport, catalog descriptions, and schema hashes when observed",
  "Duration in milliseconds and transport status",
  "Session id, so calls can be inspected in order",
  "Timestamp and environment",
  "Optional caller context with explicit intent provenance, or an explicit missing-capability report",
];

const metrics = [
  "Active clients, new and returning connections",
  "Explicit workflow outcomes and a separately labeled session heuristic",
  "Tool call volume, adoption, and week-over-week change",
  "p50 / p95 latency and error rate per tool",
  "Observed MCP tool errors, including errors inside a successful transport response",
  "Ordered server-boundary traces and where observed sessions stop",
  "Tool call share, observable empty-result rate, explicit retry and repeat-call patterns, and historical catalog comparisons",
];

export default function ReferenceDocsPage() {
  return (
    <DocsShell active="/docs/reference">
      <DocTitle eyebrow="Reference">Configuration</DocTitle>
      <DocLead>
        Every SDK option, the data captured on each call, and the metrics TrackMCP
        computes from it.
      </DocLead>

      <DocSection title="SDK options">
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr] gap-2 border-b border-line bg-paper px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
            <span>Option</span>
            <span>Type</span>
            <span>Default</span>
          </div>
          {options.map((o) => (
            <div key={o.name} className="border-b border-line px-4 py-3 last:border-0">
              <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr] gap-2">
                <span className="font-mono text-[13px] text-ink">{o.name}</span>
                <span className="font-mono text-[12.5px] text-muted">{o.type}</span>
                <span className="font-mono text-[12.5px] text-faint">{o.def}</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">{o.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="What gets captured">
        <Para>
          On every tool call, the wrapper records the following. Arguments and results
          are sanitized and bounded in your process before transmission.
        </Para>
        <ul className="mt-1 flex flex-col gap-2">
          {captured.map((c) => (
            <li key={c} className="flex items-start gap-2.5 text-[14.5px] text-body">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {c}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="privacy" title="Privacy and payload limits">
        <Para>
          Payload capture defaults to <Inline>redacted</Inline>. Sensitive keys such as
          passwords, tokens, API keys, authorization, cookies, private keys, SSNs, and
          card numbers are replaced recursively before transmission. Data URIs, large
          base64 strings, bearer tokens, and credentialed resource URLs are scrubbed.
        </Para>
        <Para>
          <Inline>metadata</Inline> sends no arguments or results. <Inline>full</Inline> is
          opt-in but is never unlimited: every mode is capped at 32 KiB, depth 6, 50
          keys/items per container, and 2,048 characters per string. Omitted content is
          represented by a structured truncation marker, and <Inline>payload_size_bytes</Inline>
          measures the final sanitized payload. The SDK&apos;s 32 KiB payload budget is
          intentionally lower than the ingest route&apos;s independent 128 KiB payload and
          1 MiB request limits; the server limits are a last-line defense for non-SDK clients.
        </Para>
        <Para>
          The <Inline>redactEvent</Inline> hook runs after automatic sanitization. It may
          mutate the sanitized event or return <Inline>null</Inline> to drop it. Hook
          failures drop only that telemetry event; they never interrupt the wrapped MCP
          server. SDK queues are bounded to 500 events or 2 MiB, and failed deliveries
          are requeued only within those limits.
        </Para>
      </DocSection>

      <DocSection title="Metrics TrackMCP computes">
        <ul className="mt-1 flex flex-col gap-2">
          {metrics.map((m) => (
            <li key={m} className="flex items-start gap-2.5 text-[14.5px] text-body">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {m}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title="Latency, completion, and trace semantics">
        <Para>
          Tool latency is calculated from observed non-negative <Inline>duration_ms</Inline>
          values. p50 and p95 use the nearest-rank method: sort the values and select
          ranks <Inline>ceil(n × percentile)</Inline>. The dashboard shows <Inline>N/A</Inline>
          when no duration samples exist; it does not invent or interpolate a value.
        </Para>
        <Para>
          A successful tool response is not proof that the user&apos;s job finished. The
          completion source is <Inline>workflow_events</Inline> when your application
          emits an explicit workflow lifecycle event, <Inline>session_heuristic</Inline>
          when TrackMCP only sees a final successful tool call, or <Inline>none</Inline>
          when neither signal exists.
        </Para>
        <Para>
          The trace explorer is authenticated and workspace-scoped. Each trace response
          is capped at 200 events by the dashboard (API callers may request 1–1,000),
          and reports <Inline>event_count</Inline> and <Inline>truncated</Inline> so a
          partial trace is visible. TrackMCP observes the MCP server boundary; it does
          not read private model reasoning or host-side turns.
        </Para>
      </DocSection>

      <DocSection title="Tool-quality semantics">
        <Para>
          Tool-quality analytics are exposed at <Inline>/api/v1/tool-quality</Inline> and
          remain separate from aggregate analytics. <Inline>tool_call_share</Inline> is
          the observed share of eligible calls for a tool; it does not measure considered
          but unselected tools. Rates use known outcomes or inspectable payloads only, and
          missing, metadata-only, or truncated evidence is not treated as an empty result.
        </Para>
        <Para>
          An observed repeat call is the same tool called at least twice within five minutes
          in the same session or correlation group, excluding explicit retries. It is not a
          confirmed re-ask. Catalog comparisons use the snapshot effective at each call&apos;s
          timestamp. Explicit workflow completion uses only workflow IDs, ordered tool paths,
          and explicit started/completed/failed events.
        </Para>
        <Para>
          “Associated with low explicit completion” is shown only when the explicit completion
          rate is strictly below <Inline>0.80</Inline>, at least 20 eligible workflows have
          an explicit completed or failed terminal outcome, and at least 30 associated eligible
          calls exist. Unknown or missing outcomes are excluded. This is an association for
          investigation, not a causal claim or a statement about an LLM/model.
        </Para>
      </DocSection>

      <DocSection title="Correlation handles">
        <Para>
          Correlation is disabled by default. TrackMCP never overloads <Inline>session_id</Inline>
          or <Inline>request_id</Inline>. External mode accepts a synchronous application resolver
          for bounded metadata and records only a validated anonymized opaque handle. Resolver
          failures and invalid values are fail-open and recorded as missing. Handles are capped at
          128 UTF-8 bytes and must not contain credentials, URLs, emails, raw user IDs, prompts,
          completions, or private reasoning.
        </Para>
        <Para>
          TypeScript issued mode is compatibility-limited to compatible object-shaped
          <Inline>tools/list</Inline> schemas: the optional namespaced field is stripped before the
          customer handler and only echoed values receive issued provenance. Unsupported schemas
          and clients that ignore the field remain missing. Python exposes the same option names
          for parity, but its current middleware reports missing because it has no stable schema
          rewrite seam.
        </Para>
      </DocSection>

      <DocSection title="Node client adapter boundary">
        <Para>
          <Inline>@trackmcp/sdk/client-adapter</Inline> is a separate Node-only entry
          point pinned to <Inline>@modelcontextprotocol/sdk 1.30.0</Inline>. It wraps
          <Inline>StdioClientTransport</Inline> or
          <Inline>StreamableHTTPClientTransport</Inline> before
          <Inline>Client.connect(transport)</Inline>. Browser and Edge runtimes,
          frontend bundles, SSE, custom transports, Python clients, and universal
          desktop-client support are outside this release.
        </Para>
        <Para>
          Client capture defaults to metadata-only and is limited to transport-observed
          issued calls, matched results, next observable calls, repeats, and lifecycle
          boundaries. It does not claim timeout, abort, promise rejection, late-response,
          or hidden Streamable HTTP reconnect/authentication attribution. Malformed,
          notification, unmatched, and duplicate messages produce diagnostics only.
          Client events use <Inline>observation_source: &quot;client&quot;</Inline>;
          aggregate and Tool Quality metrics remain server-observation-only.
        </Para>
      </DocSection>

      <DocSection title="Intent and missing capabilities">
        <Para>
          Intent is never inferred. A compatible TypeScript tools list may advertise an
          optional <Inline>context</Inline> argument describing the user&apos;s underlying
          goal; TrackMCP removes that known field before the customer handler runs.
          Context is labeled <Inline>context_parameter</Inline>. An
          <Inline>intentFallback</Inline> callback is called only when safe context is
          absent and its value is labeled <Inline>fallback</Inline>. External systems
          may submit bounded text with <Inline>intent_source: &quot;external_callback&quot;</Inline>.
          Otherwise the source is <Inline>missing</Inline>.
        </Para>
        <Para>
          Use <Inline>trackmcp_report_missing</Inline> for an explicit missing tool or
          capability report. Context and capability values inherit the SDK string and
          privacy limits; credentials, URLs, emails, and oversized values are omitted.
          Python keeps handler arguments unchanged and exposes the same event fields and
          <Inline>report_missing</Inline> method, but does not rewrite tool schemas.
        </Para>
      </DocSection>

      <DocSection title="Environment variables">
        <Para>
          Python reads <Inline>TRACKMCP_KEY</Inline> automatically when an API key is
          not passed. TypeScript requires <Inline>apiKey</Inline> in the options. For
          a compatible deployment, pass the ingest URL explicitly as <Inline>endpoint</Inline>;
          <Inline>TRACKMCP_ENDPOINT</Inline> is not read automatically.
        </Para>
      </DocSection>
    </DocsShell>
  );
}
