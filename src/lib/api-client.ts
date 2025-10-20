import { KnowledgeEntry, Tag } from '@/lib/types';
import { authClient } from '@/lib/auth-client';

const API_BASE = '/api/knowledge';

export interface KnowledgeEntriesResponse {
  entries: KnowledgeEntry[];
  nextCursor?: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  // For client-side API calls, we'll use session-based auth via cookies
  // The server will handle authentication from the session cookie
  return {
    'Content-Type': 'application/json',
  };
}

export class ApiClient {
  static async getKnowledgeEntries(cursor?: string, limit = 9): Promise<KnowledgeEntriesResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}?${params}`, {
      headers,
      cache: 'no-store', // Ensure fresh data is always fetched
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch knowledge entries');
    }
    return response.json();
  }

  static async createKnowledgeEntry(source: string, tags: Tag[], enrichedContent?: string, title?: string): Promise<KnowledgeEntry> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({ source, tags: tags.map(tag => typeof tag === 'string' ? tag : tag.toString()), enrichedContent, title }),
    });

    if (!response.ok) {
      throw new Error('Failed to create knowledge entry');
    }
    return response.json();
  }

  static async getKnowledgeEntry(id: string): Promise<KnowledgeEntry> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${id}`, {
      headers,
      cache: 'no-store', // Ensure fresh data is always fetched
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch knowledge entry');
    }
    return response.json();
  }

  static async updateKnowledgeEntry(id: string, source: string, tags: Tag[]): Promise<KnowledgeEntry> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ source, tags: tags.map(tag => typeof tag === 'string' ? tag : tag.toString()) }),
    });

    if (!response.ok) {
      throw new Error('Failed to update knowledge entry');
    }
    return response.json();
  }

  static async deleteKnowledgeEntry(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete knowledge entry');
    }
  }

  static async searchKnowledgeEntries(query: string, tags: string[] = []): Promise<KnowledgeEntry[]> {
    const params = new URLSearchParams({ q: query });
    if (tags.length > 0) {
      params.append('tags', tags.join(','));
    }
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/search?${params}`, {
      headers,
      cache: 'no-store', // Ensure fresh data is always fetched
    });
    
    if (!response.ok) {
      throw new Error('Failed to search knowledge entries');
    }
    return response.json();
  }
}