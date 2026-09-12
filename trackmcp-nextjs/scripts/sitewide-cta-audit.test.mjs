import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const sourceRoot = path.resolve("src");
const sourceFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) sourceFiles.push(file);
  }
}

walk(sourceRoot);

function source(file) {
  return fs.readFileSync(path.join(sourceRoot, file), "utf8");
}

test("homepage CTAs are real, descriptive internal links", () => {
  const homepage = source("app/page.tsx");
  assert.match(homepage, /<Button href="\/blog\/mcp-server-analytics-guide"[^>]*>\s*Read the analytics guide/);
  assert.match(homepage, /<Button href="\/mcp-observability"[^>]*>\s*See how it works/);
});

test("shared Button requires a destination and cannot silently render a hash link", () => {
  const button = source("components/Button.tsx");
  assert.match(button, /href,\s*\n\s*variant/);
  assert.match(button, /href: string;/);
  assert.doesNotMatch(button, /href\s*=\s*["']#["']/);
});

test("every Button call supplies an explicit destination", () => {
  const missing = [];
  for (const file of sourceFiles) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/<Button\b[\s\S]*?>/g)) {
      if (!/\bhref\s*=/.test(match[0])) {
        missing.push(`${path.relative(process.cwd(), file)}:${text.slice(0, match.index).split("\n").length}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("literal internal links resolve to an App Router page", () => {
  const routes = new Set(["/"]);
  for (const file of sourceFiles) {
    const relative = path.relative(path.join(process.cwd(), "src/app"), file).replaceAll(path.sep, "/");
    const pageMatch = relative.match(/^(.+?)\/page\.(tsx|ts|jsx|js)$/);
    if (pageMatch) routes.add(`/${pageMatch[1]}`);
    else if (/^page\.(tsx|ts|jsx|js)$/.test(relative)) routes.add("/");
  }

  const missing = [];
  for (const file of sourceFiles) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/(?:href|to)\s*=\s*["'](\/[^"'#?]*)/g)) {
      const href = match[1];
      const exists = [...routes].some((route) => {
        if (route === href) return true;
        if (!route.includes("[")) return false;
        return new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`).test(href);
      });
      if (!exists) {
        missing.push(`${path.relative(process.cwd(), file)}:${text.slice(0, match.index).split("\n").length} ${href}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});
