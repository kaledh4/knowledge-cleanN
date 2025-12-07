export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}
