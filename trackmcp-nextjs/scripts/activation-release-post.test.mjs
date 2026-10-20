import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(path), "utf8");
const postsSource = read("src/app/blog/posts.ts");
const releaseSlug = "trackmcp-cli-activation-release";
const start = postsSource.indexOf(`    slug: "${releaseSlug}"`);
const next = postsSource.indexOf("\n  {", start + 1);
const releaseSource = postsSource.slice(start, next > -1 ? next : undefined);

test("the current CLI activation release is published as a release note", () => {
  assert.ok(start > -1, "missing CLI activation release post");
  assert.match(releaseSource, /section: "releases"/);
  assert.match(releaseSource, /npx @trackmcp\/cli init/);
  assert.match(releaseSource, /--no-browser/);
  assert.match(releaseSource, /npx @trackmcp\/cli doctor/);
});

test("the release note states the credential and npm-install safety boundaries", () => {
  assert.match(releaseSource, /browser never receives or displays the connection key/);
  assert.match(releaseSource, /Package installation itself does not send an activation event or start an authorization flow/);
  assert.match(releaseSource, /Install is silent\. Setup is explicit/);
  assert.match(releaseSource, /key alone proves a real event was ingested/);
});

test("release listing and sitemap derive the new route from the shared post inventory", () => {
  assert.match(read("src/app/blog/releases/page.tsx"), /posts\.filter\(\(post\) => post\.section === "releases"\)/);
  assert.match(read("src/app/blog/[slug]/page.tsx"), /posts\.map\(\(p\) => \(\{ slug: p\.slug \}\)\)/);
  assert.match(read("src/app/sitemap.ts"), /posts\.map\(\(p\) =>/);
});
