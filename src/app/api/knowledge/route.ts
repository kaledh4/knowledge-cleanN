import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeEntries, createKnowledgeEntry } from '@/lib/knowledge-actions';
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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || undefined;
    const limitParam = searchParams.get('limit');

    // Validate and sanitize limit
    let limit = 9;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit;
      }
    }

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000);
    });

    const result = await Promise.race([
      getKnowledgeEntries(limit, cursor, user.id),
      timeoutPromise
    ]) as any;

    return NextResponse.json({
      ...result,
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching knowledge entries:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return more specific error messages
    if (error.message.includes('Database connection failed')) {
      return NextResponse.json(
        {
          error: 'Database temporarily unavailable',
          success: false,
          retryAfter: 5000
        },
        { status: 503 }
      );
    }

    if (error.message.includes('Request timeout')) {
      return NextResponse.json(
        {
          error: 'Request took too long',
          success: false
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch knowledge entries',
        success: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { source, tags, enrichedContent, title: clientTitle } = body;

    if (!source || typeof source !== 'string' || source.trim().length < 1) {
      return NextResponse.json(
        { error: 'Source (text or URL) is required' },
        { status: 400 }
      );
    }

    const isUrl = (str: string) => {
      try { new URL(str); return true; } catch { return false; }
    };

    const mapUrlToContentType = (str: string) => {
      const s = str.toLowerCase();
      if (/(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(s)) return 'YOUTUBE_LINK' as const;
      if (/(tiktok\.com|tiktokcdn\.com)/i.test(s)) return 'TIKTOK_LINK' as const;
      if (/(x\.com|twitter\.com)/i.test(s)) return 'X_POST_LINK' as const;
      return 'TEXT' as const;
    };

    let entryData: {
      title: string;
      textForEmbedding: string;
      originalSource?: string;
      contentType: 'TEXT' | 'YOUTUBE_LINK' | 'X_POST_LINK' | 'TIKTOK_LINK';
      tags?: string[];
    };

    if (isUrl(source)) {
      const contentType = mapUrlToContentType(source);
      entryData = {
        title: clientTitle || 'Loading content...',
        textForEmbedding: (enrichedContent && typeof enrichedContent === 'string') ? enrichedContent : '',
        originalSource: source,
        contentType,
        tags: tags || [],
      };
    } else {
      const trimmed = source.trim();
      const firstLine = trimmed.split('\n')[0];
      const title = firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine || 'Untitled';
      entryData = {
        title,
        textForEmbedding: trimmed,
        contentType: 'TEXT',
        tags: tags || [],
      };
    }

    const entry = await createKnowledgeEntry(entryData, user.id);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge entry' },
      { status: 500 }
    );
  }
}