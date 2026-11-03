# Dashboard cognitive-load work queue

This queue tracks the dashboard reduction slice. A check means the change is
implemented in the isolated release branch and covered by a focused contract or
static validation; deployment remains a separate gate.

## Completed in this slice

- [x] ✅ Remove redundant Overview source, takeaway, next-step, executive-readout,
  and “How to read” render blocks.
- [x] ✅ Remove repeated source-state strips from vertical views.
- [x] ✅ Remove the empty-state preview grid and “Populates after connection” copy.
- [x] ✅ Collapse KPI definitions into hover/focus InfoHints.
- [x] ✅ Make InfoHints accessible on hover and keyboard focus without click state.
- [x] ✅ Replace the dashboard green action system with restrained blue/neutral tokens.
- [x] ✅ Flatten dashboard shadows and oversized rounded-card treatment.
- [x] ✅ Update dashboard contract tests for the simplified hierarchy.
- [x] ✅ Run TypeScript, lint, and focused dashboard/business-user contracts.

## Release gates still required

- [x] ✅ Run the full production build in the isolated checkout (230 static pages).
- [x] ✅ Run the repository release gate and inspect any generated evidence diff (159 suites; generated timestamp restored, no evidence file included).
- [x] ✅ Perform the local runtime smoke pass with the local environment (9 public routes and 10 protected/API checks; dashboard routes exercised by the smoke harness).
- [x] ✅ Open release PR #868 and merge after all CI stacks passed.
- [x] ✅ Confirm the existing GitHub App Runner deployment succeeds (run `41606599334`).
- [x] ✅ Fetch public dashboard routes and verify the deployed release identity.

## Release evidence

- Release commit: `621c4335` (merged as `3f7437c3e33b9c046a278134c2da7dfe193d3719`).
- CI: web/JavaScript, Go, and .NET checks passed in run `41605866154`.
- App Runner: deployment run `41606599334` passed its release gate, production
  smoke, release-identity check, safety audit, and translation-provider check.
- Public verification: `/`, `/dashboard?view=overview&data=example`,
  `/dashboard?view=setup&data=example`, and `/docs` returned HTTP 200.
- Local runtime smoke: 9 public routes and 10 protected/API checks passed with
  the existing local environment; no credentials were written to the branch.

## Follow-up, not part of this release

- [ ] Revisit the long technical detail surfaces after observing real business-user
  sessions; progressive disclosure should be driven by evidence, not another
  blanket card redesign.
- [ ] Add visual regression snapshots for the desktop dashboard at the agreed
  pilot viewport.
- [ ] Remove the now-unused compatibility helpers (`BusinessContext`,
  `DataSourceStrip`, and legacy summary components) in a separate cleanup after
  the release is stable.

