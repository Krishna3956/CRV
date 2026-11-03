# TrackMCP sitewide link-integrity release

Status: in progress  
Branch: `codex/link-integrity-release`  
Scope: internal navigation and link-like controls across the marketing site, product dashboard, documentation, blogs, release notes, directory, generated tool pages, and sitemap surfaces.

## Objective

Every first-party destination exposed by a clickable link or navigation control must resolve to a real supported route or an intentional in-page action. A control that looks clickable must either perform its documented action, navigate to a verified destination, or be clearly disabled. External references are audited separately because third-party availability and robots/rate limits are outside TrackMCP's control.

## Evidence model

1. **Static inventory** — collect literal and template internal `href` values, router transitions, `window.location` assignments, and button destinations from `src/`.
2. **Route inventory** — enumerate App Router pages, route handlers used as destinations, blog slugs, docs slugs, categories, and sitemap families.
3. **Contract checks** — fail on unresolved literal first-party routes, empty/hash destinations, invalid button destinations, and known dead-click patterns.
4. **Runtime crawl** — build the application, start the standalone server with redacted placeholder configuration, and request every static public route plus representative generated routes. Record status, redirect chains, canonical destinations, and error pages.
5. **Production verification** — after the existing GitHub/App Runner release succeeds, repeat the public route checks with bounded concurrency and a browser-compatible user agent. Cloudflare challenges and third-party failures are recorded as caveats, never hidden.

## Fix policy

- Preserve valid public pages and authored content.
- Repair wrong first-party paths, stale anchors, and buttons that silently do nothing.
- Replace unsupported links with the nearest truthful first-party destination or remove the affordance when no supported destination exists.
- Do not invent external URLs, fabricate product claims, mass-submit directories, or delete data.
- Do not treat a transient third-party `403`, rate limit, or Cloudflare challenge as proof that a TrackMCP route is dead.

## Completion checklist

- [ ] Static source inventory and route inventory generated.
- [ ] Internal-link contract test added and passing.
- [ ] Button/dead-click contract test added and passing.
- [ ] Dynamic blog/docs/category/tool route families covered.
- [ ] Local production crawl has zero unresolved first-party destinations.
- [ ] TypeScript, lint, focused tests, and production build pass.
- [ ] One coherent commit pushed from this isolated branch.
- [ ] Pull request merged through the normal repository workflow.
- [ ] App Runner deployment succeeds.
- [ ] Production route/link smoke checks pass and evidence report is recorded.

## Known limits

External links are not owned by TrackMCP. They are reported with URL, response class, and retry result, but are not rewritten without a source-backed replacement. Authenticated-only dashboard routes are checked for the expected sign-in boundary rather than falsely requiring public `200` responses.
