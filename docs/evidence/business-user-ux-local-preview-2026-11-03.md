# Business-user UX local preview evidence

Date: 2026-11-03
Branch: `codex/business-user-ux-audit`
Commit under review: `ba9f93a1`

This is local browser evidence only. It is not production evidence and does
not replace a fresh-account or real-telemetry walkthrough.

## Environment

- Next development server started from the isolated worktree on port `3138`.
- The local dashboard bypass was enabled only for the preview.
- Supabase values were deliberately non-production placeholders.
- No production credentials, data, deployment, or database writes were used.

## First-time My-data state

Route: `/dashboard?view=overview&data=my`

Observed in the browser accessibility tree:

- Desktop-only pilot notice is visible.
- Business-first navigation is visible: Overview, Who's using it, What
  they're doing, Resources & prompts, The journey, Did it work, What's broken,
  Evidence, and Setup.
- The activity period is explicit: `Showing last 30 days`.
- The page explains the product before technical setup:
  `TrackMCP helps product and operations teams understand how people use their
  MCP: who is showing up, what they are trying to do, whether the work
  completed, and what needs attention.`
- The no-connection state explains that a technical teammate creates a key,
  adds it to the server, and sends one real event.
- The next-step rail lists creating a connection key, adding
  `TRACKMCP_KEY`, and making one real tool call.
- `Complete setup` and `See Example data` are both available.
- The structure preview is explicitly labeled as a preview and states that
  Example data is not substituted into My data.

## Verification result

Pass for the local comprehension contract. The page answers what TrackMCP is
for, what the business user should expect after setup, and who normally owns
the technical step without presenting missing data as a product failure.

Remaining evidence required:

- Fresh authenticated account in a deployed environment.
- Real first-event ingestion and dashboard refresh.
- One non-technical product or operations participant completing the UAT
  script in `docs/FOUNDER-OS-BUSINESS-USER-UAT-SCRIPT.md`.

## Activated Example-data state

Route: `/dashboard?view=capabilities&data=example`

Observed in the browser DOM snapshot:

- The page leads with adoption and reliability before protocol detail.
- “Trend by feature” renders a visual chart and an expanded table alternative.
- The table exposes week, total calls, and per-feature values using the same
  bounded example points as the chart.
- The table is labeled `Weekly observed calls by feature` and is available
  without relying on hover text.
- The example data remains explicitly labeled as illustrative.

This confirms the activated business view has a readable path for comparing
feature usage, while the underlying metric definitions remain unchanged.

The same activated view now exposes an outcome-trend table in “Did it work,”
with explicit completed, failed, pending, and unknown values by period. These
states remain separate and are never collapsed into a single success score.

The local browser verification expanded that table successfully and exposed the
example rows `2026-08-19` and `2026-08-26` with separate values for each state.
