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
        top: rect.bottom + 8, // Use viewport position, not scroll position
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // Update position only on scroll (not continuously)
  useEffect(() => {
    if (!showSuggestions) return;

    const handleScroll = () => {
      updateDropdownPosition();
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showSuggestions, updateDropdownPosition]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateDropdownPosition]);

  // Close on page scroll, but NOT on dropdown scroll
  useEffect(() => {
    if (!showSuggestions) return;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // If scrolling inside the dropdown itself, don't close
      if (suggestionsRef.current && suggestionsRef.current.contains(target)) {
        return;
      }
      
      // If scrolling the page, close the dropdown
      setShowSuggestions(false);
    };

    // Listen to all scroll events
    window.addEventListener('scroll', handleScroll, true);
  }, [showSuggestions]);

  // Debounce search input - minimal delay for instant feel
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 0); // No delay - instant search

    return () => clearTimeout(timer);
  }, [value]);

  // Calculate relevance score
  const calculateScore = useCallback((text: string, query: string, type: 'name' | 'description' | 'topic'): number => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Exact match gets highest score
    if (lowerText === lowerQuery) return 1000;
    
    // Starts with query gets high score
    if (lowerText.startsWith(lowerQuery)) return 800;
    
    // Contains query as whole word
    if (new RegExp(`\\b${lowerQuery}\\b`).test(lowerText)) return 600;
    
    // Contains query anywhere
    if (lowerText.includes(lowerQuery)) {
      // Bonus for name matches
      if (type === 'name') return 400;
      if (type === 'topic') return 300;
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
    const maxResults = 10; // Increased to show more results
    const maxSearchCount = 1000; // Search more tools

    // Ultra-fast search - only check tool names first
    let searchedCount = 0;
    for (const tool of tools) {
      if (results.length >= maxResults) break; // Stop as soon as we have enough
      if (searchedCount >= maxSearchCount) break; // Don't search too many tools
      
      searchedCount++;
      
      // Only search in tool name for speed
      if (tool.repo_name) {
        const lowerName = tool.repo_name.toLowerCase();
        if (lowerName.includes(query)) {
          const nameScore = calculateScore(tool.repo_name, query, 'name');
          if (!seen.has(`name-${tool.repo_name}`)) {
            results.push({
              id: `name-${tool.id}`,
              text: tool.repo_name,
              type: 'name',
              tool,
              score: nameScore
            });
            seen.add(`name-${tool.repo_name}`);
          }
        }
      }
    }
    
    // If we still need more results, search descriptions (but limit it)
    if (results.length < maxResults) {
      searchedCount = 0;
      for (const tool of tools) {
        if (results.length >= maxResults) break;
        if (searchedCount >= 200) break; // Even more limited for descriptions
        
        searchedCount++;
        
        if (tool.description && !seen.has(`desc-${tool.id}`)) {
          const lowerDesc = tool.description.toLowerCase();
          if (lowerDesc.includes(query)) {
            const descScore = calculateScore(tool.description, query, 'description');
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
    }

    // Sort by score and limit to top 8
    const sorted = results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

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
    onChange(suggestion.text);
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

  useEffect(() => {
    // Always show suggestions when we have valid results, even after scroll close
    if (debouncedValue.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (debouncedValue.length < 2) {
      setShowSuggestions(false);
    }
  }, [debouncedValue, suggestions.length]);

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
          zIndex: 50,
          maxHeight: '70vh',
          borderRadius: '0 0 1rem 1rem',
          borderTop: 'none',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          marginTop: '-2px',
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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary pointer-events-none z-10" />
      
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
        className={`pl-14 pr-32 h-16 text-lg border-2 bg-card/50 backdrop-blur-sm focus:border-primary focus:shadow-glow transition-all duration-300 ${
          showSuggestions ? 'rounded-t-2xl rounded-b-none border-b-0' : 'rounded-2xl'
        }`}
        autoComplete="off"
        spellCheck="false"
      />

      {value && (
        <Button
          onClick={clearSearch}
          size="sm"
          variant="ghost"
          className="absolute right-24 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <Button
        size="sm"
        className="absolute right-2 top-1/2 -translate-y-1/2 gap-2"
      >
        Search
      </Button>

      {/* Render suggestions via portal */}
      {renderSuggestions()}
    </div>
  );
};
