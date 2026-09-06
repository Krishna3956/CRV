import type { HealthDimensionName, HealthDimensionReport, HealthDimensionStatus, McpTesterVerdict } from "./types.ts";

export interface HealthSignals {
  reachable: boolean;
  browserBlocked: boolean;
  authenticated: boolean;
  authenticationRequired: boolean;
  protocolPassed: boolean;
  identityPassed: boolean;
  discoveryPassed: boolean;
  paginationPassed: boolean;
  paginationTruncated: boolean;
  latencyMs: number;
  latencyWarningMs: number;
  catalogWarnings: number;
  toolsChecked: boolean;
  resourcesAdvertised: boolean;
  resourcesPassed: boolean;
  promptsAdvertised: boolean;
  promptsPassed: boolean;
  incomplete: boolean;
}

export function evaluateHealthDimensions(signals: HealthSignals): Readonly<Record<HealthDimensionName, HealthDimensionReport>> {
  const dimensions: Record<HealthDimensionName, HealthDimensionReport> = {
    reachability: dimension(signals.browserBlocked ? "blocked" : signals.reachable ? "pass" : "fail", signals.browserBlocked ? "The browser did not provide a usable response." : signals.reachable ? "The endpoint returned a usable HTTP response." : "No usable HTTP response was observed."),
    protocol_negotiation: dimension(signals.protocolPassed ? "pass" : signals.browserBlocked ? "blocked" : "fail", signals.protocolPassed ? "MCP initialization and version negotiation completed." : "MCP initialization did not complete."),
    server_identity: dimension(signals.identityPassed ? "pass" : signals.protocolPassed ? "warn" : "insufficient_evidence", signals.identityPassed ? "Server name and version were returned." : "Server identity was incomplete or unavailable."),
    capability_discovery: dimension(signals.discoveryPassed ? "pass" : signals.protocolPassed ? "fail" : "insufficient_evidence", signals.discoveryPassed ? "Advertised read-only catalogs were discovered." : "One or more read-only catalog phases did not complete."),
    pagination: dimension(signals.paginationPassed ? signals.paginationTruncated ? "warn" : "pass" : "fail", signals.paginationPassed ? signals.paginationTruncated ? "Pagination was safely bounded before all pages completed." : "Pagination completed without a repeated cursor." : "Pagination validation failed."),
    latency: dimension(signals.incomplete ? "warn" : signals.latencyMs > signals.latencyWarningMs ? "warn" : "pass", signals.incomplete ? "Timing is incomplete because the bounded test ended early." : signals.latencyMs > signals.latencyWarningMs ? "The observed test duration exceeded the latency warning threshold." : "Observed timing stayed within the warning threshold."),
    catalog_quality: dimension(signals.catalogWarnings > 0 ? "warn" : signals.discoveryPassed ? "pass" : "insufficient_evidence", signals.catalogWarnings > 0 ? "The discovered catalog contains quality findings." : signals.discoveryPassed ? "The discovered catalog passed basic shape checks." : "Catalog quality could not be evaluated completely."),
    browser_compatibility: dimension(signals.browserBlocked ? "blocked" : signals.reachable ? "pass" : "insufficient_evidence", signals.browserBlocked ? "CORS or browser network policy prevented a conclusion." : signals.reachable ? "The browser received direct HTTPS responses." : "Browser compatibility could not be established."),
    authentication: dimension(signals.authenticationRequired ? "fail" : signals.authenticated ? "pass" : "insufficient_evidence", signals.authenticationRequired ? "Authentication prevented a complete read-only test." : signals.authenticated ? "The request crossed the authentication boundary." : "Authentication status is unknown."),
  };
  return dimensions;
}

export function determineVerdict(signals: HealthSignals, protocolError: boolean, unreachable: boolean): McpTesterVerdict {
  if (signals.authenticationRequired) return "auth_required";
  if (signals.browserBlocked) return "browser_blocked";
  if (unreachable) return "unreachable";
  if (signals.incomplete || signals.paginationTruncated) return "incomplete";
  if (!signals.reachable && !signals.protocolPassed) return "unreachable";
  if (protocolError) return "protocol_error";
  if (!signals.protocolPassed) return "protocol_error";
  if (!signals.discoveryPassed || signals.catalogWarnings > 0 || signals.latencyMs > signals.latencyWarningMs || !signals.identityPassed || (signals.resourcesAdvertised && !signals.resourcesPassed) || (signals.promptsAdvertised && !signals.promptsPassed)) return "degraded";
  return "healthy_now";
}

function dimension(status: HealthDimensionStatus, summary: string): HealthDimensionReport {
  return { status, summary };
}
