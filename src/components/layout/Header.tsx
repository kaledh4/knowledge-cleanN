'use client';

import { useState } from 'react';
import Logo from './Logo';
import { Button } from '../ui/button';
import { PlusCircle, Search as SearchIcon, Menu, X, BrainCircuit } from 'lucide-react';
import type { KnowledgeEntry } from '@/lib/types';
import Search from '../knowledge/Search';
import { cn } from '@/lib/utils';

type HeaderProps = {
  onNewEntry: () => void;
  onSearch: (results: KnowledgeEntry[] | null) => void;
  onAnalyze: () => void;
};

export default function Header({ onNewEntry, onSearch, onAnalyze }: HeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (showSearch) setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (isExpanded) setIsExpanded(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 items-center justify-center px-4 sm:px-8 md:px-16">
          <div className="w-full max-w-lg">
            <Search onSearch={onSearch} />
          </div>
        </div>

        {/* Mobile Search (Expandable) */}
        <div
          className={cn(
            'md:hidden absolute left-0 right-0 top-16 bg-background border-b transition-all duration-300 ease-in-out',
            showSearch ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          )}
        >
          <div className="container mx-auto px-4 py-4">
            <Search onSearch={onSearch} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-2">
            <Button size="sm" onClick={onNewEntry}>
              <PlusCircle className="mr-2 h-4 w-4" />
              ADD
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onAnalyze}
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              Analyze
            </Button>


          </div>

          {/* Mobile Controls */}
          <div className="md:hidden relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSearch}
              className={cn('transition-colors', showSearch && 'bg-accent text-accent-foreground')}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={toggleExpanded}
              className={cn('ml-1 transition-colors', isExpanded && 'bg-accent text-accent-foreground')}
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            {/* Mobile Menu */}
            <div
              className={cn(
                'absolute right-0 top-12 bg-background border rounded-md shadow-lg transition-all duration-300 ease-in-out min-w-[160px] z-50',
                isExpanded
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
              )}
            >
              <div className="p-2 space-y-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onNewEntry();
                    setIsExpanded(false);
                  }}
                  className="w-full justify-start"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  ADD
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onAnalyze();
                    setIsExpanded(false);
                  }}
                  className="w-full justify-start"
                >
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Analyze
                </Button>


              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
