# Evidence log

## Repository evidence

Audited on branch `codex/dashboard-business-first-design` from base `522067a21d3db17d6cfe98fba508082c75208661`:

- `src/components/dashboard/DashboardApp.tsx`
- `src/components/dashboard/TraceExplorer.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/traces/page.tsx`
- `src/app/globals.css`
- `PRD-DASHBOARD-BUSINESS-FIRST-REDESIGN.md` copied into this folder for package self-containment

The source audit found the current technical nav, source/date controls, sample/live behavior, attention panel, Tool Quality bounds, explicit completion semantics, and Trace Explorer disclosure states described in [current-dashboard-audit.md](../current-dashboard-audit.md).

## Rendered current states

- [current-overview-1280.png](current-overview-1280.png) — 1280×800, Example data selected;
- [current-overview-1440.png](current-overview-1440.png) — 1440×900, Example data selected;
- [current-live-empty-1280.png](current-live-empty-1280.png) — 1280×800, Your data selected with no records;
- [current-live-empty-1440.png](current-live-empty-1440.png) — 1440×900, Your data selected with no records.

These were captured from the local authenticated dashboard bypass running from the branch base. They are evidence, not implementation output.

## Rendered proposed states

- [proposed-overview-1280.png](proposed-overview-1280.png) — rendered from the proposed 1280×800 SVG;
- [proposed-overview-1440.png](proposed-overview-1440.png) — rendered from the proposed 1440×900 SVG.

The remaining proposed screens are self-contained SVGs in [../screens/](../screens/). They can be opened directly in a browser or rendered at their declared dimensions.

## Public website evidence

- [TrackMCP homepage](https://www.trackmcp.com/) — says the product explains who uses an MCP server, what they are trying to do, whether work gets done, and what to fix next; also shows a business-facing example Overview.
- [TrackMCP pricing](https://www.trackmcp.com/pricing) — positions the product as usage analytics, actionable insights, client breakdown, sessions/funnels, and bounded sanitized traces.
- [TrackMCP docs](https://www.trackmcp.com/docs) — explains that TrackMCP observes server-boundary clients, tools, protocol events, redacted payloads, latency, errors, and explicit workflow outcomes; it also states that private model turns are not observed by default.

The public site is the reason the redesign must make the dashboard answer-first rather than simply rename technical cards.

## Requested UI Skills evidence

The supplied PRD cites UI Skills guidance for improving an existing interface, dashboard/SaaS interface design, and creating a design system from an existing product. The environment did not expose those skills or a matching CLI/MCP package, so the package records the cited principles rather than claiming a direct skill read:

- state intent before choosing a visual pattern;
- explore the product domain before choosing a theme;
- one focal point per screen;
- deliberate type and density;
- reject generic dashboard defaults;
- render before implementation;
- reuse existing accessible primitives when implementation begins.

## Unresolved evidence questions

- The live API does not currently expose a universally reliable last-observed/stale timestamp for every dashboard surface.
- The API may not provide enough explicit workflow outcomes for every workspace; the design therefore keeps Work completed unavailable when evidence is missing.
- Client metadata is not the same as end-user identity; the proposed copy intentionally says AI clients observed.
- P1-05 alert UI contracts need a separate reviewed design for thresholds, baselines, minimum volume, delivery, firing/resolved/suppressed, and invalid states.
- The public apex had a transient Cloudflare 502 during the audit note in the supplied PRD; the successful `www` pages were used for content evidence.
