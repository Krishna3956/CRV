import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const appRoot = path.resolve(new URL("..", import.meta.url).pathname);
const shell = await readFile(path.join(appRoot, "src/components/DocsShell.tsx"), "utf8");
const overview = await readFile(path.join(appRoot, "src/app/docs/page.tsx"), "utf8");
const typescript = await readFile(path.join(appRoot, "src/app/docs/typescript/page.tsx"), "utf8");

const destinations = [...shell.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);

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

test("the shared wordmark cannot acquire a text-link border or underline", async () => {
  const logo = await readFile(path.join(appRoot, "src/components/TrackMCPLogo.tsx"), "utf8");
  const css = await readFile(path.join(appRoot, "src/app/globals.css"), "utf8");
  assert.match(logo, /trackmcp-logo/);
  assert.match(css, /\.trackmcp-logo\s*\{[\s\S]*border:\s*0\s*!important;[\s\S]*text-decoration:\s*none\s*!important;/);
});
