# Founder OS local implementation audit

Date: 2026-10-19  
Environment: local checkout only  
Production status: unchanged  
Supabase status: migrations reported applied by the operator; no SQL executed by this checkout  
Git status: intentionally uncommitted

Scope classification: `FOUNDER-OS-RELEASE-MANIFEST.md`

## Scope audited

This local pass covers the first safe foundation slice, not the entire Founder OS product:

- Semantic event contract and classifier.
- Shared metric definitions.
- Privacy-safe account identity resolver support in TypeScript and Python SDKs.
- Ingest validation and persistence mapping for hashed account identity.
- Review-only Supabase migrations for account identity, semantic facts, and
  action-queue lifecycle metadata.
- Conservative fact projection, outcomes aggregation, action evaluation, and
  authenticated action-queue lifecycle mutations.
- Architecture and metric documentation.
- Existing local blog/sitemap/docs work already present in the worktree.
- Privacy-safe bounded account export endpoint and projection tests.
- Durable refresh-job lifecycle policy, migration contract, and postflight SQL.

## Validation completed

Passed:

- Next.js TypeScript check: `npx tsc --noEmit`.
- Semantic classifier tests: 6 passed.
- Metric contract tests: 2 passed.
- Telemetry validation tests: 7 passed.
- TypeScript SDK tests: 28 passed.
- Python SDK tests: 13 passed with `PYTHONPATH=packages/python-sdk`.
- Ingest account-identity integration test: passed.
- Review-only migration contract test: 1 passed.
- Read-model fact projection tests: 4 passed.
- Outcomes/reliability read-model tests: 3 passed.
- CLI activation tests: 19 passed, including packed-consumer installation.
- Analytics integration tests: 3 passed, including the new conservative Founder OS aggregate response.
- Versioned overview, data-trust, tools, and tool-detail route contract tests passed.
- Dashboard contract tests: 23 passed.
- Fact-writer and action-queue tests: 5 passed.
- Retention-policy tests: 2 passed.
- Action-queue lifecycle tests: 4 passed.
- Action-queue route contract tests: 2 passed.
- Action-queue read-route tests: 3 passed; signed-in workspace reads are
  bounded and ingest keys are rejected.
- Action-queue authorization tests: ingest API keys denied; owner browser
  session allowed.
- Full local ESLint: passed with an explicit exception for the third-party
  `ProductHuntBadge.tsx` SVG widget; the warning is pre-existing and isolated.
- `git diff --check`: passed.
- Isolated production build after the current Founder OS changes: passed, 165/165
  pages generated with no authored CSS parse warnings.
- Analytics now exposes resolver-based `identity_coverage` with an explicit
  eligible denominator and caveat metadata.
- Final sequential TypeScript check after the read-route build completed:
  passed.
- Privacy export tests: 3 passed.
- Refresh-job lifecycle and migration tests: 8 passed.
- Full release gate after the current Founder OS changes: 72 suites passed, including the versioned setup state contract, ingest replay, protocol-semantic signals, dashboard contract, privacy-review, package-consumer, security-header, worker-health postflight, and reviewed manual-SQL safety validation.
- TypeScript SDK build/tests/packed consumer: 29 tests plus packed consumer passed.
- CLI tests/packed consumer: 19 tests plus packed consumer passed.
- Python SDK tests: 14 passed.
- Local production-shaped HTTP smoke: passed against the isolated 165-page build;
  8 public routes and 10 protected/API checks completed without 5xx responses.

The default Turbopack build was attempted and hit the known local environment restriction where Turbopack workers cannot bind a port. The Webpack production build completed successfully; this is an environment limitation, not a source compilation failure.

## SQL requiring user review

The SQL prepared by this pass was review-only from this checkout. The operator
reported applying the migrations in production; this checkout did not execute
or independently verify that application:

`supabase/migrations/20261018000002_account_identity_contract.sql`

It adds nullable, bounded fields to `trackmcp_events`:

- `account_key`: a 64-character SHA-256-derived identifier.
- `account_identity_source`: `resolver` or `unresolved`.

It adds shape constraints, provenance constraints, an index, and explanatory comments. It does not backfill existing rows or drop data/tables. It replaces only the two named check constraints if they already exist. Re-run the read-only postflight queries before making a production release claim.

The accompanying read-only postflight query is:

`supabase/manual/founder-os-account-identity-postflight.sql`

The next review-only schema target is:

`supabase/migrations/20261018000003_founder_os_read_model.sql`

It defines versioned semantic facts and a bounded action queue, but intentionally has no trigger, backfill, or writer. The application must not be deployed expecting these tables until a separate writer/read-model implementation is reviewed.

The accompanying read-only verification query is:

`supabase/manual/founder-os-read-model-postflight.sql`

The action-queue lifecycle extension is prepared in `supabase/migrations/20261018000004_action_queue_lifecycle.sql` and documented in `docs/FOUNDER-OS-ACTION-QUEUE-LIFECYCLE.md`. It is additive and review-only.

The accompanying read-only verification query is:

`supabase/manual/founder-os-action-queue-lifecycle-postflight.sql`

The refresh-job lifecycle migration is prepared in
`supabase/migrations/20261018000006_founder_os_refresh_jobs.sql` with its
read-only check in `supabase/manual/founder-os-refresh-jobs-postflight.sql`.
It is additive, worker-only, and has not been applied or enabled by this
checkout.

## Privacy checks

- SDK resolvers receive bounded event metadata only.
- Raw claims, emails, API keys, bearer tokens, and OAuth tokens are not emitted.
- Resolver output is validated and hashed locally.
- Resolver exceptions fail open and never affect the MCP request.
- Customer redaction hooks cannot replace the SDK-derived account identity fields after enrichment.
- Events without a resolver remain explicitly unresolved.
- MCP client identity remains separate from customer account identity.

The external standards decision record is documented in `docs/FOUNDER-OS-EXTERNAL-STANDARDS-DECISIONS.md`, using primary OpenTelemetry, MCP, and GDPR references.

## Known limits before a production merge

1. The semantic classifier is a foundation, not the complete Outcomes/Reliability model.
2. Resource, prompt, subscription, sampling, and transport-specific facts still need dedicated event capture and fixtures.
3. The bounded in-process fact and outcomes projections plus an additive
   analytics API/dashboard contract exist. Persistent refresh scheduling and
   list/detail queue reads and authenticated lifecycle mutations are implemented;
   versioned read-only overview, tools, data-trust, and tool-detail routes are
   covered by contract tests.
4. The dashboard now exposes the Founder OS information architecture locally (Overview, Journeys, Capabilities, Quality, Issues, AI clients, Evidence, and Setup); production deployment evidence remains separate.
5. Production migration state is operator-reported and should be rechecked with
   the read-only postflight queries before any incident or release claim.
6. Existing local blog, sitemap, PRD, and generated SDK changes are intentionally uncommitted and must be classified before any future commit.
7. Account identity is resolver-provided/claimed, not server-verified identity; plain SHA-256 is not cryptographic unlinkability.
8. Persistent fact writes are implemented behind `TRACKMCP_ENABLE_FACT_WRITES=true` and are intentionally disabled by default until the read-model migration is applied.
9. The action queue evaluator is implemented as a pure, conservative
   projection; queue persistence and lifecycle mutation remain separate from
   ingestion.
10. The authenticated `PATCH /api/v1/action-queue/[id]` route exposes bounded
    acknowledge/snooze/resolve transitions with optimistic concurrency. It
    rejects ingest API keys and requires an owner/admin dashboard session; the
    lifecycle migration application is operator-reported and not independently
    verified by this checkout.
11. `GET /api/v1/account/export` is intentionally bounded and read-only. A
    destructive deletion workflow is not exposed; it requires an audited,
    owner-confirmed request table and asynchronous cleanup process.
12. `trackmcp_refresh_jobs` has a review-only migration, pure lifecycle policy,
    a lease-fenced worker, and a five-minute GitHub Actions trigger in this
    checkout. Production execution still depends on the operator applying the
    refresh-job/RPC migrations and configuring the two worker secrets.

## Release gate

The local CLI activation contract now has a single lifecycle fixture at
`trackmcp-nextjs/packages/cli/test/device-lifecycle.integration.test.mjs`.
It exercises session creation, browser approval, pending/approved polling,
redemption with a stable `redemption_id`, and replay protection against a
local HTTP fixture. This proves the CLI contract shape without contacting
Supabase or production. It does not replace a production smoke test.

The account identity contract is intentionally an attribution foundation, not verified identity. A customer-owned resolver supplies a bounded claim; the SDK hashes it locally, but a caller with a valid workspace key could still forge a syntactically valid hash. The product must describe this as resolver-provided/claimed until a future server-attested or workspace-keyed derivation is designed. Plain SHA-256 is also susceptible to dictionary attacks for predictable identifiers, so this is not a promise of cryptographic unlinkability.

The migration must be applied before deploying the corresponding ingest handler because the handler writes the two new columns on every accepted event. The index is an ordinary index; for a very large production table, schedule it carefully or replace it with a separately reviewed `CREATE INDEX CONCURRENTLY` operation. The operator reports that the migrations have been applied; this checkout has not independently verified production state.

The production build has now been verified in an isolated output directory
with the local preview still running: 165 static pages generated, all route
modules collected, and exit code 0. The `NEXT_DIST_DIR` override is a QA
isolation aid; production defaults to `.next`.

The web dependency review was repeated after upgrading and pinning Next.js
16.4.2, `eslint-config-next` 16.4.2, and the MCP SDK 1.32.1. `npm ci` passed;
the production-only audit (`npm audit --omit=dev --audit-level=high`) reported
zero vulnerabilities. The full development audit retains five upstream high
findings in the ESLint globbing chain; npm's proposed downgrade to
`eslint-config-next` 14.2.35 was not accepted. CI now enforces the production
dependency audit and the workflow contract test covers that gate.

The isolated Next.js 16.4.2 production runtime smoke passed on port 3200 with
8 public routes and 10 protected/API checks. The pre-existing development
server on port 3000 was not restarted; its stale 500 response is not used as
release evidence.

CLI redemption reconciliation is intentionally read-only. The operator report
`supabase/manual/founder-os-cli-redemption-reconciliation.sql` identifies stale
`redeeming` sessions and session/key integrity mismatches without selecting raw
API keys or device codes. Exactly-once key delivery remains an explicit launch
follow-up until a reviewed server-side recovery design closes the lost-response
window.

Do not commit, merge, deploy, publish packages, or execute the SQL until:

- The user approves the semantic contract and migration.
- The local worktree is classified into intended changes versus unrelated pre-existing changes.
- The full test/build audit is repeated from a clean isolated checkout.
- Migration application and postflight checks are documented.

