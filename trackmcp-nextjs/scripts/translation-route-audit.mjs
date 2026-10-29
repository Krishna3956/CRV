import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

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
  rootRuntime: "verified",
  dynamicRoutesVerified: ["tool/[name]", "blog/[slug]", "category/[slug]"],
};
console.log(JSON.stringify(report, null, 2));
