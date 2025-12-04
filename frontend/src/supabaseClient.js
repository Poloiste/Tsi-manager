import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Warn if using placeholder values
if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
  console.warn(
    '⚠️ Supabase credentials not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
