#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

const baseUrl = (process.env.LINK_AUDIT_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const concurrency = Math.max(1, Math.min(32, Number(process.env.LINK_AUDIT_CONCURRENCY || 8)));
const external = process.argv.includes("--check-external");
const timeoutMs = Math.max(1000, Math.min(30000, Number(process.env.LINK_AUDIT_TIMEOUT_MS || 10000)));

function pathFromUrl(value) {
  const url = new URL(value, baseUrl);
  return `${url.pathname}${url.search}`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "TrackMCP-link-integrity-audit/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { response, text: await response.text() };
}

async function mapLimit(values, worker) {
  const results = [];
  let cursor = 0;
  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= values.length) return;
      results[index] = await worker(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length || 1) }, run));
  return results;
}

const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
if (!sitemap.response.ok) throw new Error(`/sitemap.xml returned ${sitemap.response.status}`);
const sitemapUrls = [...sitemap.text.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)].map((match) => pathFromUrl(match[1]));
const seedRoutes = new Set(["/", "/docs", "/repository", "/submit-mcp", "/dashboard", "/signin", "/signup", "/blog", "/blog/releases", "/pricing", "/privacy", "/terms", ...sitemapUrls]);
const routeResults = await mapLimit([...seedRoutes], async (route) => {
  try {
    const { response, text } = await fetchText(`${baseUrl}${route}`);
    return { route, status: response.status, htmlBytes: text.length, html: response.ok && response.headers.get("content-type")?.includes("text/html") ? text : "" };
  } catch (error) {
    return { route, status: "ERR", error: error instanceof Error ? error.message : String(error), html: "" };
  }
});

const pageFailures = routeResults.filter((result) => result.status === "ERR" || result.status === 404 || result.status >= 500);
const internalLinks = new Map();
const externalLinks = new Set();
const malformed = [];
for (const result of routeResults) {
  if (!result.html) continue;
  const anchor = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;
  let match;
  while ((match = anchor.exec(result.html))) {
    const href = match[2].trim();
    if (!href || href === "#" || href.startsWith("javascript:")) malformed.push({ from: result.route, href });
    else if (href.startsWith("/")) {
      const target = new URL(href, baseUrl).pathname + new URL(href, baseUrl).search;
      if (!internalLinks.has(target)) internalLinks.set(target, new Set());
      internalLinks.get(target).add(result.route);
    } else if (/^https?:\/\//i.test(href)) externalLinks.add(href);
  }
}

const internalResults = await mapLimit([...internalLinks.keys()], async (route) => {
  try {
    const { response } = await fetchText(`${baseUrl}${route}`);
    return { route, status: response.status, from: [...internalLinks.get(route)].slice(0, 5) };
  } catch (error) {
    return { route, status: "ERR", error: error instanceof Error ? error.message : String(error), from: [...internalLinks.get(route)].slice(0, 5) };
  }
});
const internalFailures = internalResults.filter((result) => result.status === "ERR" || result.status === 404 || result.status >= 500);

let externalResults = [];
if (external) {
  externalResults = await mapLimit([...externalLinks], async (url) => {
    try {
      const response = await fetch(url, { redirect: "manual", headers: { "user-agent": "TrackMCP-link-integrity-audit/1.0" }, signal: AbortSignal.timeout(timeoutMs) });
      return { url, status: response.status };
    } catch (error) {
      return { url, status: "ERR", error: error instanceof Error ? error.message : String(error) };
    }
  });
}

const report = {
  baseUrl,
  routeCount: routeResults.length,
  pageFailures,
  internalLinkCount: internalLinks.size,
  internalFailures,
  malformed,
  externalLinkCount: externalLinks.size,
  externalFailures: externalResults.filter((result) => result.status === "ERR" || result.status >= 400),
};
console.log(JSON.stringify(report, null, 2));
if (pageFailures.length || internalFailures.length || malformed.length) process.exitCode = 1;

