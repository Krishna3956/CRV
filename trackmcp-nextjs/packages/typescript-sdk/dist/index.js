import { createHash, randomUUID } from "node:crypto";
import { DEFAULT_MAX_BATCH_SIZE, DEFAULT_MAX_PAYLOAD_BYTES, DEFAULT_MAX_PAYLOAD_DEPTH, DEFAULT_MAX_PAYLOAD_KEYS, DEFAULT_MAX_QUEUE_BYTES, DEFAULT_MAX_QUEUE_EVENTS, DEFAULT_MAX_STRING_LENGTH, payloadByteLength, sanitizePayload, } from "./privacy.js";
export const TRACKMCP_SCHEMA_VERSION = "1";
const TRACKMCP_PROTOCOL_SIGNALS = new Set(["progress", "cancelled", "catalog_changed", "resource_changed", "prompt_changed", "subscription_started", "subscription_stopped"]);
const DEFAULT_ENDPOINT = "https://trackmcp.com/api/v1/ingest";
// Keep this URL fixed and bounded so the actionable missing-key diagnostic never
// reflects caller-controlled values or accidentally includes a secret.
export const TRACKMCP_SETUP_URL = "https://app.trackmcp.com/signup?utm_source=npm&utm_medium=sdk&utm_campaign=sdk_setup";
const DIAGNOSTIC_INTERVAL_MS = 60_000;
const ACCOUNT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
let activeClient;
async function responseErrorKind(response) {
    const keyStatus = response.headers.get("x-trackmcp-key-status")?.toLowerCase();
    if (keyStatus === "revoked")
        return "revoked";
    if (keyStatus === "invalid")
        return "invalid_key";
    try {
        const text = await response.clone().text();
        if (text.length <= 4096) {
            const body = JSON.parse(text);
            const marker = [body.code, body.status, body.reason, body.error].find((value) => typeof value === "string")?.toLowerCase();
            if (marker === "revoked" || marker === "key_revoked")
                return "revoked";
            if (marker === "invalid" || marker === "invalid_key" || marker === "invalid_api_key")
                return "invalid_key";
        }
    }
    catch {
        // Response bodies are diagnostic input only and are never logged.
    }
    if (response.status === 400)
        return "invalid_key";
    if (response.status === 401)
        return "unauthorized";
    if (response.status === 403)
        return "forbidden";
    if (response.status === 429)
        return "rate_limited";
    if (response.status >= 500 && response.status <= 599)
        return "server_error";
    return "unknown";
}
function shouldRetry(kind) {
    return kind === "rate_limited" || kind === "server_error" || kind === "network_error" || kind === "aborted";
}
function stableJson(value) {
    if (Array.isArray(value))
        return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") {
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
}
function sha256(value) {
    return createHash("sha256").update(stableJson(value), "utf8").digest("hex");
}
export function protocolResultType(result) {
    const value = result?.resultType ?? result?.result_type;
    return value === "complete" || value === "input_required" || value === "task" ? value : undefined;
}
/** Count MRTR input requests without retaining request contents. */
export function protocolInputRequestCount(result) {
    const requests = result?.inputRequests ?? result?.input_requests;
    return Array.isArray(requests) ? Math.min(100, requests.length) : undefined;
}
/** Count MRTR input responses without retaining response contents. */
export function protocolInputResponseCount(result) {
    const responses = result?.inputResponses ?? result?.input_responses;
    return Array.isArray(responses) ? Math.min(100, responses.length) : undefined;
}
const TASK_STATES = new Set(["working", "input_required", "completed", "failed", "cancelled", "expired"]);
/**
 * Return a one-way task handle for protocol telemetry. Raw task IDs are not
 * sent over the wire; hashing here keeps server-side task lifecycle events
 * correlatable while preserving the SDK's metadata-only privacy boundary.
 */
export function protocolTaskIdHash(value) {
    const nested = value?.task && typeof value.task === "object" && !Array.isArray(value.task) ? value.task : undefined;
    const candidate = value?.taskId ?? value?.task_id ?? nested?.taskId ?? nested?.task_id;
    return typeof candidate === "string" && candidate.trim().length > 0 && new TextEncoder().encode(candidate).byteLength <= DEFAULT_MAX_STRING_LENGTH
        ? sha256(candidate.trim())
        : undefined;
}
/** Extract only the explicit, bounded task state from a protocol result. */
export function protocolTaskStatus(value) {
    const nested = value?.task && typeof value.task === "object" && !Array.isArray(value.task) ? value.task : undefined;
    const candidate = value?.status ?? value?.task_status ?? nested?.status ?? nested?.task_status;
    return typeof candidate === "string" && TASK_STATES.has(candidate) ? candidate : undefined;
}
/** Return only bounded capability names from an initialize result. */
export function protocolCapabilities(value) {
    const capabilities = value?.capabilities;
    if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities))
        return [];
    return Object.keys(capabilities)
        .filter((name) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name))
        .sort()
        .slice(0, 32);
}
export function catalogObservation(kind, result) {
    const key = kind === "resource_templates" ? "resourceTemplates" : kind;
    const items = result && Array.isArray(result[key]) ? result[key] : [];
    const names = [];
    const uris = [];
    for (const item of items.slice(0, 128)) {
        if (!item || typeof item !== "object")
            continue;
        const record = item;
        if (typeof record.name === "string")
            names.push(sha256(record.name));
        if (typeof record.uri === "string" || typeof record.uriTemplate === "string")
            uris.push(sha256(record.uri ?? record.uriTemplate));
    }
    return { catalog_kind: kind, catalog_item_count: items.length, catalog_item_name_hashes: names, catalog_item_uri_hashes: uris };
}
export function interactionEntityObservation(method, params) {
    const value = method === "resources/read" ? params?.uri : method === "prompts/get" ? params?.name : undefined;
    return typeof value === "string" && value.length > 0 ? { kind: method === "resources/read" ? "resources" : "prompts", hash: sha256(value) } : undefined;
}
const CORRELATION_HANDLE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const RESERVED_CORRELATION_FIELD = "__trackmcp_correlation_handle";
const MAX_PENDING_CORRELATIONS = 1000;
const PENDING_CORRELATION_TIMEOUT_MS = 30_000;
const INTENT_FIELD = "context";
const INTENT_SENSITIVE = /(?:bearer\s+|authorization\s*[:=]|api[_-]?key\s*[:=]|access[_-]?token\s*[:=]|refresh[_-]?token\s*[:=]|password\s*[:=]|secret\s*[:=]|eyJ[A-Za-z0-9_-]+\.|https?:\/\/|\b[^\s@]+@[^\s@]+\.[^\s@]+\b)/i;
function safeCorrelationHandle(value) {
    if (typeof value !== "string" || !CORRELATION_HANDLE.test(value))
        return false;
    return !/(?:bearer(?:\s|[_:-])|eyJ[A-Za-z0-9_-]+\.|@|https?:\/\/|:\/\/|^sk[-_])/i.test(value);
}
function safeIntentText(value, maxLength) {
    return typeof value === "string" && value.trim().length > 0 && new TextEncoder().encode(value.trim()).byteLength <= maxLength && !INTENT_SENSITIVE.test(value);
}
function safeAccountId(value) {
    return typeof value === "string" && ACCOUNT_ID_PATTERN.test(value.trim()) && !/(?:bearer(?:\s|[_:-])|eyJ[A-Za-z0-9_-]+\.|@|https?:\/\/|:\/\/|^sk[-_]|^tmcp_)/i.test(value);
}
function catalogTools(result) {
    if (!result || !Array.isArray(result.tools))
        return [];
    return result.tools.flatMap((tool) => {
        if (!tool || typeof tool !== "object" || typeof tool.name !== "string")
            return [];
        const value = tool;
        const description = typeof value.description === "string" ? value.description : undefined;
        const inputSchema = value.inputSchema ?? value.input_schema ?? {};
        return [{ name: value.name, ...(description ? { description } : {}), tool_description_hash: sha256(description || ""), schema_hash: sha256(inputSchema) }];
    });
}
function freezeClone(value) {
    const clone = JSON.parse(JSON.stringify(value));
    const freeze = (item) => {
        if (!item || typeof item !== "object" || Object.isFrozen(item))
            return item;
        Object.freeze(item);
        for (const child of Object.values(item))
            freeze(child);
        return item;
    };
    return freeze(clone);
}
export class TrackMCPClient {
    options;
    queue = [];
    queueBytes = 0;
    diagnosticCounts = { droppedEvents: 0, hookErrors: 0, privacyErrors: 0 };
    toolCatalog = new Map();
    intentTools = new Set();
    timer;
    flushing;
    constructor(options) {
        const apiKey = typeof options.apiKey === "string" && options.apiKey.trim() ? options.apiKey.trim() : undefined;
        if (!apiKey && options.strict)
            throw new Error(`TrackMCP telemetry is disabled because TRACKMCP_KEY is missing. Create a connection key: ${TRACKMCP_SETUP_URL}`);
        const diagnostics = { ...options.diagnostics, onDeliveryError: options.onDeliveryError || options.diagnostics?.onDeliveryError, debug: options.debug ?? options.diagnostics?.debug ?? false };
        this.options = {
            apiKey,
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
            disabled: options.disabled === true || !apiKey,
            redactEvent: options.redactEvent,
            correlation: {
                mode: options.correlation?.mode === "external" || options.correlation?.mode === "issued" ? options.correlation.mode : "none",
                resolve: options.correlation?.resolve,
                issuedField: options.correlation?.issuedField && /^__trackmcp_[A-Za-z0-9_]{1,64}$/.test(options.correlation.issuedField) ? options.correlation.issuedField : RESERVED_CORRELATION_FIELD,
            },
            intentFallback: options.intentFallback,
            accountIdResolver: options.accountIdResolver,
            diagnostics,
            diagnosticTimes: new Map(),
        };
        if (!apiKey)
            this.emitDiagnostic({ kind: "missing_api_key", retrying: false });
        if (!this.options.disabled) {
            this.timer = setInterval(() => void this.flush(), this.options.flushIntervalMs);
            this.timer.unref?.();
        }
    }
    emitDiagnostic(error) {
        const now = Date.now();
        const previous = this.options.diagnosticTimes.get(error.kind) || 0;
        if (this.options.diagnosticTimes.has(error.kind) && now - previous < DIAGNOSTIC_INTERVAL_MS)
            return;
        this.options.diagnosticTimes.set(error.kind, now);
        try {
            this.options.diagnostics.onDeliveryError?.({ ...error });
        }
        catch {
            // Diagnostics must never affect an MCP call or delivery attempt.
        }
        if (error.kind === "missing_api_key") {
            console.warn(`TrackMCP telemetry is disabled because TRACKMCP_KEY is missing. Create a connection key: ${TRACKMCP_SETUP_URL}`);
        }
        else if (this.options.diagnostics.debug) {
            const status = error.status ? ` (HTTP ${error.status})` : "";
            console.warn(`TrackMCP telemetry delivery failed: ${error.kind}${status}. MCP calls remain unaffected.`);
        }
    }
    capture(event, issuedHandle) {
        this.captureInternal(event, "server", issuedHandle);
    }
    captureClient(event, hook, correlationOverride) {
        this.captureInternal(event, "client", undefined, hook, correlationOverride);
    }
    resolveCorrelation(event) {
        return this.correlationFor(event);
    }
    captureInternal(event, source, issuedHandle, hook, correlationOverride) {
        if (this.options.disabled || Math.random() > this.options.sampleRate)
            return;
        try {
            const observedEvent = source === "server" && event.event_type === "protocol" && event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
                ? { ...event, payload: { ...event.payload, _trackmcp: { ...(event.payload._trackmcp && typeof event.payload._trackmcp === "object" && !Array.isArray(event.payload._trackmcp) ? event.payload._trackmcp : {}), observation_kind: event.payload.name === "protocol_request_observed" ? "protocol_request" : event.payload.name === "protocol_response_observed" ? "protocol_response" : event.catalog_kind && (event.mcp_method === "resources/read" || event.mcp_method === "prompts/get") ? "entity_read" : undefined, ...(event.catalog_kind && (event.mcp_method === "resources/read" || event.mcp_method === "prompts/get") ? { protocol_observation_kind: "protocol_response" } : {}), observation_source: "server" } } }
                : event;
            const correlation = correlationOverride || this.correlationFor(observedEvent, issuedHandle);
            const intent = this.intentFor(observedEvent);
            const account = this.accountFor(observedEvent);
            let prepared = this.prepareEvent({
                ...observedEvent,
                schema_version: TRACKMCP_SCHEMA_VERSION,
                event_id: randomUUID(),
                service: this.options.service,
                environment: this.options.environment,
                observation_source: source,
                session_id_source: observedEvent.session_id_source || (observedEvent.session_id ? "external" : "missing"),
                correlation_handle: correlation.handle,
                correlation_handle_source: correlation.source,
                context: intent.context,
                intent_source: intent.source,
                account_key: account.key,
                account_identity_source: account.source,
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
                    prepared = this.prepareEvent({ ...hooked, account_key: account.key, account_identity_source: account.source }, source);
                }
                catch {
                    this.diagnosticCounts.hookErrors += 1;
                    this.diagnosticCounts.droppedEvents += 1;
                    return;
                }
            }
            if (!this.enqueue(prepared))
                return;
            if (hook) {
                try {
                    hook(freezeClone(prepared));
                }
                catch {
                    this.diagnosticCounts.hookErrors += 1;
                    this.removeQueuedEvent(prepared);
                }
            }
        }
        catch {
            this.diagnosticCounts.privacyErrors += 1;
            this.diagnosticCounts.droppedEvents += 1;
            return;
        }
        if (this.queue.length >= this.options.maxBatchSize)
            void this.flush();
    }
    accountFor(event) {
        if (!this.options.accountIdResolver)
            return { source: "unresolved" };
        try {
            const value = this.options.accountIdResolver({ eventType: event.event_type || "custom", mcpMethod: event.mcp_method, toolName: event.tool_name, requestId: event.request_id, sessionId: event.session_id, transport: event.transport });
            if (safeAccountId(value))
                return { key: sha256(value.trim()), source: "resolver" };
        }
        catch {
            // Account identity is optional enrichment and must never affect MCP behavior.
        }
        return { source: "unresolved" };
    }
    correlationFor(event, issuedHandle) {
        if (this.options.correlation.mode === "issued" && safeCorrelationHandle(issuedHandle))
            return { handle: issuedHandle, source: "issued" };
        if (this.options.correlation.mode === "external" && this.options.correlation.resolve) {
            try {
                const handle = this.options.correlation.resolve({ eventType: event.event_type || "custom", mcpMethod: event.mcp_method, toolName: event.tool_name, requestId: event.request_id, sessionId: event.session_id, transport: event.transport });
                if (safeCorrelationHandle(handle))
                    return { handle, source: "external" };
            }
            catch {
                // Correlation is optional telemetry. Resolver failures are fail-open.
            }
        }
        return { source: "missing" };
    }
    removeQueuedEvent(event) {
        const index = this.queue.lastIndexOf(event);
        if (index < 0)
            return;
        this.queue.splice(index, 1);
        this.queueBytes = Math.max(0, this.queueBytes - payloadByteLength(event));
        this.diagnosticCounts.droppedEvents += 1;
    }
    intentFor(event) {
        if (safeIntentText(event.context, this.options.maxStringLength)) {
            const source = event.intent_source === "external_callback" ? "external_callback" : event.intent_source === "fallback" ? "fallback" : "context_parameter";
            return { context: event.context.trim(), source };
        }
        if (this.options.intentFallback) {
            try {
                const context = this.options.intentFallback({ eventType: event.event_type || "custom", mcpMethod: event.mcp_method, toolName: event.tool_name, requestId: event.request_id, sessionId: event.session_id, transport: event.transport });
                if (safeIntentText(context, this.options.maxStringLength))
                    return { context: context.trim(), source: "fallback" };
            }
            catch {
                // Intent is optional telemetry. Fallback failures remain fail-open.
            }
        }
        return { source: "missing" };
    }
    issuedField() { return this.options.correlation.issuedField; }
    issuedMode() { return this.options.correlation.mode === "issued"; }
    intentContextFor(toolName, argumentsValue) {
        if (!toolName || !this.intentTools.has(toolName) || !Object.prototype.hasOwnProperty.call(argumentsValue, INTENT_FIELD))
            return undefined;
        return argumentsValue[INTENT_FIELD];
    }
    reportMissing(capability, context) {
        if (!safeIntentText(capability, this.options.maxStringLength)) {
            this.diagnosticCounts.droppedEvents += 1;
            return;
        }
        this.capture({ event_type: "custom", mcp_method: "trackmcp_report_missing", missing_capability: capability.trim(), context, started_at: new Date().toISOString(), payload: { name: "trackmcp_report_missing" } });
    }
    stripIssuedField(value, field = this.issuedField()) {
        if (Array.isArray(value))
            return value.map((item) => this.stripIssuedField(item, field));
        if (!value || typeof value !== "object")
            return value;
        return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field).map(([key, child]) => [key, this.stripIssuedField(child, field)]));
    }
    injectOptionalContext(message, handle) {
        const result = message.result;
        if (!result || typeof result !== "object" || !Array.isArray(result.tools))
            return message;
        const tools = result.tools;
        const augmentedTools = tools.map((tool) => {
            if (!tool || typeof tool !== "object")
                return tool;
            const record = tool;
            const schema = record.inputSchema;
            if (!schema || typeof schema !== "object" || Array.isArray(schema))
                return tool;
            const schemaRecord = schema;
            if (schemaRecord.type !== "object")
                return tool;
            const properties = schemaRecord.properties && typeof schemaRecord.properties === "object" && !Array.isArray(schemaRecord.properties) ? schemaRecord.properties : {};
            let nextProperties = properties;
            if (!Object.prototype.hasOwnProperty.call(properties, INTENT_FIELD)) {
                this.intentTools.add(record.name);
                nextProperties = { ...nextProperties, [INTENT_FIELD]: { type: "string", maxLength: this.options.maxStringLength, description: "Optional one-sentence description of the user’s underlying goal." } };
            }
            if (this.options.correlation.mode === "issued" && safeCorrelationHandle(handle) && !Object.prototype.hasOwnProperty.call(nextProperties, this.issuedField())) {
                nextProperties = { ...nextProperties, [this.issuedField()]: { type: "string", maxLength: 128, default: handle, description: "Opaque TrackMCP correlation handle; echo only when provided." } };
            }
            return nextProperties === properties ? tool : { ...record, inputSchema: { ...schemaRecord, properties: nextProperties } };
        });
        return { ...message, result: { ...result, tools: augmentedTools } };
    }
    prepareEvent(event, source = "server") {
        const prepared = { ...event, observation_source: source, payload_policy: this.options.payloadMode };
        if (!safeCorrelationHandle(prepared.correlation_handle) || (prepared.correlation_handle_source !== "external" && prepared.correlation_handle_source !== "issued")) {
            delete prepared.correlation_handle;
            prepared.correlation_handle_source = "missing";
        }
        if (safeIntentText(prepared.context, this.options.maxStringLength)) {
            prepared.context = prepared.context.trim();
            if (prepared.intent_source !== "external_callback" && prepared.intent_source !== "fallback")
                prepared.intent_source = "context_parameter";
        }
        else {
            delete prepared.context;
            prepared.intent_source = "missing";
        }
        if (!safeIntentText(prepared.missing_capability, this.options.maxStringLength))
            delete prepared.missing_capability;
        if (this.options.payloadMode === "metadata") {
            if (source === "client" && prepared.payload && typeof prepared.payload === "object" && !Array.isArray(prepared.payload) && prepared.payload._trackmcp && typeof prepared.payload._trackmcp === "object") {
                const metadata = prepared.payload._trackmcp;
                const observationKinds = new Set(["tool_call_issued", "result_received", "next_tool_selected", "session_started", "session_reconnected", "session_ended", "protocol_request", "protocol_response", "protocol_notification"]);
                const sanitizedMetadata = {
                    observation_source: "client",
                    ...(typeof metadata.observation_kind === "string" && observationKinds.has(metadata.observation_kind) ? { observation_kind: metadata.observation_kind } : {}),
                    ...(typeof metadata.repeat_observed === "boolean" ? { repeat_observed: metadata.repeat_observed } : {}),
                    ...(metadata.repeat_group_source === "session_id" || metadata.repeat_group_source === "correlation_handle" ? { repeat_group_source: metadata.repeat_group_source } : {}),
                    ...(typeof metadata.next_tool_selection_observed === "boolean" ? { next_tool_selection_observed: metadata.next_tool_selection_observed } : {}),
                    ...(typeof metadata.preceding_request_id === "string" && metadata.preceding_request_id.length <= DEFAULT_MAX_STRING_LENGTH ? { preceding_request_id: metadata.preceding_request_id } : {}),
                    ...(typeof metadata.next_cursor_present === "boolean" ? { next_cursor_present: metadata.next_cursor_present } : {}),
                    ...(typeof metadata.cache_ttl_ms === "number" && Number.isInteger(metadata.cache_ttl_ms) && metadata.cache_ttl_ms >= 0 && metadata.cache_ttl_ms <= 86_400_000 ? { cache_ttl_ms: metadata.cache_ttl_ms } : {}),
                    ...(metadata.cache_scope === "public" || metadata.cache_scope === "private" ? { cache_scope: metadata.cache_scope } : {}),
                    ...(typeof metadata.completion_value_count === "number" && Number.isInteger(metadata.completion_value_count) && metadata.completion_value_count >= 0 && metadata.completion_value_count <= 32 ? { completion_value_count: metadata.completion_value_count } : {}),
                    ...(typeof metadata.completion_total === "number" && Number.isInteger(metadata.completion_total) && metadata.completion_total >= 0 && metadata.completion_total <= 1_000_000 ? { completion_total: metadata.completion_total } : {}),
                    ...(typeof metadata.completion_has_more === "boolean" ? { completion_has_more: metadata.completion_has_more } : {}),
                    ...(metadata.subscription_action === "listen_requested" || metadata.subscription_action === "subscribe_requested" || metadata.subscription_action === "unsubscribe_requested" || metadata.subscription_action === "subscription_started" || metadata.subscription_action === "subscription_stopped" ? { subscription_action: metadata.subscription_action } : {}),
                    ...(metadata.protocol_signal === "progress" || metadata.protocol_signal === "cancelled" || metadata.protocol_signal === "catalog_changed" || metadata.protocol_signal === "resource_changed" || metadata.protocol_signal === "prompt_changed" || metadata.protocol_signal === "subscription_started" || metadata.protocol_signal === "subscription_stopped" ? { protocol_signal: metadata.protocol_signal } : {}),
                    ...(metadata.protocol_family === "sampling" || metadata.protocol_family === "elicitation" || metadata.protocol_family === "completion" || metadata.protocol_family === "tasks" || metadata.protocol_family === "control_signal" || metadata.protocol_family === "resources" || metadata.protocol_family === "prompts" || metadata.protocol_family === "tools" || metadata.protocol_family === "subscriptions" || metadata.protocol_family === "notifications" ? { protocol_family: metadata.protocol_family } : {}),
                    ...(typeof metadata.lifecycle_generation === "number" && Number.isInteger(metadata.lifecycle_generation) && metadata.lifecycle_generation >= 1 && metadata.lifecycle_generation <= 1_000_000 ? { lifecycle_generation: metadata.lifecycle_generation } : {}),
                };
                prepared.payload = { _trackmcp: sanitizedMetadata };
                prepared.payload_size_bytes = payloadByteLength(prepared.payload);
            }
            else {
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
            });
            prepared.payload_size_bytes = payloadByteLength(prepared.payload);
        }
        else {
            prepared.payload_size_bytes = 0;
        }
        return prepared;
    }
    enqueue(event) {
        const eventBytes = payloadByteLength(event);
        if (!eventBytes || eventBytes > this.options.maxQueueBytes) {
            this.diagnosticCounts.droppedEvents += 1;
            return false;
        }
        this.queue.push(event);
        this.queueBytes += eventBytes;
        while (this.queue.length > this.options.maxQueueEvents || this.queueBytes > this.options.maxQueueBytes) {
            const dropped = this.queue.shift();
            if (!dropped)
                break;
            this.queueBytes = Math.max(0, this.queueBytes - payloadByteLength(dropped));
            this.diagnosticCounts.droppedEvents += 1;
        }
        return true;
    }
    getDiagnostics() {
        return { ...this.diagnosticCounts, queuedEvents: this.queue.length, queuedBytes: this.queueBytes };
    }
    track(name, payload = {}) {
        this.capture({
            event_type: "custom",
            started_at: new Date().toISOString(),
            payload: { name, ...payload },
        });
    }
    workflow(name, status, payload = {}) {
        this.capture({ event_type: "workflow", started_at: new Date().toISOString(), payload: { name: "workflow", workflow_name: name, status, ...payload } });
    }
    /** Record an allowlisted protocol notification without payload values. */
    recordProtocolSignal(signal, method, sessionId, direction = "server_to_client") {
        if (!TRACKMCP_PROTOCOL_SIGNALS.has(signal) || !/^[A-Za-z0-9_./-]{1,128}$/.test(method) || (direction !== "server_to_client" && direction !== "client_to_server"))
            return;
        this.capture({
            event_type: "protocol",
            mcp_method: method,
            direction,
            session_id: sessionId || "transport-session",
            started_at: new Date().toISOString(),
            success: true,
            is_error: false,
            payload: { _trackmcp: { observation_kind: "protocol_notification", protocol_signal: signal } },
        });
    }
    recordCatalog(result) {
        const tools = catalogTools(result);
        for (const tool of tools)
            this.toolCatalog.set(tool.name, tool);
        return tools;
    }
    toolMetadata(name) {
        return name ? this.toolCatalog.get(name) : undefined;
    }
    async flush() {
        if (this.options.disabled || this.flushing || this.queue.length === 0)
            return this.flushing || Promise.resolve();
        const events = this.queue.splice(0, this.options.maxBatchSize);
        this.queueBytes = Math.max(0, this.queueBytes - events.reduce((total, event) => total + payloadByteLength(event), 0));
        let delivered = false;
        this.flushing = fetch(this.options.endpoint, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${this.options.apiKey}` },
            body: JSON.stringify({ events }),
        })
            .then(async (response) => {
            if (response.ok) {
                delivered = true;
                return;
            }
            const kind = await responseErrorKind(response);
            const retrying = shouldRetry(kind);
            this.emitDiagnostic({ kind, status: response.status, retrying });
            if (retrying)
                for (const event of events)
                    this.enqueue(event);
        })
            .catch((error) => {
            const kind = error && typeof error === "object" && "name" in error && error.name === "AbortError" ? "aborted" : "network_error";
            this.emitDiagnostic({ kind, retrying: true });
            // Analytics must never affect the user's MCP server. Requeue within the same bounds.
            for (const event of events)
                this.enqueue(event);
        })
            .finally(() => {
            this.flushing = undefined;
            if (delivered && this.queue.length >= this.options.maxBatchSize)
                void this.flush();
        });
        return this.flushing;
    }
}
function toolCallDetails(args) {
    const first = args[0];
    if (!first || typeof first !== "object")
        return { payload: { args } };
    const request = first;
    const params = request.params && typeof request.params === "object" ? request.params : request;
    const argumentsValue = params.arguments ?? params.args ?? {};
    const payloadArgs = argumentsValue && typeof argumentsValue === "object" && !Array.isArray(argumentsValue) ? { ...argumentsValue } : argumentsValue;
    const context = payloadArgs && typeof payloadArgs === "object" && !Array.isArray(payloadArgs) ? payloadArgs.context : undefined;
    if (payloadArgs && typeof payloadArgs === "object" && !Array.isArray(payloadArgs))
        delete payloadArgs.context;
    return { toolName: typeof params.name === "string" ? params.name : undefined, payload: { args: payloadArgs }, context };
}
/** Preserve the actual MCP transport without retaining URLs, headers, or adapter internals. */
function transportKind(transport) {
    const name = typeof transport.constructor?.name === "string"
        ? transport.constructor.name.toLowerCase()
        : "";
    if (name.includes("stdio"))
        return "stdio";
    if (name.includes("streamablehttp") || name.includes("streamable_http"))
        return "streamable_http";
    if (name === "sseclienttransport" || name.includes("sse"))
        return "sse";
    return "custom";
}
function wrapTransport(transport, client) {
    const observedTransport = transportKind(transport);
    const pending = new Map();
    const transportSessionId = randomUUID();
    const issuedHandle = `tmcp_${randomUUID().replaceAll("-", "")}`;
    let activeSessionId = transportSessionId;
    let activeSessionIdSource = "transport_generated";
    let clientName;
    let clientVersion;
    let messageHandler;
    const keyFor = (id) => `${typeof id}:${String(id)}`;
    const prunePending = () => {
        const now = Date.now();
        for (const [key, value] of pending)
            if (value.expiresAt <= now)
                pending.delete(key);
    };
    const addPending = (key, value) => {
        prunePending();
        pending.delete(key);
        while (pending.size >= MAX_PENDING_CORRELATIONS) {
            const oldest = pending.keys().next().value;
            if (oldest === undefined)
                break;
            pending.delete(oldest);
        }
        pending.set(key, { ...value, expiresAt: Date.now() + PENDING_CORRELATION_TIMEOUT_MS });
    };
    const cleanupTimer = setInterval(prunePending, PENDING_CORRELATION_TIMEOUT_MS);
    cleanupTimer.unref?.();
    return new Proxy(transport, {
        get(target, property, receiver) {
            if (property === "send") {
                return async (message, options) => {
                    prunePending();
                    const id = message.id;
                    const pendingCall = id !== undefined ? pending.get(keyFor(id)) : undefined;
                    if (pendingCall) {
                        const call = pendingCall;
                        pending.delete(keyFor(id));
                        const result = message.result;
                        const taskIdHash = call.taskIdHash || (protocolResultType(result) === "task" ? protocolTaskIdHash(result) : undefined);
                        const taskStatus = protocolTaskStatus(result);
                        const failed = Boolean(message.error) || Boolean(result?.isError);
                        const protocolError = message.error && typeof message.error === "object" ? message.error : undefined;
                        const transportProvidedSessionId = Reflect.get(target, "sessionId");
                        if (typeof result?.sessionId === "string") {
                            activeSessionId = result.sessionId;
                            activeSessionIdSource = "protocol";
                        }
                        else if (typeof transportProvidedSessionId === "string" && activeSessionIdSource === "transport_generated") {
                            activeSessionId = transportProvidedSessionId;
                            activeSessionIdSource = "protocol";
                        }
                        const sessionId = activeSessionId;
                        if (call.method === "tools/call") {
                            const metadata = client.toolMetadata(call.toolName);
                            client.capture({ event_type: "tool_call", direction: "server_to_client", transport: observedTransport, mcp_method: call.method, request_id: String(id), tool_name: call.toolName, ...(taskIdHash ? { task_id: taskIdHash } : {}), tool_description: metadata?.description, tool_description_hash: metadata?.tool_description_hash, schema_hash: metadata?.schema_hash, client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, context: call.intentContext, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : result?.isError ? "tool_execution_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { ...call.payload, ...(taskStatus ? { task_status: taskStatus } : {}), result: client.stripIssuedField(message.error || result) } }, call.correlationHandle);
                        }
                        else if (call.method === "initialize") {
                            const serverInfo = result?.serverInfo && typeof result.serverInfo === "object" && !Array.isArray(result.serverInfo) ? result.serverInfo : undefined;
                            client.capture({ event_type: "session", direction: "server_to_client", transport: observedTransport, mcp_method: call.method, request_id: String(id), protocol_version: typeof result?.protocolVersion === "string" ? result.protocolVersion : undefined, client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, error_class: message.error ? "protocol_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { name: "session_initialized", ...(protocolCapabilities(result).length ? { capability_names: protocolCapabilities(result) } : {}), ...(typeof serverInfo?.name === "string" ? { server_name: serverInfo.name.slice(0, DEFAULT_MAX_STRING_LENGTH) } : {}), ...(typeof serverInfo?.version === "string" ? { server_version: serverInfo.version.slice(0, DEFAULT_MAX_STRING_LENGTH) } : {}) } });
                        }
                        else if (["tools/list", "resources/list", "resources/templates/list", "prompts/list"].includes(call.method || "") && !failed) {
                            const catalogType = call.method?.replace("/list", "");
                            client.recordCatalog(result);
                            client.capture({ event_type: "catalog", direction: "server_to_client", transport: observedTransport, mcp_method: call.method, request_id: String(id), client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: true, is_error: false, ...catalogObservation(catalogType, result), payload: { name: `${catalogType}_discovered` } });
                        }
                        else if (call.entity && !failed) {
                            const catalogKind = call.entity.kind;
                            client.capture({ event_type: "protocol", direction: "server_to_client", transport: observedTransport, mcp_method: call.method, request_id: String(id), ...(taskIdHash ? { task_id: taskIdHash } : {}), client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: true, is_error: false, ...(protocolResultType(result) ? { result_type: protocolResultType(result) } : {}), ...(protocolInputRequestCount(result) !== undefined ? { input_request_count: protocolInputRequestCount(result) } : {}), ...(protocolInputResponseCount(result) !== undefined ? { input_response_count: protocolInputResponseCount(result) } : {}), catalog_kind: catalogKind, ...(catalogKind === "resources" ? { catalog_item_uri_hashes: [call.entity.hash] } : { catalog_item_name_hashes: [call.entity.hash] }), payload: { name: `${catalogKind}_read_observed`, ...(taskStatus ? { task_status: taskStatus } : {}) } });
                        }
                        else if (call.method && call.method !== "tools/call" && call.method !== "initialize") {
                            client.capture({ event_type: "protocol", direction: "server_to_client", transport: observedTransport, mcp_method: call.method, request_id: String(id), ...(taskIdHash ? { task_id: taskIdHash } : {}), client_name: clientName, client_version: clientVersion, session_id: sessionId, session_id_source: activeSessionIdSource, started_at: new Date(call.started).toISOString(), duration_ms: Date.now() - call.started, success: !failed, is_error: failed, ...(protocolResultType(result) ? { result_type: protocolResultType(result) } : {}), ...(protocolInputRequestCount(result) !== undefined ? { input_request_count: protocolInputRequestCount(result) } : {}), ...(protocolInputResponseCount(result) !== undefined ? { input_response_count: protocolInputResponseCount(result) } : {}), error_class: message.error ? "protocol_error" : result?.isError ? "protocol_error" : undefined, error_code: typeof protocolError?.code === "number" ? protocolError.code : undefined, payload: { name: "protocol_response_observed", ...(taskStatus ? { task_status: taskStatus } : {}) } });
                        }
                    }
                    const send = Reflect.get(target, property);
                    const outgoing = pendingCall?.method === "tools/list" ? client.injectOptionalContext(message, issuedHandle) : message;
                    return send.call(target, outgoing, options);
                };
            }
            if (property === "onmessage")
                return messageHandler;
            const value = Reflect.get(target, property, receiver);
            return typeof value === "function" ? value.bind(target) : value;
        },
        set(target, property, value) {
            if (property === "onmessage") {
                messageHandler = (message, extra) => {
                    if (!message || typeof message !== "object")
                        return;
                    let record = message;
                    if (record.method === "initialize") {
                        const params = record.params;
                        const info = params?.clientInfo;
                        if (typeof info?.name === "string")
                            clientName = info.name;
                        if (typeof info?.version === "string")
                            clientVersion = info.version;
                    }
                    prunePending();
                    if (record.method === "tools/call" && record.id !== undefined) {
                        const params = record.params;
                        const argumentsValue = params?.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments) ? params.arguments : {};
                        const correlationHandle = client.issuedMode() && client.issuedField() in argumentsValue && safeCorrelationHandle(argumentsValue[client.issuedField()]) ? argumentsValue[client.issuedField()] : undefined;
                        const intentContext = client.intentContextFor(typeof params?.name === "string" ? params.name : undefined, argumentsValue);
                        const cleanArguments = { ...argumentsValue };
                        if (client.issuedMode())
                            delete cleanArguments[client.issuedField()];
                        if (intentContext !== undefined)
                            delete cleanArguments[INTENT_FIELD];
                        const cleanRecord = (correlationHandle || intentContext !== undefined) && params ? { ...record, params: { ...params, arguments: cleanArguments } } : record;
                        addPending(keyFor(record.id), {
                            method: "tools/call",
                            toolName: typeof params?.name === "string" ? params.name : undefined,
                            payload: { args: cleanArguments },
                            started: Date.now(),
                            correlationHandle,
                            intentContext,
                        });
                        if (cleanRecord !== record)
                            record = cleanRecord;
                    }
                    else if (record.id !== undefined) {
                        const method = typeof record.method === "string" ? record.method : undefined;
                        const params = record.params && typeof record.params === "object" ? record.params : {};
                        const taskIdHash = method?.startsWith("tasks/") ? protocolTaskIdHash(params) : undefined;
                        addPending(keyFor(record.id), { method, taskIdHash, payload: {}, started: Date.now(), entity: interactionEntityObservation(method, params) });
                    }
                    if (typeof record.method === "string" && record.method !== "tools/call") {
                        const taskIdHash = record.method.startsWith("tasks/") && record.params && typeof record.params === "object" ? protocolTaskIdHash(record.params) : undefined;
                        client.capture({ event_type: "protocol", direction: "client_to_server", transport: observedTransport, mcp_method: record.method, request_id: record.id === undefined ? undefined : String(record.id), ...(taskIdHash ? { task_id: taskIdHash } : {}), session_id: activeSessionId, session_id_source: activeSessionIdSource, client_name: clientName, client_version: clientVersion, started_at: new Date().toISOString(), payload: { name: "protocol_request_observed" } });
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
export function withTrackMCP(server, options) {
    const client = new TrackMCPClient(options);
    activeClient = client;
    const target = server;
    const originalConnect = target.connect;
    if (typeof originalConnect === "function") {
        target.connect = function (transport, ...args) {
            return originalConnect.call(this, wrapTransport(transport, client), ...args);
        };
    }
    for (const method of ["request", "callTool", "call_tool"]) {
        const original = target[method];
        if (typeof original !== "function")
            continue;
        target[method] = async function (...args) {
            const details = method === "callTool" || method === "call_tool" ? toolCallDetails(args) : toolCallDetails(args);
            const started = Date.now();
            try {
                const result = await original.apply(this, args);
                const isError = Boolean(result && typeof result === "object" && result.isError);
                const metadata = client.toolMetadata(details.toolName);
                client.capture({
                    event_type: "tool_call",
                    tool_name: details.toolName,
                    context: details.context,
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
            }
            catch (error) {
                client.capture({
                    event_type: "tool_call",
                    tool_name: details.toolName,
                    tool_description: client.toolMetadata(details.toolName)?.description,
                    tool_description_hash: client.toolMetadata(details.toolName)?.tool_description_hash,
                    schema_hash: client.toolMetadata(details.toolName)?.schema_hash,
                    context: details.context,
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
    Object.defineProperty(target, "trackmcp", { value: { capture: client.capture.bind(client), track: client.track.bind(client), workflow: client.workflow.bind(client), recordProtocolSignal: client.recordProtocolSignal.bind(client), reportMissing: client.reportMissing.bind(client), trackmcp_report_missing: client.reportMissing.bind(client), flush: client.flush.bind(client), getDiagnostics: client.getDiagnostics.bind(client) } });
    return target;
}
export const track = (name, payload) => {
    activeClient?.track(name, payload);
};
export const trackmcp_report_missing = (capability, context) => {
    activeClient?.reportMissing(capability, context);
};
export { DEFAULT_MAX_BATCH_SIZE, DEFAULT_MAX_PAYLOAD_BYTES, DEFAULT_MAX_PAYLOAD_DEPTH, DEFAULT_MAX_PAYLOAD_KEYS, DEFAULT_MAX_QUEUE_BYTES, DEFAULT_MAX_QUEUE_EVENTS, DEFAULT_MAX_STRING_LENGTH, } from "./privacy.js";
