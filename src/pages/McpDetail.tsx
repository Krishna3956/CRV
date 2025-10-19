import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Loader2, Star, GitBranch, Calendar, ExternalLink, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fetchGitHub } from "@/utils/github";

type McpTool = Database["public"]["Tables"]["mcp_tools"]["Row"];

const CodeBlock = ({ code, language }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-slate-950 rounded-lg overflow-hidden my-4 border border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-100 transition-colors px-2 py-1 rounded hover:bg-slate-800"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-slate-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderInlineMarkdown = (text: string) => {
  // First handle image links [![alt](image)](url)
  const imageLinkRegex = /!\[([^\]]*)\]\(([^)]+)\)\[([^\]]*)\]\(([^)]+)\)/g;
  let processedText = text;
  const imageLinkMatches: Array<{alt: string; img: string; text: string; url: string; index: number}> = [];
  
  let match;
  while ((match = imageLinkRegex.exec(text)) !== null) {
    imageLinkMatches.push({
      alt: match[1],
      img: match[2],
      text: match[3],
      url: match[4],
      index: match.index
    });
  }
  
  // Handle regular links [text](url)
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let linkMatch;
  
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    // Skip if this is part of an image link
    const isImageLink = imageLinkMatches.some(im => 
      linkMatch.index >= im.index && linkMatch.index < im.index + im.text.length
    );
    
    if (isImageLink) continue;
    
    // Add text before the link
    if (linkMatch.index > lastIndex) {
      parts.push(text.substring(lastIndex, linkMatch.index));
    }
    
    // Add the link only if it has text
    const linkText = linkMatch[1];
    const linkUrl = linkMatch[2];
    
    if (linkText.trim()) {
      // Check if this looks like a button/CTA
      const isButton = linkText.toLowerCase().includes('click') || 
                      linkText.toLowerCase().includes('install') ||
                      linkText.toLowerCase().includes('button') ||
                      linkText.toLowerCase().includes('try');
      
      if (isButton) {
        parts.push(
          <a 
            key={`link-${linkMatch.index}`}
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
          >
            {linkText}
          </a>
        );
      } else {
        parts.push(
          <a 
            key={`link-${linkMatch.index}`}
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {linkText}
          </a>
        );
      }
    }
    // Skip empty links - don't add them to parts
    
    lastIndex = linkRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no links found, use original text
  if (parts.length === 0) {
    parts.push(text);
  }
  
  // Now handle bold **text** on the remaining parts
  const finalParts: (string | JSX.Element)[] = [];
  
  parts.forEach((part, idx) => {
    if (typeof part === 'string') {
      // Handle bold text with regex - match **text** pattern
      const boldRegex = /\*\*([^*]+?)\*\*/g;
      let lastBoldIndex = 0;
      let boldMatch;
      const boldMatches: Array<{text: string; index: number; length: number}> = [];
      
      while ((boldMatch = boldRegex.exec(part)) !== null) {
        boldMatches.push({
          text: boldMatch[1],
          index: boldMatch.index,
          length: boldMatch[0].length
        });
      }
      
      if (boldMatches.length === 0) {
        // No bold text, just add the part
        if (part) finalParts.push(part);
      } else {
        // Process text with bold matches
        boldMatches.forEach((match, matchIdx) => {
          // Add text before this bold
          if (match.index > lastBoldIndex) {
            finalParts.push(part.substring(lastBoldIndex, match.index));
          }
          // Add bold text
          finalParts.push(<strong key={`bold-${idx}-${matchIdx}`}>{match.text}</strong>);
          lastBoldIndex = match.index + match.length;
        });
        
        // Add remaining text after last bold
        if (lastBoldIndex < part.length) {
          finalParts.push(part.substring(lastBoldIndex));
        }
      }
    } else {
      finalParts.push(part);
    }
  });
  
  return finalParts;
};

const MarkdownRenderer = ({ content, githubUrl }: { content: string; githubUrl?: string }) => {
  // Remove HTML tags and content at the beginning
  let cleanContent = content;
  
  // Remove HTML div/section tags and their content
  cleanContent = cleanContent.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, "");
  cleanContent = cleanContent.replace(/<section[^>]*>[\s\S]*?<\/section>/gi, "");
  cleanContent = cleanContent.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "");
  
  // Remove standalone HTML tags
  cleanContent = cleanContent.replace(/<[^>]+>/g, "");
  
  // Remove multiple consecutive blank lines
  cleanContent = cleanContent.replace(/\n\n\n+/g, "\n\n");
  
  const lines = cleanContent.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks - check for triple backticks
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      
      // Find the closing backticks
      let foundClosing = false;
      while (i < lines.length) {
        if (lines[i].trim().startsWith("```")) {
          foundClosing = true;
          break;
        }
        codeLines.push(lines[i]);
        i++;
      }
      
      // Render code block (always, even if empty)
      const codeContent = codeLines.join("\n").trim();
      elements.push(
        <CodeBlock 
          key={`code-${elements.length}`} 
          code={codeContent || "// Code block"} 
          language={language || "code"} 
        />
      );
      
      if (foundClosing) {
        i++; // Skip the closing backticks
      }
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      const text = line.slice(2);
      elements.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold mt-8 mb-4">
          {renderInlineMarkdown(text)}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3);
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold mt-6 mb-3">
          {renderInlineMarkdown(text)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      const text = line.slice(4);
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-bold mt-5 mb-2">
          {renderInlineMarkdown(text)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      const text = line.slice(5);
      elements.push(
        <h4 key={`h4-${i}`} className="text-lg font-bold mt-4 mb-2">
          {renderInlineMarkdown(text)}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith("##### ")) {
      const text = line.slice(6);
      elements.push(
        <h5 key={`h5-${i}`} className="text-base font-bold mt-3 mb-1">
          {renderInlineMarkdown(text)}
        </h5>
      );
      i++;
      continue;
    }
    if (line.startsWith("###### ")) {
      const text = line.slice(7);
      elements.push(
        <h6 key={`h6-${i}`} className="text-sm font-bold mt-2 mb-1">
          {renderInlineMarkdown(text)}
        </h6>
      );
      i++;
      continue;
    }

    // Images - extract all images from the line
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let imageMatch;
    const images: Array<{alt: string; src: string}> = [];
    
    while ((imageMatch = imageRegex.exec(line)) !== null) {
      let src = imageMatch[2];
      const alt = imageMatch[1];
      
      // Convert relative URLs to absolute GitHub URLs
      if (src && !src.startsWith("http") && githubUrl) {
        const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "");
        // Try main branch first, then master
        src = `https://raw.githubusercontent.com/${repoPath}/main/${src}`;
      }
      
      images.push({ alt, src });
    }
    
    if (images.length > 0) {
      images.forEach((img, idx) => {
        elements.push(
          <div key={`img-container-${elements.length}-${idx}`} className="my-4">
            <img
              src={img.src}
              alt={img.alt}
              className="max-w-full h-auto rounded-lg border border-border"
              onError={(e) => {
                const imgEl = e.target as HTMLImageElement;
                // Try master branch if main fails
                if (imgEl.src.includes("/main/")) {
                  imgEl.src = imgEl.src.replace("/main/", "/master/");
                } 
                // Try develop branch if master fails
                else if (imgEl.src.includes("/master/")) {
                  imgEl.src = imgEl.src.replace("/master/", "/develop/");
                }
              }}
            />
          </div>
        );
      });
      i++;
      continue;
    }

    // Horizontal rules
    if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      elements.push(
        <hr key={`hr-${elements.length}`} className="my-6 border-t border-border" />
      );
      i++;
      continue;
    }

    // Tables - check for markdown table format (| header |)
    if (line.includes("|")) {
      const tableRows: string[][] = [];
      let isTable = true;
      let j = i;
      
      // Collect table rows
      while (j < lines.length && lines[j].includes("|")) {
        const cells = lines[j].split("|").map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          tableRows.push(cells);
        }
        j++;
        
        // Skip separator row (|---|---|)
        if (j < lines.length && lines[j].match(/^\|[\s\-|:]+\|$/)) {
          j++;
        }
      }
      
      if (tableRows.length > 1) {
        const headers = tableRows[0];
        const rows = tableRows.slice(1);
        
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  {headers.map((header, idx) => (
                    <th key={idx} className="border border-border px-4 py-2 text-left font-semibold">
                      {renderInlineMarkdown(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-border px-4 py-2">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
        i = j;
        continue;
      }
    }

    // Lists
    if (line.startsWith("- ") || line.startsWith("* ") || line.match(/^\s+[-*]\s/)) {
      const listItems: Array<{text: string; level: number}> = [];
      
      while (i < lines.length) {
        const currentLine = lines[i];
        const match = currentLine.match(/^(\s*)[-*]\s(.+)$/);
        
        if (!match) break;
        
        const level = match[1].length / 2; // Calculate nesting level
        const text = match[2];
        listItems.push({ text, level });
        i++;
      }
      
      // Render nested list structure
      const renderNestedList = (items: Array<{text: string; level: number}>, startIdx: number = 0, parentLevel: number = 0): JSX.Element[] => {
        const result: JSX.Element[] = [];
        let j = startIdx;
        
        while (j < items.length) {
          const item = items[j];
          
          if (item.level < parentLevel) {
            break;
          }
          
          if (item.level === parentLevel) {
            if (j + 1 < items.length && items[j + 1].level > parentLevel) {
              // Has children
              const children = renderNestedList(items, j + 1, parentLevel + 1);
              result.push(
                <li key={j} className="text-foreground">
                  {renderInlineMarkdown(item.text)}
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                    {children}
                  </ul>
                </li>
              );
              // Skip processed children
              while (j + 1 < items.length && items[j + 1].level > parentLevel) {
                j++;
              }
            } else {
              result.push(
                <li key={j} className="text-foreground">
                  {renderInlineMarkdown(item.text)}
                </li>
              );
            }
            j++;
          } else if (item.level > parentLevel) {
            j++;
          } else {
            break;
          }
        }
        
        return result;
      };
      
      const renderedItems = renderNestedList(listItems);
      
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-4 ml-4">
          {renderedItems}
        </ul>
      );
      continue;
    }

    // Paragraphs
    if (line.trim()) {
      elements.push(
        <p key={`p-${elements.length}`} className="text-foreground leading-relaxed my-3">
          {renderInlineMarkdown(line)}
        </p>
      );
    }

    i++;
  }

  return <div className="space-y-4">{elements}</div>;
};

const McpDetail = () => {
  const { name } = useParams<{ name: string }>();
  const [tool, setTool] = useState<McpTool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readme, setReadme] = useState<string>("");
  const [ownerAvatar, setOwnerAvatar] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");

  useEffect(() => {
    fetchToolDetails();
  }, [name]);

  const fetchToolDetails = async () => {
    setIsLoading(true);
    
    // Fetch from database
    const { data, error } = await supabase
      .from("mcp_tools")
      .select("*")
      .eq("repo_name", name)
      .single();

    if (error) {
      console.error("Error fetching tool:", error);
      setIsLoading(false);
      return;
    }

    setTool(data);

    // Fetch owner info from GitHub
    if (data?.github_url) {
      try {
        const urlParts = data.github_url.replace(/\/$/, '').split('/');
        const owner = urlParts[urlParts.length - 2];
        setOwnerName(owner);
        
        const ownerResponse = await fetchGitHub(`https://api.github.com/users/${owner}`);
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json();
          setOwnerAvatar(ownerData.avatar_url);
        }

        // Fetch README from GitHub
        const repoPath = data.github_url.replace("https://github.com/", "").replace(/\/$/, "");
        console.log("Fetching README from:", `https://api.github.com/repos/${repoPath}/readme`);
        
        const readmeResponse = await fetchGitHub(
          `https://api.github.com/repos/${repoPath}/readme`
        );
        
        console.log("README response status:", readmeResponse.status);
        
        if (readmeResponse.ok) {
          const readmeText = await readmeResponse.text();
          console.log("README fetched, length:", readmeText.length);
          setReadme(readmeText);
        } else {
          console.error("Failed to fetch README:", readmeResponse.status, readmeResponse.statusText);
        }
      } catch (err) {
        console.error("Error fetching GitHub data:", err);
      }
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Link to="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to directory
            </Button>
          </Link>
          <div className="text-center py-20">
            <h1 className="text-2xl font-semibold mb-2">Tool not found</h1>
            <p className="text-muted-foreground">The requested MCP tool doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to directory
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={ownerAvatar} alt={ownerName} />
                <AvatarFallback className="text-sm">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h1 className="text-4xl font-bold">{tool.repo_name}</h1>
            </div>
            <Button asChild>
              <a href={tool.github_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on GitHub
              </a>
            </Button>
          </div>

          {tool.description && (
            <p className="text-lg text-muted-foreground mb-6">{tool.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-semibold">{tool.stars?.toLocaleString() || 0} stars</span>
            </div>
            
            {tool.language && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <GitBranch className="h-4 w-4" />
                <span>{tool.language}</span>
              </div>
            )}
            
            {tool.last_updated && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Updated {format(new Date(tool.last_updated), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>

          {/* Topics */}
          {tool.topics && tool.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {tool.topics.map((topic) => (
                <Badge key={topic} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* README */}
        {readme && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Documentation</h2>
            <MarkdownRenderer content={readme} githubUrl={tool.github_url} />
          </div>
        )}
      </div>
    </div>
  );
};

export default McpDetail;
