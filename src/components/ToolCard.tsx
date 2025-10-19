import { ExternalLink, Star, GitBranch, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchGitHub } from "@/utils/github";

interface ToolCardProps {
  name: string;
  description: string;
  stars: number;
  githubUrl: string;
  language?: string;
  topics?: string[];
  lastUpdated?: string;
}

export const ToolCard = ({
  name,
  description,
  stars,
  githubUrl,
  language,
  topics,
  lastUpdated,
}: ToolCardProps) => {
  const navigate = useNavigate();
  const [ownerAvatar, setOwnerAvatar] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");

  useEffect(() => {
    const fetchOwnerInfo = async () => {
      try {
        const urlParts = githubUrl.replace(/\/$/, '').split('/');
        const owner = urlParts[urlParts.length - 2];
        setOwnerName(owner);
        
        const response = await fetchGitHub(`https://api.github.com/users/${owner}`);
        if (response.ok) {
          const data = await response.json();
          setOwnerAvatar(data.avatar_url);
        }
      } catch (error) {
        console.error("Failed to fetch owner info:", error);
      }
    };

    if (githubUrl) {
      fetchOwnerInfo();
    }
  }, [githubUrl]);

  return (
    <Card 
      className="group relative overflow-hidden card-gradient hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 border-2 hover:border-primary/20 cursor-pointer"
      onClick={() => navigate(`/${name}`)}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
           style={{ background: 'radial-gradient(circle at top right, hsl(243 75% 59% / 0.05), transparent 70%)' }} />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={ownerAvatar} alt={ownerName} />
                <AvatarFallback className="text-xs">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl group-hover:gradient-text transition-all duration-300">
                {name}
              </CardTitle>
            </div>
            <CardDescription className="line-clamp-1 text-base leading-relaxed">
              {description || "No description available"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${name}`);
            }}
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 group/stars">
            <Star className="h-4 w-4 fill-accent text-accent group-hover/stars:scale-125 transition-transform" />
            <span className="font-semibold text-foreground">{stars.toLocaleString()}</span>
          </div>
          
          {language && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              <span className="font-medium">{language}</span>
            </div>
          )}
          
          {lastUpdated && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{format(new Date(lastUpdated), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
        
        {topics && topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topics.slice(0, 3).map((topic) => (
              <Badge 
                key={topic} 
                variant="secondary" 
                className="text-xs px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
              >
                {topic}
              </Badge>
            ))}
            {topics.length > 3 && (
              <Badge variant="outline" className="text-xs px-3 py-1">
                +{topics.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
