import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth } from '@/lib/apiMiddleware';

/**
 * GET: 獲取指定使用者的「有效」違規紀錄
 * (主要供公開的記點查詢頁使用)
 * @param {Request} request - HTTP 請求對象
 * @returns {NextResponse}
 */
export async function GET(request) {
  try {
    // 驗證使用者是否登入 (普通使用者權限即可)
    const auth = await verifyUserAuth(request, { requireAuth: true });
    if (!auth.success) return auth.error;

    const supabase = supabaseServer;

    // 使用者只能查詢自己的紀錄
    const userIdToQuery = auth.user.id;

    const { data, error } = await supabase
      .from('demerit')
      .select(`
        record_id,
        reason,
        points,
        created_at,
        recorder:profiles!recorder_id ( username )
      `)
      .eq('user_id', userIdToQuery) // 查詢 user_id 欄位
      .is('removed_at', null)      // 只選擇未被撤銷的紀錄
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching demerit records for user:", error);
      throw error;
    }

    const formattedRecords = data.map(record => ({
      id: record.record_id,
      reason: record.reason,
      points: record.points,
      created_at: record.created_at,
      recorder_name: record.recorder?.username || '系統管理員'
    }));

    return NextResponse.json({ success: true, records: formattedRecords || [] });

  } catch (error) {
    console.error("GET /api/demerits error:", error);
    return NextResponse.json({ error: '伺服器內部錯誤，無法獲取違規紀錄' }, { status: 500 });
  }
}


/**
 * POST: 管理員新增一筆違規記錄
 * @param {Request} request - HTTP 請求對象
 * @returns {NextResponse}
 */
export async function POST(request) {
  try {
    // 驗證是否為管理員
    const auth = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
    });
    if (!auth.success) return auth.error;

    const { userId, reason, points } = await request.json();

    if (!userId || !reason || !points) {
      return NextResponse.json({ error: '缺少必要欄位 (userId, reason, points)' }, { status: 400 });
    }
    const numPoints = parseInt(points, 10);
    if (isNaN(numPoints) || numPoints <= 0) {
      return NextResponse.json({ error: '點數必須為正整數' }, { status: 400 });
    }

    const supabase = supabaseServer;

    const { error: insertError } = await supabase
      .from('demerit')
      .insert({
        user_id: userId,
        recorder_id: auth.user.id,
        reason: reason,
        points: numPoints
      });

    if (insertError) {
      console.error("Error inserting demerit record:", insertError);
      throw insertError;
    }

    return NextResponse.json({ success: true, message: `成功新增 ${numPoints} 點違規記錄` });

  } catch (error) {
    console.error("POST /api/demerits error:", error);
    return NextResponse.json({ error: '伺服器內部錯誤，無法新增紀錄' }, { status: 500 });
  }
}


/**
 * PATCH: 管理員撤銷一筆指定的違規記錄
 * @param {Request} request - HTTP 請求對象
 * @returns {NextResponse}
 */
export async function PATCH(request) {
    try {
        // 驗證是否為管理員
        const auth = await verifyUserAuth(request, { requireAuth: true, requireAdmin: true });
        if (!auth.success) return auth.error;
        
        const { recordId } = await request.json();

        if (!recordId) {
            return NextResponse.json({ error: '缺少記錄 ID (recordId)' }, { status: 400 });
        }
        
        const supabase = supabaseServer;

        // 更新 removed_at 和 removed_by 兩個欄位
        const { error } = await supabase
            .from('demerit')
            .update({ 
                removed_at: new Date().toISOString(),
                removed_by: auth.user.id // 記錄是哪位管理員撤銷的
            })
            .eq('record_id', recordId);

        if (error) {
            console.error("Error patching demerit record:", error);
            throw error;
        }

        return NextResponse.json({ success: true, message: '違規記錄已成功撤銷' });

    } catch (error) {
        console.error("PATCH /api/demerits error:", error);
        return NextResponse.json({ error: '伺服器內部錯誤，無法撤銷紀錄' }, { status: 500 });
    }
}