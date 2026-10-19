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

| Field | Value |
| --- | --- |
| gate_id | production-dashboard-setup-labels |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:08:00Z |
| command_or_probe | Authenticated Chrome browser refresh at `app.trackmcp.com/dashboard?view=setup&data=my`; inspected the Setup accessibility tree after App Runner run 84 completed successfully |
| environment | production |
| candidate_sha | cbb3a03732160bcbb74e1d4b053f37b8f39a2f56 |
| result | pass |
| evidence_reference | Redacted browser accessibility evidence exposed bounded `Server name` and `Environment` fields and a generated TypeScript snippet containing `service` and `environment`; the page also displayed the existing first-event waiting state and key/privacy controls. Hosted CI runs 384 and 385 passed; App Runner deploy run 84 (`39256158329`) completed successfully. |
| caveat_or_scope | Proves the latest setup-label change is live and readable in the authenticated production dashboard. The labels are telemetry scope hints, not deployment or identity proof. This does not close responsive/mobile evidence, cross-workspace authorization, scheduler, rollback, or 100-customer capacity gates. |

| Field | Value |
| --- | --- |
| gate_id | production-registry-integrity-smoke |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:18:00Z |
| command_or_probe | `TRACKMCP_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_SMOKE TRACKMCP_SMOKE_BASE_URL=https://trackmcp.com TRACKMCP_SMOKE_CANDIDATE_SHA=cbb3a03732160bcbb74e1d4b053f37b8f39a2f56 npm run smoke:production-pilot` |
| environment | production / public registries |
| candidate_sha | cbb3a03732160bcbb74e1d4b053f37b8f39a2f56 |
| result | pass |
| evidence_reference | Redacted report `/tmp/trackmcp-production-smoke.json`; 14 checks passed. Registry checks verified exact expected npm/PyPI versions, npm SHA-512 integrity fields and tarball origin, and PyPI wheel/sdist SHA-256 fields. |
| caveat_or_scope | Read-only registry and public-surface evidence only. No API key, write event, workspace mutation, or package publication occurred. Provenance attestation and operator-retained checksum archive remain open acceptance items. |
