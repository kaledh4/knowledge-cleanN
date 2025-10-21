'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2, Tags as TagsIcon, ChevronDown } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { KnowledgeEntry } from '@/lib/types';
import { ApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type SearchProps = {
  onSearch: (results: KnowledgeEntry[] | null) => void;
};

export default function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load existing tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          const tagNames = data.tags.map((tag: { name: string }) => tag.name);
          setAllTags(tagNames);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  // Search suggestions
  useEffect(() => {
    if (query.length > 2) {
      // In a real app, you might want to fetch suggestions from an API
      // For now, we'll simulate with recent searches or popular terms
      const timer = setTimeout(() => {
        // This could be enhanced to fetch actual search suggestions
        setShowSuggestions(query.length > 2);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagInputValue.toLowerCase()) &&
    !selectedTags.includes(tag)
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
        setTagPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!query.trim() && selectedTags.length === 0) {
      onSearch(null);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);
    try {
      const results = await ApiClient.searchKnowledgeEntries(query, selectedTags);
      onSearch(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: 'Could not perform search. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedTags([]);
    setTagInputValue('');
    onSearch(null);
    setShowSuggestions(false);
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInputValue('');
      setTagPopoverOpen(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInputValue.trim()) {
      e.preventDefault();
      addTag(tagInputValue.trim());
    }
  };

  const showClearButton = query || selectedTags.length > 0;

  return (
    <div className="w-full space-y-3 search-container">
      {/* Search Input with Suggestions */}
      <div className="relative">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <label htmlFor="search-query" className="sr-only">
              Search your knowledge vault
            </label>
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              id="search-query"
              name="search-query"
              type="search"
              placeholder="Search your knowledge vault..."
              className="w-full bg-background/50 pl-9 pr-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(query.length > 2)}
            />
            {isLoading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              showClearButton && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        </form>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg">
            <div className="p-2 text-sm text-muted-foreground">
              Start typing to search your knowledge...
            </div>
          </div>
        )}
      </div>

      {/* Tag Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Filter by Tags</label>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Tag Input with Autocomplete */}
        <div className="relative">
          <TagsIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            placeholder="Add tags to filter..."
            className="w-full bg-background/50 pl-9"
            value={tagInputValue}
            onChange={(e) => setTagInputValue(e.target.value)}
            onKeyPress={handleTagKeyPress}
            onFocus={() => setTagPopoverOpen(true)}
          />

          {/* Tag Autocomplete Dropdown */}
          {(tagInputValue || tagPopoverOpen) && filteredTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-1">
                {filteredTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center justify-between group"
                  >
                    <span>{tag}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">
                      + Add
                    </span>
                  </button>
                ))}
                {tagInputValue.trim() && !filteredTags.includes(tagInputValue.trim()) && (
                  <button
                    type="button"
                    onClick={() => addTag(tagInputValue.trim())}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center justify-between group border-t"
                  >
                    <span>Create "{tagInputValue.trim()}"</span>
                    <span className="text-xs text-primary group-hover:text-primary">+ New</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Button */}
      <Button
        onClick={() => handleSearch()}
        className="w-full"
        disabled={isLoading || (!query.trim() && selectedTags.length === 0)}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Search
      </Button>
    </div>
  );
}
