# Isolated staging Supabase health probe

The manual workflow
`.github/workflows/inspect-aws-supabase-staging-health.yml` checks the actual
Supabase services on the preserved staging EC2 host after provisioning or
schema replay. It uses SSM and a bounded script that:

- verifies the `db`, `auth`, `rest`, and `kong` containers are running;
- rejects an unhealthy or exited container;
- runs `pg_isready` inside the database container;
- checks the Auth settings endpoint with the generated anonymous key;
- checks the REST gateway response without printing its body or the key.

The key is read only inside the remote command to authenticate the probe and is
never emitted. No container is started, stopped, recreated, or reconfigured.
The workflow does not read AWS secret values, access Supabase Cloud, change
production DNS or credentials, or modify the active staging database.

## Inputs

- `confirm`: `INSPECT_STAGING_HEALTH`
- `stack_name`: normally `trackmcp-supabase-staging-24`

A successful probe proves current container and basic gateway health only. It
does not prove source-data compatibility, OAuth, password-hash continuity, RLS
behavior, Storage, or application UAT.
