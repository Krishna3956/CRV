# TrackMCP authentication and OAuth audit

Audit date: 2026-10-29

## Decision

The application-side OAuth implementation is live for GitHub after provider
configuration in the connected Supabase project and a real end-to-end browser
sign-in. Google remains disabled and is correctly hidden by the fail-closed
provider discovery route. The production UI must not claim a provider is
available unless Supabase reports it enabled.

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
- Supabase dashboard provider state shows GitHub **ENABLED**. The live app then
  exposed the GitHub button, redirected through the GitHub authorization page,
  and returned to the authenticated dashboard with the expected workspace
  navigation. Google remains disabled and is not exposed.
- No provider secret, authorization code, code verifier, or bearer token was
  printed, stored, or added to the repository.
- No SQL migration is required for basic Supabase social authentication. The
  provider client secret remains stored only in Supabase Auth configuration.

## Local verification

- `npm run test:auth-callback`: 7 tests passed.
- `npm run test:translation`: 16 tests passed after the provider gate.
- Focused ESLint: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; 211 routes generated.
- `git diff --check`: passed.

## Provider configuration and remaining UAT

GitHub is configured in Supabase Auth using the provider callback URL
`https://qficcofvzidpvkltjkmo.supabase.co/auth/v1/callback`, and the exact
application callback `https://app.trackmcp.com/auth/callback` is used by the
live authorization request. Provider client secrets belong only in Supabase.
Google is intentionally not configured for this release.

The real GitHub sign-in and existing-user dashboard return-path checks passed
in the signed-in production browser on 2026-10-29. New-user onboarding and the
device-flow `/device?user_code=...` return-path remain separate acceptance
checks; they are not inferred from the successful OAuth callback.

## Release status

The fail-closed provider gate is merged and live in runtime
`32ff5dfef6ec6a59de230c3eed2a98e7c0803b79`. GitHub provider configuration and
one real browser sign-in are now verified. The route still intentionally hides
disabled or unavailable providers and keeps email/password as the safe
fallback. OAuth is therefore partially closed for GitHub, while Google,
new-user onboarding, and device-flow return-path evidence remain open.
