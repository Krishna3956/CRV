# Business-user UX production public smoke

Date: 2026-11-03  
Scope: read-only public-route check; no authentication, database write, or
deployment was performed.

## Routes checked

Using `curl -L -A 'Mozilla/5.0'` against the current public deployment:

| Route | Status | Final URL | Bytes |
| --- | ---: | --- | ---: |
| `/dashboard` | 200 | `https://trackmcp.com/dashboard` | 46,166 |
| `/signin` | 200 | `https://trackmcp.com/signin` | 55,753 |
| `/docs` | 200 | `https://trackmcp.com/docs` | 173,271 |
| `/sitemap.xml` | 200 | `https://trackmcp.com/sitemap.xml` | 29,319 |

## Interpretation

- The public shell is reachable from the current deployment.
- This check does **not** prove that `codex/business-user-ux-audit` is live.
  The isolated branch has not been merged or deployed.
- This check does **not** prove authenticated workspace creation, live
  read-model responses, first-event ingestion, or any business dashboard
  metric in a real account.
- No production credentials were read or printed, and no Supabase mutation was
  attempted.

## Remaining evidence gate

Before calling the business-user UX goal production-ready, run the authenticated
read-only smoke and the fresh-account walkthrough described in
`FOUNDER-OS-BUSINESS-USER-UAT-SCRIPT.md` against the deployed branch, then run
the script with at least one non-technical product or operations participant.

## Browser-session limitation

The available desktop state listed a TrackMCP Setup tab, but the browser
control surface returned `browser.user is unavailable` when asked to claim or
inspect that tab. Its presence therefore cannot be treated as authenticated
rendering evidence. No attempt was made to work around that limitation by
reading credentials, changing browser settings, or mutating the product.

## Authenticated production API baseline (main, not the UX branch)

The repository's GitHub Actions workflow `Authenticated production smoke`
completed successfully on 2026-11-03 in run `41568279966`.

| Field | Redacted result |
| --- | --- |
| Workflow result | `success` |
| Branch | `main` |
| Release SHA | `9e79371f2f4218aef912b531f0b4692764b8ff08` |
| Checks | 37/37 passed |
| Production target | AWS App Runner deployment (URL intentionally omitted) |

The redacted artifact verified, for two scoped workspaces:

- key-status returned HTTP 200 with `workspace_available=true` and
  `service_available=true`;
- conflicting workspace query parameters did not change API-key scope;
- all twelve `/api/v2/*` business read-model routes returned HTTP 200;
- the legacy `/api/v1/analytics`, `/api/v1/tool-quality`, and `/api/v1/traces`
  read-model routes returned HTTP 200;
- API-key access to the action queue was denied with HTTP 403, as required for
  the human-session-only mutation boundary; and
- a revoked key was rejected with HTTP 401.

This is useful production baseline evidence for the read-model and auth
contracts, but it is **not** evidence that the isolated
`codex/business-user-ux-audit` branch is deployed. It also does not prove the
dashboard's rendered UX, fresh-account setup, workspace creation, first-event
ingestion, or a non-technical participant's unaided completion of the UAT
script. The branch remains subject to the Tier 3 gates in the readiness matrix.
