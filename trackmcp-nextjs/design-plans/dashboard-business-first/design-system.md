# Design system proposal

This is a design contract for review, not a production token file.

## Intent before style

| Screen | Human | Task | Feeling | Focal point | Density |
| --- | --- | --- | --- | --- | --- |
| Overview | Product owner | Decide what matters next | Oriented and confident | One issue or neutral no-signal state | Calm operational |
| Adoption | Ops/product owner | Understand who and what is used | Curious, comparative | Ranked AI-client/capability view | Analytical |
| Journeys | Product owner + engineer | Find where work stops | Causally curious | Explicit journey outcome | Analytical/investigative |
| Quality | Ops/engineer | Choose the capability to inspect | Focused and actionable | Highest-supported quality signal | Operational |
| Issues | Cross-functional team | Choose the next fix | Decisive, evidence-aware | Issue queue with action | Operational |
| Evidence | Engineer | Verify what happened | Precise and bounded | Selected event sequence | Investigative |
| Setup | First-time evaluator | Connect a server | Welcomed and guided | Connect your server | Calm guided |

## Typography

Use Inter or Geist Sans for the product surface. Use Geist Mono only for IDs, code, and raw technical values.

| Role | Size | Weight | Line height | Use |
| --- | ---: | ---: | ---: | --- |
| Metadata | 12px | 500–600 | 16px | Source, period, limitation |
| Body | 14px | 400 | 20px | Explanations, table cells |
| Body emphasis | 14px | 600 | 20px | Actionable labels |
| Section heading | 18px | 600 | 24px | Panel titles |
| Page title | 30px | 700 | 36px | Business page promise |
| Primary metric | 32px | 650 | 36px | KPI number, tabular numerals |
| Technical ID | 12px | 500 | 18px | Session/correlation/request IDs |

Rules:

- sentence case everywhere in the first layer;
- no ordinary metric names in letter-spaced all caps;
- minimum essential text size is 12px;
- use tabular numerals for cards, tables, and chart labels;
- bold is reserved for hierarchy, not decoration;
- use a display face only on marketing pages, not the operational dashboard.

## Spacing

Base unit: **4px**. The common rhythm uses 4, 8, 12, 16, 24, 32, 40, and 48px.

| Relationship | Spacing |
| --- | ---: |
| Icon to label | 8px |
| Label to helper | 4px |
| Control group gap | 8px |
| Card internal padding | 20px |
| Panel internal padding | 24px |
| Section gap | 32px |
| Page top/bottom rhythm | 32px / 48px |
| Primary rail/content gap | 32px |

At 1280px, reserve 224px for the rail and 32px each side in the content area. At 1440px, allow a 1200px content measure with 32px outer gutters rather than stretching every panel to the viewport edge.

## Color tokens

| Token | Value | Meaning |
| --- | --- | --- |
| Ink | `#14201A` | Primary text and key numbers |
| Body | `#304038` | Body copy |
| Muted | `#627169` | Secondary copy |
| Faint | `#89968E` | Metadata only |
| Canvas | `#F7F9F7` | Page background |
| Surface | `#FFFFFF` | Primary content surface |
| Elevated | `#FCFDFC` | Side panel, popover, selected comparison |
| Line | `#DDE6E0` | Subtle divider |
| Line strong | `#C3D0C8` | Control/active border |
| Brand | `#159B73` | TrackMCP identity and confirmed positive |
| Brand soft | `#E7F6EF` | Positive/info surface |
| Info | `#2D6CDF` | Links, selected neutral state |
| Info soft | `#EAF1FF` | Information surface |
| Attention | `#B56B00` | Review/incomplete evidence |
| Attention soft | `#FFF4DD` | Attention surface |
| Error | `#B63A3A` | Confirmed error/failure only |
| Error soft | `#FCECEC` | Error surface |
| Neutral | `#6B756F` | Unavailable, legacy, example boundary |

Semantic rules:

- live/example is a source state, never a health score;
- amber means review or incomplete evidence, not failure;
- red means confirmed error or urgent degradation;
- gray means unavailable, legacy, or neutral;
- every colored state includes text and an icon or shape cue.

## Surfaces, borders, and radius

Three surface levels only:

1. Canvas: no border, establishes page rhythm.
2. Content: white with a single `1px` Line border.
3. Attention: lightly tinted semantic surface with a semantic left rule.

Decisions:

- standard radius: 10px;
- compact controls: 8px;
- full-page attention panel: 12px;
- no decorative shadow on ordinary panels;
- one soft shadow only for menus or a selected issue drawer;
- do not border every sentence or small metric;
- use dividers within tables, not card stacks for every row.

## Signature element: the evidence path

Use a restrained three-node path motif in the Overview and Issues pages:

`Activity observed` → `Work outcome / issue` → `Evidence to inspect`

It is not decorative. It makes the product's promise legible and creates a shared mental model between business users and engineers. The path becomes a compact, accessible list on narrow screens and a horizontal connector on desktop.

## Defaults rejected

- generic KPI-card grid as the only hierarchy;
- permanent rail containing every API concept;
- all-caps micro-labels as the primary voice;
- rainbow charts or decorative donuts;
- green “live” dots that look like health;
- gradients in the operational surface;
- equal-weight bordered boxes for all content.
