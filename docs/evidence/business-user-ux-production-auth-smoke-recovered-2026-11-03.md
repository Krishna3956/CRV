# Business-user UX production auth smoke — recovered origin — 2026-11-03

This is redacted, read-only evidence. It contains no keys, workspace IDs,
response bodies, or customer data.

## Result

- Workflow: `Authenticated production smoke`
- Run: `41580849155`
- Candidate script revision: `4482a1f51b916f1e9c34a8e76a2bd3309a46708b`
- Authenticated checks passed: **39**
- App Runner health at the retest: HTTP 200
- Supabase writes or workspace mutations: none

The smoke covered the configured workspace/key pairs, tenant-scope
boundaries, Founder OS read-model routes, legacy read-model compatibility,
action-queue authorization boundaries, and revoked-key behavior. The workflow
uploaded only a redacted report artifact.

## Boundary of the evidence

This proves that the currently deployed production origin was available and
passed the authenticated read-only contract when retested. The UX branch was
not merged or deployed, so this does **not** prove that the new dashboard UI
has rendered in production. A post-merge smoke must be run again against the
deployed UX commit before calling the UX release production-ready.

The earlier HTTP 503/502 observation remains historical evidence in
`business-user-ux-production-auth-smoke-2026-11-03.md`; the service recovered
before this retest.
