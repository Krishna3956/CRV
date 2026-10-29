# TrackMCP submission attribution runbook

## What the data can and cannot prove

The submission flow now records two complementary kinds of evidence:

1. **Automatic evidence**: UTM parameters, the referrer hostname, landing path,
   and first/last-touch source values captured in first-party storage.
2. **Self-reported evidence**: a required source category on the submission
   form, plus an optional bounded detail such as a community or campaign name.

`browser_unknown` does not mean that a person typed the URL. It means the
browser did not provide a usable acquisition signal. This is expected for
untagged links, private shares in WhatsApp/Slack/Discord, offline documents,
privacy tools, referrer policies, redirects that strip parameters, and users
who return later in a different browser or device.

No analytics implementation can reconstruct the exact origin of those visits
after the fact. The required self-report is the control that makes every new
submission actionable while preserving automatic evidence when it exists.

## Reporting precedence

For source reporting, use this order:

1. `self_reported_source` (what the submitter tells us).
2. `utm_source` / `utm_medium` / `utm_campaign` (explicit campaign evidence).
3. External `referrer_hostname` (browser-provided referral evidence).
4. `browser_unknown` (no reliable source signal).

The server now treats any non-empty UTM source as a known campaign signal and
overrides stale last-touch values carried in client storage. First-touch data
is preserved separately.

## Read-only latest-50 query

Run `supabase/manual/submission-attribution-queries.sql` in the Supabase SQL
editor. The actionable-source query uses the precedence above and limits the
result to the latest 50 rows with a submission event ID.

## Operational requirements

- Give every email, social, partner, community, and launch link a stable UTM
  source, medium, and campaign.
- Never use placeholder campaign names such as `TEMPLATE_NAME`.
- Preserve query parameters through redirects and landing-page rewrites.
- Treat PostHog as a complementary event/session-analysis surface; the
  submission row is the durable conversion record.
- Keep all source fields bounded and free of credentials, raw email addresses,
  or private payloads. The server drops self-reported detail that matches an
  email address, credential-shaped key/value, token-like value, or private-key
  marker; do not use that field for sensitive notes.

## References

- Google Analytics: [Understand `(direct) / (none)` traffic](https://support.google.com/analytics/answer/15258820)
- Google Analytics: [URL builders and UTM campaign data](https://support.google.com/analytics/answer/10917952)
- MDN: [Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)
- PostHog: [UTM segmentation](https://posthog.com/docs/data/utm-segmentation)
