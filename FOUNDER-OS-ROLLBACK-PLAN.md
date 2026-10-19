# Founder OS rollback plan

Status: local release preparation only. This file does not execute a rollback,
deploy an image, or change Supabase.

## Required release-record fields

Every pilot release must record these values before deployment:

| Field | Requirement |
| --- | --- |
| reviewed_commit_sha | Full immutable Git SHA that passed the release gate |
| deployed_commit_sha | Full immutable Git SHA reported by CI/App Runner |
| rollback_commit_sha | Full immutable Git SHA known to be compatible with the applied additive schema |
| deployed_image_digest | Immutable container digest (`sha256:...`), never a tag alone |
| rollback_image_digest | Immutable rollback container digest (`sha256:...`), never `latest` |
| schema_postflight_reference | Timestamped, read-only postflight record for the production schema |
| owner_and_timestamp | Release owner, UTC timestamp, and approval reference |

## Rollback acceptance checks

1. Stop new application rollout and preserve the deployed commit/image data.
2. Confirm the rollback image is immutable and was built from the recorded
   rollback SHA.
3. Confirm the rollback code does not write columns or call RPCs absent from
   the rollback schema contract.
4. Confirm additive migrations are backward-compatible with the rollback
   application before switching traffic.
5. Switch the application through the existing deployment workflow and record
   the resulting deployed SHA and image digest.
6. Run the bounded homepage, authentication, ingest, key-status, and dashboard
   smoke checks. Do not declare recovery from HTTP success alone.
7. Record any queued refresh/fact work that must remain disabled or be replayed
   after the forward release is restored.

## Prohibited rollback references

- `latest`, floating branch names, mutable tags, or an unqualified image tag.
- Destructive schema reversal or blanket migration rollback.
- Manual deletion of customer rows or API keys as a recovery step.

Until the release owner fills the fields above with actual production evidence,
this plan is a readiness contract, not proof that rollback has been rehearsed.
