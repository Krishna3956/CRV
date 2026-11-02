import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const exportWorkflow = await readFile(
  new URL('../../.github/workflows/export-supabase-source.yml', import.meta.url),
  'utf8',
);
const verifierWorkflow = await readFile(
  new URL('../../.github/workflows/verify-supabase-source-export.yml', import.meta.url),
  'utf8',
);

test('source export uses the official filtered Supabase dump procedure', () => {
  assert.match(exportWorkflow, /EXPORT_SOURCE_BACKUP/);
  assert.match(exportWorkflow, /SUPABASE_CLI_VERSION: 2\.122\.0/);
  assert.match(exportWorkflow, /supabase@\$\{SUPABASE_CLI_VERSION\}/);
  assert.match(exportWorkflow, /db dump/);
  assert.match(exportWorkflow, /--role-only/);
  assert.match(exportWorkflow, /--use-copy/);
  assert.match(exportWorkflow, /--data-only/);
  assert.match(exportWorkflow, /roles\.sql/);
  assert.match(exportWorkflow, /schema\.sql/);
  assert.match(exportWorkflow, /data\.sql/);
  assert.match(exportWorkflow, /trackmcp-supabase-source\.tar\.gz/);
  assert.doesNotMatch(exportWorkflow, /pg_dump\s+\\/);
  assert.doesNotMatch(exportWorkflow, /aws s3 rm|aws s3api delete-object|DROP DATABASE|TRUNCATE/);
});

test('source export verifier validates the filtered SQL tarball without restoring', () => {
  assert.match(verifierWorkflow, /VERIFY_SOURCE_BACKUP/);
  assert.match(verifierWorkflow, /source-exports\/\[0-9\]\+/);
  assert.match(verifierWorkflow, /id-token: write/);
  assert.match(verifierWorkflow, /contents: read/);
  assert.match(verifierWorkflow, /export_type=supabase-filtered-sql-dump/);
  assert.match(verifierWorkflow, /tar -tzf "\$ARCHIVE_FILE"/);
  assert.match(verifierWorkflow, /COPY.*auth.*users/);
  assert.doesNotMatch(verifierWorkflow, /pg_restore/);
  assert.doesNotMatch(verifierWorkflow, /aws s3 rm|aws s3api delete-object|DROP DATABASE|TRUNCATE/);
});
