# Founder OS business-user UX work queue

Legend: `[x]` verified/implemented in this workstream; `[ ]` pending.

## This pass — comprehension foundation

- [x] ✅ Add business-question orientation to the Overview page.
- [x] ✅ Add a clear “what happens after setup” panel.
- [x] ✅ Clarify the signup handoff so a new account knows that a technical
      teammate connects one server and the dashboard then explains usage,
      outcomes, and issues.
- [x] ✅ Translate setup readiness states into business language while preserving
      technical evidence.
- [x] ✅ Add plain-English meaning/help for the four Overview KPIs.
- [x] ✅ Add a business question and evidence caveat to each top-level page.
- [x] ✅ Translate the highest-visibility journey, capability, resource, and
      reliability labels without changing their formulas.
- [x] ✅ Keep issue evidence and internal rule identifiers behind an explicit
      detail disclosure so business readers see the signal and next step first.
- [x] ✅ Translate the setup readiness checklist into business-language states;
      preserve the technical evidence contract underneath.
- [x] ✅ Keep Example data visibly illustrative and separate from My data.
- [x] ✅ Add contract tests for the orientation and setup copy.
- [x] ✅ Add plain-language account-activity guidance, assistant naming caveats,
      and privacy-safe signal wording to “Who’s using it”.
- [x] ✅ Add an adoption-first reading order and technical-detail boundary to
      “What they’re doing”.
- [x] ✅ Add plain-language interpretation for resource lookups, guided-help
      requests, and explicit outcomes in “Resources & prompts”.
- [x] ✅ Add a business reading guide to “Did it work” that separates explicit
      success from reliability friction and unknown evidence.
- [x] ✅ Add an action-oriented reading guide to “What’s broken” so business
      users know how to prioritize signals without treating them as diagnoses.
- [x] ✅ Add a journey reading guide that distinguishes observed paths from
      explicit stop evidence and avoids abandonment inference.
- [x] ✅ Make the post-signup dashboard loading state explain workspace
      preparation instead of showing a generic loading message.
- [x] ✅ Add an Evidence-view guide that makes technical drill-down and privacy
      boundaries clear to business readers.
- [x] ✅ Keep the internal Founder OS project name out of customer-facing
      dashboard labels; use TrackMCP language in the shell and desktop-only
      support notice.
- [x] ✅ Keep the internal Founder OS project name out of the public API
      documentation; technical readers see TrackMCP analytics terminology.
- [x] ✅ Add a requirement-by-requirement readiness matrix that separates
      branch proof, live read-only evidence, and remaining pilot gates.
- [x] ✅ Make the no-workspace “Complete setup” action navigate to Setup while
      workspace provisioning runs, so a first-time user reaches the key and
      SDK instructions instead of remaining on an empty analytics tab.
- [x] ✅ Make the Setup step rail reflect the real first action for each state:
      workspace creation, key creation, or reuse of an active key.
- [x] ✅ Rewrite no-data page previews with business language so a first-time
      reader understands what each tab will show before connecting telemetry.
- [x] ✅ Research PostHog, Amplitude, GA4, USWDS, Material, NN/g, and
      Microsoft product-writing guidance; record the source-to-change decisions
      in `FOUNDER-OS-BUSINESS-USER-UX-RESEARCH.md`.
- [x] ✅ Add table alternatives for the Overview activity chart and account
      growth chart so business users can read exact values without relying on
      hover interactions.
- [x] ✅ Add a table alternative for the capability trend chart so feature
      comparisons remain readable without visual or hover-only interpretation.
- [x] ✅ Add a table alternative for explicit outcome trends so business users
      can compare completed, failed, pending, and unknown states by period.
- [x] ✅ Add a table alternative for resource and prompt trends so information
      needs can be compared without relying on card-only visual scanning.
- [x] ✅ Add a table alternative for journey reach so observed step coverage
      can be compared without relying on progress-bar interpretation.
- [x] ✅ Move dense protocol-family and lifecycle detail behind an explicit
      “Technical protocol evidence” disclosure on the capability view.
- [x] ✅ Put the repeated capability inventory and catalog detail behind a
      second progressive-disclosure boundary so the business summary remains
      the default reading path.
- [x] ✅ Put repeated resource/prompt entity and transport detail behind a
      progressive-disclosure boundary so information-need and outcome KPIs
      remain the default reading path.
- [x] ✅ Clarify capability KPI labels so comparison values, error rates, and
      privacy-safe account-group scope are explicit to business readers.
- [x] ✅ Align the canonical metric registry and Founder OS metric contract
      with the dashboard's privacy-safe “account group” vocabulary.
- [x] ✅ Perform a read-only browser review of the current production Setup,
      Overview, Example data, and My data states; record live-vs-branch
      differences in the audit.
- [x] ✅ Run a local browser preview of the branch with Example data and Setup;
      verify the business-first navigation, visible period context, accessible
      chart tables, state-aware setup rail, and progressive technical detail.
- [x] ✅ Run a settled-route browser pass across every business-facing tab;
      verify that direct Example-data links load their own business question,
      evidence boundary, and data-source marker. Setup remains a live
      connection workflow even when the global Example-data toggle is selected.
- [x] ✅ Polish the KPI scan surface with restrained brand hierarchy and
      tabular numerals; keep the change semantic-neutral and evidence-safe.
- [x] ✅ Add a bounded Overview “At a glance” takeaway so a business reader
      gets the plain-language meaning of the selected window before reading
      KPI cards or charts; reuse read-model fields and state the evidence limit.
- [x] ✅ Run a final business-language pass on the primary dashboard path:
      replace avoidable engineering terms such as telemetry, resolver signal,
      and account signal with activity, account group, and plain-English
      evidence wording while keeping technical detail available in disclosures.
- [x] ✅ Apply the same interaction affordance contract to the first-time
      authentication path: primary sign-in/sign-up and social-provider controls
      expose a pointer cursor, visible keyboard focus, and an explicit disabled
      state so the first setup step does not look inert.
- [x] ✅ Simplify Setup status states so a business reader sees “recent server
      activity”, “partial view”, and “account grouping unavailable” before
      technical evidence terminology.
- [x] ✅ Make Overview session rows business-readable: show a simple observed
      session label, call the drill-down “Open evidence”, and explain that
      reported completion—not session activity alone—is counted as success.
- [x] ✅ Add a state-aware “Recommended next step” on Overview so a new user,
      an activated user with missing outcomes, and an activated user with
      evidence-backed signals each get a truthful next action.
- [x] ✅ Keep optional key scoping out of the primary setup instruction; users
      are told to create a connection key first and can configure scopes later.
- [x] ✅ Keep active key scope behind an optional technical-details disclosure;
      automatically open it when the latest event does not match the scope so
      the business reader sees the recovery path without a persistent setup
      block.
- [x] ✅ Keep the language selector in the global header only; remove the
      duplicate sidebar control so the desktop navigation has one predictable
      location for global settings.
- [x] ✅ Give live-data load failures a safe fallback: keep `Retry` primary,
      but offer `See Example data` so a business reader can continue learning
      without substituting sample values into live data.
- [x] ✅ Replace the blank first-load screen with a branded workspace-preparation
      state that explains account, workspace, and dashboard loading in three
      short steps.
- [x] ✅ Apply a dashboard-only visual system: cool neutral surfaces, indigo
      primary actions, semantic status text, and no gradients in dashboard
      surfaces.
- [x] ✅ Add a repo-scoped `trackmcp-business-copy` skill with customer-facing
      vocabulary, evidence-boundary rules, recovery-copy rules, and a focused
      review checklist so future copy changes do not drift back toward
      technical or over-verbose language.
- [x] ✅ Prevent deep-linked dashboard routes from briefly rendering the wrong
      data source while the URL state hydrates; show a neutral loading handoff
      and gate live-data fetches until the selected route is known.
- [x] ✅ Give an activated Setup user a direct `Open Overview` handoff after
      first activity is verified, so the setup page explains the next business
      action instead of making the reader infer where to go.
- [x] ✅ Keep observed server, environment, and deployment linkage details
      available without competing with the three-step setup path: move them
      into a collapsed `Observed connection details` disclosure and explain
      that they are bounded labels, not a deployment inventory or health check.
- [x] ✅ Keep the detailed readiness checklist out of the first setup scan:
      expose the connection status and recovery action first, then place the
      individual evidence checks and percentage behind a collapsed `Setup
      evidence` disclosure.
- [x] ✅ Translate the visible Overview data-trust labels from engineering
      vocabulary to business language (`Activity observed`, `Activity
      recency`, `Account-grouped activity`, and `Dashboard refresh`) while
      retaining the underlying evidence caveats and bounded worker metrics.
- [x] ✅ Move the Resources & prompts technical evidence boundary out of the
      default KPI scan and into the expanded detail section; keep the privacy
      and non-completion limits discoverable for engineering readers.
- [x] ✅ Keep the Overview's decision KPIs and Founder OS outcome summary
      above the expandable evidence/protocol block so a business reader sees
      the decision surface before implementation detail.
- [x] ✅ Keep the journey's opaque async-task table behind a collapsed
      `Technical task evidence` disclosure; the default journey path remains
      common paths, stop evidence, pauses, and explicit outcomes.
- [x] ✅ Keep the setup journey's credential name consistent: customer-facing
      setup copy now uses `connection key` in the error path and setup handoff;
      internal API field names remain unchanged.
- [x] ✅ Apply the same business-readable evidence language inside the Evidence
      tab: remove the engineering-only “Trace Explorer” action label, hide raw
      session identifiers from the primary table, and expose a clear “Open
      evidence” action.
- [x] ✅ Normalize evidence action capitalization across dashboard surfaces so
      the same action is always written as `Open evidence`.
- [x] ✅ Remove the last title-case `Open Evidence` labels from secondary
      journey, quality, issue, and evidence actions so business users encounter
      one consistent drill-down phrase throughout the dashboard.
- [x] ✅ Replace the remaining “semantic facts” subtitle on Outcome evidence
      with a direct explanation of what the dashboard counts and what it does
      not infer.
- [x] ✅ Replace internal-sounding Quality helper labels such as “semantic
      evidence” and “explicit workflow terminals” with business-readable
      explanations that say the values come from server-reported starts,
      failures, and final states.
- [x] ✅ Make the Setup step rail state-aware: new workspaces highlight the
      workspace/key step, keyed workspaces without activity highlight sending
      the first event, and connected workspaces stop showing a misleading
      always-active first step.
- [x] ✅ Align the capability metric vocabulary with the business question:
      `Feature uses observed`, `Feature uses in previous period`, and
      `Average features per account group` now describe the same existing
      formulas without changing their data source or denominator.
- [x] ✅ Make the People cards explicit about their evidence boundary:
      `New this period` now says it is first observed activity, not signup,
      and `Returning this period` now says it is repeat activity, not a
      retention claim.
- [x] ✅ Keep OAuth provider loading placeholders visually non-actionable until
      provider discovery completes; the hand cursor is reserved for real
      controls.
- [x] ✅ Run dashboard contracts, typecheck, lint, and production build.
- [x] ✅ Run the consolidated release gate; all 159 suites pass after fixing
      clean-checkout MCP SDK resolution and Python artifact preparation.
- [x] ✅ Give every visible sign-in/sign-up and recovery control a consistent
      pointer affordance, disabled cursor state, and keyboard focus ring so a
      first-time user can tell what is actionable before authentication.
- [x] ✅ Keep the illustrative “Who's using it” growth chart coherent with its
      KPI cards; the example now renders a weekly series ending at the stated
      active-account total instead of showing a contradictory empty chart.
- [x] ✅ Run a built local runtime smoke with the documented dashboard bypass:
      `/signin`, `/signup`, the Example-data Overview and Setup routes, `/docs`,
      and `/sitemap.xml` returned HTTP 200; this remains local evidence, not
      authenticated production evidence.
- [x] ✅ Sweep every current business dashboard view in the rebuilt standalone
      server with Example data; Overview, Who’s using it, What they’re doing,
      Resources & prompts, The journey, Did it work, What’s broken, Evidence,
      and Setup all returned HTTP 200 with TrackMCP content.
- [ ] Run authenticated local runtime smoke; the standalone server starts, but
      the local homepage returns HTTP 500 without local Supabase URL/key values.

## Slice-by-slice follow-up

- [ ] Who’s using it: active accounts, new vs returning, growth, client
      breakdown, unknown category, and top accounts backed by the read model.
- [ ] Overview: add period-over-period comparison only after the read model
      exposes two trustworthy windows; do not infer comparison values in UI.
- [ ] What they’re doing: adoption breadth, top capabilities, trends, and
      capability detail with business labels.
- [ ] Resources & prompts: top resources, top prompts, completion/stall, and
      privacy-safe detail drill-down.
- [ ] The journey: common paths, explicit stop evidence, stall/retry, and a
      clear statement that missing events are not abandonment.
- [ ] Did it work: outcome rates, error rates, retries, latency, and
      insufficient-data states with consistent definitions.
- [ ] What’s broken: affected volume, confidence, likely cause, recommended
      action, and evidence links for every actionable insight.
- [ ] Setup: unify server, environment, scoped key, optional identity,
      privacy, and first-event verification into one guided story.

## Release gates

- [ ] No formula or read-model changes without metric-contract review.
- [ ] No business label that overstates self-reported identity.
- [ ] No “healthy” claim from missing data.
- [ ] No deployment until focused tests, production build, and authenticated
      read-only smoke checks pass.
- [ ] Browser review with a new account and an activated example/data account.
- [x] ✅ Browser review with the existing authenticated account and an
      activated Example data view (read-only); a new-account review remains
      pending.
- [ ] Run `FOUNDER-OS-BUSINESS-USER-UAT-SCRIPT.md` with at least one
      non-technical product/operations participant.

## Evidence log

- Baseline commit: `085ae29e07d2f69ed4db3b15986e417e0fe4c86f`.
- Current implementation: `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx`.
- Setup/account orchestration: `trackmcp-nextjs/src/app/dashboard/page.tsx`.
- Metric truth contract: `docs/FOUNDER-OS-METRIC-CONTRACT.md`.
- Setup truth contract: `docs/FOUNDER-OS-SETUP-UX-CONTRACT.md`.
- Product intent and tab definitions: `/Users/krishna/Downloads/Founder OS.pdf`.
