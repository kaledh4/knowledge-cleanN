-- Migration: 001-initial-schema-version.sql
-- Description: Sets up the schema_version table to track database migrations.

-- Create the schema_version table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY NOT NULL
);

-- Set the initial version to 1 if the table is empty
INSERT INTO schema_version (version)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM schema_version);