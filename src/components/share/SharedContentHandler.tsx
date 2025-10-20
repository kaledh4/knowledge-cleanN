'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Twitter, Music, Link2, X, Plus, ArrowRight } from 'lucide-react';
import {
  parseSharedContentFromURL,
  clearSharedContentFromURL,
  detectContentType,
  detectContentType as getContentType,
  type SharedContent
} from '@/lib/share-handler';

interface SharedContentHandlerProps {
  onCreateEntry: (content: {
    source: string;
    tags?: string[];
    enrichedContent?: string;
    title?: string;
  }) => void;
}

export default function SharedContentHandler({ onCreateEntry }: SharedContentHandlerProps) {
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const content = parseSharedContentFromURL();
    if (content) {
      setSharedContent(content);
      // Set default tags based on source
      const defaultTags = getDefaultTagsForSource(content.source, content.url);
      setCustomTags(defaultTags);
    }
  }, []);

  const getDefaultTagsForSource = (source: string, url?: string): string[] => {
    switch (source) {
      case 'YouTube':
        return ['Learning'];
      case 'X (Twitter)':
        return ['Important'];
      case 'TikTok':
        return ['To Do Research On'];
      case 'LinkedIn':
        return ['Important', 'Learning'];
      case 'Reddit':
        return ['To Do Research On'];
      default:
        return url ? ['To Do Research On'] : [];
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'YouTube':
        return <Youtube className="h-5 w-5 text-red-500" />;
      case 'X (Twitter)':
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case 'TikTok':
        return <Music className="h-5 w-5 text-pink-500" />;
      default:
        return <Link2 className="h-5 w-5 text-primary" />;
    }
  };

  const getTagClasses = (tag: string): string => {
    switch (tag) {
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

  const handleAddTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags([...customTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateEntry = async () => {
    if (!sharedContent) return;

    setIsProcessing(true);
    try {
      const source = sharedContent.url || sharedContent.text || '';
      const contentType = getContentType(source);

      await onCreateEntry({
        source,
        tags: customTags,
        enrichedContent: sharedContent.text,
        title: sharedContent.title
      });

      // Clear shared content from URL after successful creation
      clearSharedContentFromURL();
      setSharedContent(null);
    } catch (error) {
      console.error('Failed to create shared entry:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    clearSharedContentFromURL();
    setSharedContent(null);
  };

  if (!sharedContent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getSourceIcon(sharedContent.source!)}
              <CardTitle className="text-xl">
                Create Entry from Shared Content
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Review and customize the shared content before adding it to your knowledge vault
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content Preview */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Source</Label>
              <div className="mt-1">
                <Badge variant="outline" className="flex items-center w-fit">
                  {getSourceIcon(sharedContent.source!)}
                  <span className="ml-2">{sharedContent.source}</span>
                </Badge>
              </div>
            </div>

            {sharedContent.title && (
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <Input
                  value={sharedContent.title}
                  onChange={(e) => setSharedContent({...sharedContent, title: e.target.value})}
                  className="mt-1"
                  placeholder="Entry title"
                />
              </div>
            )}

            {sharedContent.url && (
              <div>
                <Label className="text-sm font-medium">URL</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground break-all">{sharedContent.url}</p>
                </div>
              </div>
            )}

            {sharedContent.text && (
              <div>
                <Label className="text-sm font-medium">Content</Label>
                <div className="mt-1 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                  <p className="text-sm">{sharedContent.text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tags</Label>

            {/* Current tags */}
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customTags.map(tag => (
                  <Badge
                    key={tag}
                    className={getTagClasses(tag)}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:bg-white/10 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add new tag */}
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick tag suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {['Important', 'Learning', 'AI', 'Investing', 'To Do Research On']
                  .filter(tag => !customTags.includes(tag))
                  .map(tag => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomTags([...customTags, tag])}
                      className="h-6 text-xs"
                    >
                      + {tag}
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          {/* Alert */}
          <Alert>
            <AlertDescription>
              This content was shared from your mobile device. You can customize the title, content, and tags before saving it to your knowledge vault.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEntry}
              disabled={isProcessing || !sharedContent}
              className="flex-1"
            >
              {isProcessing ? (
                'Creating...'
              ) : (
                <>
                  Create Entry
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}