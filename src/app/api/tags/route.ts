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

    // Get all unique tags from the tags table and their usage counts
    const stmt = db.prepare(`
        SELECT
            t.name,
            (SELECT COUNT(*) FROM knowledge_entries ke WHERE ke.user_id = t.user_id AND ke.tags LIKE '%' || t.name || '%') as usageCount
        FROM
            tags t
        WHERE
            t.user_id = ?
        ORDER BY
            usageCount DESC
    `);

    const result = stmt.all(user.id);

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

// Add a new tag
export async function POST(request: NextRequest) {
    try {
      const user = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const { name } = await request.json();

      if (!name) {
        return NextResponse.json(
          { error: 'Tag name is required' },
          { status: 400 }
        );
      }

      const db = getDatabase();

      const stmt = db.prepare(`
        INSERT INTO tags (user_id, name, is_custom)
        VALUES (?, ?, 1)
      `);

      stmt.run(user.id, name);

      return NextResponse.json({
        message: 'Tag created successfully',
        success: true
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json(
        { error: 'Failed to create tag', success: false },
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

    db.transaction(() => {
        // Update the tags table
        const updateTagStmt = db.prepare(`
          UPDATE tags
          SET name = ?
          WHERE user_id = ? AND name = ?
        `);
        updateTagStmt.run(newTag, user.id, oldTag);

        // Get all entries that contain the old tag
        const selectStmt = db.prepare(`
          SELECT id, tags FROM knowledge_entries
          WHERE user_id = ? AND tags LIKE ?
        `);

        const rows = selectStmt.all(user.id, `%"${oldTag}"%`) as any[];

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
            }
          } catch (error) {
            console.error(`Failed to update entry ${row.id}:`, error);
            throw error;
          }
        });
    })();


    return NextResponse.json({
      message: `Successfully updated tag`,
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

    db.transaction(() => {
        // Delete the tag from the tags table
        const deleteTagStmt = db.prepare(`
          DELETE FROM tags
          WHERE user_id = ? AND name = ?
        `);
        deleteTagStmt.run(user.id, tag);

        // Get all entries that contain the tag
        const selectStmt = db.prepare(`
          SELECT id, tags FROM knowledge_entries
          WHERE user_id = ? AND tags LIKE ?
        `);

        const rows = selectStmt.all(user.id, `%"${tag}"%`) as any[];

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
            }
          } catch (error) {
            console.error(`Failed to update entry ${row.id}:`, error);
            throw error;
          }
        });
    })();


    return NextResponse.json({
      message: `Successfully deleted tag`,
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