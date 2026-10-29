# TrackMCP authentication and OAuth audit

Audit date: 2026-10-29

## Decision

The application-side OAuth implementation is ready for provider configuration,
but Google and GitHub are **not live** in the connected Supabase project. The
production UI must not claim that either provider is available until Supabase
enables it and a real end-to-end sign-in succeeds.

This change set therefore adds a fail-closed provider discovery route. The
social buttons render only for providers that Supabase reports as enabled; if
settings cannot be read, email/password remains the available fallback.

## Evidence

- Production authentication hostname: `https://app.trackmcp.com`.
- Browser verification: `/signin` renders Google/GitHub surfaces and email
  authentication; `/signup` renders both social controls and a required Terms
  and Privacy checkbox.
- Missing-code callback verification redirects to `/signin` with a bounded
  error and preserves `/device?user_code=...`.
- External `next=https://evil.example` verification is reduced to
  `/dashboard`.
- Supabase Auth settings probe (using the public project URL and anon key) reports:
  `external.google=false`, `external.github=false`, `external.email=true`.
- No provider secret, authorization code, code verifier, or bearer token was
  printed, stored, or added to the repository.
- No SQL migration is required for basic Supabase social authentication.

## Local verification

- `npm run test:auth-callback`: 7 tests passed.
- `npm run test:translation`: 16 tests passed after the provider gate.
- Focused ESLint: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; 211 routes generated.
- `git diff --check`: passed.

## Provider configuration still required

An operator must configure Google and/or GitHub in Supabase Auth using the
provider callback URL `https://qficcofvzidpvkltjkmo.supabase.co/auth/v1/callback`,
then add the exact application callback `https://app.trackmcp.com/auth/callback`
to Supabase URL Configuration. Provider client secrets belong only in Supabase.

After configuration, the release gate must include one real Google or GitHub
sign-in, a new-user onboarding check, an existing-user dashboard check, and a
device-flow `/device?user_code=...` return-path check. Until those checks pass,
this integration is not accepted as production-complete.

## Release status

The fail-closed provider gate is prepared locally and must not be merged or
deployed until the external provider configuration is explicitly confirmed.
