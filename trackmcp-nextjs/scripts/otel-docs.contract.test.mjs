import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiDocs = await readFile(new URL("../src/app/docs/api/page.tsx", import.meta.url), "utf8");
const otelDocs = await readFile(new URL("../src/app/docs/opentelemetry/page.tsx", import.meta.url), "utf8");

test("public API docs state the exact bounded OTel interoperability boundary", () => {
  assert.match(apiDocs, /\/api\/v1\/otel\/v1\/traces/);
  assert.match(apiDocs, /OTLP\/HTTP JSON/);
  assert.match(apiDocs, /256 KiB/);
  assert.match(apiDocs, /100 spans/);
  assert.match(apiDocs, /protobuf is metadata-only/i);
  assert.match(apiDocs, /OTLP\/gRPC/);
  assert.match(apiDocs, /not a general-purpose trace archive/);
  assert.match(apiDocs, /not a full OTel[\s\S]{0,80}integration/);
});

test("OpenTelemetry docs provide actionable setup and native-SDK CTAs", () => {
  assert.match(otelDocs, /href="\/dashboard\?view=setup"/);
  assert.match(otelDocs, /Open Dashboard Setup/);
  assert.match(otelDocs, /href="\/docs\/typescript"/);
  assert.match(otelDocs, /Use the native SDK guide/);
  assert.match(otelDocs, /cursor-pointer/);
  assert.match(otelDocs, /focus-visible:ring/);
  assert.match(otelDocs, /HTML 403/);
  assert.match(otelDocs, /rejected telemetry/i);
});

test("API docs disclose the public-edge OTEL write limitation", () => {
  assert.match(apiDocs, /default automated server-to-server user agents/);
  assert.match(apiDocs, /Cloudflare HTTP 403/);
  assert.match(apiDocs, /rejected telemetry/i);
});
