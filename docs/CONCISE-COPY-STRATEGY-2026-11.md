# TrackMCP concise in-product copy strategy

Date: 2026-11-03
Scope: dashboard, setup, empty states, and secondary technical explanations

## Problem

The dashboard had the right evidence boundaries but repeated long explanations
before the user could reach the metric or action. For a business reader, that
made the product feel like documentation instead of an analytics workspace.

## Research basis

- PostHog positions dashboards around recurring questions and the metrics a team
  needs to track, not a catalog of every available event:
  <https://posthog.com/docs/product-analytics/dashboards>.
- Amplitude's dashboard guidance puts the relevant KPI and context first, with
  deeper analysis available after the summary:
  <https://www.amplitude.com/docs/analytics/dashboard-create>.
- Nielsen Norman Group recommends progressive disclosure for complex products,
  keeping advanced detail available without placing it in the primary scan:
  <https://www.nngroup.com/articles/progressive-disclosure/>.
- Nielsen Norman Group's tooltip guidance says tooltips should supplement a
  visible label, not carry essential instructions:
  <https://www.nngroup.com/articles/tooltip-guidelines/>.
- USWDS recommends a clear type hierarchy and concise headings for scanability:
  <https://designsystem.digital.gov/components/typography/>.
- The repository's local copy skill requires one clear action, explicit evidence
  limits, and a recovery path for empty or failed states:
  `.codex/skills/trackmcp-business-copy/SKILL.md`.

## Rules applied

1. Lead with the business question and the next action.
2. Use one short sentence for the page explanation where possible.
3. Keep evidence caveats, but say them once and in plain language.
4. Move protocol names, privacy detail, and advanced key scope behind details,
   info hints, or the Evidence view.
5. Do not change metric formulas, data states, privacy controls, or protocol
   behavior. `N/A`, unknown, insufficient evidence, and explicit outcomes retain
   their existing meaning.

## Changes in this slice

- Removed the repeated “TrackMCP workspace” eyebrow from every dashboard page.
- Shortened the business context on Overview, The journey, What they’re doing,
  Resources & prompts, Did it work, What’s broken, Who’s using it, Evidence,
  and Setup.
- Reduced Setup guidance to the primary path: create a key, connect one server,
  make one tool call, refresh.
- Kept alternate SDKs and OpenTelemetry discoverable, while shortening their
  explanatory paragraphs.
- Kept technical connection details, identity, privacy, and other methods in
  explicit secondary sections.

## Non-goals

- No schema, RLS, ingestion, metric, auth, or MCP protocol changes.
- No claim that local validation proves production deployment.
- No removal of evidence boundaries or recovery actions.
