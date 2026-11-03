# CXO dashboard work queue

This queue is the source of truth for the current autonomous pass.

## Completed in this pass

- [x] Baseline current dashboard data contracts and empty states.
- [x] Review analytics-product and readability guidance.
- [x] Add a first-viewport executive readout using existing telemetry fields.
- [x] Make Example data visually distinct from live/status green.
- [x] Explain the sample walkthrough scope without implying real customer data.
- [x] Run focused dashboard contracts, TypeScript, lint, and production build.

Evidence for this slice:

- `npm run test:business-user-ux` — 126 passing tests.
- `npx tsc --noEmit --pretty false` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; 230 pages generated.

## Follow-up after this pass

- [ ] Validate the first viewport with a business reader using a short task
      script: identify adoption, identify the largest risk, and find the next
      action without opening Evidence.
- [ ] Add a server-backed scheduled executive snapshot only after a product
      decision on retention and permissions.
- [ ] Consider saved views or shareable read-only dashboards only after the
      core readout proves useful in pilot interviews.

## Guardrails

- A missing metric renders as `N/A` or an explicit evidence limitation.
- Example values are labelled illustrative and never mixed with My data.
- Every new action has a real route or callback and a visible focus state.
- The change must pass the repository release gate before merge.

