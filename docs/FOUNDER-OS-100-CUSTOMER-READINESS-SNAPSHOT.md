# Founder OS first-100 readiness snapshot

Updated: 2026-10-28 (Asia/Kolkata; source `b659f13e`; runtime and hosted evidence reconciled)

Status: **Engineering green; release decision HOLD**

This is the concise handoff view. The detailed evidence and historical
checkpoints remain in the [readiness ledger](FOUNDER-OS-100-CUSTOMER-READINESS-LEDGER.md)
and [pilot release record](FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md).

## Done and re-verified

- Six authenticated dashboard surfaces have contract coverage, privacy-safe
  read models, and navigation/documentation CTA checks.
- Current source release gate passes **148 suites**; lint, production build,
  and `git diff --check` pass. The production build generates **178 routes**.
- Hosted TrackMCP CI `40724264808` passed for source `b659f13e` across the
  web/JavaScript, Go, and .NET lanes.
- The latest verified application runtime is immutable SHA
  `b659f13e49dbb5ac06120327b68ae69a9e593711`, deployed by App Runner workflow
  `40724264782`; the deployment preflight built the reviewed Python wheel and
  sdist before the package-release audit, and the workflow's release gate,
  read-only smoke, immutable identity, and runtime-safety checks passed. The
  live health endpoint reports this exact SHA; `/` and `/docs` also return HTTP
  200. Post-deploy authenticated smoke `40726102995` passed with redacted
  evidence.
- Production deployment, read-only smoke, tenant-scope smoke, first-ingest
  smoke, refresh-worker recovery, prompt-entity projection, and distributed
  rate-limit enablement have recorded evidence.
- Credentialed two-workspace production auth smoke passed against immutable
  SHA `70534428fd69a4fa5a07f46adad504a32fdfe262`: read models authenticated,
  conflicting workspace queries were ignored, API-key action-queue mutation
  was denied, and a revoked key was rejected.
- Current-source read-only authenticated smoke `40710093943` reverified the
  same tenant/read-model boundary against
  `d8b806d2c5ea4cf813079b55ac22c1d28ae8fc74` with 37 bounded checks. The
  transport and disposable device-flow workflows remain explicitly skipped
  when their repository secrets are absent.
- Official Streamable HTTP and SSE client fixtures pass through the adapter to
  the trusted App Runner origin with metadata-only payloads. Production
  transport smoke `40614861539` passed; the repeatable script is
  `trackmcp-nextjs/scripts/production-transport-smoke.mjs`.
- Disposable first-ingest workflow `40615210168` passed and now verifies both
  accepted ingestion and bounded analytics read-back (`12784483407`).
- The refresh worker warm-up source change is verified by CI `40616257747` and
  worker run `40616039422`; recovery runs `40616803534` and `40616854993`
  also passed with redacted evidence.
- Privacy, tenant isolation, OTLP/HTTP, package-consumer, protocol-fixture,
  dashboard, and release-control contract families are covered by the gate.
- The published-artifact audit now scans the exact npm tarballs and Python
  wheel/sdist selected for release and rejects credential-shaped values in
  runtime files; Python artifacts are also required to match the source
  version in `pyproject.toml`.
- The 134-page Founder OS source PDF was re-read against the current dashboard
  navigation and contracts. Its six business questions are represented by the
  current Overview, Journey, What they're doing, Resources & prompts, Did it
  work, What's broken, and Who's using it surfaces. The current IA intentionally
  keeps Overview/Journey/Capabilities/Outcomes/Reliability in primary navigation
  and places Resources, Who's using it, Evidence, and Setup under More.

## Still open before a real GO

These are not source-code failures and must not be silently marked green:

1. Release-owner approval for the 100-customer cohort, rollback owner, data
   boundary, and accepted limitations (queue item 020).
2. Supabase recovery posture: the current Free plan has no project backups and
   PITR is disabled. A restoration owner/runbook plus tested recovery, or an
   explicit accepted limitation, is required (queue item 157).
3. Privacy lifecycle acceptance: export is bounded and secret-free; deletion
   requests are review-only and destructive deletion is disabled.
4. Synthetic reliability-data hygiene acceptance: canary rows must remain
   visibly test evidence and never be presented as customer incidents.
5. Sustained scheduler evidence: health run `40629348992` proves three complete
   AWS worker-summary samples, six scheduler invocations, four end-to-end EMF
   successes, zero parse/failed/retryable jobs, and queue lag within the
   15-minute budget.
6. Credentialed production key-lifecycle and customer-owned MCP endpoint UAT.
7. Protocol interoperability that is explicitly Partial/Unsupported in the
   matrix (customer endpoints, reconnect/replay, proxy-specific behavior,
   OAuth/token exchange, OTLP/gRPC, sampling/elicitation).
8. Go/.NET registry publication, if those packages are part of the pilot
   promise; artifacts are validated but intentionally unpublished.

## Next execution order

1. Release owner records decisions for items 1–5 and the accepted limitations.
2. Add the dedicated hosted transport-smoke secret only if a credentialed
   hosted transport run is desired; do not reuse a customer key.
3. Run bounded credentialed key-lifecycle and transport UAT with disposable
   credentials, retaining redacted evidence only.
4. Re-run the release gate, build, deployment smoke, and release-record
   reconciliation on the exact release SHA.
5. Record GO/NO-GO; absent explicit acceptance, keep the status HOLD.

The customer-endpoint UAT path is now implemented as a manual-only workflow at
`.github/workflows/customer-endpoint-uat.yml`. It requires an exact operator
confirmation, an allowlisted TrackMCP ingest origin, an endpoint-specific
transport/version choice, and disposable credentials. Its report is redacted
and mode `0600`; the release gate also exercises the official Streamable HTTP
discovery path against an explicit loopback fixture with a private-target
override. Running the workflow against a real customer endpoint remains an
external acceptance action.

## Non-claims

Local fixtures do not prove every customer MCP server, transport-owned
reconnect semantics, OAuth exchange, backup restoration, or a sustained
scheduled-worker SLO. No secret, workspace identifier, raw payload, or token is
stored in this snapshot.

The detailed ledger is authoritative for the remaining external gates. The
current source is `b659f13e`; the deployed application is the same verified
runtime `b659f13e` after the corrected App Runner rollout. The
latest health report is the AWS-proven freshness result above. The alert evaluator remains
disabled-first and is not claimed as enabled production delivery.
