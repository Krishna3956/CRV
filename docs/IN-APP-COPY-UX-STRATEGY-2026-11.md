# TrackMCP in-app copy and interaction clarity strategy

Date: 2026-11-03
Scope: dashboard, setup, authentication, empty/loading states, and explanatory controls
Audience: product, operations, support, and leadership users; technical teammates complete connection setup

## Product promise

TrackMCP should answer four questions without requiring an MCP protocol lesson:

1. Who is showing up?
2. What are they trying to do?
3. Did the work complete?
4. What deserves attention next?

Every page should make the next useful action obvious within one scan. Technical
detail remains available, but it should appear after the business interpretation
or as the recovery path for the current state.

## Evidence and design principles

- PostHog describes dashboards as recurring views for the metrics a team needs
  to track, and uses templates and starter prompts to prevent a blank-dashboard
  dead end: <https://posthog.com/docs/product-analytics/dashboards>.
- PostHog's product empty-state guidance recommends a clear product pitch and
  install action beside a realistic preview, with explicit states for loading,
  unknown, needs setup, waiting for data, and data available:
  <https://github.com/PostHog/posthog/blob/master/.agents/skills/building-product-empty-states/SKILL.md>.
- Amplitude recommends mapping onboarding as a funnel, measuring drop-off at
  each step, and putting relevant KPIs above raw event detail:
  <https://www.amplitude.com/guides/measure-user-onboarding>.
- Material's progress guidance treats loading as a state that should explain
  what is happening and what actions remain available:
  <https://m2.material.io/components/progress-indicators/web>.
- The repository's TrackMCP business-copy skill requires sentence-case labels,
  one primary action, explicit evidence limits, and a recovery path for every
  empty or failure state: `.codex/skills/trackmcp-business-copy/SKILL.md`.

## Copy system

### Voice

- Plain, calm, specific, and evidence-aware.
- Lead with the user's question or the current state.
- Use one action per message where possible.
- Prefer `Create a connection key`, `Open Overview`, `Review signals`, and
  `See Example data` over generic labels such as `Continue`, `Details`, or
  `Learn more`.
- Do not claim customer counts, health, completion, abandonment, rankings, or
  identity when the data cannot support the claim.

### Information hints

An `i` control must explain the adjacent label when activated by click, keyboard,
or touch. `title` alone is not sufficient because it is inconsistent across
devices and cannot be relied on as the product's explanation. The control must
expose `aria-expanded` and a programmatically associated tooltip/popover.

### Hierarchy

- Page title: one per view, 30px desktop / 28px compact.
- Section title: 17px, sentence case.
- Metric label: 12px, short, normal case where possible.
- Metric value: 30px, tabular numerals.
- Supporting copy: 12–14px with a 1.5 line height.
- Technical identifiers: monospace, secondary, never the first reading path.

### Density

Charts should use the minimum height needed for the question, reserve space for
labels and interaction, and offer a table for exact values. Empty charts should
not reserve a large blank rectangle; they should use a compact explanation and a
next action.

## Journey rules

### New account

1. Show an immediate, meaningful loading state while auth and workspace data
   hydrate. Never show a blank white screen.
2. Once authenticated, show the setup sequence and the outcome the user will
   get after the first event.
3. Keep all supported setup paths discoverable beside the recommended path.
4. Make the next action unique and state-aware.

### Activated account

1. Put the business question before the technical explanation.
2. Show source, period, and evidence quality near every metric group.
3. Distinguish measured zero from unavailable, unknown, pending, and insufficient
   evidence.
4. Keep raw method names and identifiers in secondary detail.
5. Every issue or empty state must explain what the user can do next.

### Authentication

The first pass should ask for only the minimum viable information: name (optional),
email, and password. Do not ask users to type the same password twice during
signup; server-side password policy and email verification remain the safety
controls. Password recovery may continue to use confirmation because it is a
different risk boundary.

## Non-goals

- No metric formula changes.
- No database schema or RLS changes.
- No weakening of auth, rate limits, privacy, or secret handling.
- No claim that local evidence proves a production deployment.
