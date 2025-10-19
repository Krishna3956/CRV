-- Fix RLS policy to properly enforce UNIQUE constraint on github_url
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can submit new MCP tools" ON public.mcp_tools;

-- Create a more restrictive policy that checks for duplicates
CREATE POLICY "Anyone can submit new MCP tools"
ON public.mcp_tools
FOR INSERT
WITH CHECK (
  -- Ensure the github_url doesn't already exist
  NOT EXISTS (
    SELECT 1 FROM public.mcp_tools 
    WHERE github_url = NEW.github_url
  )
);
