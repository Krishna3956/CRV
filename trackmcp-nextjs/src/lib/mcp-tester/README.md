# Browser MCP tester boundary

This module is a browser-only, read-only MCP health tester. The public engine requires a real browser window or browser worker runtime and an injected `fetch` implementation; it never falls back to `globalThis.fetch`, Node, Edge, a server-side proxy, or an arbitrary-URL server fetch.

The supported transport is HTTPS MCP Streamable HTTP over browser-direct `fetch`, with CORS mode, `redirect: "manual"`, and `credentials: "omit"`. STDIO, WebSockets, standalone SSE, OAuth registration, proxying, and server-side arbitrary-URL fetching are outside the boundary.

Catalog discovery is intentionally non-invasive: the default flow may call `tools/list`, `resources/list`, and `prompts/list` when advertised, but it never calls `tools/call`, `resources/read`, or `prompts/get`.

Hostname and URL validation reject non-HTTPS, local, private, link-local, cloud-metadata, credential-bearing, and credential-query targets. Browser-direct testing avoids creating a server-side SSRF primitive, but hostname validation cannot guarantee the IP resolved by the browser at request time and therefore cannot fully prevent DNS rebinding. Users should test only endpoints they trust. No server-side proxy is used.

Reports are bounded and redact authorization, cookies, bearer/basic tokens, JWTs, API keys, private keys, query-string secrets, userinfo, credential-like values, and credential-bearing resource URIs. Custom headers are used only for the current in-memory request and are never persisted or sent to analytics or TrackMCP ingest.
