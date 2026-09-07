# Interaction and state behavior

The rendered examples in [screens/proposed-interactions.svg](screens/proposed-interactions.svg) are the visual inventory. This document defines the behavior they represent.

## Global controls

### Data source

Use an explicit segmented control labeled `Live data` and `Example data`.

- Selecting Example data clears selected live evidence, session id, correlation handle, and live-origin state.
- It preserves safe global state such as the selected view and date range.
- Example records never appear as live evidence.
- Selecting Live data returns to a safe page without restoring a stale trace.
- Empty or failed Live data never substitutes Example data.
- The source state is neutral. It does not imply that the product or connection is healthy.

### Date range

Use an accessible menu with `Last 7 days`, `Last 30 days`, and `Last 90 days` first. Custom range stays out of the first implementation until the API and bounded scan support it honestly.

Changing the period refreshes all visible panels, keeps the current page, and preserves the source. The selected period appears once under the page promise.

### Focus and keyboard

- All controls have a minimum 44px hit target even when the visual control is smaller.
- Tab order is source, range, refresh, page action, filters, table rows, and return action.
- Focus-visible uses a 2px blue outline with a 2px offset; it is not color-only.
- Enter activates a focused button or row; Escape closes a tooltip or menu; browser Back returns to the previous filtered state.
- Tooltips explain thresholds, denominators, source, redaction, and bounded results. They never introduce unsupported claims.

## Visual states

| State | Copy | Allowed action | Treatment |
| --- | --- | --- | --- |
| Default | Plain-language label | Page-specific primary action | White surface, low-contrast border |
| Hover | Same copy with target emphasis | Same action | Surface lift and pointer cursor |
| Focus-visible | Same copy with visible outline | Keyboard activation | Blue outline, no layout shift |
| Pressed | Same copy with compacted surface | Action is in progress | Darker surface and 1px inset feel |
| Disabled | Action unavailable with reason nearby | None | Muted fill, not only reduced opacity |
| Loading | `Loading activity` or `Loading evidence` | Retry only if request has failed | Skeleton matches final geometry; no invented values |
| Retry | `Live data could not be loaded` | `Retry` | Failure treatment only for the API error |
| Tooltip | Definition, threshold, or limitation | Dismiss or move focus | Anchored, keyboard reachable, never essential-only content |
| Success | `Outcome saved` or explicit API success | Continue or return | Neutral confirmation; green is not a health score |
| Error | `We could not load your data` | Retry | Red only for actual failure |
| Empty | `No live data available` or `No actionable signals yet` | Check setup, narrow range, or explore Example data | Neutral, not confirmed healthy |
| Insufficient | `More data may be required` plus threshold and volume | Narrow range, inspect scope, or wait for more activity | Blue or amber evidence treatment, never a zero |
| Live data | `Live mode selected` | Inspect or retry | Neutral source strip |
| Example data | `Example data selected` | Return to Live data | Blue neutral source strip |

## Evidence-specific behavior

- Origin values are `Server`, `Client`, or `Legacy/Unknown`; `Legacy/Unknown` has no healthy or unhealthy color.
- Redaction is visible at the event or payload row.
- Truncation and caps use `Showing a bounded result`, `Some events may be omitted because the response is capped`, and `Narrow the time range or scope to inspect more precisely`.
- A new selected trace clears the old trace body before loading.
- Trace error always exposes `Retry`.
- Unauthorized and empty states are separate from loading, and successful evidence is the only state that renders records.
