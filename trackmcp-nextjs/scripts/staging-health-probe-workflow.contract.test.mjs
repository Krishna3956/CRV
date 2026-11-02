import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../../.github/workflows/inspect-aws-supabase-staging-health.yml', import.meta.url),
  'utf8',
);

test('staging health probe is guarded, read-only, and redacts the anonymous key', () => {
  assert.match(workflow, /INSPECT_STAGING_HEALTH/);
  assert.match(workflow, /trackmcp-supabase-staging-24/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /docker compose ps --all/);
  assert.match(workflow, /for service in db auth rest api-gw/);
  assert.match(workflow, /services=db,auth,rest,api-gw/);
  assert.doesNotMatch(workflow, /for service in db auth rest kong/);
  assert.match(workflow, /docker compose exec -T db pg_isready/);
  assert.match(workflow, /auth\/v1\/settings/);
  assert.match(workflow, /rest\/v1\//);
  assert.match(workflow, /STAGING_SUPABASE_HEALTH_PROBE_PASSED/);
  assert.doesNotMatch(workflow, /echo\s+"\$ANON_KEY"/);
  assert.doesNotMatch(workflow, /secretsmanager get-secret-value/);
  assert.doesNotMatch(workflow, /docker compose (up|down|restart|start|stop|rm|recreate)/);
  assert.doesNotMatch(workflow, /cloudformation delete-stack|aws s3 rm|delete-object/);
  assert.doesNotMatch(workflow, /DROP DATABASE|TRUNCATE|ALTER SYSTEM/);
  assert.doesNotMatch(workflow, /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY/);
});
