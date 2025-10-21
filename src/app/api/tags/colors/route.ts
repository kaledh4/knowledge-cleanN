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

// GET: Get all tag colors for a user
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

    // Create tag_colors table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS tag_colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        background_color TEXT NOT NULL,
        border_color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tag_name)
      );
    `);

    const stmt = db.prepare(`
      SELECT tag_name, background_color, border_color, text_color
      FROM tag_colors
      WHERE user_id = ?
    `);

    const rows = stmt.all(user.id) as any[];

    const tagColors: Record<string, {
      backgroundColor: string;
      borderColor: string;
      textColor: string;
    }> = {};

    rows.forEach(row => {
      tagColors[row.tag_name] = {
        backgroundColor: row.background_color,
        borderColor: row.border_color,
        textColor: row.text_color
      };
    });

    return NextResponse.json({
      tagColors,
      success: true
    });
  } catch (error) {
    console.error('Error fetching tag colors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag colors', success: false },
      { status: 500 }
    );
  }
}

// POST: Update or create tag color
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { tagName, backgroundColor, borderColor, textColor } = await request.json();

    if (!tagName || !backgroundColor || !borderColor || !textColor) {
      return NextResponse.json(
        { error: 'Missing required fields: tagName, backgroundColor, borderColor, textColor' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Create tag_colors table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS tag_colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        background_color TEXT NOT NULL,
        border_color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tag_name)
      );
    `);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tag_colors
      (user_id, tag_name, background_color, border_color, text_color, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(user.id, tagName, backgroundColor, borderColor, textColor);

    return NextResponse.json({
      message: 'Tag color updated successfully',
      tagName,
      colors: {
        backgroundColor,
        borderColor,
        textColor
      },
      success: true
    });
  } catch (error) {
    console.error('Error updating tag color:', error);
    return NextResponse.json(
      { error: 'Failed to update tag color', success: false },
      { status: 500 }
    );
  }
}

// DELETE: Remove tag color (revert to default)
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
    const tagName = searchParams.get('tag');

    if (!tagName) {
      return NextResponse.json(
        { error: 'Tag parameter is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    const stmt = db.prepare(`
      DELETE FROM tag_colors
      WHERE user_id = ? AND tag_name = ?
    `);

    const result = stmt.run(user.id, tagName);

    return NextResponse.json({
      message: result.changes > 0 ? 'Tag color removed successfully' : 'No custom color found for this tag',
      tagName,
      changes: result.changes,
      success: true
    });
  } catch (error) {
    console.error('Error deleting tag color:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag color', success: false },
      { status: 500 }
    );
  }
}