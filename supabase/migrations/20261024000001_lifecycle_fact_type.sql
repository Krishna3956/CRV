-- Founder OS lifecycle semantic-fact type.
-- Explicit release review: additive constraint widening; no backfill and no raw payloads.

alter table public.trackmcp_semantic_facts
  drop constraint if exists trackmcp_semantic_facts_fact_type_check;

alter table public.trackmcp_semantic_facts
  add constraint trackmcp_semantic_facts_fact_type_check
  check (fact_type in ('activity', 'outcome', 'observation', 'lifecycle'));

comment on column public.trackmcp_semantic_facts.fact_type is
  'Bounded fact category: lifecycle is reserved for allowlisted protocol signals such as subscriptions, progress, cancellation, and catalog changes.';
