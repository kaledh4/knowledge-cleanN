import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/sqlite';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getAuthenticatedUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;
    return {
      id: session.user.id as string,
      email: session.user.email as string,
      name: session.user.name || (session.user.email as string),
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

interface MCPKnowledgeEntry {
  id: number;
  title: string;
  content: string;
  url: string;
  type: 'TEXT' | 'YOUTUBE_LINK' | 'X_POST_LINK' | 'TIKTOK_LINK';
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  content_hash: string;
  word_count: number;
  semantic_category: string;
  entities: string[];
  relationships: {
    type: 'similar' | 'related' | 'reference';
    target_id: number;
    confidence: number;
  }[];
}

interface MCPExport {
  version: string;
  format: 'MCP_KNOWLEDGE_VAULT';
  created_at: string;
  user: {
    id: string;
    name: string;
  };
  metadata: {
    total_entries: number;
    total_tags: number;
    date_range: {
      earliest: string;
      latest: string;
    };
    content_types: Record<string, number>;
    tag_frequency: Record<string, number>;
  };
  entries: MCPKnowledgeEntry[];
  relationships: Array<{
    source_id: number;
    target_id: number;
    type: 'semantic' | 'temporal' | 'thematic';
    weight: number;
    description: string;
  }>;
  semantic_summary: {
    main_topics: string[];
    knowledge_domains: string[];
    content_density: number;
    growth_trend: Array<{
      date: string;
      entries_count: number;
    }>;
  };
}

function generateContentHash(content: string): string {
  // Simple hash function for content identification
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

function extractSemanticCategory(entry: any): string {
  const content = `${entry.title} ${entry.content}`.toLowerCase();

  // Define category keywords
  const categories = {
    'Technology': ['code', 'programming', 'software', 'development', 'api', 'tech', 'digital'],
    'AI & Machine Learning': ['ai', 'machine learning', 'neural', 'algorithm', 'model', 'training'],
    'Business & Finance': ['business', 'finance', 'investment', 'market', 'revenue', 'profit'],
    'Science & Research': ['research', 'study', 'experiment', 'scientific', 'analysis', 'data'],
    'Education & Learning': ['learn', 'education', 'course', 'tutorial', 'knowledge', 'study'],
    'Productivity & Tools': ['productivity', 'tool', 'workflow', 'efficiency', 'management'],
    'Social & Communication': ['social', 'communication', 'network', 'community', 'collaboration'],
    'Personal Development': ['personal', 'growth', 'self', 'development', 'skills', 'habit'],
    'News & Current Events': ['news', 'current', 'event', 'update', 'announcement', 'report'],
    'Entertainment & Media': ['video', 'music', 'movie', 'entertainment', 'media', 'content']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

function extractEntities(content: string): string[] {
  const entities: string[] = [];

  // Simple entity extraction - look for capitalized words, URLs, hashtags
  const words = content.split(/\s+/);

  words.forEach(word => {
    // URLs
    if (word.startsWith('http')) {
      entities.push('URL');
    }
    // Hashtags
    if (word.startsWith('#')) {
      entities.push(word.slice(1));
    }
    // Mentions
    if (word.startsWith('@')) {
      entities.push(word.slice(1));
    }
    // Capitalized words (potential entities)
    if (word.length > 2 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      entities.push(word);
    }
  });

  return [...new Set(entities)]; // Remove duplicates
}

function calculateRelationships(entries: any[]): Array<{source_id: number; target_id: number; type: string; weight: number; description: string}> {
  const relationships = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entry1 = entries[i];
      const entry2 = entries[j];

      // Calculate similarity based on shared tags
      const tags1 = new Set(entry1.tags);
      const tags2 = new Set(entry2.tags);
      const sharedTags = [...tags1].filter(tag => tags2.has(tag));

      if (sharedTags.length > 0) {
        relationships.push({
          source_id: entry1.id,
          target_id: entry2.id,
          type: 'thematic',
          weight: sharedTags.length / Math.max(tags1.size, tags2.size),
          description: `Shared tags: ${sharedTags.join(', ')}`
        });
      }

      // Temporal relationship (entries created close in time)
      const date1 = new Date(entry1.created_at);
      const date2 = new Date(entry2.created_at);
      const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 7) { // Within a week
        relationships.push({
          source_id: entry1.id,
          target_id: entry2.id,
          type: 'temporal',
          weight: 1 - (daysDiff / 7),
          description: `Created ${Math.round(daysDiff)} days apart`
        });
      }
    }
  }

  return relationships.sort((a, b) => b.weight - a.weight).slice(0, 100); // Top 100 relationships
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const db = getDatabase();

    // Get all knowledge entries for the user
    const entriesStmt = db.prepare(`
      SELECT id, title, content, url, type, tags, metadata, created_at, updated_at
      FROM knowledge_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);

    const rows = entriesStmt.all(user.id) as any[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No knowledge entries found to export' },
        { status: 404 }
      );
    }

    // Process entries for MCP format
    const processedEntries: MCPKnowledgeEntry[] = rows.map(row => {
      const tags = JSON.parse(row.tags || '[]');
      const metadata = JSON.parse(row.metadata || '{}');
      const content = row.content || '';

      return {
        id: row.id,
        title: row.title || '',
        content: content,
        url: row.url || '',
        type: row.type,
        tags: tags,
        metadata: metadata,
        created_at: row.created_at,
        updated_at: row.updated_at,
        content_hash: generateContentHash(content),
        word_count: content.split(/\s+/).length,
        semantic_category: extractSemanticCategory(row),
        entities: extractEntities(content),
        relationships: [] // Will be calculated separately
      };
    });

    // Calculate relationships
    const relationships = calculateRelationships(rows);

    // Calculate metadata
    const allTags = processedEntries.flatMap(entry => entry.tags);
    const tagFrequency: Record<string, number> = {};
    allTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });

    const contentTypes: Record<string, number> = {};
    processedEntries.forEach(entry => {
      contentTypes[entry.type] = (contentTypes[entry.type] || 0) + 1;
    });

    const dates = processedEntries.map(entry => entry.created_at);
    const earliestDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
    const latestDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));

    // Generate semantic summary
    const semanticCategories = [...new Set(processedEntries.map(entry => entry.semantic_category))];
    const mainTopics = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    // Create growth trend (monthly aggregation)
    const monthlyData: Record<string, number> = {};
    processedEntries.forEach(entry => {
      const month = entry.created_at.slice(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const growthTrend = Object.entries(monthlyData)
      .map(([date, entries_count]) => ({ date, entries_count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build MCP export structure
    const mcpExport: MCPExport = {
      version: '1.0.0',
      format: 'MCP_KNOWLEDGE_VAULT',
      created_at: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name
      },
      metadata: {
        total_entries: processedEntries.length,
        total_tags: Object.keys(tagFrequency).length,
        date_range: {
          earliest: earliestDate.toISOString(),
          latest: latestDate.toISOString()
        },
        content_types: contentTypes,
        tag_frequency: tagFrequency
      },
      entries: processedEntries,
      relationships: relationships,
      semantic_summary: {
        main_topics: mainTopics,
        knowledge_domains: semanticCategories,
        content_density: processedEntries.reduce((sum, entry) => sum + entry.word_count, 0) / processedEntries.length,
        growth_trend: growthTrend
      }
    };

    // Create response with download headers
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `knowledge-vault-mcp-${timestamp}.json`;

    return new NextResponse(JSON.stringify(mcpExport, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error creating MCP export:', error);
    return NextResponse.json(
      { error: 'Failed to create MCP export', details: error.message },
      { status: 500 }
    );
  }
}