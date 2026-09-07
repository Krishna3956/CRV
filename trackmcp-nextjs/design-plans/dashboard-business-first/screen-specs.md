# Screen jobs and return paths

Every primary page has a business job, one primary action, an honest zero-state, a detail path, a return path, and context-preserving URL state. The rendered SVGs are the visual source of truth for this study.

| Screen | Job | Primary action | Empty or insufficient state | Detail path | Return and URL behavior |
| --- | --- | --- | --- | --- | --- |
| Overview | Answer whether the MCP product is being used, whether explicit work is completing, and what deserves attention. | Review evidence on the top ranked signal. | Needs attention remains present with a neutral no-signal or insufficient-evidence message. | Overview -> Issues or Evidence. | Preserve `view`, `range`, `mode`, and selected issue in the URL. |
| Adoption | Answer which AI clients were observed and how much activity was server-observed. | View client detail. | No AI clients observed in the selected period; do not call this no users. | Adoption -> AI client detail -> Evidence. | Adoption is a view under Overview; browser back returns to Overview with range and mode intact. |
| Journeys | Answer what work people are trying to complete. | View an explicit-outcome journey. | No explicit workflow outcome data; sessions are not completion evidence. | Journey -> outcome events -> Evidence. | Preserve journey id and range; back returns to the filtered Journeys list. |
| Quality | Answer which capabilities help or hinder observed work. | Review one capability. | Insufficient evidence shows threshold and observed volume, not zero. | Quality -> capability -> Evidence. | Preserve capability id, range, and mode. |
| Issues | Rank attention by firing alerts, confirmed observed signals, lower-confidence signals, then insufficient evidence. | Review the highest-confidence signal. | No actionable signals yet; no signal is not the same as confirmed health. | Issue -> Evidence. | Preserve issue id and filter state; browser back returns to the ranked queue. |
| Evidence | Let a technical user inspect bounded, redacted records and share the investigation. | Copy link or narrow the scope. | No matching events or unauthorized state is explicit; do not show stale trace content. | Evidence -> session/trace detail. | Full-page route is shareable and browser-history friendly; legacy trace links resolve here. |
| Setup | Make the data understandable before sharing it with business stakeholders. | Define explicit workflow outcomes. | Missing setup data explains what cannot be measured. | Setup step -> configuration detail. | Return to the source page after save; retain workspace and selected range. |

## Global interaction contract

- The top bar always exposes `Live data` or `Example data` as an explicit selection and a 7, 30, or 90-day range.
- The connection strip describes source state only. It never implies product health and never claims freshness without an API contract.
- Primary buttons use action language that predicts the destination: `Review evidence`, `View client detail`, `Open Setup`, `Narrow period or scope`.
- Tables use a contained scroll region when more rows exist than fit. The region has a visible bottom fade, a scrollbar or continuation affordance, and a row count so page-level horizontal overflow is not required.
