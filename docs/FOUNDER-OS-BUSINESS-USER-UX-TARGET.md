# Founder OS business-user UX target

Status: active audit and implementation target, 2026-11-02

## Outcome

TrackMCP should feel understandable to a non-technical product, operations, or
customer-success user after an engineer connects the server. A new user should
know what to do next, and an activated user should be able to answer four
questions without reading protocol documentation:

1. Who is using the MCP?
2. What are they trying to do?
3. Did the work succeed?
4. What needs attention next?

This target is derived from the Founder OS product thesis: “Engineers connect
it. Business and product teams use it.” See `/Users/krishna/Downloads/Founder OS.pdf`
and `docs/FOUNDER-OS-PDF-PRODUCT-PARITY.md`.

## Personas and journeys

### Persona A: newly signed-up business user

The person may have created an account before an engineer has connected a
server. They need a truthful orientation, a visible next step, and a preview
of the value they will get after connection. They must not be asked to
interpret JSON-RPC, transport, correlation IDs, or SDK internals.

Acceptance criteria:

- The first screen says what TrackMCP is for in business language.
- The setup state clearly distinguishes “not connected yet” from “connected
  but no activity in this date range.”
- The user can see the three setup steps and understand who normally performs
  them.
- The user is told what will appear after the first event: usage, work,
  outcomes, and issues.
- Optional identity enrichment is clearly optional and never presented as a
  blocker.
- Example data is explicitly labeled as illustrative and never mixed into My
  data.

### Persona B: activated business user

The person returns to understand adoption and outcomes, not implementation
details. They need one business question per page, honest caveats, readable
metric labels, and a next action when evidence exists.

Acceptance criteria:

- The navigation labels map to business questions, not protocol concepts.
- Every headline metric has a plain-English meaning and evidence caveat.
- “N/A”/insufficient evidence is not presented as zero or as a healthy state.
- Unknown or self-reported identity remains visible when present.
- Technical details are available as drill-down evidence, not the default
  dashboard language.
- A business user can move from an issue to supporting evidence and a suggested
  next step.

## Non-negotiable truth and privacy rules

- Do not infer abandonment or completion from a missing event.
- Do not present self-reported client identity as verified identity.
- Do not expose payloads, prompt arguments, resource contents, raw keys, or
  secrets in the business dashboard.
- Do not replace missing workspace data with Example data silently.
- Preserve the existing data-trust and bounded-telemetry contracts.

## Delivery boundary

This target starts with an evidence-backed comprehension pass: copy,
orientation, setup explanation, and metric glossary. It does not authorize a
new analytics schema or a silent change to metric formulas. Formula and
read-model gaps become explicit follow-up work in the work queue.
