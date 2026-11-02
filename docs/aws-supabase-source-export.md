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
   connectivity with `pg_isready`, and runs the pinned Supabase CLI's filtered
   `supabase db dump` three times to produce `roles.sql`, `schema.sql`, and
   `data.sql`. This follows Supabase's platform-to-self-hosted restore procedure
   and avoids copying managed Supabase internal schemas.
4. It packages those three SQL files into a tarball and uploads it with a
   checksum manifest to the existing private, versioned, AES-256-encrypted S3
   bucket under a unique run prefix.

The workflow has no Supabase write operation, no production mutation, no DNS
change, and no cleanup/delete operation. It never prints the connection string,
database rows, SQL contents, or secret values. The filtered SQL archive must
still be inspected and restored into isolated staging before any production
cutover decision.

## Artifact verification

After the export succeeds, run **Verify Supabase Cloud source export** with the
exact confirmation string `VERIFY_SOURCE_BACKUP` and the export prefix shown by
the export workflow, such as `source-exports/1234567890`. The verifier checks
the manifest redaction marker, tarball byte count, per-file checksums, S3
encryption metadata, and the presence of all three filtered SQL files. It prints
only aggregate file metadata; it does not connect to Supabase Cloud, restore the
dump, read rows, or delete or overwrite an S3 object.

## Required secret

`SUPABASE_SOURCE_DB_URL` must be a PostgreSQL connection string that can read
the source project, with the password supplied through the repository's secret
store. Use a supported direct or session-pooler connection string documented by
Supabase and keep TLS enabled. If the source project remains quota-restricted,
the workflow will fail at `pg_isready` or `supabase db dump`; it cannot bypass
provider-side restrictions.

## Restore gate

An uploaded dump is evidence of an export, not evidence of a safe migration.
The next steps are to verify its checksum, restore it into the isolated AWS
staging instance, compare application/auth row counts and ownership mappings,
and execute the authentication/RLS/application smoke suite. Supabase Cloud
must remain available until those checks and an explicit cutover approval are
complete.
