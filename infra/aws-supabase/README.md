# AWS self-hosted Supabase deployment preparation

This directory contains a non-applied infrastructure baseline. Nothing here provisions AWS resources by itself. The template intentionally has no TrackMCP secrets, no production DNS, and no production Supabase values.

## Proposed baseline

- Region: `us-east-1` is the currently observed AWS console region; confirm the final region against credit restrictions and latency before applying.
- Host: x86_64 EC2, because it minimizes image-compatibility surprises while staging the official Supabase Docker distribution.
- Staging size: provisionally `t3.medium` only if the selected component set fits the measured workload; it has 2 vCPU/4 GiB and is a staging candidate, not a production guarantee.
- Production starting point: provisionally `t3.large` with 8 GiB, while recognizing that the official full-stack recommendation is larger. Remove unused optional services only after the source inventory proves they are unused, then measure before accepting capacity risk.
- Storage: encrypted gp3 EBS, starting at 80 GiB for a full-stack production candidate and sized from measured database/object/backup growth. Do not put backups only on the instance.
- Network: public 80/443 only; no public 22, 5432, Kong admin, Docker, or Studio. Use SSM for administration and an HTTPS reverse proxy.
- Secrets: AWS Secrets Manager or an equivalent tightly scoped secret; use the instance role instead of long-lived AWS access keys.
- Backups: encrypted S3 logical exports plus secondary EBS snapshots and a tested isolated restore.

## Cost envelope before approval

Using current public us-east-1 planning prices, `t3.medium` compute is approximately $30.51/month, `t3.large` approximately $60.96/month, gp3 is approximately $0.08/GB-month, one public IPv4 is approximately $3.65/month, and a Route 53 hosted zone is approximately $0.50/month before queries. S3, CloudWatch, data transfer, SES, and snapshots are usage-based.

Planning ranges, not a quote:

- lean 4 GiB staging: approximately $40–$45/month before unusual transfer/SES;
- safer 8 GiB production candidate: approximately $73–$80/month at low transfer/log volume;
- 5x growth/capacity case: approximately $140–$180/month after a likely instance/storage increase.

The verified AWS console evidence currently shows $1,125.22 total remaining and $1,037.31 estimated remaining. The active `AWS Activate - FOUNDERS` credit shows $1,000 issued and remaining, expiring 2028-10-31 in the current UI. Credits are not a hard spending limit; after eligible credits are consumed, charges can accrue.

## Apply only after approval

1. Confirm the final region, VPC/subnet, instance size, backup bucket, secret ARN, and cost envelope.
2. Review the CloudFormation template with the owner and verify its IAM permissions.
3. Create a billing/credit monitoring plan and document that budget alerts do not cap spend.
4. Apply the template only after the owner explicitly approves architecture/cost and staging creation.
5. Install the pinned official Supabase self-hosted release through the reviewed deployment procedure; do not use the Supabase CLI local-development stack as production.

## Version pinning

The official Supabase release must be selected and recorded immediately before staging from the current self-hosting documentation. Do not replace `SELF_HOSTED_RELEASE` with an unverified or floating tag.
