import type { TrackMCPCorrelationHandleSource, TrackMCPIntentSource, TrackMCPObservationSource, TrackMCPSessionIdSource } from "./types.ts";
import type { TrackMCPOutcomeAggregate } from "./outcomes.ts";
import type { TrackMCPDataTrust } from "./data-trust.ts";

export type CompletionSource = "workflow_events" | "session_heuristic" | "none";
export type CorrelationQuality = "session_id" | "transport_generated" | "external" | "issued" | "missing" | "mixed";

export type CatalogTool = {
  name: string;
  description: string | null;
  tool_description_hash: string | null;
  schema_hash: string | null;
};

/** Privacy-safe catalog lineage exposed to the dashboard. Names, URIs, and
 * catalog payloads never leave the server; hashes are only for comparison. */
export type CatalogVersion = {
  id: string | null;
  server_id: string | null;
  environment_id: string | null;
  catalog_kind: string | null;
  item_count: number | null;
  item_name_hashes: string[];
  item_uri_hashes: string[];
  snapshot_hash: string | null;
  previous_snapshot_id: string | null;
  complete: boolean;
  truncated: boolean;
  diff: Record<string, unknown>;
  discovered_at: string | null;
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
  services: string[];
  environments: string[];
  deployment_summary?: { observed_deployments: number; linked_events: number; limitation: string };
  transports: string[];
  methods: string[];
  interaction_surfaces?: {
    resources: { events: number; methods: string[]; entity_count: number; entity_identity: "sha256_hash_count"; entity_analytics: EntityReadAnalytics };
    prompts: { events: number; methods: string[]; entity_count: number; entity_identity: "sha256_hash_count"; entity_analytics: EntityReadAnalytics };
  };
  protocol_signals?: {
    notification: number;
    progress: number;
    cancelled: number;
    catalog_changed: number;
    resource_changed: number;
    subscription_started: number;
    subscription_stopped: number;
    observed_events: number;
    timeline?: Array<{ date: string; notification: number; progress: number; cancelled: number; catalog_changed: number; resource_changed: number; subscription_started: number; subscription_stopped: number; observed_events: number }>;
  };
  /** Counts of bounded modern protocol families observed by the SDK observer. */
  protocol_family_activity?: Array<{ family: "sampling" | "elicitation" | "completion" | "tasks" | "control_signal" | "resources" | "prompts" | "tools" | "subscriptions" | "notifications"; observations: number }>;
  protocol_family_outcomes?: Array<{ family: "sampling" | "elicitation" | "completion" | "tasks" | "control_signal" | "resources" | "prompts" | "tools" | "subscriptions" | "notifications"; observations: number; errors: number; input_required: number; unknown: number }>;
  tool_calls: number;
  sessions: number;
  errors: number;
  completion_rate: number | null;
  completion_source?: CompletionSource;
  correlation_quality?: CorrelationQuality;
  funnel: { connections: number; discovered_tools: number; tool_calls: number; successful_calls: number };
  tool_adoption?: { advertised: number; observed: number; breadth: number | null; unused: number };
  timeline: { date: string; events: number; calls: number; errors: number }[];
  clients: { name: string; calls: number; versions?: string[] }[];
  /** Founder OS "Who's using it" read model. Account labels are deliberately
   * omitted because MCP does not define customer identity and resolver keys
   * must never be exposed to the browser. */
  who_is_using_it?: {
    active_accounts: number;
    previous_period_active_accounts: number;
    new_accounts: number | null;
    returning_accounts: number | null;
    classification_status: "available" | "insufficient_data";
    /** ISO week starts, in UTC. The People surface never presents this as a
     * daily retention series because account adoption is a weekly signal. */
    growth: Array<{ period_start: string; active_accounts: number }>;
    client_breakdown: Array<{ name: string; calls: number; share: number | null; identity_source: "self_reported" | "unrecognized" }>;
    top_accounts: Array<{ rank: number; activity_count: number; active_days: number; identity_source: "resolver" }>;
    identity_coverage: number | null;
    limitation: string;
  };
  /** Founder OS "What they're doing" read model. */
  capability_activity?: {
    total_calls: number;
    previous_period_calls: number;
    overall_error_rate: number | null;
    avg_tools_used_per_account: number | null;
    advertised_tools: number;
    adoption_distribution: Array<{ bucket: "1 tool" | "2-3 tools" | "4-6 tools" | "7+ tools"; accounts: number }>;
    trend: Array<{ period_start: string; tool_name: string; calls: number }>;
    reliability: Array<{ tool_name: string; calls: number; error_rate: number | null; input_required_rate: number | null; p95_ms: number | null }>;
    /** Tool drill-downs deliberately contain ranked activity only: resolver
     * keys and customer names never cross the browser boundary. */
    tool_details: Array<{
      tool_name: string;
      calls: number;
      error_rate: number | null;
      p95_ms: number | null;
      top_accounts: Array<{ rank: number; calls: number }>;
      trend: Array<{ period_start: string; calls: number; errors: number }>;
    }>;
    limitation: string;
  };
  /** Founder OS "Resources & Prompts" read model. Names remain bounded to
   * protocol methods/hashed identities because raw catalog names and inputs
   * are not safe dashboard dimensions. */
  resource_prompt_activity?: {
    /** Logical reads/calls, with only explicitly linked retries collapsed. */
    resource_reads: number;
    prompt_calls: number;
    /** Physical protocol observations remain visible so retry collapse is not hidden. */
    resource_observations: number;
    prompt_observations: number;
    previous_period_resource_reads: number;
    previous_period_prompt_calls: number;
    resource_completion_rate: number | null;
    resource_stall_rate: number | null;
    resource_error_rate: number | null;
    prompt_completion_rate: number | null;
    prompt_stall_rate: number | null;
    prompt_error_rate: number | null;
    /** Last explicit outcome per safely-linked interaction. Missing result_type
     * is not converted into an error; failed transport/server evidence is. */
    outcomes: Array<{ kind: "resource" | "prompt"; interactions: number; complete: number; stalled: number; errored: number; unknown: number; linked_retry_count: number }>;
    resource_breakdown: Array<{ name: string; calls: number; share: number | null; completion_rate: number | null; stall_rate: number | null; error_rate: number | null; unknown_rate: number | null }>;
    prompt_breakdown: Array<{ name: string; calls: number; share: number | null; completion_rate: number | null; stall_rate: number | null; error_rate: number | null; unknown_rate: number | null }>;
    trend: Array<{ period_start: string; kind: "resource" | "prompt"; name: string; calls: number }>;
    limitation: string;
  };
  /** Founder OS "The journey" read model. Journeys are bounded server-side
   * interaction paths, not claims about a customer's whole business task. */
  journey_activity?: {
    interaction_count: number;
    typical_journey_length: number | null;
    stalled_interactions: number;
    resumed_after_stall: number;
    common_paths: Array<{ path: string[]; interactions: number; share: number | null }>;
    drop_off: Array<{ path: string[]; interactions: number; terminal_evidence: "explicit_error" | "input_required" | "unknown" }>;
    limitation: string;
  };
  /** Founder OS "Did it work" read model, keeping unknown evidence visible. */
  outcome_activity?: {
    completed: number;
    failed: number;
    pending: number;
    unknown: number;
    not_observable: number;
    completion_rate: number | null;
    error_rate: number | null;
    /** Latest state per opaque task handle, from explicit task evidence only. */
    task_states: { working: number; input_required: number; completed: number; failed: number; cancelled: number; expired: number; unknown: number };
    trend: Array<{ period_start: string; completed: number; failed: number; unknown: number; pending: number }>;
    limitation: string;
  };
  /** Founder OS "What's broken" signal summary. */
  issue_activity?: {
    actionable_signals: number;
    high_confidence_signals: number;
    affected_volume: number | null;
    suggested_actions: number;
    limitation: string;
  };
  /** Privacy-safe account activity signals. Keys are never exposed to the UI. */
  account_summary?: {
    observed_account_keys: number;
    active_account_keys: number;
    active_account_keys_7d: number;
    returning_account_keys: number;
    account_activity_bands: { one_event: number; repeat: number; high_activity: number };
    eligible_events: number;
    resolver_linked_events: number;
    unresolved_events: number;
    resolver_coverage: number | null;
    limitation: string;
  };
  tools: { name: string; calls: number; errors: number; error_rate: number; avg_ms: number | null; p50_ms?: number | null; p95_ms?: number | null; latency_sample_count?: number; discovered: boolean; description?: string | null; schema_hash?: string | null }[];
  catalog_tools?: CatalogTool[];
  catalog_versions?: CatalogVersion[];
  catalog_next_cursor?: string | null;
  catalog_version_status?: "available" | "no_snapshot_rows" | "schema_unavailable" | string;
  refresh_status?: {
    status: "available" | "degraded" | "no_jobs" | "schema_unavailable" | string;
    queued: number;
    running: number;
    retryable: number;
    failed: number;
    succeeded: number;
    max_queue_lag_ms: number;
    max_attempt_count: number;
    last_successful_run: string | null;
    worker_health?: {
      metric: "backlog" | "lag" | "dead_letter" | "success_rate";
      state: "insufficient_data" | "normal" | "warning" | "critical";
      sample_count: number;
      value: number | null;
      threshold: { warning: number; critical: number };
      unit: "jobs" | "minutes" | "ratio";
      reasons: string[];
    }[];
  };
  unused_tools: string[];
  workflows: { session_id: string; correlation_handle?: string | null; correlation_handle_source?: TrackMCPCorrelationHandleSource; client_name: string; calls: number; tools: (string | null)[]; started_at: string; duration_ms: number; completed: boolean; completion_source?: CompletionSource; correlation_quality?: CorrelationQuality }[];
  correlation_handle_source?: TrackMCPCorrelationHandleSource | null;
  intent_sources: IntentSourceCounts;
  missing_capabilities: MissingCapability[];
  outcomes: { name: string; started: number; completed: number; failed: number; unresolved: number }[];
  insights: { level: string; title: string; detail: string; metric: string; affected_volume?: number | null; confidence?: "high" | "medium" | "low" | null; suggested_action?: string | null }[];
  /** Versioned, uncertainty-aware facts exposed by the Founder OS read model. */
  founder_os?: {
    facts: TrackMCPOutcomeAggregate;
    groups: Record<string, TrackMCPOutcomeAggregate[]>;
    identity_coverage?: {
      numerator: number;
      denominator: number;
      value: number | null;
      source: "account_identity_source=resolver";
      limitation: string;
    };
    identity_source_counts?: { resolver: number; unresolved: number };
    tasks?: { task_id_hash: string; state: "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired" | "unknown"; first_observed_at: string; last_observed_at: string; observations: number; terminal: boolean; evidence_quality: "observed" | "insufficient_data" | "conflicting" }[];
  };
  /** Query provenance and bounded-scan disclosure for every dashboard result. */
  data_trust?: TrackMCPDataTrust;
};

export type EntityReadAnalytics = {
  status: "available" | "no_rows" | "schema_unavailable";
  read_events: number;
  successful_reads: number;
  failed_reads: number;
  input_required_reads: number;
};
