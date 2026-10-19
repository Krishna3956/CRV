# Founder OS evidence record

Use one row per local or production gate. This record is intentionally
redacted: never paste API keys, bearer tokens, device codes, customer payloads,
or private URLs into it.

| Field | Value |
| --- | --- |
| gate_id | `<queue-item-or-gate-name>` |
| owner | `<person-or-role>` |
| timestamp_utc | `<YYYY-MM-DDTHH:MM:SSZ>` |
| command_or_probe | `<exact command, query name, or browser action>` |
| environment | `<local / isolated-candidate / CI / production>` |
| candidate_sha | `<full SHA or N/A>` |
| result | `<pass / fail / blocked / not-run>` |
| evidence_reference | `<redacted log, artifact, URL, or SQL postflight reference>` |
| caveat_or_scope | `<what this proves and what it does not prove>` |

## Record rules

- A pass without an owner, UTC timestamp, command/probe, environment, and
  scope caveat is incomplete evidence.
- A local pass must not be relabeled as CI or production evidence.
- A blocked or not-run gate stays open; do not infer success from a neighboring
  check.
- Evidence references must point to redacted, reproducible artifacts.

## Evidence entries

| Field | Value |
| --- | --- |
| gate_id | production-dashboard-information-architecture |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T12:49:00Z |
| command_or_probe | Authenticated Chrome browser: `app.trackmcp.com/dashboard?view=journeys&data=my`; inspected primary navigation, Setup, and Did it work views through the accessibility tree |
| environment | production |
| candidate_sha | 30436b9857a721de9b57516f405f2eca2e82c820 |
| result | pass |
| evidence_reference | Redacted browser accessibility evidence: navigation exposed Overview, The journey, What they’re doing, Did it work, What’s broken, Who’s using it, Evidence, and Setup. Setup exposed connection status, first-event checks, server/environment scope, SDK setup, key management, and privacy controls. Did it work exposed the no-event state and explicit-outcome preview. |
| caveat_or_scope | Proves the production dashboard exposes the intended information architecture and honest empty-state copy for this authenticated workspace. It does not prove responsive/mobile layout, every device-auth state, or that this workspace has received a first event. |
