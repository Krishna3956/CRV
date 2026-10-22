export const MODERN_MCP_PROTOCOL_VERSION = "2026-07-28" as const;

const MAX_BODY_BYTES = 256 * 1024;
const MAX_STRING_LENGTH = 256;
const MAX_VERSIONS = 16;
const MAX_CAPABILITIES = 32;
const MAX_TOOLS = 128;
const MAX_RESOURCES = 128;
const MAX_PROMPTS = 128;
const MAX_COLLECTION_PAGES = 16;
const MAX_COLLECTION_ITEMS = 512;

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

export type ModernMcpResource = {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
};

export type ModernMcpResourcePage = {
  resources: ModernMcpResource[];
  nextCursor?: string;
};

export type ModernMcpPrompt = {
  name: string;
  description?: string;
  argumentNames: string[];
};

export type ModernMcpPromptPage = {
  prompts: ModernMcpPrompt[];
  nextCursor?: string;
};

export type ModernMcpBoundedCollection<T> = {
  items: T[];
  truncated: boolean;
};

export type ModernMcpTask = {
  taskId: string;
  status: string;
};

export class ModernMcpProtocolError extends Error {
  readonly code: "invalid_endpoint" | "timeout" | "http_error" | "invalid_response" | "response_too_large" | "network_error" | "unsupported_method";
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

/** Bounded modern MCP request client. It exposes read-only catalog/task
 * operations and keeps JSON-RPC request identifiers unique per instance so
 * concurrent calls cannot be confused by a shared constant id. */
export class ModernMcpClient {
  private requestSequence = 0;

  constructor(private readonly options: ModernMcpClientOptions) {}

  private nextRequestId(): number {
    // Keep identifiers positive and bounded. Wrapping is safe because this
    // client resolves each request before returning its result; the value is
    // still unique for the active request set, including concurrent calls.
    this.requestSequence = this.requestSequence >= 2_000_000_000 ? 1 : this.requestSequence + 1;
    return this.requestSequence;
  }

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
    const requestId = this.nextRequestId();
    try {
      const response = await (this.options.fetch ?? globalThis.fetch)(endpoint, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }), redirect: "manual", credentials: "omit", signal: controller.signal });
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

  /** Follow opaque tools/list cursors within a bounded page and item budget. */
  async listAllTools(): Promise<ModernMcpBoundedCollection<ModernMcpTool>> {
    const items: ModernMcpTool[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < MAX_COLLECTION_PAGES; page += 1) {
      const result = await this.listTools(cursor);
      items.push(...result.tools.slice(0, Math.max(0, MAX_COLLECTION_ITEMS - items.length)));
      const nextCursor = result.nextCursor;
      const bounded = items.length >= MAX_COLLECTION_ITEMS || (nextCursor !== undefined && seen.has(nextCursor));
      if (!nextCursor || bounded) return { items, truncated: nextCursor !== undefined && bounded };
      seen.add(nextCursor);
      cursor = nextCursor;
    }
    return { items, truncated: Boolean(cursor) };
  }

  /** Retrieve one bounded, cursor-based resources/list catalog page. Raw
   * resource contents and read arguments are never requested or retained. */
  async listResources(cursor?: string): Promise<ModernMcpResourcePage> {
    const result = await this.request("resources/list", cursor ? { cursor: cursor.slice(0, MAX_STRING_LENGTH) } : {});
    if (!Array.isArray(result.resources)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP resources/list returned no resources array.");
    const resources = result.resources.slice(0, MAX_RESOURCES).flatMap((value): ModernMcpResource[] => {
      if (!boundedObject(value)) return [];
      const uri = boundedString(value.uri);
      if (!uri) return [];
      const name = boundedString(value.name);
      const description = boundedString(value.description);
      const mimeType = boundedString(value.mimeType);
      return [{ uri, ...(name ? { name } : {}), ...(description ? { description } : {}), ...(mimeType ? { mimeType } : {}) }];
    });
    const nextCursor = boundedString(result.nextCursor);
    return { resources, ...(nextCursor ? { nextCursor } : {}) };
  }

  /** Follow opaque resources/list cursors without reading resource contents. */
  async listAllResources(): Promise<ModernMcpBoundedCollection<ModernMcpResource>> {
    const items: ModernMcpResource[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < MAX_COLLECTION_PAGES; page += 1) {
      const result = await this.listResources(cursor);
      items.push(...result.resources.slice(0, Math.max(0, MAX_COLLECTION_ITEMS - items.length)));
      const nextCursor = result.nextCursor;
      const bounded = items.length >= MAX_COLLECTION_ITEMS || (nextCursor !== undefined && seen.has(nextCursor));
      if (!nextCursor || bounded) return { items, truncated: nextCursor !== undefined && bounded };
      seen.add(nextCursor);
      cursor = nextCursor;
    }
    return { items, truncated: Boolean(cursor) };
  }

  /** Retrieve one bounded, cursor-based prompts/list catalog page. Prompt
   * argument values are never requested or retained; only argument names are
   * returned for catalog display. */
  async listPrompts(cursor?: string): Promise<ModernMcpPromptPage> {
    const result = await this.request("prompts/list", cursor ? { cursor: cursor.slice(0, MAX_STRING_LENGTH) } : {});
    if (!Array.isArray(result.prompts)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP prompts/list returned no prompts array.");
    const prompts = result.prompts.slice(0, MAX_PROMPTS).flatMap((value): ModernMcpPrompt[] => {
      if (!boundedObject(value)) return [];
      const name = boundedString(value.name);
      if (!name || !/^[A-Za-z0-9_.-]{1,128}$/.test(name)) return [];
      const description = boundedString(value.description);
      const argumentNames = Array.isArray(value.arguments)
        ? value.arguments.slice(0, MAX_CAPABILITIES).flatMap((argument): string[] => boundedObject(argument) ? [boundedString(argument.name)].filter((item): item is string => Boolean(item)) : [])
        : [];
      return [{ name, ...(description ? { description } : {}), argumentNames }];
    });
    const nextCursor = boundedString(result.nextCursor);
    return { prompts, ...(nextCursor ? { nextCursor } : {}) };
  }

  /** Follow opaque prompts/list cursors without requesting prompt arguments. */
  async listAllPrompts(): Promise<ModernMcpBoundedCollection<ModernMcpPrompt>> {
    const items: ModernMcpPrompt[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < MAX_COLLECTION_PAGES; page += 1) {
      const result = await this.listPrompts(cursor);
      items.push(...result.prompts.slice(0, Math.max(0, MAX_COLLECTION_ITEMS - items.length)));
      const nextCursor = result.nextCursor;
      const bounded = items.length >= MAX_COLLECTION_ITEMS || (nextCursor !== undefined && seen.has(nextCursor));
      if (!nextCursor || bounded) return { items, truncated: nextCursor !== undefined && bounded };
      seen.add(nextCursor);
      cursor = nextCursor;
    }
    return { items, truncated: Boolean(cursor) };
  }

  /**
   * `tasks/list` was removed from the modern Tasks extension. Keep this
   * compatibility-shaped method only as a fail-closed guard so an older
   * caller cannot accidentally send a non-conformant request.
   */
  async listTasks(): Promise<never> {
    throw new ModernMcpProtocolError("unsupported_method", "Modern MCP does not define tasks/list; observe task handles from server-directed responses and use getTask for an explicit handle.");
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
