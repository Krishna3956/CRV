# @trackmcp/cli

The safe onboarding companion to `@trackmcp/sdk`:

```bash
npx @trackmcp/cli setup
```

It opens the TrackMCP dashboard, lets the server owner create a workspace API key, and writes the pasted one-time secret to `.env.local`. Package installation itself never sends email or creates cloud resources. The CLI does not need to know, store, or display your Supabase service-role key.
