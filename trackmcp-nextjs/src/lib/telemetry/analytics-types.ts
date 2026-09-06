import type { TrackMCPSessionIdSource } from "./types.ts";

export type CompletionSource = "workflow_events" | "session_heuristic" | "none";
export type CorrelationQuality = "session_id" | "transport_generated" | "missing" | "mixed";

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
  direction: string | null;
  transport: string | null;
  protocol_version: string | null;
  mcp_method: string | null;
  request_id: string | null;
  session_id: string | null;
  session_id_source: TrackMCPSessionIdSource | null;
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
  session_id: string;
  correlation_quality: CorrelationQuality;
  completion_source: CompletionSource;
  event_count: number;
  truncated: boolean;
  events: TraceEvent[];
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
  workflows: { session_id: string; client_name: string; calls: number; tools: (string | null)[]; started_at: string; duration_ms: number; completed: boolean; completion_source?: CompletionSource; correlation_quality?: CorrelationQuality }[];
  outcomes: { name: string; started: number; completed: number; failed: number }[];
  insights: { level: string; title: string; detail: string; metric: string }[];
};
