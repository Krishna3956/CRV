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
  { name: "sampleRate", type: "number", def: "1.0", desc: "Fraction of calls captured (0–1)." },
  { name: "redact", type: "string[]", def: "[]", desc: "Argument/result paths to strip locally." },
  { name: "endpoint", type: "string", def: "trackmcp.com/api/v1/ingest", desc: "Override for self-hosted ingest." },
  { name: "disabled", type: "boolean", def: "false", desc: "Turn capture off without removing the wrapper." },
];

const captured = [
  "Tool name and the arguments (after redaction)",
  "Result payload and whether it carried isError: true",
  "Client type (Claude, Cursor, ChatGPT, custom)",
  "Duration in milliseconds and transport status",
  "Session id, so calls can be inspected in order",
  "Timestamp and environment",
];

const metrics = [
  "Active clients, new and returning connections",
  "Completed workflows and completion rate",
  "Tool call volume, adoption, and week-over-week change",
  "p50 / p95 latency and error rate per tool",
  "Silent failures (errors inside a 200 OK)",
  "Most common workflows and where sessions stop",
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
          pass through your <Inline>redact</Inline> rules first, in your process.
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

      <DocSection title="Environment variables">
        <Para>
          Python reads <Inline>TRACKMCP_KEY</Inline> automatically when an API key is
          not passed. TypeScript requires <Inline>apiKey</Inline> in the options. For
          a self-hosted deployment, pass the ingest URL explicitly as <Inline>endpoint</Inline>;
          <Inline>TRACKMCP_ENDPOINT</Inline> is not read automatically.
        </Para>
      </DocSection>
    </DocsShell>
  );
}
