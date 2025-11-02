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
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { fetchGitHub } from "@/utils/github";

export const SubmitToolDialog = () => {
  const [open, setOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        repo_name: repoData.name,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-elegant hover:shadow-glow transition-all h-10 w-auto">
          <Plus className="h-5 w-5" />
          Submit Tool
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit MCP Tool</DialogTitle>
            <DialogDescription>
              Share a new MCP tool with the community. Enter the GitHub repository URL below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="github-url">GitHub Repository URL</Label>
              <Input
                id="github-url"
                placeholder="https://github.com/username/repository"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Example: https://github.com/modelcontextprotocol/servers
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
