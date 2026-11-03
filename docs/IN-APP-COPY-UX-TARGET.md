# In-app copy and interaction clarity target

Date: 2026-11-03
Branch: `codex/business-user-ux-audit`

This target defines the user-visible outcome for the current copy and
information-hierarchy slice. It is intentionally narrower than a full visual
redesign: product semantics, metric formulas, privacy boundaries, and security
controls remain unchanged.

## Target experience

### First-time account

- Signup asks for only optional name, email, and password.
- The heading and primary action are visible without a product lecture.
- Terms and Privacy links sit below the primary signup form.
- Google and GitHub options retain their icon and layout while provider
  discovery is in progress.
- After authentication, the dashboard explains what setup produces and gives
  one clear next action.

### Setup

- The recommended native SDK path is visible immediately.
- Python, Go, .NET, and OpenTelemetry paths are discoverable beside it.
- Connection status explains what is known, what is missing, and what to do
  next without exposing secrets.
- Technical detail remains available through explicit secondary controls.

### Activated business view

- The page answers a business question before showing protocol terminology.
- Every metric preserves its evidence state: observed, unavailable, unknown,
  pending, or insufficient evidence.
- Explanatory `i` controls open by click and keyboard and expose an accessible
  expanded state.
- Charts use only the space needed for the question and retain a table view for
  exact values.

## Acceptance evidence

| Requirement | Evidence |
| --- | --- |
| Minimum signup fields and legal placement | `trackmcp-nextjs/src/app/signin/page.tsx`; `src/app/signin/page.contract.test.mjs` |
| Provider loading layout | `trackmcp-nextjs/src/components/OAuthButtons.tsx`; `src/components/OAuthButtons.contract.test.mjs` |
| Setup-path discoverability | `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx`; `src/components/dashboard/DashboardApp.contract.test.mjs` |
| Click/keyboard information hints | `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx`; dashboard contract suite |
| Loading and recovery copy | `trackmcp-nextjs/src/app/dashboard/page.tsx`; dashboard page contract suite |
| Build and release integrity | Focused UX suite 121/121, TypeScript check, production build 230/230 pages, release gate 159 suites |
| Local rendered review | Signup, Setup, live-data fallback, and Example overview reviewed in the local browser; transient loading state verified by source contract and build |

## Explicit boundaries

- This target does not claim a production deployment.
- Authenticated production verification and non-technical participant UAT remain
  release gates after merge/deploy.
- No database migration, metric formula, privacy rule, or security control is
  changed by this slice.
