'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2, Tags as TagsIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { KnowledgeEntry } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseClient();

  // Load existing tags
  useEffect(() => {
    const loadTags = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('tags');

        if (error) throw error;

        if (data) {
          const tags = new Set<string>();
          data.forEach(entry => {
            if (Array.isArray(entry.tags)) {
              entry.tags.forEach((tag: string) => tags.add(tag));
            }
          });
          setAllTags(Array.from(tags));
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, [supabase]);

  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagInputValue.toLowerCase()) &&
    !selectedTags.includes(tag)
  );

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!query.trim() && selectedTags.length === 0) {
      onSearch(null);
      return;
    }

    if (!supabase) return;

    setIsLoading(true);
    try {
      let queryBuilder = supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (query.trim()) {
        // Simple case-insensitive search on title or content
        // Note: For better search, enable Full Text Search in Supabase and use .textSearch()
        // Here we use ilike for simplicity as requested
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }

      if (selectedTags.length > 0) {
        queryBuilder = queryBuilder.contains('tags', selectedTags);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      onSearch(data as KnowledgeEntry[]);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: error.message || 'Could not perform search.',
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

  const showClearButton = query || selectedTags.length > 0;

  return (
    <div className="w-full search-container">
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search..."
                  className="w-full bg-background/50 pl-9 pr-9 h-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {isLoading ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : (
                  showClearButton && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )
                )}
              </div>
            </form>
          </div>

          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <TagsIcon className="h-4 w-4 mr-1" />
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3">
                <div className="space-y-3">
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Input
                    placeholder="Search tags..."
                    value={tagInputValue}
                    onChange={(e) => setTagInputValue(e.target.value)}
                  />
                  {filteredTags.length > 0 && (
                    <div className="max-h-40 overflow-auto">
                      {filteredTags.slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-md"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={() => handleSearch()} size="sm" className="h-9" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden space-y-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-full bg-background/50 pl-9 pr-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
        <Button onClick={() => handleSearch()} className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>
    </div>
  );
}
