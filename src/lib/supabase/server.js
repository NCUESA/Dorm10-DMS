import { createClient } from '@supabase/supabase-js';

// 伺服器端直接連接到本地 Supabase Docker (更安全)
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:8000';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables for server client.');
}

const supabaseServer = createClient(supabaseUrl, serviceRoleKey);

export { supabaseServer };
export default supabaseServer;
