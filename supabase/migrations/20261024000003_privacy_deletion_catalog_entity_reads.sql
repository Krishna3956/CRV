-- Founder OS privacy deletion audit schema parity.
-- EXPLICIT RELEASE REVIEW: this is a bounded constraint replacement only.
-- It broadens the review-only audit table to match the deletion-plan dataset
-- inventory; it does not delete data or authorize a destructive worker.

alter table public.trackmcp_privacy_deletion_batches
  drop constraint if exists trackmcp_privacy_deletion_batches_dataset_check;

alter table public.trackmcp_privacy_deletion_batches
  add constraint trackmcp_privacy_deletion_batches_dataset_check check (dataset in (
    'events', 'semantic_facts', 'action_queue', 'refresh_jobs',
    'activation_milestones', 'catalog_versions', 'catalog_entity_reads'
  ));

comment on column public.trackmcp_privacy_deletion_batches.dataset is
  'Review-only dataset inventory; kept in parity with the application deletion plan and never interpreted as permission to delete.';
