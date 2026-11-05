# CRV agent operating instructions

This file applies to agents working anywhere in this repository. The
`trackmcp-nextjs/AGENTS.md` file adds the Next.js-specific rules for that
subtree; follow both files when working there.

## Terminal-first provider access

GitHub and AWS are configured for terminal use on the development machine.
Do not open the browser for ordinary repository, pull-request, workflow, or
AWS inspection work. Use the commands below and keep all credentials out of
the repository, command output, logs, commits, and reports.

### GitHub and Git

The repository is `Krishna3956/CRV` and the `origin` remote uses HTTPS.
`gh` stores its credential in the operating-system credential store and Git
uses the GitHub CLI credential helper after setup.

Check authentication without printing a token:

```bash
gh auth status --hostname github.com
gh api user --jq '.login'
git ls-remote origin HEAD
```

Use `gh` for GitHub work from the terminal:

```bash
gh repo view Krishna3956/CRV
gh pr list --repo Krishna3956/CRV
gh pr create --base main --head <branch>
gh run list --repo Krishna3956/CRV
gh run view <run-id> --repo Krishna3956/CRV --log-failed
gh workflow run <workflow.yml> --repo Krishna3956/CRV
```

If the GitHub session is missing or expired, run this once in a user terminal:

```bash
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
```

The browser is only needed for that initial OAuth approval or a re-login. Do
not create a token in a file, put `GH_TOKEN` in the repository, or paste a
token into a command or report. If an agent cannot authenticate, report the
exact `gh auth status` result and stop before attempting browser work.

### AWS

The AWS CLI is installed. The configured profile is `crv`, the default region
is `us-east-1`, and login-shell startup exports:

```bash
export AWS_PROFILE=crv
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
```

Verify AWS access before any AWS command:

```bash
aws --version
aws configure list
aws sts get-caller-identity
```

Use explicit `--profile crv` when running from a non-login shell or script:

```bash
aws sts get-caller-identity --profile crv
aws apprunner list-services --profile crv --region us-east-1 --output table
aws cloudformation list-stacks --profile crv --region us-east-1 --output table
```

When the temporary session expires, refresh it with the AWS CLI:

```bash
aws login --profile crv
```

For an SSH or headless terminal, use `aws login --remote --profile crv`, open
the printed AWS URL on a trusted signed-in device, and paste only the returned
authorization code into the waiting terminal. Normal AWS work after login is
terminal-only; do not fall back to CloudShell or the console just because a
command was not tried with the configured profile.

Important: the current local AWS login was obtained from an AWS console
session that identifies as the account root. This is temporary CLI access, not
a recommendation to use root for routine work. Do not create root access
keys, change billing/security settings, provision production infrastructure,
or mutate data unless the task explicitly authorizes it. The account owner
should replace this profile with a least-privilege IAM Identity Center or
assumed-role profile; then update `AWS_PROFILE` and this document to that
profile name.

### Safe authentication diagnostics

Run this compact preflight before provider work:

```bash
set -e
gh auth status --hostname github.com
git ls-remote origin HEAD >/dev/null
aws sts get-caller-identity --profile "${AWS_PROFILE:-crv}" --output json
```

If it fails, distinguish these cases:

- `gh` says not logged in: run the one-time `gh auth login` flow above.
- Git fails against `origin`: run `gh auth setup-git`, then retry
  `git ls-remote origin HEAD`.
- AWS says no credentials or expired credentials: run `aws login --profile
  crv`, then retry `aws sts get-caller-identity`.
- AWS says access denied: the identity is authenticated but lacks the
  requested permission. Do not work around it with a browser or a new
  long-lived key; request the smallest required role permission.

Never print or commit `~/.aws/cli/cache`, `~/.aws/credentials`, GitHub tokens,
`.env*` files, AWS Secrets Manager values, or production API keys. Save only
redacted status, resource names/ARNs where appropriate, and command results
that contain no credentials.

## Working together on code

`main` is the only long-lived integration branch. Production deployment is
controlled by the GitHub Actions workflow in `.github/workflows/deploy.yml`.
Each task gets a short-lived `codex/<task-name>` branch and its own Git
worktree. Never have two agents edit the same worktree.

Before editing, report your worktree path, branch, starting commit, and
`git status --short`. Read this file and any nested `AGENTS.md`. If the
worktree contains changes you do not own, stop and ask the coordinator to
assign a clean worktree. Never discard, stash, or commit another agent's work.

The coordinator assigns each agent a goal, file scope, dependencies, and an
approved base commit. Parallel agents own separate files or features. When a
task depends on another task, wait for the predecessor's reviewed commit and
start from that commit. Do not guess what another agent changed from chat
history or an uncommitted directory.

Commit only your assigned work. At handoff, report your branch, commit SHA,
changed files, verification performed, unresolved risks, and dependencies.
The coordinator integrates changes through pull requests and reviews the
combined result before merging. Agents must not push to `main`, deploy,
trigger production workflows, or alter production data unless the owner
explicitly assigns that operation.

The live App Runner release can temporarily differ from `main`, including
after a rollback. Before starting a new task, the coordinator verifies the
running release SHA and chooses the correct base commit. Do not assume that
the current `main` commit is the code running in production.

At task start, inspect open pull requests and registered worktrees for
overlapping work. Report any overlap to the coordinator before editing. The
coordinator owns task assignments and integration order.

The owner cancelled the Chinese SEO plan on 2026-11-06. Do not revive its
routes, sitemaps, hreflang, Baidu targeting, or archived task branches unless
the owner explicitly requests a new Chinese SEO project. Existing Chinese
localization is a separate feature.
