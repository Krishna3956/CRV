# Recommended implementation sequence

This package intentionally stops before implementation. The sequence below is the recommended handoff.

## Slice 0 — design approval and evidence contract

Deliver:

- review this package and the annotated screens;
- run the comprehension checks;
- agree on the metric-to-business-question map;
- confirm API fields available for source, freshness, explicit outcomes, minimum volume, bounds, and alert state.

Acceptance:

- product and engineering approve the page map and terminology;
- the team has an explicit list of values that must remain unavailable;
- no implementation starts before the first viewport and state matrix are accepted.

## Slice 1 — presentation view model and state primitives

Design-to-engineering handoff:

- map API responses into `headline`, `plainLanguageSummary`, `technicalDefinition`, `evidenceState`, `scope`, `primaryAction`, `secondaryAction`, `sourceLink`, and `limitations`;
- add tokens for type, spacing, surfaces, borders, and semantic colors;
- add shared loading, empty, insufficient, bounded, error, and Example data primitives;
- preserve workspace isolation and existing URL state.

Acceptance:

- unavailable values never become zero;
- explicit outcomes are never replaced by session heuristics;
- Example data cannot hydrate a live trace;
- all actions preserve source, period, filters, origin, and back navigation.

## Slice 2 — business shell and Overview

- replace the primary rail with Overview, Adoption, Journeys, Quality, Issues;
- move technical views under More/contextual links;
- add labeled Your data/Example data control;
- compact setup for returning users;
- implement Overview hierarchy and issue-first attention panel;
- retain `/dashboard`, `/dashboard/traces`, and legacy trace URLs.

Acceptance at 1280×800 and 1440×900:

- product purpose is readable in two seconds;
- source and period are visible;
- primary action and issue/no-signal state are above the fold;
- no page-level horizontal scrolling;
- rail does not compete with content.

## Slice 3 — Adoption and Journeys

- combine client and capability adoption into business questions;
- render explicit journey paths only when outcomes and ordering are supported;
- keep no-outcome state distinct from healthy or failed;
- include exact tables and definitions.

## Slice 4 — Quality, Capabilities, and Issues

- combine Tools/Catalog conceptually under Capabilities;
- use table-first quality view with thresholds and limitations;
- unify supported observed signals and future alert states on Issues;
- separate observed signal, regression alert, insufficient evidence, resolved, and invalid.

## Slice 5 — Evidence and technical handoff

- rename first-level Trace Explorer to Evidence;
- preserve event order, source, correlation quality/source, redaction, truncation, bounds, completion source, and workspace/session scope;
- show the business issue above the timeline;
- provide return-to-issue and related journey actions.

## Slice 6 — verification and rollout

- browser flows for live/example, no data, errors, retries, filters, deep links, and history;
- visual regression at 1280×800 and 1440×900;
- five-second comprehension tests;
- jargon/content scan;
- staged rollout with analytics for first meaningful action, connection, issue-to-evidence, and interpretation errors.
