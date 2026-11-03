# TrackMCP dashboard research and color work queue

Date: 2026-11-03

## Completed

- [x] Inventory current dashboard navigation and visual tokens.
- [x] Review official documentation for product analytics and observability patterns.
- [x] Compare 20+ platforms and capture reusable patterns.
- [x] Document linked visual references without copying competitor assets.
- [x] Define TrackMCP grouping, semantic color tokens, and copy rules.
- [x] Map every dashboard surface to its typed analytics/read-model source.
- [x] Split navigation into Understand, Outcomes, Investigate, and Configure groups.
- [x] Remove the redundant Overview "Choose the next question" card.

## In progress

- [x] Add semantic colors to dashboard navigation and domain affordances.
- [x] Add chart palette utilities without changing data contracts.
- [x] Add regression tests for color tokens and navigation grouping.
- [x] Run focused tests, typecheck, lint, build, and runtime smoke.
- [x] Publish one coherent branch and verify the release through the existing GitHub Action.
- [x] Complete the backend-gap audit and document unsupported surfaces explicitly.
- [x] Harden App Runner release identity verification against transient warm-up 502s.

## Next implementation slices

- [ ] Simplify the remaining high-density views (Resources & prompts, Setup,
  Evidence) using the same rule: one business question per section, technical
  detail collapsed, and no duplicate explanatory cards.
- [ ] Add or tighten focused contract tests for each simplification without
  changing the typed analytics contract.
- [ ] Re-run the full release gate and production smoke after the next UI slice.

## Later, not silently included

- [ ] Build missing read models for account concentration, resource/prompt adoption, and deployment joins.
- [ ] Add persisted saved views or exports only after a product decision and schema review.
- [ ] Add replay/heatmap-style evidence only after privacy and retention review.
- [ ] Revisit mobile/tablet layouts; the current pilot remains desktop-first.

The remaining implementation work is deliberately sequenced by view. A view
cannot be marked complete merely because it looks better: its metrics must
still trace through `Analytics`/authenticated response types to bounded server
queries, as described in `docs/dashboard-backend-gap-audit-2026-11.md`.

