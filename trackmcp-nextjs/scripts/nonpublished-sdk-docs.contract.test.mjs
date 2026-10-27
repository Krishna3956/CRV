import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [goDocs, dotnetDocs, pythonDocs, goReadme, dotnetReadme, tsReadme, goSource, dotnetSource] = await Promise.all([
  readFile(new URL("../src/app/docs/go/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/docs/dotnet/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/docs/python/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../packages/go-sdk/README.md", import.meta.url), "utf8"),
  readFile(new URL("../packages/dotnet-sdk/README.md", import.meta.url), "utf8"),
  readFile(new URL("../packages/typescript-sdk/README.md", import.meta.url), "utf8"),
  readFile(new URL("../packages/go-sdk/trackmcp.go", import.meta.url), "utf8"),
  readFile(new URL("../packages/dotnet-sdk/TrackMcp.cs", import.meta.url), "utf8"),
]);
const dotnetSmokeProject = await readFile(new URL("../packages/dotnet-sdk/tests/TrackMcp.Smoke.csproj", import.meta.url), "utf8");
const dotnetSmokeSource = await readFile(new URL("../packages/dotnet-sdk/tests/Program.cs", import.meta.url), "utf8");
const goSmokeSource = await readFile(new URL("../packages/go-sdk/smoke/main.go", import.meta.url), "utf8");
const pythonSmokeSource = await readFile(new URL("../../packages/python-sdk/smoke.py", import.meta.url), "utf8");

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
    assert.match(source, /RecordEntityRead/);
    assert.match(source, /resources\/read/);
    assert.match(source, /prompts\/get/);
    assert.match(source, /returned content never leave the process/);
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

test("Go and .NET docs expose bounded release metadata options", () => {
  assert.match(goDocs, /ServerVersion/);
  assert.match(goDocs, /SDKVersion/);
  assert.match(goDocs, /DeploymentID/);
  assert.match(dotnetDocs, /ServerVersion/);
  assert.match(dotnetDocs, /SdkVersion/);
  assert.match(dotnetDocs, /DeploymentId/);
  for (const docs of [goDocs, dotnetDocs]) assert.match(docs, /metadata only/);
});

test("TypeScript package README exposes bounded release metadata options", () => {
  assert.match(tsReadme, /server_version/);
  assert.match(tsReadme, /sdk_version/);
  assert.match(tsReadme, /deployment_id/);
  assert.match(tsReadme, /metadata only/);
});

test("TypeScript modern client docs expose negotiated capability boundaries", () => {
  assert.match(tsReadme, /capabilityNames/);
  assert.match(tsReadme, /io\.modelcontextprotocol\/tasks/);
  assert.match(tsReadme, /fails closed/);
  assert.match(tsReadme, /catalog subscription/);
  assert.match(tsReadme, /skip discovery/);
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

test("Go and .NET observers expose privacy-safe entity-read parity", () => {
  for (const source of [goSource, dotnetSource]) {
    assert.match(source, /RecordEntityRead/);
    assert.match(source, /observation_kind.*entity_read/);
    assert.match(source, /contents/);
    assert.match(source, /messages/);
    assert.match(source, /hashCatalogIdentity|HashData/);
  }
  for (const docs of [goReadme, dotnetReadme]) {
    assert.match(docs, /RecordEntityRead/);
    assert.match(docs, /SHA-256/);
    assert.match(docs, /returned content.*never queued|returned content.*never queued or sent/i);
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

test("Go flush exposes caller cancellation and preserves failed batches", () => {
  assert.match(goSource, /FlushContext/);
  assert.match(goSource, /HTTPClient \*http\.Client/);
  assert.match(goSource, /append\(events, c\.queue\.\.\.\)/);
  assert.match(goReadme, /FlushContext\(ctx\)/);
  assert.match(goSource, /NewRequestWithContext/);
  assert.match(goSource, /context\.Canceled|context\.Background/);
});

test(".NET hosted smoke exercises cancellation and retry preservation", () => {
  assert.match(dotnetSmokeSource, /CancellationHandler/);
  assert.match(dotnetSmokeSource, /CancellationTokenSource/);
  assert.match(dotnetSmokeSource, /preserve the batch for retry/);
});

test(".NET hosted CI runs the privacy and direction smoke harness", () => {
  assert.match(dotnetSmokeProject, /OutputType>Exe/);
  assert.match(dotnetSmokeProject, /ProjectReference Include="\.\.\/TrackMcp\.csproj"/);
  assert.match(dotnetSmokeSource, /RecordProtocolSignalForTransport\("cancelled"/);
  assert.match(dotnetSmokeSource, /client_to_server/);
  assert.match(dotnetSmokeSource, /RecordCatalog\("resources"/);
  assert.match(dotnetSmokeSource, /RecordEntityRead\("resources"/);
  assert.match(dotnetSmokeSource, /RecordEntityRead\("prompts"/);
  assert.match(dotnetSmokeSource, /raw catalog URI crossed/);
});

test("Go hosted CI runs the privacy, direction, and flush smoke harness", () => {
  assert.match(goSmokeSource, /httptest.NewServer/);
  assert.match(goSmokeSource, /RecordProtocolSignalForTransport/);
  assert.match(goSmokeSource, /client_to_server/);
  assert.match(goSmokeSource, /RecordCatalog/);
  assert.match(goSmokeSource, /RecordEntityRead/);
  assert.match(goSmokeSource, /RecordProtocolResult\("elicitation\/create"/);
  assert.match(goSmokeSource, /bounded protocol-result metadata/);
  assert.match(goSmokeSource, /RecordTransportFailure/);
  assert.match(goSmokeSource, /private-resource-name/);
  assert.match(goSmokeSource, /secret:\/\/private-resource/);
  assert.match(goSmokeSource, /Go TrackMCP runtime smoke passed/);
});

test("Python hosted CI runs the privacy, direction, and flush smoke harness", () => {
  assert.match(pythonSmokeSource, /HTTPServer/);
  assert.match(pythonSmokeSource, /record_protocol_signal/);
  assert.match(pythonSmokeSource, /client_to_server/);
  assert.match(pythonSmokeSource, /_catalog_observation/);
  assert.match(pythonSmokeSource, /_entity_protocol_event/);
  assert.match(pythonSmokeSource, /resources\/read/);
  assert.match(pythonSmokeSource, /prompts\/get/);
  assert.match(pythonSmokeSource, /record_protocol_result\(/);
  assert.match(pythonSmokeSource, /elicitation\/create/);
  assert.match(pythonSmokeSource, /record_protocol_result\([\s\S]*transport="stdio"/);
  assert.match(pythonSmokeSource, /input_request_count/);
  assert.match(pythonSmokeSource, /record_transport_failure/);
  assert.match(pythonSmokeSource, /private-resource-name/);
  assert.match(pythonSmokeSource, /secret:\/\/private-resource/);
  assert.match(pythonSmokeSource, /Python TrackMCP runtime smoke passed/);
});

test("Python public docs explain bounded protocol-result metadata", () => {
  assert.match(pythonDocs, /Protocol result metadata/);
  assert.match(pythonDocs, /input_required/);
  assert.match(pythonDocs, /task[\s\S]*handles[\s\S]*never leave the[\s\S]*process/i);
  assert.match(pythonDocs, /Completion responses/);
});
