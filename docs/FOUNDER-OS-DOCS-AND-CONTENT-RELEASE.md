# Founder OS documentation and website release contract

Version: `2026-10-19`
Status: review-ready documentation contract; this file does not publish content,
run SQL, or authorize a deployment.

This document keeps the customer-facing website, the engineering runbooks, and
the implemented product contract in sync. It is intentionally separate from
the Founder OS product implementation: a page can be written before the
underlying capability is ready, but it must then say `limited`, `preview`, or
`not supported` rather than implying that the capability is live.

## 1. Source-of-truth hierarchy

When two descriptions disagree, resolve them in this order:

1. Executable route, SDK, and CLI behavior in the reviewed release SHA.
2. Focused contract/integration tests for that behavior.
3. `docs/FOUNDER-OS-METRIC-CONTRACT.md` for metric names, denominators, and
   evidence states.
4. `docs/FOUNDER-OS-PILOT-SCOPE.md` for what may be promised to pilot users.
5. This document and the other runbooks for operator and customer wording.
6. The Founder OS PDF for the long-term vision, not proof that a capability is
   currently implemented.

Marketing copy must never promote a PDF-only capability as shipped merely
because a placeholder card or example dashboard image exists.

## 2. Current customer journey and canonical pages

The supported TypeScript path is deliberately one command:

```bash
npx @trackmcp/cli init
```

The CLI installs `@trackmcp/sdk` when it is absent, reuses a valid local key,
or opens the HTTPS device-authorization page when a key is not available. The
browser approves only the CLI session; it never displays or receives the raw
connection key. The CLI redeems and writes the key locally, then prints the
next server snippet. Package installation itself is silent and must not run a
browser or send an install-time ping.

Use these canonical links in website content:

| User need | URL | Contract |
| --- | --- | --- |
| Overview and first setup | `/docs` | Terminal-first TypeScript quickstart, Python package path, first-event verification |
| TypeScript server | `/docs/typescript` | `@trackmcp/sdk`, CLI flags, wrapper, redaction and fail-open behavior |
| Python server | `/docs/python` | `trackmcp`, `trackmcp init`/`doctor`, wrapper and transport boundary |
| HTTP/API consumers | `/docs/api` | Workspace-scoped read and ingest contracts; bounded response states |
| Configuration and semantics | `/docs/reference` | Options, limits, privacy, metric and protocol boundaries |
| Browser authorization | `/device?user_code=...` | Approve the waiting CLI session; no key display |
| Authenticated product | `/dashboard` | Workspace-scoped live telemetry and evidence states |

For remote terminals, document `npx @trackmcp/cli init --no-browser` and the
printed HTTPS URL. Do not describe `npm install` or `pip install` as an
authentication event. Python currently uses the dashboard/`trackmcp init`
connection flow; it is not interchangeable with the Node CLI's package
bootstrap.

## 3. Website content inventory

The website release owner must review each surface as a set, not edit isolated
snippets:

| Surface | Required content | Evidence/check |
| --- | --- | --- |
| Homepage hero and CTA | One-command CLI setup; server-boundary telemetry; explicit first-event step | CTA reaches `/docs` or the CLI; no dead links |
| Homepage dashboard preview | Clearly labeled illustrative/example content | Preview cannot be mistaken for authenticated customer data |
| Docs overview | TypeScript/Python choices, silent install rule, privacy/failure behavior, first-event verification | All commands and package names match current manifests |
| TypeScript docs | `npx ... init`, manual fallback, wrapper, redaction, queue limits, supported transport boundary | Packed-consumer and SDK contract tests |
| Python docs | `python3 -m pip install trackmcp`, `trackmcp init`, `doctor`, wrapper, no client-side claim | Clean PyPI consumer and Python tests |
| API docs | Auth, workspace scope, bounded limits, OTLP/HTTP JSON/protobuf boundary | API route contracts and auth tests |
| Release notes/blog | Explain user-visible changes and limitations; link to docs | Content review, dates, metadata, no unsupported promises |
| Sitemap/SEO | Include public docs/blog/tool surfaces only | Public sitemap smoke; no authenticated URLs or secrets |

The current docs already contain the one-command flow, Python path, first-event
check, and explicit OTLP boundary. Future content changes should update the
relevant page and its contract test in the same change; avoid a homepage-only
snippet that diverges from `/docs`.

## 4. Founder OS dashboard terminology map

The PDF's six business questions remain the product north star. The current
dashboard is a bounded implementation, not a claim that every PDF surface is
complete:

| Founder OS question | Current surface | Honest launch wording |
| --- | --- | --- |
| Who's Using It | Overview, AI clients, Who's using it | Activity and client observations; unique people/orgs are not inferred |
| What They're Doing | Capabilities, tools, resources/prompts | Observed method/tool breadth; resource and prompt entities remain bounded |
| Resources & Prompts | Resources & prompts view | Method-family and hash-only observations; not content transcripts |
| The Journey | Journeys and trace evidence | Bounded server-boundary paths and explicit workflow signals |
| Did It Work | Outcomes/Overview | Explicit application outcomes only; missing events are not abandonment |
| What's Broken | Quality, Issues, Action Queue | Bounded error/latency/action signals with confidence and affected volume |

Every metric must show its evidence state (`observed`, `partial`, `unknown`,
`insufficient_data`, or `stale`) and should link to the applicable scope and
freshness caveat. Example/sample data must be visibly separated from a live
workspace.

## 5. Release-note template

Use this structure for a Founder OS release note. It is intentionally concise
enough for customers but retains the boundaries support needs:

```md
# [Release title]

## What changed
- [Customer-visible capability and the supported language/runtime]
- [Dashboard or setup improvement]

## How to use it
1. Run `npx @trackmcp/cli init` (or the documented Python path).
2. Wrap the server and make one real tool call.
3. Open `/dashboard` and run the first-event check.

## What we do not claim yet
- [Explicit limited or unsupported protocol/identity/worker behavior]

## Privacy and failure behavior
Telemetry is bounded and redacted before delivery. TrackMCP remains fail-open
when the ingest service is unavailable.

Read the [documentation link] and [pilot-scope link] for exact boundaries.
```

Do not put API keys, device codes, customer identifiers, raw payloads, or
internal workspace IDs in a release note, screenshot, analytics event, or SEO
metadata.

## 6. Content-release checklist

Before publishing a website/docs/blog change, the release owner records:

- reviewed release SHA and deployment run;
- pages and routes changed, including redirects and canonical metadata;
- package versions shown in examples (`@trackmcp/sdk@0.1.19`,
  `@trackmcp/cli@0.1.10`, `trackmcp==0.1.12` for the current reviewed release
  line); historical evidence must be labeled as historical;
- command validation from a clean consumer where a command is new or changed;
- screenshot/browser review for desktop setup, docs, device approval, and empty,
  loading, error, and partial-data states;
- link check for every CTA and code sample destination;
- explicit list of limitations and unsupported claims;
- sitemap/public-index check after publishing;
- rollback owner and previous content version.

The checklist is not complete when a page returns HTTP 200: a page is ready
only when its command, destination, metric wording, and limitation boundary
agree with the reviewed implementation.

## 7. Known documentation boundaries

Keep these statements stable until the implementation and production evidence
change:

- OTel support means authenticated OTLP/HTTP JSON metadata interoperability;
  gRPC and an external exporter are not supported claims; OTLP/HTTP protobuf is
  supported only as bounded metadata-only ingestion.
- Identity is bounded resolver/self-reported activity. Do not label it as
  verified unique people or organizations.
- Resources/prompts use privacy-safe observations and do not expose content
  transcripts or private model reasoning.
- Workflow completion is explicit application evidence. Absence of an event is
  not proof of abandonment or failure.
- Action Queue and catalog refresh require the configured worker/scheduler;
  local worker contracts are not production cadence evidence.
- Privacy export/request is reviewable and auditable; do not promise destructive
  deletion completion until the reviewed worker is enabled and evidenced.
- Dashboard analytics are bounded by time, page, scan, and sample limits; no
  metric should be described as unlimited real-time analytics.

The authoritative pilot gate remains
`FOUNDER-OS-LAUNCH-READINESS-AUDIT.md`; this document makes the website and
documentation claims conform to that gate.
