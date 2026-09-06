import type { McpTesterLimits } from "./types";

export const DEFAULT_MCP_TESTER_LIMITS: Readonly<McpTesterLimits> = Object.freeze({
  maxEndpointUrlLength: 2_048,
  maxHeaderNameLength: 128,
  maxHeaderValueLength: 4_096,
  maxHeaderCount: 16,
  maxHeaderBytes: 16_384,
  maxResponseBodyBytes: 1_000_000,
  maxTimelineEvents: 100,
  maxPaginationPages: 10,
  maxTotalDurationMs: 30_000,
  maxJsonDepth: 20,
  maxJsonNodes: 5_000,
  maxRenderedStringLength: 512,
  maxRenderedJsonBytes: 100_000,
  maxCatalogItems: 1_000,
  latencyWarningMs: 3_000,
});

export const HARD_MCP_TESTER_LIMITS: Readonly<McpTesterLimits> = Object.freeze({
  maxEndpointUrlLength: 8_192,
  maxHeaderNameLength: 256,
  maxHeaderValueLength: 16_384,
  maxHeaderCount: 32,
  maxHeaderBytes: 32_768,
  maxResponseBodyBytes: 2_000_000,
  maxTimelineEvents: 250,
  maxPaginationPages: 25,
  maxTotalDurationMs: 60_000,
  maxJsonDepth: 32,
  maxJsonNodes: 20_000,
  maxRenderedStringLength: 1_024,
  maxRenderedJsonBytes: 250_000,
  maxCatalogItems: 2_000,
  latencyWarningMs: 15_000,
});

const POSITIVE_LIMIT_KEYS: readonly (keyof McpTesterLimits)[] = [
  "maxEndpointUrlLength",
  "maxHeaderNameLength",
  "maxHeaderValueLength",
  "maxHeaderCount",
  "maxHeaderBytes",
  "maxResponseBodyBytes",
  "maxTimelineEvents",
  "maxPaginationPages",
  "maxTotalDurationMs",
  "maxJsonDepth",
  "maxJsonNodes",
  "maxRenderedStringLength",
  "maxRenderedJsonBytes",
  "maxCatalogItems",
  "latencyWarningMs",
];

export function normalizeMcpTesterLimits(overrides: Partial<McpTesterLimits> = {}): McpTesterLimits {
  const normalized = {} as McpTesterLimits;
  for (const key of POSITIVE_LIMIT_KEYS) {
    const requested = overrides[key];
    const fallback = DEFAULT_MCP_TESTER_LIMITS[key];
    const hardMaximum = HARD_MCP_TESTER_LIMITS[key];
    normalized[key] = typeof requested === "number" && Number.isFinite(requested) && requested > 0
      ? Math.min(Math.floor(requested), hardMaximum)
      : fallback;
  }
  return normalized;
}
