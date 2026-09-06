import type { TrackMCPCorrelationHandleSource, TrackMCPIntentSource, TrackMCPObservationSource, TrackMCPSessionIdSource } from "./types.ts";

export type CompletionSource = "workflow_events" | "session_heuristic" | "none";
export type CorrelationQuality = "session_id" | "transport_generated" | "external" | "issued" | "missing" | "mixed";

export type CatalogTool = {
  name: string;
  description: string | null;
  tool_description_hash: string | null;
  schema_hash: string | null;
};

export type TraceEvent = {
  schema_version: string;
  event_id: string;
  event_type: "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";
  service: string;
  environment: string;
  server_id: string | null;
  deployment_id: string | null;
  server_version: string | null;
  sdk_version: string | null;
  observation_source: TrackMCPObservationSource | null;
  direction: string | null;
  transport: string | null;
  protocol_version: string | null;
  mcp_method: string | null;
  request_id: string | null;
  session_id: string | null;
  session_id_source: TrackMCPSessionIdSource | null;
  correlation_handle: string | null;
  correlation_handle_source: TrackMCPCorrelationHandleSource | null;
  context: string | null;
  intent_source: TrackMCPIntentSource | null;
  missing_capability: string | null;
  task_id: string | null;
  workflow_id: string | null;
  client_name: string | null;
  client_version: string | null;
  tool_name: string | null;
  tool_description: string | null;
  tool_description_hash: string | null;
  started_at: string;
  duration_ms: number | null;
  success: boolean | null;
  is_error: boolean | null;
  error_class: string | null;
  error_code: number | null;
  retry_number: number | null;
  schema_hash: string | null;
  payload_size_bytes: number | null;
  payload_policy: "metadata" | "redacted" | "full" | null;
  payload: Record<string, unknown> | null;
};

export type TraceResponse = {
  session_id: string | null;
  correlation_handle: string | null;
  correlation_handle_source: TrackMCPCorrelationHandleSource | null;
  correlation_quality: CorrelationQuality;
  completion_source: CompletionSource;
  event_count: number;
  truncated: boolean;
  events: TraceEvent[];
};

export type IntentSourceCounts = Record<TrackMCPIntentSource, number>;
export type MissingCapability = { name: string; reports: number };
export type ToolQualityInsufficientReason = "tool_volume" | "segment_volume" | "workflow_volume" | "catalog_volume" | "missing_grouping" | "uninspectable_result" | "bounded_source_scan";
export type ToolQualityMetricValues = {
  tool_call_share: number | null;
  error_rate: number | null;
  observable_empty_result_rate: number | null;
  retry_rate: number | null;
  observed_repeat_call_rate: number | null;
};
export type ToolQualitySegment = {
  value: string;
  call_count: number;
  session_count: number;
  tool_call_share: number | null;
  error_rate: number | null;
  insufficient_data: ToolQualityInsufficientReason[];
};
export type ToolQualityCatalogSnapshot = {
  name: string;
  description_hash: string | null;
  schema_hash: string | null;
  effective_from: string;
  effective_to: string | null;
  eligible_call_count: number;
};
export type ToolQualityTool = {
  name: string;
  observed: {
    call_count: number;
    successful_call_count: number;
    failed_call_count: number;
    known_outcome_call_count: number;
    inspectable_successful_result_count: number;
    empty_result_count: number;
    known_retry_call_count: number;
    retry_call_count: number;
    non_retry_call_count: number;
    observed_repeat_call_count: number;
    session_count: number;
    associated_workflow_call_count: number;
  };
  metrics: ToolQualityMetricValues;
  catalog_snapshots: ToolQualityCatalogSnapshot[];
  trace_session_ids: string[];
  completion_association: {
    explicit_workflow_count: number;
    terminal_workflow_count: number;
    explicitly_started_count: number;
    explicitly_completed_count: number;
    completion_rate: number | null;
    status: "associated_with_low_explicit_completion" | "not_flagged" | "insufficient_data";
    insufficient_data: ToolQualityInsufficientReason[];
  };
  breakdowns: { clients: ToolQualitySegment[]; intent_sources: ToolQualitySegment[] };
  insufficient_data: ToolQualityInsufficientReason[];
};
export type ToolQualityPath = {
  path: string[];
  associated_call_count: number;
  started_workflow_count: number;
  terminal_workflow_count: number;
  completed_workflow_count: number;
  completion_rate: number | null;
  status: "associated_with_low_explicit_completion" | "not_flagged" | "insufficient_data";
  insufficient_data: ToolQualityInsufficientReason[];
};
export type ToolQualityCatalogComparison = {
  tool_name: string;
  before: ToolQualityCatalogSnapshot;
  after: ToolQualityCatalogSnapshot;
  before_metrics: Pick<ToolQualityMetricValues, "error_rate" | "observable_empty_result_rate" | "retry_rate">;
  after_metrics: Pick<ToolQualityMetricValues, "error_rate" | "observable_empty_result_rate" | "retry_rate">;
  insufficient_data: ToolQualityInsufficientReason[];
};
export type ToolQualityInsight = {
  tool_name: string;
  path: string[];
  label: "Associated with low explicit completion";
  detail: string;
  metric: string;
  evidence: { workflow_count: number; associated_call_count: number; completion_rate: number };
};
export type ToolQualityResponse = {
  range_days: number;
  source_event_count: number;
  truncated: boolean;
  tools: ToolQualityTool[];
  tool_paths: ToolQualityPath[];
  advertised_but_unused: Array<{
    name: string;
    description_hash: string | null;
    schema_hash: string | null;
    observed_at: string;
  }>;
  catalog_comparisons: ToolQualityCatalogComparison[];
  insights: ToolQualityInsight[];
};

export type Analytics = {
  range_days: number;
  total_events: number;
  protocol_events: number;
  catalog_events: number;
  protocol_versions: string[];
  transports: string[];
  methods: string[];
  tool_calls: number;
  sessions: number;
  errors: number;
  completion_rate: number | null;
  completion_source?: CompletionSource;
  correlation_quality?: CorrelationQuality;
  funnel: { connections: number; discovered_tools: number; tool_calls: number; successful_calls: number };
  timeline: { date: string; events: number; calls: number; errors: number }[];
  clients: { name: string; calls: number; versions?: string[] }[];
  tools: { name: string; calls: number; errors: number; error_rate: number; avg_ms: number | null; p50_ms?: number | null; p95_ms?: number | null; latency_sample_count?: number; discovered: boolean; description?: string | null; schema_hash?: string | null }[];
  catalog_tools?: CatalogTool[];
  unused_tools: string[];
  workflows: { session_id: string; correlation_handle?: string | null; correlation_handle_source?: TrackMCPCorrelationHandleSource; client_name: string; calls: number; tools: (string | null)[]; started_at: string; duration_ms: number; completed: boolean; completion_source?: CompletionSource; correlation_quality?: CorrelationQuality }[];
  correlation_handle_source?: TrackMCPCorrelationHandleSource | null;
  intent_sources: IntentSourceCounts;
  missing_capabilities: MissingCapability[];
  outcomes: { name: string; started: number; completed: number; failed: number }[];
  insights: { level: string; title: string; detail: string; metric: string }[];
};
