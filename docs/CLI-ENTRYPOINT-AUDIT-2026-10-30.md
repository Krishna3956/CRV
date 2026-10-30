# TrackMCP CLI entrypoint audit

Date: 2026-10-30

## Finding

`@trackmcp/cli@0.1.12` was published with an entrypoint check that compared
`resolve(process.argv[1])` to the module path. npm and npx execute a package
`bin` through `node_modules/.bin/trackmcp`, which is a symlink. `resolve()`
normalizes the path text but does not resolve that symlink, so the comparison
was false. The module was loaded and then exited with status 0 before argument
parsing, help, doctor, init, browser authorization, or error handling ran.

This is why all of the following appeared to succeed silently with 0.1.12:

```text
npx @trackmcp/cli init
npx --yes @trackmcp/cli doctor
npm exec --yes --package=@trackmcp/cli@0.1.12 -- trackmcp --help
```

## Fix

The entrypoint now uses `realpathSync()` for both `process.argv[1]` and the
module path, with the old path comparison retained as a fallback when a path
cannot be resolved. The main function also exposes local help handling before
network or SDK work. This fix is in the 0.1.13 source and published package.

The package lock was synchronized with the published package version so a
fresh package install cannot report stale 0.1.11 metadata.

## Verification

The exact registry reproduction was run from a clean temporary npm cache:

| Package | Command | Result |
| --- | --- | --- |
| 0.1.12 | `npx --yes @trackmcp/cli --help` | exit 0, 0 stdout bytes |
| 0.1.13 | `npx --yes @trackmcp/cli --help` | exit 0, help text printed |
| 0.1.13 | `npm exec --yes --package=@trackmcp/cli@0.1.13 -- trackmcp doctor --non-interactive` | exit 0, diagnostic lines printed |
| 0.1.13 | `npm exec --yes --package=@trackmcp/cli@0.1.13 -- trackmcp init --non-interactive --no-install` | exit 1, actionable non-interactive message |

The CLI package test suite passes all 26 tests. Its packed-consumer test
installs the tarball into a clean consumer project and exercises the actual npm
installs the tarball into a clean consumer project and exercises the actual npm
bin symlink, both the exact `npx @trackmcp/cli --help` shorthand and the
`npm exec --package` help path, init help, doctor, and non-interactive init.
The unit suite also covers browser-launch failure, authorization denial/expiry,
key-status failures, and no-browser fallback behavior.

The published 0.1.13 bin was also executed through the real npm symlink with
Node.js `v25.9.0` (the same supported Node 25 major line as the reported
`v25.6.0`) and printed help successfully. The repository host itself has Node
23.11.0 installed, so the Node 25 check used an isolated temporary npm cache.

## Usage note

For the least ambiguous npm 10/11 argument forwarding, use either:

```bash
npx --yes --package=@trackmcp/cli trackmcp init
npm exec --yes --package=@trackmcp/cli -- trackmcp init
```

The short `npx @trackmcp/cli init` form is supported by 0.1.13 and later. When
passing CLI flags after the command, the explicit `--package` form prevents npm
from interpreting those flags as npm-exec arguments.

## Files

- `trackmcp-nextjs/packages/cli/bin/trackmcp.mjs`
- `trackmcp-nextjs/packages/cli/test/packed-consumer.test.mjs`
- `trackmcp-nextjs/packages/cli/package-lock.json`

