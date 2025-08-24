import { createClient } from '@supabase/supabase-js';

// 從環境變數讀取 Supabase 設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 若未設定必要的環境變數則拋出錯誤
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('缺少 Supabase 伺服器端環境變數，請確認設定');
}

console.log('[SUPABASE-SERVER] Configured with URL:', supabaseUrl);

// 建立伺服器端用的 Supabase 用戶端（不保存 session）
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
