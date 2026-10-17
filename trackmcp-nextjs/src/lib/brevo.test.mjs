import assert from "node:assert/strict";
import test from "node:test";
import { syncBrevoRepositorySubmission } from "./brevo.ts";

const submission = {
  email: "owner@example.com",
  githubUrl: "https://github.com/example/demo-mcp",
  mcpName: "Demo MCP",
  trackmcpUrl: "https://trackmcp.com/tool/example--demo-mcp",
};

const originalFetch = globalThis.fetch;
const originalEndpoint = process.env.BREVO_SUBMIT_FORM_URL;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalEndpoint === undefined) delete process.env.BREVO_SUBMIT_FORM_URL;
  else process.env.BREVO_SUBMIT_FORM_URL = originalEndpoint;
});

test("Brevo sync is disabled when no hosted-form endpoint is configured", async () => {
  delete process.env.BREVO_SUBMIT_FORM_URL;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response(null, { status: 204 }); };

  assert.deepEqual(await syncBrevoRepositorySubmission(submission), { configured: false, ok: false });
  assert.equal(calls, 0);
});

test("Brevo sync sends the expected contact properties when configured", async () => {
  process.env.BREVO_SUBMIT_FORM_URL = "https://example.test/brevo-submit";
  let request;
  globalThis.fetch = async (input, init) => {
    request = { input: String(input), init };
    return new Response(null, { status: 204 });
  };

  assert.deepEqual(await syncBrevoRepositorySubmission(submission), { configured: true, ok: true });
  assert.equal(request.input, process.env.BREVO_SUBMIT_FORM_URL);
  const body = new URLSearchParams(request.init.body);
  assert.equal(body.get("EMAIL"), submission.email);
  assert.equal(body.get("GITHUB_REPO_URL"), submission.githubUrl);
  assert.equal(body.get("MCP_NAME"), submission.mcpName);
  assert.equal(body.get("TRACKMCP_URL"), submission.trackmcpUrl);
});

test("Brevo failure is best-effort and returns without throwing after persistence", async () => {
  process.env.BREVO_SUBMIT_FORM_URL = "https://example.test/brevo-submit";
  globalThis.fetch = async () => { throw new Error("Brevo unavailable"); };

  // The route awaits this only after the Supabase insert succeeds. A relay
  // failure must resolve normally so the saved listing remains successful.
  await assert.doesNotReject(async () => {
    assert.deepEqual(await syncBrevoRepositorySubmission(submission), { configured: true, ok: false });
  });
});
