-- SQL Script to Remove "mindsdb" from mcp_tools table
-- This script will delete the mindsdb repository from your database
-- 
-- BEFORE RUNNING:
-- 1. Make sure you have a backup of your database
-- 2. Test this in a development environment first
-- 3. Run this in your Supabase SQL Editor

-- Step 1: View the record before deletion (optional - for verification)
SELECT id, repo_name, github_url, status, created_at 
FROM mcp_tools 
WHERE repo_name = 'mindsdb' 
LIMIT 1;

-- Step 2: Delete the mindsdb record
DELETE FROM mcp_tools 
WHERE repo_name = 'mindsdb';

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_count 
FROM mcp_tools 
WHERE repo_name = 'mindsdb';

-- Expected result: 0 rows (meaning the record has been deleted)
