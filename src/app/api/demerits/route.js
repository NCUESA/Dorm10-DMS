import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth } from '@/lib/apiMiddleware'; // 假設您有這個中介軟體

export async function GET(request) {
  try {
    // 驗證使用者身份
    const auth = await verifyUserAuth(request, { requireAuth: true });
    if (!auth.success) return auth.error;

    const supabase = supabaseServer;

    // --- START: 核心修正 ---
    // 查詢 demerit 表，並透過關聯查詢 `profiles!recorder(username)` 獲取登記者的姓名
    const { data, error } = await supabase
      .from('demerit')
      .select(`
        id,
        reason,
        created_at,
        recorder,
        profiles!recorder ( username )
      `)
      .eq('id', auth.user.id) // `id` 是被記點者的 user id
      .order('created_at', { ascending: false });
    // --- END: 核心修正 ---

    if (error) {
      console.error("Error fetching demerit records:", error);
      throw error;
    }

    // 格式化資料，將巢狀的 profiles.username 提取出來
    const formattedRecords = data.map(record => ({
        ...record,
        recorder_name: record.profiles?.username || '系統管理員' // 如果找不到 profile，則顯示預設值
    }));

    return NextResponse.json({ success: true, records: formattedRecords || [] });

  } catch (error) {
    console.error("Get demerits API error:", error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}