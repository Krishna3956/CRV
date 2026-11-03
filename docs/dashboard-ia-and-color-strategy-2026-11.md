# TrackMCP dashboard IA and color strategy — 2026-11-03

## Decision

Keep the current business-facing navigation labels, but make the grouping and visual hierarchy more legible. The dashboard should feel like a calm analytics workspace, not a wall of cards and not an infrastructure console.

### Proposed groups

**Understand**

- Overview — the four questions a business team asks first.
- Who’s using it — accounts, clients, and adoption concentration.
- What they’re doing — capabilities, tools, resources, and prompts.

**Outcomes**

- The journey — workflow steps and drop-off.
- Did it work — completion, success, reliability, and quality.

**Investigate**

- What’s broken — actionable issues and affected volume.
- Evidence — traces and supporting records.

**Configure**

- Setup — connections, keys, environments, and privacy.

This is a visual grouping change, not a route or API change. Existing view IDs and legacy aliases remain stable.

## Color system

Color is assigned by meaning and domain. All values meet a readable contrast target against the dashboard surfaces. There are no gradients.

| Token | Hex | Meaning |
| --- | --- | --- |
| `--color-brand` | `#4f46e5` | primary actions, navigation, selection, links |
| `--dash-violet` | `#7c3aed` | journeys, flows, sequence analysis |
| `--dash-teal` | `#0f766e` | adoption, resources, capability breadth |
| `--dash-amber` | `#b45309` | attention, incomplete evidence, setup work |
| `--dash-coral` | `#c2410c` | incidents and user-impacting issues |
| `--dash-slate` | `#475569` | evidence, neutral technical context |
| `--dash-green` | `#15803d` | verified success and healthy state only |

Rules:

1. A single panel gets at most one accent color.
2. Status colors are never reused for category decoration: green means healthy, coral means impact, amber means attention.
3. Text remains neutral except for links and status labels; colored fills are pale and bounded.
4. Charts use a fixed, color-blind-conscious sequence: blue, violet, teal, amber, coral, slate.
5. Selected navigation uses blue; the selected domain icon uses its domain color only when it is not selected.
6. No gradient backgrounds, gradient borders, or rainbow KPI cards.

## Interaction and copy principles

- The first viewport answers “what changed?” and “where should I look next?” without a help paragraph.
- Definitions belong in the `i` hint and are one sentence. The visible card should not repeat the definition below the number.
- Empty states name the missing signal, explain why it matters in one sentence, and provide one next action.
- A panel title is a noun or question; a subtitle is optional and never repeats the title.
- Use “Example data” as a data-mode choice, not a warning banner.
- Keep filters global and persistent. Keep explanatory controls local.

## TrackMCP mapping

| Founder OS question | Current TrackMCP view | Research-backed adjustment |
| --- | --- | --- |
| Who is using it? | `clients` | Accent with teal; lead with active accounts and concentration, then drill down |
| What are they doing? | `capabilities`, `resources` | Share teal domain language and keep tool/resource tables compact |
| What is the journey? | `journeys` | Violet domain; show step conversion and time-to-step before detail |
| Did it work? | `quality` | Green only for verified success; distinguish insufficient evidence from failure |
| What is broken? | `issues` | Coral for impact; show affected volume, severity, and next action |
| Can I verify it? | `evidence` | Slate; show source and timestamp, not decorative card chrome |
| How do I connect it? | `setup` | Amber for required setup actions; keep methods visible and parallel |

## Implementation boundary

This pass changes CSS tokens, nav affordances, and visual labels only. It does not change telemetry schemas, database queries, privacy controls, or route contracts. New metrics are explicitly out of scope until their read models and tests exist.

