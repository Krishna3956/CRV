import { redactJson } from "./redaction.ts";
import { HARD_MCP_TESTER_LIMITS } from "./limits.ts";
import type { McpTesterReport } from "./types.ts";

export function serializeMcpTesterReport(report: McpTesterReport, maxBytes = 100_000): string {
  const effectiveMaxBytes = normalizeMaxBytes(maxBytes);
  const safe = redactJson(report, 20, 10_000, 1_024);
  const serialized = escapeRenderedJson(JSON.stringify(safe));
  if (utf8Length(serialized) <= effectiveMaxBytes) return serialized;
  const compact = {
    schemaVersion: report.schemaVersion,
    observedAt: report.observedAt,
    verdict: report.verdict,
    verdictMessage: report.verdictMessage,
    endpoint: report.endpoint,
    healthDimensions: report.healthDimensions,
    findings: report.findings.slice(0, 25),
    limitations: [...report.limitations, "The rendered report was compacted to stay within the output limit."],
  };
  const compactSerialized = escapeRenderedJson(JSON.stringify(redactJson(compact, 12, 2_000, 512)));
  if (utf8Length(compactSerialized) <= effectiveMaxBytes) return compactSerialized;
  return escapeRenderedJson(JSON.stringify({
    schemaVersion: report.schemaVersion,
    verdict: report.verdict,
    verdictMessage: report.verdictMessage,
    limitations: ["The report exceeded the rendering limit and was reduced to verdict metadata."],
  }));
}

function escapeRenderedJson(value: string): string {
  return value.replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

function normalizeMaxBytes(value: number): number {
  if (!Number.isFinite(value)) return HARD_MCP_TESTER_LIMITS.maxRenderedJsonBytes;
  return Math.min(HARD_MCP_TESTER_LIMITS.maxRenderedJsonBytes, Math.max(1, Math.floor(value)));
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
