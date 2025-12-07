# Database Schema Documentation

This document describes the database structure for KnowledgeVerse, powered by Supabase PostgreSQL.

## Overview

KnowledgeVerse uses **Supabase** as its backend, which provides:
- PostgreSQL database
- Row-Level Security (RLS)
- Real-time subscriptions
- Built-in authentication

## Core Tables

### `auth.users` (Supabase Managed)

Built-in authentication table managed by Supabase.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key, auto-generated |
| `email` | varchar | User's email address |
| `encrypted_password` | varchar | Hashed password |
| `created_at` | timestamp | Account creation time |
| `updated_at` | timestamp | Last update time |
| `email_confirmed_at` | timestamp | Email confirmation time |

### `knowledge_entries`

Stores individual knowledge entries created by users.

```sql
create table knowledge_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | References auth.users(id) |
| `title` | text | NOT NULL | Entry title |
| `content` | text | NOT NULL | Entry content/notes |
| `tags` | text[] | DEFAULT '{}' | Array of tag names |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | Last update timestamp |

**Row-Level Security Policies:**

```sql
-- Users can view their own entries
create policy "Users can view own knowledge entries"
  on knowledge_entries for select
  using (auth.uid() = user_id);

-- Users can insert their own entries
create policy "Users can insert own knowledge entries"
  on knowledge_entries for insert
  with check (auth.uid() = user_id);

-- Users can update their own entries
create policy "Users can update own knowledge entries"
  on knowledge_entries for update
  using (auth.uid() = user_id);

-- Users can delete their own entries
create policy "Users can delete own knowledge entries"
  on knowledge_entries for delete
  using (auth.uid() = user_id);
```

### `tags`

Stores tag configurations including names and colors.

```sql
create table tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#3b82f6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | References auth.users(id) |
| `name` | text | NOT NULL | Tag name |
| `color` | text | DEFAULT '#3b82f6' | Hex color code |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |

**Unique Constraint:**
- `(user_id, name)` - Prevents duplicate tag names per user

**Row-Level Security Policies:**

```sql
-- Users can manage their own tags
create policy "Users can manage own tags"
  on tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### `insights` (Optional AI Feature)

Stores AI-generated insights and knowledge analysis.

```sql
create table insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | References auth.users(id) |
| `content` | text | NOT NULL | AI-generated insights (JSON) |
| `created_at` | timestamptz | NOT NULL | Creation timestamp |

**Row-Level Security Policies:**

```sql
create policy "Users can view their own insights"
  on insights for select
  using (auth.uid() = user_id);
```

> **Note**: Insights are typically created by the service role via GitHub Actions, not directly by users.

## Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
│  (Supabase)     │
│─────────────────│
│ id (PK)         │
│ email           │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴──────────────────────────┐
    │                               │
    │                               │
┌───▼──────────────┐    ┌──────────▼─────┐    ┌─────────────────┐
│knowledge_entries │    │     tags       │    │    insights     │
│──────────────────│    │────────────────│    │─────────────────│
│ id (PK)          │    │ id (PK)        │    │ id (PK)         │
│ user_id (FK)     │    │ user_id (FK)   │    │ user_id (FK)    │
│ title            │    │ name           │    │ content         │
│ content          │    │ color          │    │ created_at      │
│ tags[]           │    │ created_at     │    └─────────────────┘
│ created_at       │    └────────────────┘
│ updated_at       │
└──────────────────┘
```

## Indexes

For optimal query performance, consider adding these indexes:

```sql
-- Index on user_id for faster queries
create index idx_knowledge_entries_user_id on knowledge_entries(user_id);
create index idx_tags_user_id on tags(user_id);
create index idx_insights_user_id on insights(user_id);

-- Index on created_at for sorting
create index idx_knowledge_entries_created_at on knowledge_entries(created_at desc);
create index idx_insights_created_at on insights(created_at desc);

-- GIN index for tag array searches (PostgreSQL specific)
create index idx_knowledge_entries_tags on knowledge_entries using gin(tags);

-- Text search index for content searching
create index idx_knowledge_entries_content_search on knowledge_entries using gin(to_tsvector('english', content));
```

## Migrations

All database migrations are located in the `/migrations` folder and should be executed in order:

1. **001-initial-schema-version.sql** - Sets up schema versioning
2. **002-create-initial-tables.sql** - Creates knowledge_entries table
3. **003-fix-users-table-schema.sql** - Adjusts user table schema
4. **006-create-tags-table.sql** - Creates tags table
5. **supabase_schema.sql** - Creates insights table (optional)

## Common Queries

### Get all entries for a user

```sql
select *
from knowledge_entries
where user_id = auth.uid()
order by created_at desc;
```

### Search entries by tag

```sql
select *
from knowledge_entries
where user_id = auth.uid()
  and 'coding' = any(tags)
order by created_at desc;
```

### Full-text search in entries

```sql
select *
from knowledge_entries
where user_id = auth.uid()
  and to_tsvector('english', content) @@ plainto_tsquery('english', 'search term')
order by created_at desc;
```

### Get all tags with entry count

```sql
select
  t.id,
  t.name,
  t.color,
  count(ke.id) as entry_count
from tags t
left join knowledge_entries ke on ke.user_id = t.user_id
  and t.name = any(ke.tags)
where t.user_id = auth.uid()
group by t.id, t.name, t.color
order by t.name;
```

### Get most recent insight

```sql
select *
from insights
where user_id = auth.uid()
order by created_at desc
limit 1;
```

## Row-Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data.

**Key Points:**
- ✅ RLS is **enabled** on all user data tables
- ✅ Policies enforce `user_id = auth.uid()` checks
- ✅ Service role key bypasses RLS (for admin/scheduled tasks)
- ✅ Cascading deletes ensure data cleanup when user is deleted

## Data Types

### UUID
All IDs use PostgreSQL's `uuid` type with `uuid_generate_v4()` for generation.

### Timestamps
All timestamps use `timestamp with time zone` for proper timezone handling.

### Arrays
Tags are stored as PostgreSQL text arrays (`text[]`) for efficient storage and querying.

### JSON (Future)
The `insights.content` field stores JSON data as text. Consider using `jsonb` for better querying:

```sql
alter table insights
alter column content type jsonb using content::jsonb;
```

## Backup & Recovery

### Automatic Backups (Supabase)

Supabase provides automatic daily backups for Pro plans and above.

### Manual Backup

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or via pg_dump
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

### Restore

```bash
# Using Supabase CLI
supabase db reset
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql
```

## Performance Considerations

1. **Indexes**: Add indexes on frequently queried columns
2. **Pagination**: Use `limit` and `offset` for large result sets
3. **Partial Indexes**: Create indexes on filtered subsets if needed
4. **Connection Pooling**: Supabase handles this automatically
5. **Query Optimization**: Use `explain analyze` to optimize slow queries

## Security Best Practices

- ✅ **Never expose service_role key** to client
- ✅ **Always use anon key** in frontend code  
- ✅ **RLS policies** protect all user data
- ✅ **Foreign keys with CASCADE** ensure referential integrity
- ✅ **Input validation** on application layer
- ✅ **Prepared statements** prevent SQL injection (handled by Supabase client)

## Extending the Schema

### Adding a New Table

1. Create SQL migration file in `/migrations`
2. Define table with RLS policies
3. Run migration in Supabase SQL Editor
4. Update TypeScript types in your app
5. Create Supabase client queries

Example:
```sql
-- Create flashcards table
create table flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  knowledge_entry_id uuid references knowledge_entries(id) on delete cascade,
  question text not null,
  answer text not null,
  difficulty integer default 1,
  next_review timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table flashcards enable row level security;

-- Create policies
create policy "Users can manage own flashcards"
  on flashcards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Troubleshooting

### "relation does not exist"
- **Cause**: Migration not run or table not created
- **Fix**: Run all migrations in order in Supabase SQL Editor

### "permission denied for table"
- **Cause**: RLS policy not configured correctly
- **Fix**: Check RLS policies and ensure `auth.uid()` matches `user_id`

### "duplicate key value violates unique constraint"
- **Cause**: Trying to insert duplicate tag name for same user
- **Fix**: Check for existing tag before inserting, or use `on conflict do nothing`

## Additional Resources

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

Last updated: 2025-12-07
