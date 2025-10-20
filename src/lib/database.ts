// SQLite Database Types and Configuration
export interface KnowledgeEntry {
  id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  type: 'TEXT' | 'YOUTUBE_LINK' | 'X_POST_LINK' | 'TIKTOK_LINK';
  title: string;
  content: string;
  url: string;
  tags: string[]; // JSON array of tags
  metadata: Record<string, any>; // JSON object for additional data
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

// Content types for knowledge entries
export const CONTENT_TYPES = {
  TEXT: 'TEXT' as const,
  YOUTUBE_LINK: 'YOUTUBE_LINK' as const,
  X_POST_LINK: 'X_POST_LINK' as const,
  TIKTOK_LINK: 'TIKTOK_LINK' as const
};

export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];