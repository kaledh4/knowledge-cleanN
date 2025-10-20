import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/sqlite';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    console.log('Attempting to get database connection...');
    const db = getDatabase();
    console.log('Database connection established successfully');
    
    const normalizedEmail = String(email).trim().toLowerCase();
    console.log('Checking if user exists:', normalizedEmail);

    // Check if user already exists
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(normalizedEmail);

    if (existing) {
      console.log('User already exists:', normalizedEmail);
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    console.log('Creating new user:', normalizedEmail);
    const hashed = await bcrypt.hash(String(password), 10);
    const userId = crypto.randomUUID();

    // Insert new user
    const insertStmt = db.prepare(
      'INSERT INTO users (id, email, encrypted_password, name, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    );
    
    console.log('Inserting user with email:', normalizedEmail);
    insertStmt.run(userId, normalizedEmail, hashed, name || null);
    console.log('User registered successfully with ID:', userId);

    return NextResponse.json({ 
      message: 'User registered successfully',
      redirect: '/login'
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code || 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}