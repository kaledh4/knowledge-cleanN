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
import { getUserTags, getTagColors, TagColor } from '@/lib/tagService';
import { getTagColorClasses } from '@/lib/tag-utils';
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
  const [userTagColors, setUserTagColors] = useState<Record<string, TagColor>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseClient();

  // Load existing tags and colors
  useEffect(() => {
    const loadTagsAndColors = async () => {
      try {
        const [tags, colors] = await Promise.all([
          getUserTags(),
          getTagColors()
        ]);
        setAllTags(tags.map(t => t.name));
        setUserTagColors(colors);
      } catch (error) {
        console.error('Failed to load tags data:', error);
      }
    };
    loadTagsAndColors();
  }, []);

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
    <div className="w-full search-container font-body">
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
                  className="w-full bg-background/50 pl-9 pr-9 h-10 transition-all focus:ring-2 focus:ring-primary/20"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
              <Button variant="outline" size="sm" className="h-10 px-3 border-white/10 hover:bg-white/5">
                <TagsIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="mr-1">Tags</span>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 text-primary border-primary/20">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-white/10 bg-card/95 backdrop-blur-xl" align="start">
              <div className="p-3">
                <div className="space-y-3">
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={cn(
                            "flex items-center gap-1 pl-2 pr-1 py-1",
                            getTagColorClasses(tag, userTagColors)
                          )}
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          >
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
                    className="bg-background/50 border-white/10"
                  />
                  {filteredTags.length > 0 && (
                    <div className="max-h-48 overflow-auto space-y-1 pr-1">
                      {filteredTags.slice(0, 8).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-md transition-colors flex items-center gap-2 group"
                        >
                          <div className={cn("w-2 h-2 rounded-full", userTagColors[tag]?.background_color?.replace('bg-', 'bg-') || 'bg-primary/50')} />
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredTags.length === 0 && tagInputValue && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tags found</p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={() => handleSearch()} size="sm" className="h-10 px-6 font-medium" disabled={isLoading}>
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
              className="w-full bg-background/50 pl-9 pr-9 h-10"
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

        {/* Mobile Tag Selection - Simplified for now */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allTags.slice(0, 5).map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className={cn(
                "whitespace-nowrap cursor-pointer",
                selectedTags.includes(tag) ? "" : "opacity-70 hover:opacity-100"
              )}
              onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <Button onClick={() => handleSearch()} className="w-full h-10" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>
    </div>
  );
}
