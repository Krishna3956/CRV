# TrackMCP live SEO and backlink-readiness audit

Audit date: 2026-10-29
Property: `https://trackmcp.com`
Scope: the live sitemap, every `/blog/*` URL in that sitemap, Search Console, and the two known external references.

## Executive result

The live blog has no detected technical SEO or internal-link breakage. The crawl checked 108 blog URLs: 107 article pages plus the releases index. All 108 returned HTTP 200, had one visible H1, unique title and description values, an exact HTTPS canonical, Open Graph/Twitter metadata, and crawlable server-rendered article content. The old adoption URL is a deliberate 301 and is absent from internal links and the sitemap.

This does **not** mean SEO, indexing, or backlinks are complete. Search Console currently reports 79 indexed pages and 2,301 not indexed pages for the whole property. A representative new article is still `Discovered – currently not indexed`. Search Console reports 123 external links from 26 linking sites, all to the homepage in its current top-target report; no blog article appears in that report. No external backlink index was connected, so referring-domain, dofollow/nofollow, lost-link, and competitor-gap claims outside Search Console remain unverified.

### 2026-10-29 direct-origin recheck

Because the Cloudflare-fronted `trackmcp.com` hostname returned an access
challenge to this audit client, the full live recheck was repeated against the
trusted App Runner origin used by the production smoke workflows:
`https://i95pzq2xh7.ap-south-1.awsapprunner.com`. The origin reported HTTP 200
and served release `a1ad002e04d9d77b720cd427723ce3ee126f542c`. All 30 articles in
the new batch returned 200; all 30 had one H1, unique title and description,
exact HTTPS canonicals, no noindex, complete OG/Twitter metadata, Article,
BreadcrumbList, and FAQPage JSON-LD, author/date/read-time markers, and
non-empty image alt text. The recheck found 160 unique internal targets with
0 broken links, 0 redirecting targets, and 0 stale adoption-route links. It
found 23 unique external targets with 0 broken responses and 0 missing
`noopener` rel attributes on `_blank` links. The sitemap contained every new
slug with no duplicate or non-HTTPS URL; robots allowed public crawling and
declared the HTTPS sitemap; the deliberate stale route returned one 301 and
the valid route returned 200.

This origin-level evidence confirms the deployed article implementation. It
does not override the Search Console indexing results above, and it does not
turn outbound citations into backlinks.

### Final verification rerun (2026-10-29)

The complete checks were rerun against the built application and the trusted
production origin after the latest deployment. The local `npm run seo:audit`
passed with 151/151 sitemap URLs. The same audit against App Runner also
passed with 151/151 URLs. A schema-aware crawl of all 107 article URLs found:

- 107/107 HTTP 200, one H1, unique title, unique description, exact HTTPS
  canonical, no accidental `noindex`, complete Open Graph and Twitter card
  metadata, read-time label, and non-empty image alt text.
- 107/107 Article JSON-LD and BreadcrumbList JSON-LD records; 77/77 pages
  that emit FAQs had FAQPage JSON-LD with a `mainEntity`.
- 361 unique internal targets from the article set, with 0 broken or
  redirecting targets, 0 stale adoption-route links, and 0 redirect chains.
- 72 unique HTTPS external targets. No confirmed broken external target was
  found; `https://x.com/trackmcp` returned a bot-protection 403 to this audit
  client and is therefore recorded as **unverified**, not as a broken link.

The production health endpoint for this audit reported release
`a1ad002e04d9d77b720cd427723ce3ee126f542c`. The front door was also checked
with Googlebot/browser user agents: `/blog`, representative new articles,
`/sitemap.xml`, and `/robots.txt` returned 200; the stale adoption route
returned one 301 to the valid canonical route and that destination returned
200.

As a front-door recheck, the same 30 article requests, sitemap, robots file,
and stale-route redirect were then fetched from `https://trackmcp.com` with a
browser user-agent and Googlebot user-agent. Both received HTTP 200 for public
pages, the stale route returned the expected single 301, and the metadata/schema
results matched the origin crawl. The default `curl` user-agent received a
Cloudflare 403 challenge; that is an audit-client WAF challenge rather than a
Googlebot block, but it should remain on the operational watch list.

### Current deployment recheck (2026-10-29)

After the final optional-analytics performance deployment, App Runner workflow
`40809475613` passed its release gate, rollout, production smoke, immutable
identity, and runtime-safety checks. The live `/api/health` endpoint now
reports release `5a742ec2856fea22acfc51e11d830f759f4a1c48`. The origin SEO
audit was rerun against this release and passed all 151 sitemap URLs. This
deployment changed only optional PostHog initialization timing, so the SEO
and schema findings above remain unchanged. A fresh cold Lighthouse sample
returned performance 0.76, SEO 1.00, accessibility 0.96, LCP 6.1 s, CLS 0,
TBT 80 ms, and TTFB 80 ms; LCP remains an explicit performance risk.

## Verified and complete

### Live blog crawl

| Check | Result |
|---|---:|
| Blog URLs checked | 108 (107 articles + `/blog/releases`) |
| HTTP 200 | 108/108 |
| Exactly one visible H1 | 108/108 |
| Title tag present | 108/108 |
| Unique title tags | 108/108 |
| Useful meta description (at least 80 characters) | 108/108 |
| Unique meta descriptions | 108/108 |
| Exact HTTPS canonical | 108/108 |
| Accidental `noindex` | 0 |
| Complete Open Graph title/description/URL | 108/108 |
| Twitter card metadata | 108/108 |
| Valid JSON-LD parsing | 108/108 |
| Article JSON-LD | 107/107 articles |
| Breadcrumb JSON-LD | 108/108 |
| FAQ JSON-LD where FAQs are present | 77/77 |
| Article author and publication metadata | 107/107 |
| Article images with non-empty alt text | 107/107 |
| Visible read-time label | 108/108 |
| Visible “Updated”/“Last verified” date label | 0 (matches in prose were not date labels) |
| Duplicate titles or descriptions | 0 |
| Orphan articles | 0 (minimum four inbound internal links per article) |

Article JSON-LD was checked for `headline`, `description`, `datePublished`, `dateModified`, `author`, `publisher`, and `mainEntityOfPage`. FAQ questions and answers are present in the visible article content where FAQ schema is emitted. Breadcrumbs resolve to the homepage, blog index, and exact article URL.

### Internal and external link crawl

- 359 unique internal targets were collected from the blog pages; 0 returned 4xx/5xx and 0 had a redirect chain.
- 71 unique external targets were collected; 0 returned 4xx/5xx during the audit window.
- All article pages are reachable from the blog index, categories, related content, product pages, or documentation. No article is orphaned.
- The exact stale path `/blog/measure-mcp-tool-adoption` does not occur as an internal content URL, generated article link, sitemap entry, or live article link. It is retained only by the deliberate redirect route.
- The old path returns one permanent redirect: `301 → https://trackmcp.com/blog/measure-mcp-tool-adoption-workflow-completion`; the destination returns 200 and does not redirect again.

The counts above are the initial crawl baseline. The final rerun found 361
internal and 72 external targets; see the final-verification section for the
current evidence and the single bot-protected external URL.

### Sitemap and robots

- `https://trackmcp.com/sitemap.xml` returns 200 XML, contains 151 unique HTTPS URLs, and contains all 107 article URLs. No redirect or 404 URL was found.
- Sitemap dates are generated from stable content metadata; they are not request timestamps.
- `https://trackmcp.com/robots.txt` returns 200. `User-agent: *` allows public pages, disallows `/admin` and `/api/`, declares the HTTPS sitemap, and does not block CSS, JavaScript, images, `/blog`, `/docs`, `/features`, or `/pricing`.
- Explicit rules allow Googlebot and the AI/search crawlers the site has chosen to expose (`GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, Claude bots, Google-Extended, PerplexityBot, Amazonbot, Applebot-Extended, and CCBot).

### Known external references

- [Project Monet](https://www.projectmonet.space/blog/trackmcp-mcp-server-analytics) returns 200 and currently contains seven crawlable TrackMCP links (homepage, pricing, docs, TypeScript, Python, security, privacy). The links use `target="_blank"` with `rel="noreferrer"`; they are followed by default because they are not `nofollow`, `sponsored`, or `ugc`.
- [APIs.io](https://apis.io/apis/trackmcp/trackmcp-api/) returns 200 and contains one crawlable link to `https://trackmcp.com/docs/api`, with `rel="noopener"` and no `nofollow`/`sponsored`/`ugc`.
- These are genuine external references to TrackMCP. Links from TrackMCP articles to MCP documentation, vendors, or source material are outbound citations, not backlinks.

## Search Console evidence and incomplete indexing

The verified `sc-domain:trackmcp.com` property was inspected in the Search Console UI on 2026-10-29:

- Page indexing overview (last update shown as 2026-10-23): **79 indexed**, **2,301 not indexed**.
- The not-indexed reasons shown were: Crawled—currently not indexed (1,089), Soft 404 (41), Blocked by robots.txt (30), Redirect error (13), Not found (13), Excluded by `noindex` (3), Page with redirect (3), Alternative page with proper canonical (2), and Discovered—currently not indexed (1,107). These counts are property-wide and are not all blog articles.
- URL Inspection for `/blog/best-mcp-observability-platforms`: **URL is on Google**, page indexed, HTTPS valid, and one valid Breadcrumbs item detected.
- URL Inspection for `/blog/mcp-observability-open-telemetry-integration`: **URL is not on Google**, `Discovered – currently not indexed`, discovered through `https://trackmcp.com/sitemap.xml`, with no crawl yet and no Google-selected canonical.
- Sitemap report: `https://trackmcp.com/sitemap.xml` submitted 2026-10-29, last read 2026-10-29, **Success**, 151 discovered pages.
- Search Console’s overview showed Breadcrumbs: 2 valid, 0 invalid. It did not expose a complete Article/FAQ enhancement report for this property in the inspected view.

No request for indexing was submitted automatically: doing so repeatedly for 107 URLs is not a durable indexing strategy and could create unnecessary queue pressure. The sitemap is successfully submitted; the remaining indexing result is Google-controlled.

## External backlink evidence

Search Console Links report currently shows:

- External links: **123**.
- Linking sites: **26** for the homepage target shown in the drill-down.
- Top linking sites: LinkedIn 44, WebCatalog 28, PoweredByAI 7, Product Hunt 7, SaaSearch 6.
- Top linking text includes `https trackmcp com`, `trackmcp com`, `visit website`, empty anchors, and `trackmcp`.
- Top linked pages drill-down contains only `https://trackmcp.com/` with 123 incoming links from 26 linking sites. It does not show a blog article target, so current Search Console evidence supports 123 homepage links and 0 blog-page links in that report, not a claim that no other index has ever seen a blog link.

Ahrefs, Semrush, Moz, Majestic, or another external backlink index was not available in the connected environment. Therefore the following are **not verified**: total referring domains across indexes, referring pages, domain authority, dofollow/nofollow split, first/last-seen dates, lost/broken backlinks, competitor referring-domain gaps, and backlink counts for individual new articles.

## Performance and crawlability

Representative Lighthouse runs against `/blog/best-mcp-observability-platforms` were server-rendered and SEO-clean:

| Profile | Performance | SEO | LCP | CLS | TBT | TTFB |
|---|---:|---:|---:|---:|---:|---:|
| Mobile 390×844 | 0.73 | 1.00 | 5.70 s | 0.0025 | 270 ms | 435 ms |
| Desktop 1350×900 | 0.60 | 1.00 | 7.84 s | 0.0000 | 171 ms | 261 ms |

An additional direct-origin Lighthouse run on 2026-10-29 measured
performance **0.68**, SEO **1.00**, accessibility **0.96**, LCP **7.52 s**, CLS
**0.00002**, TBT **274 ms**, and server response time **388 ms**. This is a
single cold-origin sample and reinforces the existing LCP risk; it is not a
claim that Core Web Vitals are complete.

The article body and headline are present in server-rendered HTML, images have alt text, and layout shift is negligible. LCP is a remaining release risk, largely associated with the current font/JavaScript payload and render delay; it should be a separate performance milestone rather than being hidden by an SEO score of 1.0.

### Current live re-audit evidence (2026-10-29)

The audit was rerun against the public front door with a browser/Googlebot
user-agent and against the trusted App Runner origin. The current evidence is:

- The sitemap returned HTTP 200 with **151 unique HTTPS URLs**, including **107
  blog article URLs**. No duplicate sitemap URL, non-HTTPS URL, redirect URL, or
  404 URL was found.
- All **107/107 article pages returned HTTP 200**. The article checks found
  **107/107** one-H1 pages, title tags, useful meta descriptions, unique titles,
  unique descriptions, exact HTTPS canonicals, no accidental `noindex`, complete
  Open Graph and Twitter card metadata, Article JSON-LD, BreadcrumbList
  JSON-LD, author/publication markers, non-empty image alt text, and visible
  read-time labels. **77/77** pages that emit FAQ content also emitted FAQPage
  JSON-LD with matching question data.
- The article crawl collected **332 unique internal targets** and **70 unique
  external targets**. Internal targets had **0** 4xx/5xx responses, **0**
  redirecting responses, and **0** exact links to the stale adoption route.
  External targets had **0** confirmed 4xx/5xx responses in this pass.
- `/blog/measure-mcp-tool-adoption` returned one **301** to
  `/blog/measure-mcp-tool-adoption-workflow-completion`; the destination returned
  **200** with no further redirect.
- The public `/blog`, `/sitemap.xml`, and `/robots.txt` endpoints returned 200
  for browser and Googlebot user-agents. A default `curl` user-agent still sees
  a Cloudflare challenge; this is recorded as an operational WAF watch item,
  not as a Googlebot block.
- A fresh desktop Lighthouse sample for
  `/blog/best-mcp-observability-platforms` measured performance **0.89**, SEO
  **1.00**, accessibility **0.96**, LCP **1.43 s**, CLS **0.00002**, and TTFB
  **0.84 s**. This is representative evidence, not a Core Web Vitals pass for
  every URL. The earlier mobile sample remains the mobile baseline in this
  report.

Search Console was also rechecked in the verified `sc-domain:trackmcp.com`
property. The live overview still shows **79 indexed** and **2,301 not
indexed** pages property-wide. The Links report shows **123 external links**;
its current top-linked-pages table shows the homepage as the only listed target,
so it does not provide evidence of external links to the blog batch. This is
indexing/backlink evidence, not a defect in the on-page implementation.

### Post-audit production follow-up

The performance risk was then addressed in two deployed, independently tested
steps: the optional Fontshare stylesheet was moved out of the server render,
and the optional PostHog SDK plus its pageview/identity events were deferred
behind an idle dynamic loader. App Runner deployment `40796109807` completed
successfully and the live health endpoint reports release
`d89f58587bca4e81e7efa32f277c196e982d87b8`. A fresh Lighthouse run of the same
mobile article after the queue change measured performance **0.79**, SEO
**1.00**, LCP **4.36 s**, CLS **0.0025**, TBT **266 ms**, and TTFB **695 ms**.
This is an improvement, not proof that every article meets a Core Web Vitals
target: the audit still leaves third-party analytics and origin latency open.

### Final runtime identity recheck after PR #695

The subsequent bounded refresh-diagnostics release was merged as PR #695
(`dd6e554463ca0658c60d435c1cb0022bf043dd10`) and deployed by App Runner
workflow `40815048476`. Its production smoke, immutable release-identity, and
runtime-safety checks passed; direct-origin `/`, `/blog`, and `/api/health`
returned HTTP 200 and `/api/health` reported that exact SHA. This release only
adds redacted worker diagnostics and readiness evidence, so it does not change
the article metadata, schema, sitemap, robots, or backlink findings above.

### Current release re-audit (2026-10-29, release `07dea115`)

The runtime release that completed the latest App Runner deployment workflow
(`40817742133`) was rechecked after production smoke, immutable release
identity, and runtime-safety steps passed. Both the public hostname and the
trusted App Runner origin were crawled with a browser-style user agent. The
current evidence is:

- The public and origin sitemaps returned HTTP 200 with **151 unique HTTPS
  URLs**, including **108 blog routes** (107 articles and the releases index).
- All **108/108 blog routes returned HTTP 200**. All 108 had exactly one H1,
  unique title and description values, exact HTTPS canonicals, complete
  Open Graph and Twitter metadata, no accidental `noindex`, server-rendered
  content, and a visible read-time label.
- All **107/107 article routes** had Article JSON-LD, author/publication
  metadata, and non-empty image alt text. All **108/108 blog routes** had
  BreadcrumbList JSON-LD. **77/77** routes that expose FAQ content had
  matching FAQPage JSON-LD.
- The article crawl found **367 unique internal targets** with **0 broken
  responses**, **0 redirecting targets**, and **0 exact links to the stale
  adoption path**. It found **71 unique external targets** with **0 confirmed
  4xx/5xx responses** in this pass.
- `/blog/measure-mcp-tool-adoption` returned one permanent **301** to
  `/blog/measure-mcp-tool-adoption-workflow-completion`; the destination
  returned **200** with no further redirect. The old path is not present in
  article hrefs or the sitemap.
- The newly deployed bounded refresh worker produced a clean no-backlog
  summary in run `40818690734` (processed 0, retryable 0, failed 0, maximum
  queue lag 0 ms). This is operational evidence only and does not change the
  Search Console or backlink conclusions below.

The same live Search Console property was re-opened after this crawl. It
continues to show **79 indexed** and **2,301 not indexed** pages property-wide;
the page-indexing report is dated 23 October 2026. The submitted
`https://trackmcp.com/sitemap.xml` remains **Success** with **151 discovered
pages**. The Links report shows **123 external links**, with the homepage as
the only top-linked-page target in the visible report; no blog-page backlink is
verified there. These are Google-controlled indexing and link observations,
not a claim that the site has no links in other indexes.

## Fixed during this work / existing fixes verified

- Verified the previously shipped stale-link replacement in `trackmcp-nextjs/src/app/blog/deep-research.ts` and `trackmcp-nextjs/src/app/blog/next-batch.ts` (`12c22d08`).
- Verified the previously shipped permanent redirect route in `trackmcp-nextjs/src/app/blog/measure-mcp-tool-adoption/route.ts` (`72515137`).
- No new production source change was required by this live SEO crawl; the live implementation already satisfies the metadata, schema, sitemap, robots, and link checks above.
- The current engineering branch also contains a regression test for analytics-cache revocation (`trackmcp-nextjs/src/app/api/v1/analytics/route.integration.test.mjs`), which is unrelated to the SEO crawl and is being shipped separately through PR #671.

## Backlink acquisition plan

The plan below is editorial and ecosystem-led. It deliberately excludes link farms, automated comments, PBNs, paid links presented as editorial, and bulk directory spam. Each submission should be made only when TrackMCP genuinely fits the page and the listing is useful to readers.

| Opportunity | URL | Target URL | Suggested anchor | Angle / method | Priority | Difficulty | Type |
|---|---|---|---|---|---|---|---|
| Official MCP Registry | https://registry.modelcontextprotocol.io/ | `https://trackmcp.com/docs/protocol` | TrackMCP MCP observability docs | Publish the TrackMCP MCP server metadata under a verified namespace if a public server is intended; follow the registry’s publisher validation. | P0 | Medium | Ecosystem registry |
| Glama | https://glama.ai/mcp/servers | `https://trackmcp.com/docs/quickstart` | TrackMCP quickstart | Submit the public repository/connector with accurate auth and transport details; maintain a healthy endpoint and claim the domain. | P0 | Medium | Ecosystem directory |
| Smithery / Arcade intake | https://smithery.ai/ | `https://trackmcp.com/mcp-observability` | MCP observability with TrackMCP | Check the current intake after the platform transition; submit only if the listing is active and the product fits the remote-server directory. | P1 | Medium | Ecosystem directory |
| MCP.so | https://mcp.so/ | `https://trackmcp.com/mcp-observability` | MCP server observability | Use the free review/submission path; do not buy a premium placement solely for SEO. | P1 | Low–Medium | Ecosystem directory |
| Awesome MCP Servers | https://github.com/punkpeye/awesome-mcp-servers | `https://trackmcp.com/docs/protocol` | TrackMCP | Open a focused PR only if TrackMCP is a legitimate MCP server/tool entry under that repository’s rules. | P1 | Medium | Community repository |
| Developer Tools Directory | https://thedevtoolsdir.com/submit/ | `https://trackmcp.com/mcp-observability` | MCP observability platform | Submit under monitoring/observability/analytics with an accurate description. Treat badge requirements as a product/brand decision, not an automatic SEO purchase. | P1 | Low | Editorial directory |
| DevToolsDaily observability directory | https://www.devtoolsdaily.com/directory/observability/ | `https://trackmcp.com/mcp-observability` | TrackMCP MCP observability | Use the free editorial submission form and provide product evidence, screenshots, and a stable docs URL. | P1 | Low–Medium | Editorial directory |
| OpenTelemetry vendor/community route | https://opentelemetry.io/docs/specs/otel/vendors/ | `https://trackmcp.com/docs/opentelemetry` | TrackMCP OTLP/HTTP integration | Submit only if the product meets the vendor-page requirements; otherwise contribute a technical interoperability example through the relevant OpenTelemetry community process. | P1 | High | Standards/community |
| MCP implementation comparison | https://modelcontextprotocol.io/ | `https://trackmcp.com/blog/mcp-observability-vs-llm-observability` | MCP observability vs. LLM observability | Offer a neutral, evidence-backed implementation note or issue/PR where the official docs accept ecosystem references. Do not ask for a promotional link. | P2 | High | Technical editorial |
| Integration partners | Relevant SDK, gateway, hosting, and observability vendor docs | `https://trackmcp.com/docs/typescript` or `/docs/opentelemetry` | TrackMCP TypeScript/OTLP integration | Co-author a tested integration recipe with a partner whose users actually need MCP server telemetry; link from the partner’s setup guide. | P1 | High | Partnership |
| Data-driven research | Developer/AI infrastructure publications | `https://trackmcp.com/blog/mcp-tool-adoption-benchmark` | MCP tool adoption benchmark | Publish an anonymized aggregate benchmark with methodology, limitations, and downloadable evidence; pitch it as research, not a product announcement. | P2 | High | Earned editorial |

Submission/contact method should be confirmed on each destination at the time of outreach. No outreach or submission was made during this audit.

## Acceptance status

### Verified and complete

Live page status, metadata, canonicals, robots, sitemap shape, JSON-LD parsing, image alt coverage, internal links, redirect behavior, orphan checks, known external references, and representative server-rendered performance evidence.

### Fixed during this task

No new SEO production fix was necessary. The stale route replacement and 301 were verified as already present. PR #671 carries an unrelated analytics cache-revocation regression test.

### Partially verified

Search Console URL Inspection was performed for representative indexed and newly discovered articles, not all 107. Lighthouse was run for one representative article, not every article. Mobile/desktop visual review was representative rather than a screenshot of all pages.

### Requires Google Search Console access or continued observation

Full 107-URL inspection export, complete per-URL indexing/exclusion classification, Google-selected canonical for every page, crawl dates for every page, mobile usability for every page, and future sitemap re-crawl/indexing progression.

### Requires an external backlink tool

Independent referring-domain totals, dofollow/nofollow split, lost/broken links, first/last-seen dates, competitor link gaps, and backlink counts for individual blog articles.

### Requires human outreach

Directory submissions, ecosystem registry publication, partner documentation, earned research coverage, and any request to update the Project Monet or APIs.io references.

### Not yet complete

Backlinks to the blog batch are not established or verified; Google has not indexed the representative new OpenTelemetry article; LCP remains above a comfortable pilot target; and external backlink-index evidence is still missing. The correct status is therefore **SEO foundations verified, indexing/backlink acquisition still open**, not “SEO complete.”
