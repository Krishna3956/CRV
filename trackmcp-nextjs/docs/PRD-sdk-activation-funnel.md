# PRD: SDK-to-First-Telemetry Activation Funnel

**Status:** Draft for engineering review — terminal-first, browser-assisted activation  
**Owner:** Product  
**Product:** TrackMCP  
**Primary package:** `@trackmcp/sdk`  
**Audience:** Product, Engineering, Design, Growth, Support, Security  
**Last updated:** 18 October 2026

## 1. Executive summary

TrackMCP receives meaningful package interest through npm, but we currently cannot tell whether a package download became a configured SDK, an authenticated telemetry source, or an active customer workspace. The published SDK installs quietly, does not open signup, does not know the installer’s identity, and provides weak feedback when an invalid API key prevents telemetry delivery.

This PRD defines an activation funnel from SDK discovery to first accepted telemetry event. It does not turn the SDK into an intrusive installer, and it does not treat npm downloads as users. Instead, it makes the intended path explicit, removes avoidable signup and key-creation friction, exposes actionable configuration errors while preserving fail-open MCP behavior, and instruments the points we can measure with appropriate privacy boundaries.

The primary onboarding path is terminal-first and browser-assisted:

```text
npx @trackmcp/cli init
  → CLI starts a short-lived device authorization session
  → CLI opens the TrackMCP device page automatically when possible
  → developer signs up or signs in in the browser and approves access
  → CLI receives authorization and creates the first connection key
  → CLI writes TRACKMCP_KEY to a protected local environment file
  → CLI runs a safe doctor check and prints the remaining integration step
```

The browser is used for secure identity, email verification, SSO, MFA, and consent. It is not used for routine setup navigation. A `--no-browser` mode must print the same URL and one-time code for SSH, containers, remote development, and accessibility needs.

The desired outcome is a trustworthy answer to:

> Of the developers who show interest in the SDK, how many create an account, create a key, configure the SDK, send a first event, and reach a useful dashboard state—and where do they stop?

## 2. Background and evidence

### 2.1 Current package behavior

The SDK is an ESM-first Node.js package with no npm lifecycle script, CLI binary,
signup flow, browser integration, or install-time telemetry. The website should
show the unpinned install command (`npm install @trackmcp/sdk`) and let the
consumer lock the resolved version through its package manager. The package
installs successfully and remains silent until application code initializes it.

At runtime:

- `withTrackMCP(..., { apiKey })` requires a non-empty key.
- Missing keys throw `TrackMCP apiKey is required`.
- Events are queued and delivered asynchronously to the ingest endpoint.
- The SDK is fail-open: telemetry failures do not block the MCP server call.
- Non-successful ingest responses are currently caught and requeued without an actionable developer-facing error.

The SDK is therefore operational after configuration, but installation alone cannot create a TrackMCP account, API key, workspace, or event.

### 2.2 Current product behavior

The website and dashboard already support:

- signup and email verification,
- workspace provisioning,
- explicit API-key creation,
- TypeScript and Python setup instructions,
- first-event guidance,
- authenticated dashboard analytics,
- marketing and auth events through PostHog/Vercel Analytics.

However, there is no reliable link between an npm download and web identity. We also do not currently measure key copying, setup-snippet copying, SDK initialization, SDK authentication failure, first accepted ingest, or the exact reason a user stops.

### 2.3 Important interpretation of npm data

npm download counts are aggregate package downloads. They are not unique people, unique organizations, unique installations, or successful SDK activations. Downloads may include:

- CI jobs,
- Docker builds,
- dependency scanners,
- package-manager retries,
- cache misses,
- maintainers and release verification,
- the same person installing in multiple projects.

The product must never report npm downloads as “users” or imply that every download represents a customer opportunity with a known identity.

## 3. Problem statement

Developers can discover and install the SDK without being told clearly enough that a TrackMCP account and workspace key are prerequisites. Once they reach the website, signup and key creation require multiple steps. Once they configure the SDK, invalid keys or rejected requests can fail silently because telemetry is intentionally fail-open. The result is an activation funnel with large unobserved gaps:

```text
Package interest
  → documented signup path
  → account created and verified
  → workspace created
  → API key created and copied
  → SDK configured
  → server emits a real event
  → ingest accepts the event
  → dashboard shows and explains the event
```

We currently observe only parts of this sequence, so we cannot distinguish lack of demand from poor onboarding, configuration errors, server inactivity, authentication failures, or dashboard discoverability problems.

## 4. Goals

### Primary goals

1. Make the required activation path explicit in the published SDK README and first-party docs.
2. Reduce unnecessary friction between verified signup, workspace creation, and first API-key creation.
3. Give developers actionable, privacy-safe feedback when SDK configuration or ingest authentication fails.
4. Measure the activation steps that are within our control without pretending to identify anonymous npm installers.
5. Record the first accepted telemetry event as a backend fact, independently of whether the user has opened the dashboard.
6. Provide a coherent funnel report that separates aggregate package demand from identified product activation.
7. Preserve the SDK’s fail-open behavior for MCP calls and its local privacy boundary.
8. Make a guided CLI the fastest supported path from package interest to a configured local project.
9. Make it possible for a three-engineer team to implement and validate the work in parallel.

### Secondary goals

- Improve first-event troubleshooting for Support and Customer Success.
- Reduce “dashboard is empty” ambiguity by distinguishing no server activity from rejected delivery.
- Establish a reusable activation-event contract for future Python SDK and vendor-neutral ingestion work.
- Create a safe foundation for an optional guided setup CLI or doctor command.

## 5. Non-goals

This project will not:

- add an intrusive npm `postinstall` browser redirect,
- collect or transmit a TrackMCP password from the CLI,
- require a browser for every subsequent setup or diagnostic command,
- collect a developer’s email, API key, source code, tool arguments, or results from npm installation,
- proxy or execute customer MCP tools,
- infer unique users from npm download counts,
- make telemetry delivery block or alter an MCP request,
- automatically send raw customer payloads for debugging,
- claim provider-level privacy certification without separate evidence,
- redesign the entire dashboard,
- replace the existing auth provider,
- enable production alert scheduling or email delivery,
- rerun production migrations without explicit migration review and authorization,
- introduce a package-level phone-home mechanism solely to identify installs.

## 6. Product principles

### 6.1 Explicit about prerequisites

The SDK and docs must say plainly that an account, workspace, and connection key are required before telemetry can appear.

### 6.2 Fail open for the customer server, fail clearly for the operator

Telemetry must never block an MCP call. The developer operating the SDK should still receive a safe, rate-limited explanation and a next action when configuration or delivery fails.

### 6.3 Do not overclaim identity

An npm download is anonymous aggregate demand. A browser event is a browser event. An authenticated workspace is a workspace. An accepted ingest event is a telemetry fact. These must remain separate dimensions.

### 6.4 Privacy before growth instrumentation

No key, authorization header, raw request body, tool arguments, tool results, emails, private prompts, or customer payloads may be placed in analytics events, logs, error messages, or screenshots.

### 6.5 Evidence over appearance

“First event received” must be backed by ingest persistence. “Key copied” must be an explicit browser event. “SDK configured” must not be inferred merely from a package download.

### 6.6 The smallest useful activation

The fastest useful path is one workspace key, one server integration, one real tool call, and one visible event. Documentation and UI should optimize for that path before advanced analytics.

### 6.7 Browser-assisted, terminal-first authentication

The CLI owns setup; the browser owns identity. An interactive CLI may automatically open a same-origin TrackMCP device page after displaying the URL and code. Automatic opening is a convenience, not a requirement: the URL and code must always be printed, `--no-browser` must be supported, and the CLI must continue to work when no graphical browser exists.

The CLI must never request or store a TrackMCP password. Authentication must use a short-lived device authorization session, an existing account session, or an explicitly supplied automation credential. This preserves SSO, MFA, email verification, and account-recovery behavior without creating a second authentication implementation.

## 7. Personas and jobs to be done

### 7.1 MCP developer / server operator

**Job:** “I want to install observability, send one safe event, and know whether it works without changing my server behavior.”

Needs:

- clear prerequisite instructions,
- environment-variable examples,
- safe key handling,
- actionable auth/network errors,
- a quick first-event verification path.

### 7.2 Product owner / business stakeholder

**Job:** “I want to know whether the SDK is actually helping a server produce useful analytics.”

Needs:

- a trustworthy first-telemetry milestone,
- clear distinction between empty, rejected, and inactive states,
- no false claims from npm download counts.

### 7.3 Support / customer-success operator

**Job:** “I want to determine where a customer stopped without requesting secrets or raw payloads.”

Needs:

- bounded activation status,
- key creation and first-ingest timestamps,
- SDK version and service metadata,
- safe failure categories.

### 7.4 Engineering operator

**Job:** “I want to evolve the SDK and ingest path without compromising MCP availability or privacy.”

Needs:

- stable event contracts,
- compatibility tests,
- rate-limited diagnostics,
- migration and rollout controls.

## 8. Current-state funnel and gaps

| Funnel stage | Current behavior | Current observability | Gap / risk |
|---|---|---|---|
| npm discovery/download | Package installs silently | npm aggregate downloads | No identity or activation linkage |
| README/docs discovery | Code and key are shown | Website pageviews | README lacks prominent signup-first path |
| Signup | Email/password + verification | Auth and PostHog events | No guaranteed npm source attribution |
| Workspace | Auto-provisioned after auth | `workspace_created` | May add a separate step before key creation |
| API key | Explicit dashboard action | `api_key_created` | Key copy is not measured; raw key shown once |
| SDK configuration | Environment variable in user process | Not observed | Missing/invalid configuration is opaque |
| Server activity | SDK captures after MCP call | Ingest events | No first-accepted-ingest activation milestone |
| Ingest auth | Invalid responses fail open and requeue | Not visible to user | 401/403 can look like “nothing happened” |
| Dashboard verification | User returns and checks data | `first_telemetry_seen` on dashboard load | Not the same as first accepted ingest |

## 9. Target experience

### 9.1 Published README experience

The first section of the published README must present this exact sequence:

1. Create a free TrackMCP account.
2. Create a workspace connection key.
3. Set `TRACKMCP_KEY` in the server environment.
4. Install `@trackmcp/sdk`.
5. Wrap the MCP server.
6. Restart the server and make one real tool call.
7. Open the dashboard to verify the first event.

The README must include a direct signup URL with a non-sensitive source marker, for example:

```text
https://app.trackmcp.com/signup?source=npm&package=%40trackmcp%2Fsdk
```

The README must explain that the package will not open a browser or create an account during `npm install`.

### 9.2 Signup and dashboard experience

After email verification:

- the user reaches a focused activation state,
- workspace creation is either combined with first-key creation or immediately followed by a dominant “Create your first connection key” action,
- the key is shown once with “Copy key” and safe handling guidance,
- the setup snippet contains the package install command, environment variable, wrapper code, and first-event verification step,
- the user can test or check for the first event without losing the selected workspace/data state.

The product must preserve the existing truth rule: an empty My-data state must not silently become Example data.

### 9.3 SDK runtime experience

The SDK remains fail-open for the MCP call but exposes diagnostics:

- missing key: immediate actionable, secret-free diagnostic with a signup/docs URL; do not crash the MCP server by default,
- rejected key: rate-limited warning or callback identifying authentication rejection,
- network failure: bounded warning/callback identifying delivery failure,
- accepted event: optional diagnostic signal and backend first-ingest milestone.

Diagnostics must never include secrets or raw payloads.

### 9.4 Primary guided setup CLI

The companion CLI is the primary recommended activation path for local interactive development:

```text
npx @trackmcp/cli init
npx @trackmcp/cli doctor
```

`setup` remains an alias for `init` for compatibility with the current package. The CLI must be a separate package or explicit command rather than an npm lifecycle script inside the SDK.

#### 9.4.1 Interactive local flow

When the command runs in an interactive TTY:

1. The CLI checks whether the project already has a usable `TRACKMCP_KEY`.
2. If no key exists, it requests a short-lived device session from TrackMCP.
3. It prints the verification URL and one-time code before attempting to open a browser.
4. It opens the device page using the operating system’s default browser when supported.
5. The developer signs up or signs in, completes email verification or MFA, selects or creates a workspace, and explicitly approves creating a connection key for the current project.
6. The CLI polls with bounded backoff until the authorization is approved, denied, expired, or cancelled.
7. The backend returns a one-time bootstrap result. The raw API key is returned only over the authenticated TLS connection to the CLI and is never placed in the device URL, code, analytics, or logs.
8. The CLI writes the key to `.env.local` by default, using restrictive file permissions and refusing to overwrite an existing key without confirmation.
9. The CLI prints the package installation and wrapper instructions without attempting to rewrite arbitrary source files.
10. The CLI runs the non-secret portion of `doctor` and reports whether the project is ready for its first real tool call.

#### 9.4.2 Browser and remote behavior

The command must support:

```text
npx @trackmcp/cli init                  # open browser when possible
npx @trackmcp/cli init --no-browser     # print URL and code only
npx @trackmcp/cli init --browser=false  # equivalent explicit spelling
npx @trackmcp/cli doctor                # inspect configuration and delivery
npx @trackmcp/cli logout                # remove local CLI session metadata
```

The CLI must not hang indefinitely. Device sessions require an expiry, a polling interval, a maximum wait time, and clear cancellation instructions. If the browser cannot be opened, the printed URL and code must be sufficient to complete setup on another device.

#### 9.4.3 Headless and CI behavior

CI and non-interactive environments must never start a browser or prompt for credentials. They use an environment variable or secret manager:

```text
TRACKMCP_KEY=tmcp_...
npx @trackmcp/cli doctor --non-interactive
```

The CLI must reject API keys passed as ordinary command-line arguments where they could appear in shell history or process listings. A future `--token-stdin` or environment-file option may be supported for automation, but secrets must not be echoed.

#### 9.4.4 What the CLI does not automate

The CLI may install `@trackmcp/sdk` only after explicit confirmation. It may generate a setup snippet or a framework-specific example, but it must not silently modify arbitrary application source code. An opt-in codemod is a separate future feature with its own compatibility matrix and rollback behavior.

The CLI must not send an anonymous install ping. A successful first accepted ingest remains the authoritative product activation milestone.

### 9.5 Device authorization protocol

TrackMCP will implement a short-lived, one-time device authorization session rather than a terminal email/password login.

The protocol must provide:

- a random device identifier and one-time user code with sufficient entropy;
- a verification URL on the canonical TrackMCP application host;
- an expiry and polling interval;
- explicit approved, denied, expired, and slow-down states;
- rate limits by device/session and network boundary;
- single-use redemption of the approved result;
- no API key, password, email address, or raw user identifier in the URL or user code;
- cancellation when the CLI exits or the session expires;
- audit-safe event categories without secrets.

After browser approval, the backend must bind the result to the authenticated TrackMCP user and the selected workspace. It may create exactly one initial key for the project, store only the existing hash/prefix representation, and return the raw key once to the CLI. Duplicate polling or replayed redemption must not create duplicate keys.

### 9.6 Reference device-flow API contract

The following contract is the implementation baseline. Engineers may refine names, but changes must preserve the security and state semantics below.

#### Start a device session

```http
POST /api/v1/cli/device/sessions
content-type: application/json
```

Request properties are bounded and non-sensitive:

```json
{
  "client_version": "0.2.0",
  "platform": "darwin-arm64",
  "package_manager": "npm",
  "sdk_package": "@trackmcp/sdk"
}
```

Response:

```json
{
  "device_code": "opaque-long-lived-secret-for-cli-only",
  "user_code": "F7KQ-2M9D",
  "verification_uri": "https://app.trackmcp.com/device",
  "verification_uri_complete": "https://app.trackmcp.com/device?user_code=F7KQ-2M9D",
  "expires_in": 600,
  "interval": 5
}
```

The CLI must keep `device_code` in memory only. It may print `user_code` and the verification URI, but never the device code. The server must store only hashes of both codes.

#### Poll for approval

```http
POST /api/v1/cli/device/sessions/poll
content-type: application/json
```

```json
{
  "device_code": "opaque-long-lived-secret-for-cli-only"
}
```

The response must use explicit bounded states:

```json
{ "status": "authorization_pending", "interval": 5 }
{ "status": "slow_down", "interval": 10 }
{ "status": "approved" }
{ "status": "denied", "reason_category": "user_denied" }
{ "status": "expired" }
```

The CLI must stop polling after `approved`, `denied`, `expired`, cancellation, or its local timeout.

#### Complete one-time redemption

```http
POST /api/v1/cli/device/sessions/redeem
content-type: application/json
```

```json
{
  "device_code": "opaque-long-lived-secret-for-cli-only",
  "key_name": "optional-bounded-project-label"
}
```

The endpoint must atomically mark the device session as redeemed and return the raw TrackMCP key only once:

```json
{
  "workspace": { "id": "...", "name": "...", "slug": "..." },
  "api_key": "tmcp_...",
  "message": "Copy or store this key now. It will not be shown again."
}
```

Replays must return a non-secret `already_redeemed` result and must not create another key. The device code must never be accepted as a TrackMCP API key.

#### Verify a local key

`doctor` must use a dedicated, rate-limited, non-payload verification endpoint rather than sending a fake telemetry event:

```http
GET /api/v1/cli/key-status
authorization: Bearer tmcp_...
```

The endpoint may return only bounded status information such as `valid`, `revoked`, `workspace_available`, and `service_available`. It must not return the raw key, email address, workspace membership list, or customer telemetry.

#### Device-session persistence

If a database record is required, use a reviewed migration for a service-controlled table such as `trackmcp_cli_device_sessions` with:

- opaque session ID;
- hash of `device_code`;
- hash of `user_code`;
- bounded status;
- bounded client version/platform/package-manager fields;
- created, expires, last-polled, approved, and redeemed timestamps;
- approved user/workspace IDs only after browser approval;
- optional created key ID, never the raw key;
- poll count and last slow-down timestamp for abuse control.

The table must have unique constraints for code hashes, deny direct client-table access through RLS, and define cleanup/retention behavior. Raw device codes, API keys, passwords, browser tokens, and arbitrary project paths must not be persisted.

## 10. Functional requirements

### FR-1: Documentation activation path

The published README and first-party TypeScript docs must:

- show signup before key configuration,
- link directly to signup,
- include the package name and current release guidance,
- show a complete environment-variable example,
- explain that no install-time browser or account action occurs,
- include a first-event verification step,
- include common failure explanations.

### FR-2: Source attribution

Signup links originating from SDK docs must preserve bounded attribution fields:

- `source` or `utm_source` = `npm` / `sdk_docs`,
- package name,
- package major/minor release or documented version,
- referring documentation path.

Do not put API keys, email addresses, raw repository URLs, or arbitrary user text in attribution parameters.

### FR-3: Workspace and key activation

The dashboard must provide a one-screen first activation flow. Product and engineering must choose one of these implementations before coding:

**Option A — combined activation:** verified signup provisions the workspace and first key in one explicit user action.

**Option B — guided two-step activation:** workspace creation is retained, but the user is immediately routed to a dedicated first-key screen with no competing dashboard content.

Acceptance requirement for either option: a new verified user can reach the one-time key display without discovering a secondary navigation item.

### FR-4: Key-copy instrumentation

Emit `api_key_copied` when the user successfully copies the full key. If clipboard access fails, emit `api_key_copy_failed` with a bounded browser capability category, not the key.

The full key must never be placed in event properties.

### FR-5: Setup-snippet instrumentation

Emit:

- `install_command_copied`,
- `setup_snippet_copied`,
- `sdk_docs_opened`,
- `first_event_check_started`,
- `first_event_check_result`.

Result values must be bounded categories such as `event_found`, `no_event`, `unauthorized`, `permission_denied`, `retryable_error`, or `unknown`.

### FR-6: SDK diagnostics

Add a stable diagnostics surface without changing the public telemetry schema unexpectedly. Recommended fields:

```ts
type TrackMCPDeliveryErrorKind =
  | "missing_api_key"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "server_error"
  | "network_error"
  | "aborted"
  | "unknown";
```

Recommended options:

```ts
type TrackMCPDiagnosticsOptions = {
  onDeliveryError?: (error: {
    kind: TrackMCPDeliveryErrorKind;
    status?: number;
    retrying: boolean;
  }) => void;
  debug?: boolean;
};
```

Requirements:

- callbacks are bounded and rate-limited,
- diagnostics never contain the bearer key or payload,
- MCP calls remain unaffected,
- a missing key must not crash the customer’s MCP server by default; telemetry should be disabled with one actionable, secret-free diagnostic,
- an explicit opt-in strict configuration may throw on missing configuration for teams that require enforcement, but it must use the same actionable message and remain secret-free,
- invalid key responses remain requeued or dropped according to existing bounds,
- the API is documented and tested.

### FR-7: First accepted ingest milestone

On the first valid event accepted for a workspace/key, persist an internal activation milestone with:

- workspace ID,
- hashed key identity or key ID,
- first accepted timestamp,
- SDK version if provided,
- service,
- environment,
- event type,
- observation source.

Do not persist the raw key or raw event body for this milestone.

The milestone must be idempotent.

### FR-8: Funnel reporting

Provide an internal report or query that shows, by date and bounded source attribution:

- website/signup visitors,
- signup started,
- signup completed,
- workspace created,
- key created,
- key copied,
- first accepted ingest,
- dashboard first-event view.

The report must show npm downloads separately and label them “aggregate downloads; not unique users.”

### FR-9: First-event state clarity

The dashboard must distinguish:

- no workspace,
- workspace but no key,
- key exists but no accepted events,
- event rejected for authorization,
- event not observed in selected period,
- accepted event exists but dashboard query failed,
- accepted event exists and is visible.

No state may claim “installation succeeded” unless an actual API contract proves it.

### FR-10: CLI device-session lifecycle

The CLI must implement the following lifecycle without collecting a TrackMCP password:

1. `init` requests a device session over TLS.
2. The response contains a verification URL, one-time user code, expiry, polling interval, and opaque device-session identifier.
3. The CLI prints the URL and code, then attempts to open the URL in the default browser unless `--no-browser` is set.
4. The browser page handles signup, sign-in, email verification, MFA, workspace selection, terms acceptance, and explicit key-creation consent.
5. The CLI polls only the device-session endpoint, with bounded backoff and server-directed slow-down handling.
6. On approval, the CLI redeems the session exactly once and receives the one-time key result.
7. On denial, expiry, cancellation, or timeout, the CLI exits with a clear recovery command and does not write a partial credential.

The device-session API must be rate-limited, replay-resistant, auditable without secrets, and safe to run from a remote machine while the browser runs on another device.

### FR-11: Automatic browser opening

Automatic browser opening is required for the normal interactive local path, but it must never be the only path:

- print the complete HTTPS URL before opening it;
- print the short code separately so it can be entered on another device;
- use the operating system’s supported opener without shell interpolation of user-controlled values;
- do not open a browser from `npm install`, `npm ci`, dependency resolution, or any transitive install;
- support `--no-browser` and a non-interactive environment fallback;
- report when opening failed and continue waiting rather than hanging silently;
- never include the API key, password, access token, or email address in the URL or code.

### FR-12: Key creation and local storage

After successful device approval, the CLI must create or retrieve one initial workspace key according to the approved workspace policy. The raw key is returned once and then:

- written to `.env.local` by default, unless the user selects an explicit environment-file path;
- written with restrictive permissions where the platform supports them;
- never printed in full after the initial write;
- never added to shell history, process arguments, analytics, telemetry payloads, or log files;
- not used to overwrite an existing key without explicit confirmation;
- accompanied by a warning to ensure the environment file is ignored by version control.

### FR-13: CLI doctor and connection verification

`trackmcp doctor` must provide bounded, actionable checks:

- environment file discovery;
- key presence and format, without displaying the key;
- SDK package and Node.js compatibility;
- ingest endpoint reachability;
- key acceptance using a dedicated non-payload verification contract or another reviewed mechanism;
- workspace/key status where the authenticated contract permits it;
- whether accepted telemetry has been observed;
- the next action for no-event, unauthorized, network, permission, or dashboard-query states.

The doctor command must not create customer telemetry, execute MCP tools, or require raw tool arguments/results. A separate explicit first-event command may be added later, but it must be opt-in and clearly state what it sends.

### FR-14: CLI authentication modes

The CLI must support three explicit modes:

| Mode | Intended use | Authentication behavior |
|---|---|---|
| Interactive | Local developer machine | Device authorization and automatic browser opening |
| Remote interactive | SSH, container, Codespace | Device authorization with `--no-browser`; user completes URL/code elsewhere |
| Non-interactive | CI/CD and automation | Pre-provisioned `TRACKMCP_KEY` or approved secret-manager input; no prompts or browser |

The CLI must detect non-TTY execution and refuse to start an interactive device flow unless the user explicitly overrides it. API keys must not be accepted as ordinary positional arguments.

### FR-15: Canonical host and redirect policy

The product must select one canonical application host for device authorization, signup, dashboard, and auth callbacks. The current recommendation is `https://app.trackmcp.com`, because the existing signup and dashboard links already use that host; DNS, TLS, Supabase callback allowlists, and deployment routing must be verified before release. Alternate hosts may redirect, but the CLI must not randomly choose between hosts. Redirects must preserve only bounded source attribution and never carry credentials or one-time key material.

### FR-16: First-key policy and idempotency

The first activation flow must create at most one initial key for a workspace/project authorization. The implementation must define how repeated browser approval, repeated polling, CLI retries, and a user who already has a workspace/key behave.

Required behavior:

- an existing authenticated workspace may be selected explicitly;
- an existing key must not be silently revoked or replaced;
- a retry after a network timeout must return the original redemption result or a non-secret already-completed state;
- the full key is shown only at first creation;
- the UI and CLI must clearly distinguish “key already exists” from “new key created”;
- all key creation paths must continue using the existing hash/prefix storage model.

### FR-17: Project setup and package-manager support

`init` must detect the project context without assuming a framework:

- Node.js version and package manager (`npm`, `pnpm`, `yarn`, or `bun`) when detectable;
- whether `package.json` exists;
- whether `@trackmcp/sdk` is already installed and its version;
- whether `.env.local`, `.env`, or another explicitly selected environment file exists;
- whether the selected environment file is ignored by Git where the project is a Git checkout.

The CLI must print package-manager-specific commands but must not modify `package.json`, lockfiles, or source code without explicit confirmation. SDK installation, environment-file writing, and source-code modification are separate opt-in actions.

### FR-18: Release and compatibility contract

The implementation must preserve compatibility with existing SDK consumers:

- existing `withTrackMCP` integrations continue to ingest events;
- `setup` remains an alias for `init` for at least one minor release;
- Node.js 18+ remains supported;
- ESM exports and the Node-only client adapter remain unchanged unless versioned;
- CLI and SDK package versions are reported separately and included in diagnostics;
- the exact packed tarballs must be tested before publishing;
- a release must include README, docs, changelog, migration, and rollback notes.

### FR-19: Activation-state truthfulness

The product must never infer successful installation from a CLI start, package download, key creation, or dashboard visit. The authoritative states are:

```text
download observed        = aggregate npm fact
signup completed         = authenticated product fact
key created              = credential-management fact
key verified             = authenticated API fact
first ingest accepted    = backend telemetry fact
dashboard event visible  = dashboard-query fact
```

Each state must have its own timestamp and failure category where applicable. The CLI, dashboard, analytics, and support runbook must use these terms consistently.

## 11. Event contract

All browser analytics events must use bounded, non-secret properties. Suggested event table:

| Event | Emitter | Required properties | Meaning |
|---|---|---|---|
| `sdk_docs_viewed` | Website | `path`, `source` | A documentation page was viewed |
| `signup_cta_clicked` | Website | `source`, `content_path`, `content_cta` | Signup CTA was clicked |
| `signup_request_started` | Auth UI | `auth_mode` | User submitted signup credentials |
| `signup_completed` | Auth UI | `auth_mode` | Account verification/auth completed |
| `workspace_created` | Dashboard UI | none or bounded source | Workspace creation succeeded |
| `api_key_created` | Dashboard UI | key name category only | Key creation succeeded |
| `api_key_copied` | Dashboard UI | copy method category | Full key was copied successfully |
| `install_command_copied` | Dashboard UI/docs | `language`, `package` | Install command was copied |
| `setup_snippet_copied` | Dashboard UI | `language`, `package` | Setup snippet was copied |
| `first_event_check_started` | Dashboard UI | `data_mode` | User requested verification |
| `first_event_check_result` | Dashboard UI | bounded result category | Verification result |
| `sdk_config_missing` | SDK | package/version if known | SDK initialized without a key |
| `sdk_delivery_error` | SDK diagnostic sink | error kind/status category | Delivery failed; opt-in/controlled reporting only |
| `first_ingest_accepted` | Ingest/backend | workspace/key metadata | First valid event accepted |
| `first_telemetry_seen` | Dashboard UI | event count | Dashboard loaded data for the first time |

CLI device-session events may be recorded as bounded operational events, but must not identify an npm installer or contain a device code, API key, email, IP address, or raw token:

| Event | Emitter | Required properties | Meaning |
|---|---|---|---|
| `cli_device_session_started` | CLI/backend | `client_version`, `mode` | A user explicitly started terminal onboarding |
| `cli_device_auth_approved` | Backend | `client_version` | The browser approval completed |
| `cli_device_auth_denied` | Backend | `client_version`, `reason_category` | The user denied or the session was rejected |
| `cli_device_auth_expired` | Backend | `client_version` | The session expired without approval |
| `cli_init_completed` | CLI | `client_version`, `storage_mode` | The key was stored locally; no key value is recorded |
| `cli_doctor_result` | CLI | `client_version`, `result_category` | A diagnostic completed with a bounded result |

The SDK must not silently send browser analytics. SDK-side reporting should use the backend activation milestone and optional developer diagnostics. If SDK diagnostics are ever sent automatically, that requires a separate privacy review.

## 12. Technical design constraints

### 12.1 SDK

- Preserve Node.js 18+ support.
- Preserve ESM exports and the Node-only client adapter boundary.
- Do not add an npm lifecycle script.
- Do not make telemetry synchronous with tool execution.
- Do not weaken local redaction, payload bounds, queue limits, or fail-open behavior.
- Do not leak keys in thrown errors, logs, callbacks, or tests.
- Keep the public API backward-compatible where practical; if a breaking change is necessary, version it explicitly.

### 12.2 Ingest

- Authenticate before parsing or persisting customer payloads where current architecture requires it.
- Keep workspace scope and key hashing unchanged.
- Make first-accepted-ingest persistence idempotent.
- Avoid raw request-body logging and raw error diagnostics.
- Add integration tests for valid, missing, invalid, revoked, and first-event cases.

### 12.3 Web app

- Preserve existing My data / Example data semantics.
- Preserve attribution privacy boundaries.
- Do not identify users with email in PostHog properties.
- Ensure copy buttons and setup actions remain accessible and keyboard-operable.
- Keep signup, workspace, and key actions explicit and recoverable.

### 12.4 Database and migrations

Any new activation milestone table or columns require:

- a reviewed migration,
- workspace/key authorization analysis,
- bounded fields,
- idempotency constraints,
- retention decision,
- rollback plan,
- explicit authorization before production migration.

Do not use `supabase db push` casually.

### 12.5 CLI and device authorization

- The CLI must remain a separate package from the SDK and must not add lifecycle scripts to `@trackmcp/sdk`.
- Browser opening is allowed only after an explicit CLI command such as `init`; it is never allowed during package installation.
- The CLI must use a standard short-lived device authorization pattern rather than a custom password-collection flow.
- Device codes and bootstrap sessions must be single-use, expiring, rate-limited, and safe to print in terminal logs.
- The CLI must use TLS for every TrackMCP request and must validate the expected HTTPS application host before opening it.
- The CLI must not put secrets in command-line arguments, URLs, user codes, analytics, exceptions, or logs.
- Local key storage must prefer a project environment file that is already conventional for the detected framework, with `.env.local` as the default fallback.
- File writes must be atomic where practical, must preserve unrelated environment variables, and must not overwrite existing values without confirmation.
- The CLI must work on macOS, Linux, and Windows with a platform-specific browser opener and a printed-URL fallback.
- The CLI must work in SSH, containers, and Codespaces with `--no-browser`.
- The CLI must detect CI/non-TTY execution and never hang waiting for browser approval.
- Tests must cover browser opener failure, device approval, denial, expiry, polling slow-down, replay, interruption, existing-key protection, and non-interactive mode.

## 13. Recommended three-engineer work split

### Engineer 1 — SDK runtime and developer diagnostics

Own:

- SDK error taxonomy,
- missing/invalid-key diagnostics,
- rate-limited warning/callback behavior,
- diagnostics tests,
- README package-level setup content,
- CLI `init`, device-session client, browser opener, `doctor`, and secure local key storage,
- packed-artifact verification.

Deliverables:

- backward-compatible SDK implementation,
- tests for missing key, 401, 403, retry, network failure, and fail-open behavior,
- CLI tests for interactive, remote, non-interactive, approval, denial, expiry, and browser-open failure paths,
- updated published README,
- release checklist and packed-consumer test evidence.

### Engineer 2 — Auth, dashboard activation, and browser funnel events

Own:

- signup-to-workspace/key activation flow,
- key-copy and setup-copy events,
- first-event check instrumentation,
- attribution parameters from SDK docs,
- UI state and accessibility coverage.

Deliverables:

- one-screen first activation experience,
- explicit source-aware signup path,
- copy and setup events,
- tests for new, verified, workspace-only, key-only, empty, unauthorized, and successful first-event states.

### Engineer 3 — Ingest milestone and funnel reporting

Own:

- first accepted ingest persistence,
- idempotency and retention design,
- backend activation queries/reporting,
- PostHog/Vercel event validation,
- operational dashboards or export for funnel analysis.

Deliverables:

- migration and backend contract,
- ingest integration tests,
- source-separated funnel report,
- documented distinction between npm aggregate downloads and identified activation.

### Shared ownership

All three engineers must review:

- privacy and secret-handling implications,
- API compatibility,
- rollout and rollback plan,
- browser and packed-artifact verification,
- exact deployed commit and environment configuration.

## 14. Milestones

### Milestone 0 — Decision and baseline

Before implementation:

- confirm whether the first key is auto-created or explicitly created after workspace provisioning,
- define activation event names and property allowlist,
- define milestone retention,
- capture current signup/key/first-event counts,
- reconcile the reported 47 downloads with npm’s aggregate report.

Exit criteria:

- approved event contract,
- approved workspace/key activation choice,
- baseline report saved,
- no unresolved ambiguity about “first event.”

### Milestone 1 — Documentation and diagnostics

Ship:

- README signup-first path,
- direct source-aware signup link,
- setup prerequisites,
- SDK diagnostics and tests,
- `npx @trackmcp/cli init` and `npx @trackmcp/cli doctor` command contract,
- device-session API design and threat model.

Exit criteria:

- clean consumer can follow README without guessing where the key comes from,
- missing and rejected key paths produce actionable, secret-free feedback,
- MCP request behavior is unchanged,
- the CLI can print a device URL/code, open the browser when supported, and fall back cleanly when it cannot.

### Milestone 1.5 — Device authorization and terminal setup

Ship:

- short-lived device-session endpoints and browser approval page,
- CLI polling and single-use redemption,
- workspace/key creation policy,
- atomic `.env.local` writing and existing-key protection,
- `--no-browser`, non-TTY, and CI behavior,
- `doctor` checks and bounded result categories.

Exit criteria:

- a disposable account can complete signup in the browser and receive a key in the terminal without manually copying the key,
- the same flow works when the browser is opened on another device,
- denied, expired, interrupted, replayed, and rate-limited sessions are safe and recoverable,
- no secret appears in URLs, codes, logs, analytics, shell arguments, or test output.

### Milestone 2 — Activation UI and instrumentation

Ship:

- focused signup-to-key activation,
- key-copy/setup-copy events,
- first-event check events,
- docs attribution.

Exit criteria:

- a new account can reach and copy a key without secondary navigation discovery,
- all browser event properties are bounded and non-sensitive,
- empty and error states remain honest.

### Milestone 3 — Backend milestone and reporting

Ship:

- first accepted ingest milestone,
- idempotent migration,
- funnel query/report,
- source-separated npm/download interpretation.

Exit criteria:

- a disposable key can produce exactly one first-ingest milestone,
- retries do not duplicate milestones,
- report can distinguish key-created/no-event, rejected, accepted, and dashboard-seen states.

### Milestone 4 — Controlled rollout

Ship behind appropriate flags or staged release:

- updated SDK release,
- updated docs and dashboard,
- production smoke test with disposable credentials,
- monitoring and rollback instructions.

Exit criteria:

- exact deployed commit recorded,
- direct and public routes verified,
- no secrets in logs or analytics,
- support runbook published.

## 15. Success metrics

### Primary metrics

1. **Signup completion rate from SDK-doc source**

   `signup_completed / signup_cta_clicked` for bounded SDK-doc attribution.

2. **Key activation rate**

   `api_key_created / signup_completed`.

3. **First accepted ingest rate**

   `first_ingest_accepted / api_key_created` within 7 and 30 days.

4. **Time to first accepted ingest**

   Median and p75 time from `signup_completed` or `api_key_created` to first accepted event.

5. **First-event verification rate**

   `first_event_check_result(event_found) / api_key_created`.

### Diagnostic metrics

- missing-key diagnostic rate,
- invalid-key rate,
- revoked-key rate,
- network delivery failure rate,
- no-event-after-key rate,
- dashboard empty-state return rate,
- setup snippet copy rate,
- key copy success/failure rate.

### Guardrail metrics

- MCP request latency and error rate must not regress due to diagnostics.
- SDK queue memory/event bounds must not regress.
- No secrets or raw payloads in logs or analytics.
- No increase in ingest request-body exposure.
- No increase in dashboard example-data substitution or misleading activation claims.

## 16. Acceptance criteria

### Documentation

- [ ] README clearly states that signup and a workspace key are required.
- [ ] README contains a direct signup link with bounded source attribution.
- [ ] README explains that npm install does not open signup or create an account.
- [ ] README includes complete `TRACKMCP_KEY` setup and first-event verification.
- [ ] Website TypeScript docs match the published README.
- [ ] Version and package names are consistent across docs, homepage, and package metadata.

### SDK

- [ ] Missing key produces a clear, actionable, secret-free error.
- [ ] Invalid/revoked key responses are categorized without blocking MCP requests.
- [ ] Diagnostics are rate-limited and bounded.
- [ ] No key, authorization header, raw payload, or customer content appears in diagnostics.
- [ ] Existing redaction and queue limits remain intact.
- [ ] Clean packed-consumer install passes.
- [ ] Node-only adapter and browser/Edge boundaries remain intact.

### Dashboard/auth

- [ ] New verified users reach first-key creation without discovering secondary navigation.
- [ ] Key is shown only once in full.
- [ ] `api_key_created` fires only after successful creation.
- [ ] `api_key_copied` fires only after successful copy.
- [ ] Setup-copy and install-copy events contain no secret values.
- [ ] First-event check reports bounded result categories.
- [ ] My-data empty, unauthorized, retry, and successful states remain distinct.

### CLI/device authorization

- [ ] `npx @trackmcp/cli init` is the primary documented local setup path.
- [ ] Interactive `init` prints the device URL and code before attempting to open the browser.
- [ ] Interactive `init` automatically opens the canonical device page when a supported opener is available.
- [ ] `--no-browser` completes through a URL/code flow on another device.
- [ ] Non-TTY and CI execution never opens a browser or waits indefinitely for input.
- [ ] The CLI never requests, stores, or transmits a TrackMCP password.
- [ ] Device sessions expire, are rate-limited, and cannot be replayed.
- [ ] Successful approval creates at most one initial key for the selected workspace/project.
- [ ] The raw key is returned once over TLS and stored locally without appearing in terminal logs or analytics.
- [ ] Existing environment values are protected from accidental overwrite.
- [ ] `doctor` distinguishes missing key, malformed key, unauthorized key, network failure, no accepted event, and accepted event.
- [ ] Browser-open failure is reported without preventing manual URL/code completion.
- [ ] No browser is opened by `npm install`, `npm ci`, `npx` package resolution, or any SDK lifecycle script.

### Backend/reporting

- [ ] First accepted ingest is persisted idempotently.
- [ ] Raw API keys are never persisted in activation records.
- [ ] Accepted ingest is distinguishable from dashboard viewing.
- [ ] Funnel report separates npm aggregate downloads from identified product events.
- [ ] Retention and access controls are documented.
- [ ] Integration tests cover valid, invalid, revoked, duplicate, and first-event paths.

### Operations

- [ ] Focused tests pass.
- [ ] Lint, build, and diff checks pass.
- [ ] Browser verification covers 1280×800 and 1440×900.
- [ ] Exact release commit, deployment operation, and live routes are recorded.
- [ ] Rollback instructions exist for SDK, web, and migration changes.

## 17. Privacy and security requirements

The following are hard requirements:

- Never collect or transmit API keys through analytics.
- Never put bearer headers in logs, errors, PostHog, Vercel Analytics, or browser storage.
- Never add raw request bodies to activation records.
- Never send tool arguments/results through the browser funnel.
- Never identify npm installers by guessing from IP addresses or package-download timing.
- Never add an install-time network call without a separate privacy and supply-chain review.
- Never put passwords, API keys, access tokens, email addresses, or raw user identifiers in device URLs or device codes.
- Never treat a device code as an API key or bearer credential; it is only an expiring authorization handle.
- Never leave a device polling session running after approval, denial, expiry, cancellation, or timeout.
- Never silently open a browser from a dependency install or transitive package execution.
- Keep local SDK redaction as the first privacy boundary.
- Keep ingest sanitization as defense in depth.
- Keep provider-level privacy claims scoped to evidence that has actually been verified.

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Developers dislike browser-opening install scripts | High | Do not use npm lifecycle scripts; use README links and optional CLI |
| Fail-open diagnostics expose too much | High | Allowlist categories; redact all values; rate-limit output |
| Combined workspace/key creation changes security expectations | Medium | Obtain explicit product/security decision; preserve one-time secret display |
| npm download count is misread as adoption | High | Separate report section and explicit labeling |
| PostHog data is unavailable for historical queries | Medium | Persist backend activation milestones; obtain authorized query access separately |
| First event is accepted but dashboard query fails | Medium | Track backend acceptance and dashboard visibility separately |
| A migration creates duplicate or incorrect milestones | High | Unique constraints, idempotency tests, reviewed migration, rollback plan |
| SDK release differs from source | High | Pack and clean-install the exact tarball before publish |
| Invalid-key logs create customer confusion | Medium | Use clear categories and docs with environment/workspace checks |
| Browser opener fails on a remote or restricted machine | Medium | Print URL and code first; support `--no-browser` and another-device approval |
| Device code is intercepted or replayed | High | Short expiry, high entropy, single-use redemption, rate limits, and explicit approval binding |
| CLI writes a key into a tracked environment file | High | Default to `.env.local`, check ignore rules, warn clearly, protect existing values, and use restrictive permissions |
| CLI waits forever for browser approval | Medium | Server expiry, bounded polling, cancellation, timeout, and non-TTY detection |
| Device flow becomes a second authentication system | High | Delegate identity to the existing web auth provider; CLI only handles device authorization and key bootstrap |
| Automatic browser opening is interpreted as an install side effect | Medium | Open only after explicit `trackmcp init`; never from SDK or npm lifecycle scripts |

## 19. Open decisions requiring explicit owner

The following product direction is recommended for approval before implementation:

1. **Authentication:** use browser-assisted device authorization; do not collect TrackMCP passwords in the CLI.
2. **Browser opening:** automatically open the canonical device page for interactive local `init`, after printing the URL and code; support `--no-browser` for remote environments.
3. **First key:** create one initial key as part of the explicit browser approval flow, then show it once in the terminal and store it locally.
4. **SDK diagnostics:** preserve fail-open MCP behavior; emit one rate-limited actionable diagnostic by default and expose a typed callback for applications that want structured handling.
5. **CLI scope:** make `init` and `doctor` first-class in this project; keep `setup` as an alias; defer source codemods.
6. **Install behavior:** never open a browser or make a network request from `npm install`, `npm ci`, SDK import, or a transitive dependency lifecycle script.

The remaining decisions requiring explicit owner are:

7. Should `first_ingest_accepted` be a new table or a bounded workspace/key column set?
8. What is the retention period for activation milestones?
9. Which team owns the funnel report after launch?
10. Which PostHog events are allowed to identify an authenticated user, and what is the approved retention policy?
11. What is the supported source attribution vocabulary (`npm`, `sdk_docs`, `github`, `ai`, `direct`, etc.)?
12. Should the package README document only the latest version or provide a compatibility matrix?
13. What is the minimum activation success threshold for declaring the funnel healthy?

## 20. Rollout and rollback

### Rollout sequence

1. Merge documentation and event-contract changes.
2. Deploy device-session backend code and migration under review.
3. Run disposable-account device-flow smoke tests with browser, `--no-browser`, denial, expiry, replay, and timeout cases.
4. Run disposable-key smoke tests in a non-production or controlled production workspace.
5. Verify no secrets, device codes, or raw payloads appear in logs, analytics, or milestone records.
6. Release the CLI and SDK only after packed-consumer and cross-platform verification.
7. Publish updated README, docs, and dashboard flow.
8. Monitor activation, device-flow, and guardrail metrics for at least one release cycle.

### Rollback sequence

- Web UI/events: revert web deployment or disable feature flag.
- SDK: publish a patched version; do not silently mutate an existing tarball.
- Backend milestone: disable writes while preserving read compatibility, then apply a reviewed rollback migration if required.
- Diagnostics: disable default warnings or callback emission without changing telemetry behavior.

Do not treat App Runner `RUNNING` alone as deployment success. Verify the deployment operation, direct origin, public domain, key routes, authenticated behavior, and exact deployed commit.

## 21. Support runbook after launch

When a user says “I installed the SDK but see no data,” support should ask for categories, not secrets:

1. Which package version is installed?
2. Did `npx @trackmcp/cli init` complete, or did the device session expire/deny/time out?
3. Is `TRACKMCP_KEY` present in the server process environment?
4. Does initialization throw a missing-key error?
5. Does the SDK or `npx @trackmcp/cli doctor` report an authentication or network diagnostic?
6. Was the key created in the same workspace being viewed?
7. Has the server made one real tool call since restart?
8. Does the backend show a first accepted ingest milestone?
9. Is the dashboard using My data rather than Example data?

Support must never request the full API key, raw telemetry payload, customer tool arguments, or private MCP data.

## 22. Final product decision

The NPM package remains a conventional, non-intrusive SDK. It must not perform signup, open a browser, or make an install-time network request from `npm install`, `npm ci`, SDK import, or a transitive dependency lifecycle script.

The supported local activation path is terminal-first and browser-assisted:

```text
npx @trackmcp/cli init
  → print URL and one-time code
  → automatically open the device page when possible
  → authenticate and approve in the browser
  → create one initial key
  → write TRACKMCP_KEY locally
  → run npx @trackmcp/cli doctor
  → add the SDK wrapper and make one real tool call
```

The browser is necessary for secure account identity and consent, but the developer should not need to navigate the dashboard to perform routine setup. Remote and headless users must have equivalent `--no-browser` and environment-variable paths.

The success condition is not “more npm downloads.” It is:

> A developer can go from discovering the SDK to a verified first telemetry event with no guesswork, the browser is used only for secure identity approval, and the team can explain every measurable activation drop-off without overstating what npm data proves.
