import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction, validateRequestData } from '@/lib/apiMiddleware';

// 取得目前使用者的違規記點紀錄
export async function GET(request) {
  try {
    // Rate limit 檢查
    const rateCheck = checkRateLimit(request, 'demerits-get', 20, 60000);
    if (!rateCheck.success) return rateCheck.error;

    // 驗證使用者身份
    const auth = await verifyUserAuth(request, {
      requireAuth: true,
      endpoint: '/api/demerits'
    });
    if (!auth.success) return auth.error;

    const supabase = supabaseServer;
    const { data, error } = await supabase
      .from('demerit')
      .select('id, recorder, reason, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    logSuccessAction('GET_DEMERITS', '/api/demerits', {
      userId: auth.user.id,
      count: data?.length || 0
    });

    return NextResponse.json({ success: true, records: data || [] });
  } catch (error) {
    return handleApiError(error, '/api/demerits');
  }
}

// 管理員新增違規記點
export async function POST(request) {
  try {
    // Rate limit 檢查
    const rateCheck = checkRateLimit(request, 'demerits-post', 10, 60000);
    if (!rateCheck.success) return rateCheck.error;

    // 驗證管理員身份
    const auth = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/demerits'
    });
    if (!auth.success) return auth.error;

    // 驗證請求資料
    const body = await request.json();
    const validation = validateRequestData(body, ['userId', 'reason']);
    if (!validation.success) return validation.error;

    const { userId, reason } = validation.data;

    const supabase = supabaseServer;

    // 新增違規記點紀錄
    const { error: insertError } = await supabase
      .from('demerit')
      .insert({
        user_id: userId,
        recorder: auth.profile.username,
        reason: reason
      });
    if (insertError) throw insertError;

    // 重新計算使用者的累計記點
    const { count, error: countError } = await supabase
      .from('demerit')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (countError) throw countError;

    const newDemerit = (profile?.demerit || 0) + 1;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ demerit: newDemerit })
      .eq('id', userId);
    if (updateError) throw updateError;

    logSuccessAction('ADD_DEMERIT', '/api/demerits', {
      adminId: auth.user.id,
      targetUserId: userId
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return handleApiError(error, '/api/demerits');
  }
}
