import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables for server client.');
}

const supabaseServer = createClient(supabaseUrl, serviceRoleKey);

export { supabaseServer };
export default supabaseServer;
