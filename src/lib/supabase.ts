import { createClient } from '@supabase/supabase-js';

// Environment variables are baked in at build time for static export
const DEFAULT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const DEFAULT_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;

  // Use localStorage as override, otherwise use build-time env vars
  const supabaseUrl = localStorage.getItem('supabaseUrl') || DEFAULT_SUPABASE_URL;
  const supabaseKey = localStorage.getItem('supabaseKey') || DEFAULT_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing. URL:', supabaseUrl ? 'present' : 'missing', 'Key:', supabaseKey ? 'present' : 'missing');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

