import type { ArtKey } from "./art";
import type { Enrichment } from "./enrichment";

const entries: [string, ArtKey, string[]][] = [
  ["best-mcp-testing-debugging-tools", "testing-grid", ["Compare tools by the failure they can reproduce, not by the number of integrations they advertise."]],
  ["best-mcp-security-scanners-tool-poisoning", "security-grid", ["Security scanners find scoped risks; ownership, policy, and safe remediation still matter."]],
  ["best-mcp-gateways-production-security-observability", "gateway-grid", ["A gateway should enforce policy and preserve downstream MCP evidence."]],
  ["best-mcp-registries-marketplaces", "registry-grid", ["Treat every registry record as a versioned claim with provenance and a verification state."]],
  ["best-mcp-load-reliability-testing-tools", "load-grid", ["Load tests must model the MCP lifecycle and protect write-side effects."]],
  ["best-mcp-servers-monitoring-observability-data", "monitoring-grid", ["An observability MCP server provides an access path to evidence; it does not create trustworthy evidence by itself."]],
  ["best-mcp-agent-evaluation-tool-selection-tools", "evaluation-grid", ["Evaluate selection, arguments, recovery, and workflow outcomes separately from transport success."]],
  ["mcp-observability-benchmark-2026", "benchmark-grid", ["Publish fixtures, definitions, and limitations before publishing rankings."]],
  ["mcp-failure-taxonomy-diagnostic-matrix", "taxonomy-grid", ["Name the failed boundary before choosing a remediation."]],
  ["mcp-telemetry-field-map-opentelemetry", "telemetry-grid", ["Map concepts across systems while preserving provenance and field meaning."]],
  ["mcp-server-reliability-scorecard", "scorecard-grid", ["Keep raw measures and disqualifying safety gates visible beside any aggregate score."]],
  ["mcp-tool-adoption-report", "adoption-grid", ["Adoption is measured behavior over a defined population and window, not catalog size."]],
  ["mcp-observability-glossary-buyers-guide", "buyer-grid", ["Choose the product that owns the evidence behind your highest-risk questions."]],
];

export const wave2Enrichment: Record<string, Enrichment> = Object.fromEntries(
  entries.map(([slug, art, takeaways]) => [slug, { art, takeaways }]),
) as Record<string, Enrichment>;
