import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured && import.meta.env.DEV) {
  console.warn(
    'Supabase is not configured. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Falls back to a harmless placeholder so importing this module never throws
// during a build that has no env file. Anything that actually talks to the
// backend should check `supabaseConfigured` first.
export const supabase = createClient(url || 'http://localhost', anonKey || 'anon', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
