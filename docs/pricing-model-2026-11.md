# TrackMCP pricing model — November 2026

## Purpose

This document records the proposed launch packaging shown on `/pricing`. It is a
product and commercial proposal, not a billing implementation. The application
does not currently enforce paid entitlements or charge customers; the page says
that explicitly.

## Decision

Keep three tiers and price the product primarily by accepted telemetry volume,
retention, environments, and support rather than by seats:

| Tier | Proposed price | Intended customer | Included event allowance |
| --- | ---: | --- | ---: |
| Free | $0 forever | A developer or team evaluating one MCP server | 100,000 events/month |
| Hobby | $129/month | A small production team | 1,000,000 events/month |
| Enterprise | Custom | Higher volume, governance, procurement, or deployment requirements | Custom |

These numbers are intentionally conservative launch packaging. They are large
enough for a meaningful evaluation and small production pilot without promising
unbounded free ingestion. They should be re-sized after real TrackMCP usage and
infrastructure cost data are available.

## What the product can credibly promise today

The shared analytics core, privacy-aware telemetry controls, SDK and
OpenTelemetry ingestion paths, authenticated API access, and provenance-aware
dashboard views are already represented in the repository and deployment
contracts. The pricing page therefore includes them across all tiers.

Features that are not complete product entitlements (saved views, scheduled
exports, alerts, custom dashboards, and advanced enterprise identity controls)
are labeled `Planned` or `By agreement`. They must not be represented as live
paid functionality until the corresponding backend, UI, entitlement checks,
and tests exist.

## Market evidence used

The public pages below were reviewed on 2026-11-03:

- PostHog publishes a permanent free allowance per product, including 1M
  analytics events/month, and pay-as-you-go usage with billing limits. It also
  describes unlimited team members on the free tier.
- Langfuse publishes Hobby at $0 with 50k units/month and Core at $29/month
  with 100k units/month, then charges by additional units. It explicitly says
  its pricing is usage-led rather than seat-led.
- Honeycomb publishes Free with up to 20M events/month and Pro starting at
  $150/month, with predictable volume-based limits and unlimited seats.
- New Relic publishes a permanent free tier with 100 GB data ingest/month,
  one full platform user, and unlimited basic users.
- Axiom publishes a $0 Personal tier and a $25/month Cloud tier with included
  allowances and usage-based expansion.

Primary sources:

- https://posthog.com/pricing
- https://langfuse.com/pricing
- https://langfuse.com/handbook/chapters/monetization
- https://www.honeycomb.io/pricing
- https://newrelic.com/pricing/free-tier
- https://axiom.co/pricing

## Why TrackMCP starts at $129 instead of $49

The existing page used $49 for Pro without a live billing system or a proven
cost-to-serve model. $129 positions the first paid step as a production-team
plan with substantially more included telemetry and retention than the free
tier, while remaining below the higher fixed entry points of infrastructure
observability products. This is a positioning decision, not a final financial
forecast.

## Cost and guardrail assumptions

Before enabling billing, measure the following from production for at least two
full billing cycles:

1. Accepted events per workspace and per server.
2. Average and p95 event size after redaction.
3. Database storage growth and query workload per million events.
4. Supabase egress, log ingestion, and database-size headroom.
5. App Runner runtime, worker, and scheduled-job cost attributable to a
   workspace.
6. Retention deletion volume and export workload.

The initial free allowance should be reduced or increased only after those
measurements. A hard usage ceiling and an in-product usage meter must exist
before charging begins. The system should stop accepting billable events or
request an explicit upgrade at the ceiling rather than creating surprise
overages.

## Required implementation before paid launch

- A server-side plan and entitlement model scoped to workspace.
- Monthly event counters based on accepted, deduplicated events.
- Retention enforcement by plan with a visible data-retention label.
- Usage and projected-limit UI in the dashboard.
- A billing provider integration and webhook reconciliation.
- Idempotent subscription, invoice, cancellation, and grace-period states.
- Audit logs for plan changes and entitlement overrides.
- Contract tests that prove a free workspace cannot receive paid-only access.
- Customer-facing documentation that explains event counting, limits, and
  what happens at the limit.

Until these are complete, `/pricing` is informational early-access packaging,
not a promise that paid entitlements are already enforced.
