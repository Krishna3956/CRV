import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [goDocs, dotnetDocs, goReadme, dotnetReadme] = await Promise.all([
  readFile(new URL("../src/app/docs/go/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/docs/dotnet/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../packages/go-sdk/README.md", import.meta.url), "utf8"),
  readFile(new URL("../packages/dotnet-sdk/README.md", import.meta.url), "utf8"),
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
  }
});
