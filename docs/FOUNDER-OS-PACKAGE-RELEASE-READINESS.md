# Founder OS package release readiness

This is a review record, not a publication action. No registry credentials are
used here and no package is published automatically.

## Current single-package patch publication (2026-10-27)

The reviewed patch release `@trackmcp/sdk@0.1.20` was published by workflow
`40460973967` from source commit `de60a3f`. It contains the synchronized
namespaced-capability privacy boundary in the distributed Node adapter.

| Package | Published version | Registry state |
| --- | --- | --- |
| `@trackmcp/sdk` | `0.1.20` | npm HTTP 200; SHA-512 integrity `sha512-cg8If4qaIAoEzT5CLqj17IwsN36H4V77DAl4x8fXdbnlvP71ZqadIRibMIelv9ydaK7LexgXhzbtOGkvJ+fZdw==`; [tarball](https://registry.npmjs.org/@trackmcp/sdk/-/sdk-0.1.20.tgz) |

The published tarball was independently inspected and contains the
namespace-qualified capability regex. CLI and Python artifacts were
intentionally not republished; their versions and contents were unchanged.

## Current registry reconciliation (2026-10-26, published train 0.1.19/0.1.10/0.1.12)

### Latest coordinated release

The merged roots/logging parity work was published as one coordinated train by
workflow `40271909727` from main commit `33856172dd09baee5e1b4ada582ccdf00877f0b7`.

| Package | Published version | Registry state |
| --- | --- | --- |
| `@trackmcp/sdk` | `0.1.19` | npm HTTP 200; SHA-512 integrity `sha512-b1PN6XFYRAVtkX5cs2hHX1BAurQSBMFIo3fkc9qdU/gVf5wG5ffVfaVeo46RFpm4RgcNUJIyPtr+DwXBKMvivQ==`; [tarball](https://registry.npmjs.org/@trackmcp/sdk/-/sdk-0.1.19.tgz) |
| `@trackmcp/cli` | `0.1.10` | npm HTTP 200; SHA-512 integrity `sha512-C8xsjg39zlMkY6DE6ohm+fW19LIJi88pgm/an+7AvLW9x/B5aHPJoXkUprM/En5gfIQPnzPx5XLIwG6M9XjECg==`; [tarball](https://registry.npmjs.org/@trackmcp/cli/-/cli-0.1.10.tgz) |
| `trackmcp` | `0.1.12` | PyPI HTTP 200; wheel SHA-256 `91ce1efc690c6f26ac290b6cd17145909173093fc5a74b6afceafa7a12c460f2`; sdist SHA-256 `bfa3600192866c006085bef3aefdfa8130616566a23ae278792981c968700dd7` |

The workflow completed its release-artifact audit, registry uniqueness checks,
sequential publication, provenance attestation, and package verification. The
registry checks above are the authoritative publication evidence.

The reviewed source train merged to `main` as `529c1a5c8f9deb80c7d8b2c1714483fd98d988fb`.
The all-package publication workflow `40258109659` uploaded the TypeScript
artifact; its bounded verification step timed out while npm propagated, so the
workflow is not treated as wholly successful. A direct registry check later
verified the artifact. CLI and Python recovery publications completed through
`40258606412` and `40258608513`, respectively. All three exact artifacts are
now publicly resolvable:

| Package | Published version | Evidence |
| --- | --- | --- |
| `@trackmcp/sdk` | `0.1.18` | npm HTTP 200; SHA-512 integrity `sha512-CVLm5fh/oZTNI6gekdsncg4bHpGYoB7/E2YJVNyPRdxljxSTlQfvI+AZFc0IC5hUTjAWWXqA6H1usQ0IGYBtiA==`; tarball `https://registry.npmjs.org/@trackmcp/sdk/-/sdk-0.1.18.tgz` |
| `@trackmcp/cli` | `0.1.9` | npm HTTP 200; SHA-512 integrity `sha512-amCIf7czJ7AI+B+IQ9koLnQDLya265kfYr0ZGKXrsXQjqdfe0REYX6ekvE1Q0z9It4lfdT3U4psi4eC9/Cb97Q==`; tarball `https://registry.npmjs.org/@trackmcp/cli/-/cli-0.1.9.tgz` |
| `trackmcp` | `0.1.11` | PyPI HTTP 200; wheel SHA-256 `8ed6e2d7ba8cdb1424705485af0941ebbc3e2cfddc84e82824e54052829a6e51`; sdist SHA-256 `e02f79f6210411d8fa01f2bffda1b6c24e2344e727e1929cd2daedd412893528` |

Registry publication is complete for this train. Authenticated activation,
first-event UAT, rollback rehearsal, and runtime SLO evidence remain separate
pilot gates.

## Current registry reconciliation (2026-10-26)

The coordinated release train from source head
`41f93a2d38b9f31bece50a06efaaeb44277a9238` was published and verified by
workflow `40248861031`. The workflow completed the repository-wide artifact
audit, registry preflight, sequential publication, npm/PyPI verification,
clean-consumer checks, and build provenance attestations.

| Package | Published version | Evidence |
| --- | --- | --- |
| `@trackmcp/sdk` | `0.1.17` | npm HTTP 200; SHA-512 integrity `sha512-eC0IPEHNMsPSN7umeuNBzeyLtt5TvgJHcJqDmEzPPDe7N3W/NDWINoGTaMiQ/wQmZ3CoKQL+EFV08vhnIYNPrw==`; `gitHead` `41f93a2d38b9f31bece50a06efaaeb44277a9238`; npm provenance uploaded |
| `@trackmcp/cli` | `0.1.8` | npm HTTP 200; SHA-512 integrity `sha512-TWozKLamnnSZSX+8Ppx1IHkoRTJEoyq8203o+auxLDhfYIjvNDidfSSs6PYkWmjRXQ1STpofu6wYVvk3HOsafA==`; `gitHead` `41f93a2d38b9f31bece50a06efaaeb44277a9238`; npm provenance uploaded |
| `trackmcp` | `0.1.10` | PyPI HTTP 200; wheel SHA-256 `98a1645c1d6261c13aa910a1632c3036aa0a6a9454987724e1cb5cfeab95ad82`; sdist SHA-256 `c2d2634c5e7e2bb91ab8dd514539a622c7d9ef82fc8c403a5e9a0cc9cd99a8a5`; build provenance uploaded |

Publication is complete for this coordinated source train. Authenticated
production activation, first-event UAT, rollback rehearsal, and runtime SLO
evidence remain separate operational gates.

## Current registry reconciliation (2026-10-25)

The coordinated release train from source head `6d1b72c1aa731ec7c580f4b7911827b205a66524`
was published and verified by workflow `40129661973`:

| Package | Published version | Evidence |
| --- | --- | --- |
| `@trackmcp/sdk` | `0.1.16` | npm HTTP 200, SHA-512 integrity `sha512-MLmVkSOf1pmm24YGcYEsgiKZG3h/t61AKWYA7aOuJceUVMFUU1W3FNweknv4n+hv1cGw/W5jW4Cilk9oZHx8KQ==`; tarball `https://registry.npmjs.org/@trackmcp/sdk/-/sdk-0.1.16.tgz`; workflow uploaded provenance |
| `@trackmcp/cli` | `0.1.7` | npm HTTP 200, SHA-512 integrity `sha512-HzQXZAnr8oBrHFEyW5PlvgUQI8YMKvEpvKheYQzK18DBGweW8uusTui5F6EvLcp3wglkEorK7ZkvdffYS7D69Q==`; tarball `https://registry.npmjs.org/@trackmcp/cli/-/cli-0.1.7.tgz`; workflow uploaded provenance |
| `trackmcp` | `0.1.9` | PyPI HTTP 200; wheel SHA-256 `10ef4e54412de71994eab49900db7732123d08b158f764e86cdf4c58bd27f59f`; sdist SHA-256 `89f554dbe3773ab5db90c54e50fe3c004814f86b2faae595d7cbb8b8b7c7e680`; workflow uploaded provenance |

The publication workflow completed successfully, including registry verification,
sequential publication, provenance attestation, and clean-consumer checks. This
closes package publication for this source train; authenticated production
activation, first-event UAT, rollback rehearsal, and runtime SLO evidence remain
separate operational gates.

## Previous registry reconciliation (2026-10-24)

The coordinated release train from source head `108d3f2` is published and
verified by workflow `40115875394`:

| Package | Published version | Evidence |
| --- | --- | --- |
| `@trackmcp/sdk` | `0.1.15` | npm HTTP 200, SHA-512 integrity `sha512-UM3FJqVEia0pVr/U3Z9PUoKCth/4edv6BMbY1NjZqkxFwiH2oyk1PxXw6xAlf3/dexcMiOloGCm7ft7Yl5eTpg==`; workflow `40115875394` uploaded provenance |
| `@trackmcp/cli` | `0.1.6` | npm HTTP 200, SHA-512 integrity `sha512-c/7ZsWxeOi9WAal/VLjdkfxI1eej46NtoOgIS36ED2vJXYn4+Uux9bDMkAUygfW1PevjIfh0TSWiIZEwSvvyDQ==`; workflow `40115875394` uploaded provenance |
| `trackmcp` | `0.1.8` | PyPI HTTP 200; wheel SHA-256 `3ea68628d8d4d5c95204f7b9125156cade0b3e9912962ff4fef391ba5b8b8e24`; sdist SHA-256 `f511d9640d307e2e9d893627187adaf7425be7f92fb1c10f3452ec93dd4fea88`; workflow `40115875394` uploaded provenance |

App Runner run `40030062391` deployed the prior source after registry
propagation and passed the post-publication read-only smoke and runtime audit;
the release-train publication itself completed without a runtime deployment.
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

The current local source manifests match the latest published coordinated train:
`@trackmcp/sdk` `0.1.20`, `@trackmcp/cli` `0.1.10`, and `trackmcp` `0.1.12`.
The release gate and single `all` publication workflow completed successfully;
the immutable prior baseline remains in the historical tables below.
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
| `@trackmcp/sdk@0.1.12` | Published with provenance and exact registry integrity `sha512-Qo6Z/YPAkB2wxVTDxAxPy27OMSenD1HsN+3OO1Y+4mjBVScsbbGw3TNPg+pqkGq2Ztju2Z+1hWLloHKAqO3GEA==`; its published artifact includes the then-bounded `tasks/list` and `tasks/get` observation | Historical published TypeScript SDK and deployed release target; CI `39719166117`, publication `39719894614`, deployment `39720162321` | The current published train is recorded at the top of this document; the source candidate now fails closed for removed `tasks/list` and retains explicit-handle `tasks/get`. |
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
