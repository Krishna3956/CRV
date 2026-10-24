import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [goDocs, dotnetDocs, goReadme, dotnetReadme, goSource, dotnetSource] = await Promise.all([
  readFile(new URL("../src/app/docs/go/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/docs/dotnet/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../packages/go-sdk/README.md", import.meta.url), "utf8"),
  readFile(new URL("../packages/dotnet-sdk/README.md", import.meta.url), "utf8"),
  readFile(new URL("../packages/go-sdk/trackmcp.go", import.meta.url), "utf8"),
  readFile(new URL("../packages/dotnet-sdk/TrackMcp.cs", import.meta.url), "utf8"),
]);

test("Go and .NET docs disclose source-package status and first-event verification", () => {
  for (const source of [goDocs, dotnetDocs]) {
    assert.match(source, /reviewed source package/);
    assert.match(source, /not advertised as a separately published/);
    assert.match(source, /TRACKMCP_KEY/);
    assert.match(source, /fail-open/);
    assert.match(source, /Verify your first event/);
    assert.match(source, /account-identity/);
    assert.match(source, /does not implement OAuth/);
    assert.match(source, /RecordTransportFailure/);
    assert.match(source, /transport_closed/);
    assert.match(source, /transport_error/);
  }
});

test("Go and .NET source expose bounded MRTR/task result metadata", () => {
  assert.match(goSource, /RecordProtocolResult/);
  assert.match(goSource, /ResultType/);
  assert.match(goSource, /InputRequestCount/);
  assert.match(goSource, /InputResponseCount/);
  assert.match(goSource, /protocolResultTypes/);
  assert.match(dotnetSource, /RecordProtocolResult/);
  assert.match(dotnetSource, /inputRequestCount/);
  assert.match(dotnetSource, /inputResponseCount/);
  assert.match(dotnetSource, /ReadAllowlisted/);
  assert.match(dotnetSource, /BoundedCount/);
  assert.match(dotnetSource, /catch \(InvalidOperationException\)/);
  assert.match(dotnetSource, /ReadBool/);
});

test("Go and .NET package READMEs carry the same privacy and lifecycle boundary", () => {
  for (const source of [goReadme, dotnetReadme]) {
    assert.match(source, /fail-open/i);
    assert.match(source, /Capture/i);
    assert.match(source, /flush/i);
    assert.match(source, /TRACKMCP_KEY/);
    assert.match(source, /OAuth/i);
    assert.match(source, /redact|privacy|sensitive/i);
    assert.match(source, /RecordTransportFailure/);
    assert.match(source, /transport_closed/);
    assert.match(source, /transport_error/);
    assert.match(source, /subscription_started/);
    assert.match(source, /subscription_stopped/);
  }
});

test("Go and .NET observers expose the bounded subscription signal parity", () => {
  for (const source of [goSource, dotnetSource]) {
    assert.match(source, /subscription_started/);
    assert.match(source, /subscription_stopped/);
    assert.doesNotMatch(source, /subscription[_ ](?:uri|id|content)/i);
  }
});

test("Go and .NET observers expose bounded catalog-page parity", () => {
  for (const source of [goSource, dotnetSource]) {
    assert.match(source, /RecordCatalog/);
    assert.match(source, /catalog_page/);
    assert.match(source, /next_cursor_present/);
    assert.match(source, /SHA-256|SHA256|HashData/);
    assert.doesNotMatch(source, /cursor value.*queued/i);
  }
  for (const docs of [goReadme, dotnetReadme]) {
    assert.match(docs, /RecordCatalog/);
    assert.match(docs, /SHA-256/);
    assert.match(docs, /next cursor/);
    assert.match(docs, /never queued/);
  }
});

test("cross-language protocol signal observers validate direction", () => {
  assert.match(goSource, /RecordProtocolSignalDirection/);
  assert.match(goSource, /client_to_server/);
  assert.match(dotnetSource, /client_to_server/);
  assert.match(dotnetSource, /direction/);
  assert.match(goReadme, /inbound cancellation/);
  assert.match(dotnetReadme, /inbound cancellation/);
});
