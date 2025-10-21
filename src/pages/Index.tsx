import { useState, useEffect, useMemo } from "react";
import SEO from '@/components/SEO';
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { ToolCard } from "@/components/ToolCard";
import { SubmitToolDialog } from "@/components/SubmitToolDialog";
import { StatsSection } from "@/components/StatsSection";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Loader2, Sparkles, Package } from "lucide-react";

type McpTool = Database["public"]["Tables"]["mcp_tools"]["Row"];

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchTools();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const fetchTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let allData: McpTool[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      // Fetch all data in batches to bypass the 1000 row limit
      while (hasMore) {
        const { data, error } = await supabase
          .from("mcp_tools")
          .select("*")
          .in("status", ["approved", "pending"])
          .range(from, from + batchSize - 1);

        if (error) {
          console.error("Error fetching tools:", error);
          setError(`Failed to load tools: ${error.message}`);
          hasMore = false;
        } else {
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += batchSize;
            // If we got less than batchSize, we've reached the end
            if (data.length < batchSize) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
      }

      setTools(allData);
      console.log(`Fetched ${allData.length} total tools`);
    } catch (err) {
      console.error("Exception fetching tools:", err);
      setError(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  // List of blocked repos to hide from UI
  const blockedRepos = ['awesome-mcp-servers'];

  const filteredAndSortedTools = useMemo(() => {
    return tools
      .filter((tool) => {
        // Filter out blocked repos
        if (blockedRepos.includes(tool.repo_name?.toLowerCase() || '')) {
          return false;
        }

        const searchLower = searchQuery.toLowerCase();
        return (
          tool.repo_name?.toLowerCase().includes(searchLower) ||
          tool.description?.toLowerCase().includes(searchLower) ||
          tool.topics?.some((topic) => topic.toLowerCase().includes(searchLower))
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "stars":
            return (b.stars || 0) - (a.stars || 0);
          case "recent":
            return new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime();
          case "name":
            return (a.repo_name || "").localeCompare(b.repo_name || "");
          default:
            return 0;
        }
      });
  }, [tools, searchQuery, sortBy]);

  const totalStars = useMemo(() => {
    return filteredAndSortedTools.reduce((sum, tool) => sum + (tool.stars || 0), 0);
  }, [filteredAndSortedTools]);

  // Show visibleCount tools when no search query, show all when searching
  const displayedTools = searchQuery ? filteredAndSortedTools : filteredAndSortedTools.slice(0, visibleCount);
  
  const hasMoreToLoad = !searchQuery && visibleCount < filteredAndSortedTools.length;
  const remainingCount = filteredAndSortedTools.length - visibleCount;

  const loadMore = async () => {
    setIsLoadingMore(true);
    // Simulate a brief loading state for smooth UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setVisibleCount(prev => prev + 15); // Load 5 rows x 3 columns = 15 items
    setIsLoadingMore(false);
  };

  // Reset visible count when search query changes
  useEffect(() => {
    if (searchQuery) {
      setVisibleCount(15);
    }
  }, [searchQuery]);

  // Create ItemList schema for top tools
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Model Context Protocol Tools',
    'description': 'A comprehensive directory of MCP tools, servers, and connectors',
    'numberOfItems': filteredAndSortedTools.length,
    'itemListElement': filteredAndSortedTools.slice(0, 10).map((tool, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'SoftwareApplication',
        'name': tool.repo_name,
        'description': tool.description,
        'url': `https://trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`,
        'applicationCategory': 'DeveloperApplication',
      },
    })),
  };
  
  return (
    <>
      <SEO 
        title="Discover Model Context Protocol Tools"
        description="Explore and discover the best Model Context Protocol (MCP) tools, servers, and connectors. A modern, searchable directory for MCP developers."
        imageUrl="https://trackmcp.com/logo.png"
        canonicalUrl="https://trackmcp.com/"
        schema={itemListSchema}
      />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-60"
          style={{ background: "var(--gradient-mesh)" }}
        />
        
        {/* Gradient fade to background */}
        <div 
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="container relative mx-auto px-4 py-4 md:py-8">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Track MCP</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold gradient-text animate-fade-in leading-tight">
              World's Largest MCP Repository
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Discover, Track, and Explore Over 10,000+ Model Context Protocol Servers, Clients & Tools in One Centralized Platform
            </p>
            
            <div className="flex flex-col items-center gap-2 pt-6 animate-fade-in">
              <SearchBar
                value={inputValue}
                onChange={setInputValue}
                placeholder="Search by name, description, or tags..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {!isLoading && (
        <section className="container mx-auto px-4 mt-8 relative z-10">
          <StatsSection totalTools={filteredAndSortedTools.length} totalStars={totalStars} isSearching={!!searchQuery} />
          {/* Submit Tool button - visible on mobile only, centered below stats */}
          <div className="flex justify-center mt-6 sm:hidden">
            <SubmitToolDialog />
          </div>
        </section>
      )}

      {/* Directory Section */}
      <section className="container mx-auto px-4 py-6 pb-8">
        <div className="flex flex-col gap-4 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold gradient-text">Browse Repository</h2>
                {!isLoading && (
                  <p className="text-muted-foreground text-lg mt-1">
                    {searchQuery ? filteredAndSortedTools.length : filteredAndSortedTools.length + 10000} available
                  </p>
                )}
              </div>
              <div className="flex flex-row gap-2 w-auto">
                <FilterBar sortBy={sortBy} onSortChange={setSortBy} />
                {/* Submit Tool button - hidden on mobile, shown on desktop */}
                <div className="hidden sm:block">
                  <SubmitToolDialog />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 mb-8">
            <p className="text-destructive font-semibold">Error loading tools</p>
            <p className="text-destructive/80 text-sm mt-2">{error}</p>
            <button 
              onClick={fetchTools}
              className="mt-4 px-4 py-2 bg-destructive text-white rounded hover:bg-destructive/90 transition"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-lg">Warming up the MCP engines…</p>
          </div>
        ) : filteredAndSortedTools.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold">
              {searchQuery ? "No tools found" : "No tools yet"}
            </h3>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Be the first to submit an MCP tool to the directory!"}
            </p>
          </div>
        ) : (
          <>
            <div 
              id="rows-container" 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr"
              aria-live="polite"
            >
              {displayedTools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="animate-fade-in h-full"
                  style={{
                    animationDelay: index >= visibleCount - 15 ? `${(index % 15) * 30}ms` : '0ms'
                  }}
                >
                  <ToolCard
                    name={tool.repo_name || "Unknown"}
                    description={tool.description || ""}
                    stars={tool.stars || 0}
                    githubUrl={tool.github_url}
                    language={tool.language || undefined}
                    topics={tool.topics || undefined}
                    lastUpdated={tool.last_updated || undefined}
                  />
                </div>
              ))}
            </div>
            
            {/* Explore More Button */}
            {hasMoreToLoad && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  aria-busy={isLoadingMore}
                  aria-controls="rows-container"
                  className="group relative px-6 py-2.5 rounded-md font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 hover:from-primary/20 hover:via-accent/20 hover:to-primary/20"
                  style={{ color: 'transparent' }}
                >
                  <span className="gradient-text">
                    {isLoadingMore ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      "Explore more"
                    )}
                  </span>
                </button>
              </div>
            )}
            
            {!hasMoreToLoad && !searchQuery && filteredAndSortedTools.length > 15 && (
              <div className="flex justify-center mt-12">
                <div className="px-8 py-4 rounded-lg font-semibold text-base text-muted-foreground">
                  No more results
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* About Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Track MCP</h3>
                <p className="text-sm text-muted-foreground">
                  The world's largest directory of Model Context Protocol tools, servers, and connectors for AI development.
                </p>
              </div>
              
              {/* Resources */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="https://github.com/modelcontextprotocol" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      MCP Documentation
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/trackmcp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      GitHub Repository
                    </a>
                  </li>
                  <li>
                    <a href="https://trackmcp.com/sitemap.xml" className="text-muted-foreground hover:text-primary transition-colors">
                      Sitemap
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Popular Tools */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Popular Categories</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => setInputValue('filesystem')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                      Filesystem Tools
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setInputValue('database')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                      Database Connectors
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setInputValue('api')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                      API Integrations
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setInputValue('claude')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                      Claude MCP Tools
                    </button>
                  </li>
                </ul>
              </div>
              
              {/* Connect */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Connect</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="https://x.com/trackmcp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      Twitter / X
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/trackmcp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a href="https://www.linkedin.com/in/krishnaa-goyal/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Built with ❤️ by{" "}
                <a 
                  href="https://www.linkedin.com/in/krishnaa-goyal/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Krishna Goyal
                </a>
                {" "}for the MCP community • © 2025 Track MCP
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Index;
