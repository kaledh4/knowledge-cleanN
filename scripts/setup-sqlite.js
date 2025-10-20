#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'data', 'knowledge.db');

async function setupSQLiteDatabase() {
  console.log('Setting up SQLite database...');

  try {
    // Ensure the data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create or open the database
    const db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create users table
    console.log('Creating users table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        encrypted_password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create sessions table
    console.log('Creating sessions table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);

    // Create knowledge_entries table
    console.log('Creating knowledge_entries table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        url TEXT,
        type TEXT NOT NULL CHECK (type IN ('TEXT', 'YOUTUBE_LINK', 'X_POST_LINK', 'TIKTOK_LINK')),
        tags TEXT DEFAULT '[]', -- JSON array stored as text
        metadata TEXT DEFAULT '{}', -- JSON object stored as text
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_id ON knowledge_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_entries_created_at ON knowledge_entries(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_knowledge_entries_type ON knowledge_entries(type);
    `);

    // Clean up expired sessions
    db.exec(`
      DELETE FROM sessions WHERE expires_at < datetime('now');
    `);

    console.log('✓ SQLite database setup completed successfully!');
    console.log('✓ Tables created: users, sessions, knowledge_entries');
    console.log('✓ Indexes created for optimal performance');
    console.log(`✓ Database file created at: ${dbPath}`);

    // Close the database connection
    db.close();

  } catch (error) {
    console.error('Error setting up SQLite database:', error);
    process.exit(1);
  }
}

// Run the setup
setupSQLiteDatabase()
  .then(() => {
    console.log('Database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });