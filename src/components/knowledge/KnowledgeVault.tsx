'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { KnowledgeEntry } from '@/lib/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import KnowledgeList from './KnowledgeList';
import EntryDialog from './EntryDialog';
import SharedContentHandler from '@/components/share/SharedContentHandler';

export default function KnowledgeVault() {
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<KnowledgeEntry[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();

  const handleSearch = (results: KnowledgeEntry[] | null) => {
    setSearchResults(results);
  };

  const handleDataChange = () => {
    // This will force a re-fetch in the KnowledgeList component
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateSharedEntry = async (sharedData: {
    source: string;
    tags?: string[];
    enrichedContent?: string;
    title?: string;
  }) => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sharedData.source,
          tags: sharedData.tags || [],
          enrichedContent: sharedData.enrichedContent,
          title: sharedData.title
        }),
      });

      if (response.ok) {
        handleDataChange(); // Refresh the knowledge list
      } else {
        throw new Error('Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating shared entry:', error);
      throw error;
    }
  };

  return (
    <>
      <EntryDialog
        isOpen={isEntryDialogOpen}
        setIsOpen={setIsEntryDialogOpen}
        onSuccess={handleDataChange}
      />
      <SharedContentHandler onCreateEntry={handleCreateSharedEntry} />
      <div className="flex min-h-screen flex-col">
        <Header
          onNewEntry={() => setIsEntryDialogOpen(true)}
          onSearch={handleSearch}
        />
        <main className="flex-1">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <KnowledgeList
              searchResults={searchResults}
              onDataChange={handleDataChange}
              refreshKey={refreshKey}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
