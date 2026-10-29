import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const typescript = require("typescript");

const appRoot = resolve(process.cwd(), "src/app");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(appRoot);
const pages = files
  .filter((file) => file.endsWith("/page.tsx"))
  .map((file) => {
    const routeFile = relative(appRoot, file);
    return routeFile === "page.tsx" ? "/" : routeFile.replace(/\/page\.tsx$/, "");
  })
  .sort();
const dynamicPages = pages.filter((page) => page.includes("["));
const apiRoutes = files.filter((file) => file.includes("/api/") && file.endsWith("/route.ts"));
const rootLayout = await readFile(join(appRoot, "layout.tsx"), "utf8");
const sitemapSource = await readFile(join(appRoot, "sitemap.ts"), "utf8");

function countSlugObjects(filePath, source) {
  const sourceFile = typescript.createSourceFile(filePath, source, typescript.ScriptTarget.Latest, true);
  let count = 0;
  const visit = (node) => {
    if (
      typescript.isObjectLiteralExpression(node) &&
      node.properties.some((property) => property.name?.getText(sourceFile) === "slug")
    ) {
      count += 1;
    }
    typescript.forEachChild(node, visit);
  };
  visit(sourceFile);
  return count;
}

const blogSources = await Promise.all(
  ["posts.ts", "next-batch.ts"].map(async (name) => {
    const filePath = join(appRoot, "blog", name);
    return countSlugObjects(filePath, await readFile(filePath, "utf8"));
  }),
);
const blogPostEntries = blogSources.reduce((sum, count) => sum + count, 0);
const staticSitemapUrls = [...sitemapSource.matchAll(/url:\s*`\$\{BASE\}(?:\/[^`$]*)?`/g)].length;
const categoryEntries = (await readFile(join(appRoot, "../lib/repository/types.ts"), "utf8"))
  .match(/\bid:\s*["']/g)?.length || 0;

if (!rootLayout.includes("<LanguageSwitcher") || !rootLayout.includes("<TranslationRuntime")) {
  throw new Error("Root layout is missing the global language runtime.");
}
for (const expected of ["tool/[name]", "blog/[slug]", "category/[slug]"]) {
  if (!dynamicPages.includes(expected)) throw new Error(`Expected dynamic route is missing: ${expected}`);
}

const report = {
  pageEntrypoints: pages.length,
  dynamicPageEntrypoints: dynamicPages.length,
  apiRoutesExcluded: apiRoutes.length,
  sourcePublicUrlInventory: {
    staticSitemapUrls,
    blogPostEntries,
    categoryEntries,
    totalBeforeToolCatalog: staticSitemapUrls + blogPostEntries + categoryEntries,
  },
  rootRuntime: "verified",
  dynamicRoutesVerified: ["tool/[name]", "blog/[slug]", "category/[slug]"],
};
console.log(JSON.stringify(report, null, 2));
