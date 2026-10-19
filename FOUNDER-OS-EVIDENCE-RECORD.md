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
