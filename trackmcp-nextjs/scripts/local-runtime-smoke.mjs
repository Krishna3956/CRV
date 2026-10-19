#!/usr/bin/env node

const baseUrl = process.env.TRACKMCP_SMOKE_BASE_URL || "http://localhost:3000";
const publicRoutes = [
  "/",
  "/docs",
  "/docs/typescript",
  "/docs/python",
  "/device",
  "/dashboard?view=setup&data=example",
  "/sitemap.xml",
  "/tool-sitemap.xml",
];
const expectedApiStatuses = new Map([
  ["/api/v2/overview", 401],
  ["/api/v2/data-trust", 401],
  ["/api/v1/analytics", 401],
  ["/api/v1/ingest", 405],
  ["/api/v1/otel/v1/traces", 405],
  ["/api/v1/cli/device/sessions", 405],
  ["/api/v1/cli/key-status", 401],
  ["/api/internal/refresh/run", 401],
  ["/api/internal/rate-limit/cleanup", 401],
  ["/api/internal/privacy/review", 401],
]);

const requiredSecurityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function target(path) {
  const url = new URL(path, baseUrl);
  if (!/[a-z][a-z0-9+.-]*:\/\//i.test(baseUrl)) throw new Error("TRACKMCP_SMOKE_BASE_URL must be an absolute URL.");
  return url;
}

async function check(path, expectedStatus) {
  const options = path.startsWith("/api/internal/")
    ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ max_jobs: 1 }) }
    : {};
  const response = await fetch(target(path), { ...options, redirect: "manual", signal: AbortSignal.timeout(15_000) });
  if (response.status !== expectedStatus) {
    throw new Error(`${path}: expected ${expectedStatus}, received ${response.status}`);
  }
  if (!path.startsWith("/api/")) {
    for (const [name, expected] of Object.entries(requiredSecurityHeaders)) {
      if (response.headers.get(name) !== expected) throw new Error(`${path}: missing or incorrect ${name} header`);
    }
  }
  return response.status;
}

for (const path of publicRoutes) await check(path, 200);
for (const [path, status] of expectedApiStatuses) await check(path, status);

console.log(`Local runtime smoke passed: ${publicRoutes.length} public routes and ${expectedApiStatuses.size} protected/API checks at ${baseUrl}`);
