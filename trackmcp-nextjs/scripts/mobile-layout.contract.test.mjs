import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../src/", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [home, docs, device, dashboard, docsShell] = await Promise.all([
  read("app/page.tsx"),
  read("app/docs/page.tsx"),
  read("components/DeviceApprovalClient.tsx"),
  read("components/dashboard/DashboardApp.tsx"),
  read("components/DocsShell.tsx"),
]);

test("homepage keeps primary actions stacked before the small-screen breakpoint", () => {
  assert.match(home, /flex flex-col items-center justify-center gap-3 sm:flex-row/);
  assert.match(home, /max-w-\[58ch\]/);
});

test("docs overview uses responsive grids and overflow-safe code blocks", () => {
  assert.match(docs, /grid gap-3 sm:grid-cols-3/);
  assert.match(docs, /grid gap-3 sm:grid-cols-2/);
  assert.match(docsShell, /pre className="overflow-x-auto/);
});

test("device approval keeps actions and authentication controls wrap-safe", () => {
  assert.match(device, /min-h-screen bg-canvas px-6/);
  assert.match(device, /flex flex-wrap justify-center gap-2/);
  assert.match(device, /max-w-xl rounded-2xl/);
});

test("dashboard mobile navigation and data controls remain bounded", () => {
  assert.match(dashboard, /min-h-\[52px\] flex-wrap/);
  assert.match(dashboard, /w-\[35vw\] max-w-\[180px\] min-w-0/);
  assert.match(dashboard, /overflow-x-auto.*aria-label="Dashboard navigation"/s);
  assert.match(dashboard, /overflow-x-auto[\s\S]*min-w-\[/);
});
