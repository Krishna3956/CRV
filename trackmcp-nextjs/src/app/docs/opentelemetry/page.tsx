import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para, Code, Inline } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "OpenTelemetry Integration | TrackMCP Docs",
  description: "Configure TrackMCP's bounded OTLP/HTTP JSON or protobuf interoperability path or use the native SDK for complete MCP semantics.",
  path: "/docs/opentelemetry",
});

export default function OpenTelemetryDocsPage() {
  return (
    <DocsShell active="/docs/opentelemetry">
      <DocTitle eyebrow="Integration guide">OpenTelemetry</DocTitle>
      <DocLead>Send supported OTLP/HTTP JSON or protobuf spans to TrackMCP when you already operate an OpenTelemetry pipeline. For complete MCP semantics, use the native TypeScript or Python SDK at the server boundary.</DocLead>
      <div className="mt-5 flex flex-wrap gap-3" aria-label="OpenTelemetry next steps">
        <a
          href="https://app.trackmcp.com/dashboard?view=setup"
          className="inline-flex cursor-pointer items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Open Dashboard Setup
        </a>
        <a
          href="/docs/typescript"
          className="inline-flex cursor-pointer items-center rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-strong transition hover:border-line-strong hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Use the native SDK guide
        </a>
      </div>

      <DocSection title="Supported boundary">
        <Para>TrackMCP accepts authenticated <Inline>POST</Inline> requests at <Inline>https://trackmcp.com/api/v1/otel/v1/traces</Inline>. The receiver supports OTLP/HTTP JSON and OTLP/HTTP protobuf. OTLP/gRPC is not enabled on this endpoint.</Para>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"><strong>Pilot deployment note:</strong> the current Cloudflare-fronted public hostname is blocking server-to-server OTEL writes with HTTP 403 before they reach the receiver. Treat this integration as pending until the edge write rule is corrected; a 403 HTML response is not an accepted span.</div>
        <div className="rounded-xl border border-brand/20 bg-brand-soft/35 p-4 text-sm leading-relaxed text-body">The OTEL adapter maps spans into bounded MCP activity metadata. It does not retain raw attributes, exception bodies, trace IDs, span links, or payload contents.</div>
      </DocSection>

      <DocSection title="Configure an exporter">
        <Para>Use a workspace connection key as the bearer credential. Keep the key in your collector or server secret store; never commit it to a repository or send it as a span attribute.</Para>
        <Code>{`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://trackmcp.com/api/v1/otel/v1/traces
OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer $TRACKMCP_KEY
OTEL_EXPORTER_OTLP_TRACES_PROTOCOL=http/json
# Use http/protobuf when your collector emits protobuf instead.
# OTEL_EXPORTER_OTLP_TRACES_PROTOCOL=http/protobuf`}</Code>
        <Para>Send a bounded envelope with <Inline>resourceSpans</Inline>. JSON and protobuf are both decoded into the same metadata-only mapper. TrackMCP reports accepted and rejected span counts in the response. Unsupported spans are reported as rejected or unmapped; they are never presented as successful MCP outcomes.</Para>
      </DocSection>

      <DocSection title="Native SDK versus OTEL">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-semibold text-ink">Native SDK (recommended)</h3><p className="mt-2 text-xs leading-relaxed text-muted">Captures MCP lifecycle, catalog observations, tool outcomes, redaction, bounded retries, and privacy-safe identity context at the server boundary.</p></div>
          <div className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-semibold text-ink">OTLP/HTTP JSON or protobuf</h3><p className="mt-2 text-xs leading-relaxed text-muted">Useful when an existing collector already emits compatible spans. Both formats retain only bounded MCP metadata; coverage is intentionally narrower and unsupported semantics remain visible as insufficient evidence.</p></div>
        </div>
      </DocSection>

      <DocSection title="Verify the integration">
        <ol className="list-decimal space-y-2 pl-5 text-[14px] text-body">
          <li>Create or select a workspace connection key in Dashboard → Setup.</li>
          <li>Configure the endpoint and bearer header in the exporter or collector.</li>
          <li>Emit one test span with a stable MCP operation and start time.</li>
          <li>Return to Setup and choose Check for data, then inspect Evidence.</li>
        </ol>
        <Para>If the span is structurally valid but outside the MCP mapping, the response explains that it was not accepted as a supported semantic event. This is expected and safer than silently inflating dashboard counts.</Para>
      </DocSection>

      <DocSection title="Limits and privacy">
        <Para>Requests and batches are bounded. The adapter is fail-open for the customer server, and TrackMCP never asks the OTEL receiver to proxy tools or read source code. For identity-linked account views, configure the optional resolver in your server-side SDK integration; OTEL alone cannot identify named customers.</Para>
      </DocSection>
    </DocsShell>
  );
}
