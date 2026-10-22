import { type PayloadMode } from "./privacy.js";
export type { PayloadMode } from "./privacy.js";
export type TrackMCPEventType = "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";
export declare const TRACKMCP_SCHEMA_VERSION: "1";
export type TrackMCPCorrelationMode = "none" | "external" | "issued";
export type TrackMCPCorrelationHandleSource = "external" | "issued" | "missing";
export type TrackMCPIntentSource = "context_parameter" | "external_callback" | "fallback" | "missing";
export type TrackMCPCatalogKind = "tools" | "resources" | "resource_templates" | "prompts";
export type TrackMCPIntentContext = {
    eventType: TrackMCPEventType;
    mcpMethod?: string;
    toolName?: string;
    requestId?: string;
    sessionId?: string;
    transport?: TrackMCPEvent["transport"];
};
export type TrackMCPAccountIdentityContext = {
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
    account_key?: string;
    account_identity_source?: "resolver" | "unresolved";
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
    result_type?: "complete" | "input_required" | "task";
    /** Explicit task state; raw task handles are never stored. */
    task_status?: "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired";
    input_request_count?: number;
    input_response_count?: number;
    schema_hash?: string;
    catalog_kind?: TrackMCPCatalogKind;
    catalog_item_count?: number;
    catalog_item_name_hashes?: string[];
    catalog_item_uri_hashes?: string[];
    payload_size_bytes?: number;
    payload_policy?: "metadata" | "redacted" | "full";
    payload?: Record<string, unknown>;
};
export type TrackMCPDeliveryErrorKind = "missing_api_key" | "invalid_key" | "revoked" | "unauthorized" | "forbidden" | "rate_limited" | "server_error" | "network_error" | "aborted" | "unknown";
export type TrackMCPDeliveryError = {
    kind: TrackMCPDeliveryErrorKind;
    status?: number;
    retrying: boolean;
};
export type TrackMCPDiagnosticsOptions = {
    onDeliveryError?: (error: TrackMCPDeliveryError) => void;
    debug?: boolean;
};
export type TrackMCPOptions = {
    apiKey?: string;
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
    /** Resolve an already-validated customer account claim; failures are fail-open. */
    accountIdResolver?: (context: TrackMCPAccountIdentityContext) => string | undefined | null;
    /** Throw during initialization when TRACKMCP_KEY is absent. Defaults to false. */
    strict?: boolean;
    /** Structured, rate-limited delivery diagnostics. */
    diagnostics?: TrackMCPDiagnosticsOptions;
    /** Compatibility shorthand for diagnostics.onDeliveryError. */
    onDeliveryError?: TrackMCPDiagnosticsOptions["onDeliveryError"];
    /** Compatibility shorthand for diagnostics.debug. */
    debug?: boolean;
};
export declare const TRACKMCP_SETUP_URL = "https://app.trackmcp.com/signup?utm_source=npm&utm_medium=sdk&utm_campaign=sdk_setup";
type CatalogTool = {
    name: string;
    description?: string;
    tool_description_hash: string;
    schema_hash: string;
};
type EntityObservation = {
    kind: "resources" | "prompts";
    hash: string;
};
export declare function protocolResultType(result: Record<string, unknown> | undefined): TrackMCPEvent["result_type"];
/** Count MRTR input requests without retaining request contents. */
export declare function protocolInputRequestCount(result: Record<string, unknown> | undefined): number | undefined;
/** Count MRTR input responses without retaining response contents. */
export declare function protocolInputResponseCount(result: Record<string, unknown> | undefined): number | undefined;
/**
 * Return a one-way task handle for protocol telemetry. Raw task IDs are not
 * sent over the wire; hashing here keeps server-side task lifecycle events
 * correlatable while preserving the SDK's metadata-only privacy boundary.
 */
export declare function protocolTaskIdHash(value: Record<string, unknown> | undefined): string | undefined;
/** Extract only the explicit, bounded task state from a protocol result. */
export declare function protocolTaskStatus(value: Record<string, unknown> | undefined): "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired" | undefined;
/** Return only bounded capability names from an initialize result. */
export declare function protocolCapabilities(value: Record<string, unknown> | undefined): string[];
export declare function catalogObservation(kind: TrackMCPCatalogKind, result: Record<string, unknown> | undefined): Pick<TrackMCPEvent, "catalog_kind" | "catalog_item_count" | "catalog_item_name_hashes" | "catalog_item_uri_hashes">;
export declare function interactionEntityObservation(method: string | undefined, params: Record<string, unknown> | undefined): EntityObservation | undefined;
export type TrackMCPDiagnostics = {
    droppedEvents: number;
    hookErrors: number;
    privacyErrors: number;
    queuedEvents: number;
    queuedBytes: number;
};
export type TrackMCPEventHook = (event: TrackMCPEvent) => void;
export declare class TrackMCPClient {
    private readonly options;
    private queue;
    private queueBytes;
    private readonly diagnosticCounts;
    private readonly toolCatalog;
    private readonly intentTools;
    private timer?;
    private flushing?;
    constructor(options: TrackMCPOptions);
    private emitDiagnostic;
    capture(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version" | "observation_source"> & {
        schema_version?: string;
        observation_source?: "client" | "server";
    }, issuedHandle?: string): void;
    captureClient(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version" | "observation_source"> & {
        schema_version?: string;
    }, hook?: TrackMCPEventHook, correlationOverride?: {
        handle?: string;
        source: TrackMCPCorrelationHandleSource;
    }): void;
    resolveCorrelation(event: Partial<TrackMCPEvent>): {
        handle?: string;
        source: TrackMCPCorrelationHandleSource;
    };
    private captureInternal;
    private accountFor;
    private correlationFor;
    private removeQueuedEvent;
    private intentFor;
    issuedField(): string;
    issuedMode(): boolean;
    intentContextFor(toolName: string | undefined, argumentsValue: Record<string, unknown>): string | undefined;
    reportMissing(capability: string, context?: string): void;
    stripIssuedField(value: unknown, field?: string): unknown;
    injectOptionalContext(message: Record<string, unknown>, handle: string): Record<string, unknown>;
    private prepareEvent;
    private enqueue;
    getDiagnostics(): TrackMCPDiagnostics;
    track(name: string, payload?: Record<string, unknown>): void;
    workflow(name: string, status: "started" | "completed" | "failed", payload?: Record<string, unknown>): void;
    /** Record an allowlisted protocol notification without payload values. */
    recordProtocolSignal(signal: "progress" | "cancelled" | "catalog_changed" | "resource_changed" | "prompt_changed", method: string, sessionId?: string): void;
    recordCatalog(result: Record<string, unknown> | undefined): CatalogTool[];
    toolMetadata(name: string | undefined): CatalogTool | undefined;
    flush(): Promise<void>;
}
/** Wrap an existing MCP server without changing its tools. */
export declare function withTrackMCP<T extends object>(server: T, options: TrackMCPOptions): T & {
    trackmcp: TrackMCP;
};
export declare const track: (name: string, payload?: Record<string, unknown>) => void;
export declare const trackmcp_report_missing: (capability: string, context?: string) => void;
export type TrackMCP = {
    capture(event: Omit<TrackMCPEvent, "event_id" | "service" | "environment" | "schema_version"> & {
        schema_version?: string;
    }): void;
    track(name: string, payload?: Record<string, unknown>): void;
    workflow(name: string, status: "started" | "completed" | "failed", payload?: Record<string, unknown>): void;
    recordProtocolSignal(signal: "progress" | "cancelled" | "catalog_changed" | "resource_changed" | "prompt_changed", method: string, sessionId?: string): void;
    reportMissing(capability: string, context?: string): void;
    trackmcp_report_missing(capability: string, context?: string): void;
    flush(): Promise<void>;
    getDiagnostics(): TrackMCPDiagnostics;
};
export { DEFAULT_MAX_BATCH_SIZE, DEFAULT_MAX_PAYLOAD_BYTES, DEFAULT_MAX_PAYLOAD_DEPTH, DEFAULT_MAX_PAYLOAD_KEYS, DEFAULT_MAX_QUEUE_BYTES, DEFAULT_MAX_QUEUE_EVENTS, DEFAULT_MAX_STRING_LENGTH, } from "./privacy.js";
