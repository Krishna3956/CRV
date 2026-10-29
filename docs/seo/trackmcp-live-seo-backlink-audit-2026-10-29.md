# TrackMCP live SEO and backlink-readiness audit

Audit date: 2026-10-29  
Property: `https://trackmcp.com`  
Scope: the live sitemap, every `/blog/*` URL in that sitemap, Search Console, and the two known external references.

## Executive result

The live blog has no detected technical SEO or internal-link breakage. The crawl checked 108 blog URLs: 107 article pages plus the releases index. All 108 returned HTTP 200, had one visible H1, unique title and description values, an exact HTTPS canonical, Open Graph/Twitter metadata, and crawlable server-rendered article content. The old adoption URL is a deliberate 301 and is absent from internal links and the sitemap.

This does **not** mean SEO, indexing, or backlinks are complete. Search Console currently reports 79 indexed pages and 2,301 not indexed pages for the whole property. A representative new article is still `Discovered – currently not indexed`. Search Console reports 123 external links from 26 linking sites, all to the homepage in its current top-target report; no blog article appears in that report. No external backlink index was connected, so referring-domain, dofollow/nofollow, lost-link, and competitor-gap claims outside Search Console remain unverified.

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

The article body and headline are present in server-rendered HTML, images have alt text, and layout shift is negligible. LCP is a remaining release risk, largely associated with the current font/JavaScript payload and render delay; it should be a separate performance milestone rather than being hidden by an SEO score of 1.0.

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
