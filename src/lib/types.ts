export const TAGS = [
  'To Do Research On',
  'Important',
  'Learning',
  'Investing',
  'AI',
  'Finance',
] as const;

export type Tag = (typeof TAGS)[number];

// Re-export KnowledgeEntry from database for consistency
export type { KnowledgeEntry } from '@/lib/database';
