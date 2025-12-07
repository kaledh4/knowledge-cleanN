'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';
import { type KnowledgeEntry } from '@/lib/types';
import { getTagColor } from '@/lib/utils';
import { createKnowledgeEntry, updateKnowledgeEntry } from '@/lib/knowledge-actions';
import { getUserTags, Tag } from '@/lib/tagService';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '../ui/spinner';
import { X, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, {
    message: 'Content cannot be empty.',
  }),
  tags: z.array(z.string()),
});

type EntryFormProps = {
  entry?: KnowledgeEntry;
  onSuccess: () => void;
  initialData?: { title?: string; text?: string; url?: string } | null;
};

export default function EntryForm({ entry, onSuccess, initialData }: EntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const { toast } = useToast();
  const supabase = getSupabaseClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (entry) {
      form.setValue('title', entry.title || '');
      form.setValue('content', entry.content || '');
      form.setValue('tags', entry.tags || []);
    } else if (initialData) {
      form.setValue('title', initialData.title || '');
      form.setValue('content', initialData.text || initialData.url || '');
      form.setValue('tags', []);
    }
  }, [entry, initialData, form]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getUserTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  const addTag = (tagToAdd: string = newTag) => {
    if (!tagToAdd.trim()) return;
    const currentTags = form.getValues('tags') || [];
    const normalizedTag = tagToAdd.trim();

    if (!currentTags.some(t => t.toLowerCase() === normalizedTag.toLowerCase())) {
      form.setValue('tags', [...currentTags, normalizedTag]);
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Please configure Supabase in settings first.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      if (entry) {
        await updateKnowledgeEntry(entry.id, {
          title: values.title,
          content: values.content,
          tags: values.tags,
        }, user.id);
      } else {
        await createKnowledgeEntry({
          title: values.title || '',
          textForEmbedding: values.content,
          contentType: 'TEXT',
          tags: values.tags,
        }, user.id);
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
        description: error.message || 'Could not save the entry.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const currentTags = form.watch('tags');
  const suggestedTags = availableTags.filter(tag =>
    !currentTags.some(t => t.toLowerCase() === tag.name.toLowerCase())
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Entry Title" {...field} className="bg-background/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste your text, links, or thoughts here..."
                  className="min-h-[120px] resize-y bg-background/50"
                  {...field}
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
              <FormControl>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="bg-background/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => addTag()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Selected Tags */}
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((tag) => (
                      <Badge
                        key={tag}
                        className={`flex items-center gap-1 ${getTagColor(tag)}`}
                        variant="outline"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Suggested Tags */}
                  {suggestedTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Suggested Tags:</p>
                      <ScrollArea className="h-20 w-full rounded-md border bg-muted/20 p-2">
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags.map((tag) => (
                            <Badge
                              key={tag.name}
                              variant="outline"
                              className={`cursor-pointer transition-colors ${getTagColor(tag.name)}`}
                              onClick={() => addTag(tag.name)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
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