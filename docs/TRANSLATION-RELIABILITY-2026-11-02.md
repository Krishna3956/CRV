# TrackMCP translation reliability handoff

Date: 2026-11-02
Merged commit: `e666f90ebe85b65e01336a2b7731a7a5343f0f51`
Status: deployed to App Runner and verified by the post-deploy production gate.

## Goal

Make the public-site English to Simplified Chinese translation flow reliable on every route, without a browser refresh or an indefinitely stuck loading state. Keep the authenticated app usable in English by default, remove the duplicate global control from dashboard routes, and expose the selector in the dashboard sidebar above the sign-out/account area.

## Root causes found

- A user-initiated translation was treated as an initial-load translation because the runtime inferred “initial” from `document.documentElement.lang`. That set `data-trackmcp-translation-pending` and hid the whole page while a user request was in progress.
- Client translation requests had no timeout or cancellation path. A stalled provider could leave the selector in “Translating…” indefinitely.
- Any provider error recursively split the batch. A service outage therefore multiplied requests and prolonged the stuck state.
- The global selector was rendered on dashboard and onboarding routes even though the requested in-app control belongs in the signed-out/account area.

## Changes

- `trackmcp-nextjs/src/components/TranslationRuntime.tsx`
  - Distinguishes bootstrap translation (the server-rendered locale bootstrap explicitly marks it pending) from a user click.
  - Adds 12-second request and 20-second page deadlines.
  - Aborts stale translation work when the locale changes back to English.
  - Fails fast for cancellation, rate limiting, and provider/server failures instead of recursively splitting those batches.
  - Keeps best-effort splitting only for item-level validation failures.
- `trackmcp-nextjs/src/components/GlobalLanguageSwitcher.tsx`
  - Adds a route-aware public-site selector and suppresses the global selector on `/dashboard` and `/onboarding`.
- `trackmcp-nextjs/src/app/layout.tsx`
  - Uses the route-aware global selector.
- `trackmcp-nextjs/src/components/Nav.tsx`
  - Adds the selector to the responsive public mobile menu while retaining the desktop navigation control.
- `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx`
  - Adds the selector above the sign-out and account identity controls in the dashboard sidebar.
- `trackmcp-nextjs/scripts/translation.contract.test.mjs`
  - Covers route placement and timeout/cancellation contracts.
- `trackmcp-nextjs/scripts/translation-route-audit.mjs`
  - Recognizes the route-aware global selector in the root layout.

## Verification completed

From `trackmcp-nextjs`:

- `node --test --experimental-strip-types src/lib/translation-quality.test.ts scripts/translation.contract.test.mjs` — 18 passed.
- `npx tsc --noEmit` — passed.
- Focused ESLint over every changed TS/TSX file and the contract test — passed.
- `git diff --check` — passed.
- `npm run build` — passed; 211 static pages generated.
- `npm run audit:translation-routes` — passed. Inventory: 51 page entry points, 3 dynamic families, 53 API routes excluded, 108 blog entries.
- Full App Runner route audit against `https://i95pzq2xh7.ap-south-1.awsapprunner.com` with `TRANSLATION_AUDIT_ALL_SITEMAP_ROUTES=true` — every sampled sitemap route returned HTTP 200 and server HTML exposed the language control.
- Live translation provider probe — HTTP 200 with Simplified Chinese output.
- Unsupported translation locale probe — HTTP 400 as expected.

The live runtime audit covered the homepage, feature/product pages, docs, repository/discovery pages, all sitemap blog URLs, all category URLs, a tool URL, and the translation endpoint. It does not replace interactive device testing; the connected browser surface was unavailable to this run, so mobile interaction should be rechecked after deployment.

## Deployment and rollback

The change was merged through PR #854 and deployed by App Runner workflow run `41421327314`. The deployed `/api/health` response reports release SHA `e666f90ebe85b65e01336a2b7731a7a5343f0f51`. The workflow's post-deploy gate completed successfully, including the full sitemap/runtime audit and live provider probe. To repeat the verification manually:

```bash
TRANSLATION_AUDIT_BASE_URL=https://trackmcp.com \
TRANSLATION_AUDIT_TRANSLATE=true \
TRANSLATION_AUDIT_ALL_SITEMAP_ROUTES=true \
npm run audit:translation-live-runtime
```

Then manually verify one public desktop route, one public mobile route, `/signin`, `/dashboard`, and `/dashboard/onboarding`: selecting Chinese must not navigate or reload; selecting English must immediately restore the original text; a failed provider request must return to English with an error state rather than spin forever. Roll back to the prior App Runner revision if those checks fail.

## Remaining limitations

- The translation is still client-side DOM translation and remains English-first for server-rendered HTML and crawlers.
- Interactive browser/device verification could not be completed in this run because the attached browser surface did not expose a usable page snapshot. The automated live route/provider audit passed.
- No provider or copy changes were made; this release only hardens runtime behavior and control placement.
