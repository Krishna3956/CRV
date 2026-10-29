# Chinese translation rollout

The site now has a global language control in the root layout. It is available on public pages, database-backed directory pages, GitHub README pages, authentication pages, and the dashboard because it is mounted above the route tree rather than added to individual page files.

## Runtime behavior

- English remains the canonical URL and source language.
- Selecting `中文（简体）` stores `trackmcp_locale=zh-CN` and translates the rendered text in place.
- Route transitions and newly rendered content are observed with `MutationObserver`, so a newly submitted tool page does not need a new page file or a translation build.
- Code, preformatted blocks, URLs, SVGs, form controls, editable fields, and explicitly marked `data-no-translate` content are left unchanged.
- A failed or incomplete translation restores the original English content. The client never leaves a partially translated page visible.

## Provider configuration

Set exactly one provider in the deployment environment. The machine-translation flag must also be explicitly enabled; it is `false` by default:

```text
TRANSLATION_PROVIDER=deepl
TRANSLATION_ENABLE_MACHINE_TRANSLATION=false
DEEPL_API_KEY=...
```

or:

```text
TRANSLATION_PROVIDER=google
TRANSLATION_ENABLE_MACHINE_TRANSLATION=false
GOOGLE_TRANSLATE_API_KEY=...
```

`DEEPL_API_URL` may point at the DeepL Pro or Free endpoint where appropriate. The endpoint enforces bounded batches (100 text nodes, 4,000 characters per node, 40,000 characters per request) to avoid accidental abuse and oversized provider calls.

For terminology control, configure an approved DeepL glossary when available:

```text
DEEPL_GLOSSARY_ID=...
```

The endpoint also applies a per-process request limit and the browser keeps a bounded translation cache so repeated labels and route transitions do not repeatedly spend provider quota.

The flag is intentionally separate from the provider credential. A key can be present for staging or rotation without activating unreviewed output. Set it to `true` only after the owner explicitly accepts a machine-translation policy; it does not constitute a 100% accuracy guarantee.

For the AWS App Runner deployment, `deploy/env.deploy.template` leaves the provider empty by default. Set `TRANSLATION_PROVIDER=deepl` or `TRANSLATION_PROVIDER=google` only after adding the matching `DEEPL_API_KEY` or `GOOGLE_TRANSLATE_API_KEY` JSON field to the existing AWS Secrets Manager bundle. The deploy script maps only the selected provider secret; it never puts a provider key in a Docker build argument or plaintext runtime variable.

## Accuracy gate

Machine translation is not a 100% accuracy guarantee. The endpoint is therefore deliberately provider-backed and fail-closed when no provider is configured; it does not pretend that an unavailable or unreviewed translation is exact. For a public launch that promises “100% accurate,” the translated output must be reviewed and approved by a qualified Simplified Chinese linguist, with a glossary for TrackMCP, MCP, GitHub, API, SDK, and product terminology. Dynamic GitHub README content and future submissions cannot honestly be promised as 100% accurate without a review workflow or an explicit product decision to accept machine-translated content.

## Current catalog size

The repository code contains 51 page entrypoints. The live Supabase directory currently reports 17,796 approved or pending tool rows, and those rows are rendered through the dynamic `/tool/[name]` route. This runtime translates those pages on demand rather than trying to prebuild tens of thousands of locale copies.

Run `npm run audit:translation-routes` to re-check the route tree. The audit confirms the shared root runtime, counts page entrypoints, excludes API routes, and requires the dynamic tool, blog, and category route families to remain present.
