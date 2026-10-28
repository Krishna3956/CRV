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
const MAX_TASK_INPUT_BYTES = 64 * 1024;
const MAX_TASK_STREAM_BYTES = 256 * 1024;
const MAX_TASK_STREAM_EVENTS = 64;
const MAX_SUBSCRIPTION_RESOURCE_URIS = 128;
const MAX_SUBSCRIPTION_URI_BYTES = 64 * 1024;
const DEFAULT_CLIENT_INFO = { name: "@trackmcp/sdk", version: "0.1.24" } as const;
const DEFAULT_CLIENT_CAPABILITIES = {} as const;
const TASK_EXTENSION_META = { "io.modelcontextprotocol/clientCapabilities": { extensions: { "io.modelcontextprotocol/tasks": {} } } } as const;

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
  /** Optional bounded identity advertised in every modern per-request _meta envelope. */
  clientInfo?: { name: string; version: string };
};

export type ModernMcpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type ModernMcpCacheHints = {
  ttlMs?: number;
  cacheScope?: "public" | "private";
};

export type ModernMcpToolPage = {
  tools: ModernMcpTool[];
  nextCursor?: string;
  cacheHints?: ModernMcpCacheHints;
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
  cacheHints?: ModernMcpCacheHints;
};

export type ModernMcpResourceTemplate = {
  uriTemplate: string;
  name?: string;
  description?: string;
  mimeType?: string;
};

export type ModernMcpResourceTemplatePage = {
  resourceTemplates: ModernMcpResourceTemplate[];
  nextCursor?: string;
  cacheHints?: ModernMcpCacheHints;
};

export type ModernMcpPrompt = {
  name: string;
  description?: string;
  argumentNames: string[];
};

export type ModernMcpPromptPage = {
  prompts: ModernMcpPrompt[];
  nextCursor?: string;
  cacheHints?: ModernMcpCacheHints;
};

export type ModernMcpResourceReadResult = {
  resourceUriHash: string;
  contentItemCount: number;
  isError?: boolean;
};

export type ModernMcpPromptGetResult = {
  promptNameHash: string;
  messageCount: number;
  isError?: boolean;
};

export type ModernMcpCompletionReference =
  | { type: "ref/prompt"; name: string }
  | { type: "ref/resource"; uri: string };

/** Completion metadata only. Suggested values are intentionally never
 * returned by this adapter because they may contain user or document data. */
export type ModernMcpCompletionResult = {
  valueCount: number;
  total?: number;
  hasMore?: boolean;
};

export type ModernMcpBoundedCollection<T> = {
  items: T[];
  truncated: boolean;
};

export type ModernMcpTask = {
  taskId: string;
  status: "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired";
  statusMessage?: string;
  createdAt?: string;
  lastUpdatedAt?: string;
  pollIntervalMs?: number;
  ttlMs?: number;
  inputRequestKeys?: string[];
  /** Metadata about a terminal result; result content is never returned. */
  resultType?: "complete" | "input_required";
  resultIsError?: boolean;
  resultContentItemCount?: number;
  resultInputRequestKeys?: string[];
};

export type ModernMcpTaskInputResponses = Record<string, unknown>;
export type ModernMcpTaskWaitOptions = { maxPolls?: number; maxWaitMs?: number; signal?: AbortSignal };
export type ModernMcpTaskWaitResult = { task: ModernMcpTask; complete: boolean; timedOut: boolean; polls: number };
export type ModernMcpTaskListenerOptions = { signal?: AbortSignal; timeoutMs?: number; maxEvents?: number; onTask?: (task: ModernMcpTask) => void };
export type ModernMcpTaskReconnectOptions = ModernMcpTaskListenerOptions & { maxAttempts?: number; backoffMs?: number };
export type ModernMcpTaskReconnectResult = ModernMcpTaskListenerResult & { attempts: number; reconnects: number };
export type ModernMcpTaskListenerResult = { events: ModernMcpTask[]; cacheHints?: ModernMcpCacheHints; truncated: boolean };
export type ModernMcpToolCallResult = { resultType: "complete" | "input_required" | "task"; task?: ModernMcpTask; isError?: boolean; contentItemCount?: number; inputRequestKeys?: string[] };
export type ModernMcpSubscriptionFilter = {
  toolsListChanged?: boolean;
  promptsListChanged?: boolean;
  resourcesListChanged?: boolean;
  resourceSubscriptions?: string[];
};
export type ModernMcpSubscriptionEvent = { type: "tools_list_changed" | "prompts_list_changed" | "resources_list_changed" | "resource_updated"; resourceUriHash?: string };
export type ModernMcpSubscriptionOptions = { signal?: AbortSignal; timeoutMs?: number; maxEvents?: number; onEvent?: (event: ModernMcpSubscriptionEvent) => void };
export type ModernMcpReconnectOptions = ModernMcpSubscriptionOptions & { maxAttempts?: number; backoffMs?: number };
export type ModernMcpReconnectResult = ModernMcpSubscriptionResult & { attempts: number; reconnects: number };
export type ModernMcpSubscriptionHonoredFilter = Omit<ModernMcpSubscriptionFilter, "resourceSubscriptions"> & { resourceSubscriptionHashes?: string[] };
export type ModernMcpSubscriptionResult = { events: ModernMcpSubscriptionEvent[]; honored?: ModernMcpSubscriptionHonoredFilter; cacheHints?: ModernMcpCacheHints; graceful: boolean; truncated: boolean };

export class ModernMcpProtocolError extends Error {
  readonly code: "invalid_endpoint" | "timeout" | "http_error" | "invalid_response" | "response_too_large" | "request_too_large" | "network_error" | "unsupported_method";
  readonly status?: number;
  constructor(code: ModernMcpProtocolError["code"], message: string, status?: number) {
    super(message); this.name = "ModernMcpProtocolError"; this.code = code; this.status = status;
  }
}

function boundedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_STRING_LENGTH && !/[\u0000-\u001f\u007f]/.test(value) ? value : undefined;
}
function boundedClientInfo(value: ModernMcpClientOptions["clientInfo"]): { name: string; version: string } {
  const name = boundedString(value?.name);
  const version = boundedString(value?.version);
  return name && version ? { name, version } : DEFAULT_CLIENT_INFO;
}
function boundedObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function projectCacheHints(value: Record<string, unknown>): ModernMcpCacheHints | undefined {
  const ttlCandidate = value.ttlMs ?? value.ttl_ms;
  const ttlMs = typeof ttlCandidate === "number" && Number.isSafeInteger(ttlCandidate)
    ? Math.min(24 * 60 * 60 * 1000, Math.max(0, ttlCandidate))
    : undefined;
  const scopeCandidate = value.cacheScope ?? value.cache_scope;
  const cacheScope = scopeCandidate === "public" || scopeCandidate === "private" ? scopeCandidate : undefined;
  return ttlMs === undefined && cacheScope === undefined ? undefined : {
    ...(ttlMs !== undefined ? { ttlMs } : {}),
    ...(cacheScope ? { cacheScope } : {}),
  };
}

function boundedCompletionReference(reference: ModernMcpCompletionReference): ModernMcpCompletionReference {
  if (!boundedObject(reference) || (reference.type !== "ref/prompt" && reference.type !== "ref/resource")) {
    throw new ModernMcpProtocolError("invalid_response", "Modern MCP completion requires a supported prompt or resource reference.");
  }
  if (reference.type === "ref/prompt") {
    if (!boundedString(reference.name) || !/^[A-Za-z0-9_.-]{1,128}$/.test(reference.name)) {
      throw new ModernMcpProtocolError("invalid_response", "Modern MCP completion prompt references must use a bounded name.");
    }
    return { type: "ref/prompt", name: reference.name };
  }
  if (!boundedString(reference.uri)) {
    throw new ModernMcpProtocolError("invalid_response", "Modern MCP completion resource references must use a bounded URI.");
  }
  return { type: "ref/resource", uri: reference.uri };
}

function projectTask(value: unknown): ModernMcpTask | null {
  if (!boundedObject(value)) return null;
  const taskId = boundedString(value.taskId);
  const status = boundedString(value.status);
  const allowedStatuses = new Set(["working", "input_required", "completed", "failed", "cancelled", "expired"]);
  if (!taskId || !status || !allowedStatuses.has(status) || !/^[A-Za-z0-9_.:-]{1,256}$/.test(taskId)) return null;
  const taskStatus = status as ModernMcpTask["status"];
  const statusMessage = boundedString(value.statusMessage);
  const timestamp = (candidate: unknown): string | undefined => {
    const bounded = typeof candidate === "string" && candidate.length <= 64 && !/[\u0000-\u001f\u007f]/.test(candidate) ? candidate : undefined;
    return bounded && Number.isFinite(Date.parse(bounded)) ? bounded : undefined;
  };
  const createdAt = timestamp(value.createdAt);
  const lastUpdatedAt = timestamp(value.lastUpdatedAt);
  const pollIntervalMs = typeof value.pollIntervalMs === "number" && Number.isSafeInteger(value.pollIntervalMs) ? Math.min(60_000, Math.max(0, value.pollIntervalMs)) : undefined;
  const ttlMs = typeof value.ttlMs === "number" && Number.isSafeInteger(value.ttlMs) ? Math.min(7 * 24 * 60 * 60 * 1000, Math.max(0, value.ttlMs)) : undefined;
  const inputRequestKeys = boundedObject(value.inputRequests)
    ? Object.keys(value.inputRequests).filter((key) => /^[A-Za-z0-9_.:-]{1,128}$/.test(key)).slice(0, MAX_CAPABILITIES)
    : undefined;
  const result = boundedObject(value.result) ? value.result : undefined;
  const resultTypeValue = result?.resultType;
  const hasResultMetadata = Boolean(result && (
    resultTypeValue === "complete" || resultTypeValue === "input_required" ||
    typeof result.isError === "boolean" || Array.isArray(result.content) ||
    boundedObject(result.inputRequests)
  ));
  const resultType = hasResultMetadata
    ? (resultTypeValue === "input_required" ? "input_required" : "complete")
    : undefined;
  const resultIsError = hasResultMetadata && result && typeof result.isError === "boolean" ? result.isError : undefined;
  const resultContentItemCount = hasResultMetadata && result && Array.isArray(result.content) ? Math.min(MAX_CAPABILITIES, result.content.length) : undefined;
  const resultInputRequestKeys = hasResultMetadata && result && boundedObject(result.inputRequests)
    ? Object.keys(result.inputRequests).filter((key) => /^[A-Za-z0-9_.:-]{1,128}$/.test(key)).slice(0, MAX_CAPABILITIES)
    : undefined;
  return {
    taskId,
    status: taskStatus,
    ...(statusMessage ? { statusMessage } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(lastUpdatedAt ? { lastUpdatedAt } : {}),
    ...(pollIntervalMs !== undefined ? { pollIntervalMs } : {}),
    ...(ttlMs !== undefined ? { ttlMs } : {}),
    ...(inputRequestKeys?.length ? { inputRequestKeys } : {}),
    ...(resultType ? { resultType } : {}),
    ...(resultIsError !== undefined ? { resultIsError } : {}),
    ...(resultContentItemCount !== undefined ? { resultContentItemCount } : {}),
    ...(resultInputRequestKeys?.length ? { resultInputRequestKeys } : {}),
  };
}

function taskParams(params: Record<string, unknown>): Record<string, unknown> {
  return { ...params, _meta: TASK_EXTENSION_META };
}

function boundedSubscriptionFilter(filter: ModernMcpSubscriptionFilter): ModernMcpSubscriptionFilter {
  if (!filter || typeof filter !== "object") throw new ModernMcpProtocolError("invalid_response", "Modern MCP subscriptions/listen requires a bounded notification filter.");
  const resourceSubscriptions = filter.resourceSubscriptions;
  if (resourceSubscriptions !== undefined && (!Array.isArray(resourceSubscriptions) || resourceSubscriptions.length > MAX_SUBSCRIPTION_RESOURCE_URIS)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP subscriptions/listen resource filters exceeded the bounded limit.");
  const boundedUris = resourceSubscriptions?.map((uri) => {
    if (typeof uri !== "string" || uri.length === 0 || uri.length > MAX_STRING_LENGTH || /[\u0000-\u001f\u007f]/.test(uri)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP subscriptions/listen resource filters must be bounded URI strings.");
    return uri;
  });
  if (boundedUris && new TextEncoder().encode(boundedUris.join("\n")).byteLength > MAX_SUBSCRIPTION_URI_BYTES) throw new ModernMcpProtocolError("request_too_large", "Modern MCP subscriptions/listen resource filters exceeded the bounded byte limit.");
  const result: ModernMcpSubscriptionFilter = {
    ...(filter.toolsListChanged === true ? { toolsListChanged: true } : {}),
    ...(filter.promptsListChanged === true ? { promptsListChanged: true } : {}),
    ...(filter.resourcesListChanged === true ? { resourcesListChanged: true } : {}),
    ...(boundedUris?.length ? { resourceSubscriptions: boundedUris } : {}),
  };
  if (!Object.keys(result).length) throw new ModernMcpProtocolError("invalid_response", "Modern MCP subscriptions/listen requires at least one supported notification filter.");
  return result;
}

async function hashSubscriptionUri(uri: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(uri));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashIdentity(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseJsonRpcEnvelope(text: string, contentType: string, requestId: number, method: string): Record<string, unknown> {
  const candidates: string[] = [];
  if (contentType.toLowerCase().includes("text/event-stream")) {
    // Streamable HTTP may return notifications before the response. Keep only
    // bounded data fields and inspect each complete SSE event until the
    // matching result is found; event payloads are never retained afterward.
    let dataLines: string[] = [];
    const flush = () => {
      if (dataLines.length) {
        candidates.push(dataLines.join("\n"));
        dataLines = [];
      }
    };
    for (const line of text.split(/\r?\n/)) {
      if (line === "") { flush(); continue; }
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    flush();
  } else {
    candidates.push(text);
  }
  for (const candidate of candidates) {
    let envelope: unknown;
    try { envelope = JSON.parse(candidate); } catch { continue; }
    if (!boundedObject(envelope)) continue;
    if ("id" in envelope && envelope.id !== requestId) continue;
    if (boundedObject(envelope.result)) return envelope.result;
  }
  throw new ModernMcpProtocolError("invalid_response", `Modern MCP ${method} returned an invalid or unrelated response.`);
}

/** Bounded modern MCP request client. It exposes read-only catalog/task
 * operations and keeps JSON-RPC request identifiers unique per instance so
 * concurrent calls cannot be confused by a shared constant id. */
export class ModernMcpClient {
  private requestSequence = 0;
  private discoveredCapabilities?: ReadonlySet<string>;
  private readonly clientInfo: { name: string; version: string };

  constructor(private readonly options: ModernMcpClientOptions) {
    this.clientInfo = boundedClientInfo(options.clientInfo);
  }

  private nextRequestId(): number {
    // Keep identifiers positive and bounded. Wrapping is safe because this
    // client resolves each request before returning its result; the value is
    // still unique for the active request set, including concurrent calls.
    this.requestSequence = this.requestSequence >= 2_000_000_000 ? 1 : this.requestSequence + 1;
    return this.requestSequence;
  }

  private withClientInfo(params: Record<string, unknown>): Record<string, unknown> {
    return {
      ...params,
      _meta: {
        ...(boundedObject(params._meta) ? params._meta : {}),
        "io.modelcontextprotocol/protocolVersion": MODERN_MCP_PROTOCOL_VERSION,
        "io.modelcontextprotocol/clientInfo": this.clientInfo,
        "io.modelcontextprotocol/clientCapabilities": boundedObject(params._meta) && boundedObject(params._meta["io.modelcontextprotocol/clientCapabilities"])
          ? params._meta["io.modelcontextprotocol/clientCapabilities"]
          : DEFAULT_CLIENT_CAPABILITIES,
      },
    };
  }

  private async request(method: string, params: Record<string, unknown>, routingName?: string): Promise<Record<string, unknown>> {
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
    if (routingName) headers.set("mcp-name", routingName);
    const requestId = this.nextRequestId();
    let requestBody: string;
    const requestParams = this.withClientInfo(params);
    try { requestBody = JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params: requestParams }); }
    catch { throw new ModernMcpProtocolError("invalid_response", `Modern MCP ${method} request contained a non-serializable value.`); }
    if (new TextEncoder().encode(requestBody).byteLength > MAX_TASK_INPUT_BYTES) throw new ModernMcpProtocolError("request_too_large", `Modern MCP ${method} request exceeded the bounded request limit.`);
    try {
      const response = await (this.options.fetch ?? globalThis.fetch)(endpoint, { method: "POST", headers, body: requestBody, redirect: "manual", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new ModernMcpProtocolError("http_error", `Modern MCP ${method} returned a non-success status.`, response.status);
      const contentLength = response.headers.get("content-length");
      if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_BODY_BYTES) throw new ModernMcpProtocolError("response_too_large", `Modern MCP ${method} response exceeded the bounded response limit.`);
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new ModernMcpProtocolError("response_too_large", `Modern MCP ${method} response exceeded the bounded response limit.`);
      return parseJsonRpcEnvelope(text, response.headers.get("content-type") ?? "", requestId, method);
    } catch (error) {
      if (error instanceof ModernMcpProtocolError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new ModernMcpProtocolError("timeout", `Modern MCP ${method} timed out.`);
      throw new ModernMcpProtocolError("network_error", `Modern MCP ${method} could not reach the endpoint.`);
    } finally { clearTimeout(timer); }
  }

  async discover(): Promise<ModernMcpDiscovery> {
    const result = await this.request("server/discover", {});
      const supportedVersions = Array.isArray(result.supportedVersions) ? [...new Set(result.supportedVersions.map(boundedString).filter((value): value is string => Boolean(value)))].slice(0, MAX_VERSIONS) : undefined;
      // The final 2026-07-28 wire revision moved server identity out of the
      // DiscoverResult body. Treat only the reserved result metadata key as
      // authoritative; a body-level `serverInfo` is an early-draft shape and
      // must not be trusted by the modern adapter.
      const resultMeta = boundedObject(result._meta) ? result._meta : undefined;
      const serverInfoMeta = resultMeta && boundedObject(resultMeta["io.modelcontextprotocol/serverInfo"])
        ? resultMeta["io.modelcontextprotocol/serverInfo"]
        : undefined;
      const serverInfo = serverInfoMeta
        ? { name: boundedString(serverInfoMeta.name), version: boundedString(serverInfoMeta.version) }
        : undefined;
      const capabilities = boundedObject(result.capabilities) ? result.capabilities : undefined;
      const capabilityNames = capabilities ? Object.keys(capabilities).filter((name) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name)).slice(0, MAX_CAPABILITIES) : [];
      const negotiatedCapabilities = new Set(capabilityNames);
      // Modern Tasks is advertised under capabilities.extensions, while some
      // compatible peers expose a top-level tasks member. Surface bounded
      // extension names in the summary as well as retaining them for
      // capability-aware request validation.
      const extensions = capabilities && boundedObject(capabilities.extensions) ? capabilities.extensions : undefined;
      if (extensions) {
        for (const name of Object.keys(extensions).filter((value) => /^[A-Za-z][A-Za-z0-9_.\/-]{0,63}$/.test(value)).slice(0, MAX_CAPABILITIES)) {
          negotiatedCapabilities.add(name);
          if (capabilityNames.length < MAX_CAPABILITIES && !capabilityNames.includes(name)) capabilityNames.push(name);
        }
      }
      this.discoveredCapabilities = negotiatedCapabilities;
      return { protocolVersion: MODERN_MCP_PROTOCOL_VERSION, ...(supportedVersions?.length ? { supportedVersions } : {}), ...(serverInfo ? { serverInfo } : {}), capabilityNames };
  }

  private requireAdvertisedCapability(capability: string, method: string): void {
    if (this.discoveredCapabilities && !this.discoveredCapabilities.has(capability)) {
      throw new ModernMcpProtocolError("unsupported_method", `Modern MCP ${method} was requested without an advertised ${capability} capability.`);
    }
  }

  private requireTasksCapability(method: string): void {
    if (this.discoveredCapabilities && !["tasks", "io.modelcontextprotocol/tasks", "io.modelcontextprotocol/tasks/"].some((name) => this.discoveredCapabilities?.has(name))) {
      throw new ModernMcpProtocolError("unsupported_method", `Modern MCP ${method} was requested without an advertised Tasks capability.`);
    }
  }

  /** Retrieve one bounded, cursor-based tools/list catalog page. */
  async listTools(cursor?: string): Promise<ModernMcpToolPage> {
    this.requireAdvertisedCapability("tools", "tools/list");
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
    const cacheHints = projectCacheHints(result);
    return { tools, ...(nextCursor ? { nextCursor } : {}), ...(cacheHints ? { cacheHints } : {}) };
  }

  /** Invoke a tool while returning only bounded result metadata. Tool
   * arguments are sent to the caller-selected server but never retained or
   * returned by this adapter; a server-directed Tasks result is projected to
   * its sanitized task handle and lifecycle metadata. */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<ModernMcpToolCallResult> {
    this.requireAdvertisedCapability("tools", "tools/call");
    if (!/^[A-Za-z0-9_.-]{1,128}$/.test(name) || !boundedObject(args)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tools/call requires a bounded tool name and object arguments.");
    const result = await this.request("tools/call", taskParams({ name, arguments: args }), name);
    const resultTypeValue = result.resultType === undefined ? "complete" : boundedString(result.resultType);
    if (resultTypeValue !== "complete" && resultTypeValue !== "input_required" && resultTypeValue !== "task") throw new ModernMcpProtocolError("invalid_response", "Modern MCP tools/call returned an unsupported result type.");
    if (resultTypeValue === "task") {
      // A task result is only meaningful when the server advertised the Tasks
      // extension during discovery. If discovery was performed, fail closed
      // instead of silently accepting a server-directed workflow the peer did
      // not negotiate. Calls made without discovery retain wire compatibility.
      if (this.discoveredCapabilities && !["tasks", "io.modelcontextprotocol/tasks", "io.modelcontextprotocol/tasks/"].some((name) => this.discoveredCapabilities?.has(name))) {
        throw new ModernMcpProtocolError("unsupported_method", "Modern MCP tools/call returned a task without advertising the Tasks capability during discovery.");
      }
      const task = projectTask(result);
      if (!task) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tools/call returned an invalid task result.");
      return { resultType: "task", task };
    }
    const inputRequestKeys = boundedObject(result.inputRequests)
      ? Object.keys(result.inputRequests).filter((key) => /^[A-Za-z0-9_.:-]{1,128}$/.test(key)).slice(0, MAX_CAPABILITIES)
      : undefined;
    const contentItemCount = Array.isArray(result.content) ? Math.min(MAX_CAPABILITIES, result.content.length) : undefined;
    return { resultType: resultTypeValue, ...(typeof result.isError === "boolean" ? { isError: result.isError } : {}), ...(contentItemCount !== undefined ? { contentItemCount } : {}), ...(inputRequestKeys?.length ? { inputRequestKeys } : {}) };
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
    this.requireAdvertisedCapability("resources", "resources/list");
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
    const cacheHints = projectCacheHints(result);
    return { resources, ...(nextCursor ? { nextCursor } : {}), ...(cacheHints ? { cacheHints } : {}) };
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

  /** Retrieve one bounded, cursor-based resources/templates/list catalog page.
   * URI templates are metadata only; this method never expands or dereferences
   * a template. */
  async listResourceTemplates(cursor?: string): Promise<ModernMcpResourceTemplatePage> {
    this.requireAdvertisedCapability("resources", "resources/templates/list");
    const result = await this.request("resources/templates/list", cursor ? { cursor: cursor.slice(0, MAX_STRING_LENGTH) } : {});
    if (!Array.isArray(result.resourceTemplates)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP resources/templates/list returned no resourceTemplates array.");
    const resourceTemplates = result.resourceTemplates.slice(0, MAX_RESOURCES).flatMap((value): ModernMcpResourceTemplate[] => {
      if (!boundedObject(value)) return [];
      const uriTemplate = boundedString(value.uriTemplate);
      if (!uriTemplate) return [];
      const name = boundedString(value.name);
      const description = boundedString(value.description);
      const mimeType = boundedString(value.mimeType);
      return [{ uriTemplate, ...(name ? { name } : {}), ...(description ? { description } : {}), ...(mimeType ? { mimeType } : {}) }];
    });
    const nextCursor = boundedString(result.nextCursor);
    const cacheHints = projectCacheHints(result);
    return { resourceTemplates, ...(nextCursor ? { nextCursor } : {}), ...(cacheHints ? { cacheHints } : {}) };
  }

  /** Follow opaque resources/templates/list cursors within fixed budgets. */
  async listAllResourceTemplates(): Promise<ModernMcpBoundedCollection<ModernMcpResourceTemplate>> {
    const items: ModernMcpResourceTemplate[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < MAX_COLLECTION_PAGES; page += 1) {
      const result = await this.listResourceTemplates(cursor);
      items.push(...result.resourceTemplates.slice(0, Math.max(0, MAX_COLLECTION_ITEMS - items.length)));
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
    this.requireAdvertisedCapability("prompts", "prompts/list");
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
    const cacheHints = projectCacheHints(result);
    return { prompts, ...(nextCursor ? { nextCursor } : {}), ...(cacheHints ? { cacheHints } : {}) };
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

  /** Read one resource while returning only its hashed URI, bounded content
   * count, and error bit. Resource contents never leave the caller-selected
   * MCP server through this adapter. */
  async readResource(uri: string): Promise<ModernMcpResourceReadResult> {
    this.requireAdvertisedCapability("resources", "resources/read");
    if (!boundedString(uri)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP resources/read requires a bounded resource URI.");
    const result = await this.request("resources/read", { uri });
    if (!Array.isArray(result.contents)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP resources/read returned no bounded contents array.");
    return {
      resourceUriHash: await hashIdentity(uri),
      contentItemCount: Math.min(MAX_CAPABILITIES, result.contents.length),
      ...(typeof result.isError === "boolean" ? { isError: result.isError } : {}),
    };
  }

  /** Get one prompt while returning only its hashed name, bounded message
   * count, and error bit. Prompt arguments and message contents are sent to
   * the caller-selected server but never retained or returned. */
  async getPrompt(name: string, args: Record<string, unknown> = {}): Promise<ModernMcpPromptGetResult> {
    this.requireAdvertisedCapability("prompts", "prompts/get");
    if (!/^[A-Za-z0-9_.-]{1,128}$/.test(name) || !boundedObject(args)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP prompts/get requires a bounded prompt name and object arguments.");
    const keys = Object.keys(args).filter((key) => /^[A-Za-z0-9_.:-]{1,128}$/.test(key)).slice(0, MAX_CAPABILITIES);
    if (keys.length !== Object.keys(args).length) throw new ModernMcpProtocolError("invalid_response", "Modern MCP prompts/get contains an invalid or oversized argument key.");
    const result = await this.request("prompts/get", { name, arguments: Object.fromEntries(keys.map((key) => [key, args[key]])) });
    if (!Array.isArray(result.messages)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP prompts/get returned no bounded messages array.");
    return {
      promptNameHash: await hashIdentity(name),
      messageCount: Math.min(MAX_CAPABILITIES, result.messages.length),
      ...(typeof result.isError === "boolean" ? { isError: result.isError } : {}),
    };
  }

  /** Request one bounded completion result without returning suggested values.
   * The argument value is sent to the caller-selected server but is never
   * retained by this adapter. Completion metadata remains useful for
   * observability while keeping potentially sensitive suggestions private. */
  async complete(
    reference: ModernMcpCompletionReference,
    argument: { name: string; value: string },
  ): Promise<ModernMcpCompletionResult> {
    this.requireAdvertisedCapability("completions", "completion/complete");
    const boundedReference = boundedCompletionReference(reference);
    if (!boundedObject(argument) || !/^[A-Za-z0-9_.:-]{1,128}$/.test(argument.name) || typeof argument.value !== "string" || argument.value.length > MAX_STRING_LENGTH || /[\u0000-\u001f\u007f]/.test(argument.value)) {
      throw new ModernMcpProtocolError("invalid_response", "Modern MCP completion requires bounded argument metadata and a bounded value.");
    }
    const result = await this.request("completion/complete", {
      ref: boundedReference,
      argument: { name: argument.name, value: argument.value },
    });
    if (!boundedObject(result.completion) || !Array.isArray(result.completion.values)) {
      throw new ModernMcpProtocolError("invalid_response", "Modern MCP completion returned no bounded completion values array.");
    }
    const valueCount = Math.min(MAX_CAPABILITIES, result.completion.values.length);
    const total = typeof result.completion.total === "number" && Number.isSafeInteger(result.completion.total)
      ? Math.max(0, Math.min(MAX_COLLECTION_ITEMS, result.completion.total))
      : undefined;
    const hasMore = typeof result.completion.hasMore === "boolean" ? result.completion.hasMore : undefined;
    return { valueCount, ...(total !== undefined ? { total } : {}), ...(hasMore !== undefined ? { hasMore } : {}) };
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
    this.requireTasksCapability("tasks/get");
    if (!/^[A-Za-z0-9_.:-]{1,256}$/.test(taskId)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/get requires a bounded opaque task identifier.");
    const boundedTaskId = taskId.slice(0, MAX_STRING_LENGTH);
    const result = await this.request("tasks/get", taskParams({ taskId: boundedTaskId }), boundedTaskId);
    const task = projectTask(result);
    if (!task) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/get returned an invalid task status.");
    return task;
  }

  /** Poll task status with fixed bounds and the server's advertised interval.
   * This never retrieves task result/input payloads and never assumes a
   * missing terminal state is success. */
  async waitForTask(taskId: string, options: ModernMcpTaskWaitOptions = {}): Promise<ModernMcpTaskWaitResult> {
    const maxPolls = typeof options.maxPolls === "number" && Number.isInteger(options.maxPolls) ? Math.min(64, Math.max(1, options.maxPolls)) : 12;
    const maxWaitMs = typeof options.maxWaitMs === "number" && Number.isFinite(options.maxWaitMs) ? Math.min(120_000, Math.max(250, Math.floor(options.maxWaitMs))) : 30_000;
    const startedAt = Date.now();
    let polls = 0;
    let task = await this.getTask(taskId);
    polls += 1;
    while (!["completed", "failed", "cancelled", "expired"].includes(task.status) && polls < maxPolls && Date.now() - startedAt < maxWaitMs) {
      if (options.signal?.aborted) return { task, complete: false, timedOut: true, polls };
      const remaining = Math.max(0, maxWaitMs - (Date.now() - startedAt));
      const delay = Math.min(remaining, task.pollIntervalMs ?? 250);
      if (delay > 0) await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, delay);
        options.signal?.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
      });
      if (options.signal?.aborted) return { task, complete: false, timedOut: true, polls };
      task = await this.getTask(taskId);
      polls += 1;
    }
    const complete = ["completed", "failed", "cancelled", "expired"].includes(task.status);
    return { task, complete, timedOut: !complete, polls };
  }

  /** Provide bounded responses to outstanding task input requests. Values are
   * sent directly to the server and are never retained by this client. */
  async updateTask(taskId: string, inputResponses: ModernMcpTaskInputResponses): Promise<void> {
    this.requireTasksCapability("tasks/update");
    if (!/^[A-Za-z0-9_.:-]{1,256}$/.test(taskId) || !boundedObject(inputResponses)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/update requires a bounded task identifier and object input responses.");
    const keys = Object.keys(inputResponses).filter((key) => /^[A-Za-z0-9_.:-]{1,128}$/.test(key)).slice(0, MAX_CAPABILITIES);
    if (keys.length !== Object.keys(inputResponses).length) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/update contains an invalid or oversized input response key.");
    const boundedResponses = Object.fromEntries(keys.map((key) => [key, inputResponses[key]]));
    await this.request("tasks/update", taskParams({ taskId: taskId.slice(0, MAX_STRING_LENGTH), inputResponses: boundedResponses }), taskId.slice(0, MAX_STRING_LENGTH));
  }

  /** Signal cooperative cancellation; the server may acknowledge before its
   * observable task status changes. */
  async cancelTask(taskId: string): Promise<void> {
    this.requireTasksCapability("tasks/cancel");
    if (!/^[A-Za-z0-9_.:-]{1,256}$/.test(taskId)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP tasks/cancel requires a bounded opaque task identifier.");
    await this.request("tasks/cancel", taskParams({ taskId: taskId.slice(0, MAX_STRING_LENGTH) }), taskId.slice(0, MAX_STRING_LENGTH));
  }

  /** Listen to a bounded Streamable HTTP task-status stream. Only sanitized
   * `notifications/tasks` metadata and bounded acknowledgement cache hints are
   * surfaced; cursors, stream identifiers, and task payloads are discarded. */
  async listenForTaskUpdates(taskIds: string[], options: ModernMcpTaskListenerOptions = {}): Promise<ModernMcpTaskListenerResult> {
    this.requireTasksCapability("subscriptions/listen");
    const validIds = taskIds.map((id) => typeof id === "string" && /^[A-Za-z0-9_.:-]{1,256}$/.test(id));
    const ids = [...new Set(taskIds.map((id) => id.slice(0, MAX_STRING_LENGTH)))].slice(0, MAX_CAPABILITIES);
    if (!ids.length || validIds.some((valid) => !valid)) throw new ModernMcpProtocolError("invalid_response", "Modern MCP subscriptions/listen requires bounded task identifiers.");
    const maxEvents = typeof options.maxEvents === "number" && Number.isInteger(options.maxEvents) ? Math.min(MAX_TASK_STREAM_EVENTS, Math.max(1, options.maxEvents)) : MAX_TASK_STREAM_EVENTS;
    const timeoutMs = typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs) ? Math.min(30_000, Math.max(250, Math.floor(options.timeoutMs))) : 10_000;
    if (options.signal?.aborted) return { events: [], truncated: true };
    let endpoint: URL;
    try {
      endpoint = new URL(this.options.endpoint);
      if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") throw new Error("unsupported scheme");
      if (endpoint.username || endpoint.password) throw new Error("credentials in URL");
    } catch { throw new ModernMcpProtocolError("invalid_endpoint", "Modern MCP endpoint must be HTTPS or localhost without URL credentials."); }
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const headers = new Headers(this.options.headers);
    headers.set("accept", "text/event-stream"); headers.set("content-type", "application/json");
    headers.set("mcp-protocol-version", MODERN_MCP_PROTOCOL_VERSION); headers.set("mcp-method", "subscriptions/listen");
    const body = JSON.stringify({ jsonrpc: "2.0", id: this.nextRequestId(), method: "subscriptions/listen", params: this.withClientInfo(taskParams({ notifications: { taskIds: ids } })) });
    const events: ModernMcpTask[] = [];
    let cacheHints: ModernMcpCacheHints | undefined;
    try {
      const response = await (this.options.fetch ?? globalThis.fetch)(endpoint, { method: "POST", headers, body, redirect: "manual", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new ModernMcpProtocolError("http_error", "Modern MCP subscriptions/listen returned a non-success status.", response.status);
      if (!response.body) throw new ModernMcpProtocolError("invalid_response", "Modern MCP subscriptions/listen returned no stream body.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; let bytes = 0; let truncated = false;
      const consume = (chunk: string) => {
        buffer += chunk;
        const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() || "";
        for (const frame of frames) {
          const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
          if (!data) continue;
          let envelope: unknown; try { envelope = JSON.parse(data); } catch { continue; }
          if (!boundedObject(envelope)) continue;
          if (envelope.method === "notifications/subscriptions/acknowledged") {
            cacheHints = projectCacheHints(envelope.params && boundedObject(envelope.params) ? envelope.params : {});
            continue;
          }
          if ("id" in envelope && boundedObject(envelope.result)) {
            cacheHints = cacheHints || projectCacheHints(envelope.result);
            continue;
          }
          if (envelope.method !== "notifications/tasks") continue;
          const task = projectTask(envelope.params);
          if (!task) continue;
          if (events.length >= maxEvents) { truncated = true; continue; }
          events.push(task); options.onTask?.(task);
        }
      };
      while (!truncated) {
        const { value, done } = await reader.read();
        if (done) { consume(decoder.decode()); break; }
        bytes += value.byteLength;
        if (bytes > MAX_TASK_STREAM_BYTES) { truncated = true; await reader.cancel(); break; }
        consume(decoder.decode(value, { stream: true }));
      }
      return { events, ...(cacheHints ? { cacheHints } : {}), truncated: truncated || Boolean(options.signal?.aborted) };
    } catch (error) {
      if (error instanceof ModernMcpProtocolError) throw error;
      if (options.signal?.aborted || timedOut || (error instanceof DOMException && error.name === "AbortError")) return { events, ...(cacheHints ? { cacheHints } : {}), truncated: true };
      throw new ModernMcpProtocolError("network_error", "Modern MCP subscriptions/listen could not reach the endpoint.");
    } finally { clearTimeout(timer); options.signal?.removeEventListener("abort", abort); }
  }

  /** Opt-in bounded reconnect wrapper for task-status streams. The stream is
   * not durable: reconnects can miss or duplicate notifications, and callers
   * should reconcile by polling `getTask` for each known handle. */
  async listenForTaskUpdatesWithReconnect(taskIds: string[], options: ModernMcpTaskReconnectOptions = {}): Promise<ModernMcpTaskReconnectResult> {
    const maxAttempts = typeof options.maxAttempts === "number" && Number.isInteger(options.maxAttempts) ? Math.min(5, Math.max(1, options.maxAttempts)) : 3;
    const backoffMs = typeof options.backoffMs === "number" && Number.isFinite(options.backoffMs) ? Math.min(5_000, Math.max(0, Math.floor(options.backoffMs))) : 250;
    const maxEvents = typeof options.maxEvents === "number" && Number.isInteger(options.maxEvents) ? Math.min(MAX_TASK_STREAM_EVENTS, Math.max(1, options.maxEvents)) : MAX_TASK_STREAM_EVENTS;
    const events: ModernMcpTask[] = [];
    let attempts = 0;
    let reconnects = 0;
    let cacheHints: ModernMcpCacheHints | undefined;
    let last: ModernMcpTaskListenerResult = { events: [], truncated: true };
    while (attempts < maxAttempts && !options.signal?.aborted && events.length < maxEvents) {
      attempts += 1;
      let result: ModernMcpTaskListenerResult;
      try {
        result = await this.listenForTaskUpdates(taskIds, {
          signal: options.signal,
          timeoutMs: options.timeoutMs,
          maxEvents: maxEvents - events.length,
          onTask: options.onTask,
        });
      } catch (error) {
        if (!(error instanceof ModernMcpProtocolError) || error.code !== "network_error") throw error;
        result = { events: [], truncated: true };
      }
      last = result;
      events.push(...result.events);
      cacheHints = result.cacheHints || cacheHints;
      if (!result.truncated || options.signal?.aborted || events.length >= maxEvents) break;
      if (attempts >= maxAttempts) break;
      reconnects += 1;
      const delay = Math.min(5_000, backoffMs * (2 ** Math.min(3, reconnects - 1)));
      if (delay > 0) await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, delay);
        options.signal?.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
      });
    }
    return {
      events: events.slice(0, maxEvents),
      ...(cacheHints ? { cacheHints } : last.cacheHints ? { cacheHints: last.cacheHints } : {}),
      truncated: Boolean(options.signal?.aborted) || events.length >= maxEvents ? events.length >= maxEvents : last.truncated,
      attempts,
      reconnects,
    };
  }

  /** Listen to bounded 2026-07-28 catalog/resource change notifications.
   * Raw resource URIs, subscription IDs, acknowledgement metadata, and
   * notification payloads are never returned; resource updates are identified
   * by a one-way SHA-256 URI hash. This is a single bounded stream, not a
   * durable subscription or reconnect manager. */
  async listenForUpdates(filter: ModernMcpSubscriptionFilter, options: ModernMcpSubscriptionOptions = {}): Promise<ModernMcpSubscriptionResult> {
    const boundedFilter = boundedSubscriptionFilter(filter);
    if (boundedFilter.toolsListChanged === true) this.requireAdvertisedCapability("tools", "subscriptions/listen");
    if (boundedFilter.promptsListChanged === true) this.requireAdvertisedCapability("prompts", "subscriptions/listen");
    if (boundedFilter.resourcesListChanged === true || boundedFilter.resourceSubscriptions?.length) this.requireAdvertisedCapability("resources", "subscriptions/listen");
    const maxEvents = typeof options.maxEvents === "number" && Number.isInteger(options.maxEvents) ? Math.min(MAX_TASK_STREAM_EVENTS, Math.max(1, options.maxEvents)) : MAX_TASK_STREAM_EVENTS;
    const timeoutMs = typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs) ? Math.min(30_000, Math.max(250, Math.floor(options.timeoutMs))) : 10_000;
    if (options.signal?.aborted) return { events: [], graceful: false, truncated: true };
    let endpoint: URL;
    try {
      endpoint = new URL(this.options.endpoint);
      if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") throw new Error("unsupported scheme");
      if (endpoint.username || endpoint.password) throw new Error("credentials in URL");
    } catch { throw new ModernMcpProtocolError("invalid_endpoint", "Modern MCP endpoint must be HTTPS or localhost without URL credentials."); }
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const headers = new Headers(this.options.headers);
    headers.set("accept", "text/event-stream"); headers.set("content-type", "application/json");
    headers.set("mcp-protocol-version", MODERN_MCP_PROTOCOL_VERSION); headers.set("mcp-method", "subscriptions/listen");
    const body = JSON.stringify({ jsonrpc: "2.0", id: this.nextRequestId(), method: "subscriptions/listen", params: this.withClientInfo(taskParams({ notifications: boundedFilter })) });
    const events: ModernMcpSubscriptionEvent[] = [];
    let honored: ModernMcpSubscriptionHonoredFilter | undefined;
    let cacheHints: ModernMcpCacheHints | undefined;
    let graceful = false;
    try {
      const response = await (this.options.fetch ?? globalThis.fetch)(endpoint, { method: "POST", headers, body, redirect: "manual", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new ModernMcpProtocolError("http_error", "Modern MCP subscriptions/listen returned a non-success status.", response.status);
      if (!response.body) throw new ModernMcpProtocolError("invalid_response", "Modern MCP subscriptions/listen returned no stream body.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; let bytes = 0; let truncated = false;
      const consume = async (chunk: string) => {
        buffer += chunk;
        const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() || "";
        for (const frame of frames) {
          const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
          if (!data) continue;
          let envelope: unknown; try { envelope = JSON.parse(data); } catch { continue; }
          if (!boundedObject(envelope)) continue;
          if (envelope.method === "notifications/subscriptions/acknowledged") {
            cacheHints = projectCacheHints(envelope.params && boundedObject(envelope.params) ? envelope.params : {});
            const notificationFilter = boundedObject(envelope.params) && boundedObject(envelope.params.notifications) ? envelope.params.notifications : undefined;
            if (notificationFilter) {
              const acknowledgedUris = Array.isArray(notificationFilter.resourceSubscriptions)
                ? notificationFilter.resourceSubscriptions.filter((uri): uri is string => typeof uri === "string" && uri.length > 0 && uri.length <= MAX_STRING_LENGTH && !/[\u0000-\u001f\u007f]/.test(uri)).slice(0, MAX_SUBSCRIPTION_RESOURCE_URIS)
                : [];
              honored = {
                ...(notificationFilter.toolsListChanged === true ? { toolsListChanged: true } : {}),
                ...(notificationFilter.promptsListChanged === true ? { promptsListChanged: true } : {}),
                ...(notificationFilter.resourcesListChanged === true ? { resourcesListChanged: true } : {}),
                ...(acknowledgedUris.length ? { resourceSubscriptionHashes: await Promise.all(acknowledgedUris.map(hashSubscriptionUri)) } : {}),
              };
            }
            continue;
          }
          if ("id" in envelope && boundedObject(envelope.result)) { cacheHints = cacheHints || projectCacheHints(envelope.result); graceful = true; continue; }
          const type = envelope.method === "notifications/tools/list_changed" ? "tools_list_changed"
            : envelope.method === "notifications/prompts/list_changed" ? "prompts_list_changed"
              : envelope.method === "notifications/resources/list_changed" ? "resources_list_changed"
                : envelope.method === "notifications/resources/updated" ? "resource_updated" : undefined;
          if (!type || events.length >= maxEvents) { if (type) truncated = true; continue; }
          const event: ModernMcpSubscriptionEvent = { type };
          if (type === "resource_updated") {
            const uri = boundedObject(envelope.params) ? boundedString(envelope.params.uri) : undefined;
            if (!uri) continue;
            event.resourceUriHash = await hashSubscriptionUri(uri);
          }
          events.push(event); options.onEvent?.(event);
        }
      };
      while (!truncated && !graceful) {
        const { value, done } = await reader.read();
        if (done) { await consume(decoder.decode()); break; }
        bytes += value.byteLength;
        if (bytes > MAX_TASK_STREAM_BYTES) { truncated = true; await reader.cancel(); break; }
        await consume(decoder.decode(value, { stream: true }));
      }
      return { events, ...(honored ? { honored } : {}), ...(cacheHints ? { cacheHints } : {}), graceful, truncated: truncated || Boolean(options.signal?.aborted) };
    } catch (error) {
      if (error instanceof ModernMcpProtocolError) throw error;
      if (options.signal?.aborted || timedOut || (error instanceof DOMException && error.name === "AbortError")) return { events, ...(honored ? { honored } : {}), ...(cacheHints ? { cacheHints } : {}), graceful, truncated: true };
      throw new ModernMcpProtocolError("network_error", "Modern MCP subscriptions/listen could not reach the endpoint.");
    } finally { clearTimeout(timer); options.signal?.removeEventListener("abort", abort); }
  }

  /**
   * Opt-in, caller-controlled reconnect wrapper for a bounded notification
   * stream. It never replays or persists events, so a reconnect may duplicate
   * notifications or miss events between streams; callers must reconcile by
   * re-reading their catalogs. HTTP/authentication failures are surfaced
   * immediately, while only network failures and non-graceful stream closes
   * consume the bounded retry budget.
   */
  async listenForUpdatesWithReconnect(filter: ModernMcpSubscriptionFilter, options: ModernMcpReconnectOptions = {}): Promise<ModernMcpReconnectResult> {
    const maxAttempts = typeof options.maxAttempts === "number" && Number.isInteger(options.maxAttempts) ? Math.min(5, Math.max(1, options.maxAttempts)) : 3;
    const backoffMs = typeof options.backoffMs === "number" && Number.isFinite(options.backoffMs) ? Math.min(5_000, Math.max(0, Math.floor(options.backoffMs))) : 250;
    const maxEvents = typeof options.maxEvents === "number" && Number.isInteger(options.maxEvents) ? Math.min(MAX_TASK_STREAM_EVENTS, Math.max(1, options.maxEvents)) : MAX_TASK_STREAM_EVENTS;
    const events: ModernMcpSubscriptionEvent[] = [];
    let honored: ModernMcpSubscriptionHonoredFilter | undefined;
    let cacheHints: ModernMcpCacheHints | undefined;
    let attempts = 0;
    let reconnects = 0;
    let last: ModernMcpSubscriptionResult = { events: [], graceful: false, truncated: true };
    while (attempts < maxAttempts && !options.signal?.aborted && events.length < maxEvents) {
      attempts += 1;
      try {
        const result = await this.listenForUpdates(filter, {
          signal: options.signal,
          timeoutMs: options.timeoutMs,
          maxEvents: maxEvents - events.length,
          onEvent: options.onEvent,
        });
        last = result;
        events.push(...result.events);
        honored = result.honored || honored;
        cacheHints = result.cacheHints || cacheHints;
        if (result.graceful || !result.truncated || options.signal?.aborted || events.length >= maxEvents) break;
      } catch (error) {
        if (!(error instanceof ModernMcpProtocolError) || error.code !== "network_error") throw error;
        last = { events: [], graceful: false, truncated: true };
      }
      if (attempts >= maxAttempts || options.signal?.aborted) break;
      reconnects += 1;
      const delay = Math.min(5_000, backoffMs * (2 ** Math.min(3, reconnects - 1)));
      if (delay > 0) await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, delay);
        options.signal?.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
      });
    }
    return {
      events: events.slice(0, maxEvents),
      ...(honored ? { honored } : last.honored ? { honored: last.honored } : {}),
      ...(cacheHints ? { cacheHints } : last.cacheHints ? { cacheHints: last.cacheHints } : {}),
      graceful: last.graceful,
      truncated: Boolean(options.signal?.aborted) || events.length >= maxEvents ? events.length >= maxEvents : !last.graceful,
      attempts,
      reconnects,
    };
  }
}
