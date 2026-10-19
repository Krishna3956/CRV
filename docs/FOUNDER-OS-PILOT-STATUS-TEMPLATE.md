# Founder OS pilot status update template

Use this template for a customer-facing or internal update during a pilot
incident. Replace bracketed fields only with verified facts. If a field is not
known, say `unknown` or `under investigation`; do not fill the gap with an
assumption.

## Investigating

**Status:** Investigating  
**Started (UTC):** `[timestamp]`  
**Affected surface:** `[activation | ingest | dashboard | analytics | worker | other]`  
**Observed symptom:** `[short, customer-safe description]`

We are investigating reports of `[symptom]`. We have not yet confirmed the
scope or root cause. Customers should not paste API keys, device codes,
cookies, request bodies, or raw telemetry into support channels.

## Mitigating

**Status:** Mitigating  
**Started (UTC):** `[timestamp]`  
**Evidence:** `[safe response categories, bounded counts, or incident links]`  
**Customer action:** `[none | retry after ... | use documented fallback]`

We have identified `[verified condition]` and are applying `[bounded
mitigation]`. Existing credentials and customer data are not being changed
unless an explicitly approved operator action is recorded. The next update is
due at `[timestamp]` or when the evidence changes materially.

## Monitoring

**Status:** Monitoring  
**Mitigation completed (UTC):** `[timestamp]`  
**Recovery evidence:** `[specific safe check and result]`  
**Remaining limitation:** `[partial data, delayed refresh, or none]`

The mitigation is complete and we are monitoring `[surface]`. Recovery is
supported by `[evidence]`; this is not a claim that every historical request
was successful. If the dashboard shows partial or delayed data, it remains
labelled as such until a bounded refresh/read check passes.

## Resolved

**Status:** Resolved  
**Resolved (UTC):** `[timestamp]`  
**Verified recovery:** `[safe checks and links]`  
**Follow-up owner:** `[team/role]`

The affected surface is operating normally according to `[evidence]`. We will
complete the follow-up `[action]` by `[date/time]`. Do not describe a rollback,
deletion, key rotation, or data repair unless that action actually occurred and
has an audit record.

## Communication rules

- Use UTC timestamps and name the evidence source.
- Describe status categories and bounded counts, not secrets or raw payloads.
- Separate observed facts, customer impact, mitigation, and remaining
  uncertainty.
- Never claim complete recovery from a single successful request.
- Link the incident runbook for responder actions; this template is not a
  substitute for authorization or a destructive-operation review.
