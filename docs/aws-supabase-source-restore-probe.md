# Source export restore probe

This workflow is the next staging-only gate after the source export verifier:

`.github/workflows/probe-supabase-source-restore.yml`

It consumes a verified `source-exports/<workflow-run-id>` archive from the
existing private, versioned, AES-256 S3 bucket and restores it into a temporary
database inside the already-isolated staging Supabase PostgreSQL container.
It checks that the archive can be read, that the restored database has a
public schema, and that the `auth.users` relation is present. It then drops the
temporary database and removes the temporary dump from the staging host.

The active staging database is not modified. The workflow does not connect to
Supabase Cloud, change production DNS or credentials, alter App Runner, delete
any S3 object, or delete the existing Supabase project.

## Required inputs

Run the workflow manually only after:

1. `export-supabase-source.yml` has completed successfully.
2. `verify-supabase-source-export.yml` has completed successfully for the same
   `source-exports/<workflow-run-id>` prefix.
3. The selected stack is the preserved isolated staging stack.

Use these values:

- `confirm`: `RESTORE_STAGING_SOURCE_PROBE`
- `object_prefix`: the verified `source-exports/<workflow-run-id>` prefix
- `stack_name`: the isolated staging CloudFormation stack, normally
  `trackmcp-supabase-staging-24`

The probe intentionally reports metadata only. It does not print source rows,
authentication values, secrets, or the archive contents. A successful probe
proves that the logical archive is readable by PostgreSQL and that the source
database contains the expected public/auth schema shape; it does not yet prove
that password hashes, OAuth configuration, RLS behavior, storage objects, or
application UAT are complete.

The follow-up restore/promotion step remains a separate reviewed gate. It must
not overwrite the active staging database until this probe and the source
archive evidence have passed.
