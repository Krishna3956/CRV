import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const parity = await readFile(new URL("../../docs/FOUNDER-OS-PDF-PRODUCT-PARITY.md", import.meta.url), "utf8");

test("PDF parity ledger keeps current bounded product truth", () => {
  assert.match(parity, /current source\/deployment reconciliation \(2026-10-27\)/i);
  assert.match(parity, /Reliability.*Implemented as bounded/i);
  assert.match(parity, /write-enabled key-lifecycle and transport runs remain explicitly disposable-secret-gated/i);
  assert.match(parity, /OTLP\/gRPC.*unsupported/i);
  assert.match(parity, /proxy.*not a full alternative/i);
});
