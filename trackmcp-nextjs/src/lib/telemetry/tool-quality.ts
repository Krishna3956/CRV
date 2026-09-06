import type {
  ToolQualityCatalogComparison,
  ToolQualityCatalogSnapshot,
  ToolQualityInsufficientReason,
  ToolQualityInsight,
  ToolQualityMetricValues,
  ToolQualityPath,
  ToolQualityResponse,
  ToolQualitySegment,
  ToolQualityTool,
} from "./analytics-types.ts";
import { isWorkflowLifecycleEvent } from "./analytics.ts";

export const TOOL_QUALITY_MIN_TOOL_CALLS = 30;
export const TOOL_QUALITY_MIN_SEGMENT_CALLS = 30;
export const TOOL_QUALITY_MIN_SEGMENT_SESSIONS = 10;
export const TOOL_QUALITY_MIN_WORKFLOW_TERMINALS = 20;
export const TOOL_QUALITY_MIN_CATALOG_CALLS = 30;
export const TOOL_QUALITY_LOW_COMPLETION_THRESHOLD = 0.8;
export const TOOL_QUALITY_REPEAT_WINDOW_MS = 5 * 60 * 1000;
export const TOOL_QUALITY_MAX_TRACE_SESSION_IDS = 3;
export const TOOL_QUALITY_MAX_CATALOG_SNAPSHOTS_PER_TOOL = 50;

export type ToolQualityEvent = {
  event_type?: string | null;
  service?: string | null;
  environment?: string | null;
  server_id?: string | null;
  deployment_id?: string | null;
  session_id?: string | null;
  correlation_handle?: string | null;
  workflow_id?: string | null;
  client_name?: string | null;
  intent_source?: string | null;
  tool_name?: string | null;
  tool_description_hash?: string | null;
  schema_hash?: string | null;
  started_at?: string | null;
  success?: boolean | null;
  is_error?: boolean | null;
  retry_number?: number | null;
  payload_policy?: string | null;
  payload?: Record<string, unknown> | null;
};

type CatalogTool = {
  name: string;
  description_hash: string | null;
  schema_hash: string | null;
};

type CatalogObservation = {
  id: string;
  at: number;
  observed_at: string;
  scope: ToolQualityEvent;
  tools: CatalogTool[];
  effective_to: string | null;
};

type WorkflowRecord = {
  id: string;
  started: boolean;
  terminal: "completed" | "failed" | null;
  path: string[];
  calls: ToolQualityEvent[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function failed(event: ToolQualityEvent): boolean {
  return event.is_error === true || event.success === false;
}

function knownOutcome(event: ToolQualityEvent): boolean {
  return typeof event.success === "boolean" || typeof event.is_error === "boolean";
}

function successful(event: ToolQualityEvent): boolean {
  return knownOutcome(event) && !failed(event);
}

function hasTruncation(value: unknown, seen = new Set<object>()): boolean {
  if (Array.isArray(value)) {
    if (seen.has(value)) return false;
    seen.add(value);
    return value.some((item) => hasTruncation(item, seen));
  }
  if (!isRecord(value)) return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (value.truncated === true || value.__trackmcp_truncated === true || value._truncated === true) return true;
  return Object.values(value).some((item) => hasTruncation(item, seen));
}

function structurallyEmpty(value: unknown): boolean {
  if (value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (!isRecord(value)) return false;
  if (Array.isArray(value.content)) return value.content.length === 0;
  if (Object.prototype.hasOwnProperty.call(value, "structuredContent") && structurallyEmpty(value.structuredContent)) return true;
  return Object.keys(value).length === 0;
}

function inspectableSuccessfulResult(event: ToolQualityEvent): boolean {
  return successful(event)
    && event.payload_policy !== "metadata"
    && isRecord(event.payload)
    && Object.prototype.hasOwnProperty.call(event.payload, "result")
    && !hasTruncation(event.payload);
}

function emptyResult(event: ToolQualityEvent): boolean {
  return inspectableSuccessfulResult(event) && structurallyEmpty(event.payload?.result);
}

function timestamp(event: ToolQualityEvent): number | null {
  if (!event.started_at) return null;
  const value = Date.parse(event.started_at);
  return Number.isFinite(value) ? value : null;
}

function workflowStatus(event: ToolQualityEvent): string | null {
  return isRecord(event.payload) && typeof event.payload.status === "string" ? event.payload.status : null;
}

function scopeMatches(snapshot: CatalogObservation, event: ToolQualityEvent): boolean {
  const dimensions: Array<keyof ToolQualityEvent> = ["service", "environment", "server_id", "deployment_id", "client_name"];
  if (snapshot.scope.session_id && snapshot.scope.session_id !== event.session_id) return false;
  if (snapshot.scope.session_id && !event.session_id) return false;
  for (const dimension of dimensions) {
    const snapshotValue = snapshot.scope[dimension];
    const eventValue = event[dimension];
    if (snapshotValue && eventValue && snapshotValue !== eventValue) return false;
  }
  return true;
}

function catalogTools(event: ToolQualityEvent): CatalogTool[] {
  if (event.event_type !== "catalog" && event.event_type !== "custom") return [];
  const payload = event.payload;
  if (!isRecord(payload) || payload.name !== "tools_discovered") return [];
  const result = isRecord(payload.result) ? payload.result : null;
  const rawTools = Array.isArray(payload.tools) ? payload.tools : result && Array.isArray(result.tools) ? result.tools : [];
  return rawTools.flatMap((value): CatalogTool[] => {
    if (!isRecord(value) || typeof value.name !== "string" || !value.name) return [];
    return [{
      name: value.name,
      description_hash: typeof value.tool_description_hash === "string" ? value.tool_description_hash : null,
      schema_hash: typeof value.schema_hash === "string" ? value.schema_hash : null,
    }];
  });
}

function catalogScopeKey(event: ToolQualityEvent): string {
  return [event.session_id || "", event.service || "", event.environment || "", event.server_id || "", event.deployment_id || "", event.client_name || ""].join("\u001f");
}

function buildCatalogObservations(events: readonly ToolQualityEvent[]): CatalogObservation[] {
  const observations = events.flatMap((event, index): CatalogObservation[] => {
    const at = timestamp(event);
    const tools = catalogTools(event);
    if (at === null || !tools.length) return [];
    return [{ id: `${catalogScopeKey(event)}:${at}:${index}`, at, observed_at: event.started_at || new Date(at).toISOString(), scope: event, tools, effective_to: null }];
  });
  const byScope = new Map<string, CatalogObservation[]>();
  for (const observation of observations) {
    const key = catalogScopeKey(observation.scope);
    byScope.set(key, [...(byScope.get(key) || []), observation]);
  }
  for (const group of byScope.values()) {
    group.sort((a, b) => a.at - b.at);
    group.forEach((observation, index) => {
      observation.effective_to = group[index + 1]?.observed_at || null;
    });
  }
  return observations;
}

function effectiveCatalog(observations: readonly CatalogObservation[], event: ToolQualityEvent): CatalogObservation | null {
  const at = timestamp(event);
  if (at === null) return null;
  return observations
    .filter((observation) => observation.at <= at && scopeMatches(observation, event))
    .sort((a, b) => b.at - a.at)[0] || null;
}

function metricsForCalls(calls: readonly ToolQualityEvent[], allowMetrics: boolean): { metrics: ToolQualityMetricValues; reasons: ToolQualityInsufficientReason[]; inspectable: number; empty: number } {
  const knownOutcomes = calls.filter(knownOutcome);
  const inspectable = calls.filter(inspectableSuccessfulResult).length;
  const empty = calls.filter(emptyResult).length;
  const knownRetries = calls.filter((event) => typeof event.retry_number === "number" && Number.isFinite(event.retry_number));
  const retries = knownRetries.filter((event) => (event.retry_number || 0) > 0).length;
  const reasons: ToolQualityInsufficientReason[] = [];
  if (!allowMetrics) reasons.push("tool_volume");
  if (!inspectable) reasons.push("uninspectable_result");
  const metrics: ToolQualityMetricValues = {
    tool_call_share: allowMetrics ? null : null,
    error_rate: allowMetrics && knownOutcomes.length ? knownOutcomes.filter(failed).length / knownOutcomes.length : null,
    observable_empty_result_rate: allowMetrics && inspectable ? empty / inspectable : null,
    retry_rate: allowMetrics && knownRetries.length ? retries / knownRetries.length : null,
    observed_repeat_call_rate: null,
  };
  return { metrics, reasons: [...new Set(reasons)], inspectable, empty };
}

function groupingKey(event: ToolQualityEvent): string | null {
  return event.session_id ? `session:${event.session_id}` : event.correlation_handle ? `correlation:${event.correlation_handle}` : null;
}

function repeatParticipants(events: readonly ToolQualityEvent[]): { participants: Set<ToolQualityEvent>; groupable: Set<ToolQualityEvent> } {
  const groups = new Map<string, ToolQualityEvent[]>();
  for (const event of events) {
    if (event.event_type !== "tool_call" || !event.tool_name || (event.retry_number || 0) > 0) continue;
    const group = groupingKey(event);
    if (!group || timestamp(event) === null) continue;
    groups.set(group, [...(groups.get(group) || []), event]);
  }
  const participants = new Set<ToolQualityEvent>();
  const groupable = new Set<ToolQualityEvent>();
  for (const calls of groups.values()) {
    const byTool = new Map<string, ToolQualityEvent[]>();
    for (const call of calls) byTool.set(call.tool_name!, [...(byTool.get(call.tool_name!) || []), call]);
    for (const toolCalls of byTool.values()) {
      toolCalls.sort((a, b) => (timestamp(a) || 0) - (timestamp(b) || 0));
      toolCalls.forEach((call) => groupable.add(call));
      for (let index = 1; index < toolCalls.length; index += 1) {
        const previous = toolCalls[index - 1];
        const current = toolCalls[index];
        if ((timestamp(current)! - timestamp(previous)!) <= TOOL_QUALITY_REPEAT_WINDOW_MS) {
          participants.add(previous);
          participants.add(current);
        }
      }
    }
  }
  return { participants, groupable };
}

function segmentRows(calls: readonly ToolQualityEvent[], allCalls: number, field: "client_name" | "intent_source", sourceTruncated = false): ToolQualitySegment[] {
  const groups = new Map<string, { calls: ToolQualityEvent[]; sessions: Set<string> }>();
  for (const event of calls) {
    const value = event[field] || (field === "intent_source" ? "missing" : "unknown");
    const group = groups.get(value) || { calls: [], sessions: new Set<string>() };
    group.calls.push(event);
    if (event.session_id) group.sessions.add(event.session_id);
    groups.set(value, group);
  }
  return [...groups.entries()].map(([value, group]) => {
    const eligible = group.calls.length >= TOOL_QUALITY_MIN_SEGMENT_CALLS && group.sessions.size >= TOOL_QUALITY_MIN_SEGMENT_SESSIONS && !sourceTruncated;
    const reasons: ToolQualityInsufficientReason[] = [];
    if (group.calls.length < TOOL_QUALITY_MIN_SEGMENT_CALLS || group.sessions.size < TOOL_QUALITY_MIN_SEGMENT_SESSIONS) reasons.push("segment_volume");
    if (sourceTruncated) reasons.push("bounded_source_scan");
    const known = group.calls.filter(knownOutcome);
    return {
      value,
      call_count: group.calls.length,
      session_count: group.sessions.size,
      tool_call_share: eligible && allCalls ? group.calls.length / allCalls : null,
      error_rate: eligible && known.length ? known.filter(failed).length / known.length : null,
      insufficient_data: reasons,
    };
  }).sort((a, b) => b.call_count - a.call_count || a.value.localeCompare(b.value));
}

function workflowRecords(events: readonly ToolQualityEvent[]): WorkflowRecord[] {
  const grouped = new Map<string, ToolQualityEvent[]>();
  for (const event of events) if (event.workflow_id) grouped.set(event.workflow_id, [...(grouped.get(event.workflow_id) || []), event]);
  return [...grouped.entries()].map(([id, groupedEvents]) => {
    const lifecycle = groupedEvents.filter(isWorkflowLifecycleEvent).sort((a, b) => (timestamp(a) || 0) - (timestamp(b) || 0));
    const terminalEvent = lifecycle.filter((event) => workflowStatus(event) === "completed" || workflowStatus(event) === "failed").at(-1);
    const calls = groupedEvents.filter((event) => event.event_type === "tool_call" && event.tool_name && timestamp(event) !== null).sort((a, b) => timestamp(a)! - timestamp(b)!);
    const terminal: WorkflowRecord["terminal"] = workflowStatus(terminalEvent || {}) === "completed" ? "completed" : workflowStatus(terminalEvent || {}) === "failed" ? "failed" : null;
    return {
      id,
      started: lifecycle.some((event) => workflowStatus(event) === "started"),
      terminal,
      path: calls.map((event) => event.tool_name!).slice(0, 100),
      calls,
    };
  }).filter((workflow) => workflow.started && workflow.path.length > 0);
}

function pathRows(workflows: readonly WorkflowRecord[]): { paths: ToolQualityPath[]; byTool: Map<string, { started: Set<string>; terminal: Set<string>; completed: Set<string>; calls: ToolQualityEvent[]; sessionIds: Set<string> }> } {
  const grouped = new Map<string, { started: Set<string>; terminal: Set<string>; completed: Set<string>; calls: ToolQualityEvent[] }>();
  const byTool = new Map<string, { started: Set<string>; terminal: Set<string>; completed: Set<string>; calls: ToolQualityEvent[]; sessionIds: Set<string> }>();
  for (const workflow of workflows) {
    const key = JSON.stringify(workflow.path);
    const path = grouped.get(key) || { started: new Set<string>(), terminal: new Set<string>(), completed: new Set<string>(), calls: [] };
    path.started.add(workflow.id);
    if (workflow.terminal) path.terminal.add(workflow.id);
    if (workflow.terminal === "completed") path.completed.add(workflow.id);
    if (workflow.terminal) path.calls.push(...workflow.calls);
    grouped.set(key, path);
    for (const toolName of new Set(workflow.path)) {
      const tool = byTool.get(toolName) || { started: new Set<string>(), terminal: new Set<string>(), completed: new Set<string>(), calls: [], sessionIds: new Set<string>() };
      tool.started.add(workflow.id);
      if (!workflow.terminal) {
        byTool.set(toolName, tool);
        continue;
      }
      tool.terminal.add(workflow.id);
      if (workflow.terminal === "completed") tool.completed.add(workflow.id);
      tool.calls.push(...workflow.calls.filter((event) => event.tool_name === toolName));
      workflow.calls.forEach((event) => { if (event.session_id) tool.sessionIds.add(event.session_id); });
      byTool.set(toolName, tool);
    }
  }
  const paths = [...grouped.entries()].map(([serialized, counts]) => {
    const completionRate = counts.terminal.size ? counts.completed.size / counts.terminal.size : null;
    const insufficientData: ToolQualityInsufficientReason[] = [];
    if (counts.terminal.size < TOOL_QUALITY_MIN_WORKFLOW_TERMINALS) insufficientData.push("workflow_volume");
    if (counts.calls.length < TOOL_QUALITY_MIN_TOOL_CALLS) insufficientData.push("tool_volume");
    const eligible = counts.terminal.size >= TOOL_QUALITY_MIN_WORKFLOW_TERMINALS && counts.calls.length >= TOOL_QUALITY_MIN_TOOL_CALLS;
    const status: ToolQualityPath["status"] = eligible
      ? completionRate !== null && completionRate < TOOL_QUALITY_LOW_COMPLETION_THRESHOLD ? "associated_with_low_explicit_completion" : "not_flagged"
      : "insufficient_data";
    return {
      path: JSON.parse(serialized) as string[],
      associated_call_count: counts.calls.length,
      started_workflow_count: counts.started.size,
      terminal_workflow_count: counts.terminal.size,
      completed_workflow_count: counts.completed.size,
      completion_rate: eligible ? completionRate : null,
      status,
      insufficient_data: insufficientData,
    };
  }).sort((a, b) => b.terminal_workflow_count - a.terminal_workflow_count || JSON.stringify(a.path).localeCompare(JSON.stringify(b.path)));
  return { paths, byTool };
}

function snapshotOutput(observation: CatalogObservation, name: string, eligibleCallCount: number): ToolQualityCatalogSnapshot {
  const tool = observation.tools.find((candidate) => candidate.name === name);
  return { name, description_hash: tool?.description_hash || null, schema_hash: tool?.schema_hash || null, effective_from: observation.observed_at, effective_to: observation.effective_to, eligible_call_count: eligibleCallCount };
}

export function analyzeToolQuality(events: readonly ToolQualityEvent[], options: { rangeDays: number; truncated?: boolean }): ToolQualityResponse {
  const sourceLimitReason: ToolQualityInsufficientReason[] = options.truncated ? ["bounded_source_scan"] : [];
  const calls = events.filter((event) => event.event_type === "tool_call" && event.tool_name);
  const observations = buildCatalogObservations(events);
  const repeat = repeatParticipants(calls);
  const callsBySnapshotTool = new Map<string, ToolQualityEvent[]>();
  for (const call of calls) {
    const observation = effectiveCatalog(observations, call);
    if (observation && call.tool_name) {
      const key = `${observation.id}:${call.tool_name}`;
      callsBySnapshotTool.set(key, [...(callsBySnapshotTool.get(key) || []), call]);
    }
  }
  const names = new Set(calls.map((event) => event.tool_name!).filter(Boolean));
  observations.forEach((observation) => observation.tools.forEach((tool) => names.add(tool.name)));
  const workflows = workflowRecords(events);
  const { paths: rawPaths, byTool } = pathRows(workflows);
  const paths = rawPaths.map((path) => {
    if (!sourceLimitReason.length) return path;
    return { ...path, status: "insufficient_data" as const, insufficient_data: [...new Set(path.insufficient_data.concat(sourceLimitReason))] };
  });
  const allEligibleCalls = calls.length;
  const tools: ToolQualityTool[] = [...names].map((name) => {
    const toolCalls = calls.filter((event) => event.tool_name === name);
    const allowMetrics = toolCalls.length >= TOOL_QUALITY_MIN_TOOL_CALLS && !options.truncated;
    const calculated = metricsForCalls(toolCalls, allowMetrics);
    const nonRetryCalls = toolCalls.filter((event) => (event.retry_number || 0) <= 0);
    const missingGrouping = nonRetryCalls.some((event) => groupingKey(event) === null);
    const repeatCount = nonRetryCalls.filter((event) => repeat.participants.has(event)).length;
    const groupableCount = nonRetryCalls.filter((event) => groupingKey(event) !== null).length;
    const repeatRate = allowMetrics && !missingGrouping && groupableCount ? repeatCount / groupableCount : null;
    const tool = byTool.get(name);
    const completionRate = tool && tool.terminal.size ? tool.completed.size / tool.terminal.size : null;
    const completionReasons: ToolQualityInsufficientReason[] = [];
    if (!tool || tool.terminal.size < TOOL_QUALITY_MIN_WORKFLOW_TERMINALS) completionReasons.push("workflow_volume");
    if (!tool || tool.calls.length < TOOL_QUALITY_MIN_TOOL_CALLS) completionReasons.push("tool_volume");
    const completionEligible = Boolean(tool && tool.terminal.size >= TOOL_QUALITY_MIN_WORKFLOW_TERMINALS && tool.calls.length >= TOOL_QUALITY_MIN_TOOL_CALLS && !options.truncated);
    const lowPathAssociated = paths.some((path) => path.status === "associated_with_low_explicit_completion" && path.path.includes(name));
    const completionStatus: ToolQualityTool["completion_association"]["status"] = lowPathAssociated
      ? "associated_with_low_explicit_completion"
      : completionEligible
        ? "not_flagged"
        : "insufficient_data";
    const snapshots = observations.flatMap((observation) => observation.tools.some((candidate) => candidate.name === name)
      ? [snapshotOutput(observation, name, callsBySnapshotTool.get(`${observation.id}:${name}`)?.length || 0)] : []).slice(0, TOOL_QUALITY_MAX_CATALOG_SNAPSHOTS_PER_TOOL);
    const sessionIds = new Set(toolCalls.map((event) => event.session_id).filter((value): value is string => Boolean(value)));
    return {
      name,
      observed: {
        call_count: toolCalls.length,
        successful_call_count: toolCalls.filter(successful).length,
        failed_call_count: toolCalls.filter(failed).length,
        known_outcome_call_count: toolCalls.filter(knownOutcome).length,
        inspectable_successful_result_count: calculated.inspectable,
        empty_result_count: calculated.empty,
        known_retry_call_count: toolCalls.filter((event) => typeof event.retry_number === "number" && Number.isFinite(event.retry_number)).length,
        retry_call_count: toolCalls.filter((event) => typeof event.retry_number === "number" && event.retry_number > 0).length,
        non_retry_call_count: nonRetryCalls.length,
        observed_repeat_call_count: repeatCount,
        session_count: sessionIds.size,
        associated_workflow_call_count: tool?.calls.length || 0,
      },
      metrics: {
        ...calculated.metrics,
        tool_call_share: allowMetrics && allEligibleCalls ? toolCalls.length / allEligibleCalls : null,
        observed_repeat_call_rate: repeatRate,
      },
      catalog_snapshots: snapshots,
      trace_session_ids: [...(tool?.sessionIds || sessionIds)].slice(0, TOOL_QUALITY_MAX_TRACE_SESSION_IDS),
      completion_association: {
        explicit_workflow_count: tool?.terminal.size || 0,
        terminal_workflow_count: tool?.terminal.size || 0,
        explicitly_started_count: tool?.started.size || 0,
        explicitly_completed_count: tool?.completed.size || 0,
        completion_rate: completionEligible ? completionRate : null,
        status: completionStatus,
        insufficient_data: [...new Set(completionReasons.concat(sourceLimitReason))],
      },
      breakdowns: { clients: segmentRows(toolCalls, allEligibleCalls, "client_name", options.truncated), intent_sources: segmentRows(toolCalls, allEligibleCalls, "intent_source", options.truncated) },
      insufficient_data: [...new Set(calculated.reasons.concat(completionReasons, missingGrouping ? ["missing_grouping"] : [], sourceLimitReason))],
    };
  }).sort((a, b) => b.observed.call_count - a.observed.call_count || a.name.localeCompare(b.name));

  const advertised = new Map<string, { name: string; description_hash: string | null; schema_hash: string | null; observed_at: string }>();
  for (const observation of observations) for (const tool of observation.tools) {
    const count = callsBySnapshotTool.get(`${observation.id}:${tool.name}`)?.length || 0;
    if (!count) advertised.set(`${observation.id}:${tool.name}`, { name: tool.name, description_hash: tool.description_hash, schema_hash: tool.schema_hash, observed_at: observation.observed_at });
  }

  const comparisons: ToolQualityCatalogComparison[] = [];
  const byName = new Map<string, CatalogObservation[]>();
  for (const observation of observations) for (const tool of observation.tools) byName.set(tool.name, [...(byName.get(tool.name) || []), observation]);
  for (const [toolName, toolObservations] of byName) {
    const unique = toolObservations.filter((observation, index, all) => all.findIndex((candidate) => candidate.id === observation.id) === index).sort((a, b) => a.at - b.at).slice(0, TOOL_QUALITY_MAX_CATALOG_SNAPSHOTS_PER_TOOL);
    for (let index = 1; index < unique.length; index += 1) {
      const beforeCalls = callsBySnapshotTool.get(`${unique[index - 1].id}:${toolName}`) || [];
      const afterCalls = callsBySnapshotTool.get(`${unique[index].id}:${toolName}`) || [];
      const beforeSnapshot = snapshotOutput(unique[index - 1], toolName, beforeCalls.length);
      const afterSnapshot = snapshotOutput(unique[index], toolName, afterCalls.length);
      if (beforeSnapshot.description_hash === afterSnapshot.description_hash && beforeSnapshot.schema_hash === afterSnapshot.schema_hash) continue;
      const before = metricsForCalls(beforeCalls, beforeCalls.length >= TOOL_QUALITY_MIN_CATALOG_CALLS && !options.truncated);
      const after = metricsForCalls(afterCalls, afterCalls.length >= TOOL_QUALITY_MIN_CATALOG_CALLS && !options.truncated);
      const baseComparisonReasons: ToolQualityInsufficientReason[] = beforeCalls.length < TOOL_QUALITY_MIN_CATALOG_CALLS || afterCalls.length < TOOL_QUALITY_MIN_CATALOG_CALLS ? ["catalog_volume"] : [];
      const comparisonReasons = baseComparisonReasons.concat(sourceLimitReason);
      comparisons.push({
        tool_name: toolName,
        before: beforeSnapshot,
        after: afterSnapshot,
        before_metrics: { error_rate: before.metrics.error_rate, observable_empty_result_rate: before.metrics.observable_empty_result_rate, retry_rate: before.metrics.retry_rate },
        after_metrics: { error_rate: after.metrics.error_rate, observable_empty_result_rate: after.metrics.observable_empty_result_rate, retry_rate: after.metrics.retry_rate },
        insufficient_data: comparisonReasons,
      });
    }
  }

  const insights: ToolQualityInsight[] = paths.filter((path) => path.status === "associated_with_low_explicit_completion").map((path) => ({
    tool_name: path.path.at(-1) || "unknown",
    path: path.path,
    label: "Associated with low explicit completion",
    detail: `Observed association for path ${path.path.join(" → ")} across ${path.terminal_workflow_count} terminal workflows and ${path.associated_call_count} eligible calls; this is an association for investigation, not evidence of cause.`,
    metric: `${Math.round((path.completion_rate || 0) * 100)}% explicit completion`,
    evidence: { workflow_count: path.terminal_workflow_count, associated_call_count: path.associated_call_count, completion_rate: path.completion_rate || 0 },
  }));

  return {
    range_days: options.rangeDays,
    source_event_count: events.length,
    truncated: options.truncated === true,
    tools,
    tool_paths: paths,
    advertised_but_unused: [...advertised.values()],
    catalog_comparisons: comparisons,
    insights,
  };
}
