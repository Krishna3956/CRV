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
    sample_rate=1.0,                 # 0-1, fraction of calls captured
    redact=["args.password", "args.token"],  # never leaves your process
    endpoint="https://trackmcp.com/api/v1/ingest",  # self-hosted override
)`}</Code>
      </DocSection>

      <DocSection title="Redacting sensitive fields">
        <Para>
          Redaction runs locally before anything is sent. Point{" "}
          <Inline>redact</Inline> at any argument or result path.
        </Para>
        <Code>{`redact=["args.email", "args.api_key", "result.raw_response"]`}</Code>
      </DocSection>

      <DocSection title="Custom events">
        <Para>Emit a named event from anywhere in your code.</Para>
        <Code>{`from trackmcp import track

track("checkout_completed", {"amount": 4900, "plan": "pro"})`}</Code>
      </DocSection>
    </DocsShell>
  );
}
