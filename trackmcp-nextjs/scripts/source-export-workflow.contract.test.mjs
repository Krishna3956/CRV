import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../../.github/workflows/verify-supabase-source-export.yml', import.meta.url),
  'utf8',
);

test('source export verifier is manually guarded and read-only', () => {
  assert.match(workflow, /VERIFY_SOURCE_BACKUP/);
  assert.match(workflow, /source-exports\/\[0-9\]\+/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /sha256sum "\$DUMP_FILE"/);
  assert.match(workflow, /pg_restore --list "\$DUMP_FILE"/);
  assert.doesNotMatch(workflow, /pg_restore\s+.*--dbname/);
  assert.doesNotMatch(workflow, /aws s3 rm|aws s3api delete-object|DROP DATABASE|TRUNCATE/);
});
