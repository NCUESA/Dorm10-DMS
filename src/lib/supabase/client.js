import { createClient } from '@supabase/supabase-js';

// 動態建構 Supabase URL (支援本地和外部連線)
function getSupabaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // 如果是相對路徑，則根據當前環境建構完整 URL
  if (envUrl?.startsWith('/')) {
    if (typeof window !== 'undefined') {
      // 瀏覽器環境：使用當前網域
      return `${window.location.origin}${envUrl}`;
    } else {
      // 伺服器環境：使用預設本地 URL
      return `http://localhost:3000${envUrl}`;
    }
  }
  
  // 如果是完整 URL，直接使用
  return envUrl;
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  });
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

console.log('[SUPABASE-CLIENT] Configured with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
