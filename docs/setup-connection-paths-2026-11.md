# Setup connection paths — implementation note

## Scope

The dashboard setup experience now presents two primary connection paths:

1. **SDK** — the recommended path for native TypeScript, Python, Go, and .NET instrumentation.
2. **OpenTelemetry** — for teams that already operate an OTLP/HTTP collector.

The path selector is intentionally compact and stays in one row. Selecting a path updates the setup panel below it and scrolls that panel into view.

## Product decisions

- The connection key is created in its own panel immediately after the selected connection path.
- SDK language choices remain inside the SDK path instead of competing with the top-level connection decision.
- OpenTelemetry shows the actual OTLP/HTTP endpoint, a copy action, the collector sequence, and the existing documentation link.
- Observed connection details, optional identity, privacy controls, and additional guides remain secondary sections below the primary setup flow.
- The dashboard uses the canonical green TrackMCP wordmark and mark used by the public site. Green remains a brand/status color; indigo remains the dashboard's primary action accent.
- The sidebar uses compact spacing for the four groups: Understand, Outcome, Investigate, and Configure.

## Backend boundary

This change is presentation-only. It does not change Supabase schema, telemetry contracts, key creation, OpenTelemetry ingestion, or privacy behavior. Existing API routes and SDK snippets remain the source of truth for the actual setup operations.

## Verification

- TypeScript: passed (`npx tsc --noEmit --pretty false`)
- Dashboard contract tests: passed (116/116)
- Production build: passed (230 pages)
- Focused ESLint: passed with the repository's existing unused-helper warnings and no errors

The isolated preview could not render the authenticated dashboard without runtime Supabase environment variables; no production credentials were copied into the checkout.
