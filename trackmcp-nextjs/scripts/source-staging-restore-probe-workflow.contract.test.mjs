import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../../.github/workflows/probe-supabase-source-restore.yml', import.meta.url),
  'utf8',
);

test('source restore probe is manually guarded and isolated', () => {
  assert.match(workflow, /RESTORE_STAGING_SOURCE_PROBE/);
  assert.match(workflow, /source-exports\/\[0-9\]\+/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /ServerSideEncryption/);
  assert.match(workflow, /pg_restore --list/);
  assert.match(workflow, /docker compose exec -T db pg_restore/);
  assert.match(workflow, /CREATE DATABASE \$\{RESTORE_DATABASE\}/);
  assert.match(workflow, /DROP DATABASE(?: IF EXISTS)? \$\{RESTORE_DATABASE\}/);
  assert.match(workflow, /STAGING_SOURCE_RESTORE_PROBE_PASSED/);
  assert.match(workflow, /STAGING_SOURCE_RESTORE_PROBE_CLEANED/);
  assert.doesNotMatch(workflow, /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(workflow, /cloudformation delete-stack|aws s3 rm|delete-object/);
  assert.doesNotMatch(workflow, /DROP DATABASE postgres|DROP DATABASE supabase/);
  assert.doesNotMatch(workflow, /TRUNCATE|ALTER SYSTEM/);
});
