import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

const MAX_PAGE_SIZE = 100;

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
    const tools = Array.isArray(body.tools) ? body.tools : [];
    const catalogTools = Array.isArray(body.catalog_tools) ? body.catalog_tools : [];
    const unusedTools = Array.isArray(body.unused_tools) ? body.unused_tools : [];
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
      insights: Array.isArray(body.insights) ? body.insights : [],
      filter: { tool_name: toolName },
      ...(hasPaging ? { page: { limit, next_cursor: pageHasMore ? encodeCursor(offset + limit) : null } } : {}),
      data_trust: body.data_trust ?? null,
    }, request));
  };
}

export const GET = createToolsHandler();
