# TrackMCP authentication and OAuth audit

Audit date: 2026-10-29

## Decision

The application-side OAuth implementation is live for GitHub after provider
configuration in the connected Supabase project and a real end-to-end browser
sign-in. Google is now configured in the dedicated Google Cloud project
`trusty-diorama-513117-f6` (display name `TrackMCP`) and enabled in Supabase.
The production UI must not claim a provider is available unless Supabase
reports it enabled.

This change set therefore adds a fail-closed provider discovery route. The
social buttons render only for providers that Supabase reports as enabled; if
settings cannot be read, email/password remains the available fallback.

## Evidence

- Production authentication hostname: `https://app.trackmcp.com`.
- Browser verification: `/signin` rendered the GitHub surface and email
  authentication after the Supabase provider was enabled; the GitHub OAuth
  consent screen requested only read-only email access and returned to the
  authenticated `/dashboard` at `app.trackmcp.com`. `/signup` continues to use
  the same provider-gated surface and required Terms and Privacy checkbox.
- Missing-code callback verification redirects to `/signin` with a bounded
  error and preserves `/device?user_code=...`.
- External `next=https://evil.example` verification is reduced to
  `/dashboard`.
- Supabase dashboard provider state shows GitHub **ENABLED** and Google
  **ENABLED**. Google uses the dedicated TrackMCP Cloud project and production
  Supabase callback; the TrackMCP account is registered as a Google test user.
- No provider secret, authorization code, code verifier, or bearer token was
  printed, stored, or added to the repository.
- No SQL migration is required for basic Supabase social authentication. The
  provider client secret remains stored only in Supabase Auth configuration.
- Google Auth Platform branding is configured in the dedicated `TrackMCP`
  project: app name `TrackMCP`, support/developer email
  `krishnaatmu@gmail.com`, TrackMCP logo, homepage, privacy policy, terms, and
  the authorised `trackmcp.com` domain. The branding save was verified in the
  Google Cloud console.
- The Google OAuth app was moved from Testing to **In production** for public
  sign-in. Google now flags the configuration for verification because a logo
  is present; the OAuth request uses only the basic email/profile scopes and
  remains functional for the verified test account.

## Local verification

- `npm run test:auth-callback`: 7 tests passed.
- `npm run test:translation`: 16 tests passed after the provider gate.
- Focused ESLint: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; 211 routes generated.
- `git diff --check`: passed.

## Provider configuration and remaining UAT

GitHub and Google are configured in Supabase Auth using the provider callback URL
`https://qficcofvzidpvkltjkmo.supabase.co/auth/v1/callback`, and the exact
application callback `https://app.trackmcp.com/auth/callback` is used by the
live authorization request. Provider client secrets belong only in Supabase.

The real GitHub sign-in and existing-user dashboard return-path checks passed
in the signed-in production browser on 2026-10-29. A fresh Google sign-in using
the TrackMCP account `krishnaatmu@gmail.com` reached the Google consent screen,
returned to `https://app.trackmcp.com/dashboard`, and loaded the `krishnaatmu`
workspace with dashboard navigation and data. New-user onboarding and the
device-flow `/device?user_code=...` return-path remain separate acceptance
checks.

The Google account chooser and consent page still show
`qficcofvzidpvkltjkmo.supabase.co` as the OAuth host. This is not a stale
application label: Supabase's hosted OAuth authorize flow supplies its project
hostname as `app_domain` and callback host. Google Auth Platform branding does
not replace that host in the chooser. Supabase documents a custom Auth domain as
the supported remedy; the current project is on the Free plan and the
dashboard reports Custom Domains as a Pro add-on. No paid-plan upgrade or
billing mutation was made without explicit authorization.

To remove that hosted-domain dependency in the product flow, the Google button
now uses Google Identity Services directly and exchanges the returned Google
ID token with Supabase via `signInWithIdToken`. GitHub continues using the
existing Supabase OAuth redirect. This keeps Supabase as the session/database
authority while allowing Google's branded client to own the Google account
chooser. The direct flow is covered by the OAuth contract test and the
production build; a live browser verification is required after the next
App Runner rollout.

## Release status

The fail-closed provider gate is merged and live in runtime
`32ff5dfef6ec6a59de230c3eed2a98e7c0803b79`. GitHub provider configuration and
one real browser sign-in are verified; Google provider configuration and a
fresh Google UAT are also verified in Google Cloud, Supabase, and the live
dashboard. The route still intentionally hides disabled or unavailable
providers and keeps email/password as the safe fallback. OAuth remains
partially closed only for the separate new-user onboarding and device-flow
return-path evidence.
