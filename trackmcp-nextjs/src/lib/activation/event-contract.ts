export const ACTIVATION_EVENT_TYPES = new Set([
  "signup_completed",
  "workspace_created",
  "api_key_created",
  "api_key_copied",
  "setup_snippet_copied",
  "first_event_check_started",
  "first_event_check_result",
  "first_telemetry_seen",
]);

export const ACTIVATION_EVENT_SOURCES = new Set([
  "npm",
  "sdk_docs",
  "github",
  "ai",
  "direct",
  "device",
  "unknown",
]);

export const ACTIVATION_RESULT_CATEGORIES = new Set([
  "event_found",
  "no_event",
  "unauthorized",
  "permission_denied",
  "retryable_error",
  "unknown",
]);

const ACTIVATION_EVENT_FIELDS = new Set([
  "event_id",
  "event_type",
  "source",
  "workspace_id",
  "package_name",
  "package_version",
  "content_path",
  "result_category",
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ActivationEventPayload = {
  eventId: string;
  eventType: string;
  source: string;
  workspaceId: string | null;
  packageName: string | null;
  packageVersion: string | null;
  contentPath: string | null;
  resultCategory: string | null;
};

function optionalText(value: unknown, maximum: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized && normalized.length <= maximum ? normalized : undefined;
}

/** Validate and normalize the only fields accepted by the server-side ledger. */
export function validateActivationEventBody(body: Record<string, unknown>): ActivationEventPayload | null {
  if (Object.keys(body).some((key) => !ACTIVATION_EVENT_FIELDS.has(key))) return null;
  const eventId = typeof body.event_id === "string" ? body.event_id.trim() : "";
  const eventType = typeof body.event_type === "string" ? body.event_type : "";
  const source = typeof body.source === "string" ? body.source : "unknown";
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(eventId) || !ACTIVATION_EVENT_TYPES.has(eventType) || !ACTIVATION_EVENT_SOURCES.has(source)) return null;

  const workspaceValue = optionalText(body.workspace_id, 64);
  const packageName = optionalText(body.package_name, 128);
  const packageVersion = optionalText(body.package_version, 64);
  const contentPath = optionalText(body.content_path, 256);
  const resultCategory = optionalText(body.result_category, 32);
  if (workspaceValue === undefined || (workspaceValue !== null && !UUID_PATTERN.test(workspaceValue))) return null;
  if (packageName === undefined || packageVersion === undefined || contentPath === undefined || resultCategory === undefined) return null;
  if (resultCategory !== null && !ACTIVATION_RESULT_CATEGORIES.has(resultCategory)) return null;

  return { eventId, eventType, source, workspaceId: workspaceValue, packageName, packageVersion, contentPath, resultCategory };
}
