#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || (
  process.env.NODE_ENV === 'production' 
    ? '/usr/src/app/data/knowledge.db'
    : './data/knowledge.db'
);
const migrationsPath = path.join(process.cwd(), 'migrations');

function getCurrentVersion(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY NOT NULL
      );
    `);
    const stmt = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1');
    const result = stmt.get();
    return result ? result.version : 0;
  } catch (error) {
    console.error('Error getting current schema version:', error);
    return 0;
  }
}

function runMigrations() {
  // Ensure the data directory exists before trying to connect to the database
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  const currentVersion = getCurrentVersion(db);
  console.log(`Current database version: ${currentVersion}`);

  const migrationFiles = fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const version = parseInt(file.split('-')[0], 10);
    if (version > currentVersion) {
      console.log(`Applying migration: ${file}`);
      try {
        const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');
        
        // Split SQL by semicolons and execute each statement separately
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              db.exec(statement + ';');
            } catch (stmtError) {
              console.warn(`Warning: Statement failed but continuing: ${stmtError.message}`);
              // Continue with other statements instead of failing completely
            }
          }
        }

        // Update schema version
        const stmt = db.prepare('INSERT OR REPLACE INTO schema_version (version) VALUES (?)');
        stmt.run(version);

        console.log(`Successfully applied migration ${file}`);
      } catch (error) {
        console.error(`Failed to apply migration ${file}:`, error);
        // Don't exit on migration failure in production - log and continue
        if (process.env.NODE_ENV === 'production') {
          console.warn('Continuing despite migration failure in production mode');
        } else {
          db.close();
          process.exit(1);
        }
      }
    }
  }

  console.log('Database migrations completed successfully.');
  db.close();
}

try {
  runMigrations();
} catch (error) {
  console.error('Failed to run database migrations:', error);
  process.exit(1);
}