import { evaluateHealthDimensions, determineVerdict, type HealthSignals } from "./health.ts";
import { isRecord } from "./json.ts";
import { normalizeMcpTesterLimits } from "./limits.ts";
import { safeEndpointForReport, safeResourceUri, safeString } from "./redaction.ts";
import { validateMcpEndpoint, validateMcpHeaders } from "./safety.ts";
import { sendMcpRequest, type TransportFailure, type TransportResult } from "./transport.ts";
import type {
  CapabilitySummary,
  CatalogSummary,
  Finding,
  FindingCategory,
  FindingSeverity,
  McpTesterLimits,
  McpTesterOptions,
  McpTesterPhase,
  McpTesterReport,
  PhaseOutcome,
  PhaseReport,
  PhaseTiming,
  PromptSummary,
  ResourceSummary,
  ServerIdentity,
  TimelineEvent,
  TimelineEventKind,
  ToolSummary,
  ValidatedEndpoint,
} from "./types.ts";

export const DEFAULT_MCP_PROTOCOL_VERSION = "2025-06-18";
export const DEFAULT_MCP_CLIENT_INFO = Object.freeze({ name: "TrackMCP Tester", version: "1.0.0" });
export const DEFAULT_SUPPORTED_MCP_PROTOCOL_VERSIONS = Object.freeze(["2025-06-18", "2025-03-26", "2024-11-05"]);

type CatalogKind = "tools" | "resources" | "prompts";
type CatalogItem = ToolSummary | ResourceSummary | PromptSummary;

interface CatalogDiscovery<T extends CatalogItem> {
  summary: CatalogSummary<T>;
  failure?: TransportFailure;
  invalidResponse: boolean;
}

interface ProbeState {
  limits: McpTesterLimits;
  startedMs: number;
  now: () => number;
  deadlineMs: number;
  timeline: TimelineEvent[];
  timelineTruncated: boolean;
  findings: Finding[];
  phases: PhaseReport[];
  timings: PhaseTiming[];
  requestId: number;
  endpoint: ValidatedEndpoint;
  headers: readonly [string, string][];
  fetch: NonNullable<McpTesterOptions["fetch"]>;
  signal?: AbortSignal;
  protocolVersion: string;
  supportedProtocolVersions: readonly string[];
  clientName: string;
  clientVersion: string;
  sessionId?: string;
  protocol?: McpTesterReport["protocol"];
  server?: ServerIdentity;
  capabilities: CapabilitySummary;
  reachable: boolean;
  browserBlocked: boolean;
  authenticationRequired: boolean;
  authenticated: boolean;
  protocolPassed: boolean;
  identityPassed: boolean;
  toolsPassed: boolean;
  resourcesAdvertised: boolean;
  resourcesPassed: boolean;
  promptsAdvertised: boolean;
  promptsPassed: boolean;
  paginationPassed: boolean;
  paginationTruncated: boolean;
  protocolError: boolean;
  unreachable: boolean;
  incomplete: boolean;
  catalogWarnings: number;
  tools: CatalogSummary<ToolSummary>;
  resources: CatalogSummary<ResourceSummary>;
  prompts: CatalogSummary<PromptSummary>;
}

export async function runMcpTester(options: McpTesterOptions): Promise<McpTesterReport> {
  const limits = normalizeMcpTesterLimits(options.limits);
  const now = options.now ?? (() => typeof performance !== "undefined" ? performance.now() : Date.now());
  const nowIso = options.nowIso ?? (() => new Date().toISOString());
  const startedMs = now();
  const observedAt = nowIso();
  const timeline: TimelineEvent[] = [];
  let timelineTruncated = false;
  const findings: Finding[] = [];
  const phases: PhaseReport[] = [];
  const timings: PhaseTiming[] = [];

  const record = (kind: TimelineEventKind, phase: McpTesterPhase, details?: Readonly<Record<string, string | number | boolean | null>>, durationMs?: number) => {
    if (timeline.length >= limits.maxTimelineEvents) {
      timelineTruncated = true;
      return;
    }
    timeline.push({
      index: timeline.length,
      atMs: Math.max(0, Math.round(now() - startedMs)),
      phase,
      kind,
      ...(durationMs === undefined ? {} : { durationMs: Math.max(0, Math.round(durationMs)) }),
      ...(details === undefined ? {} : { details }),
    });
  };

  const addFinding = (code: string, category: FindingCategory, severity: FindingSeverity, message: string, phase?: McpTesterPhase, details?: Readonly<Record<string, string | number | boolean | null>>) => {
    if (findings.some((finding) => finding.code === code && finding.phase === phase)) return;
    findings.push({ code, category, severity, message, ...(phase === undefined ? {} : { phase }), ...(details === undefined ? {} : { details }) });
    record("finding", phase ?? "finalize", { code, severity });
  };

  const validationPhaseStart = beginPhase("validate_endpoint", record, now);
  const endpointValidation = validateMcpEndpoint(options.endpoint, limits);
  if (!endpointValidation.ok) {
    addFinding(endpointValidation.code, "safety", "error", endpointValidation.message, "validate_endpoint");
    finishPhase("validate_endpoint", validationPhaseStart, "failed", record, phases, timings, now);
    return buildEarlyReport(observedAt, startedMs, now, timeline, timelineTruncated, findings, phases, timings, "unsupported", limits);
  }
  finishPhase("validate_endpoint", validationPhaseStart, "passed", record, phases, timings, now);

  const headerPhaseStart = beginPhase("validate_headers", record, now);
  const headerValidation = validateMcpHeaders(options.headers, limits);
  if (!headerValidation.ok) {
    addFinding(headerValidation.code, "safety", "error", headerValidation.message, "validate_headers");
    finishPhase("validate_headers", headerPhaseStart, "failed", record, phases, timings, now);
    return buildEarlyReport(observedAt, startedMs, now, timeline, timelineTruncated, findings, phases, timings, "unsupported", limits, endpointValidation.safeEndpoint);
  }
  finishPhase("validate_headers", headerPhaseStart, "passed", record, phases, timings, now);

  const fetchImplementation = options.fetch ?? globalThis.fetch;
  if (!fetchImplementation) {
    addFinding("fetch_unavailable", "browser", "error", "This browser does not provide fetch for direct HTTPS testing.", "validate_endpoint");
    return buildEarlyReport(observedAt, startedMs, now, timeline, timelineTruncated, findings, phases, timings, "browser_blocked", limits, endpointValidation.safeEndpoint);
  }

  const state: ProbeState = {
    limits,
    startedMs,
    now,
    deadlineMs: startedMs + limits.maxTotalDurationMs,
    timeline,
    timelineTruncated,
    findings,
    phases,
    timings,
    requestId: 0,
    endpoint: endpointValidation,
    headers: headerValidation.entries,
    fetch: fetchImplementation,
    signal: options.signal,
    protocolVersion: options.protocolVersion ?? DEFAULT_MCP_PROTOCOL_VERSION,
    supportedProtocolVersions: options.supportedProtocolVersions ?? DEFAULT_SUPPORTED_MCP_PROTOCOL_VERSIONS,
    clientName: options.clientInfo?.name ?? DEFAULT_MCP_CLIENT_INFO.name,
    clientVersion: options.clientInfo?.version ?? DEFAULT_MCP_CLIENT_INFO.version,
    capabilities: { tools: false, resources: false, prompts: false },
    reachable: false,
    browserBlocked: false,
    authenticationRequired: false,
    authenticated: false,
    protocolPassed: false,
    identityPassed: false,
    toolsPassed: false,
    resourcesAdvertised: false,
    resourcesPassed: true,
    promptsAdvertised: false,
    promptsPassed: true,
    paginationPassed: true,
    paginationTruncated: false,
    protocolError: false,
    unreachable: false,
    incomplete: false,
    catalogWarnings: 0,
    tools: emptyCatalog<ToolSummary>(),
    resources: emptyCatalog<ResourceSummary>(),
    prompts: emptyCatalog<PromptSummary>(),
  };

  const initResult = await runInitialize(state, addFinding, record, beginPhase, finishPhase);
  if (!initResult) return finalize(state, observedAt, addFinding);

  const notificationResult = await runInitializedNotification(state, addFinding, record, beginPhase, finishPhase);
  if (!notificationResult) return finalize(state, observedAt, addFinding);

  const toolsResult = await discoverCatalog<ToolSummary>(state, "tools", "tools/list", "tools_list", true, addFinding, record, beginPhase, finishPhase);
  state.tools = toolsResult.summary as CatalogSummary<ToolSummary>;
  state.toolsPassed = !toolsResult.failure && toolsResult.summary.complete && !toolsResult.invalidResponse;
  if (toolsResult.failure) applyFailure(state, toolsResult.failure, "tools_list", addFinding);
  if (toolsResult.invalidResponse) state.protocolError = true;
  if (toolsResult.summary.truncated) {
    state.paginationTruncated = true;
    state.incomplete = true;
  }

  if (state.resourcesAdvertised) {
    const resourcesResult = await discoverCatalog<ResourceSummary>(state, "resources", "resources/list", "resources_list", true, addFinding, record, beginPhase, finishPhase);
    state.resources = resourcesResult.summary as CatalogSummary<ResourceSummary>;
    state.resourcesPassed = !resourcesResult.failure && resourcesResult.summary.complete && !resourcesResult.invalidResponse;
    if (resourcesResult.failure) applyFailure(state, resourcesResult.failure, "resources_list", addFinding);
    if (resourcesResult.invalidResponse) state.protocolError = true;
    if (resourcesResult.summary.truncated) {
      state.paginationTruncated = true;
      state.incomplete = true;
    }
  } else {
    skipPhase(state, "resources_list", record, beginPhase, finishPhase);
  }

  if (state.promptsAdvertised) {
    const promptsResult = await discoverCatalog<PromptSummary>(state, "prompts", "prompts/list", "prompts_list", true, addFinding, record, beginPhase, finishPhase);
    state.prompts = promptsResult.summary as CatalogSummary<PromptSummary>;
    state.promptsPassed = !promptsResult.failure && promptsResult.summary.complete && !promptsResult.invalidResponse;
    if (promptsResult.failure) applyFailure(state, promptsResult.failure, "prompts_list", addFinding);
    if (promptsResult.invalidResponse) state.protocolError = true;
    if (promptsResult.summary.truncated) {
      state.paginationTruncated = true;
      state.incomplete = true;
    }
  } else {
    skipPhase(state, "prompts_list", record, beginPhase, finishPhase);
  }

  const qualityStart = beginPhase("catalog_quality", record, now);
  assessCatalogQuality(state, addFinding);
  finishPhase("catalog_quality", qualityStart, "passed", record, phases, timings, now);

  const durationMs = Math.max(0, Math.round(now() - startedMs));
  if (durationMs > limits.maxTotalDurationMs) {
    state.incomplete = true;
    addFinding("total_duration_limit", "limit", "warning", "The test reached its total duration limit before all evidence could be considered.", "finalize", { limit_ms: limits.maxTotalDurationMs });
  }
  if (timelineTruncated) {
    state.incomplete = true;
    addFinding("timeline_limit", "limit", "warning", "The protocol timeline was truncated at the configured event limit.", "finalize", { limit: limits.maxTimelineEvents });
  }
  return finalize(state, observedAt, addFinding);
}

async function runInitialize(state: ProbeState, addFinding: AddFinding, record: RecordEvent, begin: BeginPhase, finish: FinishPhase): Promise<boolean> {
  const start = begin("initialize", record, state.now);
  const response = await request(state, "initialize", {
    jsonrpc: "2.0",
    id: nextRequestId(state),
    method: "initialize",
    params: {
      protocolVersion: state.protocolVersion,
      capabilities: {},
      clientInfo: { name: state.clientName, version: state.clientVersion },
    },
  }, true, "initialize");
  if (!response.ok) {
    applyFailure(state, response, "initialize", addFinding);
    finish("initialize", start, outcomeForFailure(response), record, state.phases, state.timings, state.now);
    return false;
  }
  state.reachable = true;
  state.authenticated = true;
  const envelope = response.envelope;
  const normalized = normalizeInitializeResult(envelope?.result, state.limits.maxRenderedStringLength);
  if (!normalized.ok) {
    state.protocolError = true;
    addFinding(normalized.code, "protocol", "error", normalized.message, "initialize");
    finish("initialize", start, "failed", record, state.phases, state.timings, state.now);
    return false;
  }
  if (!state.supportedProtocolVersions.includes(normalized.protocolVersion)) {
    state.protocolError = true;
    addFinding("unsupported_protocol_version", "protocol", "error", "The endpoint returned a protocol version this browser tester does not support.", "initialize");
    finish("initialize", start, "failed", record, state.phases, state.timings, state.now);
    return false;
  }
  state.protocolPassed = true;
  state.sessionId = response.sessionId;
  state.protocol = {
    requestedVersion: state.protocolVersion,
    negotiatedVersion: normalized.protocolVersion,
    clientName: state.clientName,
    clientVersion: state.clientVersion,
    sessionIdPresent: Boolean(state.sessionId),
  };
  state.server = normalized.server;
  state.identityPassed = Boolean(normalized.server.name && normalized.server.version);
  state.capabilities = normalized.capabilities;
  state.resourcesAdvertised = normalized.capabilities.resources;
  state.promptsAdvertised = normalized.capabilities.prompts;
  if (!state.identityPassed) addFinding("server_identity_incomplete", "identity", "warning", "Initialization succeeded, but server name and version were not both returned.", "initialize");
  finish("initialize", start, "passed", record, state.phases, state.timings, state.now);
  return true;
}

async function runInitializedNotification(state: ProbeState, addFinding: AddFinding, record: RecordEvent, begin: BeginPhase, finish: FinishPhase): Promise<boolean> {
  const start = begin("initialized_notification", record, state.now);
  const response = await request(state, "notifications/initialized", {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  }, false, "initialized_notification");
  if (!response.ok) {
    applyFailure(state, response, "initialized_notification", addFinding);
    finish("initialized_notification", start, outcomeForFailure(response), record, state.phases, state.timings, state.now);
    return false;
  }
  finish("initialized_notification", start, "passed", record, state.phases, state.timings, state.now);
  return true;
}

async function discoverCatalog<T extends CatalogItem>(state: ProbeState, kind: CatalogKind, method: string, phase: McpTesterPhase, advertised: boolean, addFinding: AddFinding, record: RecordEvent, begin: BeginPhase, finish: FinishPhase): Promise<CatalogDiscovery<T>> {
  const start = begin(phase, record, state.now);
  const items: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let pages = 0;
  let truncated = false;

  while (true) {
    if (state.now() >= state.deadlineMs) {
      const failure: TransportFailure = { ok: false, kind: "timeout", code: "total_duration_limit", responseReceived: false };
      state.incomplete = true;
      addFinding("total_duration_limit", "limit", "warning", "The test stopped before catalog discovery completed.", phase, { limit_ms: state.limits.maxTotalDurationMs });
      finish(phase, start, "incomplete", record, state.phases, state.timings, state.now);
      return { summary: { items, count: items.length, pages, complete: false, truncated }, failure, invalidResponse: false } as CatalogDiscovery<T>;
    }
    pages += 1;
    const params = cursor === undefined ? {} : { cursor };
    const response = await request(state, method, {
      jsonrpc: "2.0",
      id: nextRequestId(state),
      method,
      params,
    }, true, phase);
    if (!response.ok) {
      if (kind === "tools" && !advertised && response.kind === "rpc_error" && response.errorCode === -32601) {
        addFinding("tools_list_not_advertised", "discovery", "info", "The server did not advertise tools and reported tools/list as unavailable.", phase);
        finish(phase, start, "passed", record, state.phases, state.timings, state.now);
        return { summary: { items, count: 0, pages, complete: true, truncated: false }, invalidResponse: false } as CatalogDiscovery<T>;
      }
      finish(phase, start, outcomeForFailure(response), record, state.phases, state.timings, state.now);
      return { summary: { items, count: items.length, pages, complete: false, truncated }, failure: response, invalidResponse: response.kind === "protocol_error" } as CatalogDiscovery<T>;
    }
    state.reachable = true;
    const page = normalizeCatalogPage(kind, response.envelope?.result, state.limits);
    if (!page.ok) {
      addFinding(page.code, "protocol", "error", page.message, phase);
      finish(phase, start, "failed", record, state.phases, state.timings, state.now);
      return { summary: { items, count: items.length, pages, complete: false, truncated }, invalidResponse: true } as CatalogDiscovery<T>;
    }
    state.catalogWarnings += page.warnings;
    if (page.truncated) {
      truncated = true;
      state.incomplete = true;
      addFinding("catalog_item_limit", "limit", "warning", "The catalog was truncated at the configured item limit.", phase, { limit: state.limits.maxCatalogItems });
    }
    for (const item of page.items) {
      if (items.length >= state.limits.maxCatalogItems) {
        truncated = true;
        state.incomplete = true;
        addFinding("catalog_item_limit", "limit", "warning", "The catalog was truncated at the configured item limit.", phase, { limit: state.limits.maxCatalogItems });
        break;
      }
      items.push(item as T);
    }
    if (!page.nextCursor) {
      finish(phase, start, "passed", record, state.phases, state.timings, state.now);
      return { summary: { items, count: items.length, pages, complete: !truncated, truncated }, invalidResponse: false } as CatalogDiscovery<T>;
    }
    if (seenCursors.has(page.nextCursor)) {
      state.paginationPassed = false;
      state.incomplete = true;
      addFinding("pagination_cursor_repeated", "pagination", "error", "The server repeated a pagination cursor, so the tester stopped safely.", phase);
      finish(phase, start, "incomplete", record, state.phases, state.timings, state.now);
      return { summary: { items, count: items.length, pages, complete: false, truncated: true }, invalidResponse: false } as CatalogDiscovery<T>;
    }
    seenCursors.add(page.nextCursor);
    if (pages >= state.limits.maxPaginationPages) {
      truncated = true;
      state.paginationTruncated = true;
      state.incomplete = true;
      addFinding("pagination_limit", "pagination", "warning", "Pagination stopped at the configured page limit.", phase, { limit: state.limits.maxPaginationPages });
      finish(phase, start, "incomplete", record, state.phases, state.timings, state.now);
      return { summary: { items, count: items.length, pages, complete: false, truncated: true }, invalidResponse: false } as CatalogDiscovery<T>;
    }
    cursor = page.nextCursor;
  }
}

function normalizeInitializeResult(value: unknown, maxStringLength: number): { ok: true; protocolVersion: string; server: ServerIdentity; capabilities: CapabilitySummary } | { ok: false; code: string; message: string } {
  if (!isRecord(value) || typeof value.protocolVersion !== "string" || value.protocolVersion.length === 0 || value.protocolVersion.length > 128) return { ok: false, code: "malformed_initialize_result", message: "The endpoint returned an invalid MCP initialize result." };
  const serverInfo = isRecord(value.serverInfo) ? value.serverInfo : {};
  const server: ServerIdentity = {
    ...(safeString(serverInfo.name, maxStringLength) ? { name: safeString(serverInfo.name, maxStringLength) } : {}),
    ...(safeString(serverInfo.version, maxStringLength) ? { version: safeString(serverInfo.version, maxStringLength) } : {}),
  };
  const capabilities = isRecord(value.capabilities) ? value.capabilities : {};
  return {
    ok: true,
    protocolVersion: value.protocolVersion,
    server,
    capabilities: {
      tools: isRecord(capabilities.tools),
      resources: isRecord(capabilities.resources),
      prompts: isRecord(capabilities.prompts),
    },
  };
}

function normalizeCatalogPage(kind: CatalogKind, value: unknown, limits: McpTesterLimits): { ok: true; items: CatalogItem[]; nextCursor?: string; warnings: number; truncated: boolean } | { ok: false; code: string; message: string } {
  if (!isRecord(value)) return { ok: false, code: `malformed_${kind}_list_result`, message: `The endpoint returned an invalid ${kind}/list result.` };
  const key = kind === "tools" ? "tools" : kind;
  if (!Array.isArray(value[key])) return { ok: false, code: `malformed_${kind}_list_result`, message: `The endpoint returned an invalid ${kind}/list result.` };
  if (value.nextCursor !== undefined && value.nextCursor !== null && (typeof value.nextCursor !== "string" || value.nextCursor.length === 0 || value.nextCursor.length > 512)) return { ok: false, code: "invalid_pagination_cursor", message: "The endpoint returned an invalid pagination cursor." };
  let warnings = 0;
  const items: CatalogItem[] = [];
  for (const item of value[key].slice(0, limits.maxCatalogItems)) {
    const normalized = kind === "tools" ? normalizeTool(item, limits) : kind === "resources" ? normalizeResource(item, limits) : normalizePrompt(item, limits);
    if (!normalized) {
      warnings += 1;
      continue;
    }
    items.push(normalized);
  }
  if (value[key].length > limits.maxCatalogItems) warnings += 1;
  return { ok: true, items, nextCursor: typeof value.nextCursor === "string" ? value.nextCursor : undefined, warnings, truncated: value[key].length > limits.maxCatalogItems };
}

function normalizeTool(value: unknown, limits: McpTesterLimits): ToolSummary | undefined {
  if (!isRecord(value)) return undefined;
  const name = safeString(value.name, limits.maxRenderedStringLength);
  if (!name) return undefined;
  const inputSchema = isRecord(value.inputSchema) ? value.inputSchema : undefined;
  const properties = inputSchema && isRecord(inputSchema.properties) ? Object.keys(inputSchema.properties).length : undefined;
  return {
    name,
    ...(safeString(value.description, limits.maxRenderedStringLength) ? { description: safeString(value.description, limits.maxRenderedStringLength) } : {}),
    ...(safeString(inputSchema?.type, 64) ? { inputSchemaKind: safeString(inputSchema?.type, 64) } : {}),
    ...(properties === undefined ? {} : { inputSchemaPropertyCount: Math.min(properties, limits.maxCatalogItems) }),
  };
}

function normalizeResource(value: unknown, limits: McpTesterLimits): ResourceSummary | undefined {
  if (!isRecord(value)) return undefined;
  const name = safeString(value.name, limits.maxRenderedStringLength);
  if (!name) return undefined;
  return {
    name,
    ...(safeResourceUri(value.uri, limits.maxRenderedStringLength) ? { uri: safeResourceUri(value.uri, limits.maxRenderedStringLength) } : {}),
    ...(safeString(value.description, limits.maxRenderedStringLength) ? { description: safeString(value.description, limits.maxRenderedStringLength) } : {}),
    ...(safeString(value.mimeType, 128) ? { mimeType: safeString(value.mimeType, 128) } : {}),
  };
}

function normalizePrompt(value: unknown, limits: McpTesterLimits): PromptSummary | undefined {
  if (!isRecord(value)) return undefined;
  const name = safeString(value.name, limits.maxRenderedStringLength);
  if (!name) return undefined;
  const argumentsValue = Array.isArray(value.arguments) ? value.arguments : undefined;
  return {
    name,
    ...(safeString(value.description, limits.maxRenderedStringLength) ? { description: safeString(value.description, limits.maxRenderedStringLength) } : {}),
    ...(argumentsValue === undefined ? {} : { argumentCount: Math.min(argumentsValue.length, limits.maxCatalogItems) }),
  };
}

function assessCatalogQuality(state: ProbeState, addFinding: AddFinding): void {
  const checkDuplicateNames = (names: readonly string[], phase: McpTesterPhase) => {
    const seen = new Set<string>();
    for (const name of names) {
      if (seen.has(name)) addFinding("duplicate_catalog_name", "catalog", "warning", "The discovered catalog contains duplicate item names.", phase);
      seen.add(name);
    }
  };
  checkDuplicateNames(state.tools.items.map((item) => item.name), "tools_list");
  checkDuplicateNames(state.resources.items.map((item) => item.name), "resources_list");
  checkDuplicateNames(state.prompts.items.map((item) => item.name), "prompts_list");
  for (const tool of state.tools.items) {
    if (!tool.description) addFinding("tool_description_missing", "catalog", "warning", "One or more discovered tools do not include a description.", "catalog_quality");
    if (!tool.inputSchemaKind) addFinding("tool_input_schema_missing", "catalog", "warning", "One or more discovered tools do not include a recognizable input schema.", "catalog_quality");
  }
  for (const prompt of state.prompts.items) if (!prompt.description) addFinding("prompt_description_missing", "catalog", "warning", "One or more discovered prompts do not include a description.", "catalog_quality");
}

async function request(state: ProbeState, method: string, body: Record<string, unknown>, expectsResponse: boolean, phase: McpTesterPhase): Promise<TransportResult> {
  if (state.now() >= state.deadlineMs) return { ok: false, kind: "timeout", code: "total_duration_limit", responseReceived: false };
  return sendMcpRequest({
    fetch: state.fetch,
    endpoint: state.endpoint.requestUrl,
    customHeaders: state.headers,
    sessionId: state.sessionId,
    protocolVersion: state.protocolPassed ? state.protocol?.negotiatedVersion : undefined,
    requestId: typeof body.id === "number" ? body.id : undefined,
    body,
    expectsResponse,
    limits: state.limits,
    deadlineMs: state.deadlineMs,
    signal: state.signal,
    now: state.now,
    record: (kind, eventPhase, details) => stateRecord(state, kind, eventPhase, details),
    phase,
  });
}

function applyFailure(state: ProbeState, failure: TransportFailure, phase: McpTesterPhase, addFinding: AddFinding): void {
  if (failure.responseReceived) state.reachable = true;
  switch (failure.kind) {
    case "browser_blocked":
      state.browserBlocked = true;
      addFinding("browser_request_blocked", "browser", "error", "The browser blocked or could not expose the HTTPS response, so the server health cannot be determined.", phase);
      break;
    case "auth_required":
      state.authenticationRequired = true;
      addFinding("authentication_required", "authentication", "error", "Authentication is required. The tester did not store or retry the credential.", phase, failure.status === undefined ? undefined : { status: failure.status });
      break;
    case "unreachable":
      state.unreachable = true;
      addFinding("server_unreachable", "reachability", "error", "The endpoint returned no usable MCP response.", phase, failure.status === undefined ? undefined : { status: failure.status });
      break;
    case "timeout":
      state.incomplete = true;
      addFinding("request_timeout", "limit", "warning", "The bounded test timed out before this phase completed.", phase, { limit_ms: state.limits.maxTotalDurationMs });
      break;
    case "response_too_large":
      state.incomplete = true;
      addFinding("response_body_limit", "limit", "warning", "The response body exceeded the tester safety limit and was not retained.", phase, { limit_bytes: state.limits.maxResponseBodyBytes });
      break;
    case "header_limit":
      state.incomplete = true;
      addFinding("request_header_limit", "limit", "warning", "The request headers reached the configured safety limit before this phase could run.", phase, { limit: state.limits.maxHeaderCount });
      break;
    case "aborted":
      state.incomplete = true;
      addFinding("request_aborted", "limit", "warning", "The test was stopped before this phase completed.", phase);
      break;
    case "protocol_error":
      state.protocolError = true;
      addFinding(failure.code, "protocol", "error", "The endpoint responded with an invalid MCP or JSON-RPC envelope.", phase);
      break;
    case "rpc_error":
      addFinding("json_rpc_error", "protocol", "warning", "The endpoint returned a JSON-RPC error for this read-only phase.", phase, failure.errorCode === undefined ? undefined : { error_code: failure.errorCode });
      break;
  }
}

function finalize(state: ProbeState, observedAt: string, addFinding: AddFinding): McpTesterReport {
  state.timelineTruncated ||= state.timeline.length >= state.limits.maxTimelineEvents;
  if (state.timelineTruncated) state.incomplete = true;
  const durationMs = Math.max(0, Math.round(state.now() - state.startedMs));
  const signals: HealthSignals = {
    reachable: state.reachable,
    browserBlocked: state.browserBlocked,
    authenticated: state.authenticated,
    authenticationRequired: state.authenticationRequired,
    protocolPassed: state.protocolPassed,
    identityPassed: state.identityPassed,
    discoveryPassed: state.toolsPassed && (!state.resourcesAdvertised || state.resourcesPassed) && (!state.promptsAdvertised || state.promptsPassed),
    paginationPassed: state.paginationPassed,
    paginationTruncated: state.paginationTruncated,
    latencyMs: durationMs,
    latencyWarningMs: state.limits.latencyWarningMs,
    catalogWarnings: state.catalogWarnings + state.findings.filter((finding) => finding.category === "catalog").length,
    toolsChecked: true,
    resourcesAdvertised: state.resourcesAdvertised,
    resourcesPassed: state.resourcesPassed,
    promptsAdvertised: state.promptsAdvertised,
    promptsPassed: state.promptsPassed,
    incomplete: state.incomplete,
  };
  const verdict = determineVerdict(signals, state.protocolError, state.unreachable);
  const verdictMessage = verdictMessageFor(verdict);
  const healthDimensions = evaluateHealthDimensions(signals);
  state.timings.push({ phase: "total", durationMs });
  state.phases.push({ phase: "finalize", outcome: "passed", durationMs: 0 });
  if (state.timelineTruncated && !state.findings.some((finding) => finding.code === "timeline_limit")) addFinding("timeline_limit", "limit", "warning", "The protocol timeline was truncated at the configured event limit.", "finalize", { limit: state.limits.maxTimelineEvents });
  return {
    schemaVersion: "mcp-tester-report.v1",
    observedAt,
    durationMs,
    verdict,
    verdictMessage,
    endpoint: safeEndpointForReport(state.endpoint.requestUrl, state.limits.maxRenderedStringLength),
    transport: { kind: "streamable_http", scheme: "https", browserDirect: true },
    ...(state.protocol === undefined ? {} : { protocol: state.protocol }),
    ...(state.server === undefined ? {} : { server: state.server }),
    capabilities: state.capabilities,
    healthDimensions,
    phases: state.phases,
    timings: state.timings,
    timeline: state.timeline,
    timelineTruncated: state.timelineTruncated,
    findings: state.findings,
    tools: state.tools,
    resources: state.resources,
    prompts: state.prompts,
    limitations: buildLimitations(state),
  };
}

function buildEarlyReport(observedAt: string, startedMs: number, now: () => number, timeline: TimelineEvent[], timelineTruncated: boolean, findings: Finding[], phases: PhaseReport[], timings: PhaseTiming[], verdict: McpTesterReport["verdict"], limits: McpTesterLimits, endpoint?: { origin: string; pathname: string; queryPresent: boolean }): McpTesterReport {
  const durationMs = Math.max(0, Math.round(now() - startedMs));
  const signals: HealthSignals = {
    reachable: false,
    browserBlocked: verdict === "browser_blocked",
    authenticated: false,
    authenticationRequired: false,
    protocolPassed: false,
    identityPassed: false,
    discoveryPassed: false,
    paginationPassed: false,
    paginationTruncated: false,
    latencyMs: durationMs,
    latencyWarningMs: limits.latencyWarningMs,
    catalogWarnings: 0,
    toolsChecked: false,
    resourcesAdvertised: false,
    resourcesPassed: false,
    promptsAdvertised: false,
    promptsPassed: false,
    incomplete: false,
  };
  return {
    schemaVersion: "mcp-tester-report.v1",
    observedAt,
    durationMs,
    verdict,
    verdictMessage: verdictMessageFor(verdict),
    endpoint: endpoint ?? { origin: "", pathname: "/", queryPresent: false },
    transport: { kind: "streamable_http", scheme: "https", browserDirect: true },
    capabilities: { tools: false, resources: false, prompts: false },
    healthDimensions: evaluateHealthDimensions(signals),
    phases: [...phases, { phase: "finalize", outcome: "passed", durationMs: 0 }],
    timings: [...timings, { phase: "total", durationMs }],
    timeline,
    timelineTruncated,
    findings,
    tools: emptyCatalog<ToolSummary>(),
    resources: emptyCatalog<ResourceSummary>(),
    prompts: emptyCatalog<PromptSummary>(),
    limitations: ["This was a browser-direct HTTPS Streamable HTTP probe.", "No tools were executed, resources were read, or prompts were retrieved.", "The tester does not proxy arbitrary URLs or persist headers and credentials."],
  };
}

function buildLimitations(state: ProbeState): string[] {
  const limitations = [
    "This is a one-time browser observation, not an uptime or production-readiness claim.",
    "No tools were executed, resources were read, or prompts were retrieved.",
    "STDIO, non-HTTPS transports, private targets, browser-inaccessible targets, and arbitrary-URL server proxies are outside this tester.",
    "Bearer tokens and custom headers are used only for this in-memory request and are not included in the report.",
  ];
  if (!state.resourcesAdvertised) limitations.push("The server did not advertise resources, so resources/list was not requested.");
  if (!state.promptsAdvertised) limitations.push("The server did not advertise prompts, so prompts/list was not requested.");
  if (state.paginationTruncated) limitations.push("At least one catalog stopped at the configured pagination boundary.");
  return limitations;
}

function verdictMessageFor(verdict: McpTesterReport["verdict"]): string {
  switch (verdict) {
    case "healthy_now": return "The endpoint completed the bounded read-only MCP probe successfully.";
    case "degraded": return "The endpoint spoke MCP, but one or more health or catalog dimensions need attention.";
    case "unreachable": return "The endpoint did not return a usable MCP response.";
    case "protocol_error": return "The endpoint responded, but MCP negotiation or a JSON-RPC envelope was invalid.";
    case "auth_required": return "Authentication prevented a complete read-only test; credentials were not stored or retried.";
    case "browser_blocked": return "The browser blocked the request, so this tester cannot distinguish server health from browser policy.";
    case "unsupported": return "This endpoint or request is outside the browser tester safety boundary.";
    case "incomplete": return "The bounded test stopped before complete discovery finished.";
  }
}

function beginPhase(phase: McpTesterPhase, record: RecordEvent, now: () => number): number {
  record("phase_started", phase);
  return now();
}

function finishPhase(phase: McpTesterPhase, start: number, outcome: PhaseOutcome, record: RecordEvent, phases: PhaseReport[], timings: PhaseTiming[], now: () => number): void {
  const durationMs = Math.max(0, Math.round(now() - start));
  phases.push({ phase, outcome, durationMs });
  timings.push({ phase, durationMs });
  record("phase_finished", phase, { outcome }, durationMs);
}

function skipPhase(state: ProbeState, phase: McpTesterPhase, record: RecordEvent, begin: BeginPhase, finish: FinishPhase): void {
  const start = begin(phase, record, state.now);
  finish(phase, start, "skipped", record, state.phases, state.timings, state.now);
}

function outcomeForFailure(failure: TransportFailure): PhaseOutcome {
  if (failure.kind === "auth_required") return "auth_required";
  if (failure.kind === "browser_blocked") return "blocked";
  if (failure.kind === "timeout" || failure.kind === "response_too_large" || failure.kind === "header_limit" || failure.kind === "aborted") return "incomplete";
  return "failed";
}

function nextRequestId(state: ProbeState): number {
  state.requestId += 1;
  return state.requestId;
}

function stateRecord(state: ProbeState, kind: TimelineEventKind, phase: McpTesterPhase, details?: Readonly<Record<string, string | number | boolean | null>>): void {
  if (state.timeline.length >= state.limits.maxTimelineEvents) {
    state.timelineTruncated = true;
    return;
  }
  state.timeline.push({ index: state.timeline.length, atMs: Math.max(0, Math.round(state.now() - state.startedMs)), phase, kind, ...(details === undefined ? {} : { details }) });
}

function emptyCatalog<T>(): CatalogSummary<T> {
  return { items: [], count: 0, pages: 0, complete: false, truncated: false };
}

type AddFinding = (code: string, category: FindingCategory, severity: FindingSeverity, message: string, phase?: McpTesterPhase, details?: Readonly<Record<string, string | number | boolean | null>>) => void;
type RecordEvent = (kind: TimelineEventKind, phase: McpTesterPhase, details?: Readonly<Record<string, string | number | boolean | null>>, durationMs?: number) => void;
type BeginPhase = (phase: McpTesterPhase, record: RecordEvent, now: () => number) => number;
type FinishPhase = (phase: McpTesterPhase, start: number, outcome: PhaseOutcome, record: RecordEvent, phases: PhaseReport[], timings: PhaseTiming[], now: () => number) => void;
