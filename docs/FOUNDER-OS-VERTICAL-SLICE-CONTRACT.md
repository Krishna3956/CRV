# Founder OS vertical-slice contract

This document is the integration contract for the six business-facing Founder
OS surfaces. A surface is complete only when its read model, UI state, privacy
boundary, and evidence language agree.

## Shared rules

- Every request uses the same explicit time range and data source (`my` or
  `example`). Example data is clearly labelled and is never silently substituted
  for workspace telemetry.
- Read models return a bounded `data_trust` object. `truncated`, `insufficient`,
  and `identity_coverage` are evidence qualifiers, not cosmetic metadata.
- A missing event is not interpreted as abandonment, completion, or failure.
  The UI must use `N/A`, `unknown`, `not_observable`, or an explicit no-evidence
  state when the protocol cannot prove the outcome.
- Loading, error, unauthorized, and empty states are distinct. None may render
  a zero or a success claim while data is unavailable.
- Telemetry shown in these surfaces is aggregate and privacy-safe. Account and
  entity identifiers remain hashed or count-only; resource contents, prompt
  arguments, raw keys, and raw payloads are never rendered.
- Issue recommendations are signals, not diagnoses. A suggested next step must
  include affected volume and confidence where available.

## Surface-to-read-model mapping

| Surface | Read model | Required evidence boundary |
| --- | --- | --- |
| Who's using it | `who_is_using_it` | Active/new/returning accounts are count-based; unresolved identity remains visible. |
| What they're doing | `capability_activity` | Tool volume and reliability are observed interactions, not business success. |
| Resources & prompts | `resource_prompt_activity` | Names are bounded/hash-only; no resource contents or prompt arguments. |
| The journey | `journey_activity` | Paths and stalls are observed protocol sequences; missing events are not abandonment. |
| Did it work | `outcome_activity` | Completion requires explicit evidence; unknown and not-observable remain separate. |
| What's broken | `issue_activity` | Actionable signals include confidence and affected volume; no root-cause assertion without evidence. |

## Release gate

The local contract is covered by `DashboardApp.contract.test.mjs`, TypeScript,
lint, and `npm run test:release-gate`. Production readiness still requires a
deployed build, authenticated workspace data, and redacted runtime evidence for
each surface. A passing local contract is not production evidence.
