import { isRecord } from "./json.ts";
import { parseBoundedJson } from "./json.ts";
import { redactText } from "./redaction.ts";
import type { McpTesterLimits, McpFetch, TimelineEventKind, McpTesterPhase } from "./types.ts";

export interface RpcEnvelope {
  kind: "result" | "error";
  id: number | string | null;
  result?: unknown;
  errorCode?: number;
  errorMessage?: string;
}

export type TransportFailureKind =
  | "browser_blocked"
  | "auth_required"
  | "unreachable"
  | "protocol_error"
  | "rpc_error"
  | "timeout"
  | "response_too_large"
  | "header_limit"
  | "aborted";

export interface TransportFailure {
  ok: false;
  kind: TransportFailureKind;
  code: string;
  status?: number;
  responseReceived: boolean;
  errorCode?: number;
}

export interface TransportSuccess {
  ok: true;
  status: number;
  bodyBytes: number;
  contentType: string;
  envelope?: RpcEnvelope;
  sessionId?: string;
}

export type TransportResult = TransportSuccess | TransportFailure;

export interface TransportRequestOptions {
  fetch: McpFetch;
  endpoint: URL;
  customHeaders: readonly [string, string][];
  sessionId?: string;
  protocolVersion?: string;
  requestId?: number;
  body: Record<string, unknown>;
  expectsResponse: boolean;
  limits: McpTesterLimits;
  deadlineMs: number;
  signal?: AbortSignal;
  now: () => number;
  record: (kind: TimelineEventKind, phase: McpTesterPhase, details?: Readonly<Record<string, string | number | boolean | null>>) => void;
  phase: McpTesterPhase;
}

export async function sendMcpRequest(options: TransportRequestOptions): Promise<TransportResult> {
  const headers = new Headers();
  try {
    for (const [name, value] of options.customHeaders) headers.set(name, value);
    headers.set("accept", "application/json, text/event-stream");
    headers.set("content-type", "application/json");
    if (options.sessionId) headers.set("mcp-session-id", options.sessionId);
    if (options.protocolVersion) headers.set("mcp-protocol-version", options.protocolVersion);
  } catch {
    return { ok: false, kind: "protocol_error", code: "request_headers_invalid", responseReceived: false };
  }
  const headerEntries = [...headers.entries()];
  const headerBytes = headerEntries.reduce((total, [name, value]) => total + utf8Length(name) + utf8Length(value), 0);
  if (headerEntries.length > options.limits.maxHeaderCount || headerBytes > options.limits.maxHeaderBytes) {
    return { ok: false, kind: "header_limit", code: "request_header_limit", responseReceived: false };
  }

  const body = JSON.stringify(options.body);
  options.record("request_sent", options.phase, { request_id: options.requestId ?? null, notification: options.requestId === undefined });
  const controller = new AbortController();
  let timedOut = false;
  let externallyAborted = options.signal?.aborted ?? false;
  let raceTimer: ReturnType<typeof setTimeout> | undefined;
  const onAbort = () => {
    externallyAborted = true;
    controller.abort();
  };
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const remainingMs = Math.max(1, Math.floor(options.deadlineMs - options.now()));
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, remainingMs);

  let response: Response;
  try {
    const request = options.fetch(options.endpoint, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
      credentials: "omit",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    });
    response = await Promise.race([
      request,
      new Promise<Response>((_, reject) => {
        raceTimer = setTimeout(() => reject(new Error("mcp-tester-timeout")), remainingMs);
      }),
    ]);
  } catch {
    clearTimeout(timeoutHandle);
    if (raceTimer !== undefined) clearTimeout(raceTimer);
    options.signal?.removeEventListener("abort", onAbort);
    if (timedOut) return { ok: false, kind: "timeout", code: "request_timeout", responseReceived: false };
    if (externallyAborted) return { ok: false, kind: "aborted", code: "request_aborted", responseReceived: false };
    return { ok: false, kind: "browser_blocked", code: "browser_network_or_cors_blocked", responseReceived: false };
  }
  clearTimeout(timeoutHandle);
  if (raceTimer !== undefined) clearTimeout(raceTimer);
  options.signal?.removeEventListener("abort", onAbort);

  if (response.type === "opaque" || response.type === "opaqueredirect" || response.status === 0) {
    return { ok: false, kind: "browser_blocked", code: "opaque_browser_response", responseReceived: false };
  }
  if (response.redirected || (response.status >= 300 && response.status < 400)) {
    return { ok: false, kind: "browser_blocked", code: "redirect_not_followed", status: response.status, responseReceived: true };
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, kind: "auth_required", code: "authentication_required", status: response.status, responseReceived: true };
  }
  if (response.status >= 500) {
    return { ok: false, kind: "unreachable", code: "server_error_response", status: response.status, responseReceived: true };
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > options.limits.maxResponseBodyBytes) {
    return { ok: false, kind: "response_too_large", code: "response_body_too_large", status: response.status, responseReceived: true };
  }

  let bodyText: string;
  let bodyBytes: number;
  try {
    const read = await readResponseBody(response, options.limits.maxResponseBodyBytes);
    bodyText = read.text;
    bodyBytes = read.bytes;
  } catch (error) {
    if (error instanceof ResponseSizeError) return { ok: false, kind: "response_too_large", code: "response_body_too_large", status: response.status, responseReceived: true };
    return { ok: false, kind: "protocol_error", code: "response_body_unreadable", status: response.status, responseReceived: true };
  }
  options.record("response_received", options.phase, {
    status: response.status,
    body_bytes: bodyBytes,
    content_type: safeContentType(response.headers.get("content-type")),
  });

  if (!options.expectsResponse && bodyText.trim() === "") {
    if (response.status >= 200 && response.status < 300) return { ok: true, status: response.status, bodyBytes, contentType: response.headers.get("content-type") ?? "" };
    return { ok: false, kind: "protocol_error", code: "notification_http_error", status: response.status, responseReceived: true };
  }
  if (response.status < 200 || response.status >= 300) {
    return { ok: false, kind: "protocol_error", code: "unexpected_http_status", status: response.status, responseReceived: true };
  }
  if (bodyText.trim() === "") return { ok: false, kind: "protocol_error", code: "empty_json_rpc_response", status: response.status, responseReceived: true };

  const parsed = parseRpcBody(bodyText, response.headers.get("content-type") ?? "", options.limits, options.requestId);
  if (!parsed.ok) return { ok: false, kind: parsed.kind, code: parsed.code, status: response.status, responseReceived: true, errorCode: parsed.errorCode };
  if (parsed.envelope.kind === "error") {
    if (isAuthRpcError(parsed.envelope)) return { ok: false, kind: "auth_required", code: "authentication_required", status: response.status, responseReceived: true, errorCode: parsed.envelope.errorCode };
    return { ok: false, kind: "rpc_error", code: "json_rpc_error", status: response.status, responseReceived: true, errorCode: parsed.envelope.errorCode };
  }
  return {
    ok: true,
    status: response.status,
    bodyBytes,
    contentType: response.headers.get("content-type") ?? "",
    envelope: parsed.envelope,
    sessionId: safeSessionId(response.headers.get("mcp-session-id")),
  };
}

class ResponseSizeError extends Error {}

async function readResponseBody(response: Response, maxBytes: number): Promise<{ text: string; bytes: number }> {
  if (!response.body) {
    const text = await response.text();
    const bytes = utf8Length(text);
    if (bytes > maxBytes) throw new ResponseSizeError();
    return { text, bytes };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new ResponseSizeError();
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  return { text, bytes };
}

function parseRpcBody(body: string, contentType: string, limits: McpTesterLimits, expectedId: number | undefined): { ok: true; envelope: RpcEnvelope } | { ok: false; kind: "protocol_error"; code: string; errorCode?: number } {
  const candidates = contentType.toLowerCase().includes("text/event-stream") ? parseSseData(body) : [body.trim()];
  let sawInvalid = false;
  for (const candidate of candidates) {
    if (!candidate || candidate === "[DONE]") continue;
    const parsed = parseBoundedJson(candidate, limits);
    if (!parsed.ok) {
      sawInvalid = true;
      continue;
    }
    const envelope = normalizeRpcEnvelope(parsed.value, expectedId);
    if (envelope.ok) return envelope;
    sawInvalid = true;
  }
  return { ok: false, kind: "protocol_error", code: sawInvalid ? "malformed_json_rpc_envelope" : "empty_sse_response" };
}

function parseSseData(body: string): string[] {
  const candidates: string[] = [];
  let data: string[] = [];
  const flush = () => {
    if (data.length > 0) candidates.push(data.join("\n"));
    data = [];
  };
  for (const line of body.split(/\r?\n/)) {
    if (line === "") flush();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  flush();
  return candidates;
}

function normalizeRpcEnvelope(value: unknown, expectedId: number | undefined): { ok: true; envelope: RpcEnvelope } | { ok: false } {
  if (!isRecord(value) || value.jsonrpc !== "2.0") return { ok: false };
  const id = value.id;
  if (expectedId !== undefined && id !== expectedId) return { ok: false };
  if ("result" in value && "error" in value) return { ok: false };
  if ("result" in value) return { ok: true, envelope: { kind: "result", id: typeof id === "string" || typeof id === "number" || id === null ? id : null, result: value.result } };
  if (!isRecord(value.error) || typeof value.error.code !== "number" || !Number.isFinite(value.error.code)) return { ok: false };
  return {
    ok: true,
    envelope: {
      kind: "error",
      id: typeof id === "string" || typeof id === "number" || id === null ? id : null,
      errorCode: value.error.code,
      errorMessage: typeof value.error.message === "string" ? value.error.message.slice(0, 256) : undefined,
    },
  };
}

function isAuthRpcError(envelope: RpcEnvelope): boolean {
  if (envelope.errorCode === -32001 || envelope.errorCode === -32002 || envelope.errorCode === 401 || envelope.errorCode === 403) return true;
  return /\b(?:unauthorized|authentication|forbidden|bearer|credential)\b/i.test(envelope.errorMessage ?? "");
}

function safeSessionId(value: string | null): string | undefined {
  if (!value || value.length > 512 || /[\r\n]/.test(value)) return undefined;
  return value;
}

function safeContentType(value: string | null): string {
  return value ? redactText(value.split(";", 1)[0]?.trim() ?? "", 100) : "";
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
