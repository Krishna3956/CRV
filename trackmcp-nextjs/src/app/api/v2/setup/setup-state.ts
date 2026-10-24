/** Preserve explicit unresolved identity while keeping legacy rows unknown. */
export function accountResolverObservation(source: unknown): boolean | null {
  if (source === "resolver") return true;
  if (source === "unresolved") return false;
  return null;
}

/** Compare the latest observed labels with a non-secret connection-key scope. */
export function setupScopeMatch(input: {
  key: { service?: string | null; environment?: string | null } | null;
  event: { service?: unknown; environment?: unknown } | undefined;
}): boolean | null {
  if (!input.key || !input.event) return null;
  const serviceMatches = !input.key.service || input.event.service === input.key.service;
  const environmentMatches = !input.key.environment || input.event.environment === input.key.environment;
  return serviceMatches && environmentMatches;
}

export type SetupConnectionState =
  | "server_created"
  | "key_ready"
  | "waiting_for_first_event"
  | "connected_limited_coverage"
  | "connected"
  | "authentication_failed"
  | "insufficient_evidence"
  | "integration_error";

/**
 * A received row only earns the connected state when it contains the minimum
 * bounded evidence the product needs to describe an MCP integration. Missing
 * fields are limited coverage, never a silently green connection.
 */
export function setupConnectionState(input: {
  hasKey: boolean;
  hasEvent: boolean;
  mcpMethodObserved: boolean;
  transportObserved: boolean;
  privacyPolicyApplied: boolean;
}): SetupConnectionState {
  if (!input.hasKey) return "server_created";
  if (!input.hasEvent) return "waiting_for_first_event";
  if (!input.mcpMethodObserved || !input.transportObserved || !input.privacyPolicyApplied) return "connected_limited_coverage";
  return "connected";
}
