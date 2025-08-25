import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: '缺少公告 ID' }, { status: 400 });
    }

    const supabase = supabaseServer;

    // 使用 Supabase 的 rpc (遠端程序呼叫) 來原子性地增加 views 欄位的值
    // 這樣可以避免競爭條件
    const { error } = await supabase.rpc('increment_view_count', { announcement_id_param: id });

    if (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'View count incremented.' });

  } catch (error) {
    console.error('Increment view API error:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤，無法更新點閱數' },
      { status: 500 }
    );
  }
}