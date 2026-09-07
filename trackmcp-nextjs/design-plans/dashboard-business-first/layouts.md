# Desktop layouts

## Current versus proposed shell

| Area | Current | Proposed |
| --- | --- | --- |
| Rail | 224–248px visual wall with 10+ technical destinations | 224px rail with five jobs, More, Setup, account |
| Top bar | Workspace label, technical page title, range, low-context switch, refresh | Workspace/environment, business page promise, `Your data / Example data`, range, refresh |
| First content block | Full four-step technical setup checklist | Compact connection/source state; full setup only for no-data/first-time |
| Hero | Four equal technical KPIs | One answer-led issue/no-signal panel plus four business KPIs |
| Body | Charts and panels of comparable weight | Attention first, then activity/adoption, then technical disclosure |
| Technical detail | Appears in page labels and helpers | Enters through `Open evidence`, info disclosures, and More |

## 1280×800 composition

At 1280×800, the proposed Overview uses:

- 224px rail;
- 32px content gutters;
- 60px top bar;
- 88px page heading/status area;
- 76px source/status strip;
- 112px KPI row;
- 176px attention panel with a clear action;
- chart content begins below the fold, but its title and decision caption remain visible.

Quality, Issues, and Evidence use the same 240px rail and 32px content gutter. Their main tables never widen the page. The table surface has a contained horizontal scroll region only when needed, with a visible row-count label, a bottom continuation fade, and a `Narrow period or scope` action. The page itself remains `overflow-x: hidden` in the layout contract.

The first viewport must show the product question, data source, selected period, four KPI meanings, and the first issue/action. It must not require the user to scroll through technical setup first.

## 1440×900 composition

At 1440×900, the proposed Overview uses a 1200px content measure. The attention panel occupies the left 7/12 of the first story and a compact “Who is using it?” ranked list occupies the right 5/12. The activity trend begins below with a visible axis and table affordance. The page reads as one story rather than a grid. The extra width adds whitespace rather than extra navigation, and the issue action and Evidence return path remain above the fold.

## Business-to-evidence layout

The progression is:

```text
Overview: “run_query is taking longer than other capabilities”
    ↓ Open issue
Quality: affected capability, denominator, p95, evidence strength, period
    ↓ Open evidence
Evidence: bounded event sequence, source, correlation, redaction, truncation
```

The business context remains in the Evidence header so the engineer knows why the trace was opened.

## States to render in review

The proposed set includes rendered wireframes for:

- Example data Overview;
- Your data with activity;
- Your data with no records;
- insufficient evidence;
- API error with Retry;
- Journeys with explicit outcomes;
- Quality with a supported issue and an insufficient-data row;
- Issues with observed signal and regression-alert placeholders;
- Evidence with bounded/redacted/truncated details.
- Adoption, Capabilities, and Setup with a primary action, empty state, detail path, and return path.
- Default, hover, focus-visible, pressed, disabled, loading, retry, tooltip, keyboard, success, error, empty, insufficient, Live data, and Example data states.
