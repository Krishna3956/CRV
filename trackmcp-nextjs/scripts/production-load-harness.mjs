#!/usr/bin/env node

/**
 * Production-shaped, local-safe smoke/load harness.
 *
 * Default mode uses an in-memory fixture server. To exercise a local Next
 * server, pass --base-url http://127.0.0.1:3000. Remote hosts are refused
 * unless --allow-remote is explicitly supplied. No production credentials are
 * read from deploy files; local keys must be passed explicitly as env vars.
 */
import { createServer } from "node:http";
import { URL } from "node:url";
import { writeFile } from "node:fs/promises";

const READ_ROUTES = [
  "/api/v2/overview", "/api/v2/tools", "/api/v2/catalogs",
  "/api/v2/reliability", "/api/v2/outcomes", "/api/v2/journeys",
  "/api/v2/data-trust", "/api/v2/resources", "/api/v2/prompts",
  // Action Queue intentionally requires a signed-in human session; ingest
  // API keys must receive 403 and are covered by the authenticated auth smoke.
];

export function parseArgs(argv = process.argv.slice(2)) {
  const out = {
    baseUrl: "",
    requests: 120,
    concurrency: 8,
    p95Ms: 750,
    maxErrorRate: 0.01,
    timeoutMs: 10_000,
    allowRemote: false,
    report: "",
    quiet: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === "--base-url") { out.baseUrl = value; i += 1; }
    else if (arg === "--requests") { out.requests = Number(value); i += 1; }
    else if (arg === "--concurrency") { out.concurrency = Number(value); i += 1; }
    else if (arg === "--p95-ms") { out.p95Ms = Number(value); i += 1; }
    else if (arg === "--max-error-rate") { out.maxErrorRate = Number(value); i += 1; }
    else if (arg === "--timeout-ms") { out.timeoutMs = Number(value); i += 1; }
    else if (arg === "--allow-remote") out.allowRemote = true;
    else if (arg === "--report") { out.report = value; i += 1; }
    else if (arg === "--quiet") out.quiet = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(out.requests) || out.requests < 1 || out.requests > 10_000) throw new Error("--requests must be 1..10000");
  if (!Number.isInteger(out.concurrency) || out.concurrency < 1 || out.concurrency > 32) throw new Error("--concurrency must be 1..32");
  if (out.concurrency > out.requests) out.concurrency = out.requests;
  if (!Number.isFinite(out.p95Ms) || out.p95Ms <= 0) throw new Error("--p95-ms must be positive");
  if (!Number.isFinite(out.maxErrorRate) || out.maxErrorRate < 0 || out.maxErrorRate > 1) throw new Error("--max-error-rate must be 0..1");
  if (!Number.isFinite(out.timeoutMs) || out.timeoutMs < 1 || out.timeoutMs > 120_000) throw new Error("--timeout-ms must be 1..120000");
  if (out.baseUrl) {
    const url = new URL(out.baseUrl);
    const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (!local && !out.allowRemote) throw new Error("Refusing non-local --base-url; use --allow-remote only for an explicitly approved test host");
    if (!/^https?:$/.test(url.protocol)) throw new Error("--base-url must use http or https");
  }
  return out;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function safeRoute(url) {
  const path = new URL(url).pathname;
  return path.startsWith("/api/") ? path : "/unknown";
}

export function summarize(samples, startedAt, thresholds) {
  const latencies = samples.map((s) => s.latencyMs);
  const errors = samples.filter((s) => s.error || s.status < 200 || s.status >= 300);
  const timeouts = samples.filter((s) => s.timedOut === true);
  const isolationFailures = samples.filter((s) => s.isolation === false);
  const statusClasses = { successful: 0, clientErrors: 0, serverErrors: 0, otherHttp: 0, transportErrors: 0 };
  const byRoute = {};
  for (const sample of samples) {
    if (sample.error || sample.status === 0) statusClasses.transportErrors += 1;
    else if (sample.status >= 200 && sample.status < 300) statusClasses.successful += 1;
    else if (sample.status >= 400 && sample.status < 500) statusClasses.clientErrors += 1;
    else if (sample.status >= 500 && sample.status < 600) statusClasses.serverErrors += 1;
    else statusClasses.otherHttp += 1;
    const route = sample.route;
    byRoute[route] ??= { requests: 0, errors: 0, latenciesMs: [] };
    byRoute[route].requests += 1;
    byRoute[route].latenciesMs.push(sample.latencyMs);
    if (sample.error || sample.status < 200 || sample.status >= 300) byRoute[route].errors += 1;
  }
  for (const value of Object.values(byRoute)) {
    value.p50Ms = percentile(value.latenciesMs, 50);
    value.p95Ms = percentile(value.latenciesMs, 95);
    value.p99Ms = percentile(value.latenciesMs, 99);
    delete value.latenciesMs;
  }
  const errorRate = samples.length ? errors.length / samples.length : 1;
  const p95Ms = percentile(latencies, 95);
  const checks = {
    p95: p95Ms <= thresholds.p95Ms,
    errorRate: errorRate <= thresholds.maxErrorRate,
    tenantIsolation: isolationFailures.length === 0,
    noTimeouts: timeouts.length === 0,
    completed: samples.length > 0,
  };
  return {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    requests: samples.length,
    successes: samples.length - errors.length,
    errors: errors.length,
    timeouts: timeouts.length,
    errorRate,
    statusClasses,
    latencyMs: { p50: percentile(latencies, 50), p95: p95Ms, p99: percentile(latencies, 99), max: Math.max(...latencies, 0) },
    tenantIsolationFailures: isolationFailures.length,
    thresholds,
    checks,
    pass: Object.values(checks).every(Boolean),
    byRoute,
  };
}

function fixturePayload(tenant) {
  const own = tenant === "a" ? "tenant-a" : "tenant-b";
  return { data: { workspace_id: own, total_events: 3, tools: [{ name: `${own}-tool` }], caveats: [] } };
}

/** Fixture server deliberately returns only the authenticated tenant's marker. */
export function createFixtureServer() {
  return createServer(async (req, res) => {
    const auth = String(req.headers.authorization || "");
    const tenant = auth.includes("load-key-a") ? "a" : auth.includes("load-key-b") ? "b" : null;
    if (!tenant) { res.writeHead(401, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "unauthorized" })); return; }
    if (req.method === "POST" && req.url === "/api/v1/ingest") {
      res.writeHead(202, { "content-type": "application/json" }); res.end(JSON.stringify({ accepted: true, workspace_id: tenant === "a" ? "tenant-a" : "tenant-b" })); return;
    }
    if (req.method === "GET" && READ_ROUTES.some((route) => req.url?.startsWith(route))) {
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(fixturePayload(tenant))); return;
    }
    res.writeHead(404, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "not_found" }));
  });
}

async function run() {
  const options = parseArgs();
  if (options.help) { console.log("Usage: node scripts/production-load-harness.mjs [--base-url http://127.0.0.1:3000] [--requests 120] [--concurrency 8] [--p95-ms 750] [--max-error-rate 0.01] [--timeout-ms 10000] [--report report.json]"); return; }
  let server;
  let baseUrl = options.baseUrl;
  if (!baseUrl) {
    server = createFixtureServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  }
  const samples = [];
  const startedAt = Date.now();
  let cursor = 0;
  async function one(index) {
    const tenant = index % 2 === 0 ? "a" : "b";
    const key = tenant === "a" ? (process.env.TRACKMCP_LOAD_KEY_A || "load-key-a") : (process.env.TRACKMCP_LOAD_KEY_B || "load-key-b");
    const ingest = index % 5 === 0;
    const path = ingest ? "/api/v1/ingest" : READ_ROUTES[index % READ_ROUTES.length];
    const url = `${baseUrl}${path}`;
    const started = performance.now();
    let status = 0; let error = ""; let errorDetail = ""; let isolation = true; let timedOut = false;
    let timeout;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), options.timeoutMs);
      const response = await fetch(url, {
        method: ingest ? "POST" : "GET",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: ingest ? JSON.stringify({ events: [{
          schema_version: "1",
          observation_source: "server",
          event_id: `load-harness-${tenant}-${index}-${Date.now()}`,
          event_type: "tool_call",
          service: "load-harness",
          environment: "production",
          started_at: new Date().toISOString(),
          success: true,
        }] }) : undefined,
        signal: controller.signal,
      });
      status = response.status;
      const text = await response.text();
      if (status < 200 || status >= 300) errorDetail = text.slice(0, 240);
      if (tenant === "a" && text.includes("tenant-b")) isolation = false;
      if (tenant === "b" && text.includes("tenant-a")) isolation = false;
    } catch (cause) {
      timedOut = cause?.name === "AbortError";
      error = timedOut ? `request timed out after ${options.timeoutMs} ms` : cause instanceof Error ? cause.message : String(cause);
    } finally {
      clearTimeout(timeout);
    }
    samples.push({ route: safeRoute(url), status, latencyMs: Math.round((performance.now() - started) * 100) / 100, error: error || undefined, errorDetail: errorDetail || undefined, isolation, timedOut });
  }
  async function worker() { while (true) { const index = cursor++; if (index >= options.requests) return; await one(index); } }
  await Promise.all(Array.from({ length: options.concurrency }, worker));
  if (server) await new Promise((resolve) => server.close(resolve));
  const report = summarize(samples, startedAt, { p95Ms: options.p95Ms, maxErrorRate: options.maxErrorRate, concurrency: options.concurrency });
  if (options.report) await writeFile(options.report, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (!options.quiet) console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) run().catch((error) => { console.error(error.message); process.exitCode = 2; });
