import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast';

// ** CRITICAL FIX: Define CORS headers **
// These headers will be attached to every response, including the OPTIONS preflight request.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or 'http://localhost:3000' for stricter security
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ** CRITICAL FIX: Handle the OPTIONS preflight request **
export async function OPTIONS(request) {
  return new Response('ok', { headers: corsHeaders });
}


export async function POST(request) {
  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'broadcast-line-announcement', 5, 60000);
    if (!rateLimitCheck.success) return rateLimitCheck.error;

    // 2. 管理員身份驗證
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/broadcast-line-announcement'
    });
    if (!authCheck.success) return authCheck.error;

    // 3. 驗證請求資料
    const body = await request.json();
    const dataValidation = validateRequestData(body, ['announcementId'], []);
    if (!dataValidation.success) return dataValidation.error;

    const { announcementId } = dataValidation.data;

    // 4. 取得公告資訊
    const { data: announcement, error: annError } = await supabaseServer
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (annError || !announcement) {
      console.error('取得公告失敗', annError);
      return new NextResponse(JSON.stringify({ error: '無法取得公告資料' }), { status: 404, headers: corsHeaders });
    }

    // 5. 準備 LINE Messaging API 訊息內容
    const deadline = announcement.application_deadline 
      ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW')
      : '未指定';
    
    const platformUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?announcement_id=${announcementId}`;
    const lineMessageText = `🎓 獎學金新公告\n\n【${announcement.title}】\n\n- 截止日期：${deadline}\n- 適用對象：${announcement.target_audience || '所有學生'}\n\n👇 點擊下方連結至平台查看完整資訊與附件\n${platformUrl}`;

    // 6. 呼叫 LINE Messaging API (Broadcast)
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      throw new Error('伺服器設定不完整，無法發送 LINE 通知。');
    }

    const lineResponse = await fetch(LINE_BROADCAST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        messages: [{ type: 'text', text: lineMessageText }]
      })
    });

    if (!lineResponse.ok) {
      const errorData = await lineResponse.json();
      throw new Error(`LINE API 錯誤: ${errorData.message || '未知錯誤'}`);
    }
    
    // 7. 記錄成功的 LINE 廣播
    logSuccessAction('LINE_BROADCAST_SENT', '/api/broadcast-line-announcement', {
      adminId: authCheck.user.id,
      announcementId,
      status: lineResponse.status
    });

    console.log('LINE 公告廣播成功');

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: '公告已成功透過 LINE 廣播給所有好友'
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error(`[API ERROR: /api/broadcast-line-announcement]`, err.message);
    return new NextResponse(JSON.stringify(
      { error: err.message || '伺服器發生內部錯誤，請聯繫管理員。' }
    ), { status: 500, headers: corsHeaders });
  }
}