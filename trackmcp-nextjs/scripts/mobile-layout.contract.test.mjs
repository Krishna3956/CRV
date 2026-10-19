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
  assert.match(home, /w-full min-w-0 max-w-full[\s\S]*sm:w-auto/);
  assert.match(home, /min-w-0 truncate text-body/);
});

test("docs overview uses responsive grids and overflow-safe code blocks", () => {
  assert.match(docs, /grid gap-3 sm:grid-cols-3/);
  assert.match(docs, /grid gap-3 sm:grid-cols-2/);
  assert.match(docsShell, /pre className="overflow-x-auto/);
  assert.match(docsShell, /aria-label="Documentation navigation"/);
  assert.match(docsShell, /overflow-x-auto[\s\S]*lg:hidden/);
});

test("device approval keeps actions and authentication controls wrap-safe", () => {
  assert.match(device, /min-h-screen bg-canvas px-6/);
  assert.match(device, /flex flex-col justify-center gap-2 sm:flex-row/);
  assert.match(device, /w-full max-w-md rounded-2xl/);
});

test("dashboard mobile navigation and data controls remain bounded", () => {
  assert.match(dashboard, /min-h-\[52px\] flex-wrap/);
  assert.match(dashboard, /w-\[35vw\] max-w-\[180px\] min-w-0/);
  assert.match(dashboard, /overflow-x-auto.*aria-label="Dashboard navigation"/s);
  assert.match(dashboard, /overflow-x-auto[\s\S]*min-w-\[/);
});
