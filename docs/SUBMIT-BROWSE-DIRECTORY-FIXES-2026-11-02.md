# TrackMCP submit and directory fixes

Date: 2026-11-02  
Base: `origin/main` at `0ad0a7c9` (`docs: pause AWS Supabase migration with handoff (#851)`)

## User-reported problems and acceptance checklist

- [x] Capture the latest GitHub state before changing product code.
- [x] Keep this work in one isolated release batch so related changes can be reviewed and tested together.
- [x] Keep the Submit your MCP form to three user fields: GitHub repository, email, and acquisition source.
- [x] Ask for the repository first, reveal email next, and reveal acquisition source after email input begins.
- [x] Remove the optional source-detail field from the visible form.
- [x] Remove the Get Featured upsell from the visible form and always send `wantsFeatured: false` from current UI flows.
- [x] Preserve the `wants_featured` database column and attribution JSON so existing data and backend consumers do not break.
- [x] Include the acquisition source in the Web3Forms notification payload.
- [x] Add the acquisition-source dropdown to the compact Browse directory submission dialog.
- [x] Give native source selects a stable in-flow wrapper and explicit chevron so they do not visually overlap the next field.
- [x] Put a Submit your MCP CTA in the header area of Popular, What's New, and category listings.
- [x] Put the same CTA in the Categories page header.
- [x] Keep the repository navigation label as `Browse all`.
- [x] Make Popular ordering deterministic by GitHub stars, with a stable id tie-breaker and null stars last.
- [x] Keep What's New ordered by submission `created_at`, with a stable id tie-breaker.
- [x] Ensure successful submissions invalidate `/new` and `/repository` so a newly submitted pending row is discoverable without waiting for ISR.
- [x] Make category counts and category pages use the same canonical category normalization.
- [x] Handle legacy `Other`, blank, and uncategorized labels instead of returning a false zero-match category page.
- [x] Apply conservative display-time category inference from bounded repository metadata; no rows are deleted or mutated by this release.
- [x] Make category filtering compare canonical category ids rather than raw legacy labels.
- [x] Make Trending directory-wide: only the five highest-star rows supplied by the server receive the badge, not the top five rows of a search/category slice.
- [x] Keep search uncached and include approved plus pending rows so a recent submission can be found.

## Files changed in this batch

- `trackmcp-nextjs/src/components/repository/SubmitClient.tsx`
- `trackmcp-nextjs/src/components/repository/SubmitToolDialog.tsx`
- `trackmcp-nextjs/src/components/repository/BrowseClient.tsx`
- `trackmcp-nextjs/src/components/repository/RepoListing.tsx`
- `trackmcp-nextjs/src/app/repository/page.tsx`
- `trackmcp-nextjs/src/app/categories/page.tsx`
- `trackmcp-nextjs/src/app/top-mcp/page.tsx`
- `trackmcp-nextjs/src/lib/repository/types.ts`
- `trackmcp-nextjs/src/lib/repository/queries.ts`

## Data and compatibility decision

The release does not run a bulk SQL update against `mcp_tools`. Imported rows can use inconsistent category labels, and the migration work is paused. Instead, the read model canonicalizes legacy labels and uses a conservative, deterministic classifier for rows that are blank or still marked `Other`. This immediately fixes category navigation and counts without risking a destructive production rewrite. A later data-quality job can persist the same classifications after sampling and review.

The submission API keeps accepting the existing `wantsFeatured` input for old callers, but all current public forms send `false` and no longer expose the feature upsell. The `wants_featured` column remains present for compatibility.

## Verification plan

Run from `trackmcp-nextjs` after the final diff is reviewed:

```bash
npm run test:submission-attribution
npm run test:translation
npx tsc --noEmit
npx eslint src/components/repository/SubmitClient.tsx src/components/repository/SubmitToolDialog.tsx src/components/repository/BrowseClient.tsx src/components/repository/RepoListing.tsx src/app/repository/page.tsx src/app/categories/page.tsx src/app/top-mcp/page.tsx src/lib/repository/types.ts src/lib/repository/queries.ts
npm run build
```

### Checks completed in this release batch

- `npm run test:submission-attribution` passed (11 tests).
- `npm run test:translation` passed (18 tests).
- `npm run test:sitewide-ctas` passed (6 tests).
- `npm run test:seo-foundation` passed (5 tests).
- `npm run test:mcp-discovery` passed (4 passed, 1 intentionally skipped live-render test).
- `npx tsc --noEmit` passed.
- Targeted ESLint passed for all changed TypeScript/TSX files.
- `npm run build` passed and generated all 211 static pages plus dynamic routes.

Manual acceptance after deployment:

1. Open `/submit-mcp` on desktop and mobile. Confirm the fields appear in order and the source select is revealed only after email input starts.
2. Submit a known test repository and confirm the notification email includes `how_did_you_hear_about_trackmcp`.
3. Open `/repository`, `/top-mcp`, `/new`, `/categories`, and one `/category/...` route. Confirm each has a working Submit your MCP CTA.
4. Search for the newly submitted repository and verify it appears while pending.
5. Select each category and confirm the result count is not incorrectly zero for categories represented by legacy labels.
6. Confirm Trending badges are limited to the same five highest-star directory rows across unfiltered, search, and category views.

## Release notes for the next engineer

This batch should be committed and pushed as one coherent change after the checks above pass. Do not hand-edit production data as part of this UI release. If a persisted category backfill is later approved, reuse `inferCategory` in `src/lib/repository/types.ts`, run it in a bounded/idempotent job, sample the proposed changes, and retain the original metadata for rollback.
