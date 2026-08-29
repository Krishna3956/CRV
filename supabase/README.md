# TrackMCP telemetry schema

Run the migration in the Supabase SQL Editor before using the account, ingest, or analytics APIs:

`migrations/20260829000000_trackmcp_telemetry.sql`

The ingest and analytics Route Handlers use `SUPABASE_SERVICE_ROLE_KEY`; keep it server-only. The dashboard signs users in with Supabase email magic links, creates their first workspace, and generates API keys at `/dashboard`. Configure Supabase Auth redirect URLs for local and production, including `/auth/callback`.

The admin endpoint remains available for internal provisioning. Set `TRACKMCP_ADMIN_KEY` and call:

```bash
curl -X POST http://localhost:3000/api/v1/admin/workspaces \
  -H "x-trackmcp-admin-key: $TRACKMCP_ADMIN_KEY" \
  -H "content-type: application/json" \
  -d '{"name":"Acme","slug":"acme"}'
```

The response contains the workspace API key once. Store it as `TRACKMCP_KEY` for the SDK and use it to open `/dashboard` during the beta.
