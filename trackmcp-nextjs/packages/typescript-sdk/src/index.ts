import { createHash, randomUUID } from "node:crypto";
import {
  DEFAULT_MAX_BATCH_SIZE,
  DEFAULT_MAX_PAYLOAD_BYTES,
  DEFAULT_MAX_PAYLOAD_DEPTH,
  DEFAULT_MAX_PAYLOAD_KEYS,
  DEFAULT_MAX_QUEUE_BYTES,
  DEFAULT_MAX_QUEUE_EVENTS,
  DEFAULT_MAX_STRING_LENGTH,
  payloadByteLength,
  sanitizePayload,
  type PayloadMode,
} from "./privacy.js";
export type { PayloadMode } from "./privacy.js";

export type TrackMCPEventType = "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";
export const TRACKMCP_SCHEMA_VERSION = "1" as const;
export type TrackMCPCorrelationMode = "none" | "external" | "issued";
export type TrackMCPCorrelationHandleSource = "external" | "issued" | "missing";
export type TrackMCPIntentSource = "context_parameter" | "external_callback" | "fallback" | "missing";
export type TrackMCPIntentContext = {
  eventType: TrackMCPEventType;
  mcpMethod?: string;
  toolName?: string;
  requestId?: string;
  sessionId?: string;
  transport?: TrackMCPEvent["transport"];
};
export type TrackMCPCorrelationContext = {
  eventType: TrackMCPEventType;
  mcpMethod?: string;
  toolName?: string;
  requestId?: string;
  sessionId?: string;
  transport?: TrackMCPEvent["transport"];
};
export type TrackMCPCorrelationOptions = {
  mode?: TrackMCPCorrelationMode;
  resolve?: (context: TrackMCPCorrelationContext) => string | undefined | null;
  issuedField?: string;
};

export type TrackMCPEvent = {
  schema_version?: string;
  event_id: string;
  event_type: TrackMCPEventType;
  service: string;
  environment: string;
  server_id?: string;
  direction?: "client_to_server" | "server_to_client";
  transport?: "stdio" | "streamable_http" | "sse" | "custom";
  protocol_version?: string;
  mcp_method?: string;
  request_id?: string;
  session_id?: string;
  session_id_source?: "protocol" | "transport_generated" | "external" | "missing";
  correlation_handle?: string;
  correlation_handle_source?: TrackMCPCorrelationHandleSource;
  context?: string;
  intent_source?: TrackMCPIntentSource;
  missing_capability?: string;
  task_id?: string;
  workflow_id?: string;
  deployment_id?: string;
  server_version?: string;
  sdk_version?: string;
  observation_source?: "client" | "server";
  client_name?: string;
  client_version?: string;
  tool_name?: string;
  tool_description?: string;
  tool_description_hash?: string;
  started_at: string;
  duration_ms?: number;
  success?: boolean;
  is_error?: boolean;
  error_class?: string;
  error_code?: number;
  retry_number?: number;
  schema_hash?: string;
  payload_size_bytes?: number;
  payload_policy?: "metadata" | "redacted" | "full";
  payload?: Record<string, unknown>;
};

export type TrackMCPOptions = {
  apiKey: string;
  service?: string;
  environment?: string;
  endpoint?: string;
  sampleRate?: number;
  redact?: string[];
  redactKeys?: string[];
  payloadMode?: PayloadMode;
  maxPayloadBytes?: number;
  maxPayloadDepth?: number;
  maxPayloadKeys?: number;
  maxStringLength?: number;
  redactEvent?: (event: TrackMCPEvent) => TrackMCPEvent | null;
  disabled?: boolean;
  server_version?: string;
  sdk_version?: string;
  deployment_id?: string;
  server_id?: string;
  flushIntervalMs?: number;
  maxBatchSize?: number;
  maxQueueEvents?: number;
  maxQueueBytes?: number;
  correlation?: TrackMCPCorrelationOptions;
  intentFallback?: (context: TrackMCPIntentContext) => string | undefined | null;
};

const DEFAULT_ENDPOINT = "https://trackmcp.com/api/v1/ingest";
let activeClient: TrackMCPClient | undefined;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableJson(value), "utf8").digest("hex");
}

type CatalogTool = { name: string; description?: string; tool_description_hash: string; schema_hash: string };

const CORRELATION_HANDLE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const RESERVED_CORRELATION_FIELD = "__trackmcp_correlation_handle";
const MAX_PENDING_CORRELATIONS = 1000;
const PENDING_CORRELATION_TIMEOUT_MS = 30_000;
const INTENT_FIELD = "context";
const INTENT_SENSITIVE = /(?:bearer\s+|authorization\s*[:=]|api[_-]?key\s*[:=]|access[_-]?token\s*[:=]|refresh[_-]?token\s*[:=]|password\s*[:=]|secret\s*[:=]|eyJ[A-Za-z0-9_-]+\.|https?:\/\/|\b[^\s@]+@[^\s@]+\.[^\s@]+\b)/i;

function safeCorrelationHandle(value: unknown): value is string {
  if (typeof value !== "string" || !CORRELATION_HANDLE.test(value)) return false;
  return !/(?:bearer(?:\s|[_:-])|eyJ[A-Za-z0-9_-]+\.|@|https?:\/\/|:\/\/|^sk[-_])/i.test(value);
}

function safeIntentText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && new TextEncoder().encode(value.trim()).byteLength <= maxLength && !INTENT_SENSITIVE.test(value);
}

export type TrackMCPDiagnostics = {
  droppedEvents: number;
  hookErrors: number;
  privacyErrors: number;
  queuedEvents: number;
  queuedBytes: number;
};

function catalogTools(result: Record<string, unknown> | undefined): CatalogTool[] {
  if (!result || !Array.isArray(result.tools)) return [];
  return result.tools.flatMap((tool): CatalogTool[] => {
    if (!tool || typeof tool !== "object" || typeof (tool as { name?: unknown }).name !== "string") return [];
    const value = tool as Record<string, unknown>;
    const description = typeof value.description === "string" ? value.description : undefined;
    const inputSchema = value.inputSchema ?? value.input_schema ?? {};
    return [{ name: value.name as string, ...(description ? { description } : {}), tool_description_hash: sha256(description || ""), schema_hash: sha256(inputSchema) }];
  });
}

export type TrackMCPEventHook = (event: TrackMCPEvent) => void;

function freezeClone<T>(value: T): T {
  const clone = JSON.parse(JSON.stringify(value)) as T;
  const freeze = (item: unknown): unknown => {
    if (!item || typeof item !== "object" || Object.isFrozen(item)) return item;
    Object.freeze(item);
    for (const child of Object.values(item as Record<string, unknown>)) freeze(child);
    return item;
  };
  return freeze(clone) as T;
}

export class TrackMCPClient {
  private readonly options: Required<Pick<TrackMCPOptions, "service" | "environment" | "endpoint" | "sampleRate" | "redact" | "redactKeys" | "payloadMode" | "maxPayloadBytes" | "maxPayloadDepth" | "maxPayloadKeys" | "maxStringLength" | "flushIntervalMs" | "maxBatchSize" | "maxQueueEvents" | "maxQueueBytes" | "disabled">> & Pick<TrackMCPOptions, "apiKey" | "server_id" | "server_version" | "sdk_version" | "deployment_id" | "redactEvent" | "intentFallback"> & { correlation: Required<Pick<TrackMCPCorrelationOptions, "mode" | "issuedField">> & Pick<TrackMCPCorrelationOptions, "resolve"> };
  private queue: TrackMCPEvent[] = [];
  private queueBytes = 0;
  private readonly diagnosticCounts = { droppedEvents: 0, hookErrors: 0, privacyErrors: 0 };
  private readonly toolCatalog = new Map<string, CatalogTool>();
  private readonly intentTools = new Set<string>();
  private timer?: NodeJS.Timeout;
  private flushing?: Promise<void>;

  constructor(options: TrackMCPOptions) {
    if (!options.apiKey) throw new Error("TrackMCP apiKey is required");
    this.options = {
      apiKey: options.apiKey,
      server_id: options.server_id,
      server_version: options.server_version,
      sdk_version: options.sdk_version,
      deployment_id: options.deployment_id,
      service: options.service || "mcp-server",
      environment: options.environment || process.env.NODE_ENV || "production",
      endpoint: options.endpoint || DEFAULT_ENDPOINT,
      sampleRate: Math.min(1, Math.max(0, options.sampleRate ?? 1)),
      redact: options.redact || [],
      redactKeys: options.redactKeys || [],
      payloadMode: options.payloadMode === "metadata" || options.payloadMode === "full" ? options.payloadMode : "redacted",
      maxPayloadBytes: options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES,
      maxPayloadDepth: options.maxPayloadDepth ?? DEFAULT_MAX_PAYLOAD_DEPTH,
      maxPayloadKeys: options.maxPayloadKeys ?? DEFAULT_MAX_PAYLOAD_KEYS,
      maxStringLength: options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH,
      flushIntervalMs: options.flushIntervalMs ?? 5000,
      maxBatchSize: Math.max(1, Math.floor(options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE)),
      maxQueueEvents: Math.max(1, Math.floor(options.maxQueueEvents ?? DEFAULT_MAX_QUEUE_EVENTS)),
      maxQueueBytes: Math.max(1, Math.floor(options.maxQueueBytes ?? DEFAULT_MAX_QUEUE_BYTES)),
      disabled: options.disabled ?? false,
      redactEvent: options.redactEvent,
      correlation: {
        mode: options.correlation?.mode === "external" || options.correlation?.mode === "issued" ? options.correlation.mode : "none",
        resolve: options.correlation?.resolve,
        issuedField: options.correlation?.issuedField && /^__trackmcp_[A-Za-z0-9_]{1,64}$/.test(options.correlation.issuedField) ? options.correlation.issuedField : RESERVED_CORRELATION_FIELD,
      },
      intentFallback: options.intentFallback,
    };
    if (!this.options.disabled) {
      this.timer = setInterval(() => void this.flush(), this.options.flushIntervalMs);
      this.timer.unref?.();
    }
  }

  capture(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version" | "observation_source"> & { schema_version?: string; observation_source?: "client" | "server" }, issuedHandle?: string): void {
    this.captureInternal(event, "server", issuedHandle);
  }

  captureClient(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version" | "observation_source"> & { schema_version?: string }, hook?: TrackMCPEventHook, correlationOverride?: { handle?: string; source: TrackMCPCorrelationHandleSource }): void {
    this.captureInternal(event, "client", undefined, hook, correlationOverride);
  }

  resolveCorrelation(event: Partial<TrackMCPEvent>): { handle?: string; source: TrackMCPCorrelationHandleSource } {
    return this.correlationFor(event);
  }

  private captureInternal(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version" | "observation_source"> & { schema_version?: string; observation_source?: "client" | "server" }, source: "client" | "server", issuedHandle?: string, hook?: TrackMCPEventHook, correlationOverride?: { handle?: string; source: TrackMCPCorrelationHandleSource }): void {
    if (this.options.disabled || Math.random() > this.options.sampleRate) return;
    try {
      const correlation = correlationOverride || this.correlationFor(event, issuedHandle);
      const intent = this.intentFor(event);
      let prepared = this.prepareEvent({
        ...event,
        schema_version: TRACKMCP_SCHEMA_VERSION,
        event_id: randomUUID(),
        service: this.options.service,
        environment: this.options.environment,
        observation_source: source,
        session_id_source: event.session_id_source || (event.session_id ? "external" : "missing"),
        correlation_handle: correlation.handle,
        correlation_handle_source: correlation.source,
        context: intent.context,
        intent_source: intent.source,
        server_id: this.options.server_id,
        server_version: this.options.server_version,
        sdk_version: this.options.sdk_version,
        deployment_id: this.options.deployment_id,
      }, source);
      if (this.options.redactEvent) {
        try {
          const hooked = this.options.redactEvent(prepared);
          if (!hooked) {
            this.diagnosticCounts.droppedEvents += 1;
            return;
          }
          prepared = this.prepareEvent(hooked, source);
        } catch {
          this.diagnosticCounts.hookErrors += 1;
          this.diagnosticCounts.droppedEvents += 1;
          return;
        }
      }
      if (!this.enqueue(prepared)) return;
      if (hook) {
        try {
          hook(freezeClone(prepared));
        } catch {
          this.diagnosticCounts.hookErrors += 1;
          this.removeQueuedEvent(prepared);
        }
      }
    } catch {
      this.diagnosticCounts.privacyErrors += 1;
      this.diagnosticCounts.droppedEvents += 1;
      return;
    }
    if (this.queue.length >= this.options.maxBatchSize) void this.flush();
  }

  private correlationFor(event: Partial<TrackMCPEvent>, issuedHandle?: string): { handle?: string; source: TrackMCPCorrelationHandleSource } {
    if (this.options.correlation.mode === "issued" && safeCorrelationHandle(issuedHandle)) return { handle: issuedHandle, source: "issued" };
    if (this.options.correlation.mode === "external" && this.options.correlation.resolve) {
      try {
        const handle = this.options.correlation.resolve({ eventType: event.event_type || "custom", mcpMethod: event.mcp_method, toolName: event.tool_name, requestId: event.request_id, sessionId: event.session_id, transport: event.transport });
        if (safeCorrelationHandle(handle)) return { handle, source: "external" };
      } catch {
        // Correlation is optional telemetry. Resolver failures are fail-open.
      }
    }
    return { source: "missing" };
  }

  private removeQueuedEvent(event: TrackMCPEvent): void {
    const index = this.queue.lastIndexOf(event);
    if (index < 0) return;
    this.queue.splice(index, 1);
    this.queueBytes = Math.max(0, this.queueBytes - payloadByteLength(event));
    this.diagnosticCounts.droppedEvents += 1;
  }

  private intentFor(event: Partial<TrackMCPEvent>): { context?: string; source: TrackMCPIntentSource } {
    if (safeIntentText(event.context, this.options.maxStringLength)) {
      const source = event.intent_source === "external_callback" ? "external_callback" : event.intent_source === "fallback" ? "fallback" : "context_parameter";
      return { context: event.context.trim(), source };
    }
    if (this.options.intentFallback) {
      try {
        const context = this.options.intentFallback({ eventType: event.event_type || "custom", mcpMethod: event.mcp_method, toolName: event.tool_name, requestId: event.request_id, sessionId: event.session_id, transport: event.transport });
        if (safeIntentText(context, this.options.maxStringLength)) return { context: context.trim(), source: "fallback" };
      } catch {
        // Intent is optional telemetry. Fallback failures remain fail-open.
      }
    }
    return { source: "missing" };
  }

  issuedField(): string { return this.options.correlation.issuedField; }

  issuedMode(): boolean { return this.options.correlation.mode === "issued"; }

  intentContextFor(toolName: string | undefined, argumentsValue: Record<string, unknown>): string | undefined {
    if (!toolName || !this.intentTools.has(toolName) || !Object.prototype.hasOwnProperty.call(argumentsValue, INTENT_FIELD)) return undefined;
    return argumentsValue[INTENT_FIELD] as string | undefined;
  }

  reportMissing(capability: string, context?: string): void {
    if (!safeIntentText(capability, this.options.maxStringLength)) {
      this.diagnosticCounts.droppedEvents += 1;
      return;
    }
    this.capture({ event_type: "custom", mcp_method: "trackmcp_report_missing", missing_capability: capability.trim(), context, started_at: new Date().toISOString(), payload: { name: "trackmcp_report_missing" } });
  }

  stripIssuedField(value: unknown, field = this.issuedField()): unknown {
    if (Array.isArray(value)) return value.map((item) => this.stripIssuedField(item, field));
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => key !== field).map(([key, child]) => [key, this.stripIssuedField(child, field)]));
  }

  injectOptionalContext(message: Record<string, unknown>, handle: string): Record<string, unknown> {
    const result = message.result;
    if (!result || typeof result !== "object" || !Array.isArray((result as Record<string, unknown>).tools)) return message;
    const tools = (result as Record<string, unknown>).tools as unknown[];
    const augmentedTools = tools.map((tool) => {
      if (!tool || typeof tool !== "object") return tool;
      const record = tool as Record<string, unknown>;
      const schema = record.inputSchema;
      if (!schema || typeof schema !== "object" || Array.isArray(schema)) return tool;
      const schemaRecord = schema as Record<string, unknown>;
      if (schemaRecord.type !== "object") return tool;
      const properties = schemaRecord.properties && typeof schemaRecord.properties === "object" && !Array.isArray(schemaRecord.properties) ? schemaRecord.properties as Record<string, unknown> : {};
      let nextProperties = properties;
      if (!Object.prototype.hasOwnProperty.call(properties, INTENT_FIELD)) {
        this.intentTools.add(record.name as string);
        nextProperties = { ...nextProperties, [INTENT_FIELD]: { type: "string", maxLength: this.options.maxStringLength, description: "Optional one-sentence description of the user’s underlying goal." } };
      }
      if (this.options.correlation.mode === "issued" && safeCorrelationHandle(handle) && !Object.prototype.hasOwnProperty.call(nextProperties, this.issuedField())) {
        nextProperties = { ...nextProperties, [this.issuedField()]: { type: "string", maxLength: 128, default: handle, description: "Opaque TrackMCP correlation handle; echo only when provided." } };
      }
      return nextProperties === properties ? tool : { ...record, inputSchema: { ...schemaRecord, properties: nextProperties } };
    });
    return { ...message, result: { ...(result as Record<string, unknown>), tools: augmentedTools } };
  }

  private prepareEvent(event: TrackMCPEvent, source: "client" | "server" = "server"): TrackMCPEvent {
    const prepared = { ...event, observation_source: source, payload_policy: this.options.payloadMode };
    if (!safeCorrelationHandle(prepared.correlation_handle) || (prepared.correlation_handle_source !== "external" && prepared.correlation_handle_source !== "issued")) {
      delete prepared.correlation_handle;
      prepared.correlation_handle_source = "missing";
    }
    if (safeIntentText(prepared.context, this.options.maxStringLength)) {
      prepared.context = prepared.context.trim();
      if (prepared.intent_source !== "external_callback" && prepared.intent_source !== "fallback") prepared.intent_source = "context_parameter";
    } else {
      delete prepared.context;
      prepared.intent_source = "missing";
    }
    if (!safeIntentText(prepared.missing_capability, this.options.maxStringLength)) delete prepared.missing_capability;
    if (this.options.payloadMode === "metadata") {
      if (source === "client" && prepared.payload && typeof prepared.payload === "object" && !Array.isArray(prepared.payload) && prepared.payload._trackmcp && typeof prepared.payload._trackmcp === "object") {
        const metadata = prepared.payload._trackmcp as Record<string, unknown>;
        const observationKinds = new Set(["tool_call_issued", "result_received", "next_tool_selected", "session_started", "session_ended"]);
        const sanitizedMetadata: Record<string, unknown> = {
          observation_source: "client",
          ...(typeof metadata.observation_kind === "string" && observationKinds.has(metadata.observation_kind) ? { observation_kind: metadata.observation_kind } : {}),
          ...(typeof metadata.repeat_observed === "boolean" ? { repeat_observed: metadata.repeat_observed } : {}),
          ...(metadata.repeat_group_source === "session_id" || metadata.repeat_group_source === "correlation_handle" ? { repeat_group_source: metadata.repeat_group_source } : {}),
          ...(typeof metadata.next_tool_selection_observed === "boolean" ? { next_tool_selection_observed: metadata.next_tool_selection_observed } : {}),
          ...(typeof metadata.preceding_request_id === "string" && metadata.preceding_request_id.length <= DEFAULT_MAX_STRING_LENGTH ? { preceding_request_id: metadata.preceding_request_id } : {}),
        };
        prepared.payload = { _trackmcp: sanitizedMetadata };
        prepared.payload_size_bytes = payloadByteLength(prepared.payload);
      } else {
        delete prepared.payload;
        prepared.payload_size_bytes = 0;
      }
      return prepared;
    }
    if (prepared.payload !== undefined) {
      prepared.payload = sanitizePayload(prepared.payload, {
        mode: this.options.payloadMode,
        explicitPaths: this.options.redact,
        redactKeys: this.options.redactKeys,
        maxPayloadBytes: this.options.maxPayloadBytes,
        maxPayloadDepth: this.options.maxPayloadDepth,
        maxPayloadKeys: this.options.maxPayloadKeys,
        maxStringLength: this.options.maxStringLength,
      }) as Record<string, unknown> | undefined;
      prepared.payload_size_bytes = payloadByteLength(prepared.payload);
    } else {
      prepared.payload_size_bytes = 0;
    }
    return prepared;
  }

  private enqueue(event: TrackMCPEvent): boolean {
    const eventBytes = payloadByteLength(event);
    if (!eventBytes || eventBytes > this.options.maxQueueBytes) {
      this.diagnosticCounts.droppedEvents += 1;
      return false;
    }
    this.queue.push(event);
    this.queueBytes += eventBytes;
    while (this.queue.length > this.options.maxQueueEvents || this.queueBytes > this.options.maxQueueBytes) {
      const dropped = this.queue.shift();
      if (!dropped) break;
      this.queueBytes = Math.max(0, this.queueBytes - payloadByteLength(dropped));
      this.diagnosticCounts.droppedEvents += 1;
    }
    return true;
  }

  getDiagnostics(): TrackMCPDiagnostics {
    return { ...this.diagnosticCounts, queuedEvents: this.queue.length, queuedBytes: this.queueBytes };
  }

  track(name: string, payload: Record<string, unknown> = {}): void {
    this.capture({
      event_type: "custom",
      started_at: new Date().toISOString(),
      payload: { name, ...payload },
    });
  }

  workflow(name: string, status: "started" | "completed" | "failed", payload: Record<string, unknown> = {}): void {
    this.capture({ event_type: "workflow", started_at: new Date().toISOString(), payload: { name: "workflow", workflow_name: name, status, ...payload } });
  }

  recordCatalog(result: Record<string, unknown> | undefined): CatalogTool[] {
    const tools = catalogTools(result);
    for (const tool of tools) this.toolCatalog.set(tool.name, tool);
    return tools;
  }

  toolMetadata(name: string | undefined): CatalogTool | undefined {
    return name ? this.toolCatalog.get(name) : undefined;
  }

  async flush(): Promise<void> {
    if (this.options.disabled || this.flushing || this.queue.length === 0) return this.flushing || Promise.resolve();
    const events = this.queue.splice(0, this.options.maxBatchSize);
    this.queueBytes = Math.max(0, this.queueBytes - events.reduce((total, event) => total + payloadByteLength(event), 0));
    let delivered = false;
    this.flushing = fetch(this.options.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.options.apiKey}` },
      body: JSON.stringify({ events }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`TrackMCP ingest returned ${response.status}`);
        delivered = true;
      })
      .catch(() => {
        // Analytics must never affect the user's MCP server. Requeue within the same bounds.
        for (const event of events) this.enqueue(event);
      })
      .finally(() => {
        this.flushing = undefined;
        if (delivered && this.queue.length >= this.options.maxBatchSize) void this.flush();
      });
    return this.flushing;
  }
}

function toolCallDetails(args: unknown[]): { toolName?: string; payload: Record<string, unknown>; context?: unknown } {
  const first = args[0];
  if (!first || typeof first !== "object") return { payload: { args } };
  const request = first as Record<string, unknown>;
  const params = request.params && typeof request.params === "object" ? request.params as Record<string, unknown> : request;
  const argumentsValue = params.arguments ?? params.args ?? {};
  const payloadArgs = argumentsValue && typeof argumentsValue === "object" && !Array.isArray(argumentsValue) ? { ...(argumentsValue as Record<string, unknown>) } : argumentsValue;
  const context = payloadArgs && typeof payloadArgs === "object" && !Array.isArray(payloadArgs) ? (payloadArgs as Record<string, unknown>).context : undefined;
  if (payloadArgs && typeof payloadArgs === "object" && !Array.isArray(payloadArgs)) delete (payloadArgs as Record<string, unknown>).context;
  return { toolName: typeof params.name === "string" ? params.name : undefined, payload: { args: payloadArgs }, context };
}

function wrapTransport(transport: object, client: TrackMCPClient): object {
  const pending = new Map<string, { method?: string; toolName?: string; payload: Record<string, unknown>; started: number; expiresAt: number; correlationHandle?: string; intentContext?: string }>();
  const transportSessionId = randomUUID();
  const issuedHandle = `tmcp_${randomUUID().replaceAll("-", "")}`;
  let activeSessionId: string = transportSessionId;
  let activeSessionIdSource: "protocol" | "transport_generated" = "transport_generated";
  let clientName: string | undefined;
  let clientVersion: string | undefined;
  let messageHandler: ((message: unknown, extra?: unknown) => void) | undefined;
  const keyFor = (id: unknown) => `${typeof id}:${String(id)}`;
  const prunePending = () => {
    const now = Date.now();
    for (const [key, value] of pending) if (value.expiresAt <= now) pending.delete(key);
  };
  const addPending = (key: string, value: Omit<NonNullable<ReturnType<typeof pending.get>>, "expiresAt">) => {
    prunePending();
    pending.delete(key);
    while (pending.size >= MAX_PENDING_CORRELATIONS) {
      const oldest = pending.keys().next().value;
      if (oldest === undefined) break;
      pending.delete(oldest);
    }
    pending.set(key, { ...value, expiresAt: Date.now() + PENDING_CORRELATION_TIMEOUT_MS });
  };
  const cleanupTimer = setInterval(prunePending, PENDING_CORRELATION_TIMEOUT_MS);
  cleanupTimer.unref?.();
  return new Proxy(transport, {
    get(target, property, receiver) {
      if (property === "send") {
        return async (message: Record<string, unknown>, options?: unknown) => {
          prunePending();
          const id = message.id;
          const pendingCall = id !== undefined ? pending.get(keyFor(id)) : undefined;
          if (pendingCall) {
            const call = pendingCall;
            pending.delete(keyFor(id));
            const result = message.result as Record<string, unknown> | undefined;
            const failed = Boolean(message.error) || Boolean(result?.isError);
            const protocolError = message.error && typeof message.error === "object" ? message.error as { code?: unknown } : undefined;
            const transportProvidedSessionId = Reflect.get(target, "sessionId");
            if (typeof result?.sessionId === "string") {
              activeSessionId = result.sessionId;
              activeSessionIdSource = "protocol";
            } else if (typeof transportProvidedSessionId === "string" && activeSessionIdSource === "transport_generated") {
              activeSessionId = transportProvidedSessionId;
              activeSessionIdSource = "protocol";
            }
            const sessionId = activeSessionId;
            if (call.method === "tools/call") {
              const metadata = client.toolMetadata(call.toolName);
              client.capture({ event_type: "tool_call", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), tool_name: call.toolName, tool_description: metadata?.description, tool_description_hash: metadata?.tool_description_hash, schema_hash: metadata?.schema_hash, client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, context: call.intentContext, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : result?.isError ? "tool_execution_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { ...call.payload, result: client.stripIssuedField(message.error || result) } }, call.correlationHandle);
            } else if (call.method === "initialize") {
              client.capture({ event_type: "session", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), protocol_version: typeof result?.protocolVersion === "string" ? result.protocolVersion : undefined, client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { result: message.error || result } });
            } else if (["tools/list", "resources/list", "resources/templates/list", "prompts/list"].includes(call.method || "") && !failed) {
              const catalogType = call.method?.replace("/list", "") || "catalog";
              const tools = client.recordCatalog(result);
              client.capture({ event_type: "catalog", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: true, is_error: false, payload: { name: `${catalogType}_discovered`, tools, result } });
            }
          }
          const send = Reflect.get(target, property) as (message: unknown, options?: unknown) => Promise<void>;
          const outgoing = pendingCall?.method === "tools/list" ? client.injectOptionalContext(message, issuedHandle) : message;
          return send.call(target, outgoing, options);
        };
      }
      if (property === "onmessage") return messageHandler;
      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set(target, property, value) {
      if (property === "onmessage") {
          messageHandler = (message: unknown, extra?: unknown) => {
          if (!message || typeof message !== "object") return;
          let record = message as Record<string, unknown>;
          if (record.method === "initialize") {
            const params = record.params as Record<string, unknown> | undefined;
            const info = params?.clientInfo as Record<string, unknown> | undefined;
            if (typeof info?.name === "string") clientName = info.name;
            if (typeof info?.version === "string") clientVersion = info.version;
          }
          prunePending();
          if (record.method === "tools/call" && record.id !== undefined) {
            const params = record.params as Record<string, unknown> | undefined;
            const argumentsValue = params?.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments) ? params.arguments as Record<string, unknown> : {};
            const correlationHandle = client.issuedMode() && client.issuedField() in argumentsValue && safeCorrelationHandle(argumentsValue[client.issuedField()]) ? argumentsValue[client.issuedField()] as string : undefined;
            const intentContext = client.intentContextFor(typeof params?.name === "string" ? params.name : undefined, argumentsValue);
            const cleanArguments = { ...argumentsValue };
            if (client.issuedMode()) delete cleanArguments[client.issuedField()];
            if (intentContext !== undefined) delete cleanArguments[INTENT_FIELD];
            const cleanRecord = (correlationHandle || intentContext !== undefined) && params ? { ...record, params: { ...params, arguments: cleanArguments } } : record;
            addPending(keyFor(record.id), {
              method: "tools/call",
              toolName: typeof params?.name === "string" ? params.name : undefined,
              payload: { args: cleanArguments },
              started: Date.now(),
              correlationHandle,
              intentContext,
            });
            if (cleanRecord !== record) record = cleanRecord;
          } else if (record.id !== undefined) {
            addPending(keyFor(record.id), { method: typeof record.method === "string" ? record.method : undefined, payload: {}, started: Date.now() });
          }
          if (typeof record.method === "string" && record.method !== "tools/call") {
            client.capture({ event_type: "protocol", direction: "client_to_server", transport: "stdio", mcp_method: record.method, request_id: record.id === undefined ? undefined : String(record.id), session_id: activeSessionId, session_id_source: activeSessionIdSource, client_name: clientName, client_version: clientVersion, started_at: new Date().toISOString(), payload: { params: record.params || {} } });
          }
          value(record, extra);
        };
        // Official transports often bind start() to their concrete instance and
        // read `this.onmessage` directly, so mirror the wrapped callback there.
        Reflect.set(target, property, messageHandler);
        return true;
      }
      return Reflect.set(target, property, value);
    },
  });
}

/** Wrap an existing MCP server without changing its tools. */
export function withTrackMCP<T extends object>(server: T, options: TrackMCPOptions): T & { trackmcp: TrackMCP } {
  const client = new TrackMCPClient(options);
  activeClient = client;
  const target = server as Record<string, unknown>;
  const originalConnect = target.connect;
  if (typeof originalConnect === "function") {
    target.connect = function (this: unknown, transport: object, ...args: unknown[]) {
      return (originalConnect as (...input: unknown[]) => unknown).call(this, wrapTransport(transport, client), ...args);
    };
  }
  for (const method of ["request", "callTool", "call_tool"]) {
    const original = target[method];
    if (typeof original !== "function") continue;
    target[method] = async function (this: unknown, ...args: unknown[]) {
      const details = method === "callTool" || method === "call_tool" ? toolCallDetails(args) : toolCallDetails(args);
      const started = Date.now();
      try {
        const result = await (original as (...input: unknown[]) => unknown).apply(this, args);
        const isError = Boolean(result && typeof result === "object" && (result as Record<string, unknown>).isError);
        const metadata = client.toolMetadata(details.toolName);
        client.capture({
          event_type: "tool_call",
          tool_name: details.toolName,
          context: details.context as string | undefined,
          tool_description: metadata?.description,
          tool_description_hash: metadata?.tool_description_hash,
          schema_hash: metadata?.schema_hash,
          started_at: new Date(started).toISOString(),
          duration_ms: Date.now() - started,
          success: !isError,
          is_error: isError,
          payload: { ...details.payload, result },
        });
        return result;
      } catch (error) {
        client.capture({
          event_type: "tool_call",
          tool_name: details.toolName,
          tool_description: client.toolMetadata(details.toolName)?.description,
          tool_description_hash: client.toolMetadata(details.toolName)?.tool_description_hash,
          schema_hash: client.toolMetadata(details.toolName)?.schema_hash,
          context: details.context as string | undefined,
          started_at: new Date(started).toISOString(),
          duration_ms: Date.now() - started,
          success: false,
          is_error: true,
          payload: { ...details.payload, error: error instanceof Error ? error.message : String(error) },
        });
        throw error;
      }
    };
  }
  Object.defineProperty(target, "trackmcp", { value: { capture: client.capture.bind(client), track: client.track.bind(client), workflow: client.workflow.bind(client), reportMissing: client.reportMissing.bind(client), trackmcp_report_missing: client.reportMissing.bind(client), flush: client.flush.bind(client), getDiagnostics: client.getDiagnostics.bind(client) } });
  return target as T & { trackmcp: TrackMCP };
}

export const track = (name: string, payload?: Record<string, unknown>): void => {
  activeClient?.track(name, payload);
};

export const trackmcp_report_missing = (capability: string, context?: string): void => {
  activeClient?.reportMissing(capability, context);
};

export type TrackMCP = { capture(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version"> & { schema_version?: string }): void; track(name: string, payload?: Record<string, unknown>): void; workflow(name: string, status: "started" | "completed" | "failed", payload?: Record<string, unknown>): void; reportMissing(capability: string, context?: string): void; trackmcp_report_missing(capability: string, context?: string): void; flush(): Promise<void>; getDiagnostics(): TrackMCPDiagnostics };

export {
  DEFAULT_MAX_BATCH_SIZE,
  DEFAULT_MAX_PAYLOAD_BYTES,
  DEFAULT_MAX_PAYLOAD_DEPTH,
  DEFAULT_MAX_PAYLOAD_KEYS,
  DEFAULT_MAX_QUEUE_BYTES,
  DEFAULT_MAX_QUEUE_EVENTS,
  DEFAULT_MAX_STRING_LENGTH,
} from "./privacy.js";
