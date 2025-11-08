# Supabase Migration - Add Email Field to MCP Tools

**Status**: ✅ READY TO EXECUTE  
**Date**: 2025-11-08  
**Purpose**: Add email and featured flag columns to mcp_tools table

---

## Overview

The submit tool dialog now captures:
- **submitter_email** (mandatory) - Contact email for tool submissions
- **wants_featured** (optional) - Whether user wants featured listing

These need to be added to your Supabase `mcp_tools` table.

---

## Migration Steps

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com
2. Log in to your account
3. Select your project
4. Go to **SQL Editor** (left sidebar)

### Step 2: Add Email Column

Run this SQL query:

```sql
ALTER TABLE mcp_tools
ADD COLUMN submitter_email VARCHAR(255) NOT NULL DEFAULT '';
```

**What this does**:
- Adds `submitter_email` column
- Type: VARCHAR(255) - stores email addresses
- NOT NULL - email is required
- DEFAULT '' - existing rows get empty string

### Step 3: Add Featured Flag Column

Run this SQL query:

```sql
ALTER TABLE mcp_tools
ADD COLUMN wants_featured BOOLEAN DEFAULT false;
```

**What this does**:
- Adds `wants_featured` column
- Type: BOOLEAN - true/false
- DEFAULT false - existing rows default to not featured

### Step 4: Verify Columns Added

Run this query to verify:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'mcp_tools'
ORDER BY ordinal_position;
```

**Expected output** (should include):
```
submitter_email | character varying | NO
wants_featured  | boolean           | YES
```

---

## Alternative: Using Supabase UI

If you prefer not to use SQL:

### Add submitter_email Column
1. Go to **Table Editor**
2. Select **mcp_tools** table
3. Click **+ Add Column**
4. Name: `submitter_email`
5. Type: `text`
6. Required: ✅ Check
7. Click **Save**

### Add wants_featured Column
1. Click **+ Add Column**
2. Name: `wants_featured`
3. Type: `boolean`
4. Default value: `false`
5. Click **Save**

---

## Verification

### Test the Form

After migration:

1. Go to your site
2. Click "Submit Your MCP"
3. Fill in:
   - GitHub URL: `https://github.com/username/repo`
   - Email: `your@email.com`
   - Check "Get Featured" (optional)
4. Click Submit
5. Check Supabase to verify data saved

### Check Data in Supabase

1. Go to **Table Editor**
2. Select **mcp_tools**
3. Look for your test submission
4. Verify columns show:
   - `submitter_email`: your@email.com
   - `wants_featured`: true/false

---

## Rollback (If Needed)

If you need to remove the columns:

```sql
ALTER TABLE mcp_tools
DROP COLUMN submitter_email;

ALTER TABLE mcp_tools
DROP COLUMN wants_featured;
```

---

## Data Validation

### Email Validation (Frontend)
- ✅ Required field
- ✅ Must be valid email format
- ✅ Validated before submission

### Email Validation (Backend)
You can add backend validation in your API route:

```typescript
// src/app/api/submit-tool/route.ts
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(submitterEmail)) {
  return Response.json(
    { error: 'Invalid email address' },
    { status: 400 }
  );
}
```

---

## Next Steps

### After Migration

1. ✅ Run SQL migration
2. ✅ Test form submission
3. ✅ Verify data in Supabase
4. ✅ Deploy to production

### Optional Enhancements

1. **Email Notifications**: Send confirmation email to submitter
2. **Admin Dashboard**: View all submissions with emails
3. **Email Validation**: Verify email before accepting submission
4. **Spam Protection**: Add rate limiting by email

---

## Troubleshooting

### Issue: Column Already Exists
**Solution**: Drop and recreate
```sql
ALTER TABLE mcp_tools DROP COLUMN submitter_email;
ALTER TABLE mcp_tools ADD COLUMN submitter_email VARCHAR(255) NOT NULL DEFAULT '';
```

### Issue: Permission Denied
**Solution**: Ensure you're using service role key or have proper permissions

### Issue: Data Type Mismatch
**Solution**: Check column type matches (VARCHAR for email, BOOLEAN for flag)

---

## Summary

| Column | Type | Required | Default | Purpose |
|--------|------|----------|---------|---------|
| submitter_email | VARCHAR(255) | Yes | '' | Contact email |
| wants_featured | BOOLEAN | No | false | Featured listing flag |

---

**Status**: ✅ READY FOR MIGRATION

**Estimated Time**: 2-5 minutes

**Last Updated**: 2025-11-08
