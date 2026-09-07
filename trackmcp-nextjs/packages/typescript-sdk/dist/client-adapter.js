import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TrackMCPClient, } from "./index.js";
const MAX_PENDING_CALLS = 1000;
const PENDING_CALL_TTL_MS = 30_000;
const REPEAT_WINDOW_MS = 5 * 60 * 1000;
const MAX_CLIENT_STRING_LENGTH = 2048;
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function requestId(value) {
    const candidate = typeof value === "string" || (typeof value === "number" && Number.isFinite(value)) ? String(value) : undefined;
    return candidate && new TextEncoder().encode(candidate).byteLength <= MAX_CLIENT_STRING_LENGTH ? candidate : undefined;
}
function boundedString(value) {
    return typeof value === "string" && value.trim().length > 0 && new TextEncoder().encode(value).byteLength <= MAX_CLIENT_STRING_LENGTH ? value : undefined;
}
function nodeOnlyGuard() {
    const nodeProcess = typeof process !== "undefined" ? process : undefined;
    const edgeRuntime = typeof globalThis === "object" && "EdgeRuntime" in globalThis;
    if (!nodeProcess?.versions?.node || edgeRuntime) {
        throw new Error("TrackMCPClientAdapter requires the Node.js runtime and is not available in browsers or Edge.");
    }
}
export class TrackMCPClientAdapter {
    client;
    options;
    pending = new Map();
    pendingOrder = [];
    completedIds = new Set();
    seenRequestIds = new Set();
    lastIssued = new Map();
    wrapped = new WeakMap();
    transportDiagnostics = { malformedMessages: 0, unmatchedMessages: 0, duplicateMessages: 0, expiredMessages: 0 };
    pendingSweepTimer;
    lifecycleStarted = false;
    lifecycleEnded = false;
    lifecycleGeneration = 0;
    lastResultRequestId;
    lastResultAt = 0;
    clientName;
    clientVersion;
    protocolSessionId;
    constructor(options) {
        nodeOnlyGuard();
        if (typeof options.apiKey !== "string" || options.apiKey.trim() === "")
            throw new Error("TrackMCP apiKey is required");
        if (!boundedString(options.service))
            throw new Error("TrackMCP service is required and must be bounded");
        if (options.transport !== "stdio" && options.transport !== "streamable_http")
            throw new Error("Unsupported TrackMCP client transport");
        if (options.session && (!boundedString(options.session.id) || !["protocol", "transport_generated", "external"].includes(options.session.source)))
            throw new Error("Session identity must be bounded and include explicit provenance");
        if (options.correlation?.mode === "external" && typeof options.correlation.resolve !== "function")
            throw new Error("External correlation requires a resolver");
        this.options = options;
        const correlation = options.correlation;
        this.client = new TrackMCPClient({
            ...options,
            payloadMode: "metadata",
            correlation: correlation ? { mode: "external", resolve: correlation.resolve } : undefined,
        });
        this.pendingSweepTimer = setInterval(() => this.sweepPending(), Math.min(PENDING_CALL_TTL_MS, 5000));
        this.pendingSweepTimer.unref?.();
    }
    wrapTransport(transport) {
        if (!transport || typeof transport !== "object")
            throw new TypeError("A transport object is required");
        const existing = this.wrapped.get(transport);
        if (existing)
            return existing;
        const supported = this.options.transport === "stdio"
            ? transport instanceof StdioClientTransport
            : transport instanceof StreamableHTTPClientTransport;
        if (!supported) {
            throw new TypeError("Transport must be an official StdioClientTransport or StreamableHTTPClientTransport instance");
        }
        let onmessage;
        let onerror;
        let onclose;
        // The proxy callbacks must retain the adapter instance, not the proxy handler.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const adapter = this;
        const wrapped = new Proxy(transport, {
            get(target, property, receiver) {
                if (property === "start") {
                    return (...args) => {
                        const start = Reflect.get(target, property, target);
                        return Promise.resolve(start.apply(target, args)).then((result) => {
                            if (!adapter.lifecycleStarted || adapter.lifecycleEnded) {
                                adapter.lifecycleGeneration += 1;
                                adapter.lifecycleStarted = true;
                                adapter.lifecycleEnded = false;
                                adapter.pending.clear();
                                adapter.pendingOrder.length = 0;
                                adapter.completedIds.clear();
                                adapter.seenRequestIds.clear();
                                adapter.protocolSessionId = undefined;
                                adapter.emitSessionBoundary("session_started");
                            }
                            return result;
                        });
                    };
                }
                if (property === "close") {
                    return (...args) => {
                        const close = Reflect.get(target, property, target);
                        return Promise.resolve(close.apply(target, args)).then((result) => {
                            adapter.endLifecycle();
                            return result;
                        });
                    };
                }
                if (property === "send") {
                    return (message, ...args) => {
                        adapter.observeOutgoing(message, target);
                        const send = Reflect.get(target, property, target);
                        return send.call(target, message, ...args);
                    };
                }
                if (property === "onmessage")
                    return onmessage;
                if (property === "onerror")
                    return onerror;
                if (property === "onclose")
                    return onclose;
                const value = Reflect.get(target, property, receiver);
                return typeof value === "function" ? value.bind(target) : value;
            },
            set(target, property, value, receiver) {
                if (property === "onmessage") {
                    onmessage = value;
                    return Reflect.set(target, property, (message, extra) => {
                        adapter.observeIncoming(message);
                        onmessage?.(message, extra);
                    }, target);
                }
                if (property === "onerror") {
                    onerror = value;
                    return Reflect.set(target, property, ((error) => onerror?.(error)), target);
                }
                if (property === "onclose") {
                    onclose = value;
                    return Reflect.set(target, property, (() => {
                        adapter.endLifecycle();
                        onclose?.();
                    }), target);
                }
                return Reflect.set(target, property, value, receiver);
            },
        });
        this.wrapped.set(transport, wrapped);
        return wrapped;
    }
    async flush() {
        await this.client.flush();
    }
    getDiagnostics() {
        return { ...this.client.getDiagnostics(), ...this.transportDiagnostics, lifecycle_generation: this.lifecycleGeneration, pending_request_count: this.pendingOrder.length, repeat_group_count: this.lastIssued.size };
    }
    observeOutgoing(message, transport) {
        this.sweepPending();
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
                if (id !== undefined)
                    this.addPending({ idKey: this.keyFor(item.id), requestId: id, started: Date.now(), correlation: { source: "missing" } });
                continue;
            }
            const id = requestId(item.id);
            const params = isRecord(item.params) ? item.params : undefined;
            const toolName = boundedString(params?.name);
            if (id === undefined || !toolName) {
                this.transportDiagnostics.malformedMessages += 1;
                continue;
            }
            const started = Date.now();
            const idKey = this.keyFor(item.id);
            const session = this.sessionFields(transport);
            const correlation = this.client.resolveCorrelation({ event_type: "tool_call", mcp_method: "tools/call", tool_name: toolName, request_id: id, session_id: session.session_id, transport: this.options.transport });
            const reused = this.seenRequestIds.has(idKey);
            this.seenRequestIds.add(idKey);
            while (this.seenRequestIds.size > MAX_PENDING_CALLS)
                this.seenRequestIds.delete(this.seenRequestIds.values().next().value);
            const pending = { idKey, requestId: id, toolName, started, correlation, ambiguous: reused || (this.pending.get(idKey)?.length || 0) > 0 };
            this.addPending(pending);
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
    observeIncoming(message) {
        this.sweepPending();
        const messages = Array.isArray(message) ? message : [message];
        for (const item of messages) {
            if (!isRecord(item)) {
                this.transportDiagnostics.malformedMessages += 1;
                continue;
            }
            if (!Object.prototype.hasOwnProperty.call(item, "result") && !Object.prototype.hasOwnProperty.call(item, "error"))
                continue;
            const id = requestId(item.id);
            if (id === undefined) {
                this.transportDiagnostics.malformedMessages += 1;
                continue;
            }
            const key = this.keyFor(item.id);
            const candidates = this.pending.get(key) || [];
            if (candidates.length !== 1 || candidates[0].ambiguous) {
                this.transportDiagnostics.unmatchedMessages += 1;
                if (candidates.length > 1 || candidates[0]?.ambiguous || this.completedIds.has(key))
                    this.transportDiagnostics.duplicateMessages += 1;
                for (const candidate of candidates) {
                    const pendingIndex = this.pendingOrder.indexOf(candidate);
                    if (pendingIndex >= 0)
                        this.pendingOrder.splice(pendingIndex, 1);
                }
                this.pending.delete(key);
                this.markCompleted(key);
                continue;
            }
            const pending = candidates[0];
            this.pending.delete(key);
            this.markCompleted(key);
            const index = this.pendingOrder.indexOf(pending);
            if (index >= 0)
                this.pendingOrder.splice(index, 1);
            const result = isRecord(item.result) ? item.result : undefined;
            const failed = Boolean(item.error) || result?.isError === true;
            if (typeof result?.protocolVersion === "string" && boundedString(result.sessionId)) {
                this.protocolSessionId = boundedString(result.sessionId);
            }
            if (!pending.toolName)
                continue;
            const session = this.sessionFields();
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
            }, pending.correlation);
        }
    }
    addPending(call) {
        const candidates = this.pending.get(call.idKey) || [];
        candidates.push(call);
        this.pending.set(call.idKey, candidates);
        this.pendingOrder.push(call);
        while (this.pendingOrder.length > MAX_PENDING_CALLS) {
            const oldest = this.pendingOrder.shift();
            if (!oldest)
                break;
            const list = this.pending.get(oldest.idKey) || [];
            const next = list.filter((entry) => entry !== oldest);
            if (next.length)
                this.pending.set(oldest.idKey, next);
            else
                this.pending.delete(oldest.idKey);
            this.markCompleted(oldest.idKey);
        }
    }
    sweepPending(now = Date.now()) {
        for (const call of [...this.pendingOrder]) {
            if (now - call.started <= PENDING_CALL_TTL_MS)
                continue;
            this.removePending(call);
            this.markCompleted(call.idKey);
            this.transportDiagnostics.expiredMessages += 1;
        }
    }
    removePending(call) {
        const list = this.pending.get(call.idKey) || [];
        const next = list.filter((entry) => entry !== call);
        if (next.length)
            this.pending.set(call.idKey, next);
        else
            this.pending.delete(call.idKey);
        const index = this.pendingOrder.indexOf(call);
        if (index >= 0)
            this.pendingOrder.splice(index, 1);
    }
    repeatFor(toolName, session, at) {
        if (!toolName)
            return undefined;
        for (const [existingKey, existingAt] of this.lastIssued) {
            if (at - existingAt > REPEAT_WINDOW_MS)
                this.lastIssued.delete(existingKey);
        }
        const groups = [
            ["session_id", session.session_id],
            ["correlation_handle", session.correlation_handle],
        ];
        let repeatSource;
        for (const [source, value] of groups) {
            if (!value)
                continue;
            const key = `${source}:${value}:${toolName}`;
            const previous = this.lastIssued.get(key);
            this.lastIssued.set(key, at);
            if (previous !== undefined && at - previous <= REPEAT_WINDOW_MS)
                repeatSource ||= source;
        }
        while (this.lastIssued.size > MAX_PENDING_CALLS) {
            let oldestKey;
            let oldestAt = Number.POSITIVE_INFINITY;
            for (const [key, value] of this.lastIssued)
                if (value < oldestAt) {
                    oldestKey = key;
                    oldestAt = value;
                }
            if (!oldestKey)
                break;
            this.lastIssued.delete(oldestKey);
        }
        return repeatSource;
    }
    markCompleted(key) {
        this.completedIds.add(key);
        while (this.completedIds.size > MAX_PENDING_CALLS)
            this.completedIds.delete(this.completedIds.values().next().value);
    }
    emitSessionBoundary(kind) {
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
    endLifecycle() {
        if (!this.lifecycleStarted || this.lifecycleEnded)
            return;
        this.lifecycleEnded = true;
        this.emitSessionBoundary("session_ended");
    }
    sessionFields(transport) {
        if (this.options.session?.id && this.options.session.source)
            return { session_id: this.options.session.id, session_id_source: this.options.session.source };
        if (this.protocolSessionId)
            return { session_id: this.protocolSessionId, session_id_source: "protocol" };
        const id = transport ? boundedString(transport.sessionId) : undefined;
        return id ? { session_id: id, session_id_source: "transport_generated" } : { session_id_source: "missing" };
    }
    emit(event, correlation) {
        this.client.captureClient(event, this.options.onEvent, correlation);
    }
    keyFor(value) {
        return `${typeof value}:${String(value)}`;
    }
}
