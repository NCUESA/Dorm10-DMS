// 統一匯出所有 lib 模組

// 認證相關
export { authUtils } from './auth/middleware-auth';
export { authService } from './auth/supabase-auth';

// 資料庫相關
export { dbService } from './database/supabase-db';
export { realtimeService } from './database/realtime';

// 設定相關
export { supabase, testConnection, getDatabaseInfo } from './config/supabase';
export { createClient as createBrowserClient } from './config/supabase-client';
export { createClient as createServerClient } from './config/supabase-server';
export { createClient as createMiddlewareClient } from './config/supabase-middleware';

// 工具函數
export * from './utils/helpers';
export * from './utils/validation';
