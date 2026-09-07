# TrackMCP business-first dashboard design package

Status: design study only. No production implementation is included in this branch.

Branch: `codex/dashboard-business-first-design`

Base: `origin/main` at `522067a21d3db17d6cfe98fba508082c75208661`

## Decision in one sentence

Make TrackMCP read like product analytics for an MCP-powered product: answer what is being used, whether useful work is getting done, and what to fix next; keep protocol evidence one deliberate step away.

## Package map

| File | Purpose |
| --- | --- |
| [current-dashboard-audit.md](current-dashboard-audit.md) | Evidence-backed audit of the current dashboard and public promise |
| [personas-and-jobs.md](personas-and-jobs.md) | Business users, engineer users, and primary jobs |
| [information-architecture.md](information-architecture.md) | Proposed navigation, page map, route compatibility, and drill-down model |
| [layouts.md](layouts.md) | Current-versus-proposed desktop layouts and laptop composition |
| [screens/README.md](screens/README.md) | Annotated screen index and render notes |
| [design-system.md](design-system.md) | Exact type, spacing, color, border, radius, and surface decisions |
| [terminology.md](terminology.md) | Plain-English label dictionary and technical disclosure rules |
| [interaction-and-states.md](interaction-and-states.md) | Button, filter, tab, data-source, loading, empty, error, and insufficient-data behavior |
| [charts-and-metrics.md](charts-and-metrics.md) | Chart recommendations, definitions, axes, denominators, and limitations |
| [first-time-journey.md](first-time-journey.md) | First-time user journey and business-to-evidence handoff |
| [qbo-business-journey.md](qbo-business-journey.md) | Complete QBO business-user comprehension journey |
| [screen-specs.md](screen-specs.md) | Page jobs, primary actions, empty states, detail paths, and URL behavior |
| [comprehension-checks.md](comprehension-checks.md) | Five-second test, participant prompts, and pass/fail criteria |
| [implementation-sequence.md](implementation-sequence.md) | Implementation slices, acceptance criteria, and design-only handoff |
| [evidence/README.md](evidence/README.md) | Source log, audit method, and captured current states |
| [production-evidence.md](production-evidence.md) | Authenticated production evidence and evidence limits |
| [ui-skills-guidance.md](ui-skills-guidance.md) | Published UI Skills guidance applied to this product |
| [browser-verification.md](browser-verification.md) | Local 1280 x 800 and 1440 x 900 browser verification |

## Rendered artifacts

The package includes annotated SVG wireframes for:

- current screenshots and proposed navigation;
- Overview and Adoption at 1280 x 800 and 1440 x 900;
- Journeys, Quality, Issues, Evidence, and Setup at both laptop sizes;
- the business-to-technical progressive-disclosure path;
- default, hover, focus-visible, pressed, disabled, loading, retry, tooltip, keyboard, success, error, empty, insufficient, live, and Example data states.

The SVGs are intentionally static and implementation-neutral. They are review artifacts, not production components.

## Scope guardrail

This branch changes only files under `design-plans/dashboard-business-first/`. It does not modify production source, APIs, database files, migrations, SDKs, or deployment configuration.

## UI Skills availability note

The requested `improve-ui`, `interface-design`, and `create-design-md` packages were not installed or discoverable through the local skill catalog or CLI. Their published guidance was reviewed and applied; see [ui-skills-guidance.md](ui-skills-guidance.md). TrackMCP's truth model and the supplied PRD remain authoritative for product semantics.
