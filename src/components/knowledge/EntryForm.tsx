'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ApiClient } from '@/lib/api-client';
import { extractFromSource } from '@/lib/client-extractor';
import { TAGS, type KnowledgeEntry, type Tag } from '@/lib/types';

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
import { Spinner } from '../ui/spinner';

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
  const { toast } = useToast();

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
                Categorize this entry to find it easily later.
              </FormDescription>
              <FormControl>
                <div className="flex flex-wrap gap-2 pt-2">
                  {TAGS.map((tag) => (
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