# Production pilot smoke

`trackmcp-nextjs/scripts/production-pilot-smoke.mjs` is a deliberately opt-in
operator tool for the remaining release gates. It does not execute SQL and it
does not read `.env.deploy`, AWS credentials, Supabase credentials, or the
local CLI key store.

## Read-only production check

Use a disposable operator shell and supply the exact deployed URL:

```bash
TRACKMCP_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_SMOKE \
TRACKMCP_SMOKE_BASE_URL=https://trackmcp.com \
TRACKMCP_SMOKE_CANDIDATE_SHA=<deployed-sha> \
npm run smoke:production-pilot
```

This checks the public pages, sitemap endpoints, unauthenticated key-status
boundary, and exact npm/PyPI registry metadata. It writes a `0600` redacted
JSON report to `/tmp/trackmcp-production-smoke.json` by default.

The registry portion also verifies that npm metadata exposes a SHA-512 integrity
value and a tarball hosted by the npm registry, and that PyPI exposes SHA-256
digests for both a wheel and an sdist. For a release archive, provide the
reviewed values as optional comparisons:

```bash
TRACKMCP_EXPECTED_NPM_SDK_INTEGRITY='sha512-...' \
TRACKMCP_EXPECTED_NPM_CLI_INTEGRITY='sha512-...' \
TRACKMCP_EXPECTED_PYPI_WHEEL_SHA256='...' \
TRACKMCP_EXPECTED_PYPI_SDIST_SHA256='...' \
TRACKMCP_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_SMOKE \
TRACKMCP_SMOKE_BASE_URL=https://trackmcp.com \
npm run smoke:production-pilot
```

These comparisons validate registry metadata and artifact checksums. They do
not, by themselves, prove npm provenance attestations; retain the publication
workflow's provenance result separately.

## Authenticated disposable-key check

Only after an operator has created a disposable pilot key and is intentionally
ready to create one metadata-only event, add the key and explicit write flag:

```bash
TRACKMCP_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_SMOKE \
TRACKMCP_SMOKE_ALLOW_WRITE=true \
TRACKMCP_SMOKE_REQUIRE_AUTH=true \
TRACKMCP_SMOKE_KEY='<disposable-key>' \
TRACKMCP_SMOKE_REVOKED_KEY='<revoked-disposable-key>' \
TRACKMCP_SMOKE_BASE_URL=https://trackmcp.com \
npm run smoke:production-pilot
```

The key is sent only as an HTTPS `Authorization` header. It is never printed
or written to the report. The write check submits one bounded metadata-only
`tool_call` event and records only its HTTP status. Use a disposable project
and workspace; never use a customer key.

## Evidence boundary

This runner cannot prove browser sign-up/device approval, workspace selection,
dashboard rendering, cross-workspace isolation, key rotation/revocation, live
worker scheduling, or App Runner multi-instance rate limiting. Those remain
operator/browser or SQL postflight gates and must be recorded separately. A
successful report must not be used to mark those queue items green.
