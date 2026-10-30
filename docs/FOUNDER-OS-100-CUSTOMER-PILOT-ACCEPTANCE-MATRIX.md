# Founder OS first-100-customer acceptance matrix

Status: **HOLD — no silent waivers**  
Reconciled: 2026-10-30 (Asia/Kolkata)
Current deployed baseline: application runtime
`177165180383e31bb7760040469f9aaa7f78f8a1` (App Runner workflow
`41013186081`, passed release gate, rollout, production smoke, runtime-safety,
translation-provider, and identity checks). The current repository source is
`main` at documentation-only handoff commit
`c530c193808579ae5b82f9e015515c090ec7f8d9`; the direct-origin health probe
reports the deployed application SHA.
The full local release gate passes 154 suites and the production build generates
211 routes. Authenticated production smoke `41014068784` passed against the
deployed revision; direct-origin first-ingest `40894964464` and SDK-shaped
public-edge smoke `40896249223` both passed one bounded metadata-only event plus
analytics read-back. Health evaluation `41026583693` records five AWS scheduler
invocations, three end-to-end scheduled successes, and two scheduler
failures/errors. The AWS end-to-end cadence sub-gate is proven, but the run
remains `warning` because AWS worker freshness is `1010614ms` against the
`900000ms` freshness budget. The bounded GitHub recovery evaluation has zero
stale or incomplete samples. Serial recovery run `41026523923` observed no
backlog; the provider-owned scheduler gate remains open pending a clean bounded
AWS window. The alert evaluator remains manual-only
and disabled-first; no production alert delivery is claimed.
This is current runtime and source evidence, not a pilot GO decision.

Historical baseline retained for continuity: application
`2e135f194f36e278232c6a46890b1ce850d1e9ba`, App Runner run `40198791603`.

This matrix is the release-owner comparison for every currently open P0 queue
item. A row is not green merely because a local contract or historical release
passed. The evidence column states what is actually proven; the exit column
states what is still required.

The companion [external-gate register](FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md)
records the non-source acceptance decisions that remain open in the release
record.

| Queue item | Requirement | Current evidence | Status | Exit evidence |
| --- | --- | --- | --- | --- |
| 020 | Approve the exact limited pilot scope before a customer-facing claim | `docs/FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md` remains Draft/HOLD and lists the bounded desktop scope and limitations | OPEN — release owner | Timestamped scope approval naming cohort, hosts, supported paths, limitations, rollback owner, and data-handling boundary |
| 047 | Exercise the expired-code state in a real authenticated browser session | Signed-in Chrome exercised the disposable production device URL; the approval request returned the explicit `This device session expired` state with the recoverable CLI restart instruction and no key material | CLOSED — browser UAT | Retain the redacted browser evidence in the handoff ledger; this does not close denied or successful-redemption scenarios |
| 048 | Exercise the denied state in a real authenticated browser session | Disposable production session was explicitly marked denied, then signed-in Chrome rendered `Device access was not approved` and `No key was created` recovery copy | CLOSED — browser UAT | Retain the redacted browser/session evidence in the handoff ledger; this does not close successful redemption |
| 052 | Exercise multiple workspace membership selection in production browser UAT | Signed-in production browser exposed `krishnaatmu workspace` and disposable `TrackMCP UAT Multi Workspace`; selecting the second workspace completed approval without key disclosure | CLOSED — browser UAT | Retain the redacted browser/session evidence in the handoff ledger; this does not close zero-membership creation or redemption |
| 053 | Exercise workspace creation from device flow without key disclosure | Disposable authenticated zero-membership account rendered `Workspace setup required`; browser creation succeeded, approval completed, and no connection-key material was shown. Disposable user, workspace, and session were removed after capture | CLOSED — browser UAT | Retain the redacted browser/session evidence in the handoff ledger; this does not close redemption |
| 157 | Record database region, backup posture, and restoration contact | Supabase inspection records East US / `us-east-1`; current Free Plan backup surface showed no usable schedule, restore point, contact, or completed restore rehearsal | OPEN — infrastructure owner | Written region/tier, backup/restore policy or explicit accepted limitation, restoration contact, and tested recovery reference |
| 259 | Compare all acceptance rows with evidence and silently waive none | This matrix reconciles all three currently open IDs and records an explicit HOLD for each unresolved row | CLOSED — comparison complete | Keep this matrix and the release record updated whenever an item changes; it does not authorize GO |
| 260 | Issue the limited 100-customer pilot go/no-go decision | Engineering recommendation remains HOLD because worker freshness, backup posture, privacy acceptance, customer-owned protocol boundaries, and owner acceptance are open; the latest health evaluation remains a warning | OPEN — release owner | Timestamped GO/NO-GO decision with accepted limitations, scope, rollback owner, and links to every green/open row |

## Decision rule

The product must remain **HOLD** until items 020, 157,
and 260 have their exit evidence. Scheduler freshness is an engineering PASS,
but it does not replace those owner decisions. Item 258 (distributed rate limiting) is
explicitly outside the bounded pilot and is documented as post-pilot work; it
is not silently waived. This matrix does not claim that the product is ready
for 100 customers.
