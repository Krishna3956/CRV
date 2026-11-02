import type { ArtKey } from "./art";
import type { Enrichment } from "./enrichment";

const entries: [string, ArtKey, string[]][] = [
  ["best-mcp-testing-debugging-tools", "protocol", ["Compare tools by the failure they can reproduce, not by the number of integrations they advertise."]],
  ["best-mcp-security-scanners-tool-poisoning", "privacy", ["Security scanners find scoped risks; ownership, policy, and safe remediation still matter."]],
  ["best-mcp-gateways-production-security-observability", "layers", ["A gateway should enforce policy and preserve downstream MCP evidence."]],
  ["best-mcp-registries-marketplaces", "catalog", ["Treat every registry record as a versioned claim with provenance and a verification state."]],
  ["best-mcp-load-reliability-testing-tools", "latency", ["Load tests must model the MCP lifecycle and protect write-side effects."]],
  ["best-mcp-servers-monitoring-observability-data", "observability", ["An observability MCP server provides an access path to evidence; it does not create trustworthy evidence by itself."]],
  ["best-mcp-agent-evaluation-tool-selection-tools", "outcomes", ["Evaluate selection, arguments, recovery, and workflow outcomes separately from transport success."]],
  ["mcp-observability-benchmark-2026", "compare", ["Publish fixtures, definitions, and limitations before publishing rankings."]],
  ["mcp-failure-taxonomy-diagnostic-matrix", "errors", ["Name the failed boundary before choosing a remediation."]],
  ["mcp-telemetry-field-map-opentelemetry", "opentelemetry", ["Map concepts across systems while preserving provenance and field meaning."]],
  ["mcp-server-reliability-scorecard", "bars", ["Keep raw measures and disqualifying safety gates visible beside any aggregate score."],
  ],
  ["mcp-tool-adoption-report", "adoption", ["Adoption is measured behavior over a defined population and window, not catalog size."]],
  ["mcp-observability-glossary-buyers-guide", "buyer", ["Choose the product that owns the evidence behind your highest-risk questions."]],
];

export const wave2Enrichment: Record<string, Enrichment> = Object.fromEntries(
  entries.map(([slug, art, takeaways]) => [slug, { art, takeaways }]),
) as Record<string, Enrichment>;
