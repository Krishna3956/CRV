import assert from "node:assert/strict";
import test from "node:test";
import { assertTranslationBatchQuality, translationQualityError } from "./translation-quality.ts";

test("accepts Chinese output while preserving protected URL and code tokens", () => {
  assert.equal(
    translationQualityError("Read the docs at https://trackmcp.com/docs and run `npx trackmcp`.", "请阅读文档 https://trackmcp.com/docs 并运行 `npx trackmcp`。"),
    null,
  );
});

test("rejects an unchanged English sentence", () => {
  assert.match(translationQualityError("Browse MCP servers", "Browse MCP servers") || "", /untranslated/);
});

test("rejects changed protected tokens", () => {
  assert.match(translationQualityError("Open https://trackmcp.com", "打开 https://example.com") || "", /protected/);
});

test("allows identifiers and acronyms to remain Latin", () => {
  assert.equal(translationQualityError("MCP API GitHub TrackMCP", "MCP API GitHub TrackMCP"), null);
});

test("rejects an incomplete batch before display", () => {
  assert.throws(() => assertTranslationBatchQuality(["Hello", "World"], ["你好"]), /incomplete/);
});
