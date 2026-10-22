import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

const TASK_HASH = /^[a-f0-9]{64}$/i;
const TASK_STATES = new Set(["working", "input_required", "completed", "failed", "cancelled", "expired", "unknown"]);
const EVIDENCE_QUALITY = new Set(["observed", "insufficient_data", "conflicting"]);

function projectTask(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const taskIdHash = typeof row.task_id_hash === "string" && TASK_HASH.test(row.task_id_hash) ? row.task_id_hash.toLowerCase() : null;
  const state = typeof row.state === "string" && TASK_STATES.has(row.state) ? row.state : "unknown";
  const firstObservedAt = typeof row.first_observed_at === "string" ? row.first_observed_at.slice(0, 80) : null;
  const lastObservedAt = typeof row.last_observed_at === "string" ? row.last_observed_at.slice(0, 80) : null;
  const observations = typeof row.observations === "number" && Number.isSafeInteger(row.observations) ? Math.max(0, Math.min(10000, row.observations)) : 0;
  const evidenceQuality = typeof row.evidence_quality === "string" && EVIDENCE_QUALITY.has(row.evidence_quality) ? row.evidence_quality : "insufficient_data";
  return { task_id_hash: taskIdHash, state, first_observed_at: firstObservedAt, last_observed_at: lastObservedAt, observations, terminal: row.terminal === true, evidence_quality: evidenceQuality };
}

export function createTasksHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; founder_os?: { tasks?: unknown }; data_trust?: unknown };
    const tasks = Array.isArray(body.founder_os?.tasks) ? body.founder_os.tasks.slice(0, 100).map(projectTask).filter((task): task is Record<string, unknown> => task !== null) : [];
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      tasks,
      task_count: tasks.length,
      data_trust: body.data_trust ?? null,
      caveats: [
        "Tasks are shown only when a bounded task ID was observed in telemetry.",
        "State is the latest explicit task status in the selected window; missing events are not treated as abandonment.",
        "Task completion is protocol evidence and does not prove the customer's business outcome.",
      ],
    }, request));
  };
}

export const GET = createTasksHandler();
