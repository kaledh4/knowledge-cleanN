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

// Get all unique tags for a user
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

    // Get all unique tags from knowledge entries
    const stmt = db.prepare(`
      SELECT DISTINCT tags
      FROM knowledge_entries
      WHERE user_id = ? AND tags IS NOT NULL AND tags != '[]'
    `);

    const rows = stmt.all(user.id) as any[];

    // Extract and parse all tags
    const allTags: string[] = [];
    rows.forEach(row => {
      try {
        const tags = JSON.parse(row.tags || '[]');
        if (Array.isArray(tags)) {
          allTags.push(...tags);
        }
      } catch (error) {
        console.warn('Failed to parse tags:', error);
      }
    });

    // Get unique tags and count usage
    const tagCounts = new Map<string, number>();
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    const result = Array.from(tagCounts.entries()).map(([tag, count]) => ({
      name: tag,
      usageCount: count
    })).sort((a, b) => b.usageCount - a.usageCount);

    return NextResponse.json({
      tags: result,
      success: true
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags', success: false },
      { status: 500 }
    );
  }
}

// Update/replace a tag across all entries
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { oldTag, newTag } = await request.json();

    if (!oldTag || !newTag) {
      return NextResponse.json(
        { error: 'Both oldTag and newTag are required' },
        { status: 400 }
      );
    }

    if (oldTag === newTag) {
      return NextResponse.json(
        { error: 'New tag must be different from old tag' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Get all entries that contain the old tag
    const selectStmt = db.prepare(`
      SELECT id, tags FROM knowledge_entries
      WHERE user_id = ? AND tags LIKE ?
    `);

    const rows = selectStmt.all(user.id, `%"${oldTag}"%`) as any[];

    let updatedCount = 0;
    const errors: string[] = [];

    // Update each entry's tags
    rows.forEach(row => {
      try {
        const tags = JSON.parse(row.tags || '[]');
        if (Array.isArray(tags)) {
          const updatedTags = tags.map(tag => tag === oldTag ? newTag : tag);
          const updatedTagsJson = JSON.stringify(updatedTags);

          const updateStmt = db.prepare(`
            UPDATE knowledge_entries
            SET tags = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);

          updateStmt.run(updatedTagsJson, row.id);
          updatedCount++;
        }
      } catch (error) {
        console.error(`Failed to update entry ${row.id}:`, error);
        errors.push(`Entry ${row.id}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      console.error('Some tag updates failed:', errors);
      return NextResponse.json(
        {
          error: 'Partial update completed with errors',
          errors,
          updatedCount,
          success: false
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedCount} entries`,
      updatedCount,
      oldTag,
      newTag,
      success: true
    });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json(
      { error: 'Failed to update tags', success: false },
      { status: 500 }
    );
  }
}

// Delete a tag from all entries
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag parameter is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Get all entries that contain the tag
    const selectStmt = db.prepare(`
      SELECT id, tags FROM knowledge_entries
      WHERE user_id = ? AND tags LIKE ?
    `);

    const rows = selectStmt.all(user.id, `%"${tag}"%`) as any[];

    let updatedCount = 0;
    const errors: string[] = [];

    // Remove the tag from each entry
    rows.forEach(row => {
      try {
        const tags = JSON.parse(row.tags || '[]');
        if (Array.isArray(tags)) {
          const updatedTags = tags.filter(t => t !== tag);
          const updatedTagsJson = JSON.stringify(updatedTags);

          const updateStmt = db.prepare(`
            UPDATE knowledge_entries
            SET tags = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);

          updateStmt.run(updatedTagsJson, row.id);
          updatedCount++;
        }
      } catch (error) {
        console.error(`Failed to update entry ${row.id}:`, error);
        errors.push(`Entry ${row.id}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      console.error('Some tag deletions failed:', errors);
      return NextResponse.json(
        {
          error: 'Partial deletion completed with errors',
          errors,
          updatedCount,
          success: false
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      message: `Successfully removed tag from ${updatedCount} entries`,
      updatedCount,
      deletedTag: tag,
      success: true
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag', success: false },
      { status: 500 }
    );
  }
}