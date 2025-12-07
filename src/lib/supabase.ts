import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These placeholders will be replaced during GitHub Actions build
const SUPABASE_URL = 'SUPABASE_URL_PLACEHOLDER';
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY_PLACEHOLDER';

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;

  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Use localStorage as override, otherwise use build-time config
  const supabaseUrl = localStorage.getItem('supabaseUrl') || SUPABASE_URL;
  const supabaseKey = localStorage.getItem('supabaseKey') || SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('PLACEHOLDER') || supabaseKey.includes('PLACEHOLDER')) {
    console.error('Supabase configuration missing. URL:', supabaseUrl ? 'present' : 'missing', 'Key:', supabaseKey ? 'present' : 'missing');
    return null;
  }

  // Create and cache the instance
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
};

