import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userData = {
      id: session.user.id as string,
      email: (session.user.email as string) || '',
      name: session.user.name || (session.user.email as string) || '',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}