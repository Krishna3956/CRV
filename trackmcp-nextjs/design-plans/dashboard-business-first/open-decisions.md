# Unresolved decisions for design review

These are intentionally unresolved. They should be decided before the first implementation slice.

1. **Primary KPI source availability.** Can the live analytics response reliably supply AI clients observed, activity, explicit work completed, and supported attention signals for every workspace? If not, which cards become neutral unavailable states?
2. **Freshness contract.** The current API does not provide a universal last-observed/stale signal. Should the product add one before showing a freshness timestamp, or should the first implementation omit freshness claims?
3. **Adoption identity.** Client metadata is not end-user identity. Do product users want a separate client adapter integration before the UI ever uses “returning users” language?
4. **Issues boundary.** Which observed signals should be promoted to the Issues page, and how will future P1-05 regression alerts remain visually distinct from observational signals?
5. **Issue ranking.** What is the approved ranking order between evidence strength, affected activity, business impact, and recency when multiple signals qualify?
6. **Journeys coverage.** What minimum explicit workflow metadata is required before rendering a path view? The fallback should remain “activity visible, outcome unavailable.”
7. **Custom date ranges.** Is a custom range supported by every dashboard API and bounded scan, or should the design ship with only 7/30/90 days first?
8. **Evidence presentation.** Should Evidence open as a full page for shareability or as a side panel for comparison? The proposed design assumes a full page with preserved origin and return context.
9. **Setup placement.** Should a first-time user see Example data before creating a workspace key, or only after the workspace exists? The design assumes both options can be offered without making Example data look live.
10. **Public site alignment.** The dashboard redesign should borrow the public site's promise, but the marketing site redesign is out of scope for the first implementation slice.
