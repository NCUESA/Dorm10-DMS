import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 從 URL 參數獲取分頁和排序資訊
    const page = parseInt(searchParams.get('page') || '1', 10);
    const rowsPerPage = parseInt(searchParams.get('rowsPerPage') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';

    const supabase = supabaseServer;

    let query = supabase
      .from('announcements')
      // 使用關聯查詢 `profiles(username)` 來獲取上傳者的姓名
      .select('id, title, views, created_at, uploader, profiles(username)', { count: 'exact' })
      .eq('is_active', true);

    // 如果有搜尋關鍵字，則查詢 title 和 summary
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    // 設定排序
    query = query.order(sortBy, { ascending: ascending });

    // 設定分頁
    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      announcements: data || [],
      totalCount: count || 0
    });

  } catch (error) {
    console.error('Get announcements API error:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤，無法獲取公告' },
      { status: 500 }
    );
  }
}