export const MODERN_MCP_PROTOCOL_VERSION = "2026-07-28" as const;

const MAX_BODY_BYTES = 256 * 1024;
const MAX_STRING_LENGTH = 256;
const MAX_VERSIONS = 16;
const MAX_CAPABILITIES = 32;
const MAX_TOOLS = 128;
const MAX_TASKS = 32;

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

export type ModernMcpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type ModernMcpToolPage = {
  tools: ModernMcpTool[];
  nextCursor?: string;
};

export type ModernMcpTask = {
  taskId: string;
  status: string;
};

export type ModernMcpTaskPage = {
  tasks: ModernMcpTask[];
  nextCursor?: string;
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

  private async request(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
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
    headers.set("mcp-method", method);
    try {
      const response = await (this.options.fetch ?? globalThis.fetch)(endpoint, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), redirect: "manual", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new ModernMcpProtocolError("http_error", `Modern MCP ${method} returned a non-success status.`, response.status);
      const contentLength = response.headers.get("content-length");
      if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_BODY_BYTES) throw new ModernMcpProtocolError("response_too_large", `Modern MCP ${method} response exceeded the bounded response limit.`);
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new ModernMcpProtocolError("response_too_large", `Modern MCP ${method} response exceeded the bounded response limit.`);
      let envelope: unknown;
      try { envelope = JSON.parse(text); } catch { throw new ModernMcpProtocolError("invalid_response", `Modern MCP ${method} returned invalid JSON.`); }
      if (!boundedObject(envelope) || !boundedObject(envelope.result)) throw new ModernMcpProtocolError("invalid_response", `Modern MCP ${method} returned an invalid result envelope.`);
      return envelope.result;
    } catch (error) {
      if (error instanceof ModernMcpProtocolError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new ModernMcpProtocolError("timeout", `Modern MCP ${method} timed out.`);
      throw new ModernMcpProtocolError("network_error", `Modern MCP ${method} could not reach the endpoint.`);
    } finally { clearTimeout(timer); }
  }

  async discover(): Promise<ModernMcpDiscovery> {
    const result = await this.request("server/discover", {});
      const supportedVersions = Array.isArray(result.supportedVersions) ? [...new Set(result.supportedVersions.map(boundedString).filter((value): value is string => Boolean(value)))].slice(0, MAX_VERSIONS) : undefined;
      const serverInfo = boundedObject(result.serverInfo) ? { name: boundedString(result.serverInfo.name), version: boundedString(result.serverInfo.version) } : undefined;
      const capabilityNames = boundedObject(result.capabilities) ? Object.keys(result.capabilities).filter((name) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name)).slice(0, MAX_CAPABILITIES) : [];
      return { protocolVersion: MODERN_MCP_PROTOCOL_VERSION, ...(supportedVersions?.length ? { supportedVersions } : {}), ...(serverInfo ? { serverInfo } : {}), capabilityNames };
  }

  /** Retrieve one bounded, cursor-based tools/list catalog page. */
  async listTools(cursor?: string): Promise<ModernMcpToolPage> {
    const result = await this.request("tools/list", cursor ? { cursor: cursor.slice(0, MAX_STRING_LENGTH) } : {});
    if (!Array.isArray(result.tools)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tools/list returned no tools array.");
    const tools = result.tools.slice(0, MAX_TOOLS).flatMap((value): ModernMcpTool[] => {
      if (!boundedObject(value)) return [];
      const name = boundedString(value.name);
      if (!name || !/^[A-Za-z0-9_.-]{1,128}$/.test(name)) return [];
      const description = boundedString(value.description);
      const inputSchema = boundedObject(value.inputSchema) ? value.inputSchema : undefined;
      return [{ name, ...(description ? { description } : {}), ...(inputSchema ? { inputSchema } : {}) }];
    });
    const nextCursor = boundedString(result.nextCursor);
    return { tools, ...(nextCursor ? { nextCursor } : {}) };
  }

  /** Retrieve one bounded, cursor-based task status page. This observes task
   * state only; it never creates, cancels, or completes a task. */
  async listTasks(cursor?: string): Promise<ModernMcpTaskPage> {
    const result = await this.request("tasks/list", cursor ? { cursor: cursor.slice(0, MAX_STRING_LENGTH), limit: MAX_TASKS } : { limit: MAX_TASKS });
    if (!Array.isArray(result.tasks)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/list returned no tasks array.");
    const tasks = result.tasks.slice(0, MAX_TASKS).flatMap((value): ModernMcpTask[] => {
      if (!boundedObject(value)) return [];
      const taskId = boundedString(value.taskId);
      const status = boundedString(value.status);
      if (!taskId || !status || !/^[A-Za-z0-9_.:-]{1,256}$/.test(taskId)) return [];
      return [{ taskId, status }];
    });
    const nextCursor = boundedString(result.nextCursor);
    return { tasks, ...(nextCursor ? { nextCursor } : {}) };
  }

  /** Retrieve one task's bounded status. This is observation only. */
  async getTask(taskId: string): Promise<ModernMcpTask> {
    if (!/^[A-Za-z0-9_.:-]{1,256}$/.test(taskId)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/get requires a bounded opaque task identifier.");
    const result = await this.request("tasks/get", { taskId: taskId.slice(0, MAX_STRING_LENGTH) });
    const boundedTaskId = boundedString(result.taskId);
    const status = boundedString(result.status);
    if (!boundedTaskId || !status || !/^[A-Za-z0-9_.:-]{1,256}$/.test(boundedTaskId)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/get returned an invalid task status.");
    return { taskId: boundedTaskId, status };
  }
}
