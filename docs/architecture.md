# TrackMCP MVP architecture

TrackMCP has two data planes:

1. MCP servers run either `@trackmcp/sdk` or `trackmcp`. The wrapper observes calls locally, applies redaction, and sends batches asynchronously.
2. The Next.js Route Handler at `/api/v1/ingest` authenticates a workspace API key and stores canonical events in `trackmcp_events`.

The SDK is fail-open: telemetry failures are requeued and never change the MCP result or block the server. The service-role Supabase key is used only by server-side Route Handlers. SDKs receive workspace ingest keys, which are hashed before storage.

For the beta, create a workspace with `POST /api/v1/admin/workspaces` using `x-trackmcp-admin-key`, then use the returned key in `TRACKMCP_KEY`. The `/dashboard` page accepts that same key and reads aggregate analytics through `/api/v1/analytics`.

Run `supabase/migrations/20260829000000_trackmcp_telemetry.sql` in the Supabase SQL Editor before creating a workspace or sending events.
