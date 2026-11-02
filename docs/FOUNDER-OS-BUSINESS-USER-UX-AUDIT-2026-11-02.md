# Founder OS business-user UX audit — 2026-11-02

## Scope and evidence

This audit compares the current production-baseline code at commit
`085ae29e07d2f69ed4db3b15986e417e0fe4c86f` with the Founder OS PDF and the
current dashboard contracts. The inspected implementation is in
`trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx` and
`trackmcp-nextjs/src/app/dashboard/page.tsx`. The product intent is in
`/Users/krishna/Downloads/Founder OS.pdf`,
`docs/FOUNDER-OS-METRIC-CONTRACT.md`,
`docs/FOUNDER-OS-SETUP-UX-CONTRACT.md`, and
`docs/FOUNDER-OS-PDF-PRODUCT-PARITY.md`.

Facts marked **verified** are directly present in source or contract tests.
Items marked **inference** are product conclusions from the observed UI and
the intended audience; they require browser validation with a real account.

## Executive conclusion

The product has a credible structural foundation, but it is not yet fully
intuitive for a non-technical business team. The information architecture is
now mostly business-first, while the explanatory layer is still mixed with
engineering language. A technical teammate can connect the server; a business
user can eventually find useful views, but the product does not consistently
explain what each number means, why it matters, and what to do next.

This is a comprehension and prioritization gap, not evidence that the
underlying analytics are universally wrong.

## Scenario 1 — first login before setup

### What is already good (verified)

- `DashboardPageContent` loads the account and auto-provisions a workspace when
  none exists, using `POST /api/v1/account/workspace` with `create_key: false`.
- The empty state provides a primary setup action, Example data fallback, and
  three visible steps.
- The setup page distinguishes workspace, key, and first-event states.
- Example data is explicitly separated from My data.
- Identity resolution is described as optional in the setup contract.

### What is confusing (verified or strongly supported)

- The first meaningful setup copy uses “connection key”, “SDK/event
  recognized”, “MCP method”, “transport observed”, “event persisted”, and
  “deployment linkage”. These are accurate technical checks but not a useful
  first explanation for a business user.
- The page says what is checked, but not consistently what the business user
  will learn once the check is complete.
- Auto-provisioning is not surfaced as a simple milestone such as “Your
  workspace is ready; connect one server to start seeing usage.”
- A new user can be dropped into a metric-heavy dashboard before understanding
  the relationship between setup, first event, and the four business
  questions.

### Recommended fix

Add a short “What happens after setup” explanation and a plain-English setup
status translation. Keep the technical evidence expandable for engineers.

## Scenario 2 — activated business user

### What is already good (verified)

- Primary navigation is organized as Overview, The journey, What they’re doing,
  Did it work, and What’s broken.
- Secondary navigation includes Resources & prompts, Who’s using it, Evidence,
  and Setup.
- The dashboard preserves explicit `N/A` and insufficient-evidence states.
- Example data covers the Founder OS read-model surfaces, including people,
  capabilities, resources/prompts, journeys, outcomes, and issues.
- Issues expose evidence basis, affected/eligible volume, confidence, and a
  suggested next step when returned by the API.

### What is confusing (verified)

- Overview headline labels are still “AI clients”, “Activity”, “Work
  completed”, and “Needs attention”; only some of these explain the business
  question behind the number.
- Setup and evidence copy use engineering terms in the default reading path.
- The page descriptions are generally accurate but not consistently framed as
  a decision the reader can make.
- Several tables use “call”, “capability”, “transport”, “hashed entities”,
  “correlation”, or “signal” without a nearby plain-English translation.
- The user must infer the difference between observed activity, explicit
  outcomes, and missing evidence.

### Recommended fix

Give every top-level view a business-question subtitle and a compact metric
help pattern: “What this means”, “Why it matters”, and “What to do next”.
Keep exact technical names in Evidence or an expandable detail panel.

## Founder OS parity assessment

| Area | Current state | Assessment |
| --- | --- | --- |
| Business-first navigation | Present in `DashboardApp.tsx` | **Good foundation** |
| Setup flow and first-event states | Present with truthful states | **Technically strong, copy needs translation** |
| Example data | Present for all vertical slices | **Useful, but must be labeled as illustrative** |
| Who is using it | Read model and page present | **Needs clearer identity caveat and account language** |
| What they are doing | Read model and page present | **Needs business interpretation around tool/capability terms** |
| Resources & prompts | Dedicated view present | **Needs clearer outcome framing** |
| Journey | Explicit path/stall evidence present | **Needs plain-language explanation of evidence limits** |
| Did it work | Outcome and quality views present | **Needs distinction between success, error, and not observed** |
| What’s broken | Insights and issue evidence present | **Strongest decision-support surface; copy still technical in places** |
| OTel/protocol detail | Available in evidence/setup | **Should remain secondary for this audience** |

## Priority order

1. Orientation and setup comprehension.
2. Overview KPI translation and data-trust explanation.
3. Plain-English framing for each business tab.
4. Issue/action language and evidence drill-down.
5. Metric/read-model gaps from the PDF that cannot be solved by copy alone.

## This implementation pass

Implemented on isolated branch `codex/business-user-ux-audit`:

- Added business-question prompts to the top-level dashboard pages.
- Added Overview guidance explaining observed work, explicit outcomes, and
  insufficient evidence.
- Added Setup guidance explaining what the business team gets after a server
  is connected.
- Reworded the Overview and key capability/resource metrics in business terms
  without changing the analytics payload or formulas.
- Moved issue evidence basis and internal rule identifiers behind an explicit
  detail disclosure so a business reader sees the signal and recommended next
  step first.
- Added contract coverage for the new orientation and setup copy.
- Marked Example data as illustrative through the existing data-source
  contract; no sample data was mixed into My data.
- Added business-reader guidance to “Who’s using it”, including the distinction
  between account signals and a customer census, assistant-name uncertainty,
  and privacy-safe ranking language.
- Added business-reader guidance to “What they’re doing” and “Resources &
  prompts”, placing adoption/reliability interpretation before protocol detail
  and explaining resource, prompt, and explicit-outcome signals in plain
  language.
- Added a “Did it work” reading guide that separates explicit success,
  reliability friction, waiting-for-input, and unknown evidence instead of
  letting a business reader treat missing outcomes as failure or success.

Validation on the isolated worktree:

- Dashboard contract tests: **72/72 passed**.
- Business-user UX regression contract: **4/4 passed** (included in
  `npm run test:business-user-ux`).
- Metric registry contract: **4/4 passed**, including the alignment between
  executable metric labels and the dashboard copy.
- TypeScript: **passed** (`npx tsc --noEmit --pretty false`).
- ESLint: **passed** with `--quiet`.
- Production build: **passed**, 230 static pages generated.
- SEO foundation/discovery tests: **9 passed, 1 skipped** (the skipped test
  requires a runtime renderer).
- Local runtime smoke: **blocked by missing local Supabase URL/key**, not by a
  source failure. The standalone server started, but the homepage returned
  HTTP 500 because no local Supabase environment values were available. No
  credentials were copied or created.
- Independent production dashboard fetch: **not verifiable from this
  environment**. `curl` to `/dashboard?view=overview&data=example` returned
  Cloudflare HTTP 403, so no claim is made about the current authenticated
  production rendering of this branch.

This is a verified comprehension improvement, not a claim that every Founder
OS read-model or protocol surface is complete. The remaining product scope is
tracked in `FOUNDER-OS-BUSINESS-USER-UX-WORK-QUEUE.md`.

## Read-only browser verification of the current production site

The authenticated Chrome session was inspected on 2026-11-02 using the
existing TrackMCP account and workspace. This was a read-only review; no key,
workspace, telemetry, or account data was created or changed.

### First-time / no-data path (verified live)

- The Setup view explains three visible steps: create a key, install the SDK,
  and send one real event.
- The no-data state says the server is not connected and offers “Complete
  setup” plus “See Example data”.
- The page exposes a useful “What you will see here” preview and states that
  Example data is not substituted into My data.
- Advanced key scope, optional identity, privacy/data flow, and data controls
  are collapsed by default, which keeps the first-time path focused.

### Activated / example-data path (verified live)

- Example data is explicitly labeled as an illustrative finance server and is
  separated from workspace telemetry.
- The main navigation is business-oriented: Overview, Who’s using it, What
  they’re doing, Resources & prompts, The journey, Did it work, What’s broken,
  Evidence, and Setup.
- The live Overview still presents the older headline labels “AI clients”,
  “Activity”, and “Work completed”. The isolated branch changes these labels
  to “Assistants using your MCP”, “Observed work”, and “Work with an explicit
  success”. This confirms the branch’s copy improvements are not yet a
  production deployment.
- Example views provide definitions and evidence boundaries, but some labels
  still require the reader to understand terms such as “observed”, “explicit
  outcome”, “hashed entities”, and “transport”. These should remain available
  as technical detail, but the business meaning should be the first sentence
  wherever possible.

### Consequence for release readiness

The live product is usable enough for an exploratory business review, but it
is not evidence that the current branch is live. Before inviting a pilot, the
business-user UX branch still needs its normal release gate: merge/deploy,
authenticated read-only smoke checks against the deployed commit, and a
short UAT with a non-technical participant. The live browser observations are
therefore recorded as evidence, not as a substitute for deployment testing.
