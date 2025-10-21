'use client';

import { useState, useEffect } from 'react';
import { Brain, Edit3, Trash2, Tag as TagIcon, Search, Plus, Check, X, AlertCircle, Palette, RefreshCw } from 'lucide-react';
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

interface TagColors {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

interface TagColorsMap {
  [tagName: string]: TagColors;
}

const PRESET_COLORS = [
  {
    name: 'Red',
    background: 'bg-red-900/50',
    border: 'border-red-500/40',
    text: 'text-red-300',
    hex: '#dc2626'
  },
  {
    name: 'Blue',
    background: 'bg-blue-900/50',
    border: 'border-blue-500/40',
    text: 'text-blue-300',
    hex: '#2563eb'
  },
  {
    name: 'Green',
    background: 'bg-green-900/50',
    border: 'border-green-500/40',
    text: 'text-green-300',
    hex: '#16a34a'
  },
  {
    name: 'Yellow',
    background: 'bg-yellow-900/50',
    border: 'border-yellow-500/40',
    text: 'text-yellow-300',
    hex: '#ca8a04'
  },
  {
    name: 'Purple',
    background: 'bg-purple-900/50',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    hex: '#9333ea'
  },
  {
    name: 'Pink',
    background: 'bg-pink-900/50',
    border: 'border-pink-500/40',
    text: 'text-pink-300',
    hex: '#ec4899'
  },
  {
    name: 'Orange',
    background: 'bg-orange-900/50',
    border: 'border-orange-500/40',
    text: 'text-orange-300',
    hex: '#ea580c'
  },
  {
    name: 'Teal',
    background: 'bg-teal-900/50',
    border: 'border-teal-500/40',
    text: 'text-teal-300',
    hex: '#14b8a6'
  }
];

export default function CustomizeTagsPage() {
  const { data: session } = useSession();
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Color management state
  const [tagColors, setTagColors] = useState<TagColorsMap>({});
  const [colorizingTag, setColorizingTag] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // New tag creation state
  const [newTagNameToCreate, setNewTagNameToCreate] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchTags();
    fetchTagColors();
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

  const fetchTagColors = async () => {
    try {
      const response = await fetch('/api/tags/colors');
      if (response.ok) {
        const data = await response.json();
        setTagColors(data.tagColors || {});
      }
    } catch (error) {
      console.error('Error fetching tag colors:', error);
    }
  };

  const handleSaveTagColor = async (tagName: string) => {
    try {
      const response = await fetch('/api/tags/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagName,
          backgroundColor: selectedColor.background,
          borderColor: selectedColor.border,
          textColor: selectedColor.text
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setTagColors({
          ...tagColors,
          [tagName]: {
            backgroundColor: selectedColor.background,
            borderColor: selectedColor.border,
            textColor: selectedColor.text
          }
        });
        setColorizingTag(null);
      } else {
        throw new Error(data.error || 'Failed to save tag color');
      }
    } catch (error) {
      console.error('Error saving tag color:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save tag color' });
    }
  };

  const handleResetTagColor = async (tagName: string) => {
    try {
      const response = await fetch(`/api/tags/colors?tag=${encodeURIComponent(tagName)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        const newTagColors = { ...tagColors };
        delete newTagColors[tagName];
        setTagColors(newTagColors);
      } else {
        throw new Error(data.error || 'Failed to reset tag color');
      }
    } catch (error) {
      console.error('Error resetting tag color:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to reset tag color' });
    }
  };

  const handleCreateNewTag = async () => {
    if (!newTagNameToCreate.trim()) {
      setMessage({ type: 'error', text: 'Tag name cannot be empty' });
      return;
    }

    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === newTagNameToCreate.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'This tag already exists' });
      return;
    }

    try {
      setCreatingTag(true);

      // Create a new knowledge entry with just the tag (this will create the tag in the system)
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: `Tag created: ${newTagNameToCreate}`,
          tags: [newTagNameToCreate.trim()],
          title: `Tag: ${newTagNameToCreate}`,
          enrichedContent: `This is a system entry created to initialize the tag "${newTagNameToCreate}". You can delete this entry if you don't need it.`
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Tag "${newTagNameToCreate}" created successfully` });
        setNewTagNameToCreate('');
        fetchTags(); // Refresh the tags list

        // Optionally, automatically open color customization for the new tag
        setColorizingTag(newTagNameToCreate.trim());
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create tag' });
    } finally {
      setCreatingTag(false);
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
    // Check if user has custom colors for this tag
    if (tagColors[tagName]) {
      const colors = tagColors[tagName];
      return `${colors.borderColor} ${colors.backgroundColor} ${colors.textColor} hover:opacity-80`;
    }

    // Default colors for known tags
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

        {/* Create New Tag */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5 text-green-500" />
              Create New Tag
            </CardTitle>
            <CardDescription>
              Add a new tag to your knowledge vault and optionally customize its color
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tag Name</Label>
                <Input
                  placeholder="Enter new tag name..."
                  value={newTagNameToCreate}
                  onChange={(e) => setNewTagNameToCreate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewTag();
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  New tags will be available immediately across your knowledge vault
                </div>
                <Button
                  onClick={handleCreateNewTag}
                  disabled={!newTagNameToCreate.trim() || creatingTag}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creatingTag ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Tag
                    </>
                  )}
                </Button>
              </div>
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
                              setColorizingTag(tag.name);
                              setSelectedColor(PRESET_COLORS[0]);
                            }}
                            className="relative"
                          >
                            <Palette className="h-4 w-4" />
                            {tagColors[tag.name] && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                                   style={{
                                     backgroundColor: PRESET_COLORS.find(c =>
                                       c.background === tagColors[tag.name].backgroundColor
                                     )?.hex || '#000'
                                   }}>
                              </div>
                            )}
                          </Button>
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
                <Plus className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Create New Tags</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the "Create New Tag" section to add new tags to your knowledge vault. New tags are immediately available for use.
                  </p>
                </div>
              </div>
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
                <Palette className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Customize Colors</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the palette button to choose custom colors for your tags. Custom colors are applied to all knowledge entries and card borders. A small dot appears on custom-colored tags.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    All changes are immediately reflected across your knowledge vault, including search results, filtering, and visual styling.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Customization Dialog */}
        <Dialog open={!!colorizingTag} onOpenChange={(open) => !open && setColorizingTag(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5 text-primary" />
                Customize Tag Color
              </DialogTitle>
              <DialogDescription>
                Choose a color for the tag "{colorizingTag}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Color Presets</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`h-12 rounded-lg border-2 transition-all ${
                        selectedColor.name === color.name
                          ? 'border-primary scale-105'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        backgroundColor: color.hex + '20',
                        borderColor: selectedColor.name === color.name ? color.hex : undefined
                      }}
                    >
                      <div className="flex items-center justify-center h-full">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Preview</Label>
                <div className="mt-2 p-3 border rounded-lg">
                  <Badge className={`${selectedColor.border} ${selectedColor.background} ${selectedColor.text}`}>
                    {colorizingTag}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                {tagColors[colorizingTag!] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetTagColor(colorizingTag!)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setColorizingTag(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveTagColor(colorizingTag!)}>
                  Apply Color
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}