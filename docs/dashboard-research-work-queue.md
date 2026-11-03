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
- [x] Verify the deployed release identity and public dashboard routes after the App Runner rollout.
- [x] Run the redacted production pilot smoke (37 checks; read-only mode) against the deployed release.

## Next implementation slices

- [x] Simplify Resources & prompts so the business summary leads and method-level
  evidence stays behind one optional disclosure; the displayed breakdowns remain
  sourced from `resource_prompt_activity` and `interaction_surfaces`.
- [x] Simplify Setup so the primary status stays focused on the next action while
  backend-driven caveats, first-event scope, lag, and next steps remain in one
  optional technical disclosure.
- [x] Keep Evidence focused on one bounded observed-session table with trace
  links; incident and sample detail remain explicit secondary paths.
- [x] Run focused contract tests for the Setup simplification without changing
  the typed analytics contract.
- [x] Re-run the full release gate and production smoke after the Setup slice.

## Later, not silently included

- [ ] Build missing read models for account concentration, resource/prompt adoption, and deployment joins.
- [ ] Add persisted saved views or exports only after a product decision and schema review.
- [ ] Add replay/heatmap-style evidence only after privacy and retention review.
- [ ] Revisit mobile/tablet layouts; the current pilot remains desktop-first.

The remaining implementation work is deliberately sequenced by view. A view
cannot be marked complete merely because it looks better: its metrics must
still trace through `Analytics`/authenticated response types to bounded server
queries, as described in `docs/dashboard-backend-gap-audit-2026-11.md`.

## Release evidence (2026-11-03)

- App Runner deployment workflow `41627297056` completed successfully for
  release `9adbff5c5ebd2021e8914c3a0cf98612b5a816be`.
- `https://trackmcp.com/api/health` returned HTTP 200 and the same release SHA.
- `/dashboard` overview, Resources & prompts, Setup, and Evidence example-mode
  routes each returned HTTP 200.
- The redacted production pilot smoke passed 37 checks in read-only mode. It
  intentionally skipped authenticated key-status and first-ingest writes.
- The local full release gate passed 159 suites before the production smoke.

