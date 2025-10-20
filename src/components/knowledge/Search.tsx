'use client';

import { useState } from 'react';
import { Search as SearchIcon, X, Loader2, Tags as TagsIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { KnowledgeEntry } from '@/lib/types';
import { ApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

type SearchProps = {
  onSearch: (results: KnowledgeEntry[] | null) => void;
};

export default function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    if (!query.trim() && tagList.length === 0) {
      onSearch(null);
      return;
    }

    setIsLoading(true);
    try {
      const results = await ApiClient.searchKnowledgeEntries(query, tagList);
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
    setTags('');
    onSearch(null);
  };

  const showClearButton = query || tags;

  return (
    <form onSubmit={handleSearch} className="w-full space-y-2 md:flex md:space-x-2 md:space-y-0">
      <div className="relative w-full">
        <label htmlFor="search-query" className="sr-only">
          Search your knowledge vault
        </label>
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="search-query"
          name="search-query"
          type="search"
          placeholder="Search your knowledge vault..."
          className="w-full bg-background/50 pl-9 pr-9"
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
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </div>
      <div className="relative w-full">
        <label htmlFor="search-tags" className="sr-only">
          Filter by tags
        </label>
        <TagsIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="search-tags"
          name="search-tags"
          type="text"
          placeholder="Filter by tags (comma-separated)..."
          className="w-full bg-background/50 pl-9"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <button type="submit" className="sr-only">Search</button>
    </form>
  );
}
