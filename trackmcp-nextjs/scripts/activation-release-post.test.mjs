import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const postsSource = read("src/app/blog/posts.ts");
const releaseSlug = "trackmcp-one-command-cli-init";
const start = postsSource.indexOf(`    slug: "${releaseSlug}"`);
const next = postsSource.indexOf("\n  {", start + 1);
const releaseSource = postsSource.slice(start, next > -1 ? next : undefined);

test("the one-command activation release is published as a release note", () => {
  assert.ok(start > -1, "missing one-command activation release post");
  assert.match(releaseSource, /section: "releases"/);
  assert.match(releaseSource, /npx @trackmcp\/cli init/);
  assert.match(releaseSource, /--no-browser/);
  assert.match(releaseSource, /npx @trackmcp\/cli doctor/);
});

test("the release note states the credential and npm-install safety boundaries", () => {
  assert.match(releaseSource, /CLI never asks for your TrackMCP password/);
  assert.match(releaseSource, /browser never displays the raw key/);
  assert.match(releaseSource, /does not run from npm install/);
  assert.match(releaseSource, /does not claim that an npm download identifies a person/);
});

test("release listing and sitemap derive the new route from the shared post inventory", () => {
  assert.match(read("src/app/blog/releases/page.tsx"), /posts\.filter\(\(post\) => post\.section === "releases"\)/);
  assert.match(read("src/app/blog/[slug]/page.tsx"), /posts\.map\(\(p\) => \(\{ slug: p\.slug \}\)\)/);
  assert.match(read("src/app/sitemap.ts"), /posts\.map\(\(p\) =>/);
});
