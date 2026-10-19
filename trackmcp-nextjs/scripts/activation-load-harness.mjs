#!/usr/bin/env node

/** Local-only activation and ingest batch harness. It never targets a remote host by default. */
import { createServer } from "node:http";
import { URL } from "node:url";

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { baseUrl: "", requests: 60, concurrency: 8, timeoutMs: 10_000, maxErrorRate: 0.01, p95Ms: 750 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]; const value = argv[i + 1];
    if (arg === "--base-url") { out.baseUrl = value; i += 1; }
    else if (arg === "--requests") { out.requests = Number(value); i += 1; }
    else if (arg === "--concurrency") { out.concurrency = Number(value); i += 1; }
    else if (arg === "--timeout-ms") { out.timeoutMs = Number(value); i += 1; }
    else if (arg === "--p95-ms") { out.p95Ms = Number(value); i += 1; }
    else if (arg === "--max-error-rate") { out.maxErrorRate = Number(value); i += 1; }
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(out.requests) || out.requests < 1 || out.requests > 2_000) throw new Error("--requests must be 1..2000");
  if (!Number.isInteger(out.concurrency) || out.concurrency < 1 || out.concurrency > 32) throw new Error("--concurrency must be 1..32");
  if (out.concurrency > out.requests) out.concurrency = out.requests;
  if (!Number.isInteger(out.timeoutMs) || out.timeoutMs < 1 || out.timeoutMs > 120_000) throw new Error("--timeout-ms must be 1..120000");
  if (!Number.isFinite(out.p95Ms) || out.p95Ms <= 0 || !Number.isFinite(out.maxErrorRate) || out.maxErrorRate < 0 || out.maxErrorRate > 1) throw new Error("invalid budget");
  if (out.baseUrl) {
    const url = new URL(out.baseUrl);
    if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new Error("Refusing non-local --base-url");
    if (!/^https?:$/.test(url.protocol)) throw new Error("--base-url must use http or https");
  }
  return out;
}

function percentile(values, p) { const sorted = [...values].sort((a, b) => a - b); return sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(p / 100 * sorted.length) - 1)] : 0; }

export function summarize(samples, thresholds) {
  const errors = samples.filter((sample) => sample.error || sample.status < 200 || sample.status >= 300);
  const latencies = samples.map((sample) => sample.latencyMs);
  const errorRate = samples.length ? errors.length / samples.length : 1;
  const p95 = percentile(latencies, 95);
  const checks = { completed: samples.length > 0, p95: p95 <= thresholds.p95Ms, errorRate: errorRate <= thresholds.maxErrorRate, noTimeouts: samples.every((sample) => !sample.timedOut) };
  return { requests: samples.length, successes: samples.length - errors.length, errors: errors.length, timeouts: samples.filter((sample) => sample.timedOut).length, errorRate, latencyMs: { p50: percentile(latencies, 50), p95, p99: percentile(latencies, 99), max: Math.max(...latencies, 0) }, thresholds, checks, pass: Object.values(checks).every(Boolean) };
}

export function createActivationFixtureServer() {
  return createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    let body = {}; try { body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; } catch { res.writeHead(400); res.end(); return; }
    const route = req.url || "";
    if (req.method === "POST" && route === "/api/v1/cli/device/sessions") return respond(res, 201, { device_code: "d".repeat(40), user_code: "ABCD-2345", interval: 5 });
    if (req.method === "POST" && route === "/api/v1/cli/device/sessions/poll") return respond(res, 200, { status: "authorization_pending", interval: 5 });
    if (req.method === "POST" && route === "/api/v1/cli/device/sessions/redeem") return respond(res, 201, { workspace: { id: "fixture" }, api_key: "fixture-only" });
    if (req.method === "POST" && route === "/api/v1/ingest" && Array.isArray(body.events) && body.events.length <= 100) return respond(res, 202, { accepted: body.events.length });
    return respond(res, 400, { error: "invalid fixture request" });
  });
}

function respond(res, status, body) { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); }

async function runProfile(baseUrl, options, kind) {
  const samples = []; let cursor = 0;
  async function one(index) {
    const route = kind === "ingest" ? "/api/v1/ingest" : ["/api/v1/cli/device/sessions", "/api/v1/cli/device/sessions/poll", "/api/v1/cli/device/sessions/redeem"][index % 3];
    const events = kind === "ingest" ? Array.from({ length: [1, 10, 50, 100][index % 4] }, (_, i) => ({ event_id: `fixture-${index}-${i}`, event_type: "tool_call", started_at: new Date().toISOString() })) : undefined;
    const started = performance.now(); let status = 0; let error = ""; let timedOut = false; let timer;
    try { const controller = new AbortController(); timer = setTimeout(() => controller.abort(), options.timeoutMs); const response = await fetch(`${baseUrl}${route}`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer fixture-key" }, body: JSON.stringify(kind === "ingest" ? { events } : { device_code: "d".repeat(40), redemption_id: "a".repeat(32) }), signal: controller.signal }); status = response.status; await response.text(); }
    catch (cause) { timedOut = cause?.name === "AbortError"; error = timedOut ? "timeout" : String(cause); }
    finally { clearTimeout(timer); }
    samples.push({ route, status, error, timedOut, latencyMs: Math.round((performance.now() - started) * 100) / 100 });
  }
  async function worker() { while (true) { const index = cursor++; if (index >= options.requests) return; await one(index); } }
  await Promise.all(Array.from({ length: options.concurrency }, worker));
  return summarize(samples, options);
}

export async function runFixtureProfiles(options) {
  const server = createActivationFixtureServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try { return { ingest: await runProfile(baseUrl, options, "ingest"), activation: await runProfile(baseUrl, options, "activation") }; }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

if (import.meta.url === `file://${process.argv[1]}`) runFixtureProfiles(parseArgs()).then((report) => { console.log(JSON.stringify(report, null, 2)); if (!report.ingest.pass || !report.activation.pass) process.exitCode = 1; }).catch((error) => { console.error(error.message); process.exitCode = 2; });
