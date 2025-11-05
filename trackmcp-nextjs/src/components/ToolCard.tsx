"use client"

import { useMemo } from "react";
import Link from "next/link";
import { Star, TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ToolCardProps {
  name: string;
  description: string;
  stars: number;
  githubUrl: string;
  language?: string;
  topics?: string[];
  lastUpdated?: string;
  isTrending?: boolean;
}

// Language color mapping
const LANGUAGE_COLORS: { [key: string]: string } = {
  'TypeScript': 'bg-blue-500',
  'JavaScript': 'bg-yellow-500',
  'Python': 'bg-green-600',
  'Go': 'bg-cyan-500',
  'Rust': 'bg-orange-600',
  'Java': 'bg-red-600',
  'C#': 'bg-purple-600',
  'Ruby': 'bg-red-500',
  'PHP': 'bg-indigo-500',
  'Swift': 'bg-orange-500',
};

// Categorize topics into primary and secondary
const categorizeTopic = (topic: string): 'primary' | 'secondary' => {
  const primaryKeywords = ['mcp', 'ai', 'llm', 'claude', 'gpt', 'agent', 'server', 'client'];
  return primaryKeywords.some(keyword => topic.toLowerCase().includes(keyword)) ? 'primary' : 'secondary';
};

// Helper: Format tool name for display (Title Case with spaces)
function formatToolName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const ToolCard = ({
  name,
  description,
  stars,
  githubUrl,
  language,
  topics,
  lastUpdated,
  isTrending = false,
}: ToolCardProps) => {
  const toolUrl = `/tool/${encodeURIComponent(name)}`;
  
  // Extract owner name and avatar URL immediately from GitHub URL (no async needed)
  const { ownerName, ownerAvatar } = useMemo(() => {
    try {
      const urlParts = githubUrl.replace(/\/$/, '').split('/');
      const owner = urlParts[urlParts.length - 2] || '';
      // GitHub avatar URL is predictable: https://github.com/{username}.png
      const avatar = owner ? `https://github.com/${owner}.png?size=40` : '';
      return { ownerName: owner, ownerAvatar: avatar };
    } catch {
      return { ownerName: '', ownerAvatar: '' };
    }
  }, [githubUrl]);

  // Categorize and limit topics
  const { primaryTopics, secondaryTopics, hasMoreTopics } = useMemo(() => {
    if (!topics || topics.length === 0) return { primaryTopics: [], secondaryTopics: [], hasMoreTopics: false };
    
    const primary = topics.filter(t => categorizeTopic(t) === 'primary').slice(0, 2);
    const secondary = topics.filter(t => categorizeTopic(t) === 'secondary').slice(0, 2);
    const displayedCount = primary.length + secondary.length;
    
    return {
      primaryTopics: primary,
      secondaryTopics: secondary,
      hasMoreTopics: topics.length > displayedCount
    };
  }, [topics]);
  

  return (
    <Link href={toolUrl} className="block h-full">
      <Card 
        className="group relative overflow-hidden card-gradient hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border hover:border-primary/30 cursor-pointer h-full flex flex-col"
      >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
           style={{ background: 'radial-gradient(circle at top right, hsl(243 75% 59% / 0.05), transparent 70%)' }} />
      
      <CardHeader className="relative p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Avatar className="h-4 w-4 flex-shrink-0">
                <AvatarImage src={ownerAvatar} alt={ownerName} />
                <AvatarFallback className="text-[10px]">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold group-hover:gradient-text transition-all duration-300 truncate" style={{ fontSize: '18px', lineHeight: '1.3' }}>
                {formatToolName(name)}
              </CardTitle>
              
              {/* Status badges */}
              {isTrending && (
                <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px] border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  Trending
                </Badge>
              )}
            </div>
            
            <CardDescription 
              className="text-muted-foreground text-base line-clamp-2"
              style={{ fontSize: '15px', lineHeight: '1.5' }}
            >
              {description || "No description available"}
            </CardDescription>
          </div>
          
          <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary transition-all">
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
        {/* Metrics row */}
        <div className="flex items-center gap-5 text-base flex-wrap">
          <div className="flex items-center gap-1 group/stars">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold text-foreground" style={{ fontSize: '15px' }}>{stars.toLocaleString()}</span>
          </div>
          
          {language && (
            <Badge 
              variant="secondary"
              className="h-6 px-2.5 py-0 text-xs font-medium"
              style={{ lineHeight: '1.2' }}
            >
              {language}
            </Badge>
          )}
        </div>
        
        {/* Tags - Limited to 1 row */}
        {(primaryTopics.length > 0 || secondaryTopics.length > 0) && (
          <div className="flex gap-2.5 overflow-hidden" style={{ maxHeight: '28px' }}>
            {/* Primary topics - more prominent */}
            {primaryTopics.map((topic) => (
              <Badge 
                key={topic} 
                variant="default"
                className="h-6 px-2.5 py-0 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                style={{ lineHeight: '1.2' }}
              >
                {topic}
              </Badge>
            ))}
            
            {/* Secondary topics - muted */}
            {secondaryTopics.map((topic) => (
              <Badge 
                key={topic} 
                variant="secondary"
                className="h-6 px-2.5 py-0 text-xs font-medium text-foreground/80 hover:text-foreground transition-colors flex-shrink-0"
                style={{ lineHeight: '1.2' }}
              >
                {topic}
              </Badge>
            ))}
            
            {hasMoreTopics && (
              <Badge 
                variant="outline" 
                className="h-6 px-2.5 py-0 text-xs text-foreground/90 flex-shrink-0"
                style={{ lineHeight: '1.2' }}
              >
                +{topics!.length - (primaryTopics.length + secondaryTopics.length)}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
};
