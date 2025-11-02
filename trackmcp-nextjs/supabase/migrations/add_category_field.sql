-- Add category column to mcp_tools table
ALTER TABLE mcp_tools 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Others';

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_mcp_tools_category ON mcp_tools(category);

-- Add comment to explain the column
COMMENT ON COLUMN mcp_tools.category IS 'Category for organizing MCP tools: Featured, AI & Machine Learning, Developer Kits, Servers & Infrastructure, Search & Data Retrieval, Automation & Productivity, Web & Internet Tools, Communication, File & Data Management, Others';
