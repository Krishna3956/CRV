import type { TrackMCPFact } from "./facts.ts";

/**
 * Bounded provenance for a task handle. A task ID is only unique within the
 * server/environment that issued it, so this scope must travel with the
 * one-way task hash. Raw endpoint URLs and task payloads are never included.
 */
export type TrackMCPTaskScope = {
  service: string;
  environment: string;
  server_id: string | null;
  transport: "stdio" | "streamable_http" | "sse" | "custom" | "unknown";
};

export function taskScopeForFact(fact: Pick<TrackMCPFact, "service" | "environment" | "dimensions">): TrackMCPTaskScope {
  const transport = fact.dimensions.transport;
  return {
    service: fact.service.slice(0, 128),
    environment: fact.environment.slice(0, 64),
    server_id: fact.dimensions.server_id?.slice(0, 128) ?? null,
    transport: transport === "stdio" || transport === "streamable_http" || transport === "sse" || transport === "custom" ? transport : "unknown",
  };
}

export function taskScopeKey(scope: TrackMCPTaskScope): string {
  return JSON.stringify([scope.service, scope.environment, scope.server_id, scope.transport]);
}

export function normalizeTaskScope(value: Partial<TrackMCPTaskScope> | null | undefined): TrackMCPTaskScope {
  const transport = value?.transport;
  return {
    service: typeof value?.service === "string" && value.service.trim() ? value.service.slice(0, 128) : "unknown",
    environment: typeof value?.environment === "string" && value.environment.trim() ? value.environment.slice(0, 64) : "unknown",
    server_id: typeof value?.server_id === "string" && value.server_id.trim() ? value.server_id.slice(0, 128) : null,
    transport: transport === "stdio" || transport === "streamable_http" || transport === "sse" || transport === "custom" ? transport : "unknown",
  };
}
