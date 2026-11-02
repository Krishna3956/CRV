# AWS-hosted Supabase architecture and cost decision

Status: staging foundation verified; production architecture remains a proposal, 2026-11-02.

The approved staging foundation now exists in `us-east-1`: CloudFormation stack
`trackmcp-supabase-staging-24`, an SSM-managed EC2 host, and a private,
versioned, AES-256-encrypted S3 backup bucket. No production AWS resources,
production DNS, Supabase Cloud settings, or live traffic have been changed.

## Recommendation

Use the official self-hosted Supabase Docker distribution on one x86_64 EC2 host, with encrypted gp3 persistence, SSM administration, HTTPS reverse proxy, Secrets Manager, private S3 backups, and CloudWatch. Keep TrackMCP on its existing App Runner deployment. Initially omit Realtime, Storage, image proxy, Edge Runtime, and other optional services only if the final inventory confirms there are no consumers. This keeps the application contract unchanged and avoids an unnecessary App Runner, DNS, or frontend rewrite.

The first staging candidate is a `t3.medium` only for sizing/compatibility work. The safer production candidate is an 8 GiB host, provisionally `t3.large`, but it has 2 vCPU and remains below the official full-stack CPU recommendation. If the full stack or measured workload needs more sustained CPU, move to a larger or non-burstable instance rather than relying on burst credits.

## Why not RDS first?

EC2 plus RDS separates database operations and can improve database durability, but it adds a second service, networking, TLS/connection configuration, and another monthly cost before the actual workload is measured. The official self-hosted Supabase deployment is simplest to stage on its documented Docker distribution with local encrypted persistence. Re-evaluate RDS after traffic, recovery, and operational evidence show that a single host is insufficient.

Lightsail is attractive for price simplicity, but it is not the preferred first path because the official Supabase guidance, container sizing, backup controls, and AWS credit applicability need to be verified together. It remains a fallback if EC2 operations are not cost-effective and all required components are supported.

## Planning cost envelope

These are planning estimates using public us-east-1 prices, not a quote. They exclude taxes, unusual transfer, high-volume logs, and SES usage.

| Case | Compute | Persistent storage | IPv4 + DNS | S3/monitoring/backup allowance | Planning total |
|---|---:|---:|---:|---:|---:|
| Staging / lean optional-service set | ~$30.51 (`t3.medium`) | ~$3.20 for 40 GiB gp3 | ~$4.15 | ~$1–$5 | **~$39–$43/mo** |
| Production starting candidate | ~$60.96 (`t3.large`) | ~$6.40 for 80 GiB gp3 | ~$4.15 | ~$2–$8 | **~$74–$80/mo** |
| 2x usage envelope | same host only if CPU/egress/headroom stays healthy | grow storage as measured | variable | ~$5–$15 | **~$80–$95/mo** |
| 5x usage / likely capacity step | larger host and/or non-burstable family | 160 GiB or measured size | variable | ~$10–$25 | **~$140–$180/mo** |

The current account view shows $1,125.22 total amount remaining and $1,037.31 total estimated amount remaining. The active Activate Founders credit shows $1,000 issued and remaining, expiring 2028-10-31 in the current UI. That supports roughly 12–13 months at the production starting estimate, or 5–7 months in the 5x case, before credits are exhausted. AWS credits automatically apply to eligible usage, but they are not a hard spending cap; after credits are exhausted, eligible and ineligible charges can accrue.

## Required measurements before selecting production size

- source database size and daily growth;
- egress bytes and request/response shape;
- peak concurrent requests and database connections;
- background-worker write rate;
- storage bucket/object inventory;
- backup export/restore duration;
- CPU, memory, disk I/O, and burst-credit behavior in staging;
- CloudWatch ingestion and S3 backup size.

## Approval requested

The owner approved the first gate on 2026-11-01: `us-east-1`, EC2 x86_64, encrypted gp3, SSM-only administration, public 80/443 only, private S3 backups, and a staging spend envelope of approximately `$45/month` with a production planning envelope of approximately `$80/month`, subject to the measurements above. That approval was used only for the isolated staging foundation; it does not authorize production cutover or deletion of Supabase Cloud. The staging implementation and its latest read-only inspection are recorded in the migration ledger.

## Official references

- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- Supabase Docker deployment: https://supabase.com/docs/guides/self-hosting/docker
- Supabase platform restore: https://supabase.com/docs/guides/self-hosting/restore-from-platform
- AWS credit application: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/useconsolidatedbilling-credits.html
- EC2 T3 pricing/specification: https://aws.amazon.com/ec2/instance-types/t3/
- EBS gp3 pricing: https://aws.amazon.com/ebs/general-purpose/
- VPC public IPv4 pricing: https://aws.amazon.com/vpc/pricing/
- Route 53 pricing: https://aws.amazon.com/route53/pricing/
