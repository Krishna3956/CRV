# Founder OS first-100-customer acceptance matrix

Status: **GO — controlled first-100 pilot; no silent waivers**
Reconciled: 2026-10-30 (Asia/Kolkata)
Current deployed baseline: application runtime
`177165180383e31bb7760040469f9aaa7f78f8a1` (App Runner workflow
`41013186081`, passed release gate, rollout, production smoke, runtime-safety,
translation-provider, and identity checks). The current repository source is
`main` at documentation-only handoff commit
`dfcdb30f75f97df1c94f2adb1f0b67964c2376eb`; the direct-origin health probe
reports the deployed application SHA.
The full local release gate passes 155 suites and the production build generates
211 routes. Authenticated production smoke `41014068784` passed against the
deployed revision; direct-origin first-ingest `40894964464` and SDK-shaped
public-edge smoke `40896249223` both passed one bounded metadata-only event plus
analytics read-back. Fresh health evaluation `41038856612` is `healthy`: it
records four AWS scheduler invocations, zero errors, four scheduled successes,
four complete worker samples, zero worker failures/retries/parse failures, and
current worker max queue lag `832835ms` against the `900000ms` freshness budget.
The AWS scheduler cadence, AWS end-to-end cadence, and worker-freshness gates
are all `proven`. Historical samples remain retained in the report, including
two cadence breaches outside the current clean evaluation window. The bounded
GitHub recovery evaluation has zero stale or incomplete samples. The alert evaluator remains manual-only
and disabled-first; no production alert delivery is claimed.
The authenticated product synthetic MCP UAT also passed: 30 tools,
6 resources, 3 templates, 5 prompts, and one completion exercised through the
product ingest endpoint, with 126 metadata-only events, zero delivery errors, a
drained client queue, and Setup refreshed to 5/5 required checks. This is
authenticated product integration evidence using a synthetic MCP server; it
does not replace a real customer-owned endpoint.
This is current runtime and source evidence supporting the bounded pilot GO
decision; it is not an unrestricted public-launch claim.

Historical baseline retained for continuity: application
`2e135f194f36e278232c6a46890b1ce850d1e9ba`, App Runner run `40198791603`.

This matrix is the release-owner comparison for every currently open P0 queue
item. A row is not green merely because a local contract or historical release
passed. The evidence column states what is actually proven; the exit column
states what is still required.

## Release-owner decision packet

The following are the exact decisions still required for a limited first-100
pilot. Engineering has prepared the evidence and will not infer these choices:

- Pilot scope: confirm the cohort size, supported host environments, supported
  MCP transports/protocol versions, and the excluded features.
- Accepted limitations: explicitly accept or reject synthetic-only UAT versus
  real customer endpoint UAT, manual-only alert evaluation, disabled-first
  production alert delivery, and the bounded metadata-only telemetry policy.
- Data and recovery: accept or reject the current backup/PITR posture and name
  the restoration contact and rollback owner.
- Decision: issue `GO` or `NO-GO` for the limited pilot, with a timestamp,
  decision owner, accepted limitations, cohort scope, rollback owner, and links
  to every open/green row below.

The companion [external-gate register](FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md)
records the non-source acceptance decisions and the explicit limitations that
remain bounded or excluded from the pilot claim.

| Queue item | Requirement | Current evidence | Status | Exit evidence |
| --- | --- | --- | --- | --- |
| 020 | Approve the exact limited pilot scope before a customer-facing claim | Release record contains the final 2026-10-30 GO, bounded HTTPS MCP path, cohort and accepted limitations | CLOSED — release owner | New approval required for expansion beyond the first-100 pilot |
| 047 | Exercise the expired-code state in a real authenticated browser session | Signed-in Chrome exercised the disposable production device URL; the approval request returned the explicit `This device session expired` state with the recoverable CLI restart instruction and no key material | CLOSED — browser UAT | Retain the redacted browser evidence in the handoff ledger; this does not close denied or successful-redemption scenarios |
| 048 | Exercise the denied state in a real authenticated browser session | Disposable production session was explicitly marked denied, then signed-in Chrome rendered `Device access was not approved` and `No key was created` recovery copy | CLOSED — browser UAT | Retain the redacted browser/session evidence in the handoff ledger; this does not close successful redemption |
| 052 | Exercise multiple workspace membership selection in production browser UAT | Signed-in production browser exposed `krishnaatmu workspace` and disposable `TrackMCP UAT Multi Workspace`; selecting the second workspace completed approval without key disclosure | CLOSED — browser UAT | Retain the redacted browser/session evidence in the handoff ledger; this does not close zero-membership creation or redemption |
| 053 | Exercise workspace creation from device flow without key disclosure | Disposable authenticated zero-membership account rendered `Workspace setup required`; browser creation succeeded, approval completed, and no connection-key material was shown. Disposable user, workspace, and session were removed after capture | CLOSED — browser UAT | Retain the redacted browser/session evidence in the handoff ledger; this does not close redemption |
| 157 | Record database region, backup posture, and restoration contact | Supabase inspection plus `docs/evidence/supabase-backup-acceptance-2026-10-30.md` records East US / `us-east-1`, Free plan, PITR disabled, logical-export-only recovery, no guaranteed RPO/RTO, and owner `krishnaatmu@gmail.com` | CLOSED for bounded pilot — accepted limitation | Upgrade or complete a restore rehearsal before expanding the pilot |
| 259 | Compare all acceptance rows with evidence and silently waive none | This matrix reconciles the evidence and records the bounded GO without silently waiving unsupported claims | CLOSED — comparison complete | Keep this matrix and the release record updated whenever an item changes; it does not authorize expansion |
| 260 | Issue the limited 100-customer pilot go/no-go decision | Final release-owner decision is GO for the controlled first-100 pilot, with the endpoint UAT, health evidence, privacy boundary, recovery limitation, and rollback owner linked in the release record | CLOSED — release owner | New timestamped GO/NO-GO is required for any broader scope |

## Decision rule

Items 020, 157, and 260 now have their exit evidence for the controlled
first-100 pilot. Scheduler freshness remains an engineering PASS, and the
accepted recovery limitation does not claim provider backup/PITR coverage.
Item 258 (distributed rate limiting) is explicitly outside the bounded pilot
and is documented as post-pilot work; it is not silently waived. This matrix
does not claim that the product is ready for an unrestricted public launch.
