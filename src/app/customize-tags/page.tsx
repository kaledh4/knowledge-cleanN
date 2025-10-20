'use client';

import { useState, useEffect } from 'react';
import { Brain, Edit3, Trash2, Tag as TagIcon, Search, Plus, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface TagData {
  name: string;
  usageCount: number;
}

export default function CustomizeTagsPage() {
  const { data: session } = useSession();
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      } else {
        throw new Error('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setMessage({ type: 'error', text: 'Failed to load tags. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTag = async (oldTag: string, newTag: string) => {
    if (!newTag.trim() || oldTag === newTag) {
      return;
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldTag, newTag: newTag.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setEditingTag(null);
        setNewTagName('');
        fetchTags(); // Refresh the tags list
      } else {
        throw new Error(data.error || 'Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update tag' });
    }
  };

  const handleDeleteTag = async (tag: string) => {
    try {
      const response = await fetch(`/api/tags?tag=${encodeURIComponent(tag)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setDeletingTag(null);
        fetchTags(); // Refresh the tags list
      } else {
        throw new Error(data.error || 'Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete tag' });
    }
  };

  const getTagClasses = (tagName: string): string => {
    switch (tagName) {
      case 'Important':
        return 'border-red-500/40 bg-red-900/50 text-red-300 hover:bg-red-900/80';
      case 'To Do Research On':
        return 'border-yellow-500/40 bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/80';
      case 'Learning':
        return 'border-blue-500/40 bg-blue-900/50 text-blue-300 hover:bg-blue-900/80';
      case 'AI':
        return 'border-purple-500/40 bg-purple-900/50 text-purple-300 hover:bg-purple-900/80';
      case 'Investing':
        return 'border-green-500/40 bg-green-900/50 text-green-300 hover:bg-green-900/80';
      default:
        return 'border-accent/30 bg-accent/20 text-accent-foreground hover:bg-accent/30';
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl font-bold">KnowledgeVerse</span>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Vault</Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto max-w-4xl px-4 py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-headline text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-6">Please log in to customize your tags.</p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold">KnowledgeVerse</span>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Vault</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl font-bold mb-4">
            Customize Your Tags
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your tag system by renaming, updating, or removing tags. Changes will be reflected
            across all your knowledge entries immediately.
          </p>
        </div>

        {/* Alert Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
            <AlertDescription>{message.text}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => setMessage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5 text-primary" />
              Search Tags
            </CardTitle>
            <CardDescription>
              Find specific tags to edit or manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tags Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <TagIcon className="mr-2 h-5 w-5 text-primary" />
                Your Tags ({filteredTags.length})
              </span>
              <Button variant="outline" size="sm" onClick={fetchTags} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardTitle>
            <CardDescription>
              Click on any tag to edit its name across all your entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading tags...</p>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-8">
                <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No tags found matching your search.' : 'No tags found. Start by adding some knowledge entries with tags.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTags.map((tag) => (
                  <div key={tag.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Badge className={getTagClasses(tag.name)}>
                        {tag.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {tag.usageCount} {tag.usageCount === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingTag === tag.name ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag name"
                            className="w-40"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateTag(tag.name, newTagName);
                              } else if (e.key === 'Escape') {
                                setEditingTag(null);
                                setNewTagName('');
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTag(tag.name, newTagName)}
                            disabled={!newTagName.trim() || newTagName.trim() === tag.name}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTag(null);
                              setNewTagName('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTag(tag.name);
                              setNewTagName(tag.name);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Dialog open={deletingTag === tag.name} onOpenChange={(open) => setDeletingTag(open ? tag.name : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Tag</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete the tag "{tag.name}"? This will remove it from {tag.usageCount} {tag.usageCount === 1 ? 'entry' : 'entries'}. This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeletingTag(null)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => handleDeleteTag(tag.name)}>
                                  Delete Tag
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How Tag Management Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Edit3 className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Edit Tags</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the edit button to rename a tag. The change will be applied to all entries that use this tag.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Trash2 className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Delete Tags</h3>
                  <p className="text-sm text-muted-foreground">
                    Remove a tag from all entries. The entries themselves will not be deleted, only the tag association.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    All changes are immediately reflected across your knowledge vault, including search results and filtering.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}