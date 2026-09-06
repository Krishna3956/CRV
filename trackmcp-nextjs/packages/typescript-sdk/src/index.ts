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
  task_id?: string;
  workflow_id?: string;
  deployment_id?: string;
  server_version?: string;
  sdk_version?: string;
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

class TrackMCPClient {
  private readonly options: Required<Pick<TrackMCPOptions, "service" | "environment" | "endpoint" | "sampleRate" | "redact" | "redactKeys" | "payloadMode" | "maxPayloadBytes" | "maxPayloadDepth" | "maxPayloadKeys" | "maxStringLength" | "flushIntervalMs" | "maxBatchSize" | "maxQueueEvents" | "maxQueueBytes" | "disabled">> & Pick<TrackMCPOptions, "apiKey" | "server_id" | "server_version" | "sdk_version" | "deployment_id" | "redactEvent">;
  private queue: TrackMCPEvent[] = [];
  private queueBytes = 0;
  private readonly diagnosticCounts = { droppedEvents: 0, hookErrors: 0, privacyErrors: 0 };
  private readonly toolCatalog = new Map<string, CatalogTool>();
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
    };
    if (!this.options.disabled) {
      this.timer = setInterval(() => void this.flush(), this.options.flushIntervalMs);
      this.timer.unref?.();
    }
  }

  capture(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version"> & { schema_version?: string }): void {
    if (this.options.disabled || Math.random() > this.options.sampleRate) return;
    try {
      let prepared = this.prepareEvent({
        ...event,
        schema_version: TRACKMCP_SCHEMA_VERSION,
        event_id: randomUUID(),
        service: this.options.service,
        environment: this.options.environment,
        session_id_source: event.session_id_source || (event.session_id ? "external" : "missing"),
        server_id: this.options.server_id,
        server_version: this.options.server_version,
        sdk_version: this.options.sdk_version,
        deployment_id: this.options.deployment_id,
      });
      if (this.options.redactEvent) {
        try {
          const hooked = this.options.redactEvent(prepared);
          if (!hooked) {
            this.diagnosticCounts.droppedEvents += 1;
            return;
          }
          prepared = this.prepareEvent(hooked);
        } catch {
          this.diagnosticCounts.hookErrors += 1;
          this.diagnosticCounts.droppedEvents += 1;
          return;
        }
      }
      this.enqueue(prepared);
    } catch {
      this.diagnosticCounts.privacyErrors += 1;
      this.diagnosticCounts.droppedEvents += 1;
      return;
    }
    if (this.queue.length >= this.options.maxBatchSize) void this.flush();
  }

  private prepareEvent(event: TrackMCPEvent): TrackMCPEvent {
    const prepared = { ...event, payload_policy: this.options.payloadMode };
    if (this.options.payloadMode === "metadata") {
      delete prepared.payload;
      prepared.payload_size_bytes = 0;
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

  private enqueue(event: TrackMCPEvent): void {
    const eventBytes = payloadByteLength(event);
    if (!eventBytes || eventBytes > this.options.maxQueueBytes) {
      this.diagnosticCounts.droppedEvents += 1;
      return;
    }
    this.queue.push(event);
    this.queueBytes += eventBytes;
    while (this.queue.length > this.options.maxQueueEvents || this.queueBytes > this.options.maxQueueBytes) {
      const dropped = this.queue.shift();
      if (!dropped) break;
      this.queueBytes = Math.max(0, this.queueBytes - payloadByteLength(dropped));
      this.diagnosticCounts.droppedEvents += 1;
    }
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

function toolCallDetails(args: unknown[]): { toolName?: string; payload: Record<string, unknown> } {
  const first = args[0];
  if (!first || typeof first !== "object") return { payload: { args } };
  const request = first as Record<string, unknown>;
  const params = request.params && typeof request.params === "object" ? request.params as Record<string, unknown> : request;
  return {
    toolName: typeof params.name === "string" ? params.name : undefined,
    payload: { args: params.arguments ?? params.args ?? {} },
  };
}

function wrapTransport(transport: object, client: TrackMCPClient): object {
  const pending = new Map<string, { method?: string; toolName?: string; payload: Record<string, unknown>; started: number }>();
  const transportSessionId = randomUUID();
  let activeSessionId: string = transportSessionId;
  let activeSessionIdSource: "protocol" | "transport_generated" = "transport_generated";
  let clientName: string | undefined;
  let clientVersion: string | undefined;
  let messageHandler: ((message: unknown, extra?: unknown) => void) | undefined;
  const keyFor = (id: unknown) => `${typeof id}:${String(id)}`;
  return new Proxy(transport, {
    get(target, property, receiver) {
      if (property === "send") {
        return async (message: Record<string, unknown>, options?: unknown) => {
          const id = message.id;
          if (id !== undefined && pending.has(keyFor(id))) {
            const call = pending.get(keyFor(id))!;
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
              client.capture({ event_type: "tool_call", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), tool_name: call.toolName, tool_description: metadata?.description, tool_description_hash: metadata?.tool_description_hash, schema_hash: metadata?.schema_hash, client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : result?.isError ? "tool_execution_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { ...call.payload, result: message.error || result } });
            } else if (call.method === "initialize") {
              client.capture({ event_type: "session", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), protocol_version: typeof result?.protocolVersion === "string" ? result.protocolVersion : undefined, client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { result: message.error || result } });
            } else if (["tools/list", "resources/list", "resources/templates/list", "prompts/list"].includes(call.method || "") && !failed) {
              const catalogType = call.method?.replace("/list", "") || "catalog";
              const tools = client.recordCatalog(result);
              client.capture({ event_type: "catalog", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: true, is_error: false, payload: { name: `${catalogType}_discovered`, tools, result } });
            }
          }
          const send = Reflect.get(target, property) as (message: unknown, options?: unknown) => Promise<void>;
          return send.call(target, message, options);
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
          const record = message as Record<string, unknown>;
          if (record.method === "initialize") {
            const params = record.params as Record<string, unknown> | undefined;
            const info = params?.clientInfo as Record<string, unknown> | undefined;
            if (typeof info?.name === "string") clientName = info.name;
            if (typeof info?.version === "string") clientVersion = info.version;
          }
          if (record.method === "tools/call" && record.id !== undefined) {
            const params = record.params as Record<string, unknown> | undefined;
            pending.set(keyFor(record.id), {
              method: "tools/call",
              toolName: typeof params?.name === "string" ? params.name : undefined,
              payload: { args: params?.arguments ?? {} },
              started: Date.now(),
            });
          } else if (record.id !== undefined) {
            pending.set(keyFor(record.id), { method: typeof record.method === "string" ? record.method : undefined, payload: {}, started: Date.now() });
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
  Object.defineProperty(target, "trackmcp", { value: { track: client.track.bind(client), workflow: client.workflow.bind(client), flush: client.flush.bind(client), getDiagnostics: client.getDiagnostics.bind(client) } });
  return target as T & { trackmcp: TrackMCP };
}

export const track = (name: string, payload?: Record<string, unknown>): void => {
  activeClient?.track(name, payload);
};

export type TrackMCP = { track(name: string, payload?: Record<string, unknown>): void; workflow(name: string, status: "started" | "completed" | "failed", payload?: Record<string, unknown>): void; flush(): Promise<void>; getDiagnostics(): TrackMCPDiagnostics };

export {
  DEFAULT_MAX_BATCH_SIZE,
  DEFAULT_MAX_PAYLOAD_BYTES,
  DEFAULT_MAX_PAYLOAD_DEPTH,
  DEFAULT_MAX_PAYLOAD_KEYS,
  DEFAULT_MAX_QUEUE_BYTES,
  DEFAULT_MAX_QUEUE_EVENTS,
  DEFAULT_MAX_STRING_LENGTH,
} from "./privacy.js";
