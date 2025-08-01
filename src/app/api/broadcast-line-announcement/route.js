import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast';

// --- CORS 處理 ---
// 取得允許的來源，若在生產環境，應改為您的網站域名
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'http://localhost:3000';

// 這是一個輔助函式，用來建立帶有 CORS 標頭的回應
const newCorsResponse = (body, status) => {
    return new NextResponse(JSON.stringify(body), {
        status,
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        },
    });
};


// 處理瀏覽器的 OPTIONS 預檢請求
export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204, // No Content
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        },
    });
}

// 處理主要的 POST 請求
export async function POST(request) {
    try {
        // 1. Rate limiting 檢查
        const rateLimitCheck = checkRateLimit(request, 'broadcast-line-announcement', 5, 60000);
        if (!rateLimitCheck.success) return newCorsResponse(rateLimitCheck.error, 429);

        // 2. 管理員身份驗證
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint: '/api/broadcast-line-announcement'
        });
        if (!authCheck.success) return newCorsResponse({ error: '未授權' }, 401);

        // 3. 驗證請求資料
        const body = await request.json();
        const dataValidation = validateRequestData(body, ['announcementId'], []);
        if (!dataValidation.success) return newCorsResponse(dataValidation.error, 400);

        const { announcementId } = dataValidation.data;

        // 4. 取得公告資訊
        const { data: announcement, error: annError } = await supabaseServer
            .from('announcements')
            .select('*')
            .eq('id', announcementId)
            .single();
        if (annError || !announcement) {
            return newCorsResponse({ error: '找不到指定的公告' }, 404);
        }

        // 5. 準備 LINE 訊息
        const deadline = announcement.application_deadline
            ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW') : '未指定';
        const platformUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/?announcement_id=${announcementId}`;
        const lineMessageText = `🎓 獎學金新公告\n\n【${announcement.title}】\n\n- 截止日期：${deadline}\n- 適用對象：${announcement.target_audience || '所有學生'}\n\n👇 點擊下方連結查看完整資訊與附件\n${platformUrl}`;

        // 6. 呼叫 LINE API
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!channelAccessToken) throw new Error('伺服器設定不完整：缺少 LINE Channel Access Token');

        const lineResponse = await fetch(LINE_BROADCAST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` },
            body: JSON.stringify({ messages: [{ type: 'text', text: lineMessageText }] })
        });

        if (!lineResponse.ok) {
            const errorData = await lineResponse.json();
            throw new Error(`LINE API 錯誤: ${errorData.message || '未知錯誤'}`);
        }

        // 7. 記錄成功操作
        logSuccessAction('LINE_BROADCAST_SENT', '/api/broadcast-line-announcement', {
            adminId: authCheck.user.id,
            announcementId,
        });

        return newCorsResponse({ success: true, message: '公告已成功透過 LINE 廣播' }, 200);

    } catch (err) {
        console.error(`[API ERROR: /api/broadcast-line-announcement]`, err.message);
        return newCorsResponse({ error: err.message || '伺服器發生內部錯誤' }, 500);
    }
}