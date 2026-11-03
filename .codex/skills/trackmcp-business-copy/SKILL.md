---
name: trackmcp-business-copy
description: Write or review TrackMCP dashboard, setup, analytics, and release copy for non-technical product and operations teams while preserving evidence boundaries and technical accuracy.
---

# TrackMCP business copy

Use this skill when changing customer-facing copy in the TrackMCP dashboard,
setup flow, analytics views, empty states, loading states, docs, or release
notes. Do not use it to rename API fields, change metric formulas, or rewrite
technical protocol documentation without a separate technical review.

## Reader and job

The primary reader is a product, operations, support, or leadership teammate
who wants to answer:

1. Who is showing up?
2. What are they trying to do?
3. Did the work complete?
4. What deserves attention next?

A technical teammate connects the server and sends the first event. The copy
must make that handoff clear without making the business reader learn MCP
protocol terminology.

## Writing rules

- Lead with the reader's question, status, or next action.
- Prefer one short sentence and one clear action over a multi-line banner.
- Use one customer-facing term consistently: `connection key`, `server
  activity`, `account group`, `Example data`, and `Open evidence`.
- State the evidence boundary when it changes interpretation: observed activity
  is not customer count, an explicit outcome is not inferred success, and
  missing events are not abandonment.
- Use `N/A`, `Unknown`, or `Insufficient evidence` when the data does not
  support a number. Never replace uncertainty with zero or a reassuring
  status color.
- Keep technical detail in a disclosure, secondary panel, or documentation
  link unless it is the recovery action for the current state.
- Give failure states a recovery path: retry, open Setup, request access, or
  view Example data. Do not end with an error sentence alone.
- Use sentence case for headings and buttons. Make button labels describe the
  action (`Open Setup`, `Review signals`, `See Example data`).
- Do not invent customer claims, health claims, completion claims, rankings,
  benchmarks, or identity claims.

## Review checklist

Before accepting copy, check:

- Can a non-technical reader say what this page is for after one scan?
- Is the selected period or data source visible where the metric appears?
- Does every unknown or partial state explain why it is unknown and what to do?
- Is the primary action unique and visually obvious?
- Is the wording short enough to scan without hiding the caveat that matters?
- Are the technical terms either removed, explained, or moved behind detail?
- Does the change preserve the metric contract and privacy boundary?

## References

This skill follows the repository's business-user UX research plus the
official guidance on skills and evals:

- https://developers.openai.com/plugins/concepts/skills
- https://developers.openai.com/blog/eval-skills
- https://designsystem.digital.gov/components/typography/
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum

When a copy change is material, add a focused contract test and record the
decision in `docs/FOUNDER-OS-BUSINESS-USER-UX-RESEARCH.md` or the work queue.
