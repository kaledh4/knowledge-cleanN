-- =====================================================
-- KnowledgeVerse - Complete Supabase Database Setup
-- =====================================================
-- Run this script in your Supabase SQL Editor to set up the database
-- Go to: https://supabase.com/dashboard → SQL Editor → New Query
-- Copy and paste this entire script, then click "Run"

-- =====================================================
-- 1. ENTRIES TABLE - Main knowledge storage
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    type TEXT DEFAULT 'TEXT',
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON public.entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_tags ON public.entries USING GIN(tags);

-- Enable Row-Level Security
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entries table
-- Policy: Users can view their own entries
CREATE POLICY "Users can view own entries"
    ON public.entries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert own entries"
    ON public.entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own entries"
    ON public.entries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own entries"
    ON public.entries
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. INSIGHTS TABLE - AI-generated analysis
-- =====================================================

CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON public.insights(created_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insights table
-- Policy: Users can view their own insights
CREATE POLICY "Users can view own insights"
    ON public.insights
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own insights
CREATE POLICY "Users can insert own insights"
    ON public.insights
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own insights
CREATE POLICY "Users can delete own insights"
    ON public.insights
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on entries
DROP TRIGGER IF EXISTS set_updated_at ON public.entries;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 4. VERIFY SETUP
-- =====================================================

-- Check that tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('entries', 'insights')
ORDER BY tablename;

-- Check that RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('entries', 'insights');

-- List all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SETUP COMPLETE! 
-- =====================================================
-- You should see:
-- - 2 tables created (entries, insights)
-- - RLS enabled on both tables
-- - 7 policies created (4 for entries, 3 for insights)
-- 
-- Next steps:
-- 1. Make sure you're logged in to the app
-- 2. Try adding a new knowledge entry
-- 3. The app should now work without errors!
-- =====================================================
