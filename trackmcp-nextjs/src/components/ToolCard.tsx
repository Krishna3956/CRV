"use client"

import { useState, useMemo } from "react";
import Link from "next/link";
import { Star, GitBranch, Calendar, ChevronDown, ChevronUp, TrendingUp, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format, formatDistanceToNow } from "date-fns";

interface ToolCardProps {
  name: string;
  description: string;
  stars: number;
  githubUrl: string;
  language?: string;
  topics?: string[];
  lastUpdated?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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

export const ToolCard = ({
  name,
  description,
  stars,
  githubUrl,
  language,
  topics,
  lastUpdated,
  isExpanded: isExpandedProp = true,
  onToggleExpand,
  isTrending = false,
}: ToolCardProps) => {
  const isExpanded = isExpandedProp;
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
  
  // Calculate alternative metrics
  const estimatedDownloads = Math.floor(stars * 15); // Rough estimate
  const recentActivity = lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : null;

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

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
                <AvatarImage src={ownerAvatar} alt={ownerName} loading="lazy" />
                <AvatarFallback className="text-[10px]">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold group-hover:gradient-text transition-all duration-300 truncate" style={{ fontSize: '18px', lineHeight: '1.3' }}>
                {name}
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
              className={`text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'} text-base`}
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
          
          {/* Alternative metric for low-starred items */}
          {stars < 50 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-sm font-medium" style={{ fontSize: '13px' }}>{estimatedDownloads.toLocaleString()} views</span>
            </div>
          )}
          
          {language && (
            <Badge 
              variant="secondary"
              className="h-6 px-2.5 py-0 text-xs font-medium"
              style={{ lineHeight: '1.2' }}
            >
              {language}
            </Badge>
          )}
          
          {lastUpdated && !isExpanded && (
            <div className="flex items-center gap-1 text-muted-foreground ml-auto">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-sm" style={{ fontSize: '13px' }} suppressHydrationWarning>{recentActivity}</span>
            </div>
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
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-2.5 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
            {lastUpdated && (
              <div className="flex items-center justify-between text-sm text-muted-foreground" style={{ fontSize: '13px' }}>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Last updated
                </span>
                <span className="font-medium">{format(new Date(lastUpdated), "MMM d, yyyy")}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                Repository
              </span>
              <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-primary hover:underline"
              >
                View on GitHub →
              </a>
            </div>
            
            {estimatedDownloads > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground" style={{ fontSize: '13px' }}>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  Estimated views
                </span>
                <span className="font-medium">{estimatedDownloads.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-sm text-muted-foreground hover:text-primary transition-colors mt-auto"
          onClick={handleExpandClick}
        >
          {isExpanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              Show more <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
    </Link>
  );
};
