# Source export restore probe

This workflow is the next staging-only gate after the source export verifier:

`.github/workflows/probe-supabase-source-restore.yml`

It consumes a verified `source-exports/<workflow-run-id>` tarball containing
Supabase's filtered `roles.sql`, `schema.sql`, and `data.sql` files from the
existing private, versioned, AES-256 S3 bucket. It restores `schema.sql` and
`data.sql` into a temporary database inside the already-isolated staging
Supabase PostgreSQL container, then checks that the restored database has a
public schema, the `auth.users` relation, and Auth rows. It then drops the
temporary database and removes the temporary files from the staging host.

The probe validates the database-scoped schema/data path without applying
`roles.sql` to the shared staging cluster: database roles are cluster-scoped,
so applying them there would mutate the active staging environment. The final
restore into a fresh destination must apply `roles.sql` first, followed by the
schema and data files, using Supabase's documented restore procedure.

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
proves that the filtered SQL export is readable by PostgreSQL and that the
source database contains the expected public/auth schema and data shape; it
does not yet prove that password hashes, OAuth configuration, RLS behavior,
cluster roles, storage objects, or application UAT are complete.

The follow-up restore/promotion step remains a separate reviewed gate. It must
not overwrite the active staging database until this probe and the source
archive evidence have passed.
