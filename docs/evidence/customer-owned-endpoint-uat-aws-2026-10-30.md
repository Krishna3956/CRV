# Customer endpoint UAT — operator-supplied AWS endpoint — 2026-10-30

This is a redacted operator record. It contains no workspace key, bearer token,
AWS credential, session identifier, MCP request/response body, cursor, tool
name, resource URI, or prompt name.

## Deployment and execution

- Deployment workflow: `deploy-customer-mcp-uat.yml`
- Deployment run: `41048627524` (merged `main`)
- AWS region: `ap-south-1`
- App Runner service: `trackmcp-customer-mcp-uat`
- Deployment result: existing isolated service updated and reached `RUNNING`
- Transport: Streamable HTTP
- Protocol version: `2025-06-18`
- Redacted JSON report: `docs/evidence/customer-owned-endpoint-uat-aws-2026-10-30.json`

## Bounded UAT result

The official-client runner completed the bounded discovery pass:

- `tools/list`: observed 30 tools
- `resources/list`: observed 6 resources
- `resources/templates/list`: observed without retaining item values
- `prompts/list`: observed 5 prompts
- Protected-resource metadata: observed with one matching candidate and two
  advertised scopes; authorization-server URLs were not followed
- Queue, delivery, hook, and privacy diagnostics: all zero
- Queued events and queued bytes after flush: zero
- Failure code: none; outcome: `passed`

The runner records only metadata and count evidence. It does not exchange
OAuth tokens, call tools, read resource bodies, retrieve prompt values, replay
events, or prove transport-owned reconnect semantics.

## Classification

This closes the operator-supplied AWS deployment and bounded endpoint-UAT
evidence path. It is not independent third-party customer evidence and does
not claim that every customer MCP server has interoperable behavior. A real
customer-owned endpoint and any separately required authenticated,
multi-transport, reconnect, or OAuth-provider UAT remain external gates.
