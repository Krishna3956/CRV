# TrackMCP final engineering handoff

**Date:** 2026-10-30 (Asia/Calcutta)
**Repository:** `Krishna3956/CRV`
**Default branch:** `main`
**Current source tip:** `96aeb508` (`fix: serialize refresh recovery batches`)
**Current deployed application revision:** `177165180383e31bb7760040469f9aaa7f78f8a1`
**App Runner deployment:** workflow `41013186081`
**Authenticated production smoke:** workflow `41014068784`
**Latest main CI:** workflow `41015565958`

This is the compact knowledge-transfer document for the next engineer. It is
authoritative for the current handoff date and points to the more detailed
records instead of duplicating every historical event.

## 1. The goal

The original goal was to take the existing TrackMCP product, compare it with
the Founder OS requirements and the accumulated engineering handoff, and make
the product safe and usable for the first 100 customers. The work was intended
to be autonomous and evidence-driven: inspect the whole repository, implement
missing behavior, preserve privacy and tenant isolation, test the MCP/OTel/SDK
surfaces, deploy through the normal GitHub/App Runner path, and maintain a
living record of what is verified versus what still requires an external
owner, provider, or release decision.

The goal was not “make the build green once.” It was to leave a new engineer
with a reproducible release path and no ambiguous claim that an unverified
feature is complete.

## 2. Current outcome

### Verified and shipped

- The published CLI defect was reproduced and fixed. `@trackmcp/cli@0.1.12`
  exited silently because npm/npx invoked the `.bin` symlink without satisfying
  the old `import.meta.url` entrypoint guard. `0.1.13` resolves the real path,
  dispatches commands, prints help/diagnostics, reports errors, and reaches the
  interactive device-auth path.
- OAuth provider discovery in the web sign-in/sign-up surface now retries only
  bounded transient edge/network failures, fails closed on malformed or
  permanent responses, keeps email sign-in available, and avoids a layout
  shift while provider discovery is pending.
- The OAuth/auth callback, translation, tenant/privacy, MCP protocol, SDK,
  dashboard, worker, deployment, and package-consumer contracts are covered by
  the existing release gate. The last local release gate exited successfully;
  lint, TypeScript, and the 211-route production build also passed.
- PR [#765](https://github.com/Krishna3956/CRV/pull/765) merged the auth
  resilience change. App Runner workflow `41013186081` passed release gate,
  image build/push, rollout, production smoke, immutable release identity,
  runtime-safety checks, and live translation-provider checks.
- Direct origin postflight after deployment returned health with the exact
  deployed SHA, `/api/auth/providers` returned `{"google":true,"github":true}`,
  and `/signin` returned HTTP 200. The authenticated production smoke workflow
  `41014068784` passed.
- The latest main CI workflow `41015565958` passed web/JavaScript, Go, and .NET
  lanes. The Vercel PR check was rate-limited by the account build quota; this
  is recorded as an external CI limitation, not a TrackMCP test failure.
- The refresh-health workflow fix merged as PR #766, timestamp retention merged
  as PR #769, and the serial recovery hardening merged as PR #770. Health run
  `41020556319` proves four complete AWS worker samples with zero worker
  failures/retries/parse failures and maximum lag `845605ms` within the
  `900000ms` budget, but remains warning because the bounded AWS window
  contains one scheduler failure and retained GitHub recovery history contains
  one timed-out sample. Worker run `41020485719` is clean at `879644ms`; retain
  a clean bounded AWS window before changing the provider-owned gate.

### Current package train

| Package | Current checked-in/published version | Evidence |
| --- | --- | --- |
| `@trackmcp/cli` | `0.1.13` | `trackmcp-nextjs/packages/cli/package.json`; npm registry confirms `0.1.13` |
| `@trackmcp/sdk` | `0.1.25` | `trackmcp-nextjs/packages/typescript-sdk/package.json`; npm registry confirms `0.1.25` |
| `trackmcp` Python SDK | `0.1.15` | `packages/python-sdk/pyproject.toml` and built artifacts in `packages/python-sdk/dist/` |
| Go SDK | no registry version in source | module is `github.com/trackmcp/trackmcp-go`; release/tag publication is a separate decision |
| .NET SDK | `0.1.0` in `TrackMcp.csproj` | NuGet publication is not claimed by this handoff |

Do not bump or publish a package for a one-line change. The publication
workflow is deliberately release-train gated and requires the exact
`RELEASE_TRAIN_APPROVED` confirmation. See `.github/workflows/publish.yml` and
`.github/workflows/publish-python.yml`.

## 3. What is intentionally still open

These are not hidden defects and must not be marked complete merely because
source tests pass:

- Release-owner GO/NO-GO for the first-100 cohort and explicit pilot scope.
- Supabase backup/PITR posture and an accepted recovery owner/process. The
  current evidence records the Free tier and PITR limitation; see
  `docs/FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md`.
- Formal privacy export/deletion acceptance by the release owner. The code is
  bounded and privacy-safe, but acceptance is a governance decision.
- Customer-owned MCP endpoint/protocol UAT through the guarded
  `customer-endpoint-uat.yml` workflow. The harness exists; a real customer
  endpoint run still needs operator-supplied endpoint/version/credentials.
- Refresh-health freshness should continue to be monitored. The queue repair
  and replay evidence is recorded, but the health gate must be re-evaluated
  against the latest scheduled sample window rather than inferred from old
  successful jobs.
- External SEO/backlink/GSC work remains external evidence. Internal SEO and
  crawlability fixes are source-controlled, but backlinks require GSC or a
  backlink index and human outreach.
- Real end-user browser acceptance of both Google and GitHub OAuth, including
  new-user onboarding and device-flow return paths, remains a release-owner
  acceptance activity even though automated authenticated smoke passed.

The authoritative evidence trail is split intentionally:

- [Readiness ledger](../FOUNDER-OS-100-CUSTOMER-READINESS-LEDGER.md)
- [Readiness snapshot](../FOUNDER-OS-100-CUSTOMER-READINESS-SNAPSHOT.md)
- [Pilot external-gate register](../FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md)
- [Pilot release record](../FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md)
- [CLI entrypoint audit](../CLI-ENTRYPOINT-AUDIT-2026-10-30.md)
- Existing handoff requirements/decisions/state/verification:
  `docs/codex-handoff/REQUIREMENTS.md`, `DECISIONS.md`, `PROJECT_STATE.md`,
  `VERIFICATION.md`, and `PENDING_WORK.md`.

Older sections in the pilot release record contain historical deployed SHAs.
Always use the top dated entry in this handoff plus the direct `/api/health`
probe and the GitHub workflow ID before describing what is live.

## 4. How to make a future change live

### Normal application change

```bash
git fetch --prune origin
git switch main
git pull --ff-only origin main
git switch -c codex/<short-change-name>

cd trackmcp-nextjs
npm ci
npm run lint
npx tsc --noEmit
npm run build
npm run test:release-gate
```

Commit only the intended change, push the branch, and create one coherent PR
through the terminal. Wait for the web/Go/.NET checks. Merge only after the
checks and review are satisfactory. A push to `main` deploys automatically
only when the changed paths match the runtime paths in
`.github/workflows/deploy.yml`; documentation-only changes intentionally do
not trigger an App Runner rollout.

### Manual immutable deployment or rollback

Use a full 40-character commit SHA, never a moving branch name:

```bash
GH_TOKEN="$(printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | sed -n 's/^password=//p')" \
  gh workflow run deploy.yml --ref main -f deploy_ref=<40-character-commit-sha>

GH_TOKEN="$(printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | sed -n 's/^password=//p')" \
  gh run list --workflow deploy.yml --limit 10

GH_TOKEN="$(printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | sed -n 's/^password=//p')" \
  gh run watch <run-id> --exit-status
```

The deployment workflow itself runs the release gate, builds and pushes the
immutable ECR image, rolls App Runner, verifies the release SHA, runs the
read-only production smoke, audits runtime flags, and verifies the live
translation provider. A successful workflow is the deployment evidence.

### Post-deploy probes

Use the App Runner origin from the workflow output, not a cached Cloudflare
response, for first diagnosis:

```bash
origin='https://<current-app-runner-origin>'
curl -fsS "$origin/api/health"
curl -fsS "$origin/api/auth/providers"
curl -fsSI "$origin/signin"
```

Then verify the authenticated production smoke workflow triggered by the deploy
and record both workflow IDs and the exact `release_sha` in the readiness ledger.

### Package publication

Package publication is a batched release-train operation:

```bash
GH_TOKEN="$(printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | sed -n 's/^password=//p')" \
  gh workflow run publish.yml --ref main \
  -f package=all -f confirm=RELEASE_TRAIN_APPROVED
```

Do not run this for ordinary application fixes. The workflow audits artifacts,
checks that versions are not already present in npm/PyPI, runs package tests,
publishes with provenance, and blocks accidental duplicate versions.

## 5. GitHub cleanup completed

- There are no open PRs at handoff time.
- The last application PR is #765 and is merged.
- The remote branch created for that PR was removed after merge.
- 133 old `codex/*` branches whose tips were already ancestors of `main` were
  deleted safely. Their commits remain reachable from `main` or merged PRs.
- 438 unmerged `codex/*` branches were deliberately preserved because deleting
  unmerged history could destroy recoverable work. They are not pending PRs;
  they are dormant branches. A future owner may archive/delete them only after
  reviewing their branch owners and whether any work is intentionally retained.
- Local user artifacts were not deleted or staged: `docs/codex-handoff/`,
  `docs/mcp-blog-backlink-plan-2026-10.md`, `tmp/`, and
  `trackmcp-nextjs/scripts/live-blog-audit.mjs`.

## 6. First actions for the next engineer

1. Read this file, then the top entries of the readiness ledger and external
   gate register.
2. Confirm `git status --short --branch` and `git log -1 --oneline` before
   changing anything.
3. Do not trust a historical SHA in the bottom half of a release record. Probe
   `/api/health` and match the returned `release_sha` to the deployment run.
4. If the next task is implementation, create one branch and one coherent PR;
   do not publish packages until the release train is intentionally batched.
5. If the next task is release approval, resolve the external gates above and
   record the owner decision; do not convert HOLD to GO from engineering tests
   alone.
