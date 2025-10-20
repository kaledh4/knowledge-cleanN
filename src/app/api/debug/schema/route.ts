import { getDatabase } from '@/lib/sqlite';
import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development/staging
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 });
  }

  try {
    const db = getDatabase();
    
    // Get all tables
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();
    
    // Get users table schema
    const usersSchema = db.prepare(
      "PRAGMA table_info(users)"
    ).all();
    
    // Get schema version
    const schemaVersion = db.prepare(
      "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
    ).get();
    
    // Get sample user count
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
    
    return NextResponse.json({
      tables: tables,
      usersSchema: usersSchema,
      schemaVersion: schemaVersion?.version || 0,
      userCount: userCount?.count || 0
    });
  } catch (error) {
    console.error('Schema debug error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}