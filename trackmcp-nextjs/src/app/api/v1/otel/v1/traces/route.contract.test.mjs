import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");

test("OTLP endpoint is bounded, JSON-only, and delegates to authenticated ingest", () => {
  assert.match(source, /export const POST/);
  assert.ok(handlers.includes("application/json"));
  assert.match(handlers, /OTEL_JSON_MAX_BYTES/);
  assert.match(handlers, /status: 415/);
  assert.match(handlers, /createIngestHandler/);
  assert.match(handlers, /authorization/);
  assert.doesNotMatch(`${source}\n${handlers}`, /api_key|traceId|exception/);
});
