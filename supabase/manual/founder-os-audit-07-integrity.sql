-- Founder OS audit section 7 (READ ONLY).
-- Every invalid_* count should be zero.
select
  (select count(*) from public.mcp_tools where submission_attribution is not null and jsonb_typeof(submission_attribution) <> 'object')::bigint as invalid_attribution_rows,
  (select count(*) from public.trackmcp_cli_device_sessions where redemption_id_hash is not null and redemption_id_hash !~ '^[a-f0-9]{64}$')::bigint as invalid_redemption_hashes,
  (select count(*) from public.trackmcp_privacy_deletion_batches where returned_count < 0 or returned_count > 500 or affected_count < 0 or affected_count > 500)::bigint as invalid_deletion_batch_counts,
  (select count(*) from public.trackmcp_events where account_key is not null and account_identity_source <> 'resolver')::bigint as invalid_identity_pairs;
