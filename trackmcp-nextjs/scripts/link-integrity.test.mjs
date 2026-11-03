import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const APP_ROOT = path.resolve("src/app");
const SOURCE_ROOT = path.resolve("src");

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (/\.(?:tsx?|jsx?|mjs)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

function routeFromPage(file) {
  const relative = path.relative(APP_ROOT, path.dirname(file));
  if (relative === "") return "/";
  return `/${relative.split(path.sep).map((segment) => segment.startsWith("[") ? `:${segment.slice(1, -1)}` : segment).join("/")}`;
}

const appFiles = walk(APP_ROOT);
const sourceFiles = walk(SOURCE_ROOT);
const pageRoutes = new Set(
  appFiles.filter((file) => path.basename(file) === "page.tsx").map(routeFromPage),
);

function isSupportedRoute(href) {
  const pathname = new URL(href, "https://trackmcp.test").pathname;
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/tool/") || pathname.startsWith("/category/") || pathname.startsWith("/blog/")) return true;
  if (pathname === "/krishna-goyal.jpg") return fs.existsSync(path.resolve("public/krishna-goyal.jpg"));
  if (pageRoutes.has(pathname)) return true;
  return false;
}

function collectSourceLinks() {
  const links = [];
  const bad = [];
  const literal = /\b(?:href|src)\s*=\s*(["'`])([^"'`]+)\1/g;
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = literal.exec(content))) {
      const value = match[2].trim();
      const line = content.slice(0, match.index).split("\n").length;
      if (!value || value === "#" || value.startsWith("javascript:")) {
        bad.push({ file, line, value });
      } else if (value.startsWith("/")) {
        links.push({ file, line, value });
      }
    }
  }
  return { links, bad };
}

test("all literal first-party source links resolve to a known route family", () => {
  const { links, bad } = collectSourceLinks();
  assert.deepEqual(bad, [], `empty/hash/javascript destinations found: ${JSON.stringify(bad)}`);
  const unresolved = links.filter(({ value }) => !isSupportedRoute(value));
  assert.deepEqual(unresolved, [], `unresolved first-party links: ${JSON.stringify(unresolved, null, 2)}`);
  assert.ok(links.length >= 100, `expected a meaningful source inventory, found ${links.length}`);
});

test("external anchors declare a new-tab safety boundary", () => {
  const violations = [];
  const anchor = /<a\b([^>]*\bhref\s*=\s*(["'])(https?:\/\/[^"']+)\2[^>]*)>/gi;
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = anchor.exec(content))) {
      const attributes = match[1];
      if (!/\btarget\s*=\s*["']_blank["']/.test(attributes) || !/\brel\s*=\s*["'][^"']*noopener[^"']*["']/.test(attributes)) {
        violations.push({ file, line: content.slice(0, match.index).split("\n").length, href: match[3] });
      }
    }
  }
  assert.deepEqual(violations, [], `external anchors without target/rel safety: ${JSON.stringify(violations, null, 2)}`);
});

test("route inventory includes the documented public surfaces", () => {
  for (const route of ["/", "/docs", "/docs/cli", "/repository", "/submit-mcp", "/blog", "/blog/releases", "/dashboard", "/pricing", "/privacy", "/terms"]) {
    assert.ok(pageRoutes.has(route), `missing public page route ${route}`);
  }
});

