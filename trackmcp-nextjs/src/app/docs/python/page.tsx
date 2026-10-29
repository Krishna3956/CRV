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
  title: "Python SDK | TrackMCP Docs",
  description:
    "Install the trackmcp package and wrap your Python MCP server to capture bounded server-side tool, session, and client observations.",
  path: "/docs/python",
});

export default function PythonDocsPage() {
  return (
    <DocsShell active="/docs/python">
      <DocTitle eyebrow="SDKs">Python SDK</DocTitle>
      <DocLead>
        The <Inline>trackmcp</Inline> package wraps an MCP server at its server
        boundary to capture bounded tool, session, catalog, and client observations.
        It works with Python 3.9+ and the official MCP SDK.
      </DocLead>
      <DocsNextSteps nativeHref="/docs/reference" />

      <DocSection title="Install">
        <Para>
          Python uses the package manager and a workspace connection key. The TrackMCP
          CLI currently bootstraps the TypeScript SDK; for Python, create or copy a key
          from your authenticated <a href="/dashboard" className="font-medium text-brand-strong underline">workspace dashboard</a> and keep it in the same environment that runs your server.
        </Para>
        <Code>{`python3 -m pip install trackmcp
# or: uv add trackmcp / poetry add trackmcp`}</Code>
        <Code>{`trackmcp init
# SSH or CI:
trackmcp init --no-browser
# Diagnostics:
trackmcp doctor`}</Code>
      </DocSection>

      <DocSection title="Wrap your server">
        <Para>
          Wrap your existing server with <Inline>with_trackmcp</Inline> and pass your
          API key. Your tools stay exactly as they are.
        </Para>
        <Code>{`import os
from mcp.server.fastmcp import FastMCP
from trackmcp import with_trackmcp

server = FastMCP("acme-mcp-server")

app = with_trackmcp(
    server,
    api_key=os.environ["TRACKMCP_KEY"],
    service="acme-mcp-server",
    environment="production",
    transport="stdio",  # state the transport your server actually uses
)`}</Code>
      </DocSection>

      <DocSection title="Coverage boundary">
        <Para>
          This is server-side instrumentation. It observes supported MCP requests
          reaching the wrapped server; it does not inspect a host application&apos;s private
          model turns or instrument Python MCP client transports. Set
          <Inline>transport</Inline> when your application knows it
          (<Inline>stdio</Inline>, <Inline>streamable_http</Inline>,
          <Inline>sse</Inline>, or <Inline>custom</Inline>). When omitted, transport is
          recorded as unknown instead of guessed.
        </Para>
      </DocSection>

      <DocSection id="oauth-outcome-observer" title="Bounded OAuth outcome observation">
        <Para>
          When your application owns MCP authorization, record only the final
          HTTP outcome with <Inline>record_authorization_outcome</Inline>. It
          accepts <Inline>401</Inline> and <Inline>403</Inline> only and emits
          metadata-only <Inline>unauthorized</Inline> or <Inline>forbidden</Inline>
          evidence.
        </Para>
        <Code>{`client.record_authorization_outcome(
    "tools/call", response.status_code, session_id=session_id
)`}</Code>
        <Para>
          The helper never accepts bearer tokens, challenge headers, provider
          text, or authorization URLs. OAuth discovery, PKCE, consent, token
          exchange, refresh, and revocation remain caller-owned.
        </Para>
      </DocSection>

      <DocSection title="Options">
        <Para>
          Only <Inline>api_key</Inline> is required. See the full{" "}
          <a href="/docs/reference" className="font-medium text-brand-strong underline">
            configuration reference
          </a>{" "}
          for defaults.
        </Para>
        <Code>{`with_trackmcp(
    server,
    api_key=os.environ["TRACKMCP_KEY"],
    service="acme-mcp-server",
    environment="production",
    sample_rate=1.0,                 # 0–1, fraction of calls captured
    payload_mode="redacted",        # metadata | redacted | full (all are bounded)
    redact=["args.password", "args.token"],  # never leaves your process
    redact_keys=["customer_id"],
    max_payload_bytes=32768,         # final serialized payload budget
    transport="streamable_http",     # stdio | streamable_http | sse | custom
    server_version="2026.10.26",      # bounded release metadata (optional)
    sdk_version="0.1.15",             # bounded release metadata (optional)
    deployment_id="deploy-42",        # bounded release metadata (optional)
    endpoint="https://trackmcp.com/api/v1/ingest",  # compatible ingest endpoint override
)`}</Code>
        <Para>
          Release labels are metadata only. They do not identify a customer or
          assert deployment health.
        </Para>
      </DocSection>

      <DocSection title="Redacting sensitive fields">
        <Para>
          Redaction runs locally before anything is sent. The default{" "}
          <Inline>redacted</Inline> mode recursively removes common sensitive keys,
          scrubs binary/base64 resources, and bounds depth, breadth, strings, and bytes.
          Use <Inline>metadata</Inline> when arguments and results must not be captured;
          <Inline>full</Inline> is opt-in but remains bounded.
        </Para>
        <Code>{`redact=["args.email", "args.api_key", "result.raw_response"]
redact_keys=["customer_id"]
redact_event=lambda event: event  # return None to drop an event

# Truncations use a marker such as:
#{"__trackmcp_truncated": True, "reason": "max_payload_bytes", "original_type": "object"}`}</Code>
      </DocSection>

      <DocSection title="Failure and queue behavior">
        <Para>
          A hook exception drops only that event. Delivery failures are retried from a
          bounded queue of 500 events or 2 MiB; oldest queued events are dropped when
          those limits are reached. Telemetry is fail-open and never blocks tool execution.
        </Para>
      </DocSection>

      <DocSection id="transport-failures" title="Transport disconnects and exits">
        <Para>
          A process exit or stream disconnect can happen outside an MCP request. If your
          server owns that lifecycle callback, record the bounded failure without passing
          exception text or transport details into telemetry. This is optional and remains
          fail-open.
        </Para>
        <Code>{`# Call from your process/transport shutdown or error callback.
app.trackmcp.record_transport_failure("transport_closed")
# For an unexpected transport crash:
app.trackmcp.record_transport_failure("transport_error")`}</Code>
        <Para>
          The helper emits metadata-only session evidence with a fixed failure category;
          arbitrary labels, URLs, headers, credentials, and payloads are rejected or
          omitted. It complements the wrapper&apos;s initialize/shutdown observations and
          does not instrument Python MCP client transports.
        </Para>
      </DocSection>

      <DocSection id="protocol-results" title="Protocol result metadata">
        <Para>
          The server wrapper records bounded MCP result discriminators for protocol
          responses such as <Inline>input_required</Inline> and <Inline>task</Inline>.
          It keeps only the result type and capped request/response counts; task
          handles, prompts, submitted values, and result bodies never leave the
          process. This is metadata for dashboard filtering, not a copy of the
          protocol response.
        </Para>
        <Code>{`# No extra call is required. Middleware observes the response:
{
  "resultType": "input_required",
  "inputRequests": [...],
  "inputResponses": [...]
}

# TrackMCP emits only:
{
  "result_type": "input_required",
  "input_request_count": 1,
  "input_response_count": 1
}`}</Code>
        <Para>
          Completion responses use the same boundary and retain only bounded value
          counts, totals, and the <Inline>has_more</Inline> flag. Use the{" "}
          <a href="/docs/reference" className="font-medium text-brand-strong underline">
            configuration reference
          </a>{" "}
          for the full privacy and payload limits.
        </Para>
      </DocSection>

      <DocSection id="account-identity" title="Optional account identity">
        <Para>
          If your application has already verified a tenant or account claim, pass
          <Inline>account_id_resolver</Inline>. TrackMCP hashes the bounded result locally
          before storage and labels failures as unresolved; it never parses bearer tokens or
          infers identity from MCP client metadata.
        </Para>
        <Code>{`with_trackmcp(
    server,
    api_key=os.environ["TRACKMCP_KEY"],
    account_id_resolver=lambda context: context.get("tenant_id"),
)

# Return only a verified, stable tenant/account handle.
# Never return emails, tokens, URLs, prompts, completions, or raw user IDs.`}</Code>
      </DocSection>

      <DocSection title="Optional correlation">
        <Para>
          Correlation is off by default and never changes MCP schemas. External mode accepts a
          synchronous resolver for bounded request metadata and stores only a validated anonymized
          opaque handle. Issued mode is exposed for TypeScript/Python contract parity, but the
          current Python middleware reports missing because it cannot safely rewrite and strip tool
          schemas through a stable official SDK seam.
        </Para>
        <Code>{`correlation_mode="external",
correlation_resolver=lambda context: anonymized_job_handle(context),

# Never return emails, tokens, URLs, raw user IDs, prompts,
# completions, or private reasoning.`}</Code>
      </DocSection>

      <DocSection title="Explicit workflow outcomes">
        <Para>
          Workflow completion is an application-emitted signal. It is separate from a
          successful tool response and does not tell TrackMCP whether an answer was
          correct.
        </Para>
        <Code>{`app.trackmcp.workflow(
    "issue_resolution", "completed", {"issue_type": "bug"}
)`}</Code>
        <Para>
          Use the authenticated <a href="/dashboard" className="font-medium text-brand-strong underline">dashboard trace explorer</a> for ordered server-boundary events, or see the <a href="/docs/api" className="font-medium text-brand-strong underline">API reference</a> for the bounded trace response.
        </Para>
      </DocSection>

      <DocSection title="Intent and missing capabilities">
        <Para>
          Intent is explicit bounded context, never an inference. A safe context value
          is labeled <Inline>context_parameter</Inline>; an <Inline>intent_fallback</Inline>
          callback for schema-blind clients is labeled <Inline>fallback</Inline>.
          Applications may submit externally supplied context with
          <Inline>intent_source=&quot;external_callback&quot;</Inline>. Missing or unsafe values
          are labeled <Inline>missing</Inline>. The Python middleware does not rewrite
          tool schemas and leaves handler arguments unchanged.
        </Para>
        <Code>{`app.trackmcp.report_missing("bulk_export", "Export all matching records")
# The event is custom with mcp_method="trackmcp_report_missing".
# It retains correlation provenance and the normal privacy limits.`}</Code>
      </DocSection>

      <DocSection title="Custom events">
        <Para>Emit a named event from anywhere in your code.</Para>
        <Code>{`from trackmcp import track

track("checkout_completed", {"amount": 4900, "plan": "pro"})`}</Code>
      </DocSection>
    </DocsShell>
  );
}
