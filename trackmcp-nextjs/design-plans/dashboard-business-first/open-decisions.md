# Remaining open decisions

The following are the only decisions still open after applying the SDE3 review. They are intentionally API or product-policy decisions, not unresolved visual choices.

1. **Explicit outcome availability.** Which workflow outcome event names and payload fields are guaranteed for the first implementation slice, and what minimum source-level contract will make the numerator and denominator renderable?
2. **Issue promotion policy.** Which observational signals are approved for the Issues page before P1-05 alert contracts are separately reviewed? P1-05 remains outside this package.
3. **Authenticated evidence retention.** May future design reviews retain an account-redacted production screenshot, or should production evidence remain text-only for privacy?
4. **Setup completion scope.** Which setup steps can be marked complete from existing API responses, and which require explicit workspace configuration metadata?

## Locked decisions applied

- No freshness timestamp or stale-state claim without API support.
- `AI clients observed` is the adoption label; identity data is not inferred.
- Work completed uses explicit workflow outcomes only; sessions cannot become the completion denominator.
- Date range starts with 7, 30, and 90 days; custom range is deferred until API and bounded scan support it.
- Evidence is a full page with shareable links and browser history.
- Issues rank firing regression alerts, confirmed observed issues, lower-confidence signals, then insufficient evidence; within each group use affected work volume, severity, then recency.
- Green is TrackMCP identity only, never a general health treatment.
- Legacy/Unknown provenance is neutral.
- Live mode never falls back silently to Example data.
- Quality, Issues, and Evidence fit inside the 1280 x 800 and 1440 x 900 page widths; any table overflow is contained inside the table surface.
