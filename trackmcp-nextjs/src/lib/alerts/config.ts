import { ALERT_POLICY_VERSION, MAX_DESTINATIONS_PER_ALERT, MAX_ENVIRONMENT, MAX_TOOL_NAME, boundedOptionalString, isRegressionMetric } from "./policy.ts";

export type AlertConfigInput = {
  metric: string;
  tool_name: string | null;
  environment: string | null;
  destination_ids: string[];
  enabled: boolean;
  paused: boolean;
};

export function parseAlertConfigInput(body: unknown, partial = false): AlertConfigInput | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Request body must be an object." };
  const record = body as Record<string, unknown>;
  const metric = record.metric;
  if (!partial && !isRegressionMetric(metric)) return { error: "metric is unsupported." };
  if (partial && metric !== undefined && !isRegressionMetric(metric)) return { error: "metric is unsupported." };
  const toolName = boundedOptionalString(record.tool_name, MAX_TOOL_NAME);
  const environment = boundedOptionalString(record.environment, MAX_ENVIRONMENT);
  if (toolName === undefined) return { error: "tool_name must be a bounded string." };
  if (environment === undefined) return { error: "environment must be a bounded string." };
  const rawDestinations = record.destination_ids;
  if (rawDestinations !== undefined && (!Array.isArray(rawDestinations) || rawDestinations.length > MAX_DESTINATIONS_PER_ALERT || rawDestinations.some((value) => typeof value !== "string" || value.length > 128))) return { error: "destination_ids must contain at most 10 bounded IDs." };
  return {
    metric: typeof metric === "string" ? metric : "",
    tool_name: toolName === undefined ? null : toolName,
    environment: environment === undefined ? null : environment,
    destination_ids: rawDestinations === undefined ? [] : rawDestinations as string[],
    enabled: typeof record.enabled === "boolean" ? record.enabled : true,
    paused: typeof record.paused === "boolean" ? record.paused : false,
  };
}

export function configRow(workspaceId: string, input: AlertConfigInput): Record<string, unknown> {
  return { workspace_id: workspaceId, metric: input.metric, tool_name: input.tool_name, environment: input.environment, destination_ids: input.destination_ids, policy_version: ALERT_POLICY_VERSION, enabled: input.enabled, paused: input.paused, updated_at: new Date().toISOString() };
}

type DestinationQuery = {
  select: (columns: string) => DestinationQuery;
  eq: (field: string, value: unknown) => DestinationQuery;
  in: (field: string, values: string[]) => DestinationQuery;
  limit: (value: number) => Promise<{ data: Array<{ id: string }> | null; error: unknown }>;
};

export async function destinationsBelongToWorkspace(admin: unknown, workspaceId: string, ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  const queryClient = admin as { from: (table: string) => DestinationQuery };
  const result = await queryClient.from("trackmcp_alert_destinations").select("id").eq("workspace_id", workspaceId).in("id", ids).limit(ids.length);
  return !result.error && (result.data || []).length === ids.length;
}
