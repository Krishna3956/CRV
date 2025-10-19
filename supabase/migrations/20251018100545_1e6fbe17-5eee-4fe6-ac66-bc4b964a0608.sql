-- Create MCP tools table to store submitted tools
CREATE TABLE public.mcp_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  github_url TEXT NOT NULL UNIQUE,
  repo_name TEXT,
  description TEXT,
  stars INTEGER DEFAULT 0,
  language TEXT,
  topics TEXT[],
  last_updated TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mcp_tools ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can view approved tools)
CREATE POLICY "Anyone can view approved MCP tools"
ON public.mcp_tools
FOR SELECT
USING (status = 'approved' OR status = 'pending');

-- Create policy for public insert (anyone can submit new tools)
CREATE POLICY "Anyone can submit new MCP tools"
ON public.mcp_tools
FOR INSERT
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mcp_tools_updated_at
BEFORE UPDATE ON public.mcp_tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better search performance
CREATE INDEX idx_mcp_tools_repo_name ON public.mcp_tools(repo_name);
CREATE INDEX idx_mcp_tools_status ON public.mcp_tools(status);
CREATE INDEX idx_mcp_tools_stars ON public.mcp_tools(stars DESC);
CREATE INDEX idx_mcp_tools_topics ON public.mcp_tools USING GIN(topics);