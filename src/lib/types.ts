export const DEFAULT_TAGS = [
  'To Do Research On',
  'Important',
  'Learning',
  'Investing',
  'AI',
  'Finance',
] as const;

export type Tag = string; // Allow any string as a tag for more flexibility

// Helper to check if a tag is a default tag
export function isDefaultTag(tag: string): tag is typeof DEFAULT_TAGS[number] {
  return DEFAULT_TAGS.includes(tag as typeof DEFAULT_TAGS[number]);
}

// Re-export KnowledgeEntry from database for consistency
export type { KnowledgeEntry } from '@/lib/database';
