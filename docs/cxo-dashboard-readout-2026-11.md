# CXO dashboard readout — 2026-11

## Why this pass exists

TrackMCP is used by an engineering teammate during setup, but the dashboard is
consumed by product, operations, support, and executive readers. The first
screen therefore has to answer three questions before asking the reader to
inspect a trace:

1. What changed in the selected period?
2. Does it matter to the business?
3. What should someone do next?

The existing dashboard already had strong evidence boundaries and a useful
navigation model. The missing layer was an executive readout that connects the
metrics to a decision without pretending that observed telemetry is a customer
count or a health score.

## Evidence and principles

- Amplitude documents a separation between trend, funnel, retention, journey,
  and engagement questions rather than forcing every question into one chart:
  <https://amplitude.com/docs/analytics>.
- PostHog describes dashboards as recurring monitoring surfaces and trends as
  a way to see important metrics, patterns, and changes over time:
  <https://posthog.com/docs/product-analytics/dashboards> and
  <https://posthog.com/docs/product-analytics/trends/overview>.
- PostHog limits initial breakdowns for readability, which supports bounded
  summaries followed by drill-down rather than showing every dimension at
  once: <https://posthog.com/docs/product-analytics/trends/breakdowns>.
- USWDS recommends readable body text, consistent left alignment, and a
  restrained type scale for dense interfaces:
  <https://designsystem.digital.gov/components/typography/>.

## Product decisions

### The first viewport is a decision surface

The Overview now adds an **Executive readout** after the data-source context.
It presents:

- adoption: observed account groups and period movement;
- value: explicit outcome completion when the evidence exists;
- risk: the strongest evidence-backed signal and a direct path to Issues.

These cards are derived from the existing analytics response. No new
inference, customer identity, or backend write is introduced.

### Example data is a guided walkthrough, not a success state

Example data uses a cool blue treatment rather than the green live-data/status
color. Green remains reserved for healthy, complete, or connected states. The
toggle keeps the existing URL contract (`data=my` and `data=example`) while
using clearer language in the supporting state strip.

### Density means useful evidence, not more decoration

The sample workspace already contains activity, account groups, assistants,
tools, journeys, outcomes, quality, incidents, and traces. This pass makes the
first screen explain how those surfaces relate. It does not fabricate customer
names, revenue, rankings, or unsupported health claims.

## Non-goals

- No new telemetry schema or Supabase migration.
- No change to real-data calculations or privacy boundaries.
- No replacement of the existing tab structure in this pass.
- No mobile redesign; the dashboard remains desktop-first for the pilot.

