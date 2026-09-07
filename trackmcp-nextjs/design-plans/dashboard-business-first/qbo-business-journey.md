# QBO business-user journey

This is the complete journey the Overview must support. It is written as a comprehension test, not as an implementation script.

1. **Engineering says the MCP exists.** The business stakeholder receives a link to TrackMCP and does not need to know protocol vocabulary.
2. **The stakeholder enters.** The first viewport names the workspace, shows `Live data` or `Example data`, shows the selected 7, 30, or 90-day period, and states the question the page answers.
3. **They ask whether it is being used.** The `AI clients observed` KPI and Adoption view answer with server-boundary evidence. The copy never calls client adapters users or customers.
4. **They ask what work people are trying to do.** Journeys groups observed work and explains whether the grouping has explicit workflow outcome data.
5. **They ask whether the work is completing.** Work completed shows an explicit-outcome numerator, denominator, percentage, and source. If outcome events are absent, the card says `No explicit workflow outcome data` and does not infer completion from sessions.
6. **They identify what needs attention.** Needs attention remains visible even with no insights. Each signal shows evidence basis, threshold, eligible volume, and confidence state. Insufficient evidence is ranked below confirmed signals and is not styled as a failure.
7. **They open technical Evidence only if required.** Evidence is a full page with bounded-result language, redaction state, origin, and a shareable URL. `Legacy/Unknown` remains neutral when origin cannot be classified.
8. **They share the investigation with engineering.** Copy link preserves workspace, view, range, mode, issue, and evidence context. Engineering can follow the link without replaying the business question.

## Comprehension checks

- In the first ten seconds, a participant can point to the data source, time range, usage answer, completion answer, and next action.
- A participant can distinguish `AI clients observed` from people or customers.
- A participant can say why Work completed is unavailable when no explicit outcome events exist.
- A participant can identify a confirmed signal, a lower-confidence signal, and insufficient evidence from the Issues page.
- A participant can explain that Evidence is bounded and redacted, and can return to the originating page with browser Back.
