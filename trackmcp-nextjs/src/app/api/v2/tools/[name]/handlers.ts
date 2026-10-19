import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../../lib/api/v2-envelope.ts";

type ToolRow = {
  name?: unknown;
  calls?: unknown;
  errors?: unknown;
  error_rate?: unknown;
  avg_ms?: unknown;
  p50_ms?: unknown;
  p95_ms?: unknown;
  latency_sample_count?: unknown;
  discovered?: unknown;
  description?: unknown;
  schema_hash?: unknown;
};

function boundedTool(row: ToolRow) {
  return {
    name: typeof row.name === "string" ? row.name : "",
    calls: typeof row.calls === "number" ? row.calls : 0,
    errors: typeof row.errors === "number" ? row.errors : 0,
    error_rate: typeof row.error_rate === "number" ? row.error_rate : 0,
    avg_ms: typeof row.avg_ms === "number" ? row.avg_ms : null,
    p50_ms: typeof row.p50_ms === "number" ? row.p50_ms : null,
    p95_ms: typeof row.p95_ms === "number" ? row.p95_ms : null,
    latency_sample_count: typeof row.latency_sample_count === "number" ? row.latency_sample_count : 0,
    discovered: row.discovered === true,
    description: typeof row.description === "string" ? row.description.slice(0, 2000) : null,
    schema_hash: typeof row.schema_hash === "string" ? row.schema_hash : null,
  };
}

export function createToolDetailHandler() {
  const analytics = createAnalyticsHandler();
  return async function GET(request: Request, context: { params: Promise<{ name: string }> }) {
    const rawName = (await context.params).name;
    let name: string;
    try {
      name = decodeURIComponent(rawName);
    } catch {
      return NextResponse.json({ error: "Invalid tool name." }, { status: 400 });
    }
    if (!name || name.length > 200) return NextResponse.json({ error: "Invalid tool name." }, { status: 400 });
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; tools?: unknown; data_trust?: unknown };
    const row = Array.isArray(body.tools) ? body.tools.find((item) => item && typeof item === "object" && (item as ToolRow).name === name) as ToolRow | undefined : undefined;
    if (!row) return NextResponse.json({ error: "Tool not found." }, { status: 404 });
    return NextResponse.json(withTrackMCPV2Envelope({ range_days: typeof body.range_days === "number" ? body.range_days : null, tool: boundedTool(row), data_trust: body.data_trust ?? null }, request));
  };
}

export const GET = createToolDetailHandler();
