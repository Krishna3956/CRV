# Interaction and state behavior

## Global controls

### Data source

Use a two-option segmented control labeled exactly:

- `Your data`
- `Example data`

Behavior:

- selecting Example data immediately clears selected live evidence, session ID, correlation handle, and live origin state;
- it preserves only safe global state such as page and date range;
- the page shows an `Example data` badge and a short explanation;
- example records never appear as live evidence;
- selecting Your data returns to the last safe live page, not to a stale live trace;
- no silent fallback from empty/error live data to Example data.

### Date range

Use a native select or accessible menu adjacent to the data-source control:

- Last 7 days;
- Last 30 days;
- Last 90 days;
- Custom range only if the API supports it honestly.

Changing the period refreshes all visible panels, keeps the current page, and preserves the data source. The selected period appears once under the page promise and is not repeated in every card.

### Filters and tabs

- Filters answer “what subset am I looking at?” and use a visible label plus removable chip.
- Tabs combine views answering the same business question; do not create a tab for every backend concept.
- Active tabs use text and a bottom rule or filled neutral surface, not color alone.
- Filter changes preserve URL state and back/forward navigation.

## Button hierarchy

Every page has one primary action, one optional secondary action, and a quieter refresh/control group.

| Situation | Primary | Secondary |
| --- | --- | --- |
| Overview with issue | See what needs attention / Open issue | Open evidence |
| Overview with no data | Connect your server | Explore example data |
| Overview with no signal | Review more activity | View capabilities |
| Adoption | See capability usage | View AI clients |
| Journeys | View a journey | Add explicit outcomes |
| Quality | Inspect capability | Compare period |
| Issues | Open evidence | See affected journey |
| Evidence | Return to issue | View related journey |
| Setup | Check for activity | Copy setup |

Never use generic `Learn more` or `View all` as the only operational label.

## Page-state matrix

| State | First-level message | Allowed action | Visual treatment |
| --- | --- | --- | --- |
| Loading | “Loading your activity” | None or cancel where relevant | Skeleton matching final geometry; no invented values |
| Your data | “Your data” + selected period | Page-specific primary action | Neutral source badge |
| Your data, no records | “No activity yet” | Connect your server / Check setup | Neutral, not healthy |
| Not enough evidence | “Not enough evidence yet” | Connect more activity / Narrow scope | Amber attention, never red |
| Bounded result | “Showing a bounded result” | Narrow period or scope | Amber helper strip |
| API/auth error | “We could not load your data” | Retry | Red only for actual failure; preserve filters |
| Example data | “Example data” | Connect your server / Return to your data | Blue/neutral source treatment |
| Stale signal | Only if API provides stale metadata | Refresh | Amber with timestamp and definition |
| Confirmed issue | Plain-language issue and evidence strength | Open issue/evidence | Amber or red based on proof |

## Overview issue behavior

The attention panel always renders. Its neutral states are distinct:

- `No actionable signals yet.` when no supported signal exists;
- `Not enough evidence yet to rank an issue.` when volume or metadata is insufficient;
- `No issues detected in the selected period.` only when the API provides sufficient evidence for that conclusion.

Do not style “not enough evidence” as a green healthy state.

## Loading, empty, and error details

- Reset loading when page, trace, source, or key filter changes.
- Clear stale trace content before loading a new trace.
- Trace errors expose a visible `Retry` action.
- Empty trace selection says `Choose evidence to inspect`, not `No issue`.
- Unauthorized trace state explains access scope without exposing raw API details.
- Every error includes a recovery action and preserves the user's context.

## Progressive disclosure

Layer 1: business meaning, scope, confidence, action.

Layer 2: metric definition, denominator, minimum volume, source, and limitations.

Layer 3: event timeline, IDs, correlation source, redaction, truncation, and bounded payload.

The user should reach Layer 3 from an issue or journey in two actions or fewer.
