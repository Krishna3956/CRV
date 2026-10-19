# TrackMCP MVP architecture

TrackMCP has two data planes:

1. MCP servers run either `@trackmcp/sdk` or `trackmcp`. The wrapper observes calls locally, applies redaction, and sends batches asynchronously.
2. The Next.js Route Handler at `/api/v1/ingest` authenticates a workspace API key and stores canonical events in `trackmcp_events`.

The SDK is fail-open: telemetry failures are requeued and never change the MCP result or block the server. The service-role Supabase key is used only by server-side Route Handlers. SDKs receive workspace ingest keys, which are hashed before storage.

The semantic layer is intentionally separate from the transport event envelope. Native SDKs may optionally resolve an already-validated customer tenant/account claim; the SDK hashes that value locally into `account_key` and emits `account_identity_source: "resolver"`. If no resolver is configured, events remain explicitly `unresolved`. MCP `clientInfo` is self-reported client metadata, not customer identity.

Semantic interpretations are versioned and must not be recomputed with silent formula changes. The current local contract is defined in `trackmcp-nextjs/src/lib/telemetry/semantic.ts`; the shared dashboard vocabulary is defined in `docs/FOUNDER-OS-METRIC-CONTRACT.md`. Derived outcome metrics must preserve unknown and insufficient-data states rather than treating missing errors as success.

The bounded read-model projection in `trackmcp-nextjs/src/lib/telemetry/facts.ts` is the next layer above the classifier. It carries only safe dimensions and measures for future dashboards; it does not persist a second event store, copy raw payloads, or include correlation identifiers.

For the beta, create a workspace with `POST /api/v1/admin/workspaces` using `x-trackmcp-admin-key`, then use the returned key in `TRACKMCP_KEY`. The `/dashboard` page accepts that same key and reads aggregate analytics through `/api/v1/analytics`.

Run `supabase/migrations/20260829000000_trackmcp_telemetry.sql` in the Supabase SQL Editor before creating a workspace or sending events.

The account-attribution columns are defined in `supabase/migrations/20261018000002_account_identity_contract.sql`. The operator has reported that this migration and the Founder OS read-model migrations have been applied in production; local tests still never execute SQL, so production state should be checked with the read-only postflight queries before enabling a new writer.

The bounded semantic fact writer is guarded by `TRACKMCP_ENABLE_FACT_WRITES=true`. It should only be enabled after the read-model migration has been verified in the target environment. When enabled, fact-write failures are logged but do not fail an otherwise accepted telemetry request.

The initial action queue is intentionally conservative and explainable. It currently emits only elevated tool error-rate and unresolved-workflow signals after minimum sample thresholds. Candidates are persisted with conflict-ignore semantics so repeated evaluations do not overwrite operator acknowledgement or resolution state. Retention defaults and dry-run cleanup guidance live in `docs/FOUNDER-OS-RETENTION-POLICY.md` and `supabase/manual/founder-os-retention.sql`.
