-- SQL Script to Remove "awesome-mcp-servers" from mcp_tools table
-- This script will delete the awesome-mcp-servers repository from your database
-- 
-- BEFORE RUNNING:
-- 1. Make sure you have a backup of your database
-- 2. Test this in a development environment first
-- 3. Run this in your Supabase SQL Editor

-- Step 1: View the record before deletion (optional - for verification)
SELECT id, repo_name, github_url, status, created_at 
FROM mcp_tools 
WHERE repo_name = 'awesome-mcp-servers' 
LIMIT 1;

-- Step 2: Delete the awesome-mcp-servers record
DELETE FROM mcp_tools 
WHERE repo_name = 'awesome-mcp-servers';

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_count 
FROM mcp_tools 
WHERE repo_name = 'awesome-mcp-servers';

-- Expected result: 0 rows (meaning the record has been deleted)
