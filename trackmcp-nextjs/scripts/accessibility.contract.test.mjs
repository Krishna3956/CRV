import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const css = read("src/app/globals.css");
const device = read("src/components/DeviceApprovalClient.tsx");
const dashboard = read("src/components/dashboard/IntegrationChecklist.tsx");
const setupModal = read("src/components/dashboard/SetupModal.tsx");
const docsShell = read("src/components/DocsShell.tsx");
const tester = read("src/components/mcp-tester/McpTesterApp.tsx");
const dashboardMock = read("src/components/DashboardMock.tsx");
const howItWorks = read("src/components/HowItWorksFlow.tsx");
const logo = read("src/components/TrackMCPLogo.tsx");
const nav = read("src/components/Nav.tsx");
const sharedInteractive = [
  read("src/components/CopyButton.tsx"),
  read("src/components/LanguageSwitcher.tsx"),
  read("src/components/LanguageSuggestion.tsx"),
  read("src/components/repository/CategoryFilter.tsx"),
  read("src/components/repository/FilterBar.tsx"),
  read("src/components/repository/BrowseClient.tsx"),
  read("src/components/repository/MarkdownRenderer.tsx"),
  read("src/components/repository/SubmitClient.tsx"),
  read("src/components/repository/SubmitToolDialog.tsx"),
  read("src/components/repository/TableOfContents.tsx"),
  read("src/components/ContactForm.tsx"),
  read("src/app/signin/page.tsx"),
];

test("primary pilot flows retain keyboard focus and reduced-motion contracts", () => {
  assert.match(css, /:focus-visible\s*\{/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation-duration:\s*0\.001ms/);
  assert.match(device, /htmlFor="device-workspace"/);
  assert.match(device, /id="device-workspace"/);
  assert.match(dashboard, /aria-label="Copy TrackMCP setup command"/);
  assert.match(dashboard, /cursor-pointer[\s\S]*Complete onboarding/);
  assert.match(dashboard, /cursor-pointer[\s\S]*Generate key/);
  assert.match(dashboard, /cursor-pointer[\s\S]*Check data/);
  assert.match(dashboard, /<button type="button" onClick=\{onComplete\}/);
  assert.match(dashboard, /<button type="button" onClick=\{onDismiss\}/);
  assert.match(dashboard, /<button type="button" onClick=\{onGenerateKey\}/);
  assert.match(dashboard, /<button type="button" onClick=\{onRefresh\}/);
  assert.match(setupModal, /<button type="submit" disabled=\{working\}/);
  assert.match(nav, /<button\s+type="button"\s+aria-label="Menu"/);
  assert.match(nav, /aria-expanded=\{open\}/);
  assert.match(nav, /aria-controls="site-mobile-menu"/);
  assert.match(nav, /id="site-mobile-menu"/);
  assert.match(nav, /<Link[\s\S]*href="\/signin"[\s\S]*signInLabel/);
  assert.match(nav, /<LanguageSwitcher\s*\/>[\s\S]*<\/div>/);
  for (const href of ["/docs/typescript", "/docs/python", "/docs/go", "/docs/dotnet", "/docs/opentelemetry", "/docs/protocol"]) {
    assert.match(dashboard, new RegExp(`href="${href}"`));
  }
  assert.match(logo, /focus-visible:ring/);
  assert.match(css, /button:not\(:disabled\)[\s\S]*cursor:\s*pointer/);
  assert.match(css, /button:disabled\s*\{[\s\S]*cursor:\s*not-allowed/);
});

test("accessibility audit does not hide focus or use inaccessible placeholder controls", () => {
  assert.doesNotMatch(css, /outline:\s*none/);
  assert.doesNotMatch(device, /href="#"/);
  assert.doesNotMatch(dashboard, /href="#"/);
});

test("all navigable links expose the pointer affordance", () => {
  assert.match(css, /button:not\(:disabled\),\s*\[href\],\s*\[role="button"\],\s*summary\s*\{[\s\S]*cursor:\s*pointer/);
});

test("docs, onboarding, and MCP tester controls expose visible focus rings", () => {
  for (const source of [docsShell, dashboard, tester]) {
    const interactiveTags = [...source.matchAll(/<(?:a|button|summary)\b[^>]*cursor-pointer[^>]*>/g)].map(([tag]) => tag);
    assert.ok(interactiveTags.length > 0);
    for (const tag of interactiveTags) assert.match(tag, /focus-visible:ring-2/, `interactive control lacks a focus ring: ${tag}`);
  }
});

test("interactive marketing demos use explicit button semantics", () => {
  assert.match(dashboardMock, /<button\s+type="button"\s+data-demo=\{demo\}/);
  assert.match(dashboardMock, /<button\s*\n\s*key=\{it\.key\}\s*\n\s*type="button"/);
  assert.match(dashboardMock, /<button type="button" onClick=\{\(\) => pickView\("clients"\)\}/);
  assert.match(dashboardMock, /<button type="button" data-demo="view-all-tools"/);
  assert.match(howItWorks, /<button\s*\n\s*type="button"\s*\n\s*onClick=\{\(\) => setActive/);
  assert.match(dashboardMock, /type="button"[\s\S]*cursor-pointer[\s\S]*focus-visible:ring-2/);
  assert.match(howItWorks, /type="button"[\s\S]*cursor-pointer[\s\S]*focus-visible:ring-2/);
});

test("shared public controls expose pointer and keyboard affordances", () => {
  for (const source of sharedInteractive) {
    assert.match(source, /cursor-pointer/, "shared control is missing an explicit pointer affordance");
    assert.match(source, /focus-visible:ring-2/, "shared control is missing a visible keyboard focus ring");
  }
});
