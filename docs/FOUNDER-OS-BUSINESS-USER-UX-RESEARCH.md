# Founder OS business-user UX research

Status: completed research pass; implementation decisions recorded for the isolated business-UX branch.

Date: 2026-11-03

## Why this research exists

TrackMCP is configured by an engineer, but the dashboard is consumed by business, product, and operations teams. The product therefore has to answer business questions without requiring a reader to understand MCP protocol terms, raw events, traces, or telemetry storage.

This document records the external principles used to evaluate the current dashboard. It is a design input, not a claim that every referenced product or feature should be copied.

## Evidence-backed principles

### 1. Start with questions and decisions, not raw events

PostHog describes product analytics as a way to answer how many people do something, how often they do it, where they stop, whether they return, and what they did first. Its insight types map to those questions: trends, funnels, retention, paths, stickiness, and lifecycle. See [PostHog product analytics](https://posthog.com/hogpedia/product-analytics) and [PostHog insights](https://posthog.com/docs/product-analytics/insights).

Amplitude makes the same distinction: charts and dashboards are organized around recurring questions, shared with teams, and often reported at account level rather than only user level. See [Amplitude analytics](https://amplitude.com/docs/analytics) and [Amplitude dashboards](https://www.amplitude.com/docs/analytics/dashboard-create).

TrackMCP application:

- The primary navigation stays business-first: Overview, Journeys, Capabilities, Resources, Quality, Issues, AI clients, Evidence, and Setup.
- Each page begins with a question in plain language.
- Protocol and trace detail remains available, but is progressively disclosed behind Evidence, trace actions, and the Overview evidence panel.
- A metric is not considered complete until the UI states what decision it supports and what evidence is required.

### 2. Overview pages need a small canonical scorecard

PostHog's web analytics dashboard starts with a compact set of visitors, views, sessions, trends, and conversion goals, with date comparison context. Google Analytics 4 similarly uses summary cards and objective-oriented report collections. See [PostHog web analytics dashboards](https://posthog.com/docs/web-analytics/dashboard) and [GA4 overview reports](https://support.google.com/analytics/answer/13818312?hl=en).

TrackMCP application:

- Overview keeps a small KPI set above the fold: assistants observed, work observed, explicit success, and signals needing attention.
- KPI labels use business language; helper text names the evidence boundary.
- `N/A` means evidence is insufficient. It must not be silently converted into zero or a success rate.
- The selected period is always visible through the range control and chart subtitle.
- The dashboard must not invent a previous-period comparison until the read model supplies a trustworthy comparison window.

### 3. Funnels and retention require explicit events

PostHog funnels explain where users get stuck and show conversion, drop-off, and time-to-convert. Retention requires a defined start event and a defined return event; it is not inferred from silence. See [PostHog funnels](https://posthog.com/docs/product-analytics/funnels) and [PostHog retention](https://posthog.com/docs/product-analytics/retention).

TrackMCP application:

- A completed business task appears only when the server reports an explicit outcome.
- Missing outcome data is shown as `N/A` or `needs evidence`, never as abandonment.
- Future journey conversion and repeat-use metrics must document their start, success, and return events before release.
- Privacy-safe aggregation is preferred to identity expansion; the product must not pretend to know unique people when it only knows bounded sessions or account/workspace events.

### 4. Progressive disclosure reduces dashboard overload

Nielsen Norman Group recommends showing the most important options first and deferring advanced options until needed. USWDS recommends simple charts with one central theme, a small number of concepts, plain-language explanation, and a table alternative. See [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [USWDS data visualizations](https://designsystem.digital.gov/components/data-visualizations/).

TrackMCP application:

- Setup exposes the next action, key, SDK instructions, and first-event check first; scope, identity, and privacy detail are secondary sections.
- Overview keeps protocol detail collapsed until a user asks for it.
- Each chart should answer one question and have a useful empty state.
- Advanced technical actions link to Evidence or Setup instead of competing with the business summary.

### 5. Visual hierarchy should guide attention, not decorate

Material's guidance recommends using color, position, size, and visual weight to establish a focal point, while ensuring color is not the only signal. Carbon recommends curated accessible palettes, and Material typography separates headline, body, and label roles. See [Material data visualization](https://m2.material.io/design/communication/data-visualization.html), [Carbon data palettes](https://carbon-website-git-data-viz.carbon-design-system.vercel.app/data-visualization/color-palettes), and [Material typography](https://m3.material.io/styles/typography/applying-type).

TrackMCP application:

- Use a quiet neutral canvas, white content surfaces, and one restrained brand action color.
- Reserve warning/error colors for states with evidence.
- Do not encode a metric's meaning in color alone; pair color with labels, values, and status text.
- Use consistent spacing, sentence-case labels, and readable body text.

### 6. Product copy is an interaction system

Microsoft's product-writing guidance recommends simple words, one clear term per concept, leading with the important part, emphasizing the action, and providing a recovery path when something fails. It also recommends concise setup instructions and descriptive link text. See [simple words and concise sentences](https://learn.microsoft.com/en-us/style-guide/word-choice/use-simple-words-concise-sentences), [Microsoft writing style](https://learn.microsoft.com/en-us/windows/apps/design/style/writing-style), and [writing for all abilities](https://learn.microsoft.com/en-us/style-guide/accessibility/writing-all-abilities).

TrackMCP application:

- Prefer `Work observed`, `Reported completion`, `Needs attention`, and `Open evidence` over internal terms such as event volume, outcome ledger, or correlation handle.
- Keep one term for one concept across navigation, cards, docs, and empty states.
- Put the action in the button label: `Complete setup`, `View evidence`, `Refresh data`, or `Open evidence`.
- Error states explain what happened, whether data is safe, and the next recovery action.
- Avoid repeating the same technical explanation in every panel; use a short summary and a link to the detail surface.

### 7. A shared dashboard needs an explicit trust contract

PostHog documents that analytics are only as useful as the events, identities,
and properties attached to them; the same source model powers trends, funnels,
retention, and dashboards. Amplitude makes the parallel organizational point:
teams need dashboards that are trusted, current, relevant, and clearly marked
as the reviewed source for recurring decisions. See [PostHog product
analytics](https://posthog.com/docs/product-analytics) and [Amplitude dashboard
guidance](https://amplitude.com/docs/analytics/dashboard-create).

TrackMCP application:

- Every dashboard page states whether it is showing `My data` or illustrative
  `Example data`.
- Evidence window, observed-through watermark, bounded scan state, and refresh
  status remain available as a technical trust layer rather than being hidden.
- A KPI cannot be promoted to a “health” claim simply because it is displayed;
  the read model and metric contract must define its source and evidence class.
- The eventual official Overview should be a stable shared review surface;
  arbitrary dashboard customization should wait until the canonical metric
  vocabulary and read models are stable.

### 8. Give the reader a usable takeaway before asking them to interpret charts

PostHog treats dashboards as recurring review surfaces and provides templates,
starter prompts, and summaries so a new team does not have to assemble meaning
from a blank grid. Amplitude similarly describes dashboards as a place to keep
related charts together for a team review, with KPI, chart, and table display
modes. See [PostHog dashboards](https://posthog.com/docs/product-analytics/dashboards)
and [Amplitude dashboard display preferences](https://www.amplitude.com/docs/analytics/dashboard-preferences).

TrackMCP application:

- Overview now opens with a short, bounded “At a glance” sentence that says
  what the selected evidence window means before the KPI cards and charts.
- The sentence changes for Example data, no-data, and observed-data states so
  a blank dashboard still tells the reader what to do next.
- The takeaway explicitly says it is not a health or customer-count claim;
  the underlying evidence and metric definitions remain the source of truth.
- This is a reading aid, not a second analytics calculation. It reuses the
  existing read-model fields and cannot invent completion, identity, or health
  claims.

## What this means for the current product

### Strengths already present on this branch

- The shell is organized around business questions rather than raw protocol endpoints.
- `My data` and `Example data` are explicit, so sample values cannot be mistaken for customer evidence.
- Overview has a compact scorecard, a period control, an attention panel, and a collapsed evidence section.
- Setup has a clear handoff for first-time users and progressive disclosure for advanced controls.
- `N/A`, insufficient evidence, and explicit outcome language are present in the dashboard and metric contract.
- Technical investigation is available through Evidence and trace actions without replacing the business summary.

### Highest-value remaining work

1. Add trustworthy period-over-period comparison only when the analytics read model provides both windows.
2. Define and implement account-level and capability-level adoption read models before adding more charts.
3. Add a documented journey contract for start, success, failure, and return events.
4. Add a canonical “official” Overview view that can be shared or revisited consistently; do not add arbitrary dashboard customization before the core view is stable.
5. Validate the complete first-time setup and activated dashboard with a non-technical participant using the UAT script.
6. Verify production visual hierarchy and interaction states after deployment; local source evidence cannot substitute for a fresh production browser check.

## Rejected shortcuts

- Do not add vanity metrics or inferred completion rates to make the Overview look fuller.
- Do not use a large color palette to compensate for unclear hierarchy.
- Do not put protocol terminology into the primary nav just because it is precise for engineers.
- Do not report unique people or account adoption when the privacy-safe event model only supports bounded sessions/workspaces.
- Do not add period comparisons by subtracting unrelated windows or by guessing from sparse data.

## Source-to-change mapping

| Source principle | TrackMCP change or contract | Verification |
| --- | --- | --- |
| Question-led analytics | PageIntro questions and business-first nav | `DashboardApp.contract.test.mjs` |
| Small canonical scorecard | Overview KPI order and helper text | `DashboardApp.contract.test.mjs` |
| Explicit funnel events | Outcome/N/A contract and journey copy | metric contract tests |
| Progressive disclosure | Collapsed evidence, identity, privacy, and scope detail | setup/dashboard contract tests |
| Visual hierarchy | Neutral canvas, white surfaces, restrained action color | source review + visual QA pending |
| Clear action-oriented copy | Setup handoff, empty states, product-language cleanup | `business-user-ux.contract.test.mjs` |
| Dashboard takeaway before interpretation | Bounded Overview “At a glance” summary | `DashboardApp.contract.test.mjs` |

