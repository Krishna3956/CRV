export const MODERN_MCP_PROTOCOL_VERSION = "2026-07-28" as const;

const MAX_BODY_BYTES = 256 * 1024;
const MAX_STRING_LENGTH = 256;
const MAX_VERSIONS = 16;
const MAX_CAPABILITIES = 32;

export type ModernMcpDiscovery = {
  protocolVersion: typeof MODERN_MCP_PROTOCOL_VERSION;
  supportedVersions?: string[];
  serverInfo?: { name?: string; version?: string };
  capabilityNames: string[];
};

export type ModernMcpClientOptions = {
  endpoint: string | URL;
  fetch?: typeof globalThis.fetch;
  headers?: Readonly<Record<string, string>>;
  timeoutMs?: number;
};

export class ModernMcpProtocolError extends Error {
  readonly code: "invalid_endpoint" | "timeout" | "http_error" | "invalid_response" | "response_too_large" | "network_error";
  readonly status?: number;
  constructor(code: ModernMcpProtocolError["code"], message: string, status?: number) {
    super(message); this.name = "ModernMcpProtocolError"; this.code = code; this.status = status;
  }
}

function boundedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_STRING_LENGTH && !/[\u0000-\u001f\u007f]/.test(value) ? value : undefined;
}
function boundedObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Minimal modern MCP surface: stateless server/discover only. */
export class ModernMcpClient {
  constructor(private readonly options: ModernMcpClientOptions) {}

  async discover(): Promise<ModernMcpDiscovery> {
    let endpoint: URL;
    try {
      endpoint = new URL(this.options.endpoint);
      if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") throw new Error("unsupported scheme");
      if (endpoint.username || endpoint.password) throw new Error("credentials in URL");
    } catch { throw new ModernMcpProtocolError("invalid_endpoint", "Modern MCP endpoint must be HTTPS or localhost without URL credentials."); }
    const timeoutMs = Math.max(250, Math.min(30_000, Math.floor(this.options.timeoutMs ?? 10_000)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers = new Headers(this.options.headers);
    headers.set("accept", "application/json, text/event-stream");
    headers.set("content-type", "application/json");
    headers.set("mcp-protocol-version", MODERN_MCP_PROTOCOL_VERSION);
    headers.set("mcp-method", "server/discover");
    try {
      const response = await (this.options.fetch ?? globalThis.fetch)(endpoint, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server/discover", params: {} }), redirect: "manual", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new ModernMcpProtocolError("http_error", "Modern MCP discovery returned a non-success status.", response.status);
      const contentLength = response.headers.get("content-length");
      if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_BODY_BYTES) throw new ModernMcpProtocolError("response_too_large", "Modern MCP discovery response exceeded the bounded response limit.");
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new ModernMcpProtocolError("response_too_large", "Modern MCP discovery response exceeded the bounded response limit.");
      let envelope: unknown;
      try { envelope = JSON.parse(text); } catch { throw new ModernMcpProtocolError("invalid_response", "Modern MCP discovery returned invalid JSON."); }
      if (!boundedObject(envelope) || !boundedObject(envelope.result)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP discovery returned an invalid result envelope.");
      const result = envelope.result;
      const supportedVersions = Array.isArray(result.supportedVersions) ? [...new Set(result.supportedVersions.map(boundedString).filter((value): value is string => Boolean(value)))].slice(0, MAX_VERSIONS) : undefined;
      const serverInfo = boundedObject(result.serverInfo) ? { name: boundedString(result.serverInfo.name), version: boundedString(result.serverInfo.version) } : undefined;
      const capabilityNames = boundedObject(result.capabilities) ? Object.keys(result.capabilities).filter((name) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name)).slice(0, MAX_CAPABILITIES) : [];
      return { protocolVersion: MODERN_MCP_PROTOCOL_VERSION, ...(supportedVersions?.length ? { supportedVersions } : {}), ...(serverInfo ? { serverInfo } : {}), capabilityNames };
    } catch (error) {
      if (error instanceof ModernMcpProtocolError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new ModernMcpProtocolError("timeout", "Modern MCP discovery timed out.");
      throw new ModernMcpProtocolError("network_error", "Modern MCP discovery could not reach the endpoint.");
    } finally { clearTimeout(timer); }
  }
}
