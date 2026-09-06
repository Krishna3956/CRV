import { redactJson } from "./redaction.ts";
import type { McpTesterReport } from "./types.ts";

export function serializeMcpTesterReport(report: McpTesterReport, maxBytes = 100_000): string {
  const safe = redactJson(report, 20, 10_000, 1_024);
  const serialized = JSON.stringify(safe);
  if (utf8Length(serialized) <= maxBytes) return serialized;
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
  const compactSerialized = JSON.stringify(redactJson(compact, 12, 2_000, 512));
  if (utf8Length(compactSerialized) <= maxBytes) return compactSerialized;
  return JSON.stringify({
    schemaVersion: report.schemaVersion,
    verdict: report.verdict,
    verdictMessage: report.verdictMessage,
    limitations: ["The report exceeded the rendering limit and was reduced to verdict metadata."],
  });
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
