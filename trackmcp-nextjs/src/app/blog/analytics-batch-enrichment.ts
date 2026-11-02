import type { Enrichment } from "./enrichment";
import type { ArtKey } from "./art";
import type { Block } from "./posts";

type Entry = [string, ArtKey, ArtKey, string, string];

const entries: Entry[] = [
  ["mcp-analytics-build-vs-buy", "analytics-build-cover", "analytics-build-detail", "Build versus buy is a boundary and evidence decision, not only a tooling decision.", "Score options by evidence coverage, operating burden, portability, privacy, and time to diagnosis."],
  ["how-to-build-mcp-analytics-from-scratch", "analytics-scratch-cover", "analytics-scratch-detail", "A small analytics pipeline needs a stable event contract before it needs a large dashboard.", "Separate the server, collector, storage, query, and presentation responsibilities so failures stay diagnosable."],
  ["mcp-analytics-event-model-and-instrumentation", "analytics-event-cover", "analytics-event-detail", "An event model should preserve result state and evidence ownership without collecting every payload.", "A valid transport response can still contain an application error. Keep both facts visible."],
  ["mcp-analytics-metrics-slos-and-funnels", "analytics-metrics-cover", "analytics-metrics-detail", "MCP metrics follow a path from connection and discovery to calls and explicit outcomes.", "Use separate denominators for reachability, discovery, tool reliability, latency, adoption, and completion."],
  ["mcp-analytics-opentelemetry-warehouse-dashboard-architecture", "analytics-architecture-cover", "analytics-architecture-detail", "OpenTelemetry provides a foundation for context and export, while MCP semantics remain your contract.", "A collector can protect the request path while redacting, batching, routing, and exposing telemetry health."],
];

export const analyticsBatchEnrichment: Record<string, Enrichment> = Object.fromEntries(
  entries.map(([slug, art, inlineArt, takeaway, caption]) => [
    slug,
    {
      art,
      takeaways: [takeaway],
      inserts: [{ after: 3, block: { t: "figure", art: inlineArt, c: caption } as Block }],
    },
  ]),
) as Record<string, Enrichment>;
