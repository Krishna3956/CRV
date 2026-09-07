# Current dashboard audit

## Audit scope and method

The audit was performed against the new branch's `origin/main` checkout and the local authenticated dashboard bypass. It used:

- rendered dashboard at `http://localhost:3000/dashboard?data=sample` at 1280×800 and 1440×900;
- rendered live/no-records state at `http://localhost:3000/dashboard?data=live` at both laptop sizes;
- accessibility-tree inspection of Overview and the live empty state;
- source inspection of `DashboardApp.tsx`, `TraceExplorer.tsx`, dashboard routes, and `globals.css`;
- public website inspection of [trackmcp.com](https://www.trackmcp.com/), [pricing](https://www.trackmcp.com/pricing), and [docs](https://www.trackmcp.com/docs);
- the supplied [business-first PRD](evidence/PRD-DASHBOARD-BUSINESS-FIRST-REDESIGN.md).

Captured evidence is in [evidence/](evidence/). The screenshots are current-state evidence, not proposed designs.

## What works today

| Evidence | Strength to preserve |
| --- | --- |
| Overview exposes `Sample mode selected` and says sample traces are not live | Live/example boundary is visible and honest |
| Live empty state says `No live data available`, with `Retry` and `Explore sample dashboard` | Empty data is distinguished from example data |
| Source maps explicit workflow events to completion and calls out session heuristics as not workflow completion | Completion semantics are defensible |
| Tool Quality exposes minimum-volume reasons and bounded-source-scan copy | Insufficient data is not styled as failure |
| Trace Explorer shows correlation quality, `Legacy/Unknown`, redaction, truncation, bounded result, and Retry | Technical evidence has meaningful limitations |
| URLs preserve view, date range, data source, trace session, correlation handle, and origin | Investigation context can be handed off |
| Public site says “who is using your MCP server,” “what they are trying to do,” “whether the work gets done,” and “what to fix next” | Product promise is already business-oriented |

## Current Overview at a glance

At 1280×800, the visible composition is:

1. 248px-ish left rail with ten-plus equal-weight destinations;
2. sticky top bar with `Overview`, date range, a `Sample data` switch, and refresh;
3. a large `Connect your MCP server` onboarding panel with four technical steps;
4. Overview title and description;
5. sample status strip;
6. four technical KPI cards: Tool calls, Sessions, Errors, Completion;
7. the main business attention panel begins below the first viewport.

At 1440×900, the attention panel is visible, but the page still reads as a collection of technical cards and setup modules before it reads as a product decision surface.

## Evidence-backed friction points

### 1. The first viewport answers setup before it answers the business question

The onboarding checklist consumes approximately 315px of vertical space even when example data is already available. The user sees `Create an API key`, `Install the SDK`, `Wrap your server`, and `Verify an event` before seeing the main attention state. This is appropriate for a new no-data workspace, but not as the dominant block when data is already present.

**Design implication:** use a compact connection/status strip for returning users; reserve the full setup journey for no-data and first-time states.

### 2. Navigation exposes the internal model

The current rail uses `Sessions`, `Workflows`, `Trace Explorer`, `Tool quality`, `Catalog`, `Clients`, `Reliability`, `Intent & Gaps`, `Outcomes`, and `Releases`. These labels are accurate technical destinations but make the user learn TrackMCP's event model before learning what decision each page supports.

**Design implication:** five task destinations should lead: Overview, Adoption, Journeys, Quality, Issues. Technical views remain under contextual or secondary links.

### 3. KPI hierarchy is not the PRD hierarchy

The live render gives equal weight to Tool calls, Sessions, Errors, and Completion. `Sessions` is especially risky as a business proxy because a session is an observed connection/grouping, not a person or completed task. The PRD's business-first KPI row calls for AI clients, Activity, Work completed, and Needs attention, with unavailable values remaining unavailable.

**Design implication:** use business questions as card titles, show technical definitions as helper text, and keep unsupported concepts out of the hero row.

### 4. “What needs attention” is visually late

At 1280×800, the attention story is below the fold. At 1440×900 it appears, but beside the start of the activity chart and after the setup block. The current issue copy is technically careful, but the business user must scroll to reach the next action.

**Design implication:** put one focal attention panel immediately after the status strip and KPI row; let it own the first action.

### 5. Technical density is high even when the product promise is plain English

The rendered page uses uppercase micro-labels, dense helper text, and technical phrases such as `server-observed`, `bounded`, `correlation`, and `completion source`. The implementation has strong truth-preserving copy, but the first layer still asks the user to parse the implementation vocabulary.

**Design implication:** put plain-language meaning in headings and actions; expose technical definitions through info affordances, evidence drawers, and the Evidence destination.

### 6. Example data is visible but called “Sample” in the product layer

The current switch says `Sample data` and the status strip says `Sample mode selected`. This is honest, but the PRD recommends `Example data` and `Your data` because they communicate purpose, not implementation state.

**Design implication:** use a labeled two-option data-source control: `Your data` / `Example data`, with a visible badge and an explicit return path.

### 7. Setup language starts with implementation mechanics

The setup panel leads with API key creation, SDK installation, and wrapper code. The public site leads with “See how your MCP is being used” and the docs explain the business benefit before the install command.

**Design implication:** say why connection matters first, then show the four technical steps as a progressive setup drawer or dedicated Setup page.

### 8. Current canvas is visually quiet but semantically flat

The current CSS uses white surfaces, subtle borders, gray canvas tones, and green brand accents. This is a solid base, but most panels have comparable border treatment and weight. The result is tidy rather than prioritized.

**Design implication:** use three surface levels, one attention surface, and spacing/type hierarchy before adding more cards.

## State audit

| State | Observed copy/behavior | Assessment |
| --- | --- | --- |
| Example data | `Sample mode selected`; illustrative values; no live trace | Good boundary; rename first-level copy to Example data |
| Live with no records | `No live data available`; Retry; Explore sample dashboard | Good honesty; compact setup context should remain nearby |
| Live error | Red error alert with Retry in app shell | Preserve; use business wording first and technical error second |
| Explicit completion | Completion card helper says `Explicit workflow outcome events` | Good; never relabel session heuristics |
| Insufficient Tool Quality | Reason text is rendered and metrics remain unavailable | Good; bring threshold explanation one level closer to business label |
| Bounded trace | `Showing a bounded result...` | Good; use the same language on business pages |
| Legacy provenance | `Legacy/Unknown` | Good neutral state |
| Loading | Source has loading/empty branches, but the page does not yet have a business skeleton system | Design a reusable state pattern |

## Public promise versus dashboard language

| Public promise | Current dashboard expression | Gap |
| --- | --- | --- |
| “See how your MCP is being used” | `Overview` + `Usage over time` | Does not lead with who/what/why |
| “What they are trying to do” | `Intent & Gaps`, `Workflows` | Requires internal vocabulary |
| “Whether the work gets done” | `Completion` | Better than a heuristic, but not framed as work completed |
| “What to fix next” | `What needs attention` | Present, but below setup and not the focal action at 1280 |
| “Get the answer, not another dashboard” | Many equal panels and technical navigation items | Hierarchy still feels dashboard-first |

## Explicit rejected defaults

The redesign rejects:

- a permanent left rail for every backend response family;
- four equal KPI cards as the whole hierarchy;
- an oversized setup checklist above available analytics;
- a green live indicator that implies health;
- first-level labels such as Trace Explorer, Catalog, Correlation, or Provenance;
- generic `View all` buttons without a destination promise;
- charts without a business question, denominator, or accessible table.
