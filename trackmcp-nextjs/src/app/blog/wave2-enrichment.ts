import type { ArtKey } from "./art";
import type { Enrichment } from "./enrichment";
import type { Block } from "./posts";

type WaveVisual = { slug: string; cover: ArtKey; detail: ArtKey; takeaway: string; caption: string };

const visuals: WaveVisual[] = [
  ["best-mcp-testing-debugging-tools", "testing-cover", "testing-detail", "Compare tools by the failure they can reproduce, not by the number of integrations they advertise.", "A useful MCP test artifact connects a fixture to the exact protocol, result, and workflow assertion that failed."],
  ["best-mcp-security-scanners-tool-poisoning", "security-cover", "security-detail", "Security scanners find scoped risks; ownership, policy, and safe remediation still matter.", "Treat a security signal as a path from finding to owner to regression test, with side-effect risk visible."],
  ["best-mcp-gateways-production-security-observability", "gateway-cover", "gateway-detail", "A gateway should enforce policy and preserve downstream MCP evidence.", "The gateway is a control boundary between the client and server, not a reason to discard downstream timing or result state."],
  ["best-mcp-registries-marketplaces", "registry-cover", "registry-detail", "Treat every registry record as a versioned claim with provenance and a verification state.", "A registry record becomes useful when publisher identity, version, provenance, and verification time stay attached to it."],
  ["best-mcp-load-reliability-testing-tools", "load-cover", "load-detail", "Load tests must model the MCP lifecycle and protect write-side effects.", "MCP reliability is a lifecycle signal: measure the tail, retries, cancellations, and result state instead of only request volume."],
  ["best-mcp-servers-monitoring-observability-data", "monitoring-cover", "monitoring-detail", "An observability MCP server provides an access path to evidence; it does not create trustworthy evidence by itself.", "A monitoring view should connect client, tool, latency, result state, and outcome evidence at the server boundary."],
  ["best-mcp-agent-evaluation-tool-selection-tools", "evaluation-cover", "evaluation-detail", "Evaluate selection, arguments, recovery, and workflow outcomes separately from transport success.", "Agent evaluation is a path from intent to selection to execution to completion, not a single pass or fail label."],
  ["mcp-observability-benchmark-2026", "benchmark-cover", "benchmark-detail", "Publish fixtures, definitions, and limitations before publishing rankings.", "A benchmark is credible when another team can replay its fixtures, window, and variance assumptions."],
  ["mcp-failure-taxonomy-diagnostic-matrix", "taxonomy-cover", "taxonomy-detail", "Name the failed boundary before choosing a remediation.", "Start diagnosis at the first broken boundary, then follow evidence toward the application, infrastructure, or recovery path."],
  ["mcp-telemetry-field-map-opentelemetry", "telemetry-cover", "telemetry-detail", "Map concepts across systems while preserving provenance and field meaning.", "A canonical MCP event can map to spans, events, and metrics only when each destination preserves the field's meaning."],
  ["mcp-server-reliability-scorecard", "scorecard-cover", "scorecard-detail", "Keep raw measures and disqualifying safety gates visible beside any aggregate score.", "A scorecard is a review instrument: the aggregate helps prioritize, while raw measures explain the decision."],
  ["mcp-tool-adoption-report", "adoption-cover", "adoption-detail", "Adoption is measured behavior over a defined population and window, not catalog size.", "The useful adoption path runs from exposure to discovery to calls to a recorded outcome; each drop-off needs different evidence."],
  ["mcp-observability-glossary-buyers-guide", "buyer-cover", "buyer-detail", "Choose the product that owns the evidence behind your highest-risk questions.", "A buyer comparison is clearer when every claim names the evidence owner and the boundary it can actually see."],
].map(([slug, cover, detail, takeaway, caption]) => ({ slug, cover: cover as ArtKey, detail: detail as ArtKey, takeaway, caption }));

export const wave2Enrichment: Record<string, Enrichment> = Object.fromEntries(
  visuals.map(({ slug, cover, detail, takeaway, caption }) => [
    slug,
    { art: cover, takeaways: [takeaway], inserts: [{ after: 3, block: { t: "figure", art: detail, c: caption } as Block }] },
  ]),
) as Record<string, Enrichment>;

export const wave2VisualSlugs = visuals.map(({ slug }) => slug);
