let db: any = null;
let lastMigrationTime = 0;
const MIGRATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

// Ensure this runs only on the server
if (typeof window !== 'undefined') {
  throw new Error('SQLite module can only be used server-side');
}

// Import Node.js modules only on server side
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { execSync } = require('child_process');

// Use consistent database path for both development and production
const dbPath = process.env.DB_PATH || (
  process.env.NODE_ENV === 'production'
    ? '/usr/src/app/data/knowledge.db'
    : './data/knowledge.db'
);

function runMigrations() {
  // This check prevents migrations from running during the 'next build' phase.
  // The 'npm_lifecycle_script' variable is set by npm and contains the command being executed.
  // We only want to run migrations when the application is starting, not building.
  if (process.env.npm_lifecycle_script && process.env.npm_lifecycle_script.includes('next build')) {
    console.log('Skipping database migrations during build phase.');
    return;
  }

  // Add cooldown to prevent migration conflicts
  const now = Date.now();
  if (now - lastMigrationTime < MIGRATION_COOLDOWN) {
    console.log('Skipping database migrations - cooldown period active.');
    return;
  }

  console.log('Running database migrations...');
  try {
    execSync('node scripts/migrate-db.js', { stdio: 'inherit', timeout: 30000 });
    console.log('Database migrations completed successfully.');
    lastMigrationTime = now;
  } catch (error) {
    console.error('Failed to run database migrations:', error);
    // Don't exit on migration failure - allow the app to continue
    throw new Error(`Migration failed: ${error.message}`);
  }
}

function isDatabaseValid(dbInstance: any): boolean {
  if (!dbInstance) return false;

  try {
    // Test the database connection with a simple query
    dbInstance.prepare('SELECT 1').get();
    return true;
  } catch (error) {
    console.warn('Database connection test failed:', error.message);
    return false;
  }
}

export function getDatabase(): any {
  // Check if existing connection is valid
  if (db && !isDatabaseValid(db)) {
    console.warn('Stale database connection detected, closing and reopening...');
    try {
      db.close();
    } catch (error) {
      console.warn('Error closing stale database connection:', error.message);
    }
    db = null;
  }

  if (!db) {
    // Ensure the data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      // Run migrations before connecting (with cooldown)
      runMigrations();

      db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
      db.pragma('foreign_keys = ON');
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 30000'); // 30 second timeout
      db.pragma('cache_size = 10000');
      db.pragma('temp_store = memory');

      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      db = null;
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  return db;
}

export function closeDatabase(): void {
  if (db) {
    try {
      db.close();
      console.log('Database connection closed successfully');
    } catch (error) {
      console.warn('Error closing database connection:', error.message);
    }
    db = null;
  }
}

export function resetDatabaseConnection(): void {
  console.log('Resetting database connection...');
  closeDatabase();
  // The next call to getDatabase() will establish a fresh connection
}

// Retry logic for database operations
export async function withDatabaseRetry<T>(
  operation: () => T,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);

      if (attempt < maxRetries) {
        // If it's a connection error, reset the connection
        if (error.message.includes('database') || error.message.includes('SQL')) {
          resetDatabaseConnection();
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    closeDatabase();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    closeDatabase();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    closeDatabase();
    process.exit(1);
  });
}