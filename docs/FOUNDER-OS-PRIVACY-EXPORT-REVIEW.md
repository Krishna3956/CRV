# Disposable privacy-export review

## Purpose

This review exercises the account-export projection with a synthetic disposable
workspace fixture. It is a local engineering check; it does not read or write
production data and it is not a substitute for a live customer export.

## Evidence

`src/lib/account/privacy-export.test.ts` constructs synthetic event, fact,
action, catalog, catalog-entity, and activation rows containing secret-like
markers in payload, token, API-key, identity, correlation, URI, and raw-body
fields. The test serializes every projected row and asserts that the marker and
forbidden correlation fields are absent.

The projection also allowlists derived semantic facts, action evidence, catalog
diff fields, and numeric measures. It does not pass arbitrary JSON objects
through to the export response.

Run locally with:

```bash
node --experimental-strip-types --test src/lib/account/privacy-export.test.ts
```

Expected result: 6 tests pass. The review proves projection behavior only; the
route's workspace authorization and production RLS remain separate deployment
and operator checks.
