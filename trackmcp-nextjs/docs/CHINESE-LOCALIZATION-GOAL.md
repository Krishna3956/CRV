# TrackMCP Chinese Localization, Translation Quality, and Organic Growth

This is the persistent execution ledger for the Chinese localization workstream
under the active TrackMCP readiness goal. It records evidence, not assumptions.

## North star

Deliver a technically credible Simplified Chinese experience that keeps English
as the default, gives users an explicit language choice, preserves MCP/code
identifiers, exposes truthful metadata and crawl paths, and can be maintained
as new pages and directory entries are added.

## Milestones

| # | Milestone | Status | Acceptance evidence |
|---:|---|---|---|
| 1 | Website discovery and translation inventory | In progress | `npm run audit:translation-routes`; full live inventory still pending |
| 2 | Repair existing Chinese translation issues | In progress | Runtime safeguards exist; page-by-page linguistic review pending |
| 3 | Standardize translation pipeline | In progress | Bounded provider, cache, glossary hook, fail-closed quality gate, and contract tests exist |
| 4 | Intelligent language selection and persistence | Foundation complete | English default, explicit cookie precedence, non-blocking Chinese suggestion, and dismiss persistence implemented |
| 5 | Chinese technical SEO | In progress | Existing SEO/sitemap infrastructure is under audit; localized URL/hreflang inventory pending |
| 6 | Chinese keyword and content optimization | Not started | Requires evidence-based search and analytics inventory |
| 7 | Directory localization at scale | In progress | Shared runtime covers dynamic tool pages; full sitemap count and quality policy pending |
| 8 | Mainland China/Baidu readiness | Not started | Must be tested from a mainland network or documented as externally blocked |
| 9 | Automated localization/SEO regression checks | Foundation complete | Translation contract and quality tests pass; visual and metadata assertions pending |
| 10 | Production test, deploy, and verify | Pending this batch | Local build/tests pass; release PR and live verification required |
| 11 | Ongoing monitoring and optimization | Not started | Requires baseline metrics and scheduled audit workflow |

## Current change set

- Removed silent browser-language switching. A first-time visitor remains in
  English unless an explicit locale cookie exists.
- Added a non-blocking, dismissible Simplified Chinese suggestion for browsers
  that advertise a Simplified Chinese preference.
- The suggestion persists both an explicit choice and dismissal for one year,
  and dispatches the existing locale-change event so the shared runtime updates
  the current page without navigation.
- Added contract coverage for the default, suggestion copy, dismissal cookie,
  and root-layout mounting.

## Verification record

- `npm run test:translation`: 15 tests passed.
- Focused ESLint: passed.
- `npm run build`: passed; 210 routes generated.
- Native-speaker review: not yet performed. Automated checks do not prove
  linguistic perfection.

## Next execution order

1. Inventory all user-visible English/Chinese surfaces and metadata sources.
2. Build the source-to-translation audit and terminology change log.
3. Review high-traffic static pages and the complete blog batch.
4. Audit localized SEO, canonicals, hreflang, sitemap, robots, and structured data.
5. Add deterministic visual/metadata/link regression checks.
6. Run the release gate, open one coherent PR, deploy, and verify production.

## Explicit external dependencies

- A qualified Simplified Chinese reviewer is required before claiming native-level
  linguistic approval.
- Baidu indexing and mainland network reachability require evidence from those
  environments; an outside-region probe cannot prove either outcome.
- Search volume, ranking, backlink, and traffic improvements require connected
  search/analytics systems and must not be fabricated from page availability.
