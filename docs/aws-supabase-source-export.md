# Supabase Cloud source export

The source project is preserved as the rollback/source-of-truth system. The
manual workflow [`.github/workflows/export-supabase-source.yml`](../.github/workflows/export-supabase-source.yml)
provides the next safe migration step once source database connectivity is
available.

## How it works

1. Add the source PostgreSQL connection string as the GitHub Actions repository
   secret `SUPABASE_SOURCE_DB_URL`. Do not paste it into an issue, pull request,
   chat, or workflow input.
2. Run **Export Supabase Cloud source backup** manually and enter the exact
   confirmation string `EXPORT_SOURCE_BACKUP`.
3. The workflow uses the existing GitHub OIDC role, requires TLS, verifies
   connectivity with `pg_isready`, and runs a read-only `pg_dump`.
4. It uploads a PostgreSQL custom-format archive and a checksum manifest to the
   existing private, versioned, AES-256-encrypted S3 bucket under a unique run
   prefix.

The workflow has no Supabase write operation, no production mutation, no DNS
change, and no cleanup/delete operation. It never prints the connection string,
database rows, or dump contents. The archive must still be inspected and
restored into isolated staging before any production cutover decision.

## Required secret

`SUPABASE_SOURCE_DB_URL` must be a PostgreSQL connection string that can read
the source project, with the password supplied through the repository's secret
store. Prefer the direct database connection documented by Supabase and keep
TLS enabled. If the source project remains quota-restricted, the workflow will
fail at `pg_isready` or `pg_dump`; it cannot bypass provider-side restrictions.

## Restore gate

An uploaded dump is evidence of an export, not evidence of a safe migration.
The next steps are to verify its checksum, restore it into the isolated AWS
staging instance, compare application/auth row counts and ownership mappings,
and execute the authentication/RLS/application smoke suite. Supabase Cloud
must remain available until those checks and an explicit cutover approval are
complete.
