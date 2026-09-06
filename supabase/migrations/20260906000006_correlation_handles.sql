-- P1-01: persist explicit, privacy-safe business correlation provenance.
-- Forward-only migration. Apply in staging first; rollback by dropping the two
-- nullable columns and index only after confirming no dependent release remains.
alter table public.trackmcp_events
  add column if not exists correlation_handle text,
  add column if not exists correlation_handle_source text not null default 'missing';

alter table public.trackmcp_events
  add constraint trackmcp_events_correlation_handle_source_check
  check (correlation_handle_source in ('external', 'issued', 'missing'));

alter table public.trackmcp_events
  add constraint trackmcp_events_correlation_handle_shape_check
  check (
    (correlation_handle is null and correlation_handle_source = 'missing')
    or (correlation_handle is not null and correlation_handle_source in ('external', 'issued') and octet_length(correlation_handle) between 1 and 128)
  );

create index if not exists trackmcp_events_workspace_correlation_handle_idx
  on public.trackmcp_events (workspace_id, correlation_handle)
  where correlation_handle is not null;
