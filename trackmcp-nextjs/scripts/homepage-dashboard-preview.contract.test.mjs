import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const homepagePath = new URL("../src/components/HomepageDashboardDemo.tsx", import.meta.url);
const dashboardPath = new URL("../src/components/dashboard/DashboardApp.tsx", import.meta.url);

test("homepage preview renders the production dashboard in example-only mode", async () => {
  const source = await readFile(homepagePath, "utf8");
  assert.match(source, /import \{ DashboardApp, type View \} from "@\/components\/dashboard\/DashboardApp"/);
  assert.match(source, /<DashboardApp[\s\S]*sampleOnly[\s\S]*preview[\s\S]*controlledView=\{view\}/);
  assert.doesNotMatch(source, /DashboardMock|HeroDashboardScene/);
  assert.match(source, /data-homepage-dashboard-preview/);
});

test("dashboard sample mode has no live data control and no route mutation", async () => {
  const source = await readFile(dashboardPath, "utf8");
  assert.match(source, /sampleOnly \? <ExampleDataBadge \/> : <DataModeToggle/);
  assert.match(source, /if \(sampleOnly\) \{[\s\S]*setDataModeState\("example"\)/);
  assert.match(source, /if \(!sampleOnly\) writeRouteState/);
  assert.match(source, /readOnly=\{sampleOnly\}/);
});
