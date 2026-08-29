import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Terminal, Braces, Plug, SlidersHorizontal, LayoutDashboard } from "lucide-react";
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
  { icon: Braces, t: "Python SDK", d: "The same one-line wrap for Python servers.", href: "/docs/python" },
  { icon: Plug, t: "REST API", d: "Query your own metrics programmatically.", href: "/docs/api" },
  { icon: SlidersHorizontal, t: "Configuration", d: "Every option, event, and metric.", href: "/docs/reference" },
  { icon: LayoutDashboard, t: "Workspace setup", d: "Create a key and connect your server.", href: "/dashboard" },
];

export default function DocsPage() {
  return (
    <DocsShell active="/docs">
      <DocTitle eyebrow="Docs">Get started with TrackMCP</DocTitle>
      <DocLead>
        Wrap your existing MCP server once. TrackMCP captures every call, session,
        and client automatically — no changes to your tools.
      </DocLead>

      <DocSection id="quickstart" title="Quickstart">
        <Para>
          Install the SDK, create a workspace key, wrap your server, and deploy. Data
          appears in your dashboard after the first telemetry flush.
        </Para>
        <Code>{`# TypeScript
npm i @trackmcp/sdk
# Create a key at https://trackmcp.com/dashboard

# Python
pip install trackmcp
# Create your key at https://trackmcp.com/dashboard`}</Code>
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
