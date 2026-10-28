# Founder OS first-100-customer acceptance matrix

Status: **HOLD — no silent waivers**  
Reconciled: 2026-10-28 (Asia/Kolkata)
Current deployed baseline: application
`7763e05f9e62c9f3349ba20596c208d81cca08c9`, App Runner run `40729507033`
(successful rerun attempt 2). The current repository source is `main` at
`HEAD`; hosted CI `40739164434` passed
across web/JavaScript, Go, and .NET, and the full release gate passed 148
suites. Authenticated production smoke `40732381275` passed against the
deployed runtime SHA `7763e05f`. The deployed refresh scheduler remains
independently proven by health artifact `40629348992`, which records 3/3
complete AWS worker-summary samples within the 15-minute budget. The alert
evaluator deployment path is present but manual-only and disabled-first; no
production alert delivery is claimed.
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
| 260 | Issue the limited 100-customer pilot go/no-go decision | Engineering recommendation remains HOLD because backup posture, privacy acceptance, customer-owned protocol boundaries, and owner acceptance are open; scheduler freshness is an engineering PASS proven separately by health artifact `40629348992` | OPEN — release owner | Timestamped GO/NO-GO decision with accepted limitations, scope, rollback owner, and links to every green/open row |

## Decision rule

The product must remain **HOLD** until items 020, 157,
and 260 have their exit evidence. Scheduler freshness is an engineering PASS,
but it does not replace those owner decisions. Item 258 (distributed rate limiting) is
explicitly outside the bounded pilot and is documented as post-pilot work; it
is not silently waived. This matrix does not claim that the product is ready
for 100 customers.
