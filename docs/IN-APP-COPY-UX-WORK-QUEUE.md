# In-app copy and interaction clarity work queue

Each item must be backed by a source change, focused contract, and rendered
evidence before it is marked complete.

- [x] ✅ Create a research-backed copy and hierarchy strategy.
- [x] ✅ Make information hints usable by click and keyboard, not only hover.
- [x] ✅ Reduce signup friction to optional name, email, and password.
- [x] ✅ Render social-provider icons immediately while provider discovery runs.
- [x] ✅ Show supported setup paths beside the recommended setup path.
- [x] ✅ Reduce the empty space reserved by the primary activity chart.
- [x] ✅ Replace the workspace hydration screen with a compact, informative
      loading state and visible progress steps.
- [x] ✅ Add focused contract coverage for the revised signup field contract.
- [x] ✅ Add focused contract coverage for setup method discoverability.
- [x] ✅ Run the focused UX suite, typecheck, and production build against this
      change set. The UX suite passes 121/121 and the build generates 230/230
      pages.
- [x] ✅ Run the consolidated release gate and restore generated evidence
      fixtures. The gate passes 159 suites.
- [x] ✅ Run the local rendered browser pass against signup, Setup, live-data
      fallback, and activated Example data. The transient workspace-loading
      state is covered by the source contract and build; it transitions too
      quickly for a stable accessibility snapshot.
- [ ] Deploy only after review and run authenticated new-account and activated-
      account verification.
- [ ] Run the non-technical participant UAT and record comprehension failures.
