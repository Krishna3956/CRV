# Founder OS web dependency security

This is a local review record for the web application dependency tree. It is
not a deployment or publication instruction.

## Remediation completed

The web application now pins the security-relevant direct packages to:

- `next` `16.4.2`
- `eslint-config-next` `16.4.2`
- `@modelcontextprotocol/sdk` `1.32.1`

The previous Next.js critical advisory and the direct MCP SDK advisory are no
longer present in the lockfile audit. The lockfile was regenerated with npm's
lockfile-only workflow and the installed tree was validated with `npm ci`.

## Current audit policy

`npm audit --omit=dev --audit-level=high` reports zero vulnerabilities. This is
the release-blocking audit because only production dependencies are shipped in
the web runtime.

The full development-tree audit still reports five high-severity findings in
the `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` →
`micromatch` → `braces` chain. npm's suggested automatic fix would downgrade
`eslint-config-next` to 14.2.35, which is an unsafe major-version regression;
that fix was not accepted. The findings are development-only and are not
present in the production dependency audit.

CI now enforces the production-only audit immediately after the web
installation step. The full development audit remains visible for future
upstream remediation and must not be silently represented as zero.

## Verification evidence

- `npm ci --ignore-scripts`: passed.
- `npm audit --omit=dev --audit-level=high`: passed with zero vulnerabilities.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run test:release-gate`: passed, 76 suites.
- Isolated production build with `NEXT_DIST_DIR=.next-founder-os-rootqa`: passed,
  166 static pages generated.
- Isolated production runtime smoke on port 3200: passed, 8 public routes and
  10 protected/API checks.

The existing development server on port 3000 was not stopped or restarted.
Its smoke failure is environmental: it is an older Next 16.3.3 process with a
stale/generated development state. It is not evidence against the isolated
Next 16.4.2 production build.
