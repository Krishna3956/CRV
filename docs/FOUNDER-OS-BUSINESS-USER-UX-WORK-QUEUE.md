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
- [x] ✅ Clarify capability KPI labels so comparison values, error rates, and
      resolver-linked account scope are explicit to business readers.
- [x] ✅ Perform a read-only browser review of the current production Setup,
      Overview, Example data, and My data states; record live-vs-branch
      differences in the audit.
- [x] ✅ Run a local browser preview of the branch with Example data and Setup;
      verify the business-first navigation, visible period context, accessible
      chart tables, state-aware setup rail, and progressive technical detail.
- [x] ✅ Polish the KPI scan surface with restrained brand hierarchy and
      tabular numerals; keep the change semantic-neutral and evidence-safe.
- [x] ✅ Run dashboard contracts, typecheck, lint, and production build.
- [x] ✅ Run the consolidated release gate; all 159 suites pass after fixing
      clean-checkout MCP SDK resolution and Python artifact preparation.
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
