import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // 檢查環境變數
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing Supabase environment variables',
          environment: {
            supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
            anonKey: supabaseAnonKey ? 'Set' : 'Not set',
          }
        }, 
        { status: 500 }
      );
    }

    // 測試基本連線 - 使用簡單的查詢
    let connectionTest = { success: false, error: null };
    
    try {
      // 嘗試執行一個簡單的查詢來測試連線
      const { data, error } = await supabase
        .from('nonexistent_table')
        .select('*')
        .limit(1);
      
      // 如果是表不存在的錯誤，說明連線是成功的
      if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
        connectionTest = { success: true, error: null };
      } else if (error) {
        connectionTest = { success: false, error: error.message };
      } else {
        connectionTest = { success: true, error: null };
      }
    } catch (err) {
      connectionTest = { success: false, error: err.message };
    }

    // 檢查認證狀態
    let authTest = { user: null, error: null };
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      authTest = { user: user ? { id: user.id, email: user.email } : null, error: authError?.message || null };
    } catch (authErr) {
      authTest = { user: null, error: authErr.message };
    }

    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.success ? 'Supabase connection successful' : 'Connection failed',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
        anonKey: supabaseAnonKey ? 'Set' : 'Not set',
      },
      connection: connectionTest,
      auth: authTest,
      supabaseConfig: {
        url: supabaseUrl?.substring(0, 30) + '...',
        keyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
      }
    });

  } catch (err) {
    return NextResponse.json(
      { 
        success: false, 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
