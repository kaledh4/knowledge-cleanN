'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ApiClient } from '@/lib/api-client';
import { extractFromSource } from '@/lib/client-extractor';
import { DEFAULT_TAGS, type KnowledgeEntry, type Tag } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '../ui/spinner';
import { X, Plus } from 'lucide-react';

const formSchema = z.object({
  source: z.string().min(10, {
    message: 'Source must be at least 10 characters.',
  }),
  tags: z.array(z.string()).min(1, {
    message: 'Please select at least one tag.',
  }),
});

type EntryFormProps = {
  entry?: KnowledgeEntry;
  onSuccess: () => void;
  initialData?: { title?: string; text?: string; url?: string } | null;
};

export default function EntryForm({ entry, onSuccess, initialData }: EntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>(DEFAULT_TAGS as string[]);
  const { toast } = useToast();

  // Load existing tags from the API
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          const existingTags = data.tags.map((tag: { name: string }) => tag.name);
          const uniqueTags = Array.from(new Set([...DEFAULT_TAGS as string[], ...existingTags]));
          setAllTags(uniqueTags);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (entry) {
      // Populate form for editing.
      // We prioritize showing content if it exists, otherwise we show the URL.
      // For non-TEXT entries, the content is read-only.
      form.setValue('source', entry.content || entry.url || '');
      form.setValue('tags', entry.tags || []);
    } else if (initialData) {
      // Populate form from shared data
      const source = initialData.url || initialData.text || '';
      form.setValue('source', source);
      form.setValue('tags', []);
    } else {
      // Reset form for new entries
      form.reset({ source: '', tags: [] });
    }
  }, [entry, initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      if (entry) {
        // Update existing entry
        await ApiClient.updateKnowledgeEntry(entry.id.toString(), values.source, values.tags as Tag[]);
      } else {
        // Create new entry; if URL, try client-side extraction to enrich content
        const isUrl = (() => { try { new URL(values.source); return true; } catch { return false; } })();
        let enrichedContent: string | undefined;
        let title: string | undefined = initialData?.title;
        if (isUrl) {
          const extracted = await extractFromSource(values.source);
          enrichedContent = extracted?.content;
          if (!title) {
            title = extracted?.title;
          }
        }
        await ApiClient.createKnowledgeEntry(values.source, values.tags as Tag[], enrichedContent, title);
      }

      toast({
        title: entry ? 'Update Successful' : 'Entry Added',
        description: 'Your knowledge vault has been updated.',
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'Could not save the entry. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getFormLabel = () => {
    return 'Content or URL';
  };

  const getFormPlaceholder = () => {
    return 'Paste your text, a YouTube link, or an X.com post URL here...';
  };

  const addCustomTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !trimmedTag.includes(',') && !allTags.includes(trimmedTag)) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(trimmedTag)) {
        form.setValue('tags', [...currentTags, trimmedTag]);
        setAllTags(prev => [...prev, trimmedTag]);
        setNewTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      addCustomTag();
    }
  };

  const isReadOnly = () => {
    // New entry is editable; existing non-TEXT entries are read-only
    if (!entry) return false;
    return entry.type !== 'TEXT';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{getFormLabel()}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={getFormPlaceholder()}
                  className="min-h-[120px] resize-y"
                  {...field}
                  readOnly={isReadOnly()}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormDescription>
                Categorize this entry to find it easily later. Select from default tags or create custom ones.
              </FormDescription>
              <FormControl>
                <div className="space-y-4">
                  {/* Selected Tags Display */}
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((tag) => (
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

                  {/* Default Tags */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Default Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_TAGS.map((tag) => (
                        <Toggle
                          key={tag}
                          variant="outline"
                          pressed={field.value?.includes(tag)}
                          onPressedChange={(pressed) => {
                            const currentTags = field.value || [];
                            const newTags = pressed
                              ? [...currentTags, tag]
                              : currentTags.filter((t) => t !== tag);
                            field.onChange(newTags);
                          }}
                        >
                          {tag}
                        </Toggle>
                      ))}
                    </div>
                  </div>

                  {/* Custom Tag Creation */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Create Custom Tag</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        placeholder="Enter new tag name..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                        disabled={isReadOnly()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCustomTag}
                        disabled={!newTagInput.trim() || isReadOnly()}
                        className="flex items-center gap-1 sm:w-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Tag</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                    {newTagInput.trim() && allTags.includes(newTagInput.trim()) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        This tag already exists or is selected.
                      </p>
                    )}
                  </div>

                  {/* All Available Tags (excluding default and selected) */}
                  {allTags.filter(tag => !DEFAULT_TAGS.includes(tag as typeof DEFAULT_TAGS[number]) && !field.value?.includes(tag)).length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Existing Custom Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {allTags
                          .filter(tag => !DEFAULT_TAGS.includes(tag as typeof DEFAULT_TAGS[number]) && !field.value?.includes(tag))
                          .map((tag) => (
                            <Toggle
                              key={tag}
                              variant="outline"
                              pressed={field.value?.includes(tag)}
                              onPressedChange={(pressed) => {
                                const currentTags = field.value || [];
                                const newTags = pressed
                                  ? [...currentTags, tag]
                                  : currentTags.filter((t) => t !== tag);
                                field.onChange(newTags);
                              }}
                            >
                              {tag}
                            </Toggle>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading && <Spinner className="mr-2" />}
          {entry ? 'Save Changes' : 'Add to Vault'}
        </Button>
      </form>
    </Form>
  );
}