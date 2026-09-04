# TrackMCP SEO/AEO — Actions Only the Owner Can Complete

These are external actions that cannot be completed safely from the repository. They require access to accounts, production infrastructure, customer relationships, or platform review workflows.

## Current status

The repository-side SEO/AEO work is implemented and passes local checks. Production is not yet serving that version: as of 4 September 2026, the canonical analytics page returns HTTP 404 on both `trackmcp.com` and `www.trackmcp.com`, and the live sitemap/robots output is from an older deployment. Deploy the current repository before interpreting production search visibility.

## Do first: access and crawlability

- Verify `trackmcp.com` in [Google Search Console](https://search.google.com/search-console) and submit `https://trackmcp.com/sitemap.xml`.
- Verify the domain in [Bing Webmaster Tools](https://www.bing.com/webmasters/about) and inspect the AI Performance report when data becomes available.
- Ask whoever controls the CDN, WAF, DNS, or bot protection to confirm that Googlebot, Bingbot, and `OAI-SearchBot` receive HTTP 200 responses for public pages and are not challenged by CAPTCHA or JavaScript verification.
- Confirm that `https://trackmcp.com/mcp-server-analytics`, `/mcp-observability`, `/docs`, `/pricing`, `/security`, and `/about` are publicly reachable in production.
- Confirm the production sitemap finishes quickly and contains the new canonical pages.

## Do next: entity and profile consistency

- Confirm that the official GitHub, LinkedIn, X, Product Hunt, npm, PyPI, Go, and NuGet profiles all use the exact brand name `TrackMCP`.
- Use the same one-sentence description everywhere: “TrackMCP is analytics and observability for MCP servers.”
- Replace placeholder or stale profile descriptions, logos, links, package descriptions, and repository READMEs.
- Add the canonical TrackMCP website and documentation links to the official GitHub organization and every released SDK/package.
- Confirm that every profile linked in the Organization `sameAs` markup is genuinely official and live.

## Do with customer and community relationships

- Ask 3–5 real users to add an accurate TrackMCP integration section to their MCP server README if they use the SDK.
- Ask users whether they are willing to provide a named or anonymous implementation story, including the problem solved and what they measured.
- Publish genuine technical answers in MCP, agent, and developer communities when someone is asking about observability, errors, tool adoption, or production monitoring. Link only when it directly helps.
- Invite technically credible users to review the quickstart and report confusing steps.
- Submit accurate integration examples to hosting platforms or framework documentation only where TrackMCP has a tested integration.

## Decide before building native AI integrations

- Decide whether TrackMCP should expose a secure, read-only analytics MCP server for authenticated customers.
- If yes, define tenant isolation, OAuth/API-key handling, scopes, audit logs, rate limits, data minimization, and a test workspace before any marketplace submission.
- If the product is ready, review [ChatGPT app submission](https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/) and [Cursor MCP submission/discovery](https://docs.cursor.com/en/tools/mcp) requirements.
- Do not submit a thin app that only redirects to TrackMCP. It should answer a real customer question such as “which tools failed this week?” without exposing another customer’s data.

## Monthly owner routine

- Export Google Search Console query/page data.
- Review Bing AI Performance citations and grounding queries.
- Run the fixed AI-answer prompt set across ChatGPT Search, Claude Web Search, Microsoft Copilot, and relevant coding assistants.
- Record whether TrackMCP is mentioned, cited, correctly described, and connected to the right use case.
- Review signup requests, workspace creation, SDK installation, and first telemetry events by content source.
- Refresh pages when the product, MCP specification, SDK behavior, pricing, or security controls change.

## Do not do

- Do not buy fake reviews, citations, forum posts, or “AI recommendation placements.”
- Do not create fake customer stories or ask anyone to repeat a claim they cannot verify.
- Do not publish unsupported user counts, directory size, approval times, performance claims, or “best” claims.
- Do not give an agency access to production credentials unless it needs that access and has been reviewed.
