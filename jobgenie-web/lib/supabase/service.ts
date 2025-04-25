// lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client specifically for service role operations
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
