import assert from "node:assert/strict";
import test from "node:test";
import { getMetricDefinition, METRIC_DEFINITIONS } from "./metric-definitions.ts";

test("dashboard metric registry has unique, documented definitions", () => {
  const keys = METRIC_DEFINITIONS.map((metric) => metric.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const metric of METRIC_DEFINITIONS) {
    assert.ok(metric.label.length > 0);
    assert.ok(metric.formula.length > 0);
    assert.ok(metric.source.length > 0);
    assert.ok(metric.interpretation.length > 0);
    assert.ok(metric.limitations.length > 0);
  }
});

test("identity coverage is explicitly resolver-based and does not imply unique users", () => {
  const definition = getMetricDefinition("identity_coverage");
  assert.match(definition.formula, /account_identity_source=resolver/);
  assert.match(definition.limitations.join(" "), /not a count of unique organizations/i);
  assert.match(definition.limitations.join(" "), /clientInfo/i);
});

test("metric lookup returns the canonical definition", () => {
  assert.equal(getMetricDefinition("work_completed").source, "Explicit workflow outcome events");
  assert.throws(() => getMetricDefinition("not-a-metric" as never), /Unknown metric/);
});
