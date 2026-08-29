import { randomUUID } from "node:crypto";

export type TrackMCPEventType = "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";

export type TrackMCPEvent = {
  event_id: string;
  event_type: TrackMCPEventType;
  service: string;
  environment: string;
  direction?: "client_to_server" | "server_to_client";
  transport?: "stdio" | "streamable_http" | "sse" | "custom";
  protocol_version?: string;
  mcp_method?: string;
  request_id?: string;
  session_id?: string;
  task_id?: string;
  workflow_id?: string;
  deployment_id?: string;
  server_version?: string;
  sdk_version?: string;
  client_name?: string;
  tool_name?: string;
  started_at: string;
  duration_ms?: number;
  success?: boolean;
  is_error?: boolean;
  error_class?: string;
  error_code?: number;
  retry_number?: number;
  schema_hash?: string;
  payload_size_bytes?: number;
  payload?: Record<string, unknown>;
};

export type TrackMCPOptions = {
  apiKey: string;
  service?: string;
  environment?: string;
  endpoint?: string;
  sampleRate?: number;
  redact?: string[];
  disabled?: boolean;
  server_version?: string;
  sdk_version?: string;
  deployment_id?: string;
  flushIntervalMs?: number;
  maxBatchSize?: number;
};

const DEFAULT_ENDPOINT = "https://trackmcp.com/api/v1/ingest";
let activeClient: TrackMCPClient | undefined;

function redactValue(value: unknown, paths: string[]): unknown {
  if (!paths.length || value === null || typeof value !== "object") return value;
  const copy = structuredClone(value);
  for (const path of paths) {
    const parts = path.split(".");
    let cursor: Record<string, unknown> | unknown[] = copy as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (cursor && typeof cursor === "object" && parts[i] in cursor) {
        cursor = (cursor as Record<string, unknown>)[parts[i]] as Record<string, unknown>;
      } else {
        cursor = {};
        break;
      }
    }
    if (cursor && typeof cursor === "object") {
      const last = parts[parts.length - 1];
      if (last in cursor) (cursor as Record<string, unknown>)[last] = "[redacted]";
    }
  }
  return copy;
}

class TrackMCPClient {
  private readonly options: Required<Pick<TrackMCPOptions, "service" | "environment" | "endpoint" | "sampleRate" | "redact" | "flushIntervalMs" | "maxBatchSize" | "disabled">> & Pick<TrackMCPOptions, "apiKey" | "server_version" | "sdk_version" | "deployment_id">;
  private queue: TrackMCPEvent[] = [];
  private timer?: NodeJS.Timeout;
  private flushing?: Promise<void>;

  constructor(options: TrackMCPOptions) {
    if (!options.apiKey) throw new Error("TrackMCP apiKey is required");
    this.options = {
      apiKey: options.apiKey,
      server_version: options.server_version,
      sdk_version: options.sdk_version,
      deployment_id: options.deployment_id,
      service: options.service || "mcp-server",
      environment: options.environment || process.env.NODE_ENV || "production",
      endpoint: options.endpoint || DEFAULT_ENDPOINT,
      sampleRate: Math.min(1, Math.max(0, options.sampleRate ?? 1)),
      redact: options.redact || [],
      flushIntervalMs: options.flushIntervalMs ?? 5000,
      maxBatchSize: options.maxBatchSize ?? 50,
      disabled: options.disabled ?? false,
    };
    if (!this.options.disabled) {
      this.timer = setInterval(() => void this.flush(), this.options.flushIntervalMs);
      this.timer.unref?.();
    }
  }

  capture(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment">): void {
    if (this.options.disabled || Math.random() > this.options.sampleRate) return;
    this.queue.push({
      ...event,
      event_id: randomUUID(),
      service: this.options.service,
      environment: this.options.environment,
      server_version: this.options.server_version,
      sdk_version: this.options.sdk_version,
      deployment_id: this.options.deployment_id,
      payload: redactValue(event.payload, this.options.redact) as Record<string, unknown> | undefined,
      payload_size_bytes: event.payload ? JSON.stringify(event.payload).length : undefined,
    });
    if (this.queue.length >= this.options.maxBatchSize) void this.flush();
  }

  track(name: string, payload: Record<string, unknown> = {}): void {
    this.capture({
      event_type: "custom",
      started_at: new Date().toISOString(),
      payload: { name, ...payload },
    });
  }

  workflow(name: string, status: "started" | "completed" | "failed", payload: Record<string, unknown> = {}): void {
    this.track("workflow", { workflow_name: name, status, ...payload });
  }

  async flush(): Promise<void> {
    if (this.options.disabled || this.flushing || this.queue.length === 0) return this.flushing || Promise.resolve();
    const events = this.queue.splice(0, this.options.maxBatchSize);
    this.flushing = fetch(this.options.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.options.apiKey}` },
      body: JSON.stringify({ events }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`TrackMCP ingest returned ${response.status}`);
      })
      .catch(() => {
        // Analytics must never affect the user's MCP server. Requeue for the next flush.
        this.queue.unshift(...events);
      })
      .finally(() => {
        this.flushing = undefined;
        if (this.queue.length >= this.options.maxBatchSize) void this.flush();
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
  let clientName: string | undefined;
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
            const sessionId = typeof Reflect.get(target, "sessionId") === "string" ? Reflect.get(target, "sessionId") as string : transportSessionId;
            if (call.method === "tools/call") {
              client.capture({ event_type: "tool_call", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), tool_name: call.toolName, client_name: clientName, session_id: sessionId, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : result?.isError ? "tool_execution_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { ...call.payload, result: message.error || result } });
            } else if (call.method === "initialize") {
              const negotiatedSession = typeof result?.sessionId === "string" ? result.sessionId : transportSessionId;
              client.capture({ event_type: "session", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), protocol_version: typeof result?.protocolVersion === "string" ? result.protocolVersion : undefined, client_name: clientName, session_id: negotiatedSession, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { result: message.error || result } });
            } else if (["tools/list", "resources/list", "resources/templates/list", "prompts/list"].includes(call.method || "") && !failed) {
              const catalogType = call.method?.replace("/list", "") || "catalog";
              client.capture({ event_type: "catalog", direction: "server_to_client", transport: "stdio", mcp_method: call.method, request_id: String(id), client_name: clientName, session_id: sessionId, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: true, is_error: false, payload: { name: `${catalogType}_discovered`, result } });
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
            client.capture({ event_type: "protocol", direction: "client_to_server", transport: "stdio", mcp_method: record.method, request_id: record.id === undefined ? undefined : String(record.id), session_id: transportSessionId, client_name: clientName, started_at: new Date().toISOString(), payload: { params: record.params || {} } });
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
        client.capture({
          event_type: "tool_call",
          tool_name: details.toolName,
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
  Object.defineProperty(target, "trackmcp", { value: { track: client.track.bind(client), workflow: client.workflow.bind(client), flush: client.flush.bind(client) } });
  return target as T & { trackmcp: TrackMCP };
}

export const track = (name: string, payload?: Record<string, unknown>): void => {
  activeClient?.track(name, payload);
};

export type TrackMCP = { track(name: string, payload?: Record<string, unknown>): void; workflow(name: string, status: "started" | "completed" | "failed", payload?: Record<string, unknown>): void; flush(): Promise<void> };
