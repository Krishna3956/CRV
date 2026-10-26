import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const appRoot = path.resolve(new URL("..", import.meta.url).pathname);
const shell = await readFile(path.join(appRoot, "src/components/DocsShell.tsx"), "utf8");
const overview = await readFile(path.join(appRoot, "src/app/docs/page.tsx"), "utf8");
const typescript = await readFile(path.join(appRoot, "src/app/docs/typescript/page.tsx"), "utf8");
const python = await readFile(path.join(appRoot, "src/app/docs/python/page.tsx"), "utf8");
const go = await readFile(path.join(appRoot, "src/app/docs/go/page.tsx"), "utf8");
const dotnet = await readFile(path.join(appRoot, "src/app/docs/dotnet/page.tsx"), "utf8");

const destinations = [...shell.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);

async function docsPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return docsPages(file);
    return entry.name === "page.tsx" ? [file] : [];
  }));
  return nested.flat();
}

test("every documentation sidebar destination is a real route or overview section", async () => {
  assert.ok(destinations.length > 0);
  assert.equal(new Set(destinations).size, destinations.length, "duplicate docs destination");
  for (const destination of destinations) {
    assert.match(destination, /^\/docs(?:\/[a-z-]+)?(?:#[a-z-]+)?$/);
    const [route, hash] = destination.split("#");
    if (hash) {
      assert.equal(route, "/docs", `section link must target the overview: ${destination}`);
      assert.match(overview, new RegExp(`id=["']${hash}["']`), `missing docs section: ${destination}`);
    } else if (route !== "/docs") {
      const page = path.join(appRoot, "src/app", route.slice(1), "page.tsx");
      await readFile(page);
    }
  }
});

test("all authored internal docs links resolve to a documentation route", async () => {
  const pages = await docsPages(path.join(appRoot, "src/app/docs"));
  const routes = new Set(pages.map((file) => {
    const relative = path.relative(path.join(appRoot, "src/app"), file).replace(/[/\\]page\.tsx$/, "");
    return `/${relative.replaceAll("\\", "/")}`;
  }));
  const failures = [];
  for (const page of pages) {
    const source = await readFile(page, "utf8");
    for (const match of source.matchAll(/(?:href|to)=["'](\/docs[^"']*)["']/g)) {
      const destination = match[1].split("#", 1)[0];
      if (destination && !routes.has(destination)) failures.push(`${path.relative(appRoot, page)} -> ${match[1]}`);
    }
  }
  assert.deepEqual(failures, [], `broken internal documentation links: ${failures.join(", ")}`);
});

test("desktop and compact docs navigation expose real, pointer-enabled links", () => {
  assert.match(shell, /aria-label="Documentation sections"/);
  assert.match(shell, /data-doc-nav="sidebar"/);
  assert.match(shell, /pointer-events-auto/);
  assert.doesNotMatch(shell, /href:\s*["']#["']/);
});

test("the TypeScript transport observer docs match the supported official transports", () => {
  for (const transport of ["StdioClientTransport", "StreamableHTTPClientTransport", "SSEClientTransport"]) {
    assert.match(typescript, new RegExp(transport));
  }
  assert.match(typescript, /new StreamableHTTPClientTransport\(new URL\(/);
  assert.match(typescript, /new SSEClientTransport\(new URL\(/);
  assert.doesNotMatch(typescript, /supports only .*StdioClientTransport/);
});

test("every SDK guide exposes a direct Setup handoff", () => {
  for (const page of [typescript, python, go, dotnet]) {
    assert.match(page, /DocsNextSteps nativeHref="\/docs\/reference"/);
  }
  assert.match(shell, /export function DocsNextSteps/);
  assert.match(shell, /dashboard\?view=setup/);
  assert.match(shell, /Documentation next steps/);
});

test("the shared wordmark cannot acquire a text-link border or underline", async () => {
  const logo = await readFile(path.join(appRoot, "src/components/TrackMCPLogo.tsx"), "utf8");
  const css = await readFile(path.join(appRoot, "src/app/globals.css"), "utf8");
  assert.match(logo, /trackmcp-logo/);
  assert.match(css, /\.trackmcp-logo\s*\{[\s\S]*border:\s*0\s*!important;[\s\S]*text-decoration:\s*none\s*!important;/);
});
