"use client"

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X, TrendingUp, Hash } from "lucide-react";
import type { Database } from '@/types/database.types'

type McpTool = Database['public']['Tables']['mcp_tools']['Row']

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tools?: McpTool[];
}

interface Suggestion {
  id: string;
  text: string;
  type: 'name' | 'description' | 'topic';
  tool: McpTool;
  score: number;
}

export const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search MCP tools...",
  tools = []
}: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Map<string, Suggestion[]>>(new Map());
  const scrollClosedRef = useRef(false);

  // Track if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom, // No gap - dropdown sits right below search bar
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // Close dropdown when page scrolls
  useEffect(() => {
    if (!showSuggestions) return;

    const handleScroll = () => {
      // Close dropdown when user scrolls the page
      setShowSuggestions(false);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showSuggestions]);

  // Debounce search input - minimal delay for instant feel
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 0); // No delay - instant search

    return () => clearTimeout(timer);
  }, [value]);

  // Calculate relevance score - ultra-fast version
  const calculateScore = useCallback((text: string, query: string, type: 'name' | 'description' | 'topic'): number => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Exact match gets highest score
    if (lowerText === lowerQuery) return 1000;
    
    // Starts with query gets high score
    if (lowerText.startsWith(lowerQuery)) return 800;
    
    // Contains query anywhere (skip regex for speed)
    if (lowerText.includes(lowerQuery)) {
      // Bonus for name matches
      if (type === 'name') return 400;
      return 200;
    }
    
    return 0;
  }, []);

  // Generate suggestions with caching
  const suggestions = useMemo(() => {
    if (!debouncedValue || debouncedValue.length < 2) return [];

    // Check cache first
    const cached = cacheRef.current.get(debouncedValue);
    if (cached) return cached;

    const query = debouncedValue.toLowerCase();
    const results: Suggestion[] = [];
    const seen = new Set<string>();
    const maxResults = 5; // Show 5 results

    // Search through tools - check names, descriptions, and topics
    for (const tool of tools) {
      if (results.length >= maxResults) break;
      
      // Check tool name
      if (tool.repo_name) {
        const lowerName = tool.repo_name.toLowerCase();
        if (lowerName.includes(query)) {
          const nameScore = calculateScore(tool.repo_name, query, 'name');
          if (!seen.has(`name-${tool.id}`)) {
            results.push({
              id: `name-${tool.id}`,
              text: tool.repo_name,
              type: 'name',
              tool,
              score: nameScore
            });
            seen.add(`name-${tool.id}`);
          }
        }
      }
      
      // Check description
      if (tool.description && results.length < maxResults) {
        const lowerDesc = tool.description.toLowerCase();
        if (lowerDesc.includes(query)) {
          const descScore = calculateScore(tool.description, query, 'description');
          if (!seen.has(`desc-${tool.id}`) && descScore > 0) {
            results.push({
              id: `desc-${tool.id}`,
              text: tool.description,
              type: 'description',
              tool,
              score: descScore
            });
            seen.add(`desc-${tool.id}`);
          }
        }
      }
      
      // Check topics
      if (tool.topics && results.length < maxResults) {
        for (const topic of tool.topics) {
          const lowerTopic = topic.toLowerCase();
          if (lowerTopic.includes(query)) {
            const topicScore = calculateScore(topic, query, 'topic');
            if (!seen.has(`topic-${tool.id}-${topic}`) && topicScore > 0) {
              results.push({
                id: `topic-${tool.id}-${topic}`,
                text: topic,
                type: 'topic',
                tool,
                score: topicScore
              });
              seen.add(`topic-${tool.id}-${topic}`);
              break; // Only add one topic per tool
            }
          }
        }
      }
    }

    // Sort by score (highest first)
    const sorted = results.sort((a, b) => b.score - a.score).slice(0, maxResults);

    // Cache the results
    cacheRef.current.set(debouncedValue, sorted);
    return sorted;
  }, [debouncedValue, tools, calculateScore]);

  // Format tool name for display (Title Case with spaces)
  const formatToolName = (name: string): string => {
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/20 text-primary font-semibold">{part}</mark>
        : part
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: Suggestion) => {
    // Use the actual repo name, not the formatted display name
    onChange(suggestion.tool.repo_name || suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Clear search
  const clearSearch = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking inside the dropdown or input container
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Show suggestions when there are results (without blocking input)
  useEffect(() => {
    // Reset scroll-closed flag when user types (value changes)
    scrollClosedRef.current = false;
  }, [value]);

  // Suggestions disabled permanently
  useEffect(() => {
    setShowSuggestions(false);
  }, []);

  // Render suggestions dropdown
  const renderSuggestions = () => {
    if (!showSuggestions || !isMounted) return null;
    const dropdown = (
      <div
        ref={suggestionsRef}
        className="fixed bg-card/95 backdrop-blur-md border-2 border-primary/20 overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 9999,
          maxHeight: '70vh',
          borderRadius: '0 0 1rem 1rem',
          borderTop: 'none',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          transition: 'none'
        }}
      >
        {suggestions.length > 0 ? (
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 ${
                  index === selectedIndex ? 'bg-accent/10' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {highlightMatch(
                      formatToolName(suggestion.type === 'name' ? suggestion.text : suggestion.tool.repo_name || ''),
                      debouncedValue
                    )}
                  </div>
                  {suggestion.type !== 'name' && (
                    <div className="text-xs text-muted-foreground truncate">
                      {highlightMatch(suggestion.text, debouncedValue)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : debouncedValue.length >= 2 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No results found for &quot;{debouncedValue}&quot;</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : null}
      </div>
    );

    return createPortal(dropdown, document.body);
  };
  return (
    <div ref={containerRef} className="relative w-full max-w-3xl group">
      <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-primary pointer-events-none z-10" />
      
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          // Immediate update without any blocking
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (debouncedValue.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={`pl-12 pr-10 sm:pl-14 sm:pr-32 h-12 sm:h-16 text-sm sm:text-lg border-2 border-border bg-card/60 backdrop-blur-md focus:border-primary focus:outline-none !focus-visible:ring-0 !focus-visible:ring-offset-0 transition-all duration-300 ${
          showSuggestions ? 'rounded-t-2xl rounded-b-none border-b-0' : 'rounded-2xl'
        }`}
        style={{
          outline: 'none',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          WebkitBoxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
        autoComplete="off"
        spellCheck="false"
      />

      {value && (
        <Button
          onClick={clearSearch}
          size="sm"
          className="absolute right-2 sm:right-24 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      )}

      <Button
        size="sm"
        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm hidden md:flex bg-[#4B5CFF] hover:bg-[#3B3B98] text-white font-semibold"
      >
        Search
      </Button>

      {/* Render suggestions via portal */}
      {renderSuggestions()}
    </div>
  );
};
