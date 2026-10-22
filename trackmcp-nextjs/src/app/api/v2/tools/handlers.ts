import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

const MAX_PAGE_SIZE = 100;
const HASH = /^[a-f0-9]{64}$/i;
const boundedText = (value: unknown, max = 256) => typeof value === "string" ? value.slice(0, max) : null;
const boundedInt = (value: unknown, max = 1000000) => typeof value === "number" && Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
const boundedRate = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;

function projectTool(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return {
    name: boundedText(row.name), calls: boundedInt(row.calls), errors: boundedInt(row.errors), error_rate: boundedRate(row.error_rate),
    avg_ms: typeof row.avg_ms === "number" && Number.isFinite(row.avg_ms) ? Math.max(0, Math.min(86_400_000, row.avg_ms)) : null,
    p50_ms: typeof row.p50_ms === "number" && Number.isFinite(row.p50_ms) ? Math.max(0, Math.min(86_400_000, row.p50_ms)) : null,
    p95_ms: typeof row.p95_ms === "number" && Number.isFinite(row.p95_ms) ? Math.max(0, Math.min(86_400_000, row.p95_ms)) : null,
    latency_sample_count: boundedInt(row.latency_sample_count), discovered: row.discovered === true,
    description: boundedText(row.description), schema_hash: typeof row.schema_hash === "string" && HASH.test(row.schema_hash) ? row.schema_hash.toLowerCase() : null,
  };
}

function projectCatalogTool(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return { name: boundedText(row.name), description: boundedText(row.description), tool_description_hash: typeof row.tool_description_hash === "string" && HASH.test(row.tool_description_hash) ? row.tool_description_hash.toLowerCase() : null, schema_hash: typeof row.schema_hash === "string" && HASH.test(row.schema_hash) ? row.schema_hash.toLowerCase() : null };
}

function projectInsight(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return { level: boundedText(row.level, 32), title: boundedText(row.title), detail: boundedText(row.detail, 512), metric: boundedText(row.metric, 64), affected_volume: typeof row.affected_volume === "number" ? boundedInt(row.affected_volume) : null, confidence: boundedText(row.confidence, 16), suggested_action: boundedText(row.suggested_action, 512) };
}

function decodeCursor(value: string | null): number {
  if (!value) return 0;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const match = /^v1:(\d+)$/.exec(decoded);
    if (!match) return 0;
    const offset = Number(match[1]);
    return Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
  } catch {
    return 0;
  }
}

function encodeCursor(offset: number): string {
  return Buffer.from(`v1:${offset}`, "utf8").toString("base64url");
}

/** Bounded tool read model; raw event payloads remain outside the response. */
export function createToolsHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as {
      range_days?: number;
      tools?: unknown;
      catalog_tools?: unknown;
      unused_tools?: unknown;
      insights?: unknown;
      data_trust?: unknown;
    };
    const requestedTool = new URL(request.url).searchParams.get("tool_name");
    const query = new URL(request.url).searchParams;
    const toolName = requestedTool && requestedTool.trim().length <= 256 ? requestedTool.trim() : null;
    const tools = Array.isArray(body.tools) ? body.tools.map(projectTool).filter((tool): tool is Record<string, unknown> => tool !== null) : [];
    const catalogTools = Array.isArray(body.catalog_tools) ? body.catalog_tools.map(projectCatalogTool).filter((tool): tool is Record<string, unknown> => tool !== null) : [];
    const unusedTools = Array.isArray(body.unused_tools) ? body.unused_tools.filter((tool): tool is string => typeof tool === "string").map((tool) => tool.slice(0, 256)).slice(0, 1000) : [];
    const matches = (value: unknown) => value && typeof value === "object" && (value as { name?: unknown }).name === toolName;
    const filteredTools = toolName ? tools.filter(matches) : tools;
    const filteredCatalogTools = toolName ? catalogTools.filter(matches) : catalogTools;
    const filteredUnusedTools = toolName ? unusedTools.filter((value) => value === toolName) : unusedTools;
    const hasPaging = query.has("limit") || query.has("cursor");
    const requestedLimit = Number(query.get("limit") || 50);
    const limit = Number.isFinite(requestedLimit) ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(requestedLimit))) : 50;
    const offset = hasPaging ? decodeCursor(query.get("cursor")) : 0;
    const page = <T,>(values: T[]) => hasPaging ? values.slice(offset, offset + limit) : values;
    const pageHasMore = hasPaging && (filteredTools.length > offset + limit || filteredCatalogTools.length > offset + limit || filteredUnusedTools.length > offset + limit);
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: body.range_days ?? null,
      tools: page(filteredTools),
      catalog_tools: page(filteredCatalogTools),
      unused_tools: page(filteredUnusedTools),
      insights: Array.isArray(body.insights) ? body.insights.map(projectInsight).filter((insight): insight is Record<string, unknown> => insight !== null).slice(0, 100) : [],
      filter: { tool_name: toolName },
      ...(hasPaging ? { page: { limit, next_cursor: pageHasMore ? encodeCursor(offset + limit) : null } } : {}),
      data_trust: body.data_trust ?? null,
    }, request));
  };
}

export const GET = createToolsHandler();
