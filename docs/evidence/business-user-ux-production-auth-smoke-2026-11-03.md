# Business-user UX production smoke — 2026-11-03

This is a redacted, read-only runtime evidence record for the business-user UX
release candidate. It contains no keys, workspace identifiers, response bodies,
or customer data.

## Candidate and workflow

- Candidate commit: `bcaaab637863d34ba8d15968c3422cf04716652e`
- Branch: `codex/business-user-ux-audit`
- Workflow: `Authenticated production smoke`
- Run: `41577636745`
- Production origin: the configured App Runner origin (hostname omitted here)

## Result

The smoke did not reach any passing checks. It failed at the first authenticated
key-status request:

```text
workspace A key-status expected HTTP 200, received HTTP 503
```

The workflow produced a redacted failure artifact and did not write to Supabase,
create data, mutate a workspace, or expose authorization material.

## Availability observations

- The same origin reported `/api/health` with the deployed mainline release
  SHA during an initial probe.
- Subsequent direct probes returned HTTP 502 from the App Runner/Envoy edge for
  both `/api/health` and authenticated API paths.
- A follow-up direct probe at 2026-11-03 04:36 UTC returned HTTP 503 from the
  App Runner origin for `/api/health`; the public hostname returned an edge
  protection response. The service therefore remains unavailable for a fresh
  authenticated retest.
- This is an external production-availability failure. It does not prove a
  defect in the UX branch because that branch has not been merged or deployed.

## Comparison and next gate

The prior baseline smoke run `41568279966` passed 37 redacted checks against
mainline before this failure. The UX branch still has no production rendering
evidence.

Before the UX release can be called production-ready, an operator must restore
the App Runner service to a stable state, then rerun the authenticated smoke
against the intended deployed commit. Do not treat a successful local build or
the earlier baseline as a substitute for that retest.
