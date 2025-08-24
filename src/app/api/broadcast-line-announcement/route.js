import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast';

const htmlToPlainText = (html) => {
    if (!html) return '';
    let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<li.*?>/gi, '\n✅ ')
        .replace(/<[^>]*>?/gm, '');
    return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
};

// --- CORS Handling ---
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

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

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        },
    });
}

// --- Main POST Handler ---
export async function POST(request) {
    try {
        // Middleware checks
        const rateLimitCheck = checkRateLimit(request, 'broadcast-line-announcement', 5, 60000);
        if (!rateLimitCheck.success) return newCorsResponse(rateLimitCheck.error, 429);

        const authCheck = await verifyUserAuth(request, { requireAuth: true, requireAdmin: true, endpoint: '/api/broadcast-line-announcement' });
        if (!authCheck.success) return authCheck.error;

        // Data validation
        const body = await request.json();
        const dataValidation = validateRequestData(body, ['announcementId'], []);
        if (!dataValidation.success) return newCorsResponse(dataValidation.error, 400);
        const { announcementId } = dataValidation.data;

        // Fetch announcement from Supabase
        const { data: announcement, error: annError } = await supabaseServer
            .from('announcements')
            .select('title, category, application_deadline, announcement_end_date, submission_method, target_audience')
            .eq('id', announcementId)
            .single();
            
        if (annError || !announcement) {
            console.error('Supabase fetch error:', annError);
            return newCorsResponse({ error: '找不到指定的公告' }, 404);
        }

        // **MODIFIED**: Build the plain text message exactly like in the preview component.
        const endDate = announcement.application_deadline ? new Date(announcement.application_deadline).toLocaleDateString('en-CA') : '無期限';
        const dateString = endDate;
        
        const titleLine = `🎓【分類 ${announcement.category || '未分類'}】 ${announcement.title || '無標題'}`;
        const periodLine = `\n\n⚠️ 申請期間：\n${dateString}`;
        const submissionLine = `\n\n📦 送件方式：\n${announcement.submission_method || '未指定'}`;
        const audienceLine = `\n\n🎯 適用對象：\n${htmlToPlainText(announcement.target_audience) || '所有學生'}`;
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const platformUrl = `${siteUrl}/?announcement_id=${announcementId}`;
        const linkLine = `\n\n🔗 查看詳情：\n${platformUrl}`;

        const plainTextMessage = [
            titleLine,
            periodLine,
            submissionLine,
            audienceLine,
            linkLine
        ].join('');

        const lineMessages = [{
            type: 'text',
            text: plainTextMessage
        }];
        
        console.log(`[LINE Broadcast] Built Plain Text Message for announcement ${announcementId}`);

        // Call LINE API
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!channelAccessToken) throw new Error('伺服器設定不完整：缺少 LINE Channel Access Token');

        const lineResponse = await fetch(LINE_BROADCAST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` },
            body: JSON.stringify({ messages: lineMessages })
        });

        if (!lineResponse.ok) {
            const errorData = await lineResponse.json();
            console.error('[LINE API Error Body]', errorData);
            const details = errorData.details?.map(d => `${d.property}: ${d.message}`).join(', ') || '未知詳情';
            throw new Error(`LINE API 錯誤: ${errorData.message} (詳情: ${details})`);
        }

        // Log success
        logSuccessAction('LINE_BROADCAST_SENT', '/api/broadcast-line-announcement', {
            adminId: authCheck.user.id,
            announcementId,
            messageType: 'text',
        });

        return newCorsResponse({ success: true, message: '公告已成功透過 LINE 廣播' }, 200);

    } catch (err) {
        console.error(`[API ERROR: /api/broadcast-line-announcement]`, err.message);
        return newCorsResponse({ error: err.message || '伺服器發生內部錯誤' }, 500);
    }
}