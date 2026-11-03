# Sitewide link-integrity audit report

Date: 2026-11-03  
Branch: `codex/link-integrity-release`  
Source baseline: `origin/main` at `79d554d928710290cd8eaf452cc47c739d06988e`

## What was checked

- Source-level literal `href`/`src` destinations across `src/`.
- App Router public page inventory.
- Documentation sidebar and mobile navigation.
- Header, footer, marketing CTAs, dashboard setup links, authentication links, repository links, blog links, and release-note links.
- Rendered HTML from the production build's standalone server.
- Internal links discovered while crawling every statically generated public route.
- Directory sitemap index, all four tool sitemap shards, and all 17,555 canonical tool URLs listed by the production shards (the sitemap URLs were validated as unique, canonical, and shard-backed; a full HTTP request to every generated page is not repeated in CI because it would create an unnecessary production load spike).
- 130 external URLs discovered in rendered HTML, with bounded retries and a separate external-failure classification.

## Results

| Check | Result |
| --- | ---: |
| Static public routes crawled locally | 178 |
| Internal targets discovered in rendered HTML | 543 |
| Internal 404/5xx failures | 0 |
| Empty/hash/javascript destinations | 0 |
| External links discovered | 130 |
| External links returning 2xx/3xx in the audit | 126 |
| External responses requiring caveat | 4 |
| Production tool sitemap shards | 4 |
| Production tool URLs listed | 17,555 |
| Sitemap shard response failures | 0 |

## External caveats

The following third-party hosts returned bot protection or a timeout rather than a confirmed 404:

- Product Hunt embed: HTTP 403
- Socket: HTTP 403
- Arize Phoenix docs: HTTP 403
- Metorial: timeout during the bounded audit

These are not TrackMCP-owned routes and were not replaced with invented destinations. They should be rechecked periodically from a browser-capable monitor. A third-party 403 is not evidence that the content is gone.

## Changes shipped in this release

- Added `scripts/link-integrity.test.mjs` to fail CI on unresolved literal first-party routes, empty/hash/javascript destinations, missing documented public routes, and unsafe external anchor handling.
- Added `scripts/link-integrity-audit.mjs` for local or production runtime crawling. It checks sitemap-backed routes, discovers internal links from rendered HTML, and optionally audits external URLs without hiding third-party failures.
- Added `test:link-integrity` and `audit:links` package scripts.
- Added the source-level execution plan in `docs/sitewide-link-integrity-plan-2026-11.md`.

No existing public page or authored post was deleted or rewritten. No data or secrets were changed.
