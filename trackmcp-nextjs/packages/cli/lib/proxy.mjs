import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";

const DEFAULT_ENDPOINT = "https://trackmcp.com/api/v1/ingest";
const MAX_LINE_BYTES = 256 * 1024;
const MAX_BATCH = 50;
const METHOD = /^[A-Za-z0-9_.:/-]{1,128}$/;

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function hash(value) {
  return createHash("sha256").update(stable(value), "utf8").digest("hex");
}

function boundedMessage(line, direction, now) {
  if (Buffer.byteLength(line, "utf8") > MAX_LINE_BYTES) return null;
  let message;
  try { message = JSON.parse(line); } catch { return null; }
  if (!message || typeof message !== "object" || Array.isArray(message)) return null;
  const method = typeof message.method === "string" && METHOD.test(message.method) ? message.method : undefined;
  const hasResult = Boolean(message.result && typeof message.result === "object");
  const hasError = Boolean(message.error && typeof message.error === "object");
  const kind = method ? (String(message.id ?? "").length ? "protocol_request" : "protocol_notification") : (hasResult || hasError ? "protocol_response" : undefined);
  if (!kind) return null;
  return {
    event_id: randomUUID(),
    event_type: "protocol",
    direction,
    transport: "stdio",
    mcp_method: method,
    started_at: now(),
    success: !hasError,
    is_error: hasError,
    payload_policy: "metadata",
    payload: { _trackmcp: { observation_kind: kind, message_shape: hash({ method: method || null, hasResult, hasError }) } },
  };
}

export function parseProxyArgs(argv) {
  const separator = argv.indexOf("--");
  if (separator < 1 || !argv[separator + 1]) throw new Error("Usage: trackmcp proxy -- <mcp-server-command> [args…]");
  const flags = { endpoint: DEFAULT_ENDPOINT, service: process.env.TRACKMCP_SERVICE || "mcp-stdio", environment: process.env.TRACKMCP_ENVIRONMENT || "production" };
  for (const arg of argv.slice(0, separator)) {
    if (arg.startsWith("--endpoint=")) flags.endpoint = arg.slice("--endpoint=".length);
    else if (arg.startsWith("--service=")) flags.service = arg.slice("--service=".length);
    else if (arg.startsWith("--environment=")) flags.environment = arg.slice("--environment=".length);
    else throw new Error(`Unknown proxy option: ${arg}`);
  }
  if (!/^https:\/\//.test(flags.endpoint)) throw new Error("Proxy endpoint must use HTTPS.");
  return { ...flags, command: argv[separator + 1], args: argv.slice(separator + 2) };
}

export async function runProxy({ command, args = [], key = process.env.TRACKMCP_KEY, endpoint = DEFAULT_ENDPOINT, service = "mcp-stdio", environment = "production", spawnImpl = spawn, fetchImpl = fetch, input = process.stdin, output = process.stdout, errorOutput = process.stderr, now = () => new Date().toISOString() } = {}) {
  if (!key || typeof key !== "string") throw new Error("trackmcp proxy requires TRACKMCP_KEY in the environment; it never accepts keys as arguments.");
  if (!/^https:\/\//.test(endpoint)) throw new Error("Proxy endpoint must use HTTPS.");
  if (!command || command.startsWith("-")) throw new Error("Proxy command is required after --.");
  const child = spawnImpl(command, args, { stdio: ["pipe", "pipe", "inherit"], shell: false });
  const queue = [];
  let inputBuffer = "";
  let outputBuffer = "";
  let flushing;
  const enqueue = (line, direction) => {
    const event = boundedMessage(line, direction, now);
    if (event) {
      event.service = service;
      event.environment = environment;
      queue.push(event);
    }
    if (queue.length >= MAX_BATCH) void flush();
  };
  const flush = async () => {
    if (flushing || queue.length === 0) return flushing;
    const events = queue.splice(0, MAX_BATCH);
    flushing = Promise.resolve(fetchImpl(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ events }) })).catch(() => {}).finally(() => { flushing = undefined; if (queue.length) void flush(); });
    return flushing;
  };
  const consume = (chunk, direction, target) => {
    // Forward the original bytes before parsing a copy. JSONL parsing is only
    // for telemetry; it must never normalize line endings or chunk boundaries.
    target.write(chunk);
    const buffer = direction === "client_to_server" ? inputBuffer + chunk.toString("utf8") : outputBuffer + chunk.toString("utf8");
    const lines = buffer.split("\n");
    const remainder = lines.pop() || "";
    if (direction === "client_to_server") inputBuffer = remainder; else outputBuffer = remainder;
    for (const line of lines) enqueue(line.replace(/\r$/, ""), direction);
  };
  input.on("data", (chunk) => consume(chunk, "client_to_server", child.stdin));
  child.stdout.on("data", (chunk) => consume(chunk, "server_to_client", output));
  child.on("close", async (code, signal) => { if (inputBuffer) enqueue(inputBuffer, "client_to_server"); if (outputBuffer) enqueue(outputBuffer, "server_to_client"); await flush(); if (code !== null) process.exitCode = code; else if (signal) errorOutput.write(`TrackMCP proxy child exited with ${signal}.\n`); });
  child.on("error", (error) => errorOutput.write(`TrackMCP proxy could not start the child process: ${error.message}\n`));
  return child;
}
