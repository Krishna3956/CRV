import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiDocs = await readFile(new URL("../src/app/docs/api/page.tsx", import.meta.url), "utf8");

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
