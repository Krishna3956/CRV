import { sendWeb3Form } from "../web3forms.ts";
import type { McpTesterReport } from "./types.ts";

export type McpTesterMode = "tester" | "health" | "inspector";

const MODE_LABELS: Record<McpTesterMode, string> = {
  tester: "MCP Server Tester",
  health: "MCP Health Check",
  inspector: "MCP Inspector",
};

function safeField(value: unknown, fallback = "Not reported"): string {
  const text = typeof value === "string" ? value : value === undefined || value === null ? fallback : String(value);
  return text.replace(/[\r\n]+/g, " ").slice(0, 256);
}

function safeEmail(value: string | undefined): string | undefined {
  const email = value?.trim().slice(0, 254);
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export function buildMcpTestNotification({
  mode,
  email,
  customHeaderCount,
  report,
}: {
  mode: McpTesterMode;
  email?: string;
  customHeaderCount: number;
  report: McpTesterReport;
}): Record<string, unknown> & { subject: string } {
  const tool = MODE_LABELS[mode];
  const endpoint = `${safeField(report.endpoint.origin)}${safeField(report.endpoint.pathname, "/")}`;
  const capabilityNames = [
    report.capabilities.tools && "tools",
    report.capabilities.resources && "resources",
    report.capabilities.prompts && "prompts",
  ].filter(Boolean).join(", ") || "None advertised";
  const findingCategories = [...new Set(report.findings.map((finding) => finding.category))].join(", ") || "None";
  const safeContact = safeEmail(email);

  return {
    subject: "TrackMCP MCP tool test notification",
    from_name: `TrackMCP · ${tool}`,
    ...(safeContact ? { email: safeContact } : {}),
    name: safeContact || `Anonymous ${tool}`,
    tool,
    endpoint,
    query_parameters_present: report.endpoint.queryPresent ? "Yes, values omitted" : "No",
    verdict: report.verdict,
    server: report.server?.name ? safeField(report.server.name) : "Not reported",
    server_version: report.server?.version ? safeField(report.server.version) : "Not reported",
    protocol_version: safeField(report.protocol?.negotiatedVersion, "Not negotiated"),
    capabilities: capabilityNames,
    tools_found: report.tools.count,
    resources_found: report.resources.count,
    prompts_found: report.prompts.count,
    duration_ms: report.durationMs,
    custom_headers_supplied: customHeaderCount,
    findings: findingCategories,
    observed_at: safeField(report.observedAt),
    message: [
      `Tool used: ${tool}`,
      `Endpoint: ${endpoint}`,
      `Query parameters present: ${report.endpoint.queryPresent ? "yes, values omitted" : "no"}`,
      `Verdict: ${safeField(report.verdict)}`,
      `Server: ${report.server?.name ? safeField(report.server.name) : "not reported"}`,
      `Protocol: ${safeField(report.protocol?.negotiatedVersion, "not negotiated")}`,
      `Capabilities: ${capabilityNames}`,
      `Catalog counts: ${report.tools.count} tools, ${report.resources.count} resources, ${report.prompts.count} prompts`,
      `Duration: ${report.durationMs} ms`,
      `Custom headers supplied: ${customHeaderCount}; values intentionally omitted`,
      `Finding categories: ${findingCategories}`,
      `Observed at: ${safeField(report.observedAt)}`,
      "Privacy: credentials, header values, query values, and raw MCP payloads were not included.",
    ].join("\n"),
  };
}

export async function sendMcpTestNotification(input: Parameters<typeof buildMcpTestNotification>[0]): Promise<{ ok: boolean }> {
  return sendWeb3Form(buildMcpTestNotification(input));
}
