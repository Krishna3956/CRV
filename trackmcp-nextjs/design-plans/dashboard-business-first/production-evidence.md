# Production evidence and limitations

## Authenticated evidence captured

On 2026-09-07, the authenticated dashboard at `https://app.trackmcp.com/dashboard` was opened read-only in the available browser session. The rendered surface showed:

- the current TrackMCP wordmark and app icon;
- technical navigation with Overview, Sessions, Workflows, Trace Explorer, Tools, Tool quality, Catalog, Clients, Reliability, Intent & Gaps, Outcomes, Releases, Configure, and Sign out;
- a live-mode state strip;
- a 7, 30, or 90-day date-range control;
- KPI cards for Tool calls, Sessions, Errors, and Completion;
- `No explicit workflow outcome data` when explicit outcomes were absent;
- a `What needs attention` observed-signal panel;
- server-observed versus client-adapter wording.

The account-specific screenshot was not copied into this package because it contained workspace and account-identifying content. The observation was read-only and was used to validate the current audit. The package's proposed screens and screenshots are local-only design artifacts.

## Evidence boundary

- The public website and docs establish the product promise and the server-boundary observation model.
- The local dashboard captures establish the current composition at 1280 x 800 and 1440 x 900.
- Authenticated production evidence establishes the current live surface and labels, but not any future business-first navigation or API capability.
- The design does not claim freshness, stale-state detection, human identity, or completion without explicit API support.
