import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  TrackMCPClient,
  type TrackMCPEvent,
  type TrackMCPEventHook,
  type TrackMCPOptions,
  type TrackMCPCorrelationOptions,
  type TrackMCPCorrelationHandleSource,
} from "./index.js";

export type TrackMCPClientTransportLabel = "stdio" | "streamable_http";
export type TrackMCPClientSessionSource = "protocol" | "transport_generated" | "external";
export type TrackMCPClientSession = { id: string; source: TrackMCPClientSessionSource };
export type TrackMCPClientCorrelation = Pick<TrackMCPCorrelationOptions, "resolve"> & { mode: "external" };

export type TrackMCPClientAdapterOptions = Omit<
  TrackMCPOptions,
  "payloadMode" | "redact" | "redactKeys" | "redactEvent" | "intentFallback" | "correlation"
> & {
  service: string;
  transport: TrackMCPClientTransportLabel;
  session?: TrackMCPClientSession;
  correlation?: TrackMCPClientCorrelation;
  onEvent?: TrackMCPEventHook;
};

type Message = Record<string, unknown>;
type PendingCall = { idKey: string; requestId?: string; toolName?: string; started: number };

const MAX_PENDING_CALLS = 1000;
const REPEAT_WINDOW_MS = 5 * 60 * 1000;
const MAX_CLIENT_STRING_LENGTH = 2048;

function isRecord(value: unknown): value is Message {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requestId(value: unknown): string | undefined {
  const candidate = typeof value === "string" || (typeof value === "number" && Number.isFinite(value)) ? String(value) : undefined;
  return candidate && new TextEncoder().encode(candidate).byteLength <= MAX_CLIENT_STRING_LENGTH ? candidate : undefined;
}

function boundedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 && new TextEncoder().encode(value).byteLength <= MAX_CLIENT_STRING_LENGTH ? value : undefined;
}

function nodeOnlyGuard(): void {
  const nodeProcess = typeof process !== "undefined" ? process : undefined;
  const edgeRuntime = typeof globalThis === "object" && "EdgeRuntime" in globalThis;
  if (!nodeProcess?.versions?.node || edgeRuntime) {
    throw new Error("TrackMCPClientAdapter requires the Node.js runtime and is not available in browsers or Edge.");
  }
}

export class TrackMCPClientAdapter {
  private readonly client: TrackMCPClient;
  private readonly options: TrackMCPClientAdapterOptions;
  private readonly pending = new Map<string, PendingCall[]>();
  private readonly pendingOrder: PendingCall[] = [];
  private readonly completedIds = new Set<string>();
  private readonly lastIssued = new Map<string, number>();
  private readonly wrapped = new WeakMap<object, Transport>();
  private readonly transportDiagnostics = { malformedMessages: 0, unmatchedMessages: 0, duplicateMessages: 0 };
  private lifecycleStarted = false;
  private lifecycleEnded = false;
  private lifecycleGeneration = 0;
  private lastResultRequestId: string | undefined;
  private lastResultAt = 0;
  private clientName: string | undefined;
  private clientVersion: string | undefined;
  private protocolSessionId: string | undefined;

  constructor(options: TrackMCPClientAdapterOptions) {
    nodeOnlyGuard();
    if (typeof options.apiKey !== "string" || options.apiKey.trim() === "") throw new Error("TrackMCP apiKey is required");
    if (!boundedString(options.service)) throw new Error("TrackMCP service is required and must be bounded");
    if (options.transport !== "stdio" && options.transport !== "streamable_http") throw new Error("Unsupported TrackMCP client transport");
    if (options.session && (!boundedString(options.session.id) || !["protocol", "transport_generated", "external"].includes(options.session.source))) throw new Error("Session identity must be bounded and include explicit provenance");
    if (options.correlation?.mode === "external" && typeof options.correlation.resolve !== "function") throw new Error("External correlation requires a resolver");
    this.options = options;
    const correlation = options.correlation;
    this.client = new TrackMCPClient({
      ...options,
      payloadMode: "metadata",
      correlation: correlation ? { mode: "external", resolve: correlation.resolve } : undefined,
    } as TrackMCPOptions);
  }

  wrapTransport<T extends Transport>(transport: T): T {
    if (!transport || typeof transport !== "object") throw new TypeError("A transport object is required");
    const existing = this.wrapped.get(transport as object);
    if (existing) return existing as T;
    if (typeof transport.start !== "function" || typeof transport.send !== "function" || typeof transport.close !== "function") {
      throw new TypeError("Transport must implement start, send, and close");
    }

    let onmessage: Transport["onmessage"];
    let onerror: Transport["onerror"];
    let onclose: Transport["onclose"];
    // The proxy callbacks must retain the adapter instance, not the proxy handler.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const adapter = this;
    const wrapped = new Proxy(transport as object, {
      get(target, property, receiver) {
        if (property === "start") {
          return (...args: unknown[]) => {
            const start = Reflect.get(target, property, target) as (...input: unknown[]) => Promise<void>;
            return Promise.resolve(start.apply(target, args)).then((result) => {
              if (!adapter.lifecycleStarted || adapter.lifecycleEnded) {
                adapter.lifecycleGeneration += 1;
                adapter.lifecycleStarted = true;
                adapter.lifecycleEnded = false;
                adapter.pending.clear();
                adapter.pendingOrder.length = 0;
                adapter.completedIds.clear();
                adapter.protocolSessionId = undefined;
                adapter.emitSessionBoundary("session_started");
              }
              return result;
            });
          };
        }
        if (property === "close") {
          return (...args: unknown[]) => {
            const close = Reflect.get(target, property, target) as (...input: unknown[]) => Promise<void>;
            return Promise.resolve(close.apply(target, args)).then((result) => {
              adapter.endLifecycle();
              return result;
            });
          };
        }
        if (property === "send") {
          return (message: unknown, ...args: unknown[]) => {
            adapter.observeOutgoing(message, target as Transport);
            const send = Reflect.get(target, property, target) as (...input: unknown[]) => Promise<void>;
            return send.call(target, message, ...args);
          };
        }
        if (property === "onmessage") return onmessage;
        if (property === "onerror") return onerror;
        if (property === "onclose") return onclose;
        const value = Reflect.get(target, property, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(target, property, value, receiver) {
        if (property === "onmessage") {
          onmessage = value as Transport["onmessage"];
          return Reflect.set(target, property, (message: unknown, extra?: unknown) => {
            adapter.observeIncoming(message);
            onmessage?.(message as never, extra as never);
          }, target);
        }
        if (property === "onerror") {
          onerror = value as Transport["onerror"];
          return Reflect.set(target, property, ((error: Error) => onerror?.(error)) as Transport["onerror"], target);
        }
        if (property === "onclose") {
          onclose = value as Transport["onclose"];
          return Reflect.set(target, property, (() => {
            adapter.endLifecycle();
            onclose?.();
          }) as Transport["onclose"], target);
        }
        return Reflect.set(target, property, value, receiver);
      },
    }) as T;
    this.wrapped.set(transport as object, wrapped);
    return wrapped;
  }

  async flush(): Promise<void> {
    await this.client.flush();
  }

  getDiagnostics() {
    return { ...this.client.getDiagnostics(), ...this.transportDiagnostics, lifecycle_generation: this.lifecycleGeneration };
  }

  private observeOutgoing(message: unknown, transport: Transport): void {
    const messages = Array.isArray(message) ? message : [message];
    for (const item of messages) {
      if (!isRecord(item)) {
        this.transportDiagnostics.malformedMessages += 1;
        continue;
      }
      if (item.method === "initialize") {
        const params = isRecord(item.params) ? item.params : undefined;
        const clientInfo = params && isRecord(params.clientInfo) ? params.clientInfo : undefined;
        this.clientName = boundedString(clientInfo?.name);
        this.clientVersion = boundedString(clientInfo?.version);
      }
      if (item.method !== "tools/call") {
        const id = requestId(item.id);
        if (id !== undefined) this.addPending({ idKey: this.keyFor(item.id), requestId: id, started: Date.now() });
        continue;
      }
      const id = requestId(item.id);
      const params = isRecord(item.params) ? item.params : undefined;
      const toolName = typeof params?.name === "string" ? params.name : undefined;
      if (id === undefined || !toolName) {
        this.transportDiagnostics.malformedMessages += 1;
        continue;
      }
      const started = Date.now();
      const pending: PendingCall = { idKey: this.keyFor(item.id), requestId: id, toolName, started };
      this.addPending(pending);
      const session = this.sessionFields(transport);
      const correlation = this.client.resolveCorrelation({ event_type: "tool_call", mcp_method: "tools/call", tool_name: toolName, request_id: id, session_id: session.session_id, transport: this.options.transport });
      const repeat = this.repeatFor(toolName, { ...session, correlation_handle: correlation.handle }, started);
      if (this.lastResultRequestId && this.lastResultAt <= started && started - this.lastResultAt <= REPEAT_WINDOW_MS) {
        this.emit({
          event_type: "custom",
          transport: this.options.transport,
          mcp_method: "tools/call",
          request_id: id,
          tool_name: toolName,
          direction: "client_to_server",
          started_at: new Date(started).toISOString(),
          ...session,
          client_name: this.clientName,
          client_version: this.clientVersion,
          payload: { _trackmcp: { observation_kind: "next_tool_selected", observation_source: "client", next_tool_selection_observed: true, preceding_request_id: this.lastResultRequestId } },
        }, correlation);
      }
      this.emit({
        event_type: "tool_call",
        transport: this.options.transport,
        mcp_method: "tools/call",
        request_id: id,
        tool_name: toolName,
        direction: "client_to_server",
        started_at: new Date(started).toISOString(),
        retry_number: 0,
        ...session,
        client_name: this.clientName,
        client_version: this.clientVersion,
        ...(repeat ? { payload: { _trackmcp: { observation_kind: "tool_call_issued", observation_source: "client", repeat_observed: true, repeat_group_source: repeat } } } : { payload: { _trackmcp: { observation_kind: "tool_call_issued", observation_source: "client" } } }),
      }, correlation);
    }
  }

  private observeIncoming(message: unknown): void {
    const messages = Array.isArray(message) ? message : [message];
    for (const item of messages) {
      if (!isRecord(item)) {
        this.transportDiagnostics.malformedMessages += 1;
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(item, "result") && !Object.prototype.hasOwnProperty.call(item, "error")) continue;
      const id = requestId(item.id);
      if (id === undefined) {
        this.transportDiagnostics.malformedMessages += 1;
        continue;
      }
      const key = this.keyFor(item.id);
      const candidates = this.pending.get(key) || [];
      if (candidates.length !== 1) {
        this.transportDiagnostics.unmatchedMessages += 1;
        if (candidates.length > 1 || this.completedIds.has(key)) this.transportDiagnostics.duplicateMessages += 1;
        continue;
      }
      const pending = candidates[0];
      this.pending.delete(key);
      this.completedIds.add(key);
      if (this.completedIds.size > MAX_PENDING_CALLS) {
        const oldest = this.completedIds.values().next().value;
        if (typeof oldest === "string") this.completedIds.delete(oldest);
      }
      const index = this.pendingOrder.indexOf(pending);
      if (index >= 0) this.pendingOrder.splice(index, 1);
      const result = isRecord(item.result) ? item.result : undefined;
      const failed = Boolean(item.error) || result?.isError === true;
      if (typeof result?.protocolVersion === "string" && boundedString(result.sessionId)) {
        this.protocolSessionId = boundedString(result.sessionId);
      }
      if (!pending.toolName) continue;
      const session = this.sessionFields();
      const correlation = this.client.resolveCorrelation({ event_type: "tool_call", mcp_method: "tools/call", tool_name: pending.toolName, request_id: pending.requestId, session_id: session.session_id, transport: this.options.transport });
      this.lastResultRequestId = pending.requestId;
      this.lastResultAt = Date.now();
      this.emit({
        event_type: "tool_call",
        transport: this.options.transport,
        mcp_method: "tools/call",
        request_id: pending.requestId,
        tool_name: pending.toolName,
        direction: "server_to_client",
        started_at: new Date(pending.started).toISOString(),
        duration_ms: Math.max(0, Date.now() - pending.started),
        success: !failed,
        is_error: failed,
        retry_number: 0,
        ...session,
        client_name: this.clientName,
        client_version: this.clientVersion,
        payload: { _trackmcp: { observation_kind: "result_received", observation_source: "client" } },
      }, correlation);
    }
  }

  private addPending(call: PendingCall): void {
    const candidates = this.pending.get(call.idKey) || [];
    candidates.push(call);
    this.pending.set(call.idKey, candidates);
    this.pendingOrder.push(call);
    while (this.pendingOrder.length > MAX_PENDING_CALLS) {
      const oldest = this.pendingOrder.shift();
      if (!oldest) break;
      const list = this.pending.get(oldest.idKey) || [];
      const next = list.filter((entry) => entry !== oldest);
      if (next.length) this.pending.set(oldest.idKey, next);
      else this.pending.delete(oldest.idKey);
    }
  }

  private repeatFor(toolName: string | undefined, session: ReturnType<TrackMCPClientAdapter["sessionFields"]> & { correlation_handle?: string }, at: number): "session_id" | "correlation_handle" | undefined {
    if (!toolName) return undefined;
    const groups: Array<["session_id" | "correlation_handle", string | undefined]> = [
      ["session_id", session.session_id],
      ["correlation_handle", session.correlation_handle],
    ];
    for (const [source, value] of groups) {
      if (!value) continue;
      const key = `${source}:${value}:${toolName}`;
      const previous = this.lastIssued.get(key);
      this.lastIssued.set(key, at);
      if (previous !== undefined && at - previous <= REPEAT_WINDOW_MS) return source;
    }
    return undefined;
  }

  private emitSessionBoundary(kind: "session_started" | "session_ended"): void {
    this.emit({
      event_type: "session",
      transport: this.options.transport,
      started_at: new Date().toISOString(),
      ...this.sessionFields(),
      client_name: this.clientName,
      client_version: this.clientVersion,
      payload: { _trackmcp: { observation_kind: kind, observation_source: "client" } },
    });
  }

  private endLifecycle(): void {
    if (!this.lifecycleStarted || this.lifecycleEnded) return;
    this.lifecycleEnded = true;
    this.emitSessionBoundary("session_ended");
  }

  private sessionFields(transport?: Transport): { session_id?: string; session_id_source: "protocol" | "transport_generated" | "external" | "missing" } {
    if (this.options.session?.id && this.options.session.source) return { session_id: this.options.session.id, session_id_source: this.options.session.source };
    if (this.protocolSessionId) return { session_id: this.protocolSessionId, session_id_source: "protocol" };
    const id = transport ? boundedString(transport.sessionId) : undefined;
    return id ? { session_id: id, session_id_source: "transport_generated" } : { session_id_source: "missing" };
  }

  private emit(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version" | "observation_source">, correlation?: { handle?: string; source: TrackMCPCorrelationHandleSource }): void {
    this.client.captureClient(event, this.options.onEvent, correlation);
  }

  private keyFor(value: unknown): string {
    return `${typeof value}:${String(value)}`;
  }
}
