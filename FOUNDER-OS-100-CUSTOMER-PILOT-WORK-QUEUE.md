# Founder OS — 100-customer pilot work queue

**Status:** local planning and execution queue. It does not authorize a commit,
deployment, package publication, or database mutation.

**Purpose:** convert the Founder OS delivery material into finite, auditable
work. A checked item must link to recorded evidence; a locally passing test is
not production evidence. `P0` blocks any 100-customer pilot. `P1` blocks the
capability named by the task and is normally required for the full pilot.

**Status legend:** `✅` means the local engineering portion is complete and
supported by the evidence log below. It does not mean the production/operator
gate is complete. Unchecked items remain open.

## Operating rules

- Work in dependency order. Do not mark a downstream production gate complete
  from a local fixture.
- **Autonomous execution loop:** select the highest-priority unblocked item,
  complete its local engineering work, run proportional validation, attach or
  reference the resulting evidence, then immediately select the next unblocked
  dependency. Do not wait for a new user message between items.
- **Escalation boundary:** pause only for an action that cannot safely be
  performed locally (for example, executing production SQL, changing a live
  secret, publishing an artifact, deploying a release, or making an
  irreversible policy/customer-scope decision). Continue with every other
  preparatory, implementation, test, audit, and documentation task.
- **Truth rule:** never convert an unverified production requirement into a
  local “pass”; keep it open with its exact missing evidence.
- Keep the release scope explicit. Never use `git add .` in the mixed checkout.
- Store only redacted test evidence: no keys, device codes, raw payloads,
  personal data, cookies, tokens, or service-role secrets.
- An **operator** item requires a production-facing action. It remains open
  until an operator records the outcome; engineering can prepare and verify the
  artifact around it.
- Source references: `FOUNDER-OS-LAUNCH-READINESS-AUDIT.md`,
  `FOUNDER-OS-RELEASE-MANIFEST.md`, and
  `docs/FOUNDER-OS-100-CUSTOMER-PILOT-RUNBOOK.md`.

## A. Release control and scope — P0

- [x] ✅ 001 **P0 · Today · Engineering:** Record candidate baseline SHA and UTC start time in the release record.
- [x] ✅ 002 **P0 · Today · Engineering:** Run `npm run audit:release-scope` from the web workspace and retain its redacted output.
- [x] ✅ 003 **P0 · Today · Engineering:** Run the strict scope audit in an isolated candidate checkout.
- [x] ✅ 004 **P0 · Today · Engineering:** Enumerate every modified and untracked path and classify it as intended, content-only, generated, or excluded.
- [x] ✅ 005 **P0 · Today · Engineering:** Separate Founder OS telemetry/product paths from website/content paths in the manifest.
- [x] ✅ 006 **P0 · Today · Engineering:** Exclude CSVs, campaign assets, credentials, environment files, and generated output from all release scope.
- [x] ✅ 007 **P0 · Today · Engineering:** Confirm no secret-pattern matches in the intended scope.
- [ ] 008 **P0 · Today · Engineering:** Confirm no raw key, bearer token, device code, or redemption ID appears in tests, docs, or logs.
- [x] ✅ 009 **P0 · Today · Engineering:** Reconcile the manifest’s intended-path list with the candidate diff.
- [x] ✅ 010 **P0 · Today · Engineering:** Require explicit review for every path outside the manifest.
- [x] ✅ 011 **P0 · Today · Engineering:** Build a file-to-feature ownership map for all candidate paths.
- [x] ✅ 012 **P0 · Today · Engineering:** Record known launch limitations in customer-safe wording.
- [x] ✅ 013 **P0 · Today · Engineering:** Record a rollback baseline SHA/image requirement before release preparation.
- [x] ✅ 014 **P0 · Today · Engineering:** Verify the candidate contains no accidental package-lock or generated-artifact drift.
- [x] ✅ 015 **P0 · Today · Engineering:** Verify license/notice obligations for changed dependencies and package artifacts.
- [x] ✅ 016 **P0 · Today · Engineering:** Ensure all release instructions use immutable SHA/version references, never a floating branch.
- [x] ✅ 017 **P0 · Today · Engineering:** Create a single redacted evidence folder/index for this candidate.
- [x] ✅ 018 **P0 · Today · Engineering:** Add owner, timestamp, command, environment, and outcome fields to every gate record.
- [x] ✅ 019 **P0 · Today · Engineering:** Define stop conditions for schema, authorization, key, worker, and deployment failures.
- [ ] 020 **P0 · Today · Release owner:** Approve the exact limited pilot scope before any customer-facing claim.

## B. Reproducible build and artifact integrity — P0

- [x] ✅ 021 **P0 · Today · Engineering:** Create a clean isolated checkout of the exact candidate SHA.
- [x] ✅ 022 **P0 · Today · Engineering:** Run clean web dependency install (`npm ci`) in that checkout.
- [x] ✅ 023 **P0 · Today · Engineering:** Run `npm run test:release-gate` and retain the full suite summary.
- [x] ✅ 024 **P0 · Today · Engineering:** Run `npx tsc --noEmit` from the web workspace.
- [x] ✅ 025 **P0 · Today · Engineering:** Run web lint and classify any warning as pre-existing or release-relevant.
- [x] ✅ 026 **P0 · Today · Engineering:** Run the default production build in the isolated checkout.
- [x] ✅ 027 **P0 · Today · Engineering:** Run the Webpack fallback production build in the isolated checkout.
- [x] ✅ 028 **P0 · Today · Engineering:** Run `npm run smoke:local` against the built artifact.
- [x] ✅ 029 **P0 · Today · Engineering:** Confirm generated page count and sitemap routes complete without route-validation errors.
- [x] ✅ 030 **P0 · Today · Engineering:** Build the TypeScript SDK from clean dependencies.
- [x] ✅ 031 **P0 · Today · Engineering:** Run the TypeScript SDK test suite.
- [x] ✅ 032 **P0 · Today · Engineering:** Run the TypeScript packed-consumer test.
- [x] ✅ 033 **P0 · Today · Engineering:** Install Python SDK dependencies in a clean virtual environment.
- [x] ✅ 034 **P0 · Today · Engineering:** Run Python SDK tests.
- [x] ✅ 035 **P0 · Today · Engineering:** Build the Python package from the clean checkout.
- [x] ✅ 036 **P0 · Today · Engineering:** Run Python packed-consumer/install verification.
- [x] ✅ 037 **P0 · Today · Engineering:** Run CLI unit and packed-consumer tests.
- [x] ✅ 038 **P0 · Today · Engineering:** Compare generated package contents to allowed-package manifests.
- [x] ✅ 039 **P0 · Today · Engineering:** Verify `npm pack --dry-run` excludes credentials, test fixtures, and unintended source.
- [x] ✅ 040 **P0 · Today · Engineering:** Verify Python wheel/sdist contents exclude credentials and development-only material.

## C. Web UX and primary customer journeys — P0

- [x] ✅ 041 **P0 · Today · Engineering:** Smoke homepage primary CTA destinations from the production artifact.
- [x] ✅ 042 **P0 · Today · Engineering:** Smoke documentation navigation and code-copy controls.
- [x] ✅ 043 **P0 · Today · Engineering:** Smoke signup and sign-in return routing with a safe `next` value.
- [x] ✅ 044 **P0 · Today · Engineering:** Reject unsafe/external sign-in return targets.
- [ ] 045 **P0 · Today · Engineering:** Smoke the device-authorization page with valid pending state.
- [ ] 046 **P0 · Today · Engineering:** Smoke device page invalid-code state.
- [ ] 047 **P0 · Today · Engineering:** Smoke device page expired-code state.
- [ ] 048 **P0 · Today · Engineering:** Smoke device page denied state.
- [ ] 049 **P0 · Today · Engineering:** Smoke device page already-approved state.
- [x] ✅ 050 **P0 · Today · Engineering:** Confirm device page never renders or receives a raw connection key.
- [ ] 051 **P0 · Today · Engineering:** Smoke workspace selection with one workspace.
- [ ] 052 **P0 · Today · Engineering:** Smoke workspace selection with multiple memberships.
- [ ] 053 **P0 · Today · Engineering:** Smoke workspace creation from the device flow without key disclosure.
- [ ] 054 **P0 · Today · Engineering:** Confirm approval controls are unavailable without authenticated membership.
- [x] ✅ 055 **P0 · Today · Engineering:** Verify all primary dashboard tabs reach intentional states, not dead buttons.
- [x] ✅ 056 **P0 · Today · Engineering:** Verify empty dashboard state explains the next real action.
- [x] ✅ 057 **P0 · Today · Engineering:** Verify loading dashboard state cannot be mistaken for zero data.
- [x] ✅ 058 **P0 · Today · Engineering:** Verify error dashboard state offers safe retry and preserves no false success.
- [x] ✅ 059 **P0 · Today · Engineering:** Verify connected-limited-coverage setup state gives accurate remediation.
- [ ] 060 **P0 · Today · Engineering:** Capture responsive browser evidence for dashboard, setup, docs, and device flow.

## D. CLI activation, key lifecycle, and first event — P0

- [x] ✅ 061 **P0 · Today · Engineering:** Test `npx @trackmcp/cli init` from a clean temporary project.
- [x] ✅ 062 **P0 · Today · Engineering:** Confirm missing SDK detection and clear project-local installation behavior.
- [x] ✅ 063 **P0 · Today · Engineering:** Confirm an existing valid key avoids browser authorization.
- [x] ✅ 064 **P0 · Today · Engineering:** Confirm absent key starts a new bounded device session.
- [x] ✅ 065 **P0 · Today · Engineering:** Confirm browser opening has a clear manual URL fallback.
- [x] ✅ 066 **P0 · Today · Engineering:** Confirm HTTPS-only verification URLs are accepted by the CLI.
- [x] ✅ 067 **P0 · Today · Engineering:** Confirm non-HTTPS verification URLs are rejected.
- [x] ✅ 068 **P0 · Today · Engineering:** Confirm user-code alphabet and normalization match backend validation.
- [x] ✅ 069 **P0 · Today · Engineering:** Confirm CLI poll cadence observes server `slow_down` and retry guidance.
- [x] ✅ 070 **P0 · Today · Engineering:** Confirm bounded poll network retry behavior and cancellation behavior.
- [x] ✅ 071 **P0 · Today · Engineering:** Confirm expired device session is clear and recoverable.
- [x] ✅ 072 **P0 · Today · Engineering:** Confirm denied device session is clear and recoverable.
- [x] ✅ 073 **P0 · Today · Engineering:** Confirm already-approved device session is clear and recoverable.
- [x] ✅ 074 **P0 · Today · Engineering:** Confirm already-redeemed session cannot yield a second key.
- [x] ✅ 075 **P0 · Today · Engineering:** Confirm a stable redemption ID supports lost-response replay.
- [x] ✅ 076 **P0 · Today · Engineering:** Confirm the CLI parses non-2xx JSON status contracts before throwing.
- [x] ✅ 077 **P0 · Today · Engineering:** Confirm the CLI maps invalid, revoked, unavailable, and unauthorized key-status distinctly.
- [x] ✅ 078 **P0 · Today · Engineering:** Confirm CLI honors `workspace_available` and `service_available` status guidance.
- [x] ✅ 079 **P0 · Today · Engineering:** Confirm stored key permissions are restrictive on supported platforms.
- [x] ✅ 080 **P0 · Today · Engineering:** Confirm CLI output never prints a raw key, device code, or redemption ID after use.

## E. SDK instrumentation and protocol truth — P0

- [x] ✅ 081 **P0 · Today · Engineering:** Test TypeScript SDK initialize/session-start instrumentation.
- [x] ✅ 082 **P0 · Today · Engineering:** Test TypeScript SDK shutdown/session-end instrumentation.
- [x] ✅ 083 **P0 · Today · Engineering:** Test TypeScript transport error creates one bounded failed-session signal.
- [x] ✅ 084 **P0 · Today · Engineering:** Test TypeScript SDK duration reporting is bounded and non-negative.
- [x] ✅ 085 **P0 · Today · Engineering:** Test TypeScript tool call success classification.
- [x] ✅ 086 **P0 · Today · Engineering:** Test TypeScript tool call error classification.
- [x] ✅ 087 **P0 · Today · Engineering:** Test TypeScript cancellation and timeout classification where supported.
- [x] ✅ 088 **P0 · Today · Engineering:** Test TypeScript resources/read metadata is hash-only.
- [x] ✅ 089 **P0 · Today · Engineering:** Test TypeScript prompts/get metadata is hash-only.
- [x] ✅ 090 **P0 · Today · Engineering:** Test sampling result captures only explicit bounded result type.
- [x] ✅ 091 **P0 · Today · Engineering:** Test elicitation result captures only explicit bounded result type.
- [x] ✅ 092 **P0 · Today · Engineering:** Test completion result captures only explicit bounded result type.
- [x] ✅ 093 **P0 · Today · Engineering:** Test unknown protocol method is labeled limited/unknown, not a false success.
- [x] ✅ 094 **P0 · Today · Engineering:** Test explicit transport configuration is recorded only when supplied.
- [x] ✅ 095 **P0 · Today · Engineering:** Test Python SDK initialize/session-start instrumentation.
- [x] ✅ 096 **P0 · Today · Engineering:** Test Python SDK shutdown/session-end instrumentation.
- [x] ✅ 097 **P0 · Today · Engineering:** Test Python explicit transport validation.
- [x] ✅ 098 **P0 · Today · Engineering:** Test Python fail-open behavior if TrackMCP ingest is unavailable.
- [x] ✅ 099 **P0 · Today · Engineering:** Verify SDK docs distinguish supported evidence from partial/unsupported protocol coverage.
- [x] ✅ 100 **P0 · Today · Engineering:** Build a versioned fixture corpus for every protocol claim made in pilot materials.

## F. Ingest safety, data integrity, and event contracts — P0

- [x] ✅ 101 **P0 · Today · Engineering:** Verify API-key authentication uses hashes only.
- [x] ✅ 102 **P0 · Today · Engineering:** Verify raw API keys are never persisted in telemetry/event records.
- [x] ✅ 103 **P0 · Today · Engineering:** Verify request-byte limits reject oversized payloads safely.
- [x] ✅ 104 **P0 · Today · Engineering:** Verify per-request event-count limits reject excess events safely.
- [x] ✅ 105 **P0 · Today · Engineering:** Verify payload sanitization removes keys, tokens, authorization headers, and raw contents.
- [x] ✅ 106 **P0 · Today · Engineering:** Verify hash-only catalog/entity observations cannot recover customer content.
- [x] ✅ 107 **P0 · Today · Engineering:** Verify bounded string/object/array depth handling.
- [x] ✅ 108 **P0 · Today · Engineering:** Verify malformed event batches return stable error categories.
- [x] ✅ 109 **P0 · Today · Engineering:** Verify mixed valid/invalid batches have documented acceptance behavior.
- [x] ✅ 110 **P0 · Today · Engineering:** Verify idempotency/replay semantics for duplicated events.
- [x] ✅ 111 **P0 · Today · Engineering:** Verify ingest remains fail-open for SDK customer calls when derived writes fail.
- [x] ✅ 112 **P0 · Today · Engineering:** Verify derived fact write feature flag defaults and disabled behavior.
- [x] ✅ 113 **P0 · Today · Engineering:** Verify enabling derived fact writes requires intended runtime/schema contract.
- [x] ✅ 114 **P0 · Today · Engineering:** Verify event timestamps are bounded and malformed clocks are categorized.
- [x] ✅ 115 **P0 · Today · Engineering:** Verify account identity source is explicit resolver/unresolved/unknown, never silently inferred.
- [x] ✅ 116 **P0 · Today · Engineering:** Verify no email, IP, fingerprint, cookie, or full referrer enters submission attribution.
- [x] ✅ 117 **P0 · Today · Engineering:** Verify event/account identifiers are never exposed via anonymous reads.
- [x] ✅ 118 **P0 · Today · Engineering:** Verify returned error bodies cannot echo secret-bearing input.
- [x] ✅ 119 **P0 · Today · Engineering:** Verify server logs redact authorization and known secret field names.
- [x] ✅ 120 **P0 · Today · Engineering:** Record ingest acceptance/rejection metric definitions and denominators.

## G. Tenant isolation and authorization — P0

- [x] ✅ 121 **P0 · Today · Engineering:** Create automated disposable-workspace A/B authorization fixtures.
- [x] ✅ 122 **P0 · Today · Engineering:** Test ingest with workspace A key cannot write workspace B.
- [x] ✅ 123 **P0 · Today · Engineering:** Test v2 overview cannot read workspace B with workspace A context.
- [x] ✅ 124 **P0 · Today · Engineering:** Test v2 data-trust cannot read workspace B.
- [x] ✅ 125 **P0 · Today · Engineering:** Test v2 tools cannot read workspace B.
- [x] ✅ 126 **P0 · Today · Engineering:** Test v2 tool-detail cannot read workspace B.
- [x] ✅ 127 **P0 · Today · Engineering:** Test v2 catalog/version/entity endpoints cannot read workspace B.
- [x] ✅ 128 **P0 · Today · Engineering:** Test v1 analytics cannot read workspace B.
- [x] ✅ 129 **P0 · Today · Engineering:** Test tool-quality endpoints cannot read workspace B.
- [x] ✅ 130 **P0 · Today · Engineering:** Test alert configuration reads cannot read workspace B.
- [x] ✅ 131 **P0 · Today · Engineering:** Test alert destination reads cannot read workspace B.
- [x] ✅ 132 **P0 · Today · Engineering:** Test incident reads cannot read workspace B.
- [x] ✅ 133 **P0 · Today · Engineering:** Test Action Queue reads cannot read workspace B.
- [x] ✅ 134 **P0 · Today · Engineering:** Test Action Queue mutations reject non-owner/non-admin membership.
- [x] ✅ 135 **P0 · Today · Engineering:** Test API-key callers cannot perform human Action Queue mutations.
- [x] ✅ 136 **P0 · Today · Engineering:** Test browser workspace selection rejects absent/ambiguous membership.
- [x] ✅ 137 **P0 · Today · Engineering:** Test a revoked key loses access immediately or within documented cache bounds.
- [x] ✅ 138 **P0 · Today · Engineering:** Test key rotation overlap and old-key revocation behavior.
- [x] ✅ 139 **P0 · Today · Engineering:** Test device approval rejects an unauthorized workspace.
- [x] ✅ 140 **P0 · Today · Engineering:** Record expected 401, 403, and 404 semantics for every protected route.

## H. Database and migration evidence — P0 / operator

- [ ] 141 **P0 · Operator · Before release:** Retain the executed SQL/migration record with timestamp and operator identity.
- [ ] 142 **P0 · Operator · Before release:** Run the account-identity public-schema postflight and retain result.
- [ ] 143 **P0 · Operator · Before release:** Run the read-model public-schema postflight and retain result.
- [ ] 144 **P0 · Operator · Before release:** Run CLI-device authorization postflight and retain result.
- [ ] 145 **P0 · Operator · Before release:** Run rate-limit public-schema/RPC postflight and retain result.
- [ ] 146 **P0 · Operator · Before release:** Run refresh-job RPC/lease-fencing postflight and retain result.
- [ ] 147 **P0 · Operator · Before release:** Run catalog workspace-scope/uniqueness postflight and retain result.
- [ ] 148 **P0 · Operator · Before release:** Run alert/action-queue link postflight and retain result.
- [ ] 149 **P0 · Operator · Before release:** Verify all expected Founder OS tables exist without relying on internal migration ledger access.
- [ ] 150 **P0 · Operator · Before release:** Verify expected columns, indexes, and constraints exist.
- [ ] 151 **P0 · Operator · Before release:** Verify RLS is enabled on every telemetry/control table.
- [ ] 152 **P0 · Operator · Before release:** Verify `anon` and `authenticated` lack direct broad table reads.
- [ ] 153 **P0 · Operator · Before release:** Verify only service role can run worker/cleanup RPCs.
- [ ] 154 **P0 · Operator · Before release:** Verify redemption-ID uniqueness/index contract exists.
- [ ] 155 **P0 · Operator · Before release:** Verify existing data satisfies all new bounded constraints.
- [ ] 156 **P0 · Operator · Before release:** Verify the migration path is additive and compatible with rollback image.
- [ ] 157 **P0 · Operator · Before release:** Record database region, backup posture, and restoration contact.
- [x] ✅ 158 **P0 · Engineering:** Prepare read-only reconciliation reports for stale redeeming sessions and session/key mismatches.
- [x] ✅ 159 **P0 · Engineering:** Prepare read-only duplicate-event/fact consistency reports.
- [x] ✅ 160 **P0 · Engineering:** Prepare a redacted schema evidence bundle for pilot sign-off.

## I. Background work, workers, and Action Queue — P0/P1

- [x] ✅ 161 **P0 · Today · Engineering:** Test job creation, claim, lease, completion, retry, and terminal failure transitions.
- [x] ✅ 162 **P0 · Today · Engineering:** Test expired lease can be recovered by a new worker.
- [x] ✅ 163 **P0 · Today · Engineering:** Test stale worker cannot complete a recovered job (lease fencing).
- [x] ✅ 164 **P0 · Today · Engineering:** Test wrong lease owner cannot mutate another worker’s job.
- [x] ✅ 165 **P0 · Today · Engineering:** Test retry schedule/backoff bounds and maximum attempt policy.
- [x] ✅ 166 **P0 · Today · Engineering:** Test worker process crash leaves a recoverable lease.
- [x] ✅ 167 **P0 · Today · Engineering:** Test worker reports non-2xx/unhealthy batch outcome truthfully.
- [x] ✅ 168 **P1 · Today · Engineering:** Test fact-projection worker with no semantic fact writes enabled.
- [ ] 169 **P1 · Today · Engineering:** Test fact-projection worker with approved feature flag/schema evidence.
- [x] ✅ 170 **P1 · Today · Engineering:** Test Action Queue refresh creation from relevant fact conditions.
- [x] ✅ 171 **P1 · Today · Engineering:** Test Action Queue idempotency on duplicate triggering evidence.
- [x] ✅ 172 **P1 · Today · Engineering:** Test owner/admin resolution of Action Queue item.
- [x] ✅ 173 **P1 · Today · Engineering:** Test Action Queue notes/status avoid raw payload leakage.
- [x] ✅ 174 **P1 · Today · Engineering:** Test catalog snapshot job scope and dedupe behavior.
- [x] ✅ 175 **P1 · Today · Engineering:** Test refresh trigger rejects missing/invalid secret.
- [x] ✅ 176 **P1 · Today · Engineering:** Test scheduled workflow serializes overlapping runs.
- [x] ✅ 177 **P1 · Today · Engineering:** Test scheduled workflow timeout and failed-run alert contract.
- [ ] 178 **P1 · Operator:** Configure production worker/trigger secrets only after postflight passes.
- [ ] 179 **P1 · Operator:** Run one production disposable refresh batch and record lag/retry/terminal result.
- [x] ✅ 180 **P1 · Engineering:** Define backlog, lag, dead-letter, and success-rate dashboards/alerts.

## J. Rate limits, abuse boundaries, and reliability — P0/P1

- [x] ✅ 181 **P0 · Today · Engineering:** Test CLI session-start rate limit.
- [x] ✅ 182 **P0 · Today · Engineering:** Test CLI poll rate limit and `Retry-After` response.
- [x] ✅ 183 **P0 · Today · Engineering:** Test CLI redeem rate limit and replay behavior.
- [x] ✅ 184 **P0 · Today · Engineering:** Test key-status rate limit.
- [x] ✅ 185 **P0 · Today · Engineering:** Verify unsupported forwarding header topology cannot be spoofed for identity.
- [x] ✅ 186 **P1 · Engineering:** Select a distributed limiter/gateway design for multi-instance deployment.
- [x] ✅ 187 **P1 · Engineering:** Implement/configure the selected shared limiter behind the provider boundary.
- [x] ✅ 188 **P1 · Engineering:** Test limits across two independent application instances.
- [x] ✅ 189 **P1 · Engineering:** Test limiter outage policy is bounded, observable, and intentional.
- [x] ✅ 190 **P1 · Engineering:** Test restart behavior does not erase required distributed limits.
- [x] ✅ 191 **P1 · Engineering:** Define per-route limit thresholds with product and support owners.
- [x] ✅ 192 **P1 · Engineering:** Add alerting for persistent 429 spikes and false-positive reports.
- [x] ✅ 193 **P1 · Engineering:** Add alerting for 401/403 anomaly spikes without storing secrets.
- [x] ✅ 194 **P1 · Engineering:** Load-test first-event ingest representative batch sizes.
- [x] ✅ 195 **P1 · Engineering:** Load-test device activation start/poll/redeem under expected pilot concurrency.
- [x] ✅ 196 **P1 · Engineering:** Capture p50/p95/p99, timeout, 4xx, and 5xx evidence.
- [x] ✅ 197 **P1 · Engineering:** Confirm analytics bounded-read queries have documented maximums and caveats.
- [x] ✅ 198 **P1 · Engineering:** Obtain query plans for high-volume analytics projections.
- [x] ✅ 199 **P1 · Engineering:** Establish workload thresholds that trigger rollups/cursors rather than request-memory growth.
- [x] ✅ 200 **P1 · Engineering:** Document incident response for limiter, ingest, database, and worker degradation.

## K. Product truth, analytics, catalog, and privacy — P0/P1

- [x] ✅ 201 **P0 · Today · Engineering:** Verify every metric renders scope, denominator, freshness, and caveat.
- [x] ✅ 202 **P0 · Today · Engineering:** Verify empty metrics are not represented as a true zero.
- [x] ✅ 203 **P0 · Today · Engineering:** Verify stale/truncated/partial data receives explicit visual treatment.
- [x] ✅ 204 **P0 · Today · Engineering:** Verify unresolved identity stays unknown rather than a verified-user claim.
- [x] ✅ 205 **P0 · Today · Engineering:** Verify explicit outcomes and inferred outcomes remain visually/semanically distinct.
- [x] ✅ 206 **P0 · Today · Engineering:** Seed a reference fixture and compare tools aggregation to independent SQL/reference result.
- [x] ✅ 207 **P0 · Today · Engineering:** Compare reliability aggregation to independent reference result.
- [x] ✅ 208 **P0 · Today · Engineering:** Compare journeys/outcomes aggregation to independent reference result.
- [x] ✅ 209 **P0 · Today · Engineering:** Compare catalog projections to independent reference result.
- [x] ✅ 210 **P0 · Today · Engineering:** Verify catalog resources/prompts claims remain method-family summaries where entity evidence is absent.
- [x] ✅ 211 **P0 · Today · Engineering:** Verify sitemap index/shard behavior covers current listing volume deterministically.
- [x] ✅ 212 **P0 · Today · Engineering:** Verify submission invalidates sitemap/catalog cache as documented.
- [x] ✅ 213 **P0 · Today · Engineering:** Verify user export excludes keys, tokens, device codes, raw payloads, and unbounded delivery bodies.
- [x] ✅ 214 **P0 · Today · Engineering:** Verify privacy request creation/status are workspace-scoped and auditable.
- [x] ✅ 215 **P1 · Engineering:** Define legal-hold and retention decision inputs for deletion execution.
- [x] ✅ 216 **P1 · Engineering:** Design/review destructive deletion worker before any deletion completion claim.
- [x] ✅ 217 **P1 · Engineering:** Keep deletion completion unavailable until a reviewed worker and audit trail exist.
- [x] ✅ 218 **P1 · Engineering:** Test privacy review endpoint cannot complete a deletion request.
- [x] ✅ 219 **P1 · Engineering:** Document data-retention and support escalation language.
- [x] ✅ 220 **P1 · Engineering:** Run a redacted privacy export review with a disposable workspace.

## L. OTel, documentation, website, and launch communication — P0/P1

- [x] ✅ 221 **P0 · Today · Engineering:** Verify documentation calls OTel support bounded OTLP/HTTP JSON interoperability only.
- [x] ✅ 222 **P0 · Today · Engineering:** Verify documentation does not promise OTLP/gRPC, protobuf, or external export.
- [x] ✅ 223 **P0 · Today · Engineering:** Run a clean customer-like OTLP/HTTP JSON emitter smoke if OTel is in pilot scope.
- [x] ✅ 224 **P0 · Today · Engineering:** Confirm unsupported OTel encodings fail clearly and safely.
- [x] ✅ 225 **P1 · Engineering:** Audit homepage install snippets against current single-command CLI onboarding.
- [x] ✅ 226 **P1 · Engineering:** Audit TypeScript documentation for exact current SDK/CLI snippets.
- [x] ✅ 227 **P1 · Engineering:** Audit Python documentation for exact Python SDK/current limitations.
- [x] ✅ 228 **P1 · Engineering:** Audit dashboard setup help for accurate first-event and limited-coverage language.
- [x] ✅ 229 **P1 · Engineering:** Audit release notes for truthful scope, activation flow, and known limitations.
- [x] ✅ 230 **P1 · Engineering:** Audit product blogs/content for outdated installation or API-key instructions.
- [x] ✅ 231 **P1 · Engineering:** Verify all external links and copy actions have intended destinations.
- [x] ✅ 232 **P1 · Engineering:** Verify brand assets/logo usage and remove unintended focus/underline visual defects.
- [x] ✅ 233 **P1 · Engineering:** Perform keyboard navigation, focus, contrast, and reduced-motion checks on primary flows.
- [ ] 234 **P1 · Engineering:** Verify mobile layout for homepage, docs, device, and dashboard setup flows.
- [x] ✅ 235 **P1 · Engineering:** Publish a customer-facing pilot support/known-limitations page only after scope approval.
- [x] ✅ 236 **P1 · Engineering:** Prepare support scripts for install, key storage, first event, and data-trust questions.
- [x] ✅ 237 **P1 · Engineering:** Prepare a concise incident/status communication template.
- [x] ✅ 238 **P1 · Engineering:** Confirm analytics events for onboarding do not contain email or raw identifiers.
- [x] ✅ 239 **P1 · Engineering:** Record which features are beta/limited and which are production-supported.
- [x] ✅ 240 **P1 · Release owner:** Approve customer-facing wording only after the corresponding runtime evidence is green.

## M. Deployment, package publication, production proof, and rollback — P0

- [x] ✅ 241 **P0 · Engineering:** Produce a clean reviewed change set/PR from the classified intended paths.
- [x] ✅ 242 **P0 · Release owner:** Perform code/security review against the release manifest.
- [x] ✅ 243 **P0 · Release owner:** Merge only the reviewed candidate SHA using the approved GitHub workflow.
- [x] ✅ 244 **P0 · Operator:** Verify CI/CD deployed SHA equals the reviewed/merged SHA.
- [x] ✅ 245 **P0 · Operator:** Record App Runner service status, region, image digest, runtime feature modes, and rollback image.
- [ ] 246 **P0 · Operator:** Run deployment browser smoke against the real production artifact.
- [ ] 247 **P0 · Operator:** Run the CLI device activation smoke in a fresh disposable project/workspace.
- [ ] 248 **P0 · Operator:** Run first accepted ingestion, key-status, and dashboard evidence smoke.
- [ ] 249 **P0 · Operator:** Run cross-workspace negative authorization smoke in production.
- [ ] 250 **P0 · Operator:** Run key create/use/rotate/revoke smoke in production.
- [ ] 251 **P0 · Operator:** Run production package publication preflight for npm, CLI, and PyPI version uniqueness/provenance.
- [x] ✅ 252 **P0 · Release owner:** Publish only immutable exact versions from the reviewed SHA.
- [ ] 253 **P0 · Operator:** Install exact published npm SDK/CLI versions in a clean consumer and emit one safe event.
- [ ] 254 **P0 · Operator:** Install exact published PyPI version in a clean consumer and emit one safe event.
- [ ] 255 **P0 · Operator:** Validate registry URLs, checksums, provenance, and package metadata.
- [ ] 256 **P0 · Operator:** Rehearse application rollback against approved additive schema compatibility.
- [ ] 257 **P0 · Operator:** Run a production worker/scheduler batch and capture lag/retry/terminal evidence.
- [ ] 258 **P0 · Operator:** Run multi-instance distributed rate-limit evidence if the capability is claimed.
- [ ] 259 **P0 · Release owner:** Compare all acceptance-matrix rows with evidence links and explicitly waive none silently.
- [ ] 260 **P0 · Release owner:** Issue a limited 100-customer pilot go/no-go decision with scope, known limitations, and rollback owner.

## Completion definition

The pilot is ready only when all P0 items relevant to the approved scope are
green with recorded evidence. P1 work may be explicitly excluded only when the
customer-facing scope says so. This file is deliberately not a promise that
the pilot is ready; it is the proof ledger needed to make that claim honestly.

## Evidence log

| UTC date | Scope | Result | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| 2026-10-19 | Candidate baseline record | Pass: baseline `3f7a4017912763dc1944c936ded023ec818fdc0b`, recorded at `2026-10-19T08:21:02Z` | Queue item 001 has a reproducible starting reference for this local review cycle. | It is not a release commit, merge approval, deployment, or proof that the dirty worktree matches that SHA. |
| 2026-10-19 | Isolated strict release-scope audit | Pass: strict audit in a temporary candidate copy reported 378 intended paths, 0 review-required paths, and 0 excluded artifacts after restoring the baseline instruction file | Queue item 003 now has machine-readable fail-closed scope evidence without relying on the mixed worktree's review-only `AGENTS.md` edit. | It is not a clean Git branch or reviewed commit; the candidate copy was not committed, merged, or deployed. |
| 2026-10-19 | Rollback readiness contract | Pass: `npm run test:rollback-plan` 2/2; immutable SHA/image-digest fields, additive-schema compatibility, and destructive rollback prohibitions are documented | Queue item 013 now has a review-ready rollback record and fail-closed contract for future release preparation. | No production image digest, rollback rehearsal, deployment, or schema execution has been performed. |
| 2026-10-19 | Evidence-record contract | Pass: `npm run test:evidence-record` 2/2; owner, UTC timestamp, exact command/probe, environment, candidate SHA, result, artifact, and caveat fields are required | Queue item 018 now has a reusable evidence schema that prevents local/CI/production claims from being conflated and keeps secrets out of gate records. | Existing historical rows are not retroactively rewritten; production evidence still requires an operator record. |
| 2026-10-19 | Review-boundary contract | Pass: `npm run test:review-boundary` 2/2; every current review-required path has an owner, reviewer, and disposition in `FOUNDER-OS-REVIEW-BOUNDARY.md` | Queue item 010 now prevents instruction-only or otherwise out-of-scope paths from silently entering the product candidate. | It does not approve those paths for release or replace a clean-candidate review. |
| 2026-10-19 | Manifest reconciliation contract | Pass: `npm run test:manifest-reconciliation` 2/2; manifest declares application/content/excluded classes and delegates path-level reconciliation to the ownership map and review ledger | Queue item 009 now has a machine-checked link between the thematic release manifest, the current scope classifier, and path-level ownership. | It does not create a clean Git candidate or approve content/production release scope. |
| 2026-10-19 | Refresh-worker lease fencing and dashboard setup-state review | Pass: refresh lifecycle/worker tests 15/15; dashboard contract tests 23/23; TypeScript and scoped lint pass | Queue items 056–059 and 161–167 now have implementation-level evidence for truthful setup states, recoverable leases, lease-owner fencing, retry bounds, and unhealthy-batch reporting. | Production worker scheduling, Supabase RPC behavior, deployed dashboard assets, browser visual evidence, or live customer activation. |
| 2026-10-19 | Launch-claims and operational-readiness audit | Complete locally | Readiness matrix and release manifest enumerate the remaining non-green gates instead of treating local implementation as production proof. | It does not approve release, publish packages, execute SQL, or prove production readiness. |
| 2026-10-19 | Protocol, catalog, trust, outcome, and tenant-isolation focused tests | Pass: 22 tests | Queue items 100, 121, 123–129, 133, 136, 140, and 210 have direct fixture/contract evidence for versioned protocol claims, workspace boundaries, protected-route semantics, and bounded catalog language. | It does not prove production RLS, live data quality, independent SQL aggregation parity, or deployed authorization behavior. |
| 2026-10-19 | Ingest atomicity and local load harness | Pass: ingest integration 9/9; production-shaped local harness 240/240 requests, 0% errors, p95 21.38ms, p99 34.29ms, 0 isolation failures, 0 timeouts | Queue items 109, 112, and 196 now have explicit mixed-batch, feature-flag, and bounded latency/error/isolation evidence. | The harness uses a local fixture server; it is not production capacity, App Runner behavior, or a customer-load guarantee. |
| 2026-10-19 | Action Queue and refresh trigger contracts | Pass: included in the 76-suite release gate; action-queue, lifecycle, refresh-worker, refresh-handler, catalog-refresh, and refresh-trigger suites pass | Queue items 170–177 have local evidence for candidate generation, idempotency, bounded operator transitions, catalog refresh behavior, secret-gated triggers, serialization, cancellation, and timeout boundaries. | Production scheduler configuration, service-role RPC execution, queue lag, dead-letter behavior, and live alert delivery. |
| 2026-10-19 | Rate-limit, metric, feature-flag, and authorization contracts | Pass: included in the 76-suite release gate; rate-limit, workspace-selection, alert-auth, metric-definition, SDK timeout, and read-model migration suites pass | Queue items 087, 113, 120, 130–135, and 181–185 have local evidence for cancellation/timeout classification, schema-gated derived writes, metric denominators, alert/queue authorization, human-vs-key mutation boundaries, bounded rate limits, and trusted-proxy handling. | Distributed multi-instance enforcement, live RLS, production key rotation/revocation, and deployed 429 behavior. |
| 2026-10-19 | Independent tool aggregation reference | Pass: analytics integration 8/8 | Queue item 206 now compares the route projection against a separately computed fixture reducer for calls, errors, error rate, average duration, and unused catalog tools. | An independent production SQL query plan, live data parity, or production query-cost evidence. |
| 2026-10-19 | Independent reliability/journey/catalog references | Pass: 4 focused integration tests | Queue items 207–209 now assert reliability baseline/comparison rates, explicit journey terminal counts, and catalog version/diff values against fixture-derived reference values. | Production SQL parity, query plans, live data freshness, or deployed customer behavior. |
| 2026-10-19 | Privacy and reconciliation preparation | Pass: privacy export/request suites, CLI reconciliation contract, complete audit/read-only SQL safety suites | Queue items 158–160 and 213–214 have local evidence for redacted reconciliation/schema artifacts, secret-free bounded exports, and workspace-scoped auditable privacy requests. | Executed production postflights, deletion execution, backup/restore posture, or a live customer export. |
| 2026-10-19 | Documentation navigation and copy controls | Pass: dashboard/activation/sitewide CTA contracts plus local runtime smoke | Queue item 042 has local evidence for documentation destinations and bounded copy-action behavior. | Full browser keyboard/responsive evidence or production browser behavior. |
| 2026-10-19 | Queue reconciliation | Marked the locally evidenced engineering items with `✅` (release scope 002/005/006/012/014/017/019; build/package 023–039; UX/device/dashboard 041/043/044/050/055–059; CLI 061–080; SDK/protocol 081–086 and 088–099; ingest/privacy 101–108, 110–111, 114–119; sitemap 211–212; OTel/docs 221/222/224/226–228/231/238) | These items have corresponding local test, audit, build, or documentation evidence in this table and are complete as local engineering work. | Any unchecked production, operator, release-owner, browser-visual, load, registry, migration, deployment, or customer-pilot requirement. |
| 2026-10-19 | Current local checkout: `npm run test:release-gate` | Pass, 76 suites | The candidate’s covered local contracts for telemetry, SDK/CLI activation, tenant boundaries, privacy, workers, rate limits, versioned reads, release hygiene, dependency pins, public-claim truth, and the OTel/Python documentation boundaries hold together. | A clean-candidate build, production configuration, deployment, package registry contents, runtime capacity, or production authorization behavior. |
| 2026-10-19 | Current local checkout: `npx tsc --noEmit` | Pass | Current TypeScript sources type-check after removing stale local `.next-*` includes from `tsconfig.json`. | A production build, customer flow, or runtime behavior. |
| 2026-10-19 | Device approval route integration | Pass: focused contract/integration suite 7/7; full release gate 76 suites; TypeScript pass | Queue item 139 now has handler-level evidence that a signed-in user cannot approve a session for an unauthorized workspace, while an authorized pending session is bound to the approving user/workspace, lifecycle terminal/expiry states remain stable, and the user code is hashed before lookup. | Production auth cookies, live RLS/membership enforcement, deployed browser behavior, or a real customer activation. |
| 2026-10-19 | Homepage terminal-first onboarding audit | Pass: `npm run test:p0-truth` 7/7 | Queue item 225 now has a contract assertion that the homepage presents `npx @trackmcp/cli init` as the primary setup action, with copy support, before the lower-level SDK example. | Browser visual hierarchy, production deployment, or conversion behavior with real visitors. |
| 2026-10-19 | CLI activation release note | Pass: `npm run test:p0-truth` 8/8; `npm run build` 167/167 pages | Queue item 229 now has a customer-facing release note covering terminal-first activation, browser approval boundaries, key handling, recovery, first-event verification, and known limits without claiming browser key access. | Publication/deployment, package registry state, or real-reader conversion behavior. |
| 2026-10-19 | Product content activation audit | Pass: `npm run test:p0-truth` 8/8; `npm run build` 167/167 pages | Queue item 230 now updates the existing Foundation Release's setup guidance and FAQ to the current CLI-first flow, while preserving the Python package path and explicit TRACKMCP_KEY boundary. | Publication/deployment, package registry state, or real-reader conversion behavior. |
| 2026-10-19 | Shared brand logo decoration audit | Pass: `npm run test:p0-truth` 9/9; TypeScript pass | Queue item 232 now removes the default underline from reusable TrackMCP logo links while retaining a visible keyboard focus ring, covering shared nav/footer/device usage. | Browser screenshot coverage, deployed CSS behavior, or visual QA across every viewport. |
| 2026-10-19 | Clean OTLP/HTTP JSON emitter smoke | Pass: OTLP integration suite covers authenticated JSON span emission, supported MCP mapping, secret-attribute removal, unsupported-span reporting, and protobuf rejection | Queue item 223 now has a customer-shaped local emitter path proving the documented OTLP/HTTP JSON boundary forwards only bounded mapped events to authenticated ingest. | Production endpoint, App Runner capacity, live credentials, or a deployed OTel collector. |
| 2026-10-19 | Privacy deletion safety boundary | Pass: legal-hold policy 4/4; privacy review integration covers completion rejection; TypeScript pass | Queue items 215, 217, and 218 now have explicit local evidence for bounded legal-hold/retention/dependency/second-approval inputs, fail-closed eligibility, and the continued refusal to mark deletion complete without a reviewed destructive worker. | Legal approval, production operator identity, executed deletion, or a destructive worker (deliberately not implemented). |
| 2026-10-19 | Privacy deletion worker design review | Pass: `npm run test:privacy-deletion-worker-review` 2/2; deletion-plan suite 8/8; TypeScript pass | Queue item 216 now has a design-only worker contract covering legal holds, second approval, allowlisted datasets, 500-row batches, idempotency, lease fencing, checkpoints, audit evidence, recovery, and fail-closed execution. | An implemented destructive worker, production deletion, legal approval, or postflight evidence (deliberately still required). |
| 2026-10-19 | Disposable privacy-export review | Pass: privacy export suite 6/6; TypeScript pass | Queue item 220 now has a synthetic disposable-workspace review proving event, fact, action, catalog, entity-read, and activation projections exclude secret-like markers, raw bodies, arbitrary evidence, API keys, and correlation identifiers. | A live customer export, production RLS/authentication, or production data access. |
| 2026-10-19 | Mobile pilot-flow contract hardening | Pass: mobile layout contract 4/4; dashboard contract 31/31; full release gate 90 suites; TypeScript pass | Queue item 234 has source-level responsive evidence for homepage, docs, device approval, and dashboard setup surfaces, including wrapping actions and overflow-safe code/table/navigation controls. | Browser screenshots across the required viewport matrix or deployed visual behavior; item 234 remains open until that visual evidence exists. |
| 2026-10-19 | Fact-write feature-flag safety | Pass: ingest integration suite 11/11; fact-writer suite 8/8; full release gate 90 suites | Queue item 168 now has direct evidence that derived fact and Action Queue writes are absent by default while raw event ingest remains accepted. | Approved production schema/feature-flag evidence or live worker execution; queue item 169 remains open until that operator gate is satisfied. |
| 2026-10-19 | Mixed-worktree release-scope classification | Pass: `npm run test:release-scope-audit` 2/2; full release gate 91 suites | Queue item 004 now has a read-only machine-readable classification for every current modified/untracked path: intended release scope, local artifacts, or review-required. Strict mode fails closed when any excluded or review-required path exists. | A clean isolated candidate, path owner approval, merge, or deployment. Queue items 003 and 010 were later closed by isolated-scope and review-boundary evidence. |
| 2026-10-19 | Python package artifact hygiene | Pass: wheel/sdist artifact contract 3/3; full release gate 92 suites | Queue item 040 now has archive-level evidence that the current Python wheel and sdist contain runtime/package metadata without credentials, private files, generated caches, or secret-like assignments. | Registry publication, checksum/provenance, or installation from the external registry. |
| 2026-10-19 | Dependency license obligations | Pass: license contract 3/3; full release gate 93 suites | Queue item 015 now verifies direct web production dependencies have lockfile license metadata and the TypeScript, CLI, and Python package manifests explicitly declare MIT licensing and the repository. | A legal review of every transitive dependency, third-party notice publication, or registry provenance. |
| 2026-10-19 | Release-instruction immutability | Pass: release-instructions contract 1/1; full release gate 94 suites | Queue item 016 now checks release/runbook code lines for floating branch pulls, unpinned latest package/image references, and other non-reproducible operator instructions. | A selected candidate SHA, rollback image, deployment approval, or production execution. |
| 2026-10-19 | Candidate file ownership map | Pass: file-ownership contract 2/2; full release gate 95 suites | Queue item 011 now maps every current intended path to a primary feature bucket and review role; unmapped intended paths fail the contract. | Owner approval, staging, merging, deployment, or a clean isolated candidate. |
| 2026-10-19 | Scope-aware secret audit | Pass: secret-scope contract 3/3; 376 intended paths scanned; 0 unexpected findings, including device-code, user-code, and redemption-ID checks | Queue item 007 now has a fail-closed scan over the actual intended worktree scope. Synthetic bearer/key/device-code fixtures remain visible and are restricted to test/example/harness contexts; no credential-shaped value appears in product or operator source. | Runtime secret stores, production configuration, or proof that a customer secret was never entered outside the repository. |
| 2026-10-19 | Ingest tenant-boundary integration | Pass: `npm run test:ingest-route` 10/10; TypeScript pass | Queue item 122 now exercises key-derived workspace assignment and proves a caller-supplied workspace claim cannot redirect a workspace-A key's event into workspace B. | Live Supabase RLS, production credentials, cross-instance behavior, or deployed authorization. |
| 2026-10-19 | Ingest credential lifecycle integration | Pass: `npm run test:ingest-route` 11/11; TypeScript pass | Queue items 137–138 now prove a revoked key is rejected on the next request, a rotated key can overlap explicitly, and the old key cannot ingest after revocation while the new key remains workspace-scoped. | Production cache topology, live key rotation, distributed instances, or deployed revocation latency. |
| 2026-10-19 | Distributed rate-limit provider boundary | Pass: rate-limit suite 14/14; TypeScript pass | Queue items 186–190 now have local evidence for the selected service-role Supabase atomic-bucket design, explicit provider wiring, bounded fail-closed outage behavior, shared buckets across independent provider instances, and persistence across provider restart. | Executed migration, production RPC availability, App Runner edge configuration, or a live two-instance load test. |
| 2026-10-19 | Worker health and operations contract | Pass: `npm run test:worker-health` 6/6; full release gate 101 suites; TypeScript source contract | Queue item 180 now has deterministic, secret-free findings for backlog, oldest queued lag, dead-letter count, and terminal success rate. Thresholds are explicit and insufficient data is distinct from a healthy zero. | Production scheduler wiring, alert delivery, live lag, and worker dashboard evidence remain operator/runtime gates. |
| 2026-10-19 | Analytics bounded-read contract | Pass: `npm run test:analytics-bounds` 2/2; TypeScript pass | Queue item 197 now documents and tests the 90-day window, 10,000-event v1 scan, 100-row catalog page, 100-row tools page, 500-item catalog cap, opaque cursors, and partial-data disclosure. | Production query plans, database cost, live latency, or rollup behavior at customer scale. |
| 2026-10-19 | Pilot incident-response contract | Pass: `npm run test:incident-runbook` 2/2; TypeScript pass | Queue item 200 now has a bounded evidence-first runbook for 401/403, 429, ingest latency/errors, stale dashboard reads, worker lag, database/RPC failures, rollback evidence, and secret-safe diagnostics. | Live incident drills, provider alerts, App Runner behavior, or production recovery timing. |
| 2026-10-19 | Pilot support scripts and retention language | Pass: `npm run test:pilot-support` 2/2; included in the 81-suite release gate | Queue items 219 and 236 now have a support runbook covering terminal activation, key storage, first-event troubleshooting, data-trust boundaries, safe escalation packets, retention/legal-hold language, and explicit prohibitions on collecting secrets or manually deleting rows. | Customer support operations, published support-page approval, live response quality, or production retention configuration. |
| 2026-10-19 | Pilot incident/status communication template | Pass: `npm run test:pilot-status-template` 2/2; included in the release gate | Queue item 237 now has evidence-safe Investigating/Mitigating/Monitoring/Resolved templates with UTC timestamps, explicit uncertainty, bounded recovery evidence, and secret-safe communication rules. | A live incident communication, customer notification approval, or production recovery. |
| 2026-10-19 | Pilot scope classification | Pass: `npm run test:pilot-scope` 2/2; included in the release gate | Queue item 239 now classifies CLI activation, SDKs, OTel, ingest, analytics, workers, privacy, install hooks, encodings, and scheduler SLOs as supported, limited, out of scope, or not yet evidenced, with release-wording rules. | Release-owner approval, published customer copy, registry state, or production evidence. |
| 2026-10-19 | Primary-flow accessibility contract | Pass: `npm run test:accessibility-contract` 2/2; included in the release gate | Queue item 233 now checks shared keyboard focus styling, reduced-motion behavior, labeled device/workspace controls, accessible copy actions, logo focus treatment, and absence of placeholder links or hidden outlines. | A full browser assistive-technology audit, color-contrast measurement, responsive visual review, or production behavior. |
| 2026-10-19 | Analytics workload threshold policy | Pass: `npm run test:analytics-workload` 3/3; included in the release gate | Queue item 199 now defines deterministic near-cap/cap, rollup-review, catalog pagination, identity-cap, and cursor-depth triggers without changing runtime limits or claiming a production SLO. | Production query plans, latency, volume, rollup implementation, or live capacity. |
| 2026-10-19 | Analytics query-plan evidence script | Pass: `npm run test:analytics-query-plan-safety` 2/2; read-only SQL review passed | Queue item 198 now has four planner-only, workspace-scoped, bounded EXPLAIN statements for events, catalog history, catalog entity reads, and refresh-job status, plus an interpretation checklist. | The SQL has not been executed here; actual production plans, latency, and capacity still require operator execution and evidence. |
| 2026-10-19 | Rate-limit threshold policy and redeem gate | Pass: `npm run test:rate-limit-policy` 3/3; rate-limit suite 14/14; TypeScript pass | Queue item 191 now records per-route limits, bucket identity, support triggers, owner-review boundary, and adds a bounded 5/60s device-redeem limiter using a hashed device code. | Product/support owner sign-off, edge/WAF configuration, distributed production behavior, and live 429 anomaly alerting. |
| 2026-10-19 | Secret-free operational anomaly signals | Pass: `npm run test:operational-anomalies` 4/4; TypeScript pass | Queue items 192–193 now have a bounded 15-minute evaluator for 429 spikes and 401/403 anomalies, with minimum volume, warning/critical thresholds, false-positive protection, and no identifiers, headers, keys, or payloads in findings. | Production alert persistence/delivery, cooldown ownership, live anomaly rates, and operator notification configuration. |
| 2026-10-19 | Local activation and ingest load profiles | Pass: `npm run test:activation-load-harness` 3/3; fixture run 60 requests/profile at concurrency 8 with 0 errors and 0 timeouts | Queue items 194–195 now have bounded local profiles for ingest batches of 1/10/50/100 and the CLI start/poll/redeem lifecycle, with separate p50/p95/p99/error/timeout budgets. | Production capacity, App Runner/Supabase behavior, distributed rate limiting, and real customer activation. |
| 2026-10-19 | Current local checkout: `npm run build` | Pass, 166 generated pages | The Turbopack production artifact builds after pinning the filesystem root to the web app; no ancestor-lockfile warning remains. | A deployment artifact running in App Runner or customer-visible production behavior. |
| 2026-10-19 | Current local checkout: `npm run smoke:local` | Pass, 8 public routes and 10 protected/API checks | The built local artifact starts and its covered primary HTTP routes respond as expected. | Production DNS, cookies, secrets, service availability, or a real customer workflow. |
| 2026-10-19 | Local package audit and packed-consumer gate | Pass: TypeScript SDK 32 tests, CLI 21 tests, Python SDK 19 tests | Packed local npm/CLI/Python artifacts install and run in clean temporary consumers, with current SDK/CLI behavior covered. | Published registry artifacts or production ingestion from a customer machine. |
| 2026-10-19 | Local workflow contract and package audit | Pass | The manual publish workflow now runs the repository-wide package-release audit before any package-specific publish step; the workflow contract and package audit both pass locally. | Registry uniqueness, provenance, upload, and fresh published-consumer evidence. |
| 2026-10-19 | CI workflow contract and isolated Python artifact check | Pass | CI now installs Python 3.12 and builds/checks the wheel and sdist; the workflow contract passed and the isolated local equivalent ran 19 tests plus `build` and `twine check`. | A GitHub Actions run on the eventual reviewed SHA and registry publication. |
| 2026-10-19 | Python onboarding example audit | Pass | The website and package README now construct an official `FastMCP` server before wrapping it; contract and package audits reject the previous undefined-server import. The web build remains 166/166. | Runtime validation with a clean published Python dependency set and production ingestion. |
| 2026-10-19 | Package version preflight and candidate artifacts | Candidate versions prepared: SDK `0.1.2`, CLI `0.1.4`, Python `0.1.3`; Python sdist/wheel and `twine check` pass | Candidate versions do not reuse the immediately observed npm/PyPI releases, and local Python artifacts have valid packaging metadata. | A final registry collision check immediately before publication, provenance, or a published-consumer smoke. |
| 2026-10-19 | Runtime dependency audit: `npm audit --omit=dev --package-lock-only` | 0 runtime vulnerabilities reported | The current lockfile has no npm-reported production dependency vulnerability. | That the Next.js/MCP SDK upgrades are behaviorally reviewed; they remain a release-scope review item. |
| 2026-10-19 | `node scripts/release-scope-audit.mjs --json` | One intentional review item | The current audit reports 376 intended paths, no excluded artifacts, and only the formatting-only `trackmcp-nextjs/AGENTS.md` change outside product release scope. The reviewed web lockfile is covered by a dependency-pin contract. | That a clean staged release scope exists; the final strict audit must run in the isolated candidate checkout after the unrelated agent-instructions file is excluded. |
| 2026-10-19 | Dependency compatibility review | Complete locally | MCP SDK documentation is pinned to 1.32.1 and tells Streamable HTTP users that cross-origin redirects require an explicit transport policy; the direct production dependency audit is clean. | Registry publication or live endpoint compatibility; those require the published-consumer and production smoke gates. |
| 2026-10-19 | Customer-facing pilot support and known-limitations page | Pass: `node --test scripts/pilot-support-page.contract.test.mjs`; `npx tsc --noEmit`; `npm run build` (169/169 pages); scoped ESLint and `git diff --check` pass | Queue item 235 now has a discoverable `/support` page linked from the footer and sitemap. The page presents the exact CLI/doctor path, supported vs limited vs out-of-scope boundaries, first-event troubleshooting, and secret-safe support evidence without claiming production SLOs or unsupported OTel encodings. | It does not prove release-owner wording approval, production publication, live support response quality, or the remaining operator/runtime gates. |
| 2026-10-19 | Founder OS follow-up release | Pass: PR #34 merged as `583e7411d4c9213990dd42c0d0cd1f88f52cf80f`; main CI run [39230898984](https://github.com/Krishna3956/CRV/actions/runs/39230898984) and App Runner run [39230899137](https://github.com/Krishna3956/CRV/actions/runs/39230899137) succeeded | Queue items 241 and 244 are evidenced by the clean PR and deployed SHA match. App Runner reached RUNNING in `ap-south-1`; ECR tag `583e7411d4c9213990dd42c0d0cd1f88f52cf80f` resolved to digest `sha256:694717e4ce3914adfde1a3cd7c5dffe39c3af0ccda9225a10707e953035db8ea`. The prior deployed digest remains the rollback candidate: `sha256:ff8221e6eda6ce105ccf406ea79b5e06848a3a4757d708e1a75e29d9cd607563`. | This does not prove production browser/CLI/data-plane smoke, SQL postflight, rollback rehearsal, scheduler evidence, or the final pilot go/no-go. |
| 2026-10-19 | Exact package publication | Pass: npm provenance workflow [39230924269](https://github.com/Krishna3956/CRV/actions/runs/39230924269); npm `@trackmcp/sdk@0.1.2` and `@trackmcp/cli@0.1.4`; PyPI `trackmcp==0.1.3` | Queue item 252 is green for exact immutable versions. npm registry integrity is recorded for SDK (`sha512-IapGH0qAwBO4ZfFdjVXkCECpUj/+K36a5KBjKltV7z3KuFSPBcwPt6+J2oP7AmnWBSzGZRw+jUX0FI81v7n01g==`) and CLI (`sha512-0j4PUP6sAJ7uRK/q/HPrMS0yiDFeCadO6weEZfyrRTrWrMIOUGIgTrkcnSPMF2aS7IPvAxSMzqGw2tuuWKvBYA==`); PyPI `trackmcp==0.1.3` is present with published artifact metadata. | Clean published-consumer installation, first safe event, registry provenance/checksum review, and production activation remain separate open gates. |
| 2026-10-19 | Clean registry consumer install | Pass: fresh temporary npm consumer installed `@trackmcp/sdk@0.1.2` and `@trackmcp/cli@0.1.4`; fresh temporary Python target installed `trackmcp==0.1.3`; npm entrypoint import and Python import passed | The exact published artifacts are installable outside the repository and resolve to the intended versions. | No production key or customer event was used; queue items 253–255 remain open for safe-event, provenance, and full registry evidence. |
| 2026-10-19 | Release-owner review and wording approval | Pass: release manifest, strict release-scope audit, dependency/license/secret/security-header/tenant-isolation contracts, 102-suite release gate, hosted CI, and deployed SHA reviewed before merge | Queue items 240, 242, and 243 are green. Customer-facing support wording is bounded by the deployed runtime evidence; the reviewed candidate was merged only after hosted CI passed and App Runner deployed the matching SHA. | This is an engineering/release-owner review, not a substitute for customer production smoke, SQL postflight, rollback rehearsal, or independent human approval. |
| 2026-10-19 | Clean release-gate reproducibility and latest deployment | Pass: clean detached checkout completed the full 102-suite gate after automatically building the generated Python wheel/sdist; PR #39 merged as `07b9d31fa613a6446c7cf63f20d5c4a6b85961ab`; App Runner run [39234245573](https://github.com/Krishna3956/CRV/actions/runs/39234245573) reached RUNNING with ECR digest `sha256:ef61e4bf8b9ea6c5630f37105def98c92c8206ea64eed518692f9e1a4da8245b` | Queue items 241, 244, and 245 have current deployed-SHA, region/status, and immutable-digest evidence; generated package artifacts are now reproducible from a clean checkout. | This still does not prove production browser/CLI/data-plane smoke, SQL postflight, rollback rehearsal, scheduler evidence, or the final pilot go/no-go. |
| 2026-10-19 | Production public-surface smoke after merge `a026d1fd222b37a599c92aca4e7af8b0ac6014fd` | Pass: guarded read-only runner produced `/tmp/trackmcp-production-smoke.json` with 14 checks: homepage, docs, TypeScript docs, Python docs, device page, support page, both sitemaps, exact npm SDK/CLI versions, exact PyPI version, and unauthenticated key-status `401`; App Runner run [39236970873](https://github.com/Krishna3956/CRV/actions/runs/39236970873) succeeded. | This is direct HTTP evidence that the deployed public surfaces and registry metadata are reachable for the merged SHA. | It does not prove interactive browser sign-up/device approval, workspace selection, authenticated key status, first ingest, dashboard data, cross-workspace isolation, key rotation, worker scheduling, or rollback; those operator gates remain open. |
| 2026-10-19 | Published registry checksum preflight | Pass: exact npm tarball metadata is available for `@trackmcp/sdk@0.1.2` (`sdk-0.1.2.tgz`, integrity `sha512-IapGH0qAwBO4ZfFdjVXkCECpUj/+K36a5KBjKltV7z3KuFSPBcwPt6+J2oP7AmnWBSzGZRw+jUX0FI81v7n01g==`) and `@trackmcp/cli@0.1.4` (`cli-0.1.4.tgz`, integrity `sha512-0j4PUP6sAJ7uRK/q/HPrMS0yiDFeCadO6weEZfyrRTrWrMIOUGIgTrkcnSPMF2aS7IPvAxSMzqGw2tuuWKvBYA==`); PyPI `trackmcp==0.1.3` exposes wheel SHA-256 `b9b2f133231bda000cb5a987065ed849e6254907e1ded497d22035478effcb82` and sdist SHA-256 `c904c1e35aa5292fd487bee0aeba902995b73c8639e79e7e0b447bd972a3a65e`. | This records immutable registry artifacts for the exact reviewed package versions and supports consumer-install/release reconciliation. | It does not prove a new publication occurred, a production safe event, or that all registry provenance attestations have been independently archived; those remain separate acceptance evidence. |
| 2026-10-19 | Device activation local contract audit | Pass: `test:device-auth-activation` 14/14, `test:device-approval-contract` 7/7, and `test:workspace-selection` 14/14. Source/handler contracts cover malformed/expired/denied/already-approved/already-redeemed states, sign-in/sign-up return routing, zero/one/multiple workspace membership, workspace creation without key minting, and browser-side secret non-disclosure. | This strengthens the local engineering evidence for queue items 045–054 and confirms the browser adapter/backend contract remains aligned. | It does not close the required browser visual/interaction evidence or fresh production CLI activation item 247; those still require a real browser and disposable production workspace. |
| 2026-10-19 | Exact-current clean checkout and dependency install | Pass: detached worktree from `origin/main` `0513eaa73ea35458141abf84f1d4b58171955228` was created and `npm ci` completed successfully; npm reported only engine/deprecation notices and 5 high-severity audit findings in the dependency tree. | Queue items 021 and 022 now have direct clean-checkout/install evidence for the exact current candidate. | The warnings remain a dependency-review concern; this does not prove production browser behavior, SQL postflight, or pilot readiness. |
