import { createClient } from '@supabase/supabase-js';

// Try to import runtime config (created during build)
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
  const runtimeConfig = require('./runtime-config');
  SUPABASE_URL = runtimeConfig.SUPABASE_URL || '';
  SUPABASE_ANON_KEY = runtimeConfig.SUPABASE_ANON_KEY || '';
} catch (e) {
  // Fallback to process.env for local development
  SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;

  // Use localStorage as override, otherwise use build-time config
  const supabaseUrl = localStorage.getItem('supabaseUrl') || SUPABASE_URL;
  const supabaseKey = localStorage.getItem('supabaseKey') || SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing. URL:', supabaseUrl ? 'present' : 'missing', 'Key:', supabaseKey ? 'present' : 'missing');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

