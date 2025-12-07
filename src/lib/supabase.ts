import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * SETUP INSTRUCTIONS:
 * 
 * For GitHub Pages deployment, add these secrets to your repository:
 * https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
 * 
 * 1. NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
 * 2. NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
 * 
 * Get credentials from: https://app.supabase.com/project/_/settings/api
 * The GitHub Actions workflow will inject these during build.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';


// Singleton instance to prevent "Multiple GoTrueClient instances detected" warning
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance
 * Uses a singleton pattern to ensure only one instance exists
 */
export const getSupabaseClient = () => {
  // Server-side rendering guard
  if (typeof window === 'undefined') return null;

  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Validate configuration
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase configuration missing!');
    console.error('For GitHub Pages: Add secrets NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('For local dev: Create .env.local with these variables');
    return null;
  }

  // Validate URL format
  if (!SUPABASE_URL.startsWith('http://') && !SUPABASE_URL.startsWith('https://')) {
    console.error('❌ Invalid Supabase URL: Must start with http:// or https://');
    console.error('Received:', SUPABASE_URL);
    return null;
  }

  // Create and cache the instance
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized successfully');
    return supabaseInstance;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return null;
  }
};

/**
 * Direct export for cases where you need the client immediately
 * Note: This will be null if called during SSR or if config is missing
 */
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
