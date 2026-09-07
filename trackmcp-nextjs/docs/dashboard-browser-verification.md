# Dashboard browser verification

The dashboard verification used deterministic local alert fixtures only. No Supabase rows were inserted, no production data was changed, and alerts were not enabled.

## Exact viewports and states

| Viewport | Overview | Issues states | Result |
|---|---|---|---|
| 1280×800 | Example data and My data setup/fixture views | Populated incidents, loading, empty, generic error with Retry, permission denied | Pass; no page-level horizontal overflow |
| 1440×900 | Example data and My data setup/fixture views | Populated incidents, loading, empty, generic error with Retry, permission denied | Pass; no page-level horizontal overflow |

The populated incident fixture rendered pending, firing, resolved, suppressed, insufficient-data, and invalid-configuration cards with scope, severity, affected volume, threshold, baseline, comparison, evidence basis, and notification-state copy. The fixture also included secret, raw delivery-payload, and unbounded-JSON fields; none appeared in the rendered cards.

Keyboard verification used the browser accessibility tree and Chrome DevTools Protocol: Tab moved through Overview, Journeys, Capabilities, Quality, Issues, AI clients, Evidence, Setup, and Sign out; Enter activation was exercised on the navigation. Browser history was exercised across Overview and Issues data-state URLs. Document and body scroll widths matched the viewport at both sizes.

## Evidence files

Screenshots were captured from the local fixture server with the exact viewport encoded in each filename:

- `/tmp/trackmcp-browser-check/251f038/overview-example-1280x800.png`
- `/tmp/trackmcp-browser-check/251f038/overview-example-1440x900.png`
- `/tmp/trackmcp-browser-check/251f038/overview-my-1280x800.png`
- `/tmp/trackmcp-browser-check/251f038/overview-my-1440x900.png`
- `/tmp/trackmcp-browser-check/251f038/issues-populated-1280x800.png`
- `/tmp/trackmcp-browser-check/251f038/issues-populated-1440x900.png`
- `/tmp/trackmcp-browser-check/251f038/issues-loading-1280x800.png`
- `/tmp/trackmcp-browser-check/251f038/issues-loading-1440x900.png`
- `/tmp/trackmcp-browser-check/251f038/issues-empty-1280x800.png`
- `/tmp/trackmcp-browser-check/251f038/issues-empty-1440x900.png`
- `/tmp/trackmcp-browser-check/251f038/issues-error-1280x800.png`
- `/tmp/trackmcp-browser-check/251f038/issues-error-1440x900.png`
- `/tmp/trackmcp-browser-check/251f038/issues-permission-1280x800.png`
- `/tmp/trackmcp-browser-check/251f038/issues-permission-1440x900.png`

The fixture browser harness was temporary and removed before the verification commit; the committed product does not contain a fixture bypass.
