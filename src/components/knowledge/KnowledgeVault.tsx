'use client';

import { useState } from 'react';
import type { KnowledgeEntry } from '@/lib/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import KnowledgeList from './KnowledgeList';
import EntryDialog from './EntryDialog';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { AuthDialog } from '@/components/auth/AuthDialog';

export default function KnowledgeVault() {
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisContent, setAnalysisContent] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [searchResults, setSearchResults] = useState<KnowledgeEntry[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = getSupabaseClient();
  const { user } = useAuth();

  const handleSearch = (results: KnowledgeEntry[] | null) => {
    setSearchResults(results);
  };

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const fetchLatestAnalysis = async () => {
    if (!supabase || !user) {
      setIsAuthDialogOpen(true);
      return;
    }

    setIsAnalysisOpen(true);
    setIsLoadingAnalysis(true);
    setAnalysisContent('');

    try {
      const { data, error } = await supabase
        .from('insights')
        .select('content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAnalysisContent(data.content);
      } else {
        setAnalysisContent('No analysis generated yet. Check back tomorrow!');
      }
    } catch (error: any) {
      console.error('Failed to fetch analysis:', error);
      setAnalysisContent('Failed to load analysis.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  return (
    <>
      <EntryDialog
        isOpen={isEntryDialogOpen}
        setIsOpen={setIsEntryDialogOpen}
        onSuccess={handleDataChange}
      />

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onSuccess={handleDataChange}
      />

      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Daily Knowledge Analysis</DialogTitle>
            <DialogDescription>
              AI-generated insights and flashcards based on your recent activity.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/10">
            {isLoadingAnalysis ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Spinner size="large" />
                <p className="text-muted-foreground">Loading latest insights...</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {analysisContent}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={fetchLatestAnalysis}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex min-h-screen flex-col">
        <Header
          onNewEntry={() => setIsEntryDialogOpen(true)}
          onSearch={handleSearch}
          onAnalyze={fetchLatestAnalysis}
        />
        <main className="flex-1">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to KnowledgeVerse</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Sign in to start building your personal knowledge base.
                </p>
                <Button onClick={() => setIsAuthDialogOpen(true)}>Sign In</Button>
              </div>
            ) : (
              <KnowledgeList
                searchResults={searchResults}
                onDataChange={handleDataChange}
                refreshKey={refreshKey}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
