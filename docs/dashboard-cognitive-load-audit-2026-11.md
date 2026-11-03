# TrackMCP dashboard cognitive-load audit — November 2026

## Why this pass exists

The dashboard was explaining itself in several competing places. A business
reader had to scan source-state banners, a takeaway card, a recommended-next-
step card, an executive readout, a business-context strip, and then the actual
metrics. The repetition made the product feel like documentation instead of a
decision surface.

This audit is intentionally about information hierarchy and interaction cost;
it does not change analytics formulas, read models, privacy boundaries, or
server contracts.

## Evidence and design principles

- Nielsen Norman Group recommends that tooltips remain brief and contextual,
  and that secondary explanations appear progressively rather than permanently
  occupying the page: [Tooltip Guidelines](https://www.nngroup.com/articles/tooltip-guidelines/)
  and [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/).
- PostHog describes dashboards as recurring monitoring surfaces, not tutorials:
  [PostHog dashboards](https://posthog.com/docs/product-analytics/dashboards).
- Slack's official brand guidance treats bright brand colors as accents for
  icons and illustrations, not as the default color for every surface or text
  field: [Slack Brand Guidelines](https://a.slack-edge.com/0f43e/marketing/img/media-kit/Slack-Brand-Guidelines.pdf).

These references inform the implementation, but TrackMCP keeps its own visual
system and does not copy another company's brand.

## Problem inventory

| Problem | User cost | Resolution in this slice |
| --- | --- | --- |
| Repeated “data source selected” strips | Forces users to reread whether the page is live or illustrative | Keep the state in one compact header control; remove page-level strips |
| “At a glance”, “Recommended next step”, and “Executive readout” all repeat the same orientation | Pushes real metrics below prose and cards | Remove all three from the primary Overview render |
| “How to read this”, “Read account-group activity”, and similar context cards | Turns each view into a mini manual | Remove the context-card render path; retain evidence in the metric and InfoHint where needed |
| Empty states include a second preview grid | Adds four more boxes before a user can act | Keep the actionable connection state and next steps; remove the preview grid |
| KPI definitions appear both in an info control and below the value | Doubles the reading load | Keep the definition in the InfoHint; leave the value and label as the scan target |
| Info controls require a click | Makes a definition feel hidden and adds state to a simple hint | Show a short tooltip on hover and keyboard focus; keep `aria-describedby` and `title` |
| Green is used for actions, surfaces, charts, and “healthy” signals | Collapses interaction and status into one visual meaning | Scope the dashboard to neutral surfaces plus restrained blue actions; reserve semantic colors for status |
| Large radii and colored shadows on nearly every panel | Makes the page look like nested generated cards | Flatten panels to a 1px border, small radius, and no shadow |

## User scenarios

### New account

1. The user sees one page heading, one short description, and the primary
   setup action.
2. The empty state says what is missing and gives the next concrete action.
3. The user can switch to the guided example from the shared header control;
   the page does not repeat that state in another banner.

### Business reader after activation

1. The first scan lands on the Overview KPIs and the observed-work panels.
2. Definitions are available beside labels, but do not consume permanent
   vertical space.
3. Technical evidence remains available in expandable/detail views rather than
   competing with the business signal.

## Design rules going forward

1. One page heading and one sentence of context per view.
2. One source selector in the shared header; never a repeated source banner.
3. A metric's definition belongs in its InfoHint, not repeated below the value.
4. Every tooltip is concise (normally one or two sentences), hoverable, and
   keyboard-focusable.
5. Use borders and spacing for grouping. Do not stack a card inside a card
   unless the nested object is an actual drill-down.
6. Use blue for navigation and actions, neutral surfaces for data, and green,
   amber, or red only when the data has that semantic meaning.
7. If a panel cannot answer a business question or support a decision, remove
   it from the primary scan or move it behind progressive disclosure.

## Implemented in this slice

- Removed the Overview source strip, takeaway, next-step, executive-readout,
  and “How to read” render blocks.
- Removed source strips and business-context cards from the other primary views.
- Removed the secondary “What you will see here” preview grid from empty states.
- Changed the shared data switch to concise `Live` / `Explore` labels.
- Changed dashboard brand tokens to indigo/neutral and removed dashboard shadows
  and oversized radius treatment via scoped CSS.
- Changed InfoHint from click-toggle state to hover/focus disclosure.
- Removed repeated helper copy under KPI values.
- Updated contract tests to lock the new hierarchy and accessibility behavior.

## Non-goals

- No analytics query, schema, ingestion, privacy, or authorization behavior was
  changed.
- No customer data was changed.
- No mobile redesign was attempted; the existing desktop-only pilot boundary
  remains in force.
- The underlying example read models remain bounded and explicitly illustrative.

