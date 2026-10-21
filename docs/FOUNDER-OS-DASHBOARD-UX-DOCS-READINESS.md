# Founder OS dashboard and documentation readiness

Status: active autonomous workstream, started 2026-10-21.

## Product standard

The dashboard is an at-a-glance decision surface, not a report dump. The first
screen of each tab must answer one question, keep the most important metric at
the top-left, and move technical evidence behind an explicit drill-down. This
follows Microsoft Power BI guidance to keep dashboards clean, audience-led,
single-screen where possible, and focused on the few metrics that drive a
decision. [Source](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips)

Interactive controls must look interactive and expose all states: default,
hover, focus, pressed, disabled, and loading. Every clickable control gets a
pointer cursor, a visible hover treatment, a keyboard-visible focus ring, and
an accessible name. Material Design treats hover as a state for interactive
components; it must supplement, never replace, keyboard access.
[Source](https://m2.material.io/go/design-states/)

Long explanations do not belong inside every metric box. Use a short label and
value, an adjacent information affordance for definitions, and progressive
disclosure for methodology, caveats, and privacy boundaries. Tooltips are for
short labels; longer explanations belong in an expandable detail region.
[Source](https://m1.material.io/components/tooltips.html)

## Audit checklist

- [ ] All six tabs have one primary question, one primary action, and a compact
      first viewport.
- [ ] All clickable buttons, links, tab controls, disclosure summaries, and
      row actions have `cursor-pointer`, hover, focus, and disabled/loading
      states where applicable.
- [ ] Information icons are adjacent to metrics or terms whose meaning is not
      self-evident; detailed methodology is not repeated inside every card.
- [ ] Overview, Journeys, Activity, Resources & Prompts, Outcomes, Issues,
      Clients, Evidence, and Setup use the same card/header/tooltip language.
- [ ] Setup has a direct OTLP/HTTP JSON integration path with copyable endpoint,
      headers/key guidance, supported/unsupported protocol disclosure, and a
      test/verification action.
- [x] Setup explains where optional identity resolver configuration happens,
      what it enables, and how to validate it without exposing resolver keys.
- [x] Documentation has a first-class OpenTelemetry page linked from Setup,
      API docs, and the feature page, with working examples and boundaries.
- [ ] Public feature and documentation pages match shipped dashboard tabs,
      privacy behavior, supported protocols, and current package versions.
- [ ] Example mode and My data mode use the same field names, layout, and
      interpretation rules.
- [ ] Focused contract, accessibility, build, release-gate, and production
      smoke tests cover the changes before merge.

## Planned implementation order

1. Build a shared dashboard interaction/tooltip/info pattern and apply it to
   the six tabs and Setup.
2. Reduce first-viewport density and move caveats/methodology into disclosure
   regions while preserving evidence and privacy qualifiers.
3. Make OTEL and identity setup actionable and verifiable.
4. Reconcile docs/API/feature content with the shipped contracts.
5. Run visual/runtime audit, contract suites, full release gate, deployment,
   and production smoke; record evidence here and in the customer-readiness
   ledger.

## Evidence log

- 2026-10-21: PR #146 merged the shared panel information affordance, universal
  pointer cursor rule, progressive disclosure for Overview/Issues, and the
  actionable OTLP/HTTP JSON Setup card. Its App Runner deployment passed the
  release gate and production smoke workflow (`39555750135`).
- 2026-10-21: PR #147 merged per-incident progressive disclosure so Issues
  shows summary-first cards rather than repeating full evidence in the first
  viewport. Deployment workflow `39557149745` is running the release gate and
  smoke checks.
- 2026-10-21: PR #148 adds the missing server-side account identity resolver
  path to Setup, TypeScript/Python examples, and a first-class OpenTelemetry
  navigation item. Local dashboard contracts pass 50/50, lint passes, and the
  production build generates 171 routes. CI passed all three jobs; the merged
  App Runner deployment `39557881736` completed successfully, including the
  configured production smoke checks.
- 2026-10-21: Full local release gate passed all 115 suites, including
  accessibility, tenant isolation, OTLP/HTTP mapping, account identity,
  package-consumer, privacy, and production-smoke contracts. Live browser QA
  confirmed Setup identity/OTEL affordances and summary-first Issues cards.

## Research-derived acceptance criteria

- A new user can identify the main question and next action on every tab in
  under 10 seconds.
- A user can tell whether a control is clickable without guessing from text
  alone.
- A user can distinguish live telemetry, example data, insufficient data, and
  technical detail without reading a paragraph in every card.
- A user can configure OTLP/HTTP JSON or the native SDK from Setup without
  searching external documentation for the endpoint or authentication model.
- Keyboard-only navigation reaches every action and exposes the same meaning as
  pointer hover.
