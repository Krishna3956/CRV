# Founder OS business-user UX work queue

Legend: `[x]` verified/implemented in this workstream; `[ ]` pending.

## This pass — comprehension foundation

- [x] ✅ Add business-question orientation to the Overview page.
- [x] ✅ Add a clear “what happens after setup” panel.
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
- [x] ✅ Perform a read-only browser review of the current production Setup,
      Overview, Example data, and My data states; record live-vs-branch
      differences in the audit.
- [x] ✅ Run dashboard contracts, typecheck, lint, and production build.
- [ ] Run authenticated local runtime smoke; the standalone server starts, but
      the local homepage returns HTTP 500 without local Supabase URL/key values.

## Slice-by-slice follow-up

- [ ] Who’s using it: active accounts, new vs returning, growth, client
      breakdown, unknown category, and top accounts backed by the read model.
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
