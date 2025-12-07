export interface KnowledgeEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  url?: string;
  type: 'TEXT' | 'YOUTUBE_LINK' | 'X_POST_LINK' | 'TIKTOK_LINK';
  tags: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export const CONTENT_TYPES = {
  TEXT: 'TEXT',
  YOUTUBE_LINK: 'YOUTUBE_LINK',
  X_POST_LINK: 'X_POST_LINK',
  TIKTOK_LINK: 'TIKTOK_LINK',
} as const;

export type ContentType = keyof typeof CONTENT_TYPES;
