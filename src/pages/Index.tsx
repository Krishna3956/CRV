import { useState, useEffect } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("stars");
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("mcp_tools")
      .select("*")
      .in("status", ["approved", "pending"]);

    if (error) {
      console.error("Error fetching tools:", error);
    } else {
      setTools(data || []);
    }
    setIsLoading(false);
  };

  // List of blocked repos to hide from UI
  const blockedRepos = ['awesome-mcp-servers'];

  const filteredAndSortedTools = tools
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

  const totalStars = tools.reduce((sum, tool) => sum + (tool.stars || 0), 0);

  // Show only 24 tools (8 rows x 3 columns) when no search query, show all when searching
  const displayedTools = searchQuery ? filteredAndSortedTools : filteredAndSortedTools.slice(0, 24);

  return (
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
            Discover, Track, and Explore Over 10,000+ Model Context Protocol Tools and Servers in One Centralized Platform
            </p>
            
            <div className="flex flex-col items-center gap-2 pt-6 animate-fade-in">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, description, or tags..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {!isLoading && (
        <section className="container mx-auto px-4 mt-8 relative z-10">
          <StatsSection totalTools={filteredAndSortedTools.length} totalStars={totalStars} />
        </section>
      )}

      {/* Directory Section */}
      <section className="container mx-auto px-4 py-6 pb-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-3 gradient-text">Explore Tools</h2>
            {!isLoading && (
              <p className="text-muted-foreground text-lg">
                {filteredAndSortedTools.length + 10000} {filteredAndSortedTools.length === 1 ? 'tool & server' : 'tools & servers'} available
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <FilterBar sortBy={sortBy} onSortChange={setSortBy} />
            <SubmitToolDialog />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-lg">Loading amazing tools...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedTools.map((tool) => (
              <ToolCard
                key={tool.id}
                name={tool.repo_name || "Unknown"}
                description={tool.description || ""}
                stars={tool.stars || 0}
                githubUrl={tool.github_url}
                language={tool.language || undefined}
                topics={tool.topics || undefined}
                lastUpdated={tool.last_updated || undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <p className="text-muted-foreground">
              Built with ❤️ by{" "}
              <a 
                href="https://www.linkedin.com/in/krishnaa-goyal/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Krishna Goyal
              </a>
              {" "}for the community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
