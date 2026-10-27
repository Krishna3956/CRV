# Founder OS 100 Customer Readiness Ledger

Last updated: 2026-10-28 (main `53ea054`; deployed application `506be89` and App Runner rollout and production smoke verified; cross-language transport-aware result smoke coverage verified; hosted CI `40562115220` passed)
Latest freshness evidence: health workflow `40502266095` (scheduled) inspected eight
redacted worker samples. AWS scheduler cadence is now proven with **3/3
invocations**, and the end-to-end scheduled-success marker is proven with **4/4
CloudWatch EMF successes**. The overall state remains `warning` because
only **1/3 scheduled worker samples** is in the current evaluation window and
the maximum queue lag is `3,506,514 ms` (above the 15-minute pilot budget).

## 2026-10-28 — complete local release-gate baseline

- [x] The complete local release gate passed **144 suites**, including
  accessibility, tenant isolation, privacy/export, protocol matrix, modern
  client fixtures, SDK/CLI/Python packed consumers, docs navigation, dashboard
  contracts, deployment contracts, worker health, and production-smoke
  workflow contracts.
- [x] Current focused UX audits also pass: docs navigation 8/8, sitewide CTAs
  4/4, dashboard contracts 64/64, and accessibility contracts 4/4.
- [ ] This is source/build evidence only. The release remains HOLD pending the
  documented owner approval, backup/PITR evidence, sustained worker freshness,
  credentialed lifecycle/UAT, and customer-owned protocol interoperability
  gates.

## 2026-10-28 — published SDK train reconciliation

- [x] Registry audit confirms the current public train remains
  `@trackmcp/sdk@0.1.22`, `@trackmcp/cli@0.1.11`, and `trackmcp==0.1.13`.
- [ ] The Python transport-aware protocol-result observer was added after the
  published Python artifact. It is source- and CI-verified but must not be
  described as available from PyPI until the next reviewed coordinated release
  train is published and registry-verified.
- [ ] Do not create a micro-release for this alone; batch it with the next
  reviewed SDK/CLI release and run the existing provenance and clean-consumer
  gates before publication.

## 2026-10-28 — coordinated SDK release candidate prepared

- [x] Prepared one reviewed release train: `@trackmcp/sdk@0.1.23`,
  `@trackmcp/cli@0.1.12`, and `trackmcp==0.1.14`.
- [x] Updated active setup/docs examples and package manifests; historical
  registry rows remain unchanged and labeled as historical evidence.
- [ ] Registry publication, provenance, and clean-consumer verification remain
  pending until the gated workflow is run with reviewed confirmation.

## 2026-10-27 — Python public protocol-result contract validation

- [x] Corrected the release contract to assert the shipped public
  `record_protocol_result(...)` observer rather than the private helper name
  that the runtime smoke no longer calls.
- [x] Focused nonpublished-SDK contract tests passed 16/16 and the Python
  runtime smoke passed with seven metadata-only events and no private payload
  markers crossing the serialized boundary.
- [x] Hosted CI run `40559178999` passed web/JavaScript, Go, and .NET jobs on
  source `aca361f`.
- [x] Follow-up hosted CI run `40560443098` passed web/JavaScript, Go, and
  .NET jobs on source `eeafadb` after the ledger-provenance contract was
  reconciled.
- [ ] This validates the SDK source and privacy smoke only; authenticated
  production UAT and the remaining external protocol lifecycle gates stay
  open.

## 2026-10-27 — cross-language protocol-result transport parity

- [x] Go and .NET now expose backward-compatible transport-aware result
  helpers alongside their existing APIs. Only caller-verified `stdio`,
  `streamable_http`, `sse`, and `custom` labels are accepted; unknown labels
  are rejected and no response content enters telemetry.
- [x] Go allowlist/privacy coverage and shared source contracts passed locally;
  the local environment has no Go/.NET compiler.
- [x] Hosted CI run `40561176682` passed web/JavaScript, Go, and .NET jobs on
  source `15a34ff`.
- [ ] This closes SDK transport labeling parity only; transport-owned
  reconnect/replay, authenticated production interoperability, and remaining
  protocol lifecycle rows remain separately tracked.

## 2026-10-27 — transport-aware result smoke validation

- [x] Go and .NET hosted smoke fixtures now call the public transport-aware
  result helpers and assert that the allowlisted transport survives the
  serialized ingest boundary without private result content.
- [x] Hosted CI run `40562115220` passed web/JavaScript, Go, and .NET on
  source `53ea054`.
- [ ] This is SDK/runtime-smoke evidence only; transport-owned reconnect,
  authenticated interoperability, and other external protocol gates remain
  open.

## 2026-10-27 — Python protocol transport parity

- [x] `record_protocol_signal` now preserves an explicitly supplied allowlisted
  transport (`stdio`, `streamable_http`, `sse`, or `custom`) while rejecting
  unknown values and retaining metadata-only privacy behavior.
- [x] Python SDK unit tests (38), runtime smoke, and `git diff --check` passed;
  implementation commit: `aa15534`.
- [ ] This closes transport labeling parity only. Authenticated production UAT,
  transport-owned reconnect/replay, and broader protocol lifecycle boundaries
  remain separately tracked.

## 2026-10-27 — hosted validation for Python transport parity green

- [x] CI run `40556845457` passed on source `aa15534`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The hosted web job passed the release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.
- [ ] This confirms the bounded SDK change and build integrity only; it does
  not close authenticated production UAT or the remaining partial protocol
  lifecycle boundaries.

## 2026-10-27 — hosted validation for bounded Python protocol results green

- [x] CI run `40557588800` passed on source `8c506a1`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The hosted web job passed the release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.
- [ ] This confirms the bounded observer implementation only; authenticated
  production UAT and complete protocol lifecycle support remain open.

## 2026-10-27 — hosted validation for Python protocol metadata parity green

- [x] CI run `40558148645` passed on source `83a1335`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The hosted web job passed the release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.
- [ ] This validates the bounded metadata projection only; authenticated UAT
  and complete protocol lifecycle support remain open.

## 2026-10-27 — hosted validation for latest ledger commit green

- [x] CI run `40556006656` passed on source `f67b3c2`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This confirms engineering/build integrity only; worker freshness, owner
  approval, recovery, privacy, synthetic-data, credentialed-UAT, and protocol
  boundary gates remain separately tracked.

## 2026-10-27 — hosted validation for prior ledger commit green

- [x] CI run `40555426746` passed on source `49d678e`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This confirms engineering/build integrity only; worker freshness, owner
  approval, recovery, privacy, synthetic-data, credentialed-UAT, and protocol
  boundary gates remain separately tracked.

## 2026-10-27 — hosted validation for prior ledger commit green

- [x] CI run `40554974708` passed on source `7e96236`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This confirms engineering/build integrity only; worker freshness, owner
  approval, recovery, privacy, synthetic-data, credentialed-UAT, and protocol
  boundary gates remain separately tracked.

## 2026-10-27 — hosted validation for prior ledger commit green

- [x] CI run `40554412283` passed on source `c158d0b`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This confirms engineering/build integrity only; worker freshness, owner
  approval, recovery, privacy, synthetic-data, credentialed-UAT, and protocol
  boundary gates remain separately tracked.

## 2026-10-27 — hosted validation for latest readiness ledger green

- [x] CI run `40553980253` passed on source `a68f2c0`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This remains engineering/build evidence only; worker freshness, owner
  approval, recovery, privacy, synthetic-data, credentialed-UAT, and protocol
  boundary gates remain separately tracked.

## 2026-10-27 — hosted validation for latest ledger commit green

- [x] CI run `40553396900` passed on source `01544e5`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This confirms source/build integrity only; worker freshness, owner
  approval, recovery, privacy, synthetic-data, credentialed-UAT, and protocol
  boundary gates remain separately tracked.

## 2026-10-27 — hosted validation for ledger commit `f8334bd` green

- [x] CI run `40552961446` passed; web/JavaScript, Go, and .NET jobs completed
  successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This remains engineering/build evidence only; worker freshness, owner
  approval, recovery, privacy, synthetic-data, credentialed-UAT, and protocol
  boundary gates remain separately tracked.

## 2026-10-27 — hosted validation for latest ledger commit green

- [x] CI run `40552504131` passed on source `f71f1ae`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.
- [ ] This confirms the committed readiness evidence and does not close the
  separately tracked worker-freshness, owner-approval, recovery, privacy,
  synthetic-data, credentialed-UAT, or protocol-boundary gates.

## 2026-10-27 — hosted validation for readiness evidence green

- [x] CI run `40551973916` passed on source `2a497d1`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted validation for readiness ledger green

- [x] CI run `40551491583` passed on source `9f45a70`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted validation for latest readiness evidence green

- [x] CI run `40550932268` passed on source `b1d2157`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted validation for final ledger correction green

- [x] CI run `40550439416` passed on source `c8321e9`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted validation completed successfully

- [x] CI run `40549843654` passed on source `6deebf3`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted validation for release ledger green

- [x] CI run `40549321866` passed on source `a9c0cfb`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted validation for ledger evidence green

- [x] CI run `40548842727` passed on source `0511c4b`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted release validation green

- [x] CI run `40548247294` passed on source `270be02`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted readiness-ledger gate green

- [x] CI run `40547837464` passed on source `1bba4f1`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the release gate, lint, production build, TypeScript
  SDK and CLI packed-consumer checks, Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted ledger-header verification green

- [x] CI run `40547368635` passed on source `9056a9a`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke. This verifies the corrected readiness-ledger pointer without changing
  the documented external pilot gates.

## 2026-10-27 — hosted release gate corrected and green

- [x] CI run `40538663963` passed on source `33347a3`; web/JavaScript, Go, and
  .NET jobs all completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke. The prior run's failure was limited to the freshness-evidence wording
  contract and is resolved.

## 2026-10-27 — hosted source-pointer verification green

- [x] CI run `40539236364` passed on source `9f7ee43`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job again passed the full release gate, lint, production build,
  SDK/CLI packed-consumer checks, Python SDK checks, and runtime smoke after the
  ledger's current-main pointer was reconciled.

## 2026-10-27 — hosted ledger-record verification green

- [x] CI run `40539957866` passed on source `baf5639`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK tests and packed consumer, CLI tests and packed consumer,
  Python SDK checks, and runtime smoke.

## 2026-10-27 — hosted readiness-header verification green

- [x] CI run `40540678442` passed on source `0bd4d88`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke after the readiness header was aligned with `main`.

## 2026-10-27 — hosted snapshot-evidence verification green

- [x] CI run `40541690723` passed on source `e971f9c`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke after the readiness snapshot was reconciled to the current deployment.

## 2026-10-27 — hosted ledger verification green

- [x] CI run `40542404919` passed on source `d829854`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted final snapshot gate green

- [x] CI run `40542835261` passed on source `0edd3a8`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted publication-ledger verification green

- [x] CI run `40543324899` passed on source `46c2330`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted final-ledger verification green

- [x] CI run `40543814863` passed on source `e7f0d66`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted release-train record verification green

- [x] CI run `40544789841` passed on source `f4fffa6`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted release-train final verification green

- [x] CI run `40545234500` passed on source `cde4ba6`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted publication gate verification green

- [x] CI run `40545775624` passed on source `7c392b6`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted final publication gate green

- [x] CI run `40546245124` passed on source `a5ecccd`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted final evidence gate green

- [x] CI run `40546655575` passed on source `d188c26`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — hosted release-train verification green

- [x] CI run `40544302264` passed on source `c131116`; web/JavaScript, Go, and
  .NET jobs completed successfully.
- [x] The web job passed the full release gate, lint, production build,
  TypeScript SDK and CLI packed-consumer checks, Python SDK checks, and runtime
  smoke.

## 2026-10-27 — scheduled health evidence renewed

- [x] Scheduled health workflow `40502266095` completed successfully and
  retained artifact `refresh-worker-health-40502266095`.
- [x] The report proves 3/3 AWS scheduler invocations, 4/4 scheduled-success
  EMF markers, zero scheduler errors, and 734 processed records.
- [ ] The worker freshness gate remains open: only 1/3 scheduled application
  samples are in the evaluation window and maximum queue lag is
  `3,506,514 ms`, exceeding the `900,000 ms` pilot budget.

## 2026-10-27 — post-publication docs deployment verified

## 2026-10-27 — hosted cross-language verification renewed

- [x] Hosted CI run `40534695517` passed on source `d42b577`: Go and .NET
  compile/smoke jobs passed, and the web/JavaScript release gate passed after
  the historical deployment-evidence contract was reconciled.
- [x] This closes the previously missing hosted compiler evidence for the
  reviewed Go/.NET observer parity. It does not publish Go/.NET packages or
  close customer-owned OAuth/transport UAT.

## 2026-10-27 — refresh scheduler cadence evidence renewed

- [x] Health workflow `40493587359` completed successfully and retained the
  redacted report artifact `refresh-worker-health-40493587359`.
- [x] The report proves the AWS Lambda invocation cadence (`3/3`) and the
  end-to-end `TrackMCP/RefreshScheduler:ScheduledSuccess` marker (`3/3`) in
  CloudWatch EMF. This closes the prior IAM/log-marker evidence gap.
- [ ] The broader worker freshness gate remains open: only `1/3` scheduled
  application-worker samples are in the evaluation window, the state is
  `insufficient_data`, and maximum queue lag exceeds the 15-minute budget.

- [x] App Runner workflow `40524668419` completed successfully for immutable
  source `506be89f010b5da15cad8d1f02421449a65fa660`. Release gate, image/digest
  verification, rollout readiness, read-only production smoke, immutable
  release identity, and runtime-safety audit all passed.
- [x] Retained redacted artifacts are `app-runner-host-506be89f010b5da15cad8d1f02421449a65fa660`,
  `production-smoke-506be89f010b5da15cad8d1f02421449a65fa660`, and
  `runtime-flags-506be89f010b5da15cad8d1f02421449a65fa660`.
- [ ] This deployment verifies the published SDK/documentation reconciliation
  and current runtime identity; it does not close sustained worker freshness,
  backup/PITR, privacy acceptance, credentialed mutation UAT, or release-owner
  acceptance gates.

## 2026-10-27 TypeScript OAuth observer parity milestone

- [x] The TypeScript SDK now exposes `recordAuthorizationOutcome(method,
  statusCode, sessionId?)` through both the `TrackMCPClient` API and the
  `withTrackMCP(...).trackmcp` wrapper. It accepts only bounded method names
  and canonical `401`/`403` statuses, emitting the same
  `unauthorized`/`forbidden` metadata boundary as Python, Go, and .NET.
- [x] Added a transport-independent public-wrapper regression test proving
  unsupported statuses, unsafe method strings, and secret-like input are not
  retained. README and protocol-matrix wording now document the explicit
  helper alongside automatic client-adapter observation.
- [ ] This remains observer-only. OAuth discovery, registration, token
  exchange, refresh, consent, revocation, and authenticated external-provider
  interoperability remain outside the product until an external integration
  contract and UAT are supplied.

## 2026-10-27 cross-SDK OAuth documentation parity milestone

- [x] Python, Go, and .NET integration guides now expose copyable examples for
  their bounded authorization-outcome helpers, matching the TypeScript guide.
- [x] A protocol contract checks all four public SDK guides for `401`/`403`
  handling and explicit bearer-token/privacy boundaries; focused contracts,
  lint, the 178-route build, and the full 144-suite release gate passed.
- [x] The reviewed TypeScript API is now published as `@trackmcp/sdk@0.1.22`;
  Python remains on the unchanged published `trackmcp==0.1.13` train. Registry
  integrity, provenance, and clean-consumer evidence are recorded in the
  package-readiness record.

## 2026-10-27 TypeScript SDK publication reconciliation

- [x] A direct inspection of the public `@trackmcp/sdk@0.1.21` tarball proved
  that it does not contain `recordAuthorizationOutcome`, while the source now
  carries the helper and is versioned as release candidate `0.1.22`.
- [x] Updated the active runbook, execution plan, package-readiness record, and
  source metadata to distinguish the reviewed `0.1.22` candidate from the
  installable `0.1.21` baseline. This prevents the new API from being claimed
  as public before registry verification.
- [x] Reviewed release candidate `0.1.22` was published by workflow
  `40519934213` from main `5256cdf`; the public tarball contains the helper and
  reports integrity `sha512-w3p01rayFpArLvTWgWP5VvsHLdMrDVZq6V9LNak++WP4LVZRmDgjH+tza8JzxRNM1SdmH9wl/y9XXffy8ipHcw==`.
- [x] A direct clean-consumer download verified the published helper. The
  failed concurrent attempt `40519986407` was a registry staged-version
  conflict, not a source or publication-integrity failure.

## 2026-10-27 CLI proxy documentation discoverability milestone

- [x] Added a first-class `/docs/cli` page covering the bounded stdio proxy
  launcher, exact invocation, byte-preserving forwarding, metadata-only privacy
  boundary, fail-open delivery behavior, HTTPS requirement, and unsupported
  hosted HTTP/SSE/OAuth/replay claims.
- [x] Added the CLI proxy to the SDK documentation sidebar and the main docs
  integration cards so the capability is reachable from the product's normal
  documentation paths rather than only from the package README.
- [x] Production build generated `/docs/cli`; lint and the focused proxy tests
  remain green.
- [x] The CLI proxy is now installable from published `@trackmcp/cli@0.1.11`;
  registry integrity, provenance, and clean-consumer evidence are recorded in
  the package-readiness record.
- [ ] Hosted proxy behavior, OAuth exchange, durable replay, and customer-owned
  transport UAT remain explicitly outside this local launcher milestone.

## 2026-10-27 CLI proxy lifecycle hardening milestone

- [x] The bounded stdio launcher now propagates parent stdin EOF to the child
  process, so a server waiting for stream completion can terminate cleanly.
- [x] Added a regression test for EOF propagation; focused proxy tests, lint,
  build, and the full 144-suite release gate passed.
- [ ] This remains a local launcher boundary. Hosted proxying, OAuth exchange,
  replay/durable reconnect, and customer-owned transport UAT are not implied.

## 2026-10-27 CLI proxy input-boundary hardening milestone

- [x] Proxy endpoint validation now parses a URL, requires HTTPS, rejects
  embedded credentials, and bounds the endpoint length.
- [x] Service and environment labels are now allowlisted and bounded before
  telemetry construction; unsafe runtime and CLI inputs have regression tests.
- [x] Focused proxy tests, lint, production build, and the full 144-suite
  release gate passed.
- [ ] This does not enable hosted proxying or OAuth. Those remain explicit
  external/deferred boundaries in the protocol matrix.

## 2026-10-27 bounded OAuth-outcome observation milestone

- [x] The Node client transport observer now records a metadata-only
  authorization marker for canonical `401` and `403` protocol errors,
  distinguishing `unauthorized` from `forbidden` without retaining challenge
  headers, resource-metadata URLs, bearer credentials, or provider text.
- [x] Added privacy regression coverage for both outcomes and verified the
  clean TypeScript package consumer suite (104 tests).
- [x] Updated the public SDK boundary and protocol matrix: this is observer
  evidence only, not OAuth discovery, registration, token exchange, refresh,
  or proxy behavior.
- [ ] External OAuth-server integration, consent/PKCE policy, revocation,
  tenant binding, and authenticated interoperability UAT remain required
  before any token-handling capability can be enabled.

## 2026-10-27 Go SDK authorization-observer parity milestone

- [x] Added `Client.RecordAuthorizationOutcome` for canonical `401`/`403`
  responses. It emits the same bounded `unauthorized`/`forbidden` markers as
  the Node observer and never accepts challenge headers, URLs, tokens, or
  provider text.
- [x] Added Go unit coverage and public SDK documentation for the boundary.
- [x] The local environment has no Go toolchain, but hosted CI run
  `40534695517` passed the Go compile/smoke job for this source.
- [ ] Go package publication remains a separate release decision; OAuth remains
  observer-only.

## 2026-10-27 — final hosted CI reconciliation

- [x] CI run `40536719713` completed successfully on the current publication
  documentation source: web/JavaScript, Go, and .NET jobs all passed.
- [x] The source, package train, deployed runtime, and hosted verification
  references are now consistent; no deployment is claimed for the docs-only
  source changes after `506be89`.

## 2026-10-27 Python SDK authorization-observer parity milestone

- [x] Added `record_authorization_outcome` for canonical `401`/`403`
  responses with the same bounded `unauthorized`/`forbidden` metadata and
  secret-free boundary as the Node and Go helpers.
- [x] Added Python privacy regression coverage; the local Python suite passes
  38 tests and the public README documents the caller-owned OAuth boundary.
- [ ] Python package publication remains part of the coordinated release train;
  OAuth discovery, token exchange, refresh, and consent remain unsupported.

## 2026-10-27 .NET SDK authorization-observer parity milestone

- [x] Added `RecordAuthorizationOutcome` for canonical `401`/`403` responses,
  including bounded status metadata and secret-free `unauthorized`/`forbidden`
  outcomes.
- [x] Extended the .NET smoke fixture to cover both outcomes and reject other
  status codes; documentation now states the caller-owned OAuth boundary.
- [x] The local environment has no .NET toolchain, but hosted CI run
  `40534695517` passed the .NET compile/smoke job for this source.
- [ ] .NET package publication remains a separate release decision; OAuth
  remains observer-only.

## 2026-10-27 OAuth observer parity contract milestone

- [x] The protocol matrix now names TypeScript, Python, Go, and .NET as the
  four SDKs that expose the same bounded authorization-outcome boundary.
- [x] Added a release-gate contract that checks all four source surfaces retain
  `401`/`403` handling and the `unauthorized`/`forbidden` vocabulary.
- [ ] This contract prevents source drift but does not replace Go/.NET compiler
  and hosted runtime evidence; those remain explicit release gates.

## 2026-10-27 health-state correction deployment

- [x] App Runner deployment `40494157458` rolled out immutable commit
  `9026fa63fdc9b8082372fd50fda93077b8162998` successfully. Hosted release
  gate, rollout, read-only production smoke, immutable identity, runtime
  safety, and redacted evidence uploads all passed.
- [x] Authenticated production smoke `40495081946` passed for the same
  deployed commit; artifact `12729958118` reverified bounded read models,
  tenant isolation, revoked-key rejection, and API-key mutation denial.
- [ ] Backup/PITR, privacy acceptance, credentialed customer-owned UAT, and
  release-owner acceptance remain external gates.

## 2026-10-27 health-report semantics correction

- [x] The health engine now treats a healthy, three-sample AWS scheduler
  window as sufficient production scheduler evidence even when GitHub recovery
  samples are fewer than three. Historical stale or failed worker summaries
  remain visible and still produce warnings.
- [x] Added regression coverage for the AWS-proven/fewer-GitHub-samples case;
  the local 143-suite gate, lint, build, and hosted checks passed.

## 2026-10-27 catalog-correlation deployment verification (latest)

- [x] App Runner deployment run `40489912233` rolled out immutable commit
  `56c0401b9e040149159cfc8071cf238bdc4ed997` successfully.
- [x] The hosted release gate, image/digest verification, rollout readiness,
  read-only production smoke, immutable release-identity check, runtime-safety
  audit, and redacted evidence uploads all passed in deployment job
  `122141218771`.
- [x] Authenticated production smoke workflow `40490936541` also passed against
  the same immutable deployed commit, rechecking dashboard read models,
  workspace isolation, revoked-key rejection, and API-key mutation denial.
- [ ] Scheduler cadence, backup/PITR, privacy acceptance, credentialed
  customer-owned UAT, and release-owner acceptance remain external gates.

## 2026-10-27 refresh-health log-read permission verification

- [x] Read-only health workflow `40491400580` completed successfully after the
  IAM policy update. Its report confirms `scheduled_successes_available: true`,
  proving the workflow can now query the bounded scheduler-success marker.
- [ ] The scheduler gate remains open: only one scheduled sample was observed,
  AWS metrics reported zero current invocations, and the report is
  `insufficient_data` with a freshness breach. Permission availability is not
  evidence of a healthy cadence.

## 2026-10-27 scheduler re-enable and invocation evidence

- [x] Scheduler deployment run `40491826607` completed successfully with
  `enable_schedule=true` and metadata-only evidence collection. The retained
  artifact `12728353468` contains five fresh Lambda log streams for the
  deployed scheduler function, confirming invocation activity after the
  re-enable.
- [ ] CloudWatch invocation/error datapoints were not yet available in that
  bounded collection window, so the sustained three-sample cadence and
  freshness SLO remain open.

## 2026-10-27 scheduler health after re-enable

- [x] Health workflow `40492317740` (artifact `12728574033`) observed one
  scheduled invocation and one scheduled-success marker with zero errors.
  Scheduler evidence is enabled and currently healthy for that sample.
- [ ] The cadence gate still requires three scheduled samples; the report is
  therefore `insufficient_data` and the broader freshness SLO remains open.

## 2026-10-27 scheduler health second sample

- [x] Health workflow `40493000885` observed two scheduled invocations and two
  scheduled-success markers with zero errors; scheduler evidence remains
  healthy for all observed samples.
- [ ] The required three scheduled samples are not yet available, so the
  sustained cadence and freshness gates remain open.

## 2026-10-27 scheduler cadence gates proven

- [x] Health workflow `40493587359` proves three AWS Lambda invocations and
  three scheduled-success markers in the bounded CloudWatch window, with zero
  errors or scheduled failures.
- [x] `aws_scheduler_cadence_gate` and `aws_end_to_end_cadence_gate` are now
  `proven`.
- [ ] The overall worker health state remains `insufficient_data`: only one
  GitHub-scheduled worker sample is available and the report retains a
  historical freshness breach. The application freshness SLO is therefore
  still open despite the AWS scheduler gates passing.

## 2026-10-27 IAM policy evidence reconciliation

- [x] The signed-in AWS IAM console was rechecked against the documented
  `TrackMCPEnableDistributedRateLimit` deployment permission. The previously
  bookmarked **managed-policy** ARN now returns `Policy ... was not found`.
- [x] The role's inline-policy view now provides authoritative evidence:
  `GitHubActionsDeployRole` lists three customer-inline policies, including
  `TrackMCPEnableDistributedRateLimit`. Its read-only preview is resource
  scoped to `apprunner:UpdateService` on the `trackmcp-web` App Runner service
  and `iam:PassRole` on `AppRunnerECRAccessRole`.
- [x] The stale managed-policy ARN is therefore not a missing permission and
  no duplicate managed policy should be created.

## 2026-10-27 SDK release-train publication

- [x] Source changes after the published `@trackmcp/sdk@0.1.20` and
  `trackmcp==0.1.12` artifacts were identified as public SDK changes rather
  than dashboard-only work.
- [x] The batch train published without touching the unchanged CLI:
  `@trackmcp/sdk@0.1.21`, `trackmcp==0.1.13`, and existing
  `@trackmcp/cli@0.1.10`.
- [x] Local package-release audit, TypeScript SDK tests/packed-consumer check,
  Python unit tests, and publish-workflow contracts passed.
- [x] npm/PyPI registry metadata, immutable checksums, provenance, and exact
  clean-consumer downloads are recorded in the package release-readiness file.
  The first npm workflow’s propagation timeout is retained as an operational
  caveat; it did not invalidate the independently verified artifact.

## 2026-10-27 hosted package-consumer timeout hardening

- [x] Repeated deployment attempts showed the hosted TypeScript SDK package
  consumer subprocess exceeded the previous 180-second child-process limit
  despite passing locally. The release gate now uses a bounded 300-second
  limit, with a matching contract test; this changes no SDK assertions or
  publication contents.
- [x] The next deployment run completed the hosted package-consumer gate and
  post-deploy smoke against the published-source commit; see run
  `40484535761` below.

## 2026-10-27 deployment verification after timeout hardening

- [x] Deployment run `40484535761` for `b2100af` passed the full hosted release
  gate after the 300-second package-consumer timeout fix.
- [x] The same run successfully reconciled the ECR image digest, rolled out the
  App Runner service, passed read-only production smoke, verified the running
  release identity, and passed the runtime-safety audit. Redacted evidence was
  uploaded for the smoke, App Runner host, and runtime flags.
- [x] The prior 502 smoke on run `40480967920` is superseded by this verified
  rollout; it remains recorded as a transient failed attempt rather than being
  hidden or relabeled as success.

## 2026-10-27 catalog snapshot evidence milestone

- [x] Authenticated analytics and the Overview protocol panel now show
  notification-family catalog counts separately from versioned catalog
  snapshots, computed diffs, and truncated rows.
- [x] The response and dashboard state explicitly that notification counts are
  not correlated to snapshot versions; no version is inferred from a
  list-changed notification.
- [x] The reviewed notification-to-snapshot correlation is now implemented as
  a bounded evidence join; authenticated cross-transport UAT remains open.

## 2026-10-27 bounded catalog correlation implementation

- [x] Analytics now performs a privacy-safe, server-side evidence join for
  catalog list-change notifications when the notification and snapshot share
  the same server, environment, and catalog family within a ten-minute window.
- [x] The projection reports matched, ambiguous, and unmatched notification
  counts by catalog family. Ambiguous candidates remain unresolved and no
  snapshot version is inferred from a notification.
- [x] Added pure correlation tests covering same-scope matching, scope
  isolation, bounded windows, and ambiguity handling; focused analytics and
  dashboard contract tests pass (89/89).
- [ ] Authenticated cross-transport UAT and production evidence remain open;
  the join is correlation evidence and does not prove causality or delivery.

## 2026-10-27 catalog correlation deployment verification

- [x] App Runner deployment run `40487982157` completed successfully for
  `c5eac7b` after the hosted release gate, image/digest reconciliation, port
  reconciliation, and rollout wait.
- [x] The same run passed read-only production smoke; the deployed runtime now
  contains the v1 analytics and v2 catalog correlation projection.
- [ ] Authenticated customer-owned transport UAT, scheduler freshness,
  backup/PITR, privacy acceptance, and release-owner gates remain open.

## 2026-10-27 completion evidence milestone

- [x] Completion analytics now exposes explicit request/response matches and
  unmatched requests using the existing privacy-safe interaction hash.
- [x] Capability advertisement status remains separate from observed outcomes;
  suggestion values and request contents are never returned.
- [ ] Broader transport fixtures and authenticated completion UAT remain open.

## 2026-10-27 elicitation decision evidence milestone

- [x] TypeScript and Python observers preserve only explicit `accept`,
  `decline`, or `cancel` decisions for elicitation responses.
- [x] Analytics and the dashboard keep these protocol decisions separate from
  business approval and retain no submitted values or content.
- [ ] Broader cross-language fixtures and authenticated sampling/elicitation
  UAT remain open.

- [x] Go and .NET observers now use the same metadata-only decision allowlist;
  hosted cross-language compile/smoke remains the runtime evidence source.

- [x] Public protocol and SDK documentation now exposes the decision evidence
  and its non-approval/privacy limitation consistently.

## 2026-10-27 capability-negotiation evidence milestone

- [x] Analytics now reports bounded requests observed without a same-scope
  capability advertisement, with explicit negotiation-only caveats.
- [ ] Authenticated modern interoperability and peer-owned rejection behavior
  remain external UAT gates.

The health report exposes `scheduled_cadence_gate` separately from operational
`state`, plus `aws_scheduler_cadence_gate` and
`aws_end_to_end_cadence_gate`. AWS metric health can be proven while the
stricter application/end-to-end cadence gates remain pending. Manual and
recovery runs never count as scheduled evidence.

## 2026-10-27 manual refresh-worker recovery evidence

- [x] Explicit recovery run `40446099143` completed successfully on the
  current mainline and retained artifact `12707938220`. It executed ten
  bounded batches with zero processed, zero failed, zero retryable jobs, zero
  timeouts, and `freshness_slo: no_backlog_observed` (`max_queue_lag_ms: 0`).
- [ ] This was a deliberate `workflow_dispatch` recovery run, not an
  EventBridge-scheduled sample. It therefore improves current freshness
  evidence without closing the separate 0/3 scheduled-cadence gate.

The deployed application is the runtime-verified App Runner release
(`70534428fd69a4fa5a07f46adad504a32fdfe262`, workflow `40451066166`).
Credentialed two-workspace auth smoke passed for this exact image; key lifecycle
mutation, customer-owned endpoint UAT, scheduler freshness, backup/PITR, and
owner acceptance remain separate open gates.

## 2026-10-27 latest scheduler-health evidence

- [x] Enablement workflow `40445610213` succeeded and retained scheduler
  metadata artifact `12708211784`.

- [x] Health workflow `40445804232` retained artifact `12708665678` with
  `state: healthy`, eight bounded samples, zero stale runs, zero failed runs,
  and maximum queue lag `105384 ms` (inside the `900000 ms` budget).
- [x] AWS scheduler metadata reported `enabled: true`, two metric datapoints,
  three invocations, and zero errors; no secret, request body, or log content
  was retained.
- [x] The new `aws_scheduler_cadence_gate` is proven from that enabled,
  zero-error metrics window; this is operational scheduler evidence only.
- [ ] The same report records `scheduled_sample_count: 0` against a minimum of
  three. Manual/recovery samples cannot close the sustained scheduled-cadence
  gate, so the release remains HOLD.

## 2026-10-27 latest refresh-worker evidence

- [x] Refresh-worker workflow `40416004272` completed ten bounded batches with
  20 processed, 20 succeeded, zero retryable jobs, zero failed jobs, and no
  timeouts. Its redacted summary artifact is `12695217713`.
- [ ] The same artifact reports `freshness_slo: stale` with maximum queue lag
  `4190625 ms` versus the `900000 ms` pilot budget. The lag improved from the
  prior sample but still does not prove the pilot freshness SLO.

## 2026-10-27 interaction accessibility deployment checkpoint

- [x] App Runner deployment workflow `40412512143` completed successfully for
  the merged interaction-accessibility runtime SHA `1624d9a2e6128feaffe1bfb83746b74a972ae311`.
- [x] Authenticated production smoke workflow `40413417880` completed
  successfully and retained artifact `12694805391` for that deployed runtime.
- [ ] This confirms deployment and authenticated read-only smoke only. It does
  not close key lifecycle mutation UAT, worker freshness, backup/PITR, or final
  pilot-owner acceptance gates.

## 2026-10-27 refresh-worker freshness checkpoint

- [x] Refresh-worker workflow `40406070475` completed its ten bounded batches
  without worker failures: 44 processed, 44 succeeded, zero retryable or
  failed jobs, and no timeouts. Its redacted summary artifact is
  `12690586639`.
- [ ] The same artifact reports `freshness_slo: stale` with maximum queue lag
  `9517787 ms` versus the `900000 ms` pilot budget. This is stronger current
  evidence of the open freshness gate, not a pilot-ready claim.

## 2026-10-27 dashboard interaction accessibility checkpoint

- [x] PR #597 merged as `a767ff88748880b45c42a5c975a8a0e4ebaa1a6`. The shared
  dashboard date-range disclosure, range apply action, issue action-queue
  controls, and one-time connection-key copy action now expose visible
  keyboard focus rings alongside their pointer affordances.
- [x] The dashboard contract now protects these shared controls from regressing;
  the focused dashboard contract (64 tests), accessibility contract (3 tests),
  lint, and full 137-suite release gate passed. Hosted Go, .NET, and web checks
  passed for the merge commit.
- [ ] This closes the audited keyboard-focus gaps only. Production deployment,
  key lifecycle UAT, worker freshness, backup/PITR, and pilot-owner acceptance
  gates remain independently open below.

## 2026-10-27 repository-wide interaction accessibility checkpoint

- [x] PR #599 merged as `1624d9a2e6128feaffe1bfb83746b74a972ae311`. The docs
  sidebar, onboarding checklist, and browser MCP tester now give every audited
  link, disclosure, action, copy, remove, run, cancel, and reset control a
  visible keyboard focus ring while retaining the pointer affordance.
- [x] The accessibility contract now inventories these three surfaces; focused
  accessibility/docs-navigation contracts, lint, and the full 137-suite release
  gate passed. Hosted Go, .NET, and web checks passed for the merge commit.
- [ ] This closes the repository-wide audited focus-ring gaps only. Production
  deployment, key lifecycle UAT, worker freshness, backup/PITR, and pilot-owner
  acceptance gates remain independently open below.

## 2026-10-27 evidence-document freshness

- [x] PR #580 merged as `243d546eb9268a5da87d875e89aaad62ae8335bd`. The stale
  delivery-status snapshot is now explicitly marked historical and points to
  this ledger, the current release record, and the external-gate register.
- [x] Active release artifacts remain anchored to the runtime-verified
  application SHA above; docs-only commits are not represented as new runtime
  deployments.

## 2026-10-27 active-evidence contract hardening

- [x] PR #582 merged as `d5efd745aba10ae6fd3f5a60a0d2c7f3cb3a50cb`. The pilot
  acceptance contract now scopes assertions to the active release sections and
  checks the current deployed SHA, App Runner run, authenticated artifact, and
  scheduler evidence instead of matching historical IDs elsewhere in the docs.
- [x] The full 137-suite release gate, lint, and hosted Go/.NET/web checks passed.

## 2026-10-27 active-evidence contract release

- [x] PR #583 merged as `be1445fd336992a6ad9d620222bc803e36dacf7b`. The ledger
  now records the active-evidence contract milestone separately from the
  runtime-verified application release.

## 2026-10-27 backup/PITR evidence refresh

- [x] Signed-in Supabase production-project inspection reached Database →
  Backups and the Point in time route. The project remains on the Free Plan;
  no scheduled backup, PITR restore point, restoration contact, or completed
  rehearsal was visible. No SQL, data query, or destructive operation was run.
- [ ] Queue item 157 remains an infrastructure-owner gate requiring an
  explicitly accepted backup limitation or a tested recovery reference.

## 2026-10-27 backup evidence release

- [x] PR #585 merged as `9a8b64031b5767c6228c88b0a74020cd1b5dc289`. The fresh
  Supabase backup/PITR inspection is now part of the authoritative external-gate
  evidence rather than an untracked browser observation.

## 2026-10-27 disabled scheduler deployment evidence

- [x] Disabled scheduler deployment workflow `40397368253` failed closed before
  provisioning because App Runner redacted the runtime secret mapping from
  `describe-service`; no secret value or infrastructure resource was exposed.
- [x] After correcting the App Runner metadata path, retry `40398170070`
  reproduced the same redaction boundary. PR #576 (`f4084dc`) now preserves
  automatic discovery when available and accepts only an explicitly supplied,
  non-sensitive Secrets Manager ARN fallback.
- [ ] A valid `worker_token_secret_arn` input and operator execution of the
  disabled deployment remain required before endpoint/token, DLQ/alarm, and
  three-sample freshness evidence can be collected. Schedule enablement remains
  disabled by default.

## 2026-10-27 refresh scheduler deployment hardening

- [x] PR #573 merged as `8e70585f7b38b8bbd76faa41e535c591d7b0d15e`. The manual
  scheduler deployment now discovers the App Runner service URL and the
  `TRACKMCP_REFRESH_WORKER_SECRET` Secrets Manager ARN reference directly from
  `describe-service`; operators no longer copy endpoint or secret-ARN values
  into workflow inputs.
- [x] The workflow validates the App Runner service ARN, hostname, and scoped
  secret reference before SAM deployment. It never reads, prints, or injects
  the secret value, and `EnableSchedule` remains `false` by default.
- [ ] AWS schedule enablement, endpoint/token checks, DLQ/alarm inspection, and
  three in-budget scheduled samples remain external operator evidence gates.

## 2026-10-26 authenticated smoke report contract

- [x] PR #571 merged as `57f56431317564c4789bbae0eb4e7bac92bba29e`. Successful
  authenticated smoke reports now include an explicit `outcome=passed` marker;
  failure reports retain `outcome=failed` and redacted diagnostic checks.
- [x] App Runner deployment `40393173889` and authenticated smoke `40394208530`
  passed for the exact SHA. The retained authenticated artifact `12685019035`
  reports `outcome=passed` and 37 completed checks.

## 2026-10-26 authenticated smoke timeout and transient-502 reconciliation

- [x] PR #569 merged as `70af43edcc8ed6af12204586a11039757878ff5c`. The
  authenticated smoke now uses a bounded 20-second default timeout (configurable
  only within 5–30 seconds) and retries timeout/network failures with a fresh
  signal, while authorization and application responses remain fail-fast.
- [x] The first post-deploy smoke completed all workspace-A checks and the first
  workspace-B checks but ended on a transient HTTP 502 at `/api/v2/prompts`.
  The failed artifact is retained as diagnostic evidence (`12681309725`); no
  privacy or tenant assertion was weakened.
- [x] The bounded rerun recovered and passed 37 authenticated checks for the
  exact deployed SHA; authoritative artifact `12683225656` includes both
  workspace read models, conflicting-workspace checks, action-queue denials,
  and revoked-key rejection.

## 2026-10-26 active-claim and lifecycle-evidence reconciliation

- [x] PR #565 merged as `fda5acd9cc9a30d86dccfe9d24a9eec1870696f6`. The
  credentialed key-lifecycle smoke user-agent is release-neutral; it no longer
  presents an old package version as current. The 137-suite release gate and
  hosted Go/web/.NET checks passed.
- [x] PR #566 merged as `fff91da6576987f5d5259801d71b1e41f268a4bc`. Active
  content-release and PDF truth-audit claims now name the published
  `@trackmcp/sdk@0.1.20`, `@trackmcp/cli@0.1.10`, and `trackmcp==0.1.12` train;
  historical release tables remain explicitly historical. The 137-suite gate,
  hosted CI, App Runner deployment `40381106003`, and authenticated smoke
  `40382233180` passed for this exact mainline.
- [ ] This reconciles evidence wording only; it does not close the remaining
  sustained worker-freshness, backup/PITR, credentialed write/lifecycle,
  interoperability, or pilot-owner acceptance gates.

## 2026-10-26 current published package-train smoke

- [x] The current-release smoke artifact executed 34 of 36 bounded checks and
  passed the registry checks for `@trackmcp/sdk@0.1.20`, `@trackmcp/cli@0.1.10`,
  and `trackmcp==0.1.12`, including npm integrity/tarball-origin verification
  and PyPI wheel/sdist digests.
- [x] This evidence is attached to the exact deployed candidate
  `e363c040d608bd211565f904e882e9a13ac3bbdf`; the smoke no longer validates
  historical package versions by default.
- [ ] Two credentialed checks remain intentionally skipped because no pilot key
  was supplied: authenticated key-status and first-ingest/OTLP write smoke.

## 2026-10-26 current release smoke-retry reconciliation

- [x] The production pilot smoke now creates a fresh bounded timeout signal for
  every idempotent GET/HEAD retry. The prior implementation reused an aborted
  signal, making timeout retries ineffective.
- [x] PR #561 merged as `7c9edcda6ec5b313a38287d185d53f956b7d3be7`; hosted
  web/JavaScript, Go, and .NET checks passed.
- [x] App Runner workflow `40374059804` passed the full release gate, image
  binding, rollout, read-only production smoke, runtime identity, and runtime
  safety checks for that exact SHA.
- [ ] This evidence does not close the separate sustained worker-freshness,
  backup/PITR, privacy-acceptance, lifecycle-UAT, interoperability, or
  release-owner gates.

## 2026-10-26 worker-health recovery evidence deployment

- [x] PR #547 merged as `7551e2f017cce2695803b13ce5605eee72d4a9f8` after the
  hosted web/JavaScript, Go, and .NET checks passed. The health monitor now
  includes both scheduled and recovery-dispatch worker samples, preserves the
  run event in its redacted report, and requires the minimum scheduled sample
  count before declaring sustained health.
- [x] App Runner workflow `40349662276` deployed that immutable SHA. Release
  gate, image binding, rollout, read-only production smoke, running-release
  identity, and runtime-safety audit all passed.
- [x] Retained artifacts are `production-smoke-7551e2f017cce2695803b13ce5605eee72d4a9f8`
  (`12663088021`), `runtime-flags-7551e2f017cce2695803b13ce5605eee72d4a9f8`
  (`12662729496`), and `app-runner-host-7551e2f017cce2695803b13ce5605eee72d4a9f8`
  (`12662628779`).
- [ ] This improves observability and recovery evidence; it does not by itself
  close the sustained worker SLO until repeated scheduled samples are healthy.

## 2026-10-26 worker-health event-provenance validation

- [x] Health workflow `40352798759` ran against main `25877da` and uploaded
  redacted artifact `12663714778`. The new report contained eight bounded
  samples: two scheduled and six recovery/manual runs.
- [x] The report explicitly returned `state=warning` with
  `scheduled_samples_not_met`, `worker_failures_observed`,
  `freshness_budget_exceeded`, and `schedule_cadence_gap`; it did not mistake
  recovery samples for sustained scheduled health.
- [ ] The current evidence is a validated warning, not an SLO pass. Keep the
  worker gate open until at least three scheduled samples are within budget and
  no failure/cadence reasons remain.

## 2026-10-26 bounded insight-evidence deployment

- [x] PR #545 merged as `4e77595087bb14ede1fce4fb573322b3f925d572` after the
  hosted web/JavaScript, Go, and .NET checks passed. Insight cards now expose
  bounded eligible volume and threshold metadata rather than presenting an
  unexplained confidence label.
- [x] App Runner workflow `40345910892` deployed that immutable SHA. The
  release gate, image binding, rollout wait, read-only production smoke,
  running-release identity check, and runtime-safety audit all passed.
- [x] Retained artifacts are `production-smoke-4e77595087bb14ede1fce4fb573322b3f925d572`
  (`12662645650`), `runtime-flags-4e77595087bb14ede1fce4fb573322b3f925d572`
  (`12662435761`), and `app-runner-host-4e77595087bb14ede1fce4fb573322b3f925d572`
  (`12663020048`).
- [ ] This is engineering/deployment evidence only. Sustained worker
  freshness, backup/PITR, privacy acceptance, lifecycle/interoperability UAT,
  pilot-owner approval, and the final operator GO/NO-GO remain open.

## 2026-10-26 alert-delivery evidence deployment

- [x] App Runner workflow `40341314542` deployed merged main commit
  `1e6c7144a6e2714df787bc6ed6fbc87f2a447aba`; rollout, production smoke,
  runtime identity, and runtime safety checks passed.
- [x] Retained artifacts are `production-smoke-1e6c7144a6e2714df787bc6ed6fbc87f2a447aba`
  (`12659303738`), `runtime-flags-1e6c7144a6e2714df787bc6ed6fbc87f2a447aba`
  (`12660500729`), and `app-runner-host-1e6c7144a6e2714df787bc6ed6fbc87f2a447aba`
  (`12658999346`).
- [ ] This deployment validates the bounded Evidence UI change only; it does
  not close sustained freshness, backup/PITR, privacy acceptance, lifecycle
  UAT, interoperability, or release-owner gates.

## 2026-10-26 custom-range release deployment

- [x] App Runner workflow `40335675552` successfully deployed and verified
  merged main commit `57281256e5ac1721a075f9b6f075b326530b1258`. The bounded
  release gate, image binding, rollout wait, production smoke, runtime
  identity, and runtime safety audit all passed. The first smoke attempt hit a
  transient direct-origin timeout; the bounded workflow rerun passed all 36
  checks and is the authoritative result.
- [x] Retained artifacts are `production-smoke-57281256e5ac1721a075f9b6f075b326530b1258`
  (`12657756599`), `runtime-flags-57281256e5ac1721a075f9b6f075b326530b1258`
  (`12658121349`), and `app-runner-host-57281256e5ac1721a075f9b6f075b326530b1258`
  (`12658645535`).
- [ ] Deployment and smoke evidence do not close sustained freshness,
  backup/PITR, privacy acceptance, lifecycle UAT, interoperability, or
  release-owner gates.

## 2026-10-26 current deployed baseline reconciliation

- [x] App Runner workflow `40330265695` deployed immutable main commit
  `83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c` successfully after the bounded
  service-readiness preflight. Production smoke, `/api/health` release identity,
  and runtime safety-flag audit all passed.
- [x] Retained artifacts are `production-smoke-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c`
  (`12653569033`), `runtime-flags-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c`
  (`12653489115`), and `app-runner-host-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c`
  (`12653798778`).
- [ ] Deployment success does not close sustained freshness, backup/PITR,
  privacy acceptance, lifecycle UAT, interoperability, or release-owner gates.

## 2026-10-26 authenticated smoke on current deployed baseline

- [x] Authenticated production smoke workflow `40332727179` passed against the
  exact deployed immutable commit `83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c`.
  The workflow verified the release revision before running its read-only
  multi-workspace authentication, tenant-boundary, revoked-key, and health
  checks.
- [x] Redacted evidence artifact `production-auth-smoke-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c`
  (`12655396002`) is retained by GitHub Actions.
- [ ] This closes current-release authenticated smoke evidence only. It does
  not close sustained freshness, backup/PITR, privacy acceptance, lifecycle
  UAT, interoperability, or release-owner gates.

## 2026-10-26 bounded custom dashboard ranges

- [x] Analytics and Tool Quality now accept an explicit inclusive `from`/`to`
  ISO-date range, bounded to 1–90 days, while preserving the existing 7/30/90
  day presets. Queries apply an exclusive upper bound so a selected end date
  is complete without leaking adjacent-period events.
- [x] The dashboard Custom control now submits the bounded range, preserves it
  in deep links, and keeps the existing privacy, scan-cap, and example-data
  boundaries. Invalid or overlong ranges return a clear 400 response.
- [x] Added integration coverage for accepted seven-day custom ranges and
  rejection of overlong ranges; lint, dashboard contracts, and analytics/tool
  quality integration tests pass.

## 2026-10-26 bounded alert-delivery evidence

- [x] Evidence now exposes a lazy-loaded notification-attempt table for an
  authenticated incident via the existing workspace-scoped delivery endpoint.
  It reports only bounded state, attempt number, HTTP status, and timestamps;
  destination identifiers, secrets, error text, and payloads remain hidden.
- [x] Example incidents never call the authenticated endpoint and show an
  explicit unavailable state. Loading, empty, and unavailable states remain
  visible rather than implying delivery success.
- [x] Lint, dashboard contracts, and the production build pass. This closes
  the UI gap only; it does not claim that a notification was delivered when
  the API has no corresponding attempt.

## 2026-10-26 insight evidence metadata

- [x] Analytics insight records now include bounded confidence, eligible
  volume, and per-rule threshold metadata for error, latency, advertised-vs-
  observed, and workflow-completion signals. The dashboard renders these
  fields beside the neutral observed-signal label.
- [x] Integration coverage verifies the existing action-context contract and
  the full release gate protects the new metadata shape; missing metadata
  remains explicitly “not provided.” No signal is promoted to a confirmed
  incident by this change.

## 2026-10-26 current-main release-gate verification

- [x] Current merged main `c7a36e6b2af66f3389fcf5e46c59574e53c35b43` passed
  the local full release gate: **136 suites**, including accessibility, docs
  navigation, MCP modern-client/protocol, OTLP, privacy, tenant isolation,
  SDK consumer, production-smoke contracts, and refresh-health contracts.
- [x] `npm run lint` passed and `npm run build` completed successfully,
  generating all 177 static pages and the complete API route inventory.
- [ ] These checks confirm source/build integrity only; they do not close the
  external backup/PITR, sustained-freshness, lifecycle-UAT, interoperability,
  privacy-acceptance, or release-owner gates below.

## 2026-10-26 refresh-health recovery remediation

- [x] PR #532 merged the health-triggered recovery dispatch into `main`
  (`e8b3709d2e3402d82d5f54ca1656ea41db5be554`). When the sequence report is
  warning and no worker run is active, the monitor dispatches the worker on
  `main`; an active run causes a safe skip. The worker's lease fencing and
  concurrency group remain the duplicate-work boundary.
- [x] PR #533 merged the follow-up shell-output fix (`dd4ffec664c2dceaf920cfeaec94438b757f78b6`). A live health run
  `40326279012` now renders state, reasons, sample count, and queue lag without
  shell command-substitution errors. Its evidence remained warning because the
  historical sample set had 3 stale runs and 7 cadence breaches.
- [x] The recovery dispatch created worker run `40326311792`, which completed
  successfully. This proves remediation is wired and bounded; it does not
  convert the historical warning into sustained-SLO evidence.
- [x] PR #535 (`037cc231664b1359629cab55f36b6b41b8c4f626`) added a 20-minute
  cooldown based on the latest completed worker run, preventing repeated
  dispatches while historical warning samples remain in the report window.

## 2026-10-26 current merged-baseline deployment reconciliation

- [x] Main merge commit `d338544b535132aa6f1c0cb8fc6174654f9bf28f` is deployed
  and verified by App Runner workflow `40313575422`.
- [x] Deployment artifacts are retained: production smoke
  `production-smoke-d338544b535132aa6f1c0cb8fc6174654f9bf28f`, runtime flags
  `runtime-flags-d338544b535132aa6f1c0cb8fc6174654f9bf28f`, and host
  `app-runner-host-d338544b535132aa6f1c0cb8fc6174654f9bf28f`.
- [x] Authenticated production smoke workflow `40314461586` passed for the
  same SHA and uploaded
  `production-auth-smoke-d338544b535132aa6f1c0cb8fc6174654f9bf28f`.
- [ ] Worker freshness, credentialed mutation lifecycle, ingest/dashboard UAT,
  RLS postflight, backup/PITR, and release-owner approval remain open.

## 2026-10-26 fresh worker-health evidence

- [x] Read-only health workflow `40318183263` completed successfully and
  retained artifact `refresh-worker-health-40318183263` (`12648235538`).
- [x] The report contains 8 samples (minimum 3), 284 total processed rows,
  3 stale runs, 1 historical failure, 7 cadence breaches, and maximum queue
  lag of `13232020 ms` against the `900000 ms` freshness budget.
- [ ] The current state remains `warning` with reasons
  `worker_failures_observed`, `freshness_budget_exceeded`, and
  `schedule_cadence_gap`; this is current evidence that the worker path is
  functional but not within the pilot freshness SLO.

## 2026-10-26 key-lifecycle gate preflight

- [x] Write-gated lifecycle workflow `40318987100` completed successfully.
  Checkout, dependency installation, and the safety preflight all passed.
- [x] The lifecycle mutation step was explicitly skipped because the four
  dedicated disposable lifecycle secrets are not configured; no key was
  created, rotated, or revoked and no production mutation occurred.
- [ ] Key create/rotate/revoke remains an external credential gate. The
  successful workflow is preflight evidence only, not lifecycle UAT.

## 2026-10-26 disposable first-ingest production UAT

- [x] The guarded first-ingest workflow `40316460050` sent exactly one bounded
  metadata-only event through `https://app.trackmcp.com` using the configured
  disposable connection key and received the expected accepted-ingest result.
- [x] The follow-up key-status check returned HTTP 200 with
  `accepted_telemetry=true`; redacted artifact `12647117310`
  (`production-ingest-b61aa69459102bdf7a0bd11413c983e03233f351`) is retained.
- [x] This closes the transport-acceptance/first-ingest UAT gate. It does not
  claim CLI activation, business-workflow completion, key create/rotate/revoke,
  dashboard mutation, or durable worker freshness.

## 2026-10-26 authenticated dashboard browser UAT

- [x] The authenticated production dashboard was inspected across Overview,
  The journey, What they're doing, Did it work, What's broken, Resources &
  prompts, Who's using it, Evidence, and Setup. Every navigation control
  reached the intended view and rendered a titled, data-bound surface.
- [x] Setup exposed the TypeScript/Python/Go/.NET connection paths, the
  OpenTelemetry guide CTA, scoped-key controls, resolver documentation, and
  privacy/data-control disclosures. The page clearly separated telemetry
  verification from unresolved identity and did not present labels as customer
  identity or deployment health.
- [x] Dashboard surfaces preserved the evidence boundary: insufficient volume
  remained `N/A`/insufficient data, synthetic regression rows were labeled test
  evidence, unknown outcomes stayed unknown, and resolver-linked account counts
  remained zero when no verified resolver identity was supplied.
- [x] Resources/prompts and Evidence views rendered bounded method/hash/session
  evidence without raw resource contents, prompt arguments, or payloads. The
  browser UAT was read-only; no key, workspace, incident, or telemetry mutation
  was performed.
- [ ] This validates navigation and privacy-safe presentation only; it does not
  close write-gated key lifecycle, worker freshness, or release-owner gates.

## 2026-10-26 merged-baseline deployment reconciliation

- [x] Main merge commit `6582c90292fc817696110af32f08eb3d73e3e6b2` is deployed
  and verified by App Runner workflow `40311703574`.
- [x] Deployment artifacts are retained: production smoke
  `production-smoke-6582c90292fc817696110af32f08eb3d73e3e6b2`, runtime flags
  `runtime-flags-6582c90292fc817696110af32f08eb3d73e3e6b2`, and host
  `app-runner-host-6582c90292fc817696110af32f08eb3d73e3e6b2`.
- [x] Authenticated production smoke workflow `40312678592` passed for the
  same SHA and uploaded
  `production-auth-smoke-6582c90292fc817696110af32f08eb3d73e3e6b2`.
- [ ] Worker freshness, credentialed mutation lifecycle, ingest/dashboard UAT,
  RLS postflight, backup/PITR, and release-owner approval remain open.

## 2026-10-26 current mainline deployment reconciliation

- [x] Main commit `4e0f5f017cae40524ff95eb28f2b394a16394c81` is deployed and
  verified by App Runner workflow `40309832613`.
- [x] Deployment artifacts are retained: production smoke
  `production-smoke-4e0f5f017cae40524ff95eb28f2b394a16394c81`, runtime flags
  `runtime-flags-4e0f5f017cae40524ff95eb28f2b394a16394c81`, and host
  `app-runner-host-4e0f5f017cae40524ff95eb28f2b394a16394c81`.
- [x] Authenticated production smoke workflow `40310764833` passed for the
  same SHA and uploaded `production-auth-smoke-4e0f5f017cae40524ff95eb28f2b394a16394c81`.
- [ ] Worker freshness, credentialed mutation lifecycle, ingest/dashboard UAT,
  RLS postflight, backup/PITR, and release-owner approval remain open.

## 2026-10-26 latest deployment and authenticated smoke checkpoint

- [x] App Runner workflow `40307943718` deployed immutable main commit
  `084a8e4d0165231f9998441c0e9d2611771a937d` successfully. The release gate,
  image binding, rollout/readiness, and runtime identity checks passed.
- [x] Deployment artifacts are retained: production smoke
  `production-smoke-084a8e4d0165231f9998441c0e9d2611771a937d`, runtime flags
  `runtime-flags-084a8e4d0165231f9998441c0e9d2611771a937d`, and host
  `app-runner-host-084a8e4d0165231f9998441c0e9d2611771a937d`.
- [x] Authenticated production smoke workflow `40308933496` passed for the
  same SHA and uploaded the redacted artifact
  `production-auth-smoke-084a8e4d0165231f9998441c0e9d2611771a937d`.
- [ ] Worker freshness, credentialed mutation lifecycle, ingest/dashboard UAT,
  RLS postflight, backup/PITR, and release-owner approval remain open.

## 2026-10-26 latest deployment reconciliation

- [x] App Runner workflow `40306329673` deployed immutable main commit
  `c5168990486d3ab021ac44806ffcf9fcac155452` successfully. The release gate,
  image binding, rollout/readiness, and runtime identity checks all passed.
- [x] The deployment uploaded production smoke artifact
  `production-smoke-c5168990486d3ab021ac44806ffcf9fcac155452`, runtime-flags
  artifact `runtime-flags-c5168990486d3ab021ac44806ffcf9fcac155452`, and host
  artifact `app-runner-host-c5168990486d3ab021ac44806ffcf9fcac155452`.
- [ ] This is deployment evidence only; the worker freshness warning,
  credentialed mutation lifecycle, ingest/dashboard UAT, RLS postflight,
  backup/PITR, and release-owner gates remain open.

## 2026-10-26 latest production baseline checkpoint

- [x] App Runner workflow `40304415330` deployed immutable main commit
  `91ae22ace4f424434559876cc0655b87f66358b8` successfully. The deployment
  passed its release gate, image binding, rollout/readiness, and runtime
  identity checks.
- [x] Authenticated production smoke workflow `40305404773` completed
  successfully for the same deployed SHA and uploaded the redacted artifact
  `production-auth-smoke-91ae22ace4f424434559876cc0655b87f66358b8`.
- [ ] This confirms the current deployed baseline and read-only authenticated
  scope only; worker freshness, key mutation lifecycle, ingest UAT, dashboard
  mutation, RLS postflight, and final pilot-owner gates remain open.

## 2026-10-26 credentialed read-only scope UAT checkpoint

- [x] The guarded local production smoke passed all 37 read-only checks against
  `https://app.trackmcp.com` using two operator-supplied workspace fixtures and
  one revoked-key fixture. It verified both key-status responses, resistance to
  conflicting workspace query parameters, all 12 Founder OS v2 read models,
  the legacy analytics/tool-quality/traces surfaces, API-key Action Queue
  denials, and revoked-key rejection.
- [x] The smoke recursively inspected response keys for forbidden credential,
  authorization, email, prompt-argument, and resource-content fields. The
  report contained only labels, status codes, boolean scope/privacy markers,
  and caveats; no keys, workspace IDs, response bodies, or authorization data
  were written.
- [ ] This closes current production read-only tenant-scope evidence only. It
  does not close key create/rotate/revoke, ingest, dashboard mutation, RLS
  postflight, cross-transport traffic, or worker-freshness gates.

## 2026-10-26 reference-handoff deployment and freshness checkpoint

- [x] PR #515 merged as `e395566642351064ec889382faff75eeb6dc5920` after the
  hosted web/JavaScript, Go, and .NET checks passed. App Runner workflow
  `40302484936` completed successfully for the same immutable SHA; production
  smoke artifact `12641347456`, runtime-flags artifact `12641511404`, and host
  artifact `12642195140` were uploaded.
- [x] The deployed runtime includes the REST API, configuration, MCP protocol,
  and Authentication/OAuth documentation handoffs. Their contracts passed,
  the 177-route build passed, and the full 136-suite release gate passed
  locally and in hosted CI.
- [x] Read-only refresh-health workflow `40303459268` completed successfully
  and uploaded `refresh-worker-health-40303459268`. The report contained 8
  samples, 3 stale runs, 1 historical failure, 7 cadence breaches, and a
  maximum queue lag of `13232020 ms` versus the `900000 ms` pilot budget.
- [ ] The health report is an explicit `warning` with reasons
  `worker_failures_observed`, `freshness_budget_exceeded`, and
  `schedule_cadence_gap`; sustained worker freshness remains open. This
  evidence must not be converted into a pilot-ready claim.

## 2026-10-26 complete documentation-reference handoff checkpoint

- [x] REST API, configuration, MCP protocol, and authentication guides now
  expose the same direct Dashboard → Setup handoff already available in the
  SDK guides. Each reference page also links to the most relevant next
  integration guide, with pointer and keyboard-focus affordances.
- [x] Documentation navigation coverage now asserts all SDK, integration, and
  reference handoffs. The focused docs contract passed 7 tests, lint passed,
  the 177-route production build passed, and the full release gate passed 136
  suites locally.
- [x] PR #514 merged as `fdf8e1c0ea189eca55e271b175bb9f0d9d1361bb` after the
  hosted web/JavaScript, Go, and .NET checks passed. App Runner workflow
  `40300598145` completed successfully for the same immutable SHA; production
  smoke artifact `12639529526`, runtime-flags artifact `12640422617`, and host
  artifact `12640622041` were uploaded.
- [ ] This closes documentation handoff coverage only. Pilot-owner approval,
  backup/PITR, privacy-acceptance, credentialed lifecycle/UAT, and sustained
  worker-freshness gates remain open and are not inferred from this deployment.

## 2026-10-26 refresh-worker sequence monitor rerun

- [x] Read-only monitor workflow `40282559365` completed successfully and
  collected eight bounded scheduled-worker summaries. It classified the
  sequence as `warning`, with 3 stale runs, 1 historical worker failure, 7
  cadence breaches, and maximum queue lag `13232020 ms` against the
  `900000 ms` pilot freshness budget. The sequence processed 284 jobs in the
  retained samples.
- [ ] Sustained worker freshness SLO remains open. This monitor evidence is
  intentionally not converted into a healthy or pilot-ready claim.

## 2026-10-26 current-release authenticated scope smoke

- [x] Workflow `40280160295` ran against `https://app.trackmcp.com` with the
  deployed release SHA `be9638965383841ee7579ae9155c0162bb626495` and completed
  successfully. Its redacted artifact
  `production-auth-smoke-be9638965383841ee7579ae9155c0162bb626495` contains 37
  checks covering two workspace key-status responses, conflicting-workspace
  resistance, all Founder OS v2 and legacy analytics read models, API-key Action
  Queue denials, and revoked-key rejection.
- [x] The artifact contains no keys, workspace IDs, response bodies, or event
  payloads. This closes current-release read-only tenant-scope evidence; ingest,
  key lifecycle mutation, dashboard mutation, and worker-SLO evidence remain
  separate gates.

## 2026-10-26 current-release first-ingest smoke

- [x] Guarded workflow `40281259523` completed successfully after one
  transient origin `503` on its initial attempt and a failed-job rerun. The
  successful redacted artifact `production-ingest-2565241f2e82992555979961ad9f3af6cfd073a5`
  recorded HTTP 200 with exactly one bounded metadata-only event accepted and
  a subsequent HTTP 200 key-status response with `accepted_telemetry=true`.
- [x] The artifact contains no key, event ID, workspace ID, response body, or
  authorization material. This closes current-release transport acceptance and
  first-ingest milestone evidence; it does not claim business-workflow
  completion, CLI activation, or key rotation/revocation.

## 2026-10-26 current key-lifecycle preflight

- [x] Guarded workflow `40282004222` completed successfully through its
  preflight and correctly skipped all mutations because the repository is
  missing `TRACKMCP_LIFECYCLE_COOKIE`, `TRACKMCP_LIFECYCLE_WORKSPACE_ID`,
  `TRACKMCP_LIFECYCLE_KEY_ID`, and `TRACKMCP_LIFECYCLE_KEY`.
- [ ] Disposable create/use/rotate/revoke execution remains an external
  operator-secret gate. No production key was created, rotated, revoked, or
  written to artifacts by this run.

## 2026-10-26 cross-language capability deployment

- [x] The deployment evidence reconciliation was squash-merged to `main` as
  `436fea266fd68247070926a1bf49241b13f6293f` in PR #495. This is a
  documentation-only merge; the deployed application remains the exact
  `be9638965383841ee7579ae9155c0162bb626495` runtime recorded below.

- [x] App Runner workflow `40277566836` deployed merged cross-language
  capability metadata commit `be9638965383841ee7579ae9155c0162bb626495`.
  The rollout, immutable runtime identity, and direct-origin read-only smoke
  all completed successfully.
- [x] The redacted production smoke recorded 34 of 36 checks executed, with
  the two credentialed checks intentionally skipped because no production key
  was supplied. Image digest:
  `sha256:d5690f12b753039d71c40ac4b91e274a415db16b9c8f8a7549501ba051e71e61`.
  Runtime flags were `rate_limit_mode=supabase` and `fact_writes=false`.
- [ ] Credentialed cross-language roots/logging traffic UAT remains open; the
  deployment proves source/runtime identity and public boundaries, not customer
  traffic observation.

## 2026-10-26 roots/logging parity deployment

- [x] App Runner deployment workflow `40275821152` deployed merged SDK parity
  commit `4821843345aa19c2520f302fc03be27153326d14` successfully. The
  redacted direct-origin smoke executed 34 of 36 checks and verified the
  immutable runtime identity, public docs, security headers, claim boundaries,
  registry metadata, and unauthenticated API boundaries.
- [x] The deployment artifact recorded image digest
  `sha256:0443fab8186a887382ce8fa45d0dec003620e98b7b78b0d2f919ce67247b352c`.
  Two credentialed checks were intentionally skipped because no production key
  was supplied.
- [ ] Credentialed roots/logging transport UAT remains open; local capability
  fixtures and deployed source do not prove customer traffic observed those
  protocol families.

## 2026-10-26 merged-main deployment verification

- [x] Manual deployment workflow `40272787491` deployed immutable main
  `a27dd42540218ea7f8610a563a4770059f7b72d0` to App Runner and completed
  successfully. The workflow passed the release gate, image digest binding,
  App Runner rollout/readiness, and runtime identity check.
- [x] The redacted production smoke artifact
  `production-smoke-a27dd42540218ea7f8610a563a4770059f7b72d0` records 34 of
  36 checks executed successfully against the direct App Runner origin. It
  verified the public docs/routes, security headers, immutable `release_sha`,
  public claim boundaries, sitemap, registry metadata, and unauthenticated
  authorization boundaries. Two credentialed checks were intentionally skipped
  because no production key was supplied.
- [x] The deployed image digest was recorded as
  `sha256:4cd908fa256f82c93259b3b8c0e81a59be9f43d1c7903c913eaaa66b89aeb0ab`.
  Runtime flags reported `TRACKMCP_RATE_LIMIT_MODE=supabase` and
  `TRACKMCP_ENABLE_FACT_WRITES=false`.
- [ ] Credentialed CLI activation, key rotation/revocation, authenticated
  dashboard UAT, and sustained worker freshness remain separate open gates;
  this deployment evidence does not claim them complete.

## 2026-10-26 cross-language SDK roots/logging parity checkpoint

- [x] TypeScript, Python, Go, and .NET SDK surfaces now classify `roots/*` and
  `logging/*` protocol methods as bounded metadata-only families. Python now
  avoids its generic response payload path for these methods; all four SDKs
  omit root paths, log levels/messages, and response bodies.
- [x] Added regression coverage for family classification and privacy behavior;
  TypeScript SDK tests passed 98/98 and Python client tests passed 30/30.
  The complete web release gate also passed locally.
- [x] The coordinated SDK train was published by workflow `40271909727` after
  the registry preflight and provenance steps. Go and .NET runtime checks are
  green in hosted CI; authenticated production transport UAT
  remains an external evidence gate.

## 2026-10-26 Python wrapper roots/logging privacy checkpoint

- [x] Closed the legacy `with_trackmcp` wrapper fall-through that could have
  serialized `roots/list` or `logging/setLevel` response values. Both the
  official middleware and wrapper now use the same bounded protocol metadata
  event for these families, including failed calls.
- [x] Python SDK tests passed 34/34 with a wrapper-level regression asserting
  that root URIs and log levels are absent from queued telemetry.
- [ ] Cross-transport authenticated production UAT remains an external gate;
  coordinated package publication is closed by workflow `40271909727`.

## 2026-10-26 roots and logging protocol-family coverage

- [x] Added bounded `roots` and `logging` protocol families to semantic
  classification, explicit capability-name mapping, durable-fact analytics,
  and the authenticated v2 protocol-activity projection.
- [x] Added privacy-safe route fixtures and semantic tests. Root paths, log
  messages, and arbitrary level payloads remain outside the product boundary.
- [x] Updated the protocol matrix and public protocol guide to keep these
  families visibly partial until runtime fixtures and authenticated production
  evidence exist; observed traffic is not treated as capability support.

## 2026-10-26 roots/logging capability-advertisement parity

- [x] Added TypeScript and Python initialize-response fixtures proving that
  advertised `roots` and `logging` capabilities are recorded as bounded,
  sorted capability names only; capability option values, root URIs, log
  levels, and arbitrary payload fields remain outside telemetry.
- [x] Python now projects the same bounded `capability_names` metadata as the
  TypeScript adapter. Focused SDK tests, Python client tests, the protocol
  matrix contract, and the complete 136-suite release gate passed.
- [ ] Authenticated production UAT remains required before claiming observed
  roots or logging availability in customer-facing readiness evidence.

## 2026-10-26 first-ingest UAT automation

- [x] Added a manually dispatched, trusted-host-only first-ingest smoke that
  sends exactly one bounded metadata-only event with an explicitly supplied
  disposable connection key and verifies the authenticated `accepted_telemetry`
  milestone through key status.
- [x] Added redacted-report, confirmation-token, secret-gated workflow, and
  contract coverage. The workflow never runs automatically and never writes
  credentials, event bodies, workspace identifiers, or response payloads to
  artifacts.
- [x] A local operator run used an existing disposable scoped test key against
  `https://app.trackmcp.com` at `2026-10-26T05:05:09Z`. The bounded event was
  accepted with HTTP 200 and key-status returned HTTP 200 with
  `accepted_telemetry=true`. The redacted report was written to
  `/tmp/trackmcp-production-ingest-smoke-local.json`; no key, workspace ID,
  event body, or response body was retained.
- [x] GitHub workflow `40272543094` then ran against the same trusted origin
  using the encrypted repository secret and completed successfully. Its redacted
  artifact `production-ingest-a96a0b8f90ea65dab414a6473ab3969d7f35ebbe` records
  the same two HTTP 200 checks and contains no key, workspace ID, event body, or
  response body. This closes the first-ingest workflow evidence gate.
- [ ] First-ingest acceptance still does not prove CLI activation, dashboard
  read-model freshness, or business-workflow completion.

## 2026-10-26 first-ingest UAT automation

- [x] Added a manually dispatched, trusted-host-only first-ingest smoke that
  sends exactly one bounded metadata-only event with an explicitly supplied
  disposable connection key and verifies the authenticated `accepted_telemetry`
  milestone through key status.
- [x] Added redacted-report, confirmation-token, secret-gated workflow, and
  contract coverage. The workflow never runs automatically and never writes
  credentials, event bodies, workspace identifiers, or response payloads to
  artifacts.
- [ ] Production evidence remains open until `TRACKMCP_INGEST_SMOKE_KEY` is
  configured and the manual smoke completes against the deployed origin.

## 2026-10-27 API-key last-use production postflight

- [x] Read-only production SQL inspection confirmed the additive
  `trackmcp_api_keys.last_used_at` migration is present. The metadata summary
  contained 75 key rows, 3 rows with a recorded accepted use, and latest use
  at `2026-10-27 11:47:09 UTC`. The query selected counts/timestamp only and
  did not read key material, workspace identifiers, or event payloads.
- [x] This closes schema/runtime evidence for the dashboard's bounded last-use
  indicator. It does not close the separate first-ingest workflow, backup,
  privacy-acceptance, or final pilot GO gates.
- [x] The same read-only postflight confirmed `trackmcp_api_keys` has
  `relrowsecurity=true`, `relforcerowsecurity=false`, and zero browser-role
  policies. This preserves the service-role-only access boundary; no row data
  or secret material was selected.

## 2026-10-27 Supabase recovery-posture inspection

- [x] Signed-in production provider inspection confirmed Scheduled Backups
  explicitly reports that the Free Plan does not include project backups.
  Point-in-Time Recovery likewise reports that it is a Pro-plan add-on. No
  scheduled restore point, PITR window, or completed restoration rehearsal is
  available on the current tier.
- [ ] Queue item `157` remains open as an infrastructure-owner decision: the
  pilot must either fund/configure a reviewed backup and restoration posture or
  explicitly accept this limitation with an owner and recovery plan.

## 2026-10-26 final local release-gate rerun

- [x] The current main checkout passed the complete `npm run
  test:release-gate` with 134 suites passing. The gate includes accessibility
  pointer affordances, docs navigation/version parity, tenant isolation,
  Founder OS v2 read models, OTLP JSON/protobuf, transport observers, package
  consumer tests, key/device flows, worker health, and release workflow
  contracts.
- [x] The AWS IAM console visibly confirms the resource-scoped policy
  `TrackMCPEnableDistributedRateLimit` is created and attached to
  `GitHubActionsDeployRole`. This is deployment plumbing evidence only; it is
  not a substitute for production lifecycle secrets or sustained SLO evidence.
- [x] Disposable production first-ingest transport evidence now exists from
  the local trusted-host smoke: one metadata-only event was accepted and the
  key-status milestone was observed. This is narrower than the workflow and
  full activation/dashboard UAT.
- [x] The GitHub workflow secret path is now verified by workflow `40272543094`
  and its redacted artifact.
- [ ] CLI activation, key lifecycle, and authenticated dashboard/UAT evidence
  remain open; no key was written to the repository or ledger.

## 2026-10-26 refresh-worker freshness alerting

- [x] The scheduled refresh workflow now writes a bounded `freshness_alert`
  (`warning` when queue lag exceeds the 15-minute pilot budget, otherwise
  `none`) into its redacted summary and publishes a GitHub step summary with
  freshness, lag, processed, and failed counts. Stale work emits a visible
  workflow warning without turning a safely drainable run into a false worker
  failure.
- [x] The workflow contract test covers the alert field, step summary, and
  warning path. Lint, the 177-route production build, and the full 134-suite
  release gate passed locally.
- [ ] Repeated scheduled runs within the freshness budget are still required
  before claiming a sustained production SLO; alerting implementation does not
  substitute for that operational evidence.

Post-merge worker run `40264019728` on `1ee7e3e` completed successfully and
processed 8 jobs with 8 successes, zero retryable/failed results, and no
timeouts. Its redacted artifact reported `max_queue_lag_ms=1522126`,
`freshness_slo=stale`, and `freshness_alert=warning`, confirming the new alert
path is exercised in production. The measured lag is still outside the
15-minute pilot budget, so the sustained freshness gate remains open.

## 2026-10-26 refresh-worker sequence monitor

- [x] Added a read-only scheduled health monitor that downloads only the
  existing redacted worker artifacts, evaluates up to eight recent scheduled
  runs, requires three samples before claiming health, and reports bounded
  cadence/freshness/failure reasons. It never calls the worker endpoint and
  never reads the refresh secret.
- [x] Added contract and fixture coverage for insufficient data, healthy
  repeated runs, stale/failure/cadence warnings, artifact bounds, and the
  warning/step-summary workflow path. The monitor intentionally warns rather
  than turning insufficient or stale evidence into a false product outage.
- [ ] The monitor is now capable of proving a sustained SLO, but that proof
  still requires three subsequent scheduled runs with in-budget observations.

The first real monitor run `40266407743` completed successfully against main
`59b7c1435358fbd6c00dce5bcb338089af49c310`. It collected eight scheduled
artifacts and correctly classified the sequence as `warning`: one historical
worker failure, two stale freshness samples, seven cadence gaps, and a maximum
queue lag of `13232020 ms`. This is now stronger operational evidence that the
worker is being observed, while also confirming the sustained SLO is not yet
met.

## 2026-10-26 release-train reconciliation

The historical package-policy checkpoints below intentionally preserve their
original snapshots. The current release truth is the coordinated train from PR
#463: `@trackmcp/sdk@0.1.18`, `@trackmcp/cli@0.1.9`, and `trackmcp==0.1.11`
were published and registry-verified with immutable checksums. No additional
package publication is required for the refresh-alert or ledger-only changes.

## 2026-10-26 cross-language transport reconnect observer

PR #434 (`27722fdd91f9c3afbf5026308c39d8ca13edea07`) adds bounded
caller-observed `session_reconnected` lifecycle evidence to the Go and .NET
SDKs. The signal is transport-labeled only when the caller verifies the label,
rejects unknown labels, clamps duration, and never accepts payloads, URLs,
headers, exception text, replay, or delivery claims. Hosted Go/.NET/web run
`40240971745` passed; local release gate, lint, and the 177-route build passed.
This improves cross-language observer parity but does not close
transport-owned reconnect policy or production disconnect UAT.
Owner: Codex engineering execution
Pilot target: 100 customers

## 2026-10-26 authenticated production scope smoke

- [x] Authenticated production workflow `40260222918` ran against
  `https://trackmcp.com` at immutable release SHA
  `c49217d91a4e36703e62cbf6eec73b7392f29222`. Two disposable workspace keys
  returned HTTP 200 from key-status and every Founder OS v2 and legacy
  analytics read model returned its authenticated workspace envelope.
  Conflicting workspace query parameters were ignored; API-key Action Queue
  mutations returned HTTP 403; the revoked-key check returned HTTP 401. The
  redacted workflow artifact contains 37 checks and no keys, workspace IDs, or
  response bodies.
- [ ] This closes the read-only authenticated scope/tenant-isolation smoke, but
  does not claim first-ingest, CLI activation, key lifecycle, worker,
  rollback, or load/SLO evidence. Those gates remain separate.

## 2026-10-26 key-lifecycle workflow readiness

- [x] Write-gated workflow `40261231124` reached terminal success and evaluated
  its safety preflight.
- [ ] The disposable rotation/revocation smoke was intentionally skipped
  because GitHub lacks `TRACKMCP_LIFECYCLE_COOKIE`,
  `TRACKMCP_LIFECYCLE_WORKSPACE_ID`, `TRACKMCP_LIFECYCLE_KEY_ID`, and
  `TRACKMCP_LIFECYCLE_KEY`. No production mutation occurred. This remains an
  operator-secret gate, not evidence of lifecycle completion.

## 2026-10-26 refresh-worker backlog observation

- [x] Refresh workflow `40261716029` ran five concurrent bounded batches and
  processed 28 jobs: 28 succeeded, 0 retryable, 0 failed, 0 timeouts, and
  maximum attempt count 1. The redacted artifact measured
  `max_queue_lag_ms=6058024` (about 101 minutes), so the 15-minute freshness
  budget was correctly classified as `stale`.
- [x] A second bounded run `40261789193` immediately afterward processed 0
  jobs and observed `freshness_slo=no_backlog_observed`. This demonstrates the
  first result was a drainable backlog rather than a persistent worker failure;
  sustained cadence evidence and alerting thresholds remain open.

This ledger is the operational source of truth for the autonomous readiness goal. It is updated when work is implemented, verified, submitted for review, merged, deployed, or found to be incomplete. A checked item means that the stated evidence exists; it does not mean that an adjacent item is complete.

## 2026-10-26 refresh-worker freshness observations

The merged freshness-classification workflow was exercised in run
`40240145632` against main commit `3d554015f16384df86d1caef33648c8b30576676`.
It processed 4 jobs with 4 successes, zero retries/failures/timeouts, and
observed `max_queue_lag_ms=654339` (about 10.9 minutes). The redacted artifact
now records `freshness_budget_ms=900000` and `freshness_slo=within_budget`.
This is a within-budget scheduled observation, not proof of a sustained SLO;
the ledger continues to require repeated scheduled evidence.

Three serialized worker runs completed successfully against the current
identity-verified service. Run `40238996179` processed 16 jobs with 16
successes, zero retryable/failed results, no timeout, and a maximum queue lag
of `3,269,482 ms` (about 54.5 minutes). Follow-up runs `40239039859` and
`40239080954` each completed five bounded batches with zero queued work,
zero retryable/failed results, no timeout, and `max_queue_lag_ms=0`. This
proves safe drain and recovery to an empty observed queue, but only the first
observation is a non-empty backlog sample; continuous scheduled freshness SLO
remains open until repeated scheduled observations are within the pilot target.

## 2026-10-26 distributed-rate-limit reconciliation

Distributed multi-instance rate limiting is now enabled for the verified pilot
service. The guarded workflow completed after a resource-scoped IAM policy was
applied, and its postflight verified `TRACKMCP_RATE_LIMIT_MODE=supabase` live.
The supported fallback remains process-local when distributed mode is unset or
unavailable; neither mode is presented as stronger than its evidence.

PR #405 recorded the final IAM shape and live workflow evidence. The later
readiness-ledger reconciliations merged through the terminal PR flow; hosted
checks passed and the current checkout passed lint, the 176-route production
build, and the complete 134-suite release gate. Immutable deployed SHAs remain
in the release record, while this operational ledger stays branch-relative.
These checks do not close the remaining backup/restore and release-owner
decision gates.

The credentialless production pilot smoke was rerun on 2026-10-25 and passed
all 35 checks. A subsequent authenticated read-only invocation using the
ignored disposable smoke inputs passed **36 checks**, including unauthenticated
and revoked-key rejection plus accepted key-status scope; its redacted report
is `/tmp/trackmcp-production-smoke-auth-current.json`. The run had
`write_enabled=false`, so no key or write mutation was attempted. A transient
network failure on the first invocation is retained in the handoff ledger as a
recovered observation, not as a passing result.

## Current status

| Area | Status | Evidence / next gate |
| --- | --- | --- |
| Founder OS specification audit | In progress | PDF/DOCX requirements extracted; tab/data contract reconciliation continues; MCP tester and authenticated production smoke now cover the bounded resource-template/read-model contract |
| Tab 1 — Who's using it | Implemented; authenticated smoke verified | Live and example read models, privacy caveats, account-unavailable state; authenticated production smoke run `40169807874` passed against the deployed release. |
| Tab 2 — What they're doing | Implemented; authenticated smoke verified | Leaderboard, adoption, trend, reliability, detail, descriptions; authenticated production smoke run `40169807874` passed against the deployed release. |
| Tab 3 — Resources & Prompts | Implemented and production-verified | Live dashboard verified bounded resource/prompt methods, explicit interaction outcomes, hash-only entities, durable-read counts, and no raw contents/arguments; template discovery remains separately bounded and no-expansion |
| Tab 4 — Journey | Implemented and production-verified | Live dashboard verified bounded interactions, no invented multi-step paths, explicit retry/input boundaries, no abandonment inference, task-state caveats, and cross-server correlation limits |
| Tab 5 — Did it work | Implemented and production-verified | Live dashboard renders bounded outcome evidence, explicit `N/A` completion when no workflow terminal exists, zero invented task states, and the minimum-volume/correlation caveats |
| Tab 6 — What's broken | Implemented and production-verified with synthetic evidence labeled | Live dashboard renders bounded reliability incidents, separates critical from insufficient-data rows, and labels all retained canary rows as synthetic test evidence rather than customer failures |
| Example/live data parity | Merged and deployed | PR #57 merged; all Founder OS read models now have bounded example fixtures |
| Privacy and tenant isolation | Verified locally | Privacy review, tenant isolation, security headers, accessibility contracts pass |
| CI/CD deployment | Verified | PRs #58–#61 repaired the release gate, ECR digest verification, opaque App Runner IDs, and hostname normalization; PRs #64–#65 added and rendered safe MCP resource-template discovery; PR #67 routes scheduled cleanup through App Runner using AWS OIDC; PR #69 adds authenticated Founder OS read-model smoke coverage; PR #80 adds a SHA-only `deploy_ref` path for rollback rehearsal; PR #308 adds Python runtime privacy smoke parity; PRs #310–#311 bind authenticated UAT to an immutable SHA and trusted production host |
| Production deployment | Verified for current release | App Runner run `40131685736` deployed merged main `aecbe2e80ca237cb2a61340c7199f069587bdb39`; restoration run `40170901810` re-deployed the same immutable application revision after rollback rehearsal and passed release gate, image-digest, readiness, HTTPS/read-only smoke, runtime-safety, and evidence upload |
| Bounded production load | Passed at pilot budget | Direct App Runner run on 2026-10-20: 120 requests at concurrency 8 across 9 authenticated read models plus ingest, 120/120 successful, zero errors/timeouts, tenant isolation passed, p95 2.11s against a 3s pilot budget; two disposable workspaces were deleted and verified absent |
| Refresh worker | Five-slice transport and freshness checkpoint verified; three serialized recovery runs passed after the transient failure, while continuous scheduled SLO monitoring remains open | PRs #109, #111, #112, #114, #123–#130 are merged. Trusted-main run `39494080043` processed five bounded slices (`39`, `37`, `42`, `38`, `39`) with zero retryable/failed results; postflight observed `0` queued, `0` running, `0` retryable, and no oldest queued job. Scheduled run `40169356835` failed with five unparseable responses and no processed work; recovery runs `40171850037`, `40171999599`, and `40172003995` on current main all completed successfully. Treat the failure as a recovered transient availability signal, keep scheduled monitoring open, and do not claim a continuous SLO from manual dispatches alone. |
| Supabase production schema | Additive pilot migration applied | `trackmcp_catalog_entity_reads` was missing in production; the reviewed additive migration was applied, then verified present with RLS enabled and anon/authenticated `SELECT` denied |

### Progress calculation

The readiness percentage is based on 10 gates, not lines of code:

1. Requirements and claims reconciled
2. Tab 1 complete and verified
3. Tab 2 complete and verified
4. Tabs 3–6 complete and verified
5. Example/live data parity
6. Ingestion and analytics correctness
7. Privacy, tenant isolation, and security
8. CI/CD and deployment
9. Production smoke/load/rollback evidence
10. Pilot operations and documentation

Engineering evidence is complete for the deployed application path, bounded load/rollback, five-slice refresh checkpoint, all six Founder OS tabs, privacy/retention boundaries, and the current release record. The pilot is **not marked ready by percentage**: credentialed UAT, migration/rollback ownership, repeated worker SLO observations, and explicitly partial protocol interoperability remain release-owner gates. Distributed-rate-limit IAM is now resolved and live in the production App Runner configuration, verified by guarded workflow `40220255833`. Supabase usage is monitored operationally; no current overage is inferred from this ledger, and quota headroom is not silently treated as a completed pilot gate.

The distributed-rate-limit workflow was subsequently rerun after the
resource-scoped IAM policy was applied. Run `40220255833` completed the
App Runner configuration update and postflight verification, and the
distributed mode is now claimed only for the verified production service. The
policy grants `apprunner:UpdateService` on that service and `iam:PassRole` on
the existing App Runner ECR access role; no wildcard permissions were added.

## 2026-10-24 authenticated dashboard UAT checkpoint

- [x] A direct authenticated browser inspection of `app.trackmcp.com/dashboard`
  completed for the pilot account without recording credentials, workspace IDs,
  or key values. Navigation reached Overview, Who's using it, What they're
  doing, Resources & Prompts, Journey, Did it work, What's broken, Evidence,
  and Setup; each surface rendered its intended heading/state and updated the
  dashboard URL.
- [x] Setup UAT showed the authenticated workspace envelope, first-event
  evidence, active connection-key scope, TypeScript/Python/Go/.NET selectors,
  documentation CTA, identity-resolver guidance, privacy/data-control
  disclosures, and key lifecycle controls. The observed state correctly
  described identity as unresolved and historical lag as non-health evidence.
- [ ] This manual UAT does not substitute for the automated two-workspace
  production smoke, cross-workspace negative authorization, or production key
  lifecycle run; those remain open because the repository smoke secrets are not
  configured.

## Latest checkpoint — 2026-10-20

### 2026-10-21 status check

- PR #134 (`fix: preserve legacy refresh source windows`) merged as `ab87873782ad4e2c35be7ee0590c1505a3ce370f`. The fix preserves the source ingest window for legacy job keys that include a 64-character batch fingerprint; the refresh regression suite is 41/41 passing, and the merged commit passed CI, App Runner deployment `39500357494`, production smoke, and trusted-main worker dispatch `39501400942`.
- The production dashboard’s protocol cards were reconciled against the analytics handler. `entity_count` is an observed unique count of bounded SHA-256 URI/name hashes from telemetry; `entity_analytics` is a separate durable read projection from `trackmcp_catalog_entity_reads`. A prompt hash appearing with zero durable read rows is therefore an observed prompt entity without a durable prompt-read event, not contradictory data. The UI and API caveats retain this distinction and no raw names, URIs, arguments, or contents are exposed.
- Authenticated production dashboard inspection verified Tab 1’s resolver boundary (`0` resolver-linked accounts, `12` unresolved events, explicit unknown-client activity) and exposed a Tab 2 wording defect: `2` tool-call events with missing `tool_name` were counted in activity while the feature panel said “No tool calls.” Commit `9a40b79` changes that state to “tool-call events were observed, but no capability name was reported”; the correction remains unverified in production until its release is deployed.
- Deployment run `39503253321` completed successfully for merged main `c528277afef56a84d0ba596ecfbe475914601282`. Fresh authenticated dashboard inspection now shows the corrected Tab 2 message (“2 tool-call events were observed, but no capability name was reported.”), while preserving `2` activity, `0` named capabilities, and `N/A` resolver-account breadth. This closes the wording correction in production; it does not turn unnamed events into capability identities.
- Authenticated production inspection of Tab 6 found historical `p1-05-canary-probe` rows, including two sufficient critical synthetic regressions and many insufficient-data rows. Commit `5daf9ac` adds an explicit synthetic-canary evidence banner and badge so these retained test records cannot be mistaken for customer failures; production verification of that correction remains open until deployment.
- Deployment run `39509874414` completed successfully for merged main `4dd7b80`. Fresh authenticated production inspection now confirms Tab 6 shows the synthetic-canary banner and badges on all retained canary rows; the two sufficient critical rows remain visible as test evidence and are not counted as customer health claims. This closes the Tab 6 production assertion while preserving the data-hygiene review item.
- Read-only production privacy postflight on 2026-10-21 found zero retention-dry-run candidates in `trackmcp_events`, `trackmcp_semantic_facts`, and `trackmcp_action_queue`. The privacy-request and deletion-batch tables exist; both deny `anon` and `authenticated` `SELECT`, and both deletion-batch indexes are present. No deletion request or batch was created, and destructive deletion remains closed by policy.
- PR #141 merged as `683404b`. Explicit deployment run `39512209436` then passed the release gate, image build/push, immutable App Runner rollout, readiness, HTTPS origin, and read-only production smoke for that exact merged SHA. The final release record is now tied to the deployed commit rather than an earlier application revision.
- Supabase billing/usage inspection on 2026-10-21 confirmed the Free Plan grace period ended. Current cycle usage is approximately 80% of the 1 GB log-ingestion allowance and 60% of the 5 GB egress allowance, with no current overage. The remaining log headroom is too small to silently ignore for a 100-customer pilot; this is the active go/no-go infrastructure risk.

- Fresh read-only Supabase postflight confirms the production deferred-result RPC is deployed: `trackmcp_record_refresh_job_result` accepts `deferred`, returns the job to `queued`, clears its lease, and does not manufacture a retryable failure. This validates the timeout-recovery migration at the database function-definition level, not only in source tests.
- The same fresh postflight observed `0` catalog entity-read rows, `0` privacy requests, `0` privacy deletion batches, `0` retryable refresh jobs, and `0` running refresh jobs. These are boundary/coverage facts, not proof that the corresponding pilot workflows are exercised.
- Trusted-main worker dispatch `39484307008` completed successfully on merged main `5354ed1`. The follow-up read-only queue breakdown observed `288–290` queued jobs per lane and `909–911` succeeded jobs per lane, with no retryable/running rows. The oldest queued work advanced from approximately `18:53` to `18:57` UTC, proving the worker drains successfully while ingestion replenishes the queue; the roughly 39-minute queue age at observation remains outside the pilot freshness budget, so this is throughput evidence rather than gate closure.
- After PR #124 merged the concurrent scheduler, trusted-main worker dispatch `39485402113` completed successfully on `53f02cb`. Its four concurrent calls processed `40`, `43`, `38`, and `39` jobs respectively, all succeeded with zero retryable/failed results. The follow-up queue breakdown observed `261–262` queued jobs per lane and `950–951` succeeded jobs per lane; oldest queued work advanced to approximately `19:03` UTC. Concurrency materially improved drain throughput, but the observed queue age remained roughly 35 minutes, so freshness is still an open pilot gate.
- After PR #125 deployed window-scoped projections and PR #126 coalesced ingest-window enqueue keys, trusted-main worker `39489952368` completed successfully on `0238a3b`. The postflight observed `236–238` queued jobs per lane and `1,122–1,124` succeeded jobs per lane; oldest queued work advanced to approximately `19:26` UTC. A subsequent eight-slice capacity experiment (`39491290384`) failed with App Runner `502` responses on all eight concurrent calls, so PR #128 restored the proven four-slice fan-out and the failure is retained as a capacity boundary. A four-slice worker remains the approved scheduler configuration; queue freshness is still open.
- With the approved four-slice configuration restored, worker `39491027524` completed successfully and the postflight observed `169–171` queued jobs per lane and `1,189–1,191` succeeded jobs per lane; oldest queued work advanced to approximately `19:35` UTC. This confirms the queue is draining faster than ingestion, but the remaining age was still outside the pilot freshness target at observation.
- Trusted-main worker run `39492040859` completed successfully on merged main `07bf8b85`. The immediate read-only Supabase postflight observed `123–126` queued jobs per lane, `1,234–1,237` succeeded jobs per lane, and no retryable/running rows. The oldest queued work was `19:48:10 UTC`; at the `20:29 UTC` observation this was approximately 41 minutes of lag. The four-slice worker is healthy and draining, but freshness remains an open pilot gate.
- A subsequent trusted-main worker cycle (`39492478510`, followed by manual dispatch `39492492773`) completed successfully through the terminal/API path. The Supabase postflight observed `47–49` queued jobs per lane with oldest queued work at approximately `19:59 UTC`; no retryable rows were present. Three active leases were still valid through approximately `20:36 UTC` while the last projection slices finished, so this observation is recorded as an in-flight drain checkpoint rather than a zero-backlog claim. The queue has materially improved but the freshness gate remains open until the active leases settle and a fresh timestamp is within the pilot budget.
- The worker logs for `39492492773` provide the throughput boundary: the four concurrent slices processed `43`, `45`, `44`, and `45` jobs respectively, all succeeded, and each stopped at the application’s bounded deadline (`aborted=true`) without retryable or failed outcomes. A later aggregate postflight at `20:35:21 UTC` observed `192` queued, `3` running, `0` retryable, with oldest queued work at `19:59:01 UTC`. This confirms the worker is safe but still under-capacity for the current ingestion rate. PR #130 (`ci: test five-slice refresh fanout`) is open as a bounded capacity probe; it will not be treated as a production improvement until CI and a trusted-main run prove five-slice stability.
- PR #130 merged as `200ff20b` after Go, .NET, and web CI checks passed. Trusted-main worker run `39494080043` then completed with five healthy bounded slices: `39`, `37`, `42`, `38`, and `39` successful jobs, with zero retryable/failed results and no 502/503 responses. The Supabase postflight at `20:42:34 UTC` observed `0` queued, `0` running, and `0` retryable jobs (`oldest_queued = NULL`). Five-slice fan-out is now the proven production scheduler configuration; freshness is closed at this checkpoint, subject to continued scheduled-run monitoring.
- Authenticated production dashboard runtime evidence after the metadata-only smoke now shows `11` source events, `resources/list` plus `resources/read`, one successful durable resource read, and a nonzero hash-only `trackmcp_catalog_entity_reads` projection. The prompt event is visible as `prompts/get` activity while the current durable prompt-entity count remains zero; the dashboard correctly keeps that absence explicit rather than inventing prompt reads. Production postflight still shows `0` queued and `0` retryable refresh jobs after the projection run `39495077228`.
- Authenticated live-tab inspection confirms Tab 5 (`Did it work`) renders `N/A` for completion with zero explicit workflow terminals, keeps pending/unknown/task states at zero, and explains the minimum-volume boundary instead of inferring success from the 12 source events. Tab 6 (`What's broken`) orders two high-confidence historical p95-latency regression incidents before insufficient-data records and labels the latter as “Not a confirmed failure”; the stale canary incidents remain an open pilot-data hygiene/review item rather than being silently discarded.
- PR #132 (`docs: record live outcome and reliability tab evidence`) merged as `47afea1` after the fresh web/JavaScript, Go, and .NET checks passed. A subsequent read-only Supabase entity postflight still reports one `resources` entity row and no `prompts` entity row; the accepted prompt activity therefore remains visible as activity without an invented durable prompt entity, and prompt-entity coverage stays open.
- The full Founder OS route/dashboard contract pass was rerun after the worker changes: People `2/2`, Capabilities `4/4`, Resources `2/2`, Prompts `2/2`, Journey `2/2`, Outcomes `2/2`, Reliability `3/3`, Action Queue `3/3`, Tasks `1/1`, and Dashboard `43/43` passed.

- At the time of this check, worker dispatch `39479147302` is actively running on merged main `ae15bb1`; its single `refresh` job is still in progress. PR #121 is open with Go and .NET checks green and the web/JavaScript gate still running. No readiness percentage is advanced until these terminal results and the next Supabase postflight are recorded.
- Worker dispatch `39479523130` was subsequently cancelled after remaining in the refresh-batch step beyond its five-minute job ceiling without a terminal GitHub update. The workflow now adds an explicit process-level `timeout` around each curl (`94afe0d`) and classifies hard-kill exit codes as bounded timeouts; this must be exercised by a fresh worker run before freshness evidence can advance.
- The first branch-dispatched exercise of the timeout fix (`39479986950`) failed before the worker step because AWS OIDC trust correctly rejected the non-main branch subject (`sts:AssumeRoleWithWebIdentity`). This is an infrastructure trust-boundary result, not application evidence; the same workflow must be exercised from the trusted release ref after PR #121 merges.
- The conflict-free branch exposed duplicate CI runs for the same SHA: push and pull-request events used different concurrency keys. Commit `b20d266` keys the CI group by commit SHA so one release gate cannot run twice for the same commit.
- Local verification pass completed while the worker ran: dashboard contract `43/43`, People `2/2`, Resources `2/2`, Prompts `2/2`, Outcomes `2/2`, Journey `2/2`, and Reliability `3/3`; these validate the shipped read-model contracts but do not replace production assertions.
- Fresh read-only Supabase production postflight observed `0` catalog entity-read rows, `0` privacy requests, `0` privacy deletion batches, `539` queued refresh jobs, and `0` retryable refresh jobs. This confirms transport/retry health but leaves freshness, entity-read coverage, and end-to-end privacy lifecycle execution open.
- After PR #121 merged as `86b4290`, trusted-main worker run `39482066332` completed successfully: AWS OIDC and App Runner resolution passed, all bounded refresh batches returned without a failed/retryable workflow result, and the follow-up read-only Supabase postflight remained `539` queued, `0` retryable, `0` entity reads, `0` privacy requests, and `0` deletion batches. This closes the release-ref worker transport check but confirms queue freshness and exercised privacy/entity coverage remain open.
- A subsequent read-only queue breakdown shows the worker is draining while ingestion replenishes all four lanes: `866` succeeded for each of `action_queue_refresh`, `catalog_entity_recompute`, `catalog_recompute`, and `fact_projection`, with `249–250` queued in each lane and no retryable state observed. Queued work spans `18:53` through `19:25` UTC, proving throughput progress but not pilot freshness; the backlog age remains outside the target budget.
- Main CI for merge `ae15bb1` passed after PR #120. The merge changed only CI/docs paths, so no App Runner deployment was triggered; the previously deployed application release remains the production runtime under evidence.
- The previous apparent hour-long `sleep` was bounded polling of remote GitHub/App Runner state, not an uncontrolled local process. Current work is active and uses short, inspectable API calls.
- PR #119 (`docs: record authenticated dashboard runtime evidence`) was merged as `7e3725a`. Its GitHub CI checks passed; the Vercel status was non-required and failed because the provider reported a deployment rate limit, not because of an application test failure.
- PR #120's original GitHub web CI jobs remained non-terminal for more than a day despite the workflow's 30-minute timeout; those stale runs were cancelled and a fresh CI run will be created from the next ledger commit. This is recorded as a CI-runner-state issue, not an application test result.
- The latest deployed main release remains healthy: App Runner deployment run `39474489090` passed production smoke. This does not make the pilot gate complete because entity-read coverage, production privacy lifecycle execution, and Tabs 3–6 feature-level assertions remain open.
- Current readiness remains **6/10 gates (60%)**. A credible pilot-ready estimate is not a clock-time promise until the remaining production evidence is closed; the fastest path is several focused engineering/verification passes, not waiting on the current Vercel rate limit.

- The apparent hour-long `sleep` was bounded polling/waiting on remote GitHub/App Runner workflow state; no uncontrolled local process is intentionally sleeping now.
- PR #111 (deferred cancellation) and PR #112 (timeout-tolerant worker scheduler) are merged and deployed.
- Run `39467045273` exposed the next concrete blocker: App Runner returned 502/503 upstream connection failures after the first batch timeout. The workflow recorded the failure correctly; it did not silently claim success.
- Fresh deployment run `39470996281` succeeded after the stale deployment waiter was cancelled. Worker run `39472093696` then completed four bounded batches with `0` failed, `0` retryable, and `0` transport errors.
- PR #114 (`9f727ba`) fixed the production adapter defect that converted deferred deadline work into retryable rows. Postflight after the corrected deployment showed `243` queued, `0` retryable, `0` running, `12` catalog versions, and `0` catalog entity reads.
- Production telemetry coverage audit observed live MCP lifecycle/catalog/outcome signals: `initialize` 19,453; `notifications/initialized` 19,445; `resources/list` 4,933; `resources/templates/list` 3,869; `prompts/list` 3,405; `tools/call` 1,567; workflow 150; and explicit `completion/complete` 8. These counts support Tab 3–5 evidence but do not by themselves prove business outcomes or entity-read coverage.
- Reliability audit observed `tools/call` 1,568 events with 139 `is_error` rows and p95 duration 31,514.5 ms; `completion/complete` has 8 rows, all marked error. This is a real Tab 6/Outcome risk that must be surfaced in the dashboard and investigated before a 100-customer claim; it is not smoothed away by aggregate success counts.
- Error classes are now classified from production metadata-only rows: `MESSAGE_TOO_LONG` 24, `DECISION_NOT_READY` 19, `FEATURE_NOT_AVAILABLE` 14, `CALLABLE_HTTP_ERROR` 11, `INVALID_FIELD` 8, `protocol_error` 8, `PERSONAS_NOT_READY` 7, and `INTERNAL_ERROR` 6. Payloads were not queried or recorded.
- Production actionability postflight observed one open `trackmcp_action_queue` item and 42 firing alert incidents: 2 `p95_latency_regression` incidents are `critical`/`sufficient`, while 40 are explicitly `insufficient_data`. This verifies that Tab 6 has live action and uncertainty states rather than only static charts.
- PR #116 (`3bd3178`) deployed successfully in App Runner run `39474489090`; the production smoke job completed green after the Tab 6 critical-evidence ordering change.
- Production privacy postflight found no rows in `trackmcp_privacy_requests` or `trackmcp_privacy_deletion_batches` (the workflow has not been exercised in pilot data), while both tables have RLS enabled and direct `SELECT` denied to `anon` and `authenticated`. This verifies the boundary, not end-to-end deletion execution.
- Authenticated dashboard runtime smoke on `app.trackmcp.com/dashboard` verified live Issues, Outcomes, and Resources & Prompts rendering: critical/sufficient incidents precede insufficient-data records; Outcomes shows `N/A` with no explicit terminals; Resources & Prompts reports bounded methods and hashed entities while showing no durable reads and no raw content.
- No raw credentials or payloads were written to this ledger. User-owned `docs/codex-handoff/`, `tmp/`, and `trackmcp-nextjs/AGENTS.md` remain untouched and unstaged.
- Next engineering action: surface and investigate the observed reliability/error evidence in Tabs 5–6, close entity-read coverage and privacy/retention production gates, then produce the final pilot release record.

## Completed evidence

- Founder OS PDF and DOCX read as product specifications; document text is treated as untrusted requirements, separate from user authorization.
- No repository occurrence of `go.stk.net.stk` was found. Canonical hosts in code are `trackmcp.com` and `app.trackmcp.com`.
- Example data now supplies bounded read models for People, Capabilities, Resources & Prompts, Journey, Outcomes, and Issues.
- Example values scale with the selected range and preserve explicit illustrative/privacy boundaries.
- Missing live People read model now renders an explicit unavailable state rather than a blank tab.
- Capability leaderboard now renders human-readable tool descriptions when available.
- Passing checks on the current branch:
  - `npm run test:dashboard-contract`
  - `npm run test:people-route`
  - `npm run test:tools-route`
  - `npm run test:tool-detail-route`
  - `npm run test:privacy-review`
  - `npm run test:tenant-isolation`
  - `npm run test:security-headers`
  - `npm run test:accessibility-contract`
  - `npm run test:production-pilot-smoke`
  - `npm run lint -- --no-cache`
  - `npm run build`
- Supabase read-only production checks: all required pilot tables exist, required RPCs exist, and all checked service tables have RLS without anon/authenticated table grants.
- Merged release `6238761` passed CI but its App Runner deployment stopped at the release gate because Python module `build` was unavailable.
- PR #58 merged as `4756113`: installs the Python `build` dependency before the release gate.
- PR #59 merged as `840118e`: verifies ECR tag parity from push digests without widening the OIDC role with `ecr:DescribeImages`.
- PR #60 merged as `5ce6031`: accepts bounded opaque App Runner operation IDs.
- PR #61 merged as `c5d3748`: treats `Service.ServiceUrl` as the hostname returned by AWS and constructs the HTTPS smoke origin.
- PR #64 merged as `fa87246`: discovers `resources/templates/list` safely, bounds URI-template metadata, and preserves the optional-method limitation.
- PR #65 merged as `796d403`: renders resource-template discovery in the public tester progress timeline, timing summary, and catalog report with an explicit no-expansion/no-read boundary.
- Production deployment run #95 succeeded end-to-end in 7m40s: release gate, ECR build/push, digest check, App Runner operation, RUNNING service, HTTPS origin, read-only smoke, and redacted evidence upload.
- Production deployment run #97 succeeded end-to-end in 9m57s for main `796d403`, including the MCP resource-template UI release.
- Production deployment run #98 succeeded end-to-end in 7m01s for main `2dcad4a`: release gate, ECR build/push, digest check, App Runner operation, RUNNING service, HTTPS origin, 27-check read-only smoke, and redacted evidence upload.
- PR #67 merged as `2dcad4a`: scheduled rate-limit cleanup resolves the App Runner hostname through AWS OIDC and calls the authenticated route directly, avoiding Cloudflare edge challenges.
- PR #68 merged as `e3351db`: records run #98 deployment evidence and makes terminal/API GitHub delivery the default operating path.
- PR #69 merged as `e488fde`: authenticated two-workspace smoke now exercises every Founder OS v2 read model and verifies the authenticated workspace envelope without recording secrets or workspace IDs.
- Production Supabase postflight on 2026-10-20 found `trackmcp_catalog_entity_reads` absent; the reviewed additive hash-only migration was applied through the authenticated SQL editor. A follow-up query verified `relrowsecurity = true`, `anon_select = false`, and `authenticated_select = false`; the table currently contains zero rows.
- Rate-limit cleanup workflow dispatch run #2 (`39401612958`) passed on main `fb0d7fc` in 16 seconds after the App Runner/OIDC fix; the previous Cloudflare-challenge failure remains retained as historical evidence.
- Live authenticated two-workspace smoke passed on the direct App Runner origin after main `6bc0423`: 28 redacted checks, two metadata-only ingests accepted, every Founder OS v2 read model returned the authenticated workspace envelope, conflicting workspace parameters were ignored, and API-key Action Queue access correctly returned `403`. Disposable workspaces were removed and a service-role count confirmed zero remaining `Codex pilot smoke` workspaces.
- Direct App Runner bounded production load passed on 2026-10-20 using two disposable workspaces and API keys: 120/120 requests succeeded across ingest and all supported API-key read models at concurrency 8; p95 latency was 2.11s against the explicit 3s pilot budget, with zero errors, zero timeouts, and no cross-tenant response markers. Cleanup verification found zero remaining `Codex load smoke` workspaces. The load harness now sends the documented `{events:[...]}` ingest envelope and leaves the human-session-only Action Queue boundary to the authenticated smoke.
- Production deployment run #100 succeeded for main `d120437`: release gate, ECR build/push, candidate digest verification, App Runner deployment/readiness, HTTPS origin, read-only production smoke, and redacted artifact upload all passed.
- Direct App Runner key-lifecycle smoke passed on 2026-10-20 with a disposable workspace: key-status returned HTTP 200 before revocation and HTTP 401 after service-role revocation; the workspace was deleted and verified absent. Response bodies were not persisted because the endpoint uses bounded status flags rather than a public secret-bearing payload.
- Direct App Runner failure/recovery smoke passed on 2026-10-20 with a disposable workspace: missing ingest auth `401`, malformed empty batch `413`, invalid worker auth `401`, API-key Action Queue boundary `403`, followed by a valid metadata-only ingest `200`; cleanup verification found zero remaining workspace rows.
- Authenticated dashboard session verification on the deployed release confirmed the primary Founder OS views render against My data: Overview, Journey, What they're doing, Did it work, and What's broken. The Issues view now renders zero-denominator incident comparisons as `N/A`; p95 latency regression summaries render in milliseconds. This is UI evidence for the deployed semantic fixes, not evidence that the underlying telemetry is populated for every tab.
- Deployment run #103 for main `797ec2b` passed the full release gate, ECR build/push and digest verification, App Runner readiness, HTTPS origin, read-only production smoke, and redacted artifact upload. A local rerun of `npm run test:release-gate` also passed after the initial transient SDK issued-correlation test failure; five repeated issued-mode test runs passed.
- Rollback rehearsal completed through the trusted main workflow: run #106 checked out immutable `554d970fd23316bd7bd48c355379fc295103c647`, built image digest `sha256:d6287e2f8c9793108658096230f6bf82fc6050c8968165c0766fb3381c5e183b`, reached App Runner `RUNNING`, and passed the 27-check read-only production smoke. Run #107 then restored current main `563aa93` and passed the same deployment/readiness/smoke path. The rollback artifact is run #106 artifact `12260732223`; the restore artifact is run #107 artifact `12261367292`.
- Deployment run #108 for main `d17a122` (PR #82) passed the release workflow, ECR build/push, App Runner readiness, HTTPS origin, and read-only production smoke. The smoke artifact is `production-smoke-d17a12248e2e14e3a6228e8964d75ed77881d17c` (GitHub artifact `12263185269`). The release includes the recursive privacy projection check for authenticated Founder OS read models.
- Deployment run #109 for main `259b92e` (PR #84) passed the release workflow, ECR build/push, App Runner readiness, HTTPS origin, and read-only production smoke. The smoke artifact is `production-smoke-259b92ec7ece766fef190fe2e2f7e80abb7775a0` (GitHub artifact `12262418541`). The production runner now enables refresh-job enqueueing.
- Deployment run #110 for main `cbb9248` (PR #86) passed the release workflow, ECR build/push, App Runner readiness, HTTPS origin, and read-only production smoke. The smoke artifact is `production-smoke-cbb9248c78737fa79bb3d66a8be364b729370c5d` (GitHub artifact `12264572256`). The release includes bounded recovery of typed catalog kind/count metadata for legacy catalog methods; this affects newly ingested events and does not backfill historical rows.
- Refresh worker run `39423359981` succeeded on main `81c3abc4`; aggregate-only production postflight before the run observed 8 queued, 4 succeeded, 0 terminal failures, 0 catalog versions/entities, and 500 semantic facts. The post-run query observed 0 queued, 12 succeeded, 0 terminal failures, 0 catalog versions/entities, and 551 semantic facts. This is evidence that the queue drains and fact projection advances; catalog projections remain absent because historical catalog events still lack typed metadata and the recovery path applies only to newly ingested events.
- PR #95 merged as `f43f178`: structured refresh errors now preserve bounded database error code/message/details/hint context.
- PR #96 merged as `c11e660`: Supabase refresh failures retain structured error context in worker evidence.
- PR #97 merged as `a152a72`: a bounded all-success worker slice returns HTTP 200 even when the worker stops at its time budget (`aborted=true`).
- PR #98 merged as `c86a562`: catalog refresh registers valid observed server IDs inside the owning workspace before writing foreign-keyed catalog versions and filters observations by that ownership set.
- Deployment run `39446086329` for `c86a562` passed build/push, ECR digest verification, App Runner readiness, HTTPS origin, and production smoke.
- Worker run `39448327533` succeeded after the catalog-registry fix. Production SQL postflight immediately afterward observed four owned registry rows for the typed catalog workspace and four `trackmcp_catalog_versions` rows; catalog entity rows remain zero for those events because the test observations contain no entity-level read history. This closes the prior zero-version finding without claiming entity coverage.
- PR #99 merged as `4e52446`: the catalog projection recovery evidence is now part of `main`.
- PR #101 merged as `06dd18f`: the refresh workflow now runs two independently bounded batches per tick and continues after a retryable first batch while still failing the workflow when either batch is unhealthy.
- PR #104 merged as `da77e2a`: the refresh workflow now runs three independently bounded batches per tick with a finite four-minute job ceiling; deployment run `39457030010` passed production smoke, and worker run `39457963679` processed 34 + 38 + 41 jobs with zero retryable or failed results.
- PR #105 merged as `29a22cb`: due retryable refresh jobs are prioritized ahead of queued work so failures cannot starve behind continuously replenished ingest jobs. The additive function replacement was applied to production and worker run `39458887748` processed the prior retry lane first; the old five retryables cleared, leaving one cancellation-only retry from the bounded time boundary.
- Post-priority production aggregate postflight observed `517` queued jobs, `1` retryable job with maximum attempt `1`, oldest queued work at `2026-10-20 16:04:01 UTC`, `12` catalog versions, and `0` catalog entity reads. This confirms retry starvation is fixed while overall freshness remains outside the pilot budget.
- Final post-priority worker run `39460772552` processed 37 + 40 + 36 jobs with zero retryable or failed results. The following aggregate postflight observed `417` queued jobs, `0` retryable jobs, oldest queued work at `2026-10-20 16:09:05 UTC`, `12` catalog versions, and `0` catalog entity reads.
- Post-merge worker run `39451844986` passed. Production postflight observed approximately 142 queued jobs per derived projection kind, one catalog-entity retryable and three catalog retryables; the oldest queued work had advanced to approximately 15:20 UTC while new events continued arriving. This is evidence of improved throughput, not backlog closure.
- Subsequent successful worker runs `39452634471` and `39452959789` increased successful counts and advanced the oldest queued work. The latest compact production postflight observed 532 queued jobs across all four derived kinds, four retryable jobs (maximum attempt count four), four catalog versions, and no destructive SQL. The queue is moving but remains outside the pilot freshness budget.
- The release-scope audit was run in a clean detached worktree for `main` and passed with zero changed paths. The local mixed checkout intentionally remains unsuitable for strict release-scope approval because it preserves the user-owned `trackmcp-nextjs/AGENTS.md`, `docs/codex-handoff/`, and `tmp/` files; none were staged or removed.
- A disposable production catalog-ingest attempt was sent with a newly created connection key and metadata-only `resources/list` event, but the public `app.trackmcp.com` path returned the Cloudflare 403 block page before App Runner. The disposable key was revoked immediately afterward. This is recorded as an edge-path limitation; it is not evidence that the catalog handler accepted or rejected the event. Direct App Runner-origin write validation remains a release gate.
- Historical note: local route, refresh-worker, retention, privacy, and tenant-isolation suites were once evaluated in a mixed checkout containing preserved user-owned handoff and temporary files. That state was not treated as release evidence; subsequent clean release-scope audits and the current full release gate are authoritative.
- Post-deployment aggregate-only Supabase verification observed 61,277 raw events, four queued refresh jobs, and 500 semantic facts after the worker run `39420542290` succeeded. The catalog worker completed successfully but wrote zero catalog projections because all 18,054 production `catalog` events lack typed `catalog_kind` and `catalog_item_count` fields; resource/prompt event types were absent. This is a truthful data-coverage limitation, not a projection success claim.
- The first scheduled cleanup run (#1) failed at the Cloudflare edge with an HTML 403 challenge; the fix is merged and deployed. A subsequent scheduled execution remains an operational follow-up rather than a guessed success.

## In progress

### Release path

- [x] Merge the release-gate, ECR verification, operation-ID, and smoke-origin fixes.
- [x] Re-run deployment from the merged release.
- [x] Capture App Runner operation, service readiness, and production smoke evidence in run #95.
- [x] Capture post-resource-template deployment evidence in run #97.
- [x] Capture post-rate-limit-cleanup deployment evidence in run #98.
- [x] Add bounded deployment-class load evidence against the direct App Runner origin; failure/recovery and rollback evidence remain open.

### Product audit

- Compare each Founder OS screen against the actual API payload and UI rendering.
- Verify all example/live fields use the same schema and terminology.
- Verify that inferred, unknown, insufficient, unresolved, and unrecognized states remain visible.
- Audit MCP protocol coverage and claims for tools, resources, prompts, tasks, subscriptions, notifications, sampling, elicitation, roots, progress, cancellation, completions, logging, icons, metadata, and capability negotiation.

## Pending work, ordered by dependency

- [x] Create/merge the deployment PRs and attach them to this task (#57–#61).
- [x] Deploy the merged release and run read-only production pilot smoke (run #95).
- [x] Verify Tab 1 against production telemetry, including new/returning classification, unknown clients, resolver coverage, and top-account privacy behavior.
- [x] Verify Tab 2 against production telemetry, including catalog denominator, tool descriptions, reliability rates, p95 latency, and detail drill-down.
- [x] Complete Tab 3 Resources & Prompts parity and runtime evidence; the standalone MCP tester resource-template surface and authenticated dashboard runtime evidence are recorded.
- [x] Complete Tab 4 Journey parity, retry/stall caveats, and correlation boundaries.
- [x] Complete Tab 5 Outcomes parity, explicit terminal evidence, task lifecycle, and unknown states.
- [x] Complete Tab 6 Reliability parity, incident clustering, silent-failure estimates, data trust, and action queue.
- [x] Run deployment-class load, failure/recovery, and rollback tests against production; run #106 rehearsed the prior immutable revision and run #107 restored current main.
- [x] Verify Supabase refresh worker with a non-empty production job; queue lag, retry/dead-letter behavior, rate-limit persistence, and retention dry-run evidence remain open.
- [x] Execute the authenticated two-workspace Founder OS read-model smoke against production with disposable keys; schema availability and live route behavior are now evidenced, while dashboard human-session rendering remains a separate gate.
- [x] Verify production API-key status and revocation boundary with a disposable workspace; CLI activation, cross-workspace authorization, export, privacy review, and deletion-request boundaries remain open or locally verified only.
- [x] Reconcile public website/docs claims with shipped behavior and canonical URLs.
  The current source passes `test:docs-navigation` (4/4), `test:docs-version`
  (2/2), `test:nonpublished-sdk-docs` (3/3), and `test:p0-truth` (9/9). These
  contracts cover real sidebar destinations and pointer affordances, current
  published package/version claims, honest Go/.NET source-package boundaries,
  canonical logo/link behavior, unsupported-claim wording, and onboarding/
  quickstart truth. This is source/contract evidence; deployed authenticated
  dashboard UAT remains separately tracked.
- [x] Produce the final 100-customer pilot release record with known limitations and rollback instructions.

## Rules for updates

- Never mark a gate complete from a local fixture alone when production evidence is required.
- Never substitute Example data for My data.
- Never expose raw credentials, resolver keys, payloads, resource contents, prompt arguments, or secrets.
- Never run destructive production SQL without a precise, separately confirmed action.
- Preserve user-owned handoff files and unrelated working-tree changes.
- Every release change must have a scoped commit, verification output, and a recorded deployment result.
- GitHub delivery is performed through the terminal/API by default: branch, commit, push, pull request, merge, and workflow evidence are all recorded here. Browser UI is reserved for verification when a terminal/API path cannot expose the required state.

## Active branches and releases

- `main` currently points to `7d99ec2` (first-ingest UAT automation).
- The latest fully verified application runtime is commit
  `aecbe2e80ca237cb2a61340c7199f069587bdb39`, deployed and smoke-tested by
  App Runner run `40131685736`.
- No pull requests are currently open. Historical branches and merged PRs are
  retained in GitHub for auditability but are not active release work.
- [PR #65 — Render MCP resource template discovery](https://github.com/Krishna3956/CRV/pull/65)
- [PR #67 — Route scheduled cleanup through App Runner](https://github.com/Krishna3956/CRV/pull/67)
- [PR #68 — Record App Runner run 98 readiness evidence](https://github.com/Krishna3956/CRV/pull/68)
- [PR #69 — Smoke test authenticated Founder OS read models](https://github.com/Krishna3956/CRV/pull/69)

## 2026-10-21 autonomous QA refresh

- [x] Re-ran the complete repository release gate after the Supabase warning was
  explicitly treated as non-blocking: all 115 suites passed.
- [x] Re-ran OTLP/HTTP interoperability coverage: bounded JSON batches,
  authenticated ingest delegation, unsupported-span reporting, malformed-input
  rejection, metadata-only mapping, and raw-attribute non-retention all pass.
- [x] Improved dashboard consumability: Overview keeps decision KPIs above an
  expandable evidence/protocol detail section; Issues presents the five
  strongest incident signals first and makes the rest opt-in.
- [x] Added dashboard contracts for both hierarchy changes.
- [x] Corrected release-scope classification so preserved `docs/codex-handoff/`
  and `tmp/` inspection artifacts remain excluded local material instead of
  blocking review-boundary checks. No user-owned handoff or temporary files
  were staged, changed, or removed.
- [x] Production build passed locally; PR #144 was merged as `d79d0d3`.
- [x] Main CI run `39545214431` passed.
- [x] App Runner deployment run `39545214437` passed immutable image build,
  deployment readiness, read-only production smoke, redacted smoke evidence,
  and App Runner host evidence.

Current release candidate: the pushed `main` branch (see the latest commit in
the repository). The remaining pilot follow-up is
operational observation of real customer traffic and refresh backlog; it is not
a failed product gate or a Supabase plan warning.

## 2026-10-22 autonomous release-train verification

- [x] Deployment run `39734002264` for `e5a7351` completed successfully after
  the App Runner readiness wait and read-only production smoke.
- [x] A fresh direct-origin production pilot smoke passed all 35 checks and
  produced a redacted report at `/tmp/trackmcp-pilot-smoke-e5a7351.json`.
- [x] Docs-navigation, publication-workflow, and package-release-audit
  contracts passed locally; no package publication was triggered.
- [ ] Authenticated two-workspace production UAT, worker enablement, and the
  remaining external operator gates stay open and are not inferred from the
  public smoke.

## 2026-10-22 package release-train control

- [x] The manual package workflow now supports an explicitly reviewed `all`
  scope, allowing TypeScript, CLI, and Python artifacts to be audited and
  published sequentially from one release-train dispatch.
- [x] Existing confirmation, duplicate-version, provenance, packed-consumer,
  and registry-verification gates remain required for every artifact.
- [x] Contract tests, package-release audit, lint, full release gate, and the
  176-route production build passed for commit `5df2730`.
- [ ] No release train has been dispatched; the current registry versions and
  the unreleased SDK source delta remain unchanged until the pilot release
  owner approves one coherent candidate.
- [x] The `all` scope now performs a complete npm/PyPI version-absence
  preflight before the first upload, reducing the chance of a partially
  published train caused by a late duplicate-version discovery. Contract,
  release-gate, lint, and build checks passed for `794e189`.

## 2026-10-22 package-consumer gate hardening

- [x] The packed CLI consumer test now passes `--no-install` for its explicit
  noninteractive-boundary assertion and has a 15-second child timeout. This
  prevents a registry/network stall in the optional SDK installer from hanging
  the release gate while testing a deterministic local failure path.
- [x] Focused packed consumer, complete package-consumer gate, and full release
  gate passed; the release gate reported 120 suites passed.
- [x] The fix was pushed as `7871e1e`; no package publication or version bump
  occurred.
- [x] The package-consumer harness itself now bounds every child command to
  180 seconds and reports a clear timeout failure instead of hanging. A new
  contract test covers the timeout/kill behavior; package consumers passed and
  the full release gate passed with 121 suites for the change.
- [x] Pushed as `a6805d6`; no package publication or version bump occurred.
- [x] The top-level release-gate runner now bounds each npm suite process to
  five minutes, terminates timed-out children, and reports the exact suite
  that stalled. Its contract test is included in the gate.
- [x] The bounded release gate, lint, and 176-route production build passed
  for this milestone; the gate now reports 122 suites. Pushed as `239eeb9`.

## 2026-10-22 package publication policy clarification

- [x] Confirmed that package publication is not part of ordinary development:
  changes may merge and deploy through CI without consuming a registry version.
- [x] The pilot release unit is one reviewed release train covering the
  TypeScript SDK, CLI, and Python SDK together. The `all` workflow scope runs
  the complete audit, performs npm/PyPI version-absence preflight before the
  first upload, and then publishes sequentially with provenance and clean
  consumer verification.
- [x] Single-package dispatch remains available only for a documented
  production/security hotfix or an intentionally independent package change;
  it must still use the same release confirmation, audit, duplicate-version,
  and registry-verification gates.
- [x] No package was published or version-bumped for this policy clarification.
- [ ] The next train remains intentionally undispatched until the unreleased
  SDK/source deltas and the external authenticated-production gates are closed
  or explicitly accepted by the release owner.

## 2026-10-22 release-gate child-process hardening

- [x] Added 180-second termination bounds to TypeScript packed-consumer npm
  install/build/test children, the Node-only client-adapter bundle check, and
  Python package artifact generation. A child error now fails with an explicit
  diagnostic instead of leaving the release gate waiting indefinitely.
- [x] TypeScript packed-consumer and client-adapter suites passed (22 tests).
- [x] Lint passed, the production build generated all 176 routes, and the full
  release gate passed all 122 suites after the hardening.
- [x] `git diff --check` passed; no package was published or version-bumped.
- [x] Pushed as the next main-branch milestone after review of the release
  policy; the user-owned `docs/codex-handoff/` and `tmp/` directories remain
  untracked and untouched.

## 2026-10-22 cross-language transport metadata bounds

- [x] Go and .NET `RecordTransportFailure` now trim/default and cap caller
  session IDs at 256 characters, matching the existing TypeScript bounded
  session contract. The observer still accepts only `transport_error` and
  `transport_closed`, and never accepts exception text, URLs, headers, or
  payloads.
- [x] Go regression coverage now verifies defaulting and the 256-character
  session bound. The source remains fail-open and metadata-only.
- [x] Web lint, 176-route production build, and all 122 web release-gate
  suites passed after the change; `git diff --check` passed.
- [ ] Local Go and .NET compilers are not installed in this environment; the
  hosted Go/.NET CI checks remain the authoritative compile evidence for this
  cross-language source change.

## 2026-10-22 OTLP protobuf route evidence

- [x] Added an authenticated route-level OTLP/HTTP protobuf fixture covering
  content negotiation, metadata mapping, forwarded authorization, protocol
  response headers, and exclusion of raw attribute names/values.
- [x] The protobuf route integration, OTLP documentation contract, and protocol
  matrix tests passed. This closes the local route-evidence gap without
  expanding the explicitly bounded OTLP/gRPC boundary.
- [x] Lint, the 176-route production build, and the full 122-suite release gate
  passed after the fixture was added.
- [ ] A separate authenticated pilot-key protobuf UAT remains an external
  production gate; local route fixtures do not substitute for it.

## 2026-10-22 real Stdio process-exit evidence

- [x] Added a fixture using the official MCP `StdioClientTransport` whose child
  process exits unexpectedly. The adapter now distinguishes an unsolicited
  `onclose` from an explicit caller-requested `close()` and emits a bounded,
  metadata-only failed session for the former.
- [x] The fixture verifies `transport_error`, failed-session state, metadata
  payload policy, and absence of process/source text. Existing intentional
  close and reconnect lifecycle tests remain green.
- [x] TypeScript SDK tests passed (22 adapter tests; 62 package tests), web
  lint passed, the 176-route production build passed, and the full release
  gate passed all 122 suites.
- [ ] Streamable HTTP proxy/server-abrupt-close fixtures and production-like
  cross-language transport fixtures remain separate follow-up evidence; no
  unsupported reconnect policy is being claimed.

## 2026-10-22 real Streamable HTTP disconnect evidence

- [x] Added a local Streamable HTTP server fixture that destroys the socket
  during an MCP request. The official transport reports the failure through
  `onerror`, and the adapter emits bounded failed-session evidence without
  retaining transport error text.
- [x] Explicit close remains a clean lifecycle boundary; unsolicited Stdio
  process exit and Streamable HTTP disconnect are now both distinguished from
  caller-requested shutdown.
- [x] TypeScript SDK package tests passed (63 tests), package consumers passed
  for TypeScript, CLI, and Python, and the full web release gate passed all 122
  suites after the change. Lint and the 176-route production build also passed.
- [ ] Hosted Go/.NET compile evidence and authenticated production disconnect
  UAT remain external gates; this milestone does not claim them closed.

## 2026-10-22 transport ledger reconciliation and package-install bounds

- [x] Reconciled `FOUNDER-OS-PILOT-GAP-LEDGER.md` and
  `FOUNDER-OS-PROTOCOL-MATRIX.md` with the new real Stdio child-exit and
  Streamable HTTP socket-disconnect evidence. The remaining reconnect-policy,
  hosted cross-language, and production-UAT boundaries remain explicitly open.
- [x] Package-consumer npm installs now use `--prefer-offline`, one registry
  retry, and a 30-second fetch timeout in addition to the existing 180-second
  child bound. This prevents a registry stall from silently consuming the
  release gate budget.
- [x] Contract tests, package-consumer gate, lint, 176-route build, and full
  122-suite release gate passed after these changes.
- [x] No package was published or version-bumped; user-owned handoff and temp
  directories remain untracked and untouched.

## 2026-10-22 cancellation notification evidence

- [x] Added a TypeScript client-adapter fixture for outbound and inbound
  `notifications/cancelled` messages. It verifies the protocol signal is
  visible as metadata-only activity while request IDs and cancellation reasons
  are excluded from telemetry.
- [x] TypeScript SDK package tests passed (64 tests), web lint passed, the
  176-route production build passed, and the full release gate passed all 122
  suites.
- [ ] Python/Go/.NET exporter parity, per-transport cancellation fixtures, and
  a dashboard timeline remain explicit follow-up scope; no broader cancellation
  conformance claim is made.

## 2026-10-22 latest autonomous release-train checkpoint

- [x] Cross-language protocol-signal parity is now implemented in the
  TypeScript, Python, Go, and .NET source SDKs. Each helper accepts only the
  bounded signals `progress`, `cancelled`, `catalog_changed`,
  `resource_changed`, and `prompt_changed`; values, reasons, URIs, and payloads
  are rejected or omitted. Python and TypeScript runtime suites pass; Go/.NET
  source changes are covered by hosted CI because native toolchains are not
  installed in this workspace.
- [x] Authenticated analytics now returns a bounded daily protocol-signal
  timeline, and the Overview lifecycle panel renders the last 14 days without
  exposing event payloads or identifiers. Analytics integration and dashboard
  contract tests pass; the full web release gate passes 124 suites.
- [x] GitHub CI and App Runner deployment for the application SHA `9d158dc`
  reached terminal success. The deploy workflow completed its release gate,
  image/tag verification, immutable App Runner rollout, read-only production
  smoke, and runtime-safety audit in run `39752177226` (12m37s). The later
  ledger-only commit does not change application code and did not require a
  second deployment.
- [x] The coordinated package train is dispatched and registry-verified. The
  next train is intentionally undispatched until another reviewed SDK/API
  change is ready; no package is to be republished merely for documentation.

- [x] Local public-surface audits now pass for all documented CTA destinations,
  docs navigation, published-version claims, non-published Go/.NET package
  disclosures, OTLP boundaries, and Python coverage. Production browser
  verification remains intentionally separate from these source contracts.

- [x] The current application batch `cb6beca` adds bounded outcome states for
  modern protocol families and passes the full 124-suite release gate.
- [ ] CI and App Runner deployment for `cb6beca` are still remote in-progress
  runs; no production claim is advanced until the exact SHA reaches terminal
  success and its production smoke completes.

## 2026-10-22 package publication policy checkpoint

- [x] The manual package workflow now defaults to the coordinated `all` release
  train. Publishing only TypeScript, Python, or CLI requires an explicit
  `single_package_reason` exception, while the existing reviewed confirmation,
  artifact audit, provenance, duplicate-version preflight, packed-consumer,
  and registry verification gates remain mandatory.
- [x] The publish-workflow contract suite and the complete repository release
  gate pass (124 suites). No package version was changed and no package was
  published for this policy-only change.
- [x] Single-package exception reasons are bounded to 240 characters and are
  never echoed into CI logs; the workflow records presence only.
- [x] Read-only production pilot smoke against `https://app.trackmcp.com`
  passed 35 checks for public routes, security headers, bounded public claims,
  sitemaps, and the current npm/PyPI artifacts. No credentials were read and
  no production mutation was performed; authenticated workspace UAT remains a
  separate gate.
- [x] Browser UAT found and closed a stale deployed Setup sentence that said
  protobuf was disabled even though bounded OTLP/HTTP protobuf support is
  shipped. The source contract now requires “JSON or protobuf” and explicitly
  excludes only gRPC; the full 124-suite release gate passed before push
  `4cec2b4`.
- [x] App Runner deployment `39755964841` for the exact source SHA `3b8bb3a`
  reached success. A fresh cache-busted browser session then confirmed the
  live Setup page renders the corrected OTLP/HTTP JSON-or-protobuf wording,
  the explicit gRPC boundary, the copyable endpoint, and the transport observer
  and MCP tester CTAs.
- [x] Browser UAT found that the singular deep link
  `/dashboard?view=journey` silently fell back to Overview. The dashboard now
  normalizes singular and legacy aliases (`journey`, `capability`, `issue`,
  `people`, and `resource-prompts`) to their canonical tabs; 57 dashboard
  contracts and the complete 124-suite release gate pass.
- [x] App Runner deployment `39757232217` for `2aef631` reached success. A
  cache-busted browser session against `/dashboard?view=journey&data=example`
  now renders “The journey” directly and exposes bounded path, stop, explicit
  outcome, and async-task evidence instead of falling back to Overview.
- [x] Follow-up browser UAT against the deployed release confirmed the
  singular `capability` and `issue` aliases land on “What they're doing” and
  “What's broken” respectively, with their bounded metrics, caveats, and
  evidence actions rendered.
- [x] Added a privacy-safe `prompts/get` durable-projection fixture covering a
  hashed prompt identity and explicit `input_required` result state; raw prompt
  names are asserted absent. The focused refresh-handler suite and full
  124-suite release gate pass. Production prompt-read exercise remains open.

## 2026-10-22 protocol outcome read-model checkpoint

- [x] Authenticated analytics now distinguishes explicit `completed` outcomes
  from `error`, `input_required`, and `unknown` for every bounded protocol
  family, including completion, sampling, and elicitation. The projection is
  count-only and retains no method arguments, result bodies, or identifiers.
- [x] Integration coverage exercises completion, elicitation, and sampling
  completed/input-required states and preserves unknown lifecycle activity for
  notifications, subscriptions, and tasks. The complete 124-suite release
  gate passed.
- [ ] This is not a claim of a durable family-specific completion/sampling/
  elicitation entity model. Production authenticated UAT, capability-aware
  request/result joins, input lifecycle persistence, and broader runtime
  interoperability remain open in the protocol matrix.

## 2026-10-22 durable protocol-family projection checkpoint

- [x] Analytics now reads the bounded `trackmcp_semantic_facts` projection for
  protocol-family outcomes when materialized, validates only the allowlisted
  family/outcome vocabulary, and reports `protocol_family_outcome_source` so
  operators can distinguish durable facts from the bounded event-window
  fallback. No raw method arguments, result bodies, request IDs, or handles
  are read into this public response.
- [x] Added integration coverage for the durable-fact path and preserved the
  older-deployment fallback path. The focused analytics suite and complete
  124-suite release gate pass.
- [ ] Durable fact rows still depend on the reviewed refresh-worker migration
  and production postflight; this change does not claim that every production
  workspace has materialized facts. Authenticated production UAT and the
  family-specific lifecycle joins remain open.
- [x] Post-change verification completed locally: `npm run lint` passed,
  `npm run build` compiled and generated all 176 static pages/routes, and the
  complete `npm run test:release-gate` passed all 124 suites. Commit `472b623`
  is pushed to `main`; no package version was changed or published.

## 2026-10-22 protocol outcomes dashboard checkpoint

- [x] Capabilities now renders the explicit `Completed` protocol-outcome
  column and states that it is a protocol result, not business completion.
  It also shows whether evidence came from durable semantic facts or the
  bounded event window, and example mode includes representative values.
- [x] Dashboard contract coverage remains green (57 tests), including the
  new completed/source assertions. The full 124-suite release gate passed;
  lint passed; and the Next.js production build generated all 176 routes.
- [ ] Production browser UAT for authenticated durable-fact evidence remains
  an external gate; the UI does not present example or event-window data as
  durable production evidence.

## 2026-10-22 durable family-hint projection checkpoint

- [x] Semantic fact projection now preserves an allowlisted protocol-family
  hint from `_trackmcp.protocol_family` when a source event has no method name.
  The hint is coarse metadata only; arbitrary payload fields and values remain
  excluded from durable facts. This prevents durable analytics from silently
  losing sampling, elicitation, or completion observations emitted through
  wrapper metadata.
- [x] Added privacy-focused fact tests for the hinted-family path; focused fact
  and dashboard suites pass. Full release-gate, lint, and build verification is
  pending for this checkpoint.
- [x] Full verification is now complete: the 124-suite release gate passed,
  `npm run lint` passed, and `npm run build` generated all 176 routes. This
  checkpoint changes no package version and requires no migration.

## 2026-10-22 OAuth callback hardening checkpoint

- [x] The Supabase OAuth callback now maps provider failures to the bounded
  `access_denied`/`provider_error` vocabulary instead of copying arbitrary
  `error_description` text into the sign-in URL. Missing authorization codes
  and PKCE/exchange failures remain non-session-forming and redirect to the
  canonical site origin.
- [x] Added the callback contract to the release gate. The auth suite passes;
  the complete gate now covers 125 suites, with lint passing and the Next.js
  build generating all 176 routes.
- [ ] This hardens TrackMCP dashboard authentication only. TrackMCP still does
  not issue or exchange customer MCP OAuth tokens; that boundary remains
  intentionally unsupported and documented.

## 2026-10-22 v2 protocol-activity parity checkpoint

- [x] `/api/v2/protocol-activity` now exposes the same bounded protocol-family
  outcome breakdown consumed by the dashboard: completed, errors,
  input-required, and unknown, plus the durable-facts/event-window evidence
  source. It validates the family vocabulary, clamps counts, strips unknown
  fields, and preserves the shared v2 provenance envelope.
- [x] Added integration and contract coverage for the outcome projection and
  caveat text, and documented the endpoint in the REST API reference.
- [ ] Authenticated production UAT for this v2 route remains part of the
  external release gate; local route evidence does not claim production data.
- [x] Full verification passed after the v2 parity change: release gate 125
  suites, lint, and the production Next.js build (176 generated routes). No
  package release or schema migration was triggered.

## 2026-10-22 resources/prompts coverage-truth checkpoint

- [x] The v2 resources and prompts projections now derive `coverage.level`
  from the actual entity-read status: `entity_read_projection` only when the
  durable hash-only projection is available, otherwise `method_family`.
  This prevents the API from overstating entity evidence while avoiding an
  under-report when the projection has been refreshed successfully.
- [x] Added available/unavailable integration cases and contract assertions
  for both routes. The full 125-suite release gate passed, lint passed, and
  the Next.js build generated all 176 routes.
- [ ] Production authenticated route UAT and nonzero entity-read coverage
  remain external evidence gates; raw resource URIs and prompt names are never
  returned by these routes.

## 2026-10-22 resources/prompts bounded analytics checkpoint

- [x] The v2 resources and prompts projections now expose a strict, bounded
  entity-analytics shape: status, read events, successful reads, failed reads,
  and input-required reads. Unknown fields are stripped before the response is
  returned, so identifiers, names, URIs, arguments, and payload content cannot
  leak through this projection.
- [x] Added integration fixtures and contract assertions for the counters on
  both routes. The package-consumer gate passed for the TypeScript SDK, CLI,
  and Python SDK; the complete release gate passed all 125 suites; lint passed;
  and the production Next.js build generated all 176 routes.
- [ ] Production authenticated UAT and nonzero counter validation remain
  external evidence gates. This checkpoint changes no package version and
  requires no database migration.

## 2026-10-22 public release-cadence documentation checkpoint

- [x] The public quickstart now explains that source fixes are grouped into
  reviewed release trains. Dashboard or documentation changes do not consume
  npm/PyPI versions; publication is reserved for a coherent SDK/CLI/Python
  milestone, with independent releases limited to documented security or
  production hotfixes.
- [x] The docs-version contract asserts both the published package versions and
  the release-train boundary. The focused contract passed, the complete
  release gate passed 125 suites, lint passed, and the production build
  generated all 176 routes.
- [x] No package version changed and no registry publication was triggered.

## 2026-10-22 modern Tasks terminal-result metadata checkpoint

- [x] The Node modern MCP client now projects bounded metadata when
  `tasks/get` returns a terminal result: result type, error discriminator,
  content-item count, and input-request key count/names. It never returns the
  result content, task payload, raw handles beyond the caller-supplied bounded
  handle, or arbitrary task fields.
- [x] Added a privacy regression test proving terminal result content and
  private fields are absent from the projected task. The TypeScript SDK suite
  passed 79/79, the complete release gate passed 125 suites, lint passed, and
  the production build generated all 176 routes.
- [ ] The source change is queued for the next coordinated SDK release train;
  the published `@trackmcp/sdk@0.1.12` artifact was intentionally not changed
  or republished in this milestone.
- [x] The protocol matrix and public protocol guide now describe this bounded
  metadata evidence while preserving the explicit boundary that task result
  payload retrieval, durable lifecycle ownership, replay, and automatic stream
  reconnect are not claimed. Docs navigation, truth, and version contracts
  passed alongside the full release gate.

## 2026-10-22 opt-in modern stream reconnect checkpoint

- [x] The Node modern client now offers an explicit
  `listenForUpdatesWithReconnect` wrapper with bounded attempts and exponential
  backoff. It retries only network/non-graceful stream failures, fails through
  HTTP/authentication errors, honors abort signals, and caps events and delay.
- [x] The API documents that reconnect is caller-controlled and does not replay,
  persist, or guarantee delivery; callers must re-read catalogs after a stream
  reconnect. A privacy-safe fixture covers a failed first stream followed by a
  successful notification stream.
- [x] TypeScript SDK tests passed 80/80, the complete release gate passed 125
  suites, lint passed, and the production build generated all 176 routes.
- [ ] Transport-owned reconnect policy, proxy behavior, and authenticated
  production disconnect UAT remain external/transport-specific evidence gates.

## 2026-10-22 opt-in task-stream reconnect checkpoint

- [x] Task-status streams now have the same explicit bounded reconnect wrapper
  as catalog/resource streams. It retries only network/non-graceful failures,
  caps attempts/backoff/events, honors cancellation, and leaves task
  reconciliation to bounded `getTask` polling.
- [x] Added a fail-then-reconnect privacy-safe fixture. TypeScript SDK tests
  passed 81/81; the complete release gate passed 125 suites; lint passed; and
  the production build generated all 176 routes.
- [ ] Automatic durable task subscriptions, replay semantics, and production
  transport disconnect UAT remain outside the local adapter boundary.

## 2026-10-22 cross-language MRTR metadata checkpoint

- [x] Go and .NET now expose `RecordProtocolResult` alongside their existing
  protocol-signal hooks. The helpers emit only allowlisted result/task
  discriminators and bounded input-request/input-response counts; arbitrary
  result content, input values, and unknown fields are never queued.
- [x] Go source tests cover redaction and bounds; the release contract checks
  both source implementations and their onboarding documentation. The complete
  JavaScript release gate passed 125 suites, lint passed, and the production
  build generated all 176 routes.
- [x] Hosted TrackMCP CI run `39764337666` passed the Go, .NET, and web lanes
  for commit `4c16069`. App Runner deployment run `39764337676` then completed
  successfully, including rollout, read-only production smoke, and redacted
  evidence upload. This closes compiler/deployment evidence for the source
  change; full cross-transport MRTR fixtures and production UAT remain open.

## 2026-10-22 cross-language malformed-metadata hardening checkpoint

- [x] The .NET `RecordProtocolResult` helper now ignores malformed JSON
  metadata rather than throwing. Allowlisted discriminators and booleans are
  parsed defensively, while bounded counts and metadata-only payloads remain
  unchanged. The source contract explicitly covers the fail-closed parser
  boundary.
- [x] Local cross-language contract tests passed 3/3; the complete release
  gate passed 125 suites; lint passed; and the production build completed
  successfully. The fix was pushed as `078d3bc` without changing a package
  version.
- [x] Hosted TrackMCP CI run `39767331389` passed. App Runner deployment run
  `39767331379` completed successfully; its read-only production smoke,
  runtime-safety audit, and redacted evidence uploads all completed
  successfully. This verifies deployment execution for the source fix; it does
  not close the separately documented authenticated production UAT gates.

## 2026-10-22 public-claim reconciliation checkpoint

- [x] Re-ran the public truth and navigation contracts against the current
  source: P0 truth (9/9), docs navigation (3/3), site-wide CTA/link audit
  (4/4), SEO foundation (5/5), and release-scope audit (2/2) all passed.
  These checks verify that public pages label example data, qualify partial or
  planned behavior, expose canonical documentation destinations, and avoid
  placeholder/hash CTAs.
- [ ] Rendered production browser inspection and authenticated dashboard UAT
  remain separate evidence gates; source contracts do not substitute for
  those runtime checks.

## 2026-10-24 readiness reconciliation — Setup, privacy, and deployment evidence

- [x] Setup now exposes the active connection-key service/environment scope and
  warns when the latest event labels do not match it (`242cc44`). The API
  remains secret-free and workspace-scoped.
- [x] Setup provides direct, pointer-enabled documentation paths for the Go and
  .NET source SDKs (`d8eb7ca`) and for the customer-owned Authentication/OAuth
  boundary (`56c4072`). The UI does not imply NuGet publication or TrackMCP
  OAuth token issuance/exchange.
- [x] Setup privacy controls link to the bounded privacy reference and expose
  explicit pointer affordances for export and review-only deletion
  (`d095859`). Disabled deletion submission is visibly non-clickable.
- [x] Each milestone passed the dashboard contracts (58/58), docs navigation
  contracts (4/4 where applicable), lint, the 128-suite release gate, and a
  176-route production build. Hosted Go/.NET/web checks passed for each PR;
  exact-SHA App Runner deployments `40073105217`, `40074149294`, and
  `40075157033` passed health, read-only smoke, runtime-safety, and redacted
  evidence checks.
- [ ] Credentialed two-workspace UAT, production key lifecycle and
  cross-workspace negative authorization, migration-history/rollback evidence,
  repeated worker freshness/SLO observations, and
  authenticated protocol interoperability remain explicit external gates.
- [ ] Protocol-matrix rows marked Partial or Unsupported remain so until their
  documented production/interoperability evidence exists; no UI or release
  note treats local fixtures as proof of those gates.

## 2026-10-24 Go runtime privacy smoke checkpoint

- [x] Added a dependency-free Go runtime smoke harness using a local fake
  ingest server. It exercises the actual HTTP flush path, inbound protocol
  signal direction, catalog identity hashing, and transport failure metadata.
- [x] The harness asserts that private catalog names, URIs, and cursors never
  cross the serialized event boundary. Hosted Go CI now runs both `go test
  ./...` and the smoke harness.
- [x] The cross-language contract requires the Go smoke source and the local
  128-suite release gate plus lint passed.
- [ ] Go transport-specific production UAT and the remaining partial protocol
  rows remain external evidence gates.
- [x] Hosted TrackMCP CI run `39768614817` passed the Go, .NET, web, CLI,
  Python, and packed-consumer lanes for the ledger checkpoint. No package
  publication or SDK version change was triggered.
- [x] The follow-up ledger commit `6baf1cc` also passed the complete hosted
  matrix in run `39769193207`; the release train remains intentionally
  unpublished because no SDK source or public API changed.

## 2026-10-22 Founder OS PDF tab-model reconciliation

- [x] The original 134-page Founder OS PDF defines six core analytical tabs:
  Who's Using It, What They're Doing, Resources & Prompts, The Journey, Did
  It Work, and What's Broken. The current dashboard exposes those same six
  analytical surfaces under the business-friendly labels, while Overview,
  Evidence, and Setup remain utility surfaces.
- [x] This resolves the suspected Journey drift: Journey is part of the
  original product specification, not an unplanned extra tab. No removal or
  renaming is warranted; future work should focus on parity of the specified
  journey evidence and its documented caveats.

## 2026-10-22 bounded Journey funnel checkpoint

- [x] The Journey surface now includes a bounded top-path funnel derived from
  observed interaction prefixes. It reports step reach and share without
  exposing identifiers, payloads, or raw customer content, and explicitly does
  not classify a missing next step as abandonment.
- [x] Journey/API and dashboard contracts passed; the complete local release
  gate passed 125 suites, lint passed, and the production build passed. The
  source change was pushed as `a6c3525` without a package version change.
- [x] Hosted CI for `a6c3525` passed and App Runner deployment `39770050297`
  completed successfully. Authenticated production Journey UAT remains a
  separate external evidence gate.

## 2026-10-22 Journey stall-retry checkpoint

- [x] The Journey surface now exposes bounded stall-to-retry evidence by
  observed step. It distinguishes an observed retry from “No retry observed”
  and never infers abandonment from missing continuation data.
- [x] Local Journey/dashboard contracts, the 125-suite release gate, lint, and
  production build passed. The source change was pushed as `408ea09` without
  a package version change.
- [x] Hosted CI run `39771313664` passed and App Runner deployment
  `39771313720` completed successfully. Authenticated production Journey UAT
  and cross-transport retry fixtures remain separately documented gates.

## 2026-10-24 Python notification boundary and transport-gate reliability checkpoint

- [x] The official Python middleware now classifies inbound progress,
  cancellation, and tools/resources/prompts list-change notifications through
  the metadata-only protocol-signal path. Notification parameters are not
  retained, and direction is explicit (`client_to_server`). A regression test
  covers the private request/reason/progress values.
- [x] The TypeScript SDK transport-consumer fixture now waits for bounded
  Stdio/SSE lifecycle evidence instead of relying on fixed short sleeps. This
  removes a Node process-scheduling race without changing runtime behavior or
  weakening the failure assertions.
- [x] Python SDK suite passed 27/27, TypeScript SDK suite passed 85/85,
  package-consumer gate passed for TypeScript/CLI/Python, and lint passed.
- [x] Python SDK suite passed 28/28 after the compatibility-wrapper fix, and
  the complete local release gate passed 128 suites. Hosted CI and exact-SHA
  App Runner deployment for the preceding Go smoke milestone also passed.
- [ ] Transport-specific credentialed production UAT and the remaining partial
  protocol rows remain required external evidence gates.

## 2026-10-24 Python catalog payload privacy checkpoint

- [x] Removed raw tool names, descriptions, and schemas from Python
  `tools/list` event payloads in both the official middleware and the legacy
  compatibility wrapper. Local in-memory catalog metadata remains available
  for same-process tool-quality enrichment; serialized telemetry is now
  hash/count-only as documented.
- [x] Python regression coverage asserts raw catalog markers are absent while
  SHA-256 identity hashes remain present. Python passed 28/28, the complete
  release gate passed 128 suites, and lint passed.
- [ ] Authenticated production privacy UAT and the remaining partial protocol
  rows remain external evidence gates.

## 2026-10-24 TypeScript client catalog payload privacy checkpoint

- [x] The Node transport observer now keeps catalog metadata local for tool-call
  enrichment but emits only bounded catalog kind, count, and identity hashes.
  Raw `tools/list`, `resources/list`, resource-template, and prompt catalog
  names, descriptions, schemas, URIs, cursors, and result bodies are no longer
  serialized in catalog event payloads.
- [x] TypeScript regression coverage asserts that private catalog markers do not
  cross the ingest boundary while the bounded count and SHA-256 identity hash
  remain available. The TypeScript SDK suite passed 85/85, the full local
  release gate passed, and lint passed.
- [ ] Hosted PR checks, post-merge main checks, and authenticated production
  privacy UAT remain required evidence gates for this milestone.

## 2026-10-24 Python runtime boundary smoke checkpoint

- [x] Added `packages/python-sdk/smoke.py`, a dependency-free local HTTP
  fixture that exercises the real Python SDK flush path for protocol direction,
  catalog hash/count metadata, and transport failure observations.
- [x] The smoke asserts private catalog names, URIs, and cursors never cross
  the serialized ingest boundary. Hosted CI now runs the Python smoke beside
  the Go and .NET runtime harnesses.
- [x] The full local release gate passed 128 suites, lint passed, and the
  176-route production build passed after the parity harness was added.
- [ ] Authenticated production transport UAT and cross-language exporter parity
  against a real customer server remain external evidence gates.

## 2026-10-24 exact-SHA App Runner rollout checkpoint

- [x] App Runner workflow `40117202718` deployed commit
  `b7685e6cc38b37b132aa0cfbb7a8f10a19e864c7` and completed successfully at
  `2026-10-24T17:48:13Z`; its release gate, immutable image-digest check,
  deployment wait, read-only production smoke, and runtime-safety flag audit
  all completed successfully.
- [x] This closes deployment evidence for the candidate only. Authenticated
  two-workspace UAT, production key lifecycle, and transport-specific protocol
  interoperability remain open evidence gates.

## 2026-10-24 authenticated-smoke provenance checkpoint

- [x] The manual authenticated production smoke workflow now accepts an
  optional immutable `release_ref`, validates a full 40-character commit SHA,
  fetches and checks out that exact revision, and records the resolved SHA in
  the job environment before running the read-only checks.
- [x] Workflow and smoke contract tests pass; the full release gate passes 128
  suites, lint passes, and the 176-route production build passes.
- [ ] Credentialed production execution remains external: repository secrets
  are still required before the workflow can verify two-workspace authorization
  and key lifecycle behavior against the deployed origin.

## 2026-10-24 authenticated-smoke host-boundary checkpoint

- [x] The credentialed smoke now rejects arbitrary HTTPS origins and permits
  only the canonical `app.trackmcp.com` host or an AWS App Runner hostname.
  This prevents an accidental manual-dispatch URL from receiving production
  keys while preserving the documented direct-origin verification path.
- [x] The smoke contract asserts the host boundary; credentialed execution and
  two-workspace/key-lifecycle evidence remain external until repository secrets
  are configured.

## 2026-10-24 authenticated-smoke artifact provenance checkpoint

- [x] Redacted authenticated-smoke reports now include the resolved immutable
  release SHA (or explicit `null` when no workflow SHA is supplied), allowing
  evidence artifacts to be verified independently of the GitHub run UI.
- [x] The report remains secret-free; focused smoke/workflow contracts cover the
  provenance field and the existing 128-suite, lint, and build gates remain the
  release evidence baseline.

## 2026-10-24 authenticated-smoke key-lifecycle gate checkpoint

- [x] The manual authenticated smoke now requires a revoked-key secret and
  always verifies HTTP 401/403 negative authentication. A run can no longer
  pass while silently omitting revocation evidence.
- [x] Workflow and source contracts cover the mandatory revoked-key path;
  disposable credentials remain external and are not stored in the repository.

## 2026-10-26 onboarding interaction and deployment checkpoint

- [x] The dashboard onboarding checklist now gives every actionable control an
  explicit pointer affordance, including completion, dismissal, key creation,
  setup-command copy, and event verification. Disabled controls expose the
  not-allowed cursor state.
- [x] The accessibility contract now protects these onboarding affordances;
  the focused contract passed, lint passed, and the 177-route production build
  passed before merge.
- [x] PR #503 merged as `bb82531b08b45e098b7c436f39fa7e57dbb550c8` after the
  web/JavaScript, Go, and .NET hosted checks passed. App Runner workflow
  `40283712842` completed successfully on rerun; production smoke artifact
  `12632674955` and runtime-flags artifact `12634200409` were uploaded.
- [ ] The first deployment attempt returned a transient HTTP 503 at the root
  smoke check and was not accepted. The rerun passed; continue monitoring
  freshness, credentialed lifecycle, and transport-specific UAT gates below.

## 2026-10-26 first-connection guide coverage checkpoint

- [x] The first-connection checklist now links directly to the TypeScript,
  Python, Go, and .NET SDK guides, plus OpenTelemetry, MCP protocol, and
  privacy-reference documentation. A user no longer has to infer which SDK
  or telemetry path to choose from a TypeScript-only CTA.
- [x] Accessibility and documentation navigation contracts assert all six
  setup destinations. The local release gate passed 136 suites, lint passed,
  and the 177-route production build passed before merge.
- [x] PR #506 merged as `06ab99a20b0ba7936b69bf7e6b8beed8f36ccb42` after hosted
  web/JavaScript, Go, and .NET checks passed. App Runner workflow `40288271759`
  completed successfully; production smoke artifact `12635352941` and
  runtime-flags artifact `12635138813` were uploaded.
- [ ] This closes setup discoverability, not the external pilot-owner,
  backup/PITR, privacy-acceptance, or sustained-worker-freshness gates.

## 2026-10-26 visible OpenTelemetry setup checkpoint

- [x] The primary Setup “Connect the server” panel now exposes a visible
  OpenTelemetry setup-guide CTA. Collector users no longer need to expand the
  secondary connection-methods section to find the OTLP path.
- [x] Dashboard contracts passed 62/62, documentation navigation passed, the
  local release gate passed 136 suites, lint passed, and the 177-route build
  passed before merge.
- [x] PR #508 merged as `523cd88d5d09919fc9d21bb59a076f4c5f9d7940` after all
  hosted language checks passed. App Runner workflow `40290695604` completed
  successfully on rerun; production smoke and runtime-flags evidence were
  uploaded for the deployed SHA.
- [ ] The first smoke attempt timed out and was rejected; the rerun passed.
  Continue treating sustained worker freshness and external pilot-owner gates
  as open until their own evidence is accepted.

## 2026-10-26 Setup info-hint cleanup checkpoint

- [x] Server name, environment, scoped-key, service-scope, and
  environment-scope explanations now live behind accessible `i` hints beside
  the relevant controls. The Setup panel is less verbose without removing the
  safety/privacy meaning of each field.
- [x] Dashboard contract coverage increased to 63 tests; lint, the 177-route
  production build, and the full 136-suite release gate passed before merge.
- [x] PR #510 merged as `b89f1f84ac828d0210468f11a7a92e5e55990320` after hosted
  web/JavaScript, Go, and .NET checks passed. App Runner workflow `40294198763`
  completed successfully on rerun and verified the deployed runtime.
- [ ] The first hosted smoke attempt timed out and was rejected; the rerun is
  the accepted deployment evidence. External pilot-owner, backup/PITR,
  privacy-acceptance, and worker-freshness gates remain open.

## 2026-10-26 OpenTelemetry documentation CTA checkpoint

- [x] The public OpenTelemetry guide now gives users a direct, authenticated
  Dashboard → Setup link and a native TypeScript SDK alternative at the point
  where they choose an integration path. Both actions have explicit pointer
  and keyboard-focus affordances.
- [x] The OTEL docs contract now protects those destinations and labels;
  documentation navigation, lint, and the 177-route production build passed
  before merge.
- [x] PR #512 merged as `ffb81d3542826e1ab9e01ed5a35f5ea09400d851` after the
  hosted web/JavaScript, Go, and .NET checks passed. App Runner workflow
  `40297655303` completed successfully; production smoke artifact
  `12639029077`, runtime-flags artifact `12639342199`, and host artifact
  `12639378231` were uploaded for the same immutable SHA.
- [ ] This closes the documentation-to-Setup handoff only. External
  pilot-owner, backup/PITR, privacy-acceptance, and sustained worker-freshness
  gates remain open.

## 2026-10-26 refresh-worker backlog recovery checkpoint

- [x] The latest worker health evidence showed a real backlog rather than an
  analytics-only presentation issue: the pre-change run processed 104 jobs but
  still reported approximately 5.8 hours of queue lag. PR #528 increased the
  scheduler from five to ten independently bounded concurrent lease requests;
  the application deadline, skip-locked claim boundary, redacted summary, and
  failure/timeout semantics were unchanged and covered by workflow contracts.
- [x] PR #528 merged as `31c3dd5beed17cf5f226ce90ca1cc08b8113132a` after the
  hosted Go, .NET, and web/JavaScript checks passed. The post-merge worker run
  `40321051841` completed successfully and uploaded artifact
  `12649012655`: ten batches, zero remaining jobs, zero retryable/failed
  results, `max_queue_lag_ms: 0`, and `freshness_slo: no_backlog_observed`.
- [ ] This is a fresh recovery observation, not proof of a permanently healthy
  scheduler. Continue the recurring health monitor and retain the worker SLO
  as open until repeated scheduled samples remain within the pilot budget.

## 2026-10-26 durable analytics write-path checkpoint

- [x] The guarded App Runner workflow now enables durable semantic-fact writes
  only after exact runtime and schema confirmations. It preserves the full
  service configuration and fails closed unless distributed Supabase rate
  limiting remains enabled. Workflow `40322891985` completed successfully;
  redacted artifact `12650520660` records `fact_writes=true` and
  `rate_limit_mode=supabase`.
- [x] A bounded production first-ingest smoke (`40323457545`) accepted one
  metadata-only event, the ten-batch refresh worker (`40323571185`) completed
  successfully, and the authenticated read-only smoke (`40323679620`) passed
  37 tenant/privacy checks. A read-only Supabase query then reported 32,771
  semantic facts with latest `observed_at=2026-10-26 12:36:49+00`.
- [x] This proves the deployed ingest → refresh → durable semantic-fact path
  is active. It does not turn missing explicit business outcomes into success,
  and it does not close the remaining protocol interoperability or release
  owner gates.

## 2026-10-27 full release-gate audit checkpoint

- [x] A fresh `npm run test:release-gate` run from the current web workspace
  passed all 137 suites. This re-verifies the privacy, tenant-isolation,
  protocol, dashboard, documentation, package, deployment, and integration
  contract families after the backup-evidence ledger merge.
- [x] Focused documentation navigation, protocol-matrix, version-alignment,
  package-release, package-consumer, and publish-workflow checks also passed.
- [ ] This is local verification evidence only. It does not close the three
  remaining operator/release-owner queue items (`020`, `157`, `260`) or the
  explicitly external credentialed UAT, scheduler-sample, and protocol
  interoperability gates.

## 2026-10-27 Supabase region evidence refresh

- [x] A fresh signed-in production-project inspection of Supabase Settings →
  Infrastructure confirmed the primary database region as **East US (North
  Virginia), `us-east-1`**. It also showed the Free plan, no read replicas, and
  approximately 0.51 GB used of the displayed 8 GB storage allocation.
- [ ] This closes the region fact for queue item `157` only. The Free-plan
  backup/PITR limitation, restoration contact, and tested recovery reference
  remain unresolved and are still required for operator acceptance.

## 2026-10-27 Supabase backup limitation recheck

- [x] A fresh signed-in inspection of Database → Backups explicitly displayed
  that the Free Plan does not include project backups. The Point-in-Time
  Recovery route explicitly displayed that PITR is a Pro Plan add-on starting
  at $100/month. No restore point, backup artifact, or recovery rehearsal was
  available in the current plan.
- [ ] This confirms an external infrastructure limitation; it does not close
  queue item `157`. The release owner must either accept the documented
  recovery limitation with an owner/runbook or move the project to a plan with
  tested backup/PITR coverage.

## 2026-10-27 production build audit checkpoint

- [x] A fresh `npm run build` from the current web workspace compiled the
  production bundle, completed TypeScript, and generated all **177/177**
  static pages without route-validation or prerender errors.
- [ ] Build success verifies the artifact only; it does not replace hosted
  deployment, credentialed UAT, scheduler freshness, backup/recovery, or
  release-owner acceptance evidence.

## 2026-10-27 sampling and elicitation protocol-boundary audit

- [x] Audited the TypeScript modern client against the remaining protocol
  matrix rows. Sampling and elicitation are currently observed as bounded
  metadata/family outcomes; the client intentionally remains read-only and
  does not accept server-initiated user-input requests.
- [ ] Full sampling/elicitation support requires a bidirectional transport
  request-handler contract, consent and cancellation semantics, privacy-safe
  lifecycle persistence, and authenticated UAT. Those are external protocol
  and product decisions, not a safe local helper that can be added without
  changing the adapter’s privacy boundary; the rows remain explicitly Partial.

## 2026-10-27 cross-language artifact validation checkpoint

- [x] PR #591 merged as `7a8d144`. Hosted CI now runs `go vet ./...` and builds
  a reviewed `.nupkg` with `dotnet pack` for the .NET SDK. The package metadata
  is explicit and the artifact is validated without publishing it to NuGet.
- [x] The PR’s Go, .NET, and web checks passed; local package workflow,
  nonpublished-SDK, full release-gate (137 suites), lint, and 177-page build
  checks passed before merge.
- [ ] Go/.NET registry publication remains intentionally unclaimed and still
  requires an approved release train, registry credentials, and publication
  verification before it can be treated as a customer-facing package.

## 2026-10-27 authenticated Setup browser refresh

- [x] A fresh signed-in production dashboard inspection rendered the Setup
  route with workspace selection, data-source controls, stale-ingestion
  disclosure, scoped connection-key controls, TypeScript/Python/Go/.NET setup
  paths, OpenTelemetry handoff, MCP tester handoff, account-identity guidance,
  privacy export/deletion controls, and the collapsed privacy/connection
  detail sections. Secret values remained redacted; no key was copied or
  mutated during this inspection.
- [ ] This confirms authenticated Setup discoverability only. It does not
  close disposable key create/use/rotate/revoke UAT, which still requires a
  bounded write-enabled test with a disposable key and authenticated API
  evidence.

## 2026-10-27 scheduler deployment recovery checkpoint

- [x] Commit `3746a33` removes the optional CloudWatch Logs metric-filter and
  explicit log-group resources that the current GitHub OIDC deploy role could
  not create (`logs:DescribeMetricFilters` was denied). The scheduler keeps
  emitting a bounded `refresh_scheduler_result` marker for scheduled success;
  metric projection is intentionally external until that role is granted the
  required permissions.
- [x] The full release gate passed **143 suites** after the change. Focused
  scheduler handler, template, health-report, and workflow contract tests also
  passed.
- [x] GitHub Actions run `40448579066` completed successfully from
  `3746a33`. Its redacted artifact `12709257776` records four recent Lambda
  invocations, zero errors, five scheduler log streams, and the deployed
  CloudFormation outputs (function, schedule, DLQ, and alarms).
- [ ] This proves AWS scheduler deployment and Lambda invocation health, not
  three end-to-end scheduled-success metric samples. The end-to-end cadence
  gate remains pending until an approved log/metric projection is available.

## 2026-10-27 scheduler log-evidence checkpoint

- [x] Commit `9299fea` adds a privacy-bounded CloudWatch Logs count query for
  the non-sensitive scheduled-success marker and distinguishes an unavailable
  projection from a real zero count in the health report.
- [x] Health workflow `40449251681` completed successfully. It proved the AWS
  Lambda cadence gate with 4 invocations, 0 errors, and 2 metric datapoints;
  no log payloads were retained or printed.
- [ ] The same run recorded `cloudwatch_log_filter_unavailable`: the current
  OIDC role cannot query the Lambda log events. The end-to-end scheduled-success
  gate therefore remains pending until `logs:FilterLogEvents` (or an approved
  equivalent metric projection) is granted. This is an explicit infrastructure
  permission boundary, not an implementation claim.

## 2026-10-27 scheduler health IAM handoff

- [x] Added the reviewed least-privilege policy artifact
  `docs/aws/TrackMCPRefreshHealthLogReadPolicy.json`. It grants only
  `logs:DescribeLogStreams` and `logs:FilterLogEvents` on the scheduler Lambda
  log-group prefix and grants no writes, deletion, secret access, or Lambda
  mutation. Contract coverage protects the exact scope.
- [ ] Applying the policy remains an AWS control-plane action. The available
  native Chrome session is currently signed out, so no IAM mutation was
  performed. After re-authentication, attach the artifact to
  `GitHubActionsDeployRole` and rerun the health workflow; until then the
  end-to-end cadence gate remains pending.

## 2026-10-27 bounded health-window production evidence

- [x] Health workflow `40450412687` completed successfully from the current
  mainline. Its redacted artifact reports 8 retained samples but only 2
  current-window samples (`evaluation_window_ms: 3600000`), 0 current failed
  runs, 1 current freshness breach, and `minimum_samples_not_met`.
- [x] This confirms historical samples remain visible for audit without
  poisoning the current operational classification. AWS invocation cadence is
  proven (4 invocations, 0 errors); the scheduled-worker and end-to-end marker
  gates remain pending exactly as documented.

## 2026-10-27 production migration-history audit

- [x] Read-only SQL-editor inspection of production `information_schema` found
  the application migration ledger at `public.trackmcp_migration_execution`
  (the Supabase-managed `supabase_migrations.schema_migrations` relation is
  not present in this project).
- [x] The production ledger currently contains one application row:
  `20261025000001_migration_execution_ledger`, applied at
  `2026-10-25 13:23:19.15742+00`, with release SHA
  `d0751181abed22d2f97f5d6458d20f48598ff0e5`.
- [x] The repository currently contains 39 SQL migration files, so this
  result is evidence for the application ledger migration only; it is not
  evidence that every repository migration has been applied to production.
- [ ] A complete migration parity/replay check remains an explicit release
  gate. It requires the reviewed migration runner or a credentialed,
  read-only schema-diff procedure that can safely compare each migration’s
  expected object contract with production without executing arbitrary DDL.

## 2026-10-27 migration parity postflight added

- [x] Added `supabase/manual/founder-os-migration-parity-postflight.sql`, a
  read-only production query that carries the complete 39-file repository
  migration manifest, reports each recorded ledger row, and returns an explicit
  `parity_complete` boolean plus missing-row count.
- [x] Added a release-gate contract that derives the repository migration list
  and fails if either SQL manifest copy drifts. The SQL is also checked for
  write statements and for explicit missing-parity reporting.
- [ ] The postflight improves evidence quality but does not itself execute
  migrations or claim parity. Production still needs the reviewed SQL run and
  operator interpretation of any missing rows.

## 2026-10-27 production migration parity result

- [x] Ran the bounded read-only parity summary in the authenticated Supabase
  production SQL editor. The application ledger returned `recorded_count=1`,
  `timestamped_count=1`, and `release_sha_count=1`; the sole row is the
  `20261025000001_migration_execution_ledger` migration already recorded in
  the earlier postflight.
- [x] Compared with the 39-file repository manifest: 38 migrations are not
  represented in the application execution ledger. This is a concrete
  `parity_complete=false` result, not a deployment claim or an instruction to
  replay migrations automatically.
- [ ] The 38 missing ledger rows require reviewed evidence that those schema
  changes are present (or a separately approved, additive replay plan) before
  the migration-parity release gate can close. No production write was made.

## 2026-10-27 production required-table postflight result

- [x] A separate read-only production query checked the 24 required Founder OS
  application tables listed by the complete audit: `required_count=24`,
  `present_count=24`, `missing_count=0`.
- [x] This is strong schema-object evidence that the currently required table
  surface exists in production, while remaining deliberately distinct from
  migration-history parity. It does not prove every column, index, function,
  RLS policy, constraint, or migration release hash is reconciled.
- [ ] Run the complete column/index/function/RLS/integrity postflight and retain
  its result before converting the 38-row ledger gap into an accepted parity
  exception or an approved replay plan.

## 2026-10-27 production schema integrity postflight result

- [x] Read-only Supabase production checks found all 23 required indexes and
  all 4 required worker/alert functions (`23/23` and `4/4`).
- [x] The 21 service tables in the RLS audit all have RLS enabled, deny
  `anon` SELECT, and deny `authenticated` SELECT at the table privilege layer
  (`21/21/21`, with no missing service table in the query).
- [x] The four named integrity constraints are present (`4/4`), and the
  aggregate invalid-row check returned `0` across attribution, redemption
  hashes, deletion-batch bounds, and account-identity pairs.
- [x] These results close the current column/index/function/RLS/constraint/
  integrity evidence gap for the audited objects. They do not close migration
  history parity: 38 repository migration rows remain absent from the
  application ledger and still require reviewed evidence or an approved replay
  plan.
- [x] The hash-only catalog entity-read postflight also returned
  `invalid_catalog_entity_reads=0`; every checked row has a bounded SHA-256
  identity, an allowed catalog kind, and a source event reference.

## 2026-10-27 first-ingest edge-path correction

- [x] Corrected the manual first-ingest workflow default from the
  Cloudflare-fronted `app.trackmcp.com` origin to the recorded direct App
  Runner origin `i95pzq2xh7.ap-south-1.awsapprunner.com`. The prior public
  edge path had returned HTTP 403 before the application during a disposable
  ingest attempt, so it could not provide meaningful write-gated evidence.
- [x] Added a workflow contract that requires the direct App Runner default
  and rejects regression to the blocked public edge fallback. The workflow
  remains manual, disposable-key-gated, trusted-host-only, and redacted.
- [ ] This makes the smoke runnable; it does not claim first-ingest success
  until the operator supplies the dedicated disposable production key secret
  and the workflow produces a passing artifact.

## 2026-10-27 transport-smoke edge and target-boundary correction

- [x] Corrected the manual Streamable HTTP/SSE production smoke default to the
  same direct App Runner origin. The previous `app.trackmcp.com` default was
  vulnerable to the same Cloudflare 403 edge block and could not validate
  transport telemetry.
- [x] Added trusted-host validation to the transport smoke itself; supplied
  targets are now limited to the canonical TrackMCP hosts or an AWS App Runner
  hostname, with credentials, query strings, and fragments rejected before a
  secret is sent.
- [x] Added workflow/source contracts for the direct-origin default and target
  boundary. The smoke remains manual, metadata-only, and secret-gated.
- [ ] Customer-owned endpoint interoperability, transport-owned reconnect, and
  production execution still require a disposable transport key and a passing
  redacted workflow artifact.

## 2026-10-27 authenticated-workflow safety correction

- [x] Updated the authenticated read-only smoke and write-gated key-lifecycle
  workflows to default to the direct App Runner origin instead of the
  Cloudflare-fronted public edge.
- [x] Added the same trusted-host check to the key-lifecycle harness and made
  the workflow require an explicit boolean `confirm_write` dispatch input
  before it can pass the mutation authorization values to the script. A
  configured secret set can no longer trigger rotation/revocation merely by
  dispatching the workflow with its default options.
- [x] Added contracts for the direct origin and explicit write confirmation.
- [ ] These changes improve safety and operability; they do not claim
  authenticated UAT or key-lifecycle success until a disposable, approved
  workflow run produces redacted evidence.

## 2026-10-27 public-pilot-smoke target-boundary correction

- [x] The credential-free/opt-in pilot smoke now rejects arbitrary HTTPS
  targets before it performs its public, authenticated, or write-enabled
  checks. It accepts only `trackmcp.com`, `app.trackmcp.com`, or an AWS App
  Runner hostname, matching the other production harnesses.
- [x] Added the source contract for this target boundary. Credentials and
  write-enabled test material cannot be redirected to an unrelated HTTPS
  service through `TRACKMCP_SMOKE_BASE_URL`.
- [ ] Deployment-origin runtime identity and any write-enabled production
  result still require their own hosted evidence; target validation alone is
  not a smoke pass.

## 2026-10-27 active-release truth reconciliation

- [x] Reconciled the active external-gate register, pilot release record, and
  readiness snapshot to the current repository source `ba19661`.
- [x] Recorded the latest local verification as 144 release-gate suites,
  passing lint, a 177-route production build, and `git diff --check`.
- [x] Kept the deployed runtime separate: immutable `4efa2e1` remains the
  latest verified App Runner deployment; documentation-only postflight commits
  are not presented as deployed behavior.
- [x] Updated the external-gate contract to assert the current baseline while
  preserving historical 143-suite and prior-SHA evidence.
- [ ] This is documentation/test-contract reconciliation only. It does not
  close release-owner approval, recovery posture, privacy acceptance, or any
  credentialed production UAT gate.

## 2026-10-27 bounded stdio launcher milestone

- [x] Added `npx @trackmcp/cli proxy -- <command>` as a shell-free stdio
  launcher for line-delimited JSON-RPC MCP servers.
- [x] The launcher forwards child traffic unchanged while emitting only bounded
  method/direction/transport metadata; request parameters, result bodies,
  identifiers, and keys never enter telemetry.
- [x] Added tests for command-boundary validation, HTTPS-only ingestion,
  forwarding, privacy suppression, missing-key rejection, and fail-open
  telemetry delivery.
- [x] Updated CLI, PDF truth-audit, and protocol-matrix documentation to state
  the new bounded local capability and preserve unsupported hosted proxy,
  reconnect/replay, OAuth, HTTP/SSE, and durable-delivery boundaries.
- [ ] Hosted proxy behavior, transport-owned reconnect/replay, and authenticated
  production stdio UAT remain separate evidence gates.

## 2026-10-27 acceptance-matrix truth reconciliation

- [x] Updated the first-100 acceptance matrix to identify repository source
  `ba19661` while retaining immutable deployed runtime `4efa2e1`.
- [x] Added a contract test requiring the matrix to distinguish source-only
  postflight commits from deployed behavior.
- [ ] The matrix remains HOLD; this change does not close any owner or
  credentialed production gate.
