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

| Field | Value |
| --- | --- |
| gate_id | production-registry-exact-checksum-smoke |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:26:00Z |
| command_or_probe | Production smoke with the reviewed npm SHA-512 integrity values and PyPI wheel/sdist SHA-256 values supplied through `TRACKMCP_EXPECTED_*` comparison variables |
| environment | production / public registries |
| candidate_sha | cbb3a03732160bcbb74e1d4b053f37b8f39a2f56 |
| result | pass |
| evidence_reference | `/Users/krishna/Documents/Codex/2026-10-17/okay-x20/CRV/docs/evidence/production-registry-integrity-2026-10-19.json`; 14 checks passed and all four expected checksums matched registry metadata. |
| caveat_or_scope | This verifies metadata/checksum identity only. It does not prove registry provenance attestations, package publication ownership, or a customer installation. |

| Field | Value |
| --- | --- |
| gate_id | production-registry-current-package-check |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:27:00Z |
| command_or_probe | Read-only production smoke with exact package expectations: npm SDK `0.1.2`, npm CLI `0.1.4`, PyPI `trackmcp==0.1.4`, plus all four reviewed checksum comparison variables |
| environment | production / public registries |
| candidate_sha | d28540140c2004bc9d75713ed5a4b4d4dd7ff21e |
| result | pass |
| evidence_reference | [current registry evidence](docs/evidence/production-registry-integrity-2026-10-19-current.json); exact npm integrity and PyPI SHA-256 values matched current registry metadata. |
| caveat_or_scope | Corrects the superseded Python `0.1.3` smoke default. This remains read-only and does not prove provenance attestation, customer installation, or production telemetry. |

| Field | Value |
| --- | --- |
| gate_id | current-registry-smoke-runner-deployment |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:26:00Z |
| command_or_probe | GitHub Actions CI runs [39259362636](https://github.com/Krishna3956/CRV/actions/runs/39259362636) and [39259356603](https://github.com/Krishna3956/CRV/actions/runs/39259356603), followed by App Runner run [39259362655](https://github.com/Krishna3956/CRV/actions/runs/39259362655) for `fb62e27` |
| environment | CI / App Runner production |
| candidate_sha | fb62e27e54910329a9a5311ab06103fd83d91846 |
| result | pass |
| evidence_reference | Both CI runs and the App Runner deployment completed successfully; the production smoke runner now defaults to the currently published Python package `trackmcp==0.1.4`. |
| caveat_or_scope | Proves deployment of the corrected smoke-runner default and supporting documentation. It does not close authenticated customer-flow, scheduler, rollback, distributed-rate-limit, or final pilot-go/no-go gates. |

| Field | Value |
| --- | --- |
| gate_id | registry-provenance-attestation-audit |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:29:00Z |
| command_or_probe | Read-only GitHub attestations page for `Krishna3956/CRV` and the successful publish workflow `39230924269` |
| environment | GitHub production metadata |
| candidate_sha | 1458735d7091ffbf45f3a3ad820779dd0c4fe547 |
| result | blocked |
| evidence_reference | GitHub repository attestations page reports `No attestations`; the publish workflow is successful and uses npm `--provenance`, but no repository-retained build attestation is currently visible. |
| caveat_or_scope | This is an explicit provenance gap, not a package-integrity failure. Queue item 255 remains open until provenance evidence is retained or the release owner explicitly narrows the pilot claim. |

| Field | Value |
| --- | --- |
| gate_id | package-provenance-remediation |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:32:00Z |
| command_or_probe | Reviewed `.github/workflows/publish.yml` and passed `scripts/publish-workflow.contract.test.mjs` after adding `actions/attest-build-provenance@v2`, `attestations: write`, and isolated npm pack subjects |
| environment | local / GitHub Actions workflow definition |
| candidate_sha | bf5fbd6 |
| result | pass-preparation |
| evidence_reference | Commit `bf5fbd6`; the workflow now creates npm package subjects in `$RUNNER_TEMP`, builds Python subjects in `dist/`, and requests GitHub build attestations for each package path. |
| caveat_or_scope | This prepares future publications but does not retroactively create an attestation for already-published artifacts. Queue item 255 remains open until a package publication workflow run produces and retains the attestation. |

| Field | Value |
| --- | --- |
| gate_id | production-smoke-runner-deployment |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:21:00Z |
| command_or_probe | GitHub Actions deploy run [39258226144](https://github.com/Krishna3956/CRV/actions/runs/39258226144) for commit `8510e00`; inspected the completed App Runner workflow result |
| environment | CI / App Runner production |
| candidate_sha | 8510e00 |
| result | pass |
| evidence_reference | Hosted CI run `39258226230` passed and App Runner deployment run `39258226144` completed successfully after the smoke-runner image was built, pushed, deployed, and health-checked. |
| caveat_or_scope | Proves the production smoke-runner code was deployed successfully. It does not itself perform an authenticated write smoke, cross-workspace test, scheduler run, rollback rehearsal, or package provenance attestation. |

| Field | Value |
| --- | --- |
| gate_id | workflow-and-release-gate-refresh |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T13:55:00Z |
| command_or_probe | `npm run test:release-gate`; GitHub Actions API checks for runs `39260619837`, `39260616175`, and App Runner run `39260389835` |
| environment | local / GitHub Actions / App Runner production |
| candidate_sha | `098c173` for the evidence-only queue update; deployed run `87` resolved commit `fd8c33e` |
| result | pass |
| evidence_reference | Local release gate completed all 103 suites. Hosted CI runs 410 and 411 completed successfully. App Runner deployment run 87 completed successfully. |
| caveat_or_scope | This refresh confirms internal and deployment workflow health; it does not close cross-workspace authorization, scheduler execution, rollback rehearsal, distributed rate-limit, or package provenance publication gates. |

| Field | Value |
| --- | --- |
| gate_id | production-public-smoke-refresh |
| owner | Head of Engineering |
| timestamp_utc | 2026-10-19T14:02:00Z |
| command_or_probe | `TRACKMCP_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_SMOKE TRACKMCP_SMOKE_BASE_URL=https://trackmcp.com npm run smoke:production-pilot -- --candidate-sha 775169b` |
| environment | production public endpoints; read-only smoke |
| candidate_sha | `775169b` |
| result | pass |
| evidence_reference | Production pilot smoke completed 14 checks and wrote a redacted report at `/tmp/trackmcp-production-smoke.json`. |
| caveat_or_scope | This validates public availability, sitemap/registry metadata, and package integrity metadata only. It does not perform authenticated writes or prove tenant isolation, worker execution, rollback, or provenance attestations. |
