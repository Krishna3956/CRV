# Founder OS review boundary

This ledger records paths that the release-scope classifier intentionally keeps
outside the product candidate. A path listed here requires explicit owner and
reviewer disposition before staging; it is never included by a blanket add.

| Path | Classification | Owner | Required reviewer | Disposition |
| --- | --- | --- | --- | --- |
| `trackmcp-nextjs/AGENTS.md` | review-required | repository maintainer | release owner | instruction-only formatting change; exclude from product candidate unless separately approved |
| `trackmcp-nextjs/.github/workflows/production-key-lifecycle-smoke.yml` | review-required | repository maintainer | release owner | manual, write-gated operator workflow; review secret names and retain only redacted lifecycle evidence |
| `trackmcp-nextjs/.github/workflows/founder-os-refresh-worker.yml` | review-required | repository maintainer | release owner | scheduled production refresh workflow; review bounded concurrency, freshness classification, timeout behavior, and redacted worker evidence before release |
| `trackmcp-nextjs/.github/workflows/deploy.yml` | review-required | repository maintainer | release owner | production App Runner rollout workflow; review concurrency, immutable SHA selection, timeout behavior, and redacted smoke evidence before release |
| `trackmcp-nextjs/Dockerfile` | review-required | repository maintainer | release owner | production image build/runtime contract; review immutable release identity propagation and ensure no secret build arguments are added |

## Boundary rules

- Review-required paths are not product evidence and must not be counted as
  application functionality.
- Local CSVs, campaign assets, credentials, environment files, and generated
  output remain excluded artifacts, not review-approved release files.
- A new review-required path must be added here with an owner, reviewer, and
  disposition before a candidate can be staged.
