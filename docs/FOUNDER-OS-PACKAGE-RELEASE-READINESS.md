# Founder OS package release readiness

This is a review record, not a publication action. No registry credentials are
used here and no package is published automatically.

## Current registry reconciliation (2026-10-24)

The current security-patched SDK release for source head `7961839` is published
and verified; the CLI/Python versions remain the previously verified immutable
release line:

| Package | Published version | Evidence |
| --- | --- | --- |
| `@trackmcp/sdk` | `0.1.14` | npm HTTP 200, public tarball and SHA-512 integrity `sha512-JEbTLmnU2KtQAgDF//PvG8pWuxt2gYCa4ggfp0B0ER+CRIykiHB82+ibvUNbOmsEJ1zCkvv8681C7IJVY2ZSwQ==`; workflow `40034334707` uploaded provenance |
| `@trackmcp/cli` | `0.1.5` | npm HTTP 200, public tarball and SHA-512 integrity; workflow `40029647746` uploaded provenance |
| `trackmcp` | `0.1.7` | PyPI HTTP 200; wheel SHA-256 `44762e5a04ccf36ec342a60d7db173a214c1645697d2031e9d7a1943fc9b0e68`; sdist SHA-256 `19c3842390cbabc1a1238b83d4d646a86fa8eb1be6ba4c2a447e41cf4f967313`; workflow `40029650698` uploaded provenance |

App Runner run `40030062391` deployed the same source after registry
propagation and passed the post-publication read-only smoke and runtime audit.
The older version tables below are retained as immutable historical evidence;
they are not the current package baseline.

Clean public-registry artifact resolution was also verified after propagation:
`npm pack --ignore-scripts @trackmcp/sdk@0.1.14 @trackmcp/cli@0.1.5` produced
both tarballs, and `pip download --no-deps trackmcp==0.1.7` produced the
published wheel. This proves installability of the exact artifacts, not a
credentialed first-event or activation result.

## Current source artifacts

| Package | Source manifest | Local release checks | Publication workflow |
| --- | --- | --- | --- |
| `@trackmcp/sdk` | `trackmcp-nextjs/packages/typescript-sdk/package.json` | SDK tests, build, and packed-consumer test | `.github/workflows/publish.yml`, `typescript` |
| `@trackmcp/cli` | `trackmcp-nextjs/packages/cli/package.json` | CLI tests and packed-consumer test | `.github/workflows/publish.yml`, `cli` |
| `trackmcp` | `packages/python-sdk/pyproject.toml` | unittest suite and build metadata audit | `.github/workflows/publish.yml`, `python` |

The current local source manifests are the next coordinated release candidate:
`@trackmcp/sdk` `0.1.15`, `@trackmcp/cli` `0.1.6`, and
`trackmcp` `0.1.8`. They are not published until the merged candidate passes
the release gate and the single `all` publication workflow completes.
The last verified public baseline remains SDK `0.1.14`, CLI `0.1.5`, and
Python `0.1.7` in the registry table above.
They were selected after a registry preflight found the immediately preceding
versions already published. The SDK 0.1.5 publication completed with
provenance and an exact clean-consumer check in publish workflow
`39655313001`. The SDK 0.1.6 publication completed with provenance and an
exact clean-consumer check in publish workflow
`39661187163`. SDK 0.1.7, 0.1.8, and 0.1.9 also completed
with provenance, registry verification, and clean-consumer checks in workflows
`39670407061`, `39677119552`, and `39678943076`; the publish workflow must
re-check any
newly selected version immediately before upload.
Never reuse an already-published version, and bump each package with its
lockfile/artifact metadata together.

## Historical source delta before the 0.1.13 train

The source after the published `@trackmcp/sdk@0.1.12` baseline now includes
bounded modern-client request correlation and Streamable HTTP/SSE response
handling (`1f81952`, `a3ed675`), plus aligned SDK documentation (`c64e603`).
Those changes were verified locally at the time and were subsequently included
in the 0.1.13 release train above. The historical wording is retained so the
reconciliation chain remains auditable.

## Source-to-registry reconciliation snapshot (2026-10-19 UTC)

This read-only snapshot prevents a local packed-consumer pass from being
mistaken for an installable pilot release. It used the package registry metadata
and a path-scoped diff from each npm artifact's recorded source commit to the
candidate branch. A registry commit being an ancestor is not enough: the
package path itself must be unchanged, or a new version must be published.

| Package | Published evidence inspected | Candidate comparison | Release decision |
| --- | --- | --- | --- |
| `@trackmcp/sdk@0.1.5` | npm publication, provenance, exact integrity, and clean consumer export check verified by publish workflow `39655313001`; integrity `sha512-jFcqNL1HQP3JO1fHnHOK7j0XIkh93H8vOkakis+NtYYb9nMzS3xe6d6Bq9F2hZWixGo1AfqvAR6cN6+Uu6d5Eg==` | Historical release; current source adds official SSE adapter support and requires 0.1.6 | Historical publication remains verified; do not use it as the current source candidate. |
| `@trackmcp/sdk@0.1.6` | npm publication, provenance, exact integrity, and clean consumer export check verified by publish workflow `39661187163`; integrity `sha512-ecKpqhOQu1Qkk8uikMyHFnLypbv5z0amUk54bxwI7ps9UWFlAG0Si5wRY5PCzPephlEzrBQvjGAAqWKmNTr4tQ==` | Merged candidate `372603ad468c58a6ddae61ec98970967fd0cc137` adds official `SSEClientTransport` support | SDK publication gate closed for this source change; disposable production activation and first-event evidence remain open. |
| `@trackmcp/sdk@0.1.9` | npm publication, provenance, exact integrity, and clean consumer export check verified by publish workflow `39678943076`; integrity `sha512-v0tigxc0bmHLEn+cPnjop+AkpFRkIuz0Hw9yuic63TUY+lqObAU80bkxKH8XB+9eiMGgxIj4ax/29HWnYDsJ4w==` | Merged candidate `9b01c4f769606acd7cde3eeaaeb7a56de01a9b11` adds the server-directed task lifecycle fixture and task-producing response metadata | Current published SDK source line; authenticated production UAT and first-event evidence remain open. |
| `@trackmcp/sdk@0.1.11` | Published with provenance and exact registry integrity; adds bounded `modern-client` `tools/list` catalog pagination and sanitization | Historical release, superseded by 0.1.12 | Retain as registry evidence; do not describe it as the current source candidate. |
| `@trackmcp/sdk@0.1.12` | Published with provenance and exact registry integrity `sha512-Qo6Z/YPAkB2wxVTDxAxPy27OMSenD1HsN+3OO1Y+4mjBVScsbbGw3TNPg+pqkGq2Ztju2Z+1hWLloHKAqO3GEA==`; its published artifact includes the then-bounded `tasks/list` and `tasks/get` observation | Current published TypeScript SDK and deployed release target; CI `39719166117`, publication `39719894614`, deployment `39720162321` | The source candidate now fails closed for removed `tasks/list` and retains explicit-handle `tasks/get`; batch this compatibility correction into the next approved SDK release rather than publishing an incidental version. |
| `@trackmcp/cli@0.1.4` | npm `gitHead` `4d704173d807ff2aded8e5bb6c0051e9df0a093a`; npm integrity retained by the registry | No files under `packages/cli` changed since that commit | The published CLI may be used only after its separate disposable production activation proof; do not imply the whole product is released. |
| `trackmcp==0.1.4` | PyPI wheel SHA-256 `0ab1a9780450b7ee811884eeebc98969993c1d093b67628c899617bfb36ba0e0`; sdist SHA-256 `b264922d39d4281f5c0a347e72516207761d80720dbd64f14f13dd03696ce22a` | Historical artifact; source changed materially after this publication | Do not use as the current pilot candidate. |
| `trackmcp==0.1.5` | PyPI publication workflow `39690522301` completed with provenance; wheel SHA-256 `b79ffa8ad638d744ecab121139028ea1a108adf5f48c16fc402bfc0e49724925`; sdist SHA-256 `b3a9070d2116c0d81c1c9c9e53ebea8911866907f668f09dbd08a16bb4268c50`; clean consumer verified version and exports | Historical release; source now includes the transport-failure observer | Historical publication remains verified; do not use as the current source candidate. |
| `trackmcp==0.1.6` | PyPI publication workflow `39701192620` completed with provenance; wheel SHA-256 `4898b68d5a02825bfef3b2cd2b8ba91467464754d1dc755f932ccda53a4c284c`; sdist SHA-256 `3fec6e02a78b54ca14a3478d1f32623f44e6d1ea8fc3b4be3b88c57a7419226b`; clean consumer exposes `record_transport_failure` | Adds privacy-safe transport failure observer and tests | Registry publication and artifact gate closed; authenticated production activation and first-event evidence remain open. |

The historical 0.1.4 checksums above identify an older Python artifact;
the current 0.1.5 checksums are recorded in the following row and do not attest
to a future candidate. Re-run this reconciliation against
the final candidate SHA immediately before publication and record the new
immutable versions and checksums in the release manifest.

For the 0.1.5 candidate, the PyPI upload, artifact check, and exact-registry
consumer test are recorded in workflow `39690522301` and the evidence ledger.

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
`test:package-release-audit` before any package-specific publish step. It can
publish one selected package or the `all` release-train scope in one reviewed
dispatch; the latter runs the same preflight and package checks sequentially
for TypeScript, CLI, and Python without requiring three separate publication
triggers. The train is deliberately sequential rather than falsely atomic:
if one registry rejects a later artifact, stop, record the already-published
immutable versions, and reconcile the remaining candidates before retrying.
This preflight checks all three package manifests, package tarball
shape, generated SDK metadata, install documentation, and version format even
when only one package is selected for publication.

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
