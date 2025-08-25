import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration:', {
        url: supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
    });
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

console.log('[SUPABASE-CLIENT] Configured with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);