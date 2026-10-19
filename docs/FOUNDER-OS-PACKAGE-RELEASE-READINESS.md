# Founder OS package release readiness

This is a review record, not a publication action. No registry credentials are
used here and no package is published automatically.

## Current source artifacts

| Package | Source manifest | Local release checks | Publication workflow |
| --- | --- | --- | --- |
| `@trackmcp/sdk` | `trackmcp-nextjs/packages/typescript-sdk/package.json` | SDK tests, build, and packed-consumer test | `.github/workflows/publish.yml`, `typescript` |
| `@trackmcp/cli` | `trackmcp-nextjs/packages/cli/package.json` | CLI tests and packed-consumer test | `.github/workflows/publish.yml`, `cli` |
| `trackmcp` | `packages/python-sdk/pyproject.toml` | unittest suite and build metadata audit | `.github/workflows/publish.yml`, `python` |

The current local source manifests are deliberately distinct candidate versions:
`@trackmcp/sdk` `0.1.2`, `@trackmcp/cli` `0.1.4`, and `trackmcp` `0.1.4`.
They were selected after a registry preflight found the immediately preceding
versions already published. These are **not publication claims**: the publish
workflow must re-check the exact selected version immediately before upload.
Never reuse an already-published version, and bump each package with its
lockfile/artifact metadata together.

## Consumer-facing installation rule

Documentation uses unpinned install commands so it does not silently direct a
new user to an obsolete patch version:

```bash
npm install @trackmcp/sdk
python3 -m pip install trackmcp
npx @trackmcp/cli init
```

Applications that require reproducibility should pin the resolved version in
their own lockfile or requirements file after selecting a published release.

## Publication gate

Before dispatching the workflow for a selected package:

1. Confirm only the intended candidate package version and its lockfile/generated
   metadata will be published. Do not change the version after the reviewed SHA
   has been chosen.
2. Run the package tests and the repository package-release audit.
3. Build a clean artifact and inspect its file list for secrets, local paths,
   campaign assets, and unrelated files.
4. Confirm the exact version is not already present on npm/PyPI; the publish
   workflow performs this preflight and fails before upload when it is. Publish
   once with provenance (npm) or `twine check` (PyPI).
5. Install the exact published version in a clean temporary consumer and run
   the first-event/key-status smoke without printing credentials.
6. Record the immutable registry version, artifact checksum, workflow run, and
   rollback/install command in the release manifest.

The manual GitHub Actions workflow now runs the repository-wide
`test:package-release-audit` before any package-specific publish step. This
preflight checks all three package manifests, package tarball shape, generated
SDK metadata, install documentation, and version format even when only one
package is selected for publication.

No package is considered customer-ready merely because a local packed-consumer
test passes; that test proves packaging shape, not registry publication or
production endpoint compatibility.

## Provenance status

The currently published versions have verified registry metadata and checksums,
but the repository's read-only GitHub attestations view did not expose a build
attestation for those historical publications. The publish workflow now requests
`attestations: write`, packs npm subjects outside the package tree, and attaches
`actions/attest-build-provenance@v2` subjects for npm and Python artifacts. This
remediates future publications; it is not retroactive evidence for the versions
already in the registries. Queue item 255 therefore remains open until a new,
uniquely versioned package publication completes and its attestation URL or
equivalent retained evidence is recorded.

## Dependency security evidence (2026-10-19)

The TypeScript SDK was upgraded from `@modelcontextprotocol/sdk` 1.30.0 to
1.32.1, the current npm `latest` version at this audit. The previous direct
high-severity MCP SDK advisory is no longer present. SDK unit tests, the build,
and the packed-consumer test pass against 1.32.1.

`npm audit` and `npm audit --omit=dev` now both report zero vulnerabilities for
the package after the lockfile-only remediation of the transitive development
tree (`fast-uri`, `hono`, `ip-address`, `proxy-addr`, and `qs`). This does not
claim that a customer application's own dependency tree is safe.

The companion web-runtime dependency review is recorded in
`docs/FOUNDER-OS-WEB-DEPENDENCY-SECURITY.md`. Its production-only audit is
also enforced in web CI; the remaining development-only ESLint advisory chain
is documented rather than hidden by an unsafe major-version downgrade.
