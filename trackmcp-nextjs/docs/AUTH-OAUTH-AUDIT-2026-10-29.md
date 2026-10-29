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

The Google account chooser previously showed
`qficcofvzidpvkltjkmo.supabase.co` because Supabase's hosted OAuth authorize
flow supplies its project hostname as `app_domain` and callback host. Google
Auth Platform branding cannot replace that host in the hosted chooser. The
product flow now avoids that hosted authorize path: the Google button loads
Google Identity Services directly and exchanges the returned Google ID token
with Supabase via `signInWithIdToken`. GitHub continues using the existing
Supabase OAuth redirect. Supabase remains the session/database authority while
Google's branded client owns the account chooser; no paid custom-domain upgrade
or billing mutation was made.

Live browser verification on 2026-10-29 confirmed the Google dialog title
`Sign in to trackmcp.com with google.com`, with no Supabase hostname present.
Selecting `krishnaatmu@gmail.com` reached the authenticated
`https://app.trackmcp.com/dashboard` and loaded the `krishnaatmu` workspace.
The prompt lifecycle was then hardened so a post-selection GIS notification
cannot leave a false error banner after a successful session handoff.

On 2026-10-30, Supabase's Google provider was rechecked with nonce validation
still enabled. The direct GIS flow now generates a fresh random nonce for each
attempt, sends its SHA-256 hexadecimal digest to Google, and sends the original
nonce to `signInWithIdToken`, matching Supabase's documented nonce contract.
The branded chooser was reverified after the rollout as
`Sign in to trackmcp.com with google.com`; no Supabase hostname is present.
The release passed the 36-check production pilot smoke against the direct App
Runner origin. A final dashboard redirect check from this operator IP is
currently limited by a Cloudflare block on `app.trackmcp.com` (the direct
App Runner origin is healthy), so that last browser step must be rerun after
the edge block clears.

## Release status

The provider gate and branded Google flow are merged. The current live release
is `b583e3a5` (`b583e3a53cd10386220af4e0393053371f5d7e87`), and the direct
App Runner health endpoint reports that exact release SHA. Local build,
TypeScript, auth/security contracts, and the 36-check production pilot smoke
pass. The provider configuration, branded chooser, and token exchange path are
documented separately from the remaining edge-network browser verification;
email/password remains the safe fallback while the Cloudflare block clears.
OAuth keeps email/password as the safe fallback. New-user onboarding and the
device-flow `/device?user_code=...` return-path remain separate acceptance
checks.
