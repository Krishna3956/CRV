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
  title: "Python SDK | TrackMCP Docs",
  description:
    "Install the trackmcp package and wrap your Python MCP server in one line to capture every tool call, session, and client.",
  path: "/docs/python",
});

export default function PythonDocsPage() {
  return (
    <DocsShell active="/docs/python">
      <DocTitle eyebrow="SDKs">Python SDK</DocTitle>
      <DocLead>
        The <Inline>trackmcp</Inline> package wraps your MCP server so every call,
        result, and client is captured automatically. Works with Python 3.9+ and the
        official MCP SDK.
      </DocLead>

      <DocSection title="Install">
        <Code>{`python3 -m pip install trackmcp
# or: uv add trackmcp / poetry add trackmcp`}</Code>
      </DocSection>

      <DocSection title="Wrap your server">
        <Para>
          Wrap your existing server with <Inline>with_trackmcp</Inline> and pass your
          API key. Your tools stay exactly as they are.
        </Para>
        <Code>{`import os
from trackmcp import with_trackmcp
from mcp.server import server

app = with_trackmcp(
    server,
    api_key=os.environ["TRACKMCP_KEY"],
    service="acme-mcp-server",
    environment="production",
)`}</Code>
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
    endpoint="https://trackmcp.com/api/v1/ingest",  # compatible ingest endpoint override
)`}</Code>
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
          Use the authenticated <a href="https://app.trackmcp.com/dashboard" className="font-medium text-brand-strong underline">dashboard trace explorer</a> for ordered server-boundary events, or see the <a href="/docs/api" className="font-medium text-brand-strong underline">API reference</a> for the bounded trace response.
        </Para>
      </DocSection>

      <DocSection title="Custom events">
        <Para>Emit a named event from anywhere in your code.</Para>
        <Code>{`from trackmcp import track

track("checkout_completed", {"amount": 4900, "plan": "pro"})`}</Code>
      </DocSection>
    </DocsShell>
  );
}
