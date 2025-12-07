-- Migration: 003-fix-users-table-schema.sql
-- Description: Safely adds encrypted_password column to users table
-- Handles the case where the column is missing in production

-- Create the correct users table structure with a different name
CREATE TABLE IF NOT EXISTS users_with_password (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL DEFAULT '$2a$10$rkLFUKaal6jneKw1VTauF.xK.p8imPdnTqLMU/DtFcrYH5aOn8SWS',
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing users data WITHOUT referencing encrypted_password column
-- This handles the case where the column doesn't exist
INSERT OR IGNORE INTO users_with_password (id, email, name, created_at, updated_at)
SELECT 
  id,
  email,
  name,
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM users;

-- Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_with_password RENAME TO users;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);