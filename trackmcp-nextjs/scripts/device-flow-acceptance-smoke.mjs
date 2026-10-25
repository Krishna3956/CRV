#!/usr/bin/env node

/**
 * Deterministic device-flow acceptance matrix. This deliberately uses the
 * bounded fixture adapters and membership projection; it never contacts a
 * production host, creates a key, or writes a credential.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const reportPath = process.env.TRACKMCP_DEVICE_FLOW_REPORT || "/tmp/trackmcp-device-flow-smoke.json";
const { fixtureDeviceAuthAdapter } = await import("../src/lib/device-auth.ts");
const { deviceStateCopy } = await import("../src/lib/device-auth-ui.ts");
const { publicWorkspaceMemberships } = await import("../src/lib/workspace-memberships.ts");

const input = { userCode: "F7KQ-2M9D", workspaceId: "workspace-fixture" };
const checks = [];

async function expectResult(label, adapter, expected, copyStatus) {
  const result = await adapter.approve(input);
  if (JSON.stringify(result) !== JSON.stringify(expected)) throw new Error(`${label}: unexpected result`);
  const copy = deviceStateCopy(copyStatus);
  if (!copy?.title || !copy?.detail || /api[_ -]?key|device_code|bearer/i.test(`${copy.title} ${copy.detail}`)) throw new Error(`${label}: unsafe or incomplete recovery copy`);
  checks.push({ label, status: result.status, recovery_copy: true });
}

await expectResult("expired device session", fixtureDeviceAuthAdapter({ status: "expired" }), { status: "expired" }, "expired");
await expectResult("denied device session", fixtureDeviceAuthAdapter({ status: "denied", reason_category: "user_denied" }), { status: "denied", reason_category: "user_denied" }, "denied");

const multiple = publicWorkspaceMemberships([
  { user_id: "user-fixture", workspace_id: "workspace-a", role: "owner", trackmcp_workspaces: { id: "workspace-a", name: "Alpha", slug: "alpha" } },
  { user_id: "user-fixture", workspace_id: "workspace-b", role: "member", trackmcp_workspaces: { id: "workspace-b", name: "Beta", slug: "beta" } },
], "user-fixture");
if (multiple.length !== 2 || multiple[0].id !== "workspace-a" || multiple[1].id !== "workspace-b") throw new Error("multiple membership selection is not deterministic");
checks.push({ label: "multiple workspace memberships", status: "select", workspace_options: multiple.length });

const none = publicWorkspaceMemberships([], "user-fixture");
if (none.length !== 0) throw new Error("empty membership set did not require workspace creation");
checks.push({ label: "workspace creation when no membership exists", status: "none", workspace_options: 0 });

const report = {
  outcome: "passed",
  generated_at: new Date().toISOString(),
  environment: "deterministic-fixtures",
  checks_total: checks.length,
  checks_executed: checks.length,
  checks,
  caveats: ["This matrix does not exercise a production browser session or create a connection key."],
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(`Device-flow acceptance smoke passed: ${checks.length} checks. Redacted report: ${reportPath}`);
