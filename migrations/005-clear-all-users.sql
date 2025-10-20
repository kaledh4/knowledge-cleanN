-- Migration: 005-clear-all-users.sql
-- Description: Remove all existing users to start fresh

-- Clear all users
DELETE FROM users;

-- Reset any auto-increment counters if needed
-- (SQLite doesn't reset AUTOINCREMENT sequences automatically)