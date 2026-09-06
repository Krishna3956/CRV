import { HARD_MCP_TESTER_LIMITS } from "./limits.ts";
import { isSensitiveKey, REDACTED_VALUE, redactText } from "./redaction.ts";
import type { JsonValue, McpTesterReport } from "./types.ts";

export function serializeMcpTesterReport(report: McpTesterReport, maxBytes = 100_000): string {
  const effectiveMaxBytes = normalizeMaxBytes(maxBytes);
  const safe = sanitizeForOutput(report, 20, 10_000, 1_024);
  const serialized = escapeRenderedJson(JSON.stringify(safe));
  if (utf8Length(serialized) <= effectiveMaxBytes) return serialized;
  const compactSerialized = serializeSanitized(buildCompactReport(report), 12, 2_000, 512);
  if (utf8Length(compactSerialized) <= effectiveMaxBytes) return compactSerialized;
  const finalSerialized = serializeSanitized(buildFinalFallback(report), 8, 256, 512);
  if (utf8Length(finalSerialized) <= effectiveMaxBytes && utf8Length(finalSerialized) <= HARD_MCP_TESTER_LIMITS.maxRenderedJsonBytes) return finalSerialized;
  return serializeSanitized({
    schemaVersion: "mcp-tester-report.v1",
    verdict: "incomplete",
    verdictMessage: "The report exceeded the rendering limit and was reduced to bounded metadata.",
    limitations: ["Untrusted report fields were omitted after reaching the hard serialized-report ceiling."],
  }, 4, 64, 256);
}

function buildCompactReport(report: McpTesterReport): Record<string, unknown> {
  return {
    schemaVersion: report.schemaVersion,
    observedAt: report.observedAt,
    verdict: "incomplete",
    verdictMessage: "The report was compacted because the complete result exceeded the configured output limit.",
    endpoint: report.endpoint,
    transport: report.transport,
    protocol: report.protocol,
    server: report.server,
    capabilities: report.capabilities,
    healthDimensions: report.healthDimensions,
    phases: boundedArray(report.phases, 25),
    timings: boundedArray(report.timings, 25),
    timeline: boundedArray(report.timeline, 25),
    timelineTruncated: true,
    findings: boundedArray(report.findings, 25),
    tools: boundedCatalog(report.tools),
    resources: boundedCatalog(report.resources),
    prompts: boundedCatalog(report.prompts),
    limitations: [...boundedArray(report.limitations, 25), "The rendered report was compacted to stay within the output limit."],
  };
}

function buildFinalFallback(report: McpTesterReport): Record<string, unknown> {
  return {
    schemaVersion: report.schemaVersion,
    observedAt: report.observedAt,
    durationMs: report.durationMs,
    verdict: "incomplete",
    verdictMessage: "The report exceeded the rendering limit and was reduced to bounded metadata.",
    endpoint: report.endpoint,
    transport: report.transport,
    protocol: report.protocol,
    server: report.server,
    capabilities: report.capabilities,
    healthDimensions: report.healthDimensions,
    phases: boundedArray(report.phases, 16),
    timings: boundedArray(report.timings, 16),
    timeline: boundedArray(report.timeline, 16),
    timelineTruncated: true,
    findings: boundedArray(report.findings, 16),
    tools: boundedCatalog(report.tools),
    resources: boundedCatalog(report.resources),
    prompts: boundedCatalog(report.prompts),
    limitations: [...boundedArray(report.limitations, 16), "Untrusted report fields were recursively sanitized and bounded."],
  };
}

function boundedArray(value: unknown, maxItems: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, maxItems) : [];
}

function boundedCatalog(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { items: [], count: 0, pages: 0, complete: false, truncated: true };
  const catalog = value as Record<string, unknown>;
  return {
    items: boundedArray(catalog.items, 16),
    count: catalog.count,
    pages: catalog.pages,
    complete: false,
    truncated: true,
  };
}

function serializeSanitized(value: unknown, maxDepth: number, maxNodes: number, maxStringLength: number): string {
  return escapeRenderedJson(JSON.stringify(sanitizeForOutput(value, maxDepth, maxNodes, maxStringLength)));
}

function sanitizeForOutput(value: unknown, maxDepth: number, maxNodes: number, maxStringLength: number): JsonValue {
  let nodes = 0;
  const maxItemsPerContainer = Math.min(128, Math.max(1, maxNodes));

  const visit = (current: unknown, depth: number): JsonValue => {
    nodes += 1;
    if (nodes > maxNodes || depth > maxDepth) return "[truncated]";
    if (current === null || typeof current === "boolean" || typeof current === "number") return current;
    if (typeof current === "string") return redactText(current, maxStringLength);
    if (Array.isArray(current)) {
      const result: JsonValue[] = [];
      const itemCount = Math.min(current.length, maxItemsPerContainer);
      for (let index = 0; index < itemCount; index += 1) {
        if (nodes >= maxNodes) {
          result.push("[truncated]");
          break;
        }
        result.push(visit(current[index], depth + 1));
      }
      if (current.length > itemCount && result.at(-1) !== "[truncated]") result.push("[truncated]");
      return result;
    }
    if (typeof current === "object") {
      const result: { [key: string]: JsonValue } = {};
      let count = 0;
      for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
        if (count >= maxItemsPerContainer || nodes >= maxNodes) {
          result["[truncated]"] = "[truncated]";
          break;
        }
        count += 1;
        const safeKey = redactText(key, maxStringLength);
        result[safeKey] = isSensitiveKey(key) ? REDACTED_VALUE : visit(child, depth + 1);
      }
      return result;
    }
    return "[unsupported]";
  };

  return visit(value, 0);
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
