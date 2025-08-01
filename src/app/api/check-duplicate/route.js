import { NextResponse } from 'next/server';
// import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    // Temporarily disabled until SUPABASE_SERVICE_ROLE_KEY is configured
    return NextResponse.json({
      emailExists: false,
      studentIdExists: false
    });
  } catch (error) {
    console.error('檢查重複失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
