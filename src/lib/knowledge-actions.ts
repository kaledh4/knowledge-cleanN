import { supabase } from '@/lib/supabase';
import { KnowledgeEntry, CONTENT_TYPES } from '@/lib/types';
import { Tag } from '@/lib/types';
import { extractContentFromUrl } from './content-extractor';

// Define the shape of the entry for Supabase
interface SupabaseEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  url: string | null;
  type: string | null;
  tags: string[] | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export async function createKnowledgeEntry(data: {
  title: string;
  textForEmbedding: string;
  originalSource?: string;
  contentType: 'TEXT' | 'YOUTUBE_LINK' | 'X_POST_LINK' | 'TIKTOK_LINK';
  tags?: string[];
}, userId: string): Promise<KnowledgeEntry> {
  if (!supabase) throw new Error('Supabase client not initialized');

  // If it's a social media URL, try to extract content
  let finalContent = data.textForEmbedding;
  let finalTitle = data.title;
  let finalUrl = data.originalSource || '';
  let metadata = {};

  if (data.originalSource && (data.contentType === 'YOUTUBE_LINK' ||
    data.contentType === 'X_POST_LINK' ||
    data.contentType === 'TIKTOK_LINK')) {
    try {
      const extracted = await extractContentFromUrl(data.originalSource);
      finalContent = extracted.content;
      finalTitle = extracted.title;
      metadata = extracted.metadata;
    } catch (error) {
      console.warn('Failed to extract content from URL:', error);
    }
  }

  const { data: entry, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      title: finalTitle,
      content: finalContent,
      url: finalUrl,
      type: data.contentType,
      tags: data.tags || [],
      metadata: metadata
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating entry:', error);
    throw new Error(error.message);
  }

  return mapSupabaseEntryToKnowledgeEntry(entry);
}

export async function getKnowledgeEntries(
  limit: number = 24,
  cursor?: string, // cursor is usually created_at or id for pagination
  userId?: string
): Promise<{ entries: KnowledgeEntry[], nextCursor?: string }> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) {
    throw new Error('User ID is required to fetch knowledge entries');
  }

  const sanitizedLimit = Math.max(1, Math.min(100, parseInt(limit.toString()) || 9));

  let query = supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(sanitizedLimit + 1); // Fetch one extra to check for next page

  if (cursor) {
    // Assuming cursor is created_at for stable pagination
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching entries:', error);
    throw new Error(error.message);
  }

  const entries = (data || []).map(mapSupabaseEntryToKnowledgeEntry);

  let nextCursor: string | undefined;
  if (entries.length > sanitizedLimit) {
    const lastEntry = entries.pop(); // Remove the extra one
    // Use created_at as cursor
    nextCursor = entries[entries.length - 1]?.created_at;
  }

  return { entries, nextCursor };
}

export async function getKnowledgeEntry(id: string, userId: string): Promise<KnowledgeEntry | null> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) {
    throw new Error('User ID is required to get knowledge entry');
  }

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching entry:', error);
    throw new Error(error.message);
  }

  return mapSupabaseEntryToKnowledgeEntry(data);
}

export async function searchKnowledgeEntries(
  query: string,
  userId: string,
  tags?: string[]
): Promise<KnowledgeEntry[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) {
    throw new Error('User ID is required to search knowledge entries');
  }

  let dbQuery = supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId);

  // Simple text search on title and content
  // Note: For better search, consider using Supabase's Full Text Search capabilities
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
  }

  if (tags && tags.length > 0) {
    dbQuery = dbQuery.contains('tags', tags);
  }

  const { data, error } = await dbQuery.order('created_at', { ascending: false }).limit(100);

  if (error) {
    console.error('Error searching entries:', error);
    throw new Error(error.message);
  }

  return (data || []).map(mapSupabaseEntryToKnowledgeEntry);
}

export async function updateKnowledgeEntry(
  id: number | string, // Support both for compatibility
  data: {
    title?: string;
    content?: string;
    url?: string;
    type?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  },
  userId: string
): Promise<KnowledgeEntry> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) {
    throw new Error('User ID is required to update knowledge entry');
  }

  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.content !== undefined) updates.content = data.content;
  if (data.url !== undefined) updates.url = data.url;
  if (data.type !== undefined) updates.type = data.type;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.metadata !== undefined) updates.metadata = data.metadata;

  const { data: updatedEntry, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating entry:', error);
    throw new Error(error.message);
  }

  return mapSupabaseEntryToKnowledgeEntry(updatedEntry);
}

export async function deleteKnowledgeEntry(id: number | string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!userId) {
    throw new Error('User ID is required to delete knowledge entry');
  }

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting entry:', error);
    throw new Error(error.message);
  }
}

function mapSupabaseEntryToKnowledgeEntry(row: SupabaseEntry): KnowledgeEntry {
  return {
    id: row.id as any,
    user_id: row.user_id,
    title: row.title || '',
    content: row.content || '',
    url: row.url || '',
    type: (row.type as any) || 'TEXT',
    tags: row.tags || [],
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}