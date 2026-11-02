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

### 9. Make the first review path feel curated, not like a chart catalog

The current product-analytics leaders converge on a small set of repeatable
review patterns rather than asking every reader to assemble meaning from raw
events. PostHog groups saved insights into dashboards and lets a team move from
a drop-off to the supporting evidence. Amplitude explicitly treats a dashboard
as a recurring team-review surface and marks vetted dashboards as official.
Mixpanel's report model similarly starts from a question (for example, trends,
funnels, retention, or flows) and then makes the resulting report shareable.
See [PostHog dashboards](https://posthog.com/docs/product-analytics/dashboards),
[Amplitude analytics](https://amplitude.com/docs/analytics), and
[Mixpanel reports](https://docs.mixpanel.com/docs/reports).

TrackMCP application:

- The first screen should make one recommendation and expose one obvious next
  action; it should not present every available analysis at equal visual weight.
- The business-facing tab order is a guided reading sequence: who is present,
  what they are doing, whether it worked, and what needs attention.
- Example data is a teaching surface, not a disguised health score. My data
  remains the source for decisions and must carry its evidence boundary.
- A future shared Overview should be a stable, reviewed team surface before we
  add customization, arbitrary chart builders, or a large palette of optional
  widgets.

### 10. Use color and chart form to encode meaning sparingly

USWDS recommends familiar chart types, one central idea per visualization,
plain-language summaries, and an accessible table alternative. NN/g's chart
guidance emphasizes context, contrast, and removing chart junk; its dashboard
guidance treats dashboards as at-a-glance surfaces for action rather than
expansive analytical workspaces. See [USWDS data visualizations](https://designsystem.digital.gov/components/data-visualizations/),
[NN/g chart context](https://www.nngroup.com/articles/choosing-chart-types/),
and [NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/).

TrackMCP application:

- Keep the neutral canvas and one restrained brand action color. Reserve amber
  and red for an evidence-backed warning or failure, never for decoration.
- Put the conclusion in text next to the chart; do not make a reader infer the
  point from color or shape alone.
- Keep a table or exact-value alternative for every trend used in a business
  decision.
- Treat empty, partial, and example states as first-class designs with their
  own explanation and next action.

### 11. Copy is part of the product's measurement contract

Microsoft and GOV.UK writing guidance both recommend plain words, concise
sentences, positive and direct error messages, and a clear recovery action.
GOV.UK specifically says an error should describe what happened and how to fix
it. See [Microsoft concise writing](https://learn.microsoft.com/en-us/style-guide/word-choice/use-simple-words-concise-sentences)
and [GOV.UK error messages](https://design-system.service.gov.uk/components/error-message/).

TrackMCP application:

- Use the same noun for the same concept across navigation, cards, docs, and
  empty states (for example, `connection key`, not alternating `API key`,
  `scoped key`, and `credential`).
- Lead with the status and action: `No server activity yet — connect one server`
  is better than a paragraph about ingestion internals.
- When a value is unknown, say why it is unknown and what evidence would make it
  known. Never replace uncertainty with a zero or a reassuring color.

### 12. Product marketing should align the product story with the reader's job

Product Marketing Alliance and Salesforce both distinguish positioning from
copy: positioning decides who the product is for, what problem it solves, and
why it is different; messaging and copy then adapt that decision to a page,
audience, or channel. Their frameworks emphasize a single value proposition,
supporting benefits, proof points, and an explicit call to action rather than a
feature inventory. See [PMA messaging framework](https://www.productmarketingalliance.com/content/files/2025/02/Messaging-framework.pdf)
and [Salesforce product messaging template](https://developer.salesforce.com/files/SF-on-SF_Template_V3a.pdf).

TrackMCP application:

- The business reader's job is to decide whether MCP usage is reaching the
  intended work, whether the experience is succeeding, and what should be
  investigated next. The dashboard should lead with that job, not the SDK's
  internal implementation.
- The technical setup user needs one clear proof path: connect one server,
  send one real event, then hand the dashboard to the product or operations
  team.
- Each primary surface gets one core message, one supporting explanation, one
  evidence boundary, and one next action. Additional protocol detail is proof
  or documentation, not a competing headline.
- Claims stay proportional to proof. Example values are teaching aids; real
  customer, health, and completion claims require the read-model evidence that
  supports them.

### 13. Keep evidence labels readable without weakening their meaning

The latest review also cross-checked the dashboard language against current
data-visualization and analytics guidance. PostHog separates recurring
dashboard monitoring from ad-hoc insight exploration, while Amplitude treats a
dashboard as a shared, trusted view of related metrics. USWDS and Material
recommend that a visualization state its intended message in plain language,
and NN/g recommends progressive disclosure when a surface has more commands or
detail than a first-time reader needs. See [PostHog dashboards](https://posthog.com/docs/product-analytics/dashboards),
[Amplitude dashboards](https://www.amplitude.com/docs/analytics/dashboard-create),
[USWDS data visualizations](https://designsystem.digital.gov/components/data-visualizations/),
[Material data visualization](https://m2.material.io/design/communication/data-visualization.html),
and [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

TrackMCP application:

- Keep business labels such as `Activity observed`, `Activity recency`, and
  `Dashboard refresh` in the default reading path; retain implementation terms
  in source contracts and expandable detail where they are useful to engineers.
- Put technical readiness checks and connection metadata behind an explicit
  disclosure after the user sees the plain-language status and recovery action.
- Use a chart only when it adds a visual comparison; pair it with an exact-value
  table and a sentence explaining what the reader should notice.
- Treat the dashboard as a trusted recurring decision surface. Do not turn it
  into a catalog of every protocol signal simply because the SDK can collect
  the signal.

### 14. Shared dashboards need a stable filter model and trustworthy comparison

The current guidance from PostHog and Amplitude reinforces two additional
rules for TrackMCP. A dashboard should apply one visible time window and
filter context consistently across its cards, while exceptions must be
obvious. Comparison, breakdown, and cohort controls should be introduced only
when the underlying data model can define their denominator and scope. See
[PostHog dashboard filters and date ranges](https://posthog.com/docs/product-analytics/dashboards),
[PostHog trends and date ranges](https://posthog.com/docs/product-analytics/trends/overview),
[Amplitude analytics](https://amplitude.com/docs/analytics), and
[Amplitude dashboard preferences](https://www.amplitude.com/docs/analytics/dashboard-preferences).

TrackMCP application:

- Keep the selected period visible next to decision KPIs and chart headings;
  do not make readers remember a global filter while scanning a long page.
- Do not show a comparison percentage unless both the current and comparison
  windows come from the same read model with a documented denominator.
- Treat `Example data` as a fixed teaching scenario, not a filter that can be
  mixed with live workspace evidence.
- Keep technical scope controls, including active key scope, available but
  collapsed in Setup. If a scope mismatch is detected, open the detail section
  automatically and show the recovery action.

### 15. Color is a role system, not decoration

W3C requires normal text to maintain at least a 4.5:1 contrast ratio and
large text at least 3:1. It also warns that color differences alone should not
carry meaning. The dashboard therefore needs a small set of semantic roles:
neutral surfaces for reading, one primary action color, and separate status
colors for success, warning, and error. See [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum).

TrackMCP application:

- Use cool neutral surfaces and dark slate text for the business reading path.
- Use indigo for primary actions and selected navigation instead of saturating
  every card with green.
- Keep status meaning in text and labels as well as color; `N/A`, `Limited`,
  and `Needs attention` must remain understandable without hue perception.
- Avoid gradients in dashboard surfaces. Flat fills make hierarchy and data
  states easier to scan and test.

### 16. Typography should favor comfortable reading over density

USWDS recommends an effective body size of at least 16px for most text and
using smaller sizes sparingly for captions, tables, and specialized controls.
Its typography guidance treats hierarchy as a combination of size, line
height, spacing, and placement—not font size alone. See [USWDS typography](https://designsystem.digital.gov/components/typography/)
and [USWDS font size tokens](https://designsystem.digital.gov/design-tokens/typesetting/font-size/).

TrackMCP application:

- Keep Inter for dashboard UI and Geist Mono for code/IDs only.
- Preserve a clear title/section/metric scale, while keeping labels and table
  captions subordinate rather than shrinking body explanations into unreadable
  microcopy.
- Prefer one short explanatory sentence plus an action over multi-line banners.
- Keep technical caveats in disclosures where they are useful, not in every
  primary card.

### 17. Loading should explain progress without becoming a blank interruption

Material's progress guidance distinguishes an indeterminate indicator from a
determinate one and recommends placing the indicator where the new content
will appear. A loading state should tell the user what is happening, remain
visually part of the product, and avoid implying that data is already ready.
See [Material progress indicators](https://m2.material.io/components/progress-indicators/web).

TrackMCP application:

- Replace the old white “Getting your workspace ready” screen with a branded,
  neutral loading surface that says what is being checked and what will open.
- Show three short preparation steps—account, workspace, dashboard—without
  inventing a time estimate or making the user wait on a blank page.
- Keep the timeout/recovery behavior intact so a stalled auth session still
  reaches a clear sign-in or refresh action.

### 18. Copy rules should be reusable and evaluated like product behavior

OpenAI's official skills guidance describes a skill as a reusable workflow layer
with a clear trigger, focused instructions, and supporting resources. Its evals
guidance recommends defining outcome, process, style, and efficiency checks
before iterating so a prompt or skill does not drift based on subjective
“vibes.” See [OpenAI skills](https://developers.openai.com/plugins/concepts/skills)
and [Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills).

TrackMCP application:

- The repo now contains `.codex/skills/trackmcp-business-copy/SKILL.md` with
  the product vocabulary, evidence boundaries, concise-copy rules, and review
  checklist used by future dashboard and setup copy changes.
- Copy changes should add a focused contract test when a phrase or state is
  important to comprehension.
- Copy review should score both style and truth: a shorter sentence is not an
  improvement if it removes the caveat that prevents a business reader from
  over-interpreting the metric.

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
| Stable filter context and progressive scope detail | Visible period context; active key scope collapsed, auto-opened on mismatch | `DashboardApp.contract.test.mjs` |
| One predictable location for global controls | Language selector remains in the header; duplicate sidebar control removed | `DashboardApp.contract.test.mjs` |
| Recovery without data substitution | Live-data failure keeps Retry primary and offers an explicit Example-data fallback | `DashboardApp.contract.test.mjs` |
| Semantic color roles | Cool neutral dashboard surfaces, indigo primary action, no dashboard gradients | `DashboardApp.contract.test.mjs` + CSS review |
| Honest loading state | Branded workspace-preparation surface with three short steps | `page.contract.test.mjs` |
| Reusable copy discipline | Repo-scoped `trackmcp-business-copy` skill and copy review checklist | `.codex/skills/trackmcp-business-copy/SKILL.md` |

