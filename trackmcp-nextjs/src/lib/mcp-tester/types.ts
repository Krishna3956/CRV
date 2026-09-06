export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type McpTesterVerdict =
  | "healthy_now"
  | "degraded"
  | "unreachable"
  | "protocol_error"
  | "auth_required"
  | "browser_blocked"
  | "unsupported"
  | "incomplete";

export type HealthDimensionName =
  | "reachability"
  | "protocol_negotiation"
  | "server_identity"
  | "capability_discovery"
  | "pagination"
  | "latency"
  | "catalog_quality"
  | "browser_compatibility"
  | "authentication";

export type HealthDimensionStatus =
  | "pass"
  | "warn"
  | "fail"
  | "blocked"
  | "not_checked"
  | "insufficient_evidence";

export type McpTesterPhase =
  | "validate_endpoint"
  | "validate_headers"
  | "initialize"
  | "initialized_notification"
  | "tools_list"
  | "resources_list"
  | "prompts_list"
  | "catalog_quality"
  | "finalize";

export type PhaseOutcome = "passed" | "failed" | "blocked" | "skipped" | "incomplete" | "auth_required";
export type TimelineEventKind = "phase_started" | "request_sent" | "response_received" | "phase_finished" | "finding";
export type FindingSeverity = "info" | "warning" | "error";
export type FindingCategory =
  | "safety"
  | "reachability"
  | "protocol"
  | "identity"
  | "discovery"
  | "pagination"
  | "latency"
  | "catalog"
  | "browser"
  | "authentication"
  | "limit";

export interface McpTesterLimits {
  maxEndpointUrlLength: number;
  maxHeaderNameLength: number;
  maxHeaderValueLength: number;
  maxHeaderCount: number;
  maxHeaderBytes: number;
  maxResponseBodyBytes: number;
  maxTimelineEvents: number;
  maxPaginationPages: number;
  maxTotalDurationMs: number;
  maxJsonDepth: number;
  maxJsonNodes: number;
  maxRenderedStringLength: number;
  maxRenderedJsonBytes: number;
  maxCatalogItems: number;
  latencyWarningMs: number;
}

export interface McpTesterClientInfo {
  name: string;
  version: string;
}

export type McpFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface McpTesterOptions {
  endpoint: string;
  headers?: Readonly<Record<string, string>>;
  limits?: Partial<McpTesterLimits>;
  fetch?: McpFetch;
  signal?: AbortSignal;
  protocolVersion?: string;
  supportedProtocolVersions?: readonly string[];
  clientInfo?: McpTesterClientInfo;
  closeSession?: boolean;
  now?: () => number;
  nowIso?: () => string;
}

export interface SafeEndpoint {
  origin: string;
  pathname: string;
  queryPresent: boolean;
}

export type EndpointRejectionCode =
  | "invalid_url"
  | "url_too_long"
  | "unsupported_scheme"
  | "credentials_in_url"
  | "unsafe_hostname"
  | "unsafe_ip_address"
  | "cloud_metadata_target";

export type HeaderRejectionCode =
  | "headers_not_object"
  | "header_name_invalid"
  | "header_name_too_long"
  | "header_value_invalid"
  | "header_value_too_long"
  | "too_many_headers"
  | "headers_too_large"
  | "browser_forbidden_header";

export interface ValidatedEndpoint {
  ok: true;
  requestUrl: URL;
  safeEndpoint: SafeEndpoint;
}

export interface RejectedEndpoint {
  ok: false;
  code: EndpointRejectionCode;
  message: string;
}

export type EndpointValidationResult = ValidatedEndpoint | RejectedEndpoint;

export interface ValidatedHeaders {
  ok: true;
  entries: readonly [string, string][];
  hasAuthorization: boolean;
}

export interface RejectedHeaders {
  ok: false;
  code: HeaderRejectionCode;
  message: string;
}

export type HeaderValidationResult = ValidatedHeaders | RejectedHeaders;

export interface HealthDimensionReport {
  status: HealthDimensionStatus;
  summary: string;
}

export interface Finding {
  code: string;
  category: FindingCategory;
  severity: FindingSeverity;
  message: string;
  phase?: McpTesterPhase;
  details?: Readonly<Record<string, JsonPrimitive>>;
}

export interface TimelineEvent {
  index: number;
  atMs: number;
  phase: McpTesterPhase;
  kind: TimelineEventKind;
  durationMs?: number;
  details?: Readonly<Record<string, JsonPrimitive>>;
}

export interface PhaseReport {
  phase: McpTesterPhase;
  outcome: PhaseOutcome;
  durationMs: number;
}

export interface PhaseTiming {
  phase: McpTesterPhase | "total";
  durationMs: number;
}

export interface ServerIdentity {
  name?: string;
  version?: string;
}

export interface ProtocolSummary {
  requestedVersion: string;
  negotiatedVersion?: string;
  clientName: string;
  clientVersion: string;
  sessionIdPresent: boolean;
}

export interface CapabilitySummary {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
}

export interface ToolSummary {
  name: string;
  description?: string;
  inputSchemaKind?: string;
  inputSchemaPropertyCount?: number;
}

export interface ResourceSummary {
  name: string;
  uri?: string;
  description?: string;
  mimeType?: string;
}

export interface PromptSummary {
  name: string;
  description?: string;
  argumentCount?: number;
}

export interface CatalogSummary<T> {
  items: readonly T[];
  count: number;
  pages: number;
  complete: boolean;
  truncated: boolean;
}

export interface McpTesterReport {
  schemaVersion: "mcp-tester-report.v1";
  observedAt: string;
  durationMs: number;
  verdict: McpTesterVerdict;
  verdictMessage: string;
  endpoint: SafeEndpoint;
  transport: {
    kind: "streamable_http";
    scheme: "https";
    browserDirect: true;
  };
  protocol?: ProtocolSummary;
  server?: ServerIdentity;
  capabilities: CapabilitySummary;
  healthDimensions: Readonly<Record<HealthDimensionName, HealthDimensionReport>>;
  phases: readonly PhaseReport[];
  timings: readonly PhaseTiming[];
  timeline: readonly TimelineEvent[];
  timelineTruncated: boolean;
  findings: readonly Finding[];
  tools: CatalogSummary<ToolSummary>;
  resources: CatalogSummary<ResourceSummary>;
  prompts: CatalogSummary<PromptSummary>;
  limitations: readonly string[];
}
