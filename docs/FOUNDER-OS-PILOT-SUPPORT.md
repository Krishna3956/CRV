# Founder OS pilot support scripts

Version: `2026-10-19`  
Audience: pilot support, engineering on-call, and the release owner

This is a response playbook, not a promise that a production incident has
occurred. It is intentionally written so a support responder can collect
useful evidence without asking a customer for a secret, raw telemetry payload,
or a full URL containing a token.

## First response: establish the customer's state

Ask for the command they ran, the CLI version, operating system, Node/Python
runtime, and the non-secret portion of the error message. Never ask for an API
key, `.env` file, device code, access token, request body, or a screen recording
that contains any of those values.

Ask the customer to run the appropriate diagnostic locally and paste only the
summary lines:

```bash
npx @trackmcp/cli doctor --non-interactive
```

For Python, ask for package/runtime information and a safe key-status result
from the dashboard or application logs; do not ask them to paste
`TRACKMCP_KEY`:

```bash
python3 --version
python3 -m pip show trackmcp
```

Classify the case before changing anything:

| Customer state | Next action |
| --- | --- |
| `init` has not been run | Follow the install script below. |
| Browser approval is pending | Confirm the short code, expiry, and that the same workspace is selected; restart `init` if expired. |
| Key is present but invalid/revoked | Re-authorize in the intended workspace; never request the old key. |
| Key is valid but no data appears | Confirm the key is in the running process, ingest is reachable, and one real tool call occurred. |
| Dashboard is stale or partial | Record approximate UTC time, workspace, route, and visible state; do not promise a freshness interval not shown by the UI. |
| Repeated 401/403/429/5xx | Escalate with timestamps and response categories using the incident runbook. |

## Install and activation script

Recommended TypeScript/Node.js path:

```text
1. Run: npx @trackmcp/cli init
2. If the CLI prints a browser URL, open it and sign in or sign up.
3. Select an existing workspace or create one.
4. Approve the CLI session in the browser; the browser never displays the key.
5. Return to the terminal and wait for redemption to finish.
6. Keep the printed success message and add the shown SDK wrapper to the server.
7. Start the server and make one real tool call.
8. In the dashboard, select the workspace and run “Check for data”.
```

If the browser cannot be opened automatically, use:

```bash
npx @trackmcp/cli init --no-browser
```

The CLI's browser approval is an explicit user action. Package installation
must remain silent: do not recommend `postinstall` authentication, password
collection, or an install-time network ping.

## Key-storage script

The key belongs to a workspace and is a credential. Tell customers to keep it
in their environment/secret manager and out of source control. If the CLI wrote
`.env.local`, verify that file is ignored before committing. Do not rotate or
revoke a key as a first troubleshooting step: first identify the workspace and
run `doctor`. Rotation/revocation is an operator-approved change and should be
recorded with the key status, time, and rollback owner, never with the secret.

## First-event script

When activation succeeds but the dashboard is empty, use this order:

1. Confirm `TRACKMCP_KEY` is set in the same process that starts the MCP server.
2. Confirm the server is using the intended workspace key, not a shell from a
   different project or an old `.env.local`.
3. Confirm the server can reach the documented ingest endpoint over HTTPS.
4. Make one real tool call; do not generate synthetic/fake telemetry.
5. Wait for the dashboard's documented refresh behavior, then use “Check for
   data” once.
6. If still empty, capture the safe doctor summary, approximate UTC timestamp,
   service name, runtime, and response category. Escalate without raw payloads.

The SDK is fail-open: an ingest or telemetry failure must not block the MCP
tool call. A successful tool call therefore does not by itself prove that an
event was accepted; the dashboard or a safe accepted-event signal is required.

## Data-trust script

Explain the boundary plainly:

- TrackMCP observes bounded protocol and tool-call metadata at the server
  boundary.
- Local redaction occurs before telemetry leaves the customer's process.
- Raw API keys, device codes, email addresses, IP addresses, and unbounded
  request/response bodies are not support evidence.
- OTel support in the pilot is bounded OTLP/HTTP JSON interoperability only;
  do not promise OTLP/gRPC, protobuf, or external export.
- Analytics and catalog reads are bounded and may disclose partial/truncated
  data where the UI says so.

If a customer asks for a deletion or export, open a privacy request and follow
the privacy runbook. Do not delete rows manually, mark a request `completed`,
or claim that a request is complete until the reviewed destructive worker and
postflight evidence exist.

## Escalation packet

Include only:

- customer/workspace support identifier (not a credential);
- CLI/SDK/Python package version and runtime version;
- command or documented route used;
- approximate UTC timestamps and timezone;
- safe status category (`pending`, `expired`, `invalid`, `revoked`, `429`,
  `5xx`, or `accepted`);
- whether a real tool call was attempted;
- doctor summary with secrets removed;
- links to the relevant incident or release entry.

Do not include keys, device/user codes, cookies, authorization headers, raw
payloads, or a full referrer URL. If any secret was pasted into a ticket,
restrict the ticket, ask the customer to rotate the credential, and record the
incident without copying the secret into another system.

## Retention and support language

Support records should contain the minimum evidence needed to resolve the case
and should follow the retention policy for the support system. The telemetry
retention defaults are documented separately in
`docs/FOUNDER-OS-RETENTION-POLICY.md`; they are not a deletion authorization.
Workspace export/deletion requests, legal holds, and contractual exceptions
take precedence. Unknown retention or legal state is a blocker, not permission
to delete.

## Scope and known limitations

The pilot supports terminal-first activation, TypeScript/Node.js and Python
SDK paths as documented, bounded ingest/analytics, and a browser approval
handoff. It does not claim arbitrary OTel encodings, unlimited analytics
windows, automatic package-install authentication, or production scheduler
SLOs until the corresponding release-owner and operator evidence is recorded.
