import { getDatabase, withDatabaseRetry } from '@/lib/sqlite';
import { KnowledgeEntry, CONTENT_TYPES } from '@/lib/database';
import { Tag } from '@/lib/types';
import { extractContentFromUrl } from './content-extractor';

export async function createKnowledgeEntry(data: {
  title: string;
  textForEmbedding: string;
  originalSource?: string;
  contentType: 'TEXT' | 'YOUTUBE_LINK' | 'X_POST_LINK' | 'TIKTOK_LINK';
  tags?: string[];
}, userId: string): Promise<KnowledgeEntry & { tags: Tag[] }> {
  const db = await getDatabase();
  
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
  
  const stmt = db.prepare(`
    INSERT INTO knowledge_entries (user_id, title, content, url, type, tags, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const tagsJson = JSON.stringify(data.tags || []);
  const metadataJson = JSON.stringify(metadata);
  
  const result = stmt.run(
    userId,
    finalTitle,
    finalContent,
    finalUrl,
    data.contentType,
    tagsJson,
    metadataJson
  );
  
  const newEntry: KnowledgeEntry = {
    id: result.lastInsertRowid as number,
    user_id: userId,
    title: finalTitle,
    content: finalContent,
    url: finalUrl,
    type: data.contentType,
    tags: data.tags || [],
    metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return { ...newEntry, tags: newEntry.tags };
}

export async function getKnowledgeEntries(
  limit: number = 9,
  cursor?: string,
  userId?: string
): Promise<{ entries: (KnowledgeEntry & { tags: Tag[] })[], nextCursor?: string }> {
  if (!userId) {
    throw new Error('User ID is required to fetch knowledge entries');
  }

  // Validate limit
  const sanitizedLimit = Math.max(1, Math.min(100, parseInt(limit.toString()) || 9));

  return withDatabaseRetry(async () => {
    const db = getDatabase();

    // Simplified pagination logic to avoid complex subqueries
    let query = `
      SELECT id, user_id, title, content, url, type, tags, metadata, created_at, updated_at
      FROM knowledge_entries
      WHERE user_id = ?
    `;

    const params: any[] = [userId];

    if (cursor && !isNaN(parseInt(cursor))) {
      query += ` AND id < ?`;
      params.push(parseInt(cursor));
    }

    query += ` ORDER BY id DESC LIMIT ?`;
    params.push(sanitizedLimit + 1); // Fetch one extra to determine if there's a next page

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    // Safe JSON parsing with error handling
    const entries = rows.map(row => {
      try {
        return {
          id: row.id,
          user_id: row.user_id,
          title: row.title || '',
          content: row.content || '',
          url: row.url || '',
          type: row.type || 'TEXT',
          tags: safeJsonParse(row.tags, []),
          metadata: safeJsonParse(row.metadata, {}),
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      } catch (error) {
        console.error('Error processing database row:', error, { row });
        // Return a safe default entry for malformed data
        return {
          id: row.id,
          user_id: row.user_id,
          title: 'Error loading title',
          content: 'Error loading content',
          url: '',
          type: 'TEXT' as const,
          tags: [],
          metadata: {},
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      }
    });

    let nextCursor: string | undefined;
    if (entries.length > sanitizedLimit) {
      const lastEntry = entries.pop();
      nextCursor = lastEntry?.id.toString();
    }

    return { entries, nextCursor };
  });
}

// Helper function for safe JSON parsing
function safeJsonParse(jsonString: string, defaultValue: any): any {
  if (!jsonString || jsonString.trim() === '') {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message, { input: jsonString });
    return defaultValue;
  }
}

// (Removed duplicate updateKnowledgeEntry/deleteKnowledgeEntry definitions)

export async function getKnowledgeEntry(id: string, userId: string): Promise<(KnowledgeEntry & { tags: Tag[] }) | null> {
  if (!userId) {
    throw new Error('User ID is required to get knowledge entry');
  }

  let db;
  try {
    db = getDatabase();
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw new Error('Database connection failed');
  }

  try {
    const stmt = db.prepare(`
      SELECT id, user_id, title, content, url, type, tags, metadata, created_at, updated_at
      FROM knowledge_entries
      WHERE id = ? AND user_id = ?
    `);

    const row = stmt.get(id, userId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title || '',
      content: row.content || '',
      url: row.url || '',
      type: row.type || 'TEXT',
      tags: safeJsonParse(row.tags, []),
      metadata: safeJsonParse(row.metadata, {}),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } catch (error) {
    console.error('Failed to fetch knowledge entry:', error);
    throw new Error('Failed to fetch entry from database');
  }
}

export async function searchKnowledgeEntries(
  query: string,
  userId: string,
  tags?: string[]
): Promise<(KnowledgeEntry & { tags: Tag[] })[]> {
  if (!userId) {
    throw new Error('User ID is required to search knowledge entries');
  }

  let db;
  try {
    db = getDatabase();
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw new Error('Database connection failed');
  }

  try {
    const searchTerm = `%${query.toLowerCase()}%`;

    let sql = `
      SELECT id, user_id, title, content, url, type, tags, metadata, created_at, updated_at
      FROM knowledge_entries
      WHERE user_id = ? AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)
    `;

    const params: any[] = [userId, searchTerm, searchTerm];

    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        sql += ` AND EXISTS (SELECT 1 FROM json_each(tags) WHERE LOWER(value) = LOWER(?))`;
        params.push(tag);
      });
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`; // Add reasonable limit

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title || '',
      content: row.content || '',
      url: row.url || '',
      type: row.type || 'TEXT',
      tags: safeJsonParse(row.tags, []),
      metadata: safeJsonParse(row.metadata, {}),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('Failed to search knowledge entries:', error);
    throw new Error('Failed to search entries in database');
  }
}

export async function updateKnowledgeEntry(
  id: number,
  data: {
    title?: string;
    content?: string;
    url?: string;
    type?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  },
  userId: string
): Promise<KnowledgeEntry & { tags: Tag[] }> {
  if (!userId) {
    throw new Error('User ID is required to update knowledge entry');
  }

  const db = await getDatabase();
  
  // Build dynamic update query
  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const values: any[] = [];
  
  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.content !== undefined) {
    updates.push('content = ?');
    values.push(data.content);
  }
  if (data.url !== undefined) {
    updates.push('url = ?');
    values.push(data.url);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.tags !== undefined) {
    updates.push('tags = ?');
    values.push(JSON.stringify(data.tags));
  }
  if (data.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(JSON.stringify(data.metadata));
  }
  
  values.push(id, userId); // WHERE clause parameters
  
  const query = `
    UPDATE knowledge_entries 
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `;
  
  const stmt = db.prepare(query);
  const result = stmt.run(...values);
  
  if (result.changes === 0) {
    throw new Error('Knowledge entry not found or unauthorized');
  }
  
  // Return updated entry
  return getKnowledgeEntry(id.toString(), userId) as Promise<KnowledgeEntry & { tags: Tag[] }>;
}

export async function deleteKnowledgeEntry(id: number, userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to delete knowledge entry');
  }

  const db = await getDatabase();
  const stmt = db.prepare('DELETE FROM knowledge_entries WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  
  if (result.changes === 0) {
    throw new Error('Knowledge entry not found or unauthorized');
  }
}