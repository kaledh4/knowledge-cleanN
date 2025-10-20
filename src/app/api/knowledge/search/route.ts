import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeEntries } from '@/lib/knowledge-actions';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : [];

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = await searchKnowledgeEntries(query, user.id, tags);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching knowledge entries:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge entries' },
      { status: 500 }
    );
  }
}