import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

// 取得公告列表
export async function GET(request) {
  try {
    // Rate limit 檢查
    const rateCheck = checkRateLimit(request, 'announcements-get', 30, 60000);
    if (!rateCheck.success) return rateCheck.error;

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    // 如果為後台請求則需驗證管理員身份
    if (isAdmin) {
      const auth = await verifyUserAuth(request, {
        requireAuth: true,
        requireAdmin: true,
        endpoint: '/api/announcements'
      });
      if (!auth.success) return auth.error;
    }

    const supabase = supabaseServer;
    let query = supabase
      .from('announcements')
      .select('id, title, external_urls, create_at, is_active, updated_at, category, application_end_date, attachments(id, file_name, stored_file_path)')
      .order('create_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (isAdmin) {
      logSuccessAction('GET_ADMIN_ANNOUNCEMENTS', '/api/announcements', {
        count: data?.length || 0
      });
    }

    return NextResponse.json({ success: true, announcements: data || [] });
  } catch (error) {
    return handleApiError(error, '/api/announcements');
  }
}
