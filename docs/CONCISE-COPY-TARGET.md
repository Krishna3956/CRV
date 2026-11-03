# TrackMCP concise-copy target

Date: 2026-11-03
Branch: `codex/business-user-ux-audit`

## Acceptance target

An experienced business reader should be able to answer these questions from
each dashboard page without reading a paragraph of protocol documentation:

- What is this page for?
- Which metric or state should I look at first?
- What should I do next if data is missing or a signal is present?

## Required behavior

- One page title and one short description per view.
- One primary action or next step per context block.
- Technical detail stays available but is not the first reading path.
- Evidence limits remain visible wherever a metric could be over-interpreted.
- Empty, loading, and failure states explain the next recovery action.
- Setup keeps the recommended path visible while alternate paths remain easy to
  find.

## Evidence mapping

| Requirement | Evidence |
| --- | --- |
| Concise page context | `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx` |
| Copy regression protection | `trackmcp-nextjs/src/components/dashboard/ConciseCopy.contract.test.mjs` |
| Existing business UX contracts | `trackmcp-nextjs/src/components/dashboard/DashboardApp.contract.test.mjs`, `trackmcp-nextjs/scripts/business-user-ux.contract.test.mjs` |
| Type and build integrity | `npx tsc --noEmit --pretty false`, `npm run build` |

## Release boundary

This target describes a local branch state. It does not mean the changes are
merged, deployed, or verified against authenticated production data.
