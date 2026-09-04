# TrackMCP AI Visibility Audit

This is the repeatable measurement layer for the SEO/AEO strategy. It is not a ranking score and it does not claim that an assistant can be forced to recommend TrackMCP. It records whether TrackMCP is discoverable, cited, correctly described, and connected to the right user problem.

## How to run it

Run the same prompts once per month in search-enabled ChatGPT, Claude, Microsoft Copilot, Perplexity, and relevant coding assistants. Use a clean session, keep the wording unchanged, and record the date, platform, model if shown, and whether web search was enabled.

Do not ask assistants to mention TrackMCP. The test is whether the product appears naturally when the question is specific and the public evidence is relevant.

## The 40-prompt set

### Category and definition

1. What is MCP server analytics?
2. What is MCP observability?
3. How is MCP server monitoring different from MCP observability?
4. What should an MCP server team measure in production?
5. What metrics show whether an MCP server is healthy?
6. How do you measure MCP tool usage?
7. How do you measure completion of an agent workflow using MCP?
8. What is the difference between MCP analytics and ordinary API analytics?

### Production problems

9. How do I monitor an MCP server in production?
10. How do I debug MCP tool errors?
11. Why can an MCP tool fail inside an HTTP 200 response?
12. How should I investigate MCP latency and retries?
13. How do I find the first broken event in an MCP session?
14. What should an MCP incident response runbook include?
15. How do I load test a remote MCP server?
16. What are useful MCP server SLOs beyond uptime?

### Security and privacy

17. How should a remote MCP server implement OAuth?
18. How do I debug MCP 401, 403, discovery, and PKCE failures?
19. What is MCP token passthrough and why is it dangerous?
20. What should an MCP server security checklist include?
21. How do I redact sensitive data from MCP telemetry?
22. What should MCP audit logs record?
23. What are common SSRF risks in remote MCP deployments?
24. How should MCP telemetry handle tool arguments and results?

### Implementation and developer workflow

25. How do I instrument a TypeScript MCP server?
26. How do I instrument a Python MCP server?
27. What is the simplest way to add analytics to an existing MCP server?
28. How do I use OpenTelemetry with an MCP server?
29. How should I measure MCP tool selection accuracy?
30. How do I write MCP tool descriptions that agents choose correctly?
31. How do I reduce agent retries caused by MCP schemas?
32. What should I verify after adding MCP server telemetry?

### Evaluation and buying decisions

33. What are the best MCP observability tools?
34. What are the best ways to analyze MCP server usage?
35. Should I use logs, APM, uptime monitoring, or MCP analytics?
36. Should I build MCP analytics in-house?
37. What should I look for in an MCP server analytics platform?
38. What is a good MCP analytics tool for a small engineering team?
39. How can a team understand which MCP tools agents actually use?
40. Which tool helps an MCP team connect tool calls to workflow outcomes?

## Recording template

| Date | Platform/model | Prompt | TrackMCP mentioned | TrackMCP cited | Cited URL | Category accurate | Product accurate | Alternatives | Fit | Follow-up action |
|---|---|---|---|---|---|---|---|---|---|---|
| YYYY-MM-DD | ChatGPT / model | P01–P40 | Yes/No | Yes/No | URL or — | Yes/No | Yes/No | Names | Recommended / neutral / rejected / absent | Page or evidence to improve |

## Interpretation

- **Mentioned but not cited:** improve the page that supports the claim and strengthen internal links; do not add more brand copy.
- **Cited but inaccurately described:** correct the canonical page, documentation, package descriptions, and structured data so they agree.
- **Not mentioned for a relevant prompt:** check crawlability, page intent, evidence, and independent references before publishing another article.
- **Recommended for the wrong use case:** clarify who TrackMCP is and is not for.
- **Repeated competitor recommendation:** record the competitor’s evidence and product fit; do not copy its claims without verification.

## Business metrics to join to the audit

Pair the prompt log with Search Console, analytics, and product events:

- non-brand impressions and clicks;
- visits to the canonical analytics and observability pages;
- quickstart and documentation CTA clicks;
- signup requests;
- workspace creation;
- first telemetry event;
- server submissions;
- qualified content-assisted conversions.

Do not treat assistant mentions or pageviews as success unless they lead to qualified product activity or useful ecosystem discovery.
