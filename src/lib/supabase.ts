import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;

  const supabaseUrl = localStorage.getItem('supabaseUrl') || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = localStorage.getItem('supabaseKey') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};
