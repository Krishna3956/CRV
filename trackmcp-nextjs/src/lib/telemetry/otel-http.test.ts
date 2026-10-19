import test from "node:test";
import assert from "node:assert/strict";
import { otelAttributes, parseOtelJsonBatch, OTEL_JSON_MAX_SPANS } from "./otel-http.ts";

test("parses OTLP JSON attributes and maps resource defaults without retaining raw attributes", () => {
  const result = parseOtelJsonBatch({ resourceSpans: [{
    resource: { attributes: [
      { key: "service.name", value: { stringValue: "orders" } },
      { key: "deployment.environment.name", value: { stringValue: "production" } },
    ] },
    scopeSpans: [{ spans: [{ name: "tools/call", startTimeUnixNano: "1700000000000000000", attributes: [{ key: "mcp.tool.name", value: { stringValue: "search" } }] }] }],
  }] });
  assert.equal("error" in result, false);
  if (!("error" in result)) {
    assert.equal(result.service, "orders");
    assert.equal(result.environment, "production");
    assert.equal(result.spans.length, 1);
    assert.deepEqual(result.spans[0].attributes, { "mcp.tool.name": "search" });
  }
  assert.deepEqual(otelAttributes({ attributes: [{ key: "secret", value: { stringValue: "not persisted by mapper" } }] }), { secret: "not persisted by mapper" });
});

test("bounds OTLP JSON batches and rejects empty envelopes", () => {
  assert.deepEqual(parseOtelJsonBatch({}), { error: "resourceSpans must be an array" });
  assert.deepEqual(parseOtelJsonBatch({ resourceSpans: [] }), { error: "resourceSpans contains no spans" });
  const spans = Array.from({ length: OTEL_JSON_MAX_SPANS + 10 }, (_, index) => ({ name: `tools/call/${index}`, startTimeUnixNano: "1700000000000000000" }));
  const result = parseOtelJsonBatch({ resourceSpans: [{ scopeSpans: [{ spans }] }] });
  assert.equal("error" in result, false);
  if (!("error" in result)) assert.equal(result.spans.length, OTEL_JSON_MAX_SPANS);
});
