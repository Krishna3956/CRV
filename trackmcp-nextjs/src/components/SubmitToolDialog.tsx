'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { fetchGitHub } from "@/utils/github";

interface SubmitToolDialogProps {
  variant?: 'default' | 'enhanced' | 'mobile'
  onSuccess?: () => void
  buttonText?: string
}

export const SubmitToolDialog = ({ variant = 'default', onSuccess, buttonText = 'Submit Your MCP' }: SubmitToolDialogProps = {}) => {
  const [open, setOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wantsFeatured, setWantsFeatured] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // List of banned repositories
  const bannedRepos = [
    'https://github.com/punkpeye/awesome-mcp-servers',
    'https://github.com/habitoai/awesome-mcp-servers',
  ];

  const validateGithubUrl = (url: string) => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    
    // Check if URL is valid format
    if (!githubRegex.test(url)) {
      return false;
    }

    // Check if URL is banned
    const normalizedUrl = url.replace(/\/$/, '').toLowerCase();
    const isBanned = bannedRepos.some(banned => 
      normalizedUrl === banned.toLowerCase()
    );

    if (isBanned) {
      throw new Error('This repository has been banned from submission');
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!validateGithubUrl(githubUrl)) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid GitHub repository URL",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      toast({
        title: "Submission Blocked",
        description: error.message || "This repository cannot be submitted",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract owner and repo from URL
      const urlParts = githubUrl.replace(/\/$/, '').split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];

      // Fetch repository data from GitHub
      const response = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
      
      if (!response.ok) {
        throw new Error("Repository not found");
      }

      const repoData = await response.json();

      // Insert into database
      const { error } = await supabase.from("mcp_tools").insert({
        github_url: githubUrl,
        repo_name: repoData.name.toLowerCase(), // Normalize to lowercase for consistent URLs
        description: repoData.description || null,
        stars: repoData.stargazers_count || 0,
        language: repoData.language || null,
        topics: repoData.topics || [],
        last_updated: repoData.updated_at || new Date().toISOString(),
        status: "pending",
      } as any);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already exists",
            description: "This tool has already been submitted",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success!",
          description: "Your MCP tool has been submitted for review",
        });
        setGithubUrl("");
        setOpen(false);
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit tool",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Button styling based on variant
  const getButtonClasses = () => {
    switch (variant) {
      case 'enhanced':
        return "gap-2 h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-150 hover:brightness-110 focus:outline-2 focus:outline-offset-2 focus:outline-blue-400 rounded-lg"
      case 'mobile':
        return "gap-2 h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-150 hover:brightness-110 rounded-lg"
      default:
        return "gap-2 shadow-elegant hover:shadow-glow transition-all h-10 px-4 w-auto"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={getButtonClasses()}>
          <Plus className="h-5 w-5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="text-xl sm:text-2xl">Submit MCP Tool</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Share a new MCP tool with the community. Enter the GitHub repository URL below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-5 py-4 sm:py-6">
            <div className="grid gap-2 sm:gap-3">
              <Label htmlFor="github-url" className="text-xs sm:text-sm font-semibold">GitHub Repository URL</Label>
              <Input
                id="github-url"
                placeholder="https://github.com/username/repository"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                required
                className="h-10 sm:h-11 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: https://github.com/modelcontextprotocol/servers
              </p>
            </div>

            {/* Featured Listing Option */}
            <div className="relative overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-3 sm:p-5">
              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
              
              <div className="relative z-10 flex items-start gap-2 sm:gap-4">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={wantsFeatured}
                  onChange={(e) => setWantsFeatured(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-primary/30 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label htmlFor="featured-checkbox" className="cursor-pointer">
                    <div className="flex items-center gap-1 sm:gap-2 mb-2">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <h4 className="text-xs sm:text-sm font-bold gradient-text truncate">Get Featured — $29 One-Time Fee</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 sm:mb-3">
                      Boost your visibility and stand out instantly!
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary fill-primary flex-shrink-0" />
                        <p className="text-xs font-medium">Appear at the top of search results</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary fill-primary flex-shrink-0" />
                        <p className="text-xs font-medium">&quot;Featured&quot; badge on your MCP listing</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10 px-4 sm:px-6 w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-10 px-4 sm:px-6 w-full sm:w-auto text-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {wantsFeatured ? "Processing..." : "Submitting..."}
                </>
              ) : (
                wantsFeatured ? "Submit & Pay ($29)" : "Submit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
