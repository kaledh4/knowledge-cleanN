import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeEntry, updateKnowledgeEntry, deleteKnowledgeEntry } from '@/lib/knowledge-actions';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await getKnowledgeEntry(params.id, user.id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge entry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { source, tags } = body;

    if (!source || typeof source !== 'string' || source.trim().length < 1) {
      return NextResponse.json(
        { error: 'Source (text) is required for update' },
        { status: 400 }
      );
    }

    const entry = await updateKnowledgeEntry(
      parseInt(params.id),
      {
        content: source.trim(),
        tags: tags || [],
      },
      user.id
    );

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteKnowledgeEntry(parseInt(params.id), user.id);

    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge entry' },
      { status: 500 }
    );
  }
}