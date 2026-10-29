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
  assert.match(home, /w-full min-w-0 max-w-\[18rem\][\s\S]*sm:w-auto/);
  assert.match(home, /min-w-0 truncate text-body/);
});

test("homepage hides the desktop-only hero bridge on phones", () => {
  assert.match(home, /<section className="relative hidden bg-mist pb-14 md:block md:pb-20">/);
});

test("docs overview uses responsive grids and overflow-safe code blocks", () => {
  assert.match(docs, /grid gap-3 sm:grid-cols-3/);
  assert.match(docs, /grid gap-3 sm:grid-cols-2/);
  assert.match(docsShell, /pre className="overflow-x-auto/);
  assert.match(docsShell, /aria-label="Documentation navigation"/);
  assert.match(docsShell, /overflow-x-auto[\s\S]*lg:hidden/);
  assert.match(docsShell, /block cursor-pointer rounded-md/);
  assert.match(docsShell, /shrink-0 cursor-pointer rounded-full/);
  assert.match(docsShell, /href: "\/docs#quickstart"/);
  assert.match(docsShell, /href: "\/docs#how-it-works"/);
  assert.match(docsShell, /href: "\/docs#verify-data"/);
  assert.match(docsShell, /href: "\/docs#troubleshooting"/);
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
