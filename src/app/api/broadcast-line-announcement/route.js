import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast';

// --- Helper Functions ---

const htmlToPlainText = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};

const buildFlexMessage = (announcement, platformUrl) => {
    const deadline = announcement.application_deadline ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW') : '未指定';
    const summaryText = htmlToPlainText(announcement.summary).substring(0, 80) + (htmlToPlainText(announcement.summary).length > 80 ? '...' : '');
    const audienceText = htmlToPlainText(announcement.target_audience) || '所有學生';

    return {
        type: 'flex',
        altText: `獎學金新公告：${announcement.title}`,
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [{
                    type: 'text',
                    text: `【${announcement.title}】`,
                    weight: 'bold',
                    size: 'lg',
                    wrap: true,
                    color: '#1E3A8A' // Dark Blue
                }]
            },
            body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [
                    {
                        type: 'text',
                        text: summaryText,
                        wrap: true,
                        size: 'sm',
                        color: '#374151' // Gray
                    },
                    {
                        type: 'separator',
                        margin: 'lg'
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'box',
                                layout: 'baseline',
                                spacing: 'sm',
                                contents: [
                                    { type: 'text', text: '申請截止', size: 'sm', color: '#6B7280', flex: 3 },
                                    { type: 'text', text: deadline, size: 'sm', color: '#111827', flex: 5, weight: 'bold' }
                                ]
                            },
                            {
                                type: 'box',
                                layout: 'baseline',
                                spacing: 'sm',
                                contents: [
                                    { type: 'text', text: '適用對象', size: 'sm', color: '#6B7280', flex: 3 },
                                    { type: 'text', text: audienceText, size: 'sm', color: '#111827', flex: 5, wrap: true }
                                ]
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [{
                    type: 'button',
                    style: 'primary',
                    height: 'sm',
                    color: '#3B82F6', // Blue
                    action: {
                        type: 'uri',
                        label: '查看更多資訊',
                        uri: platformUrl
                    }
                }]
            }
        }
    };
};


// --- CORS Handling ---
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SITE_URL
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
        // 1. Rate limiting & 2. Admin Auth
        const rateLimitCheck = checkRateLimit(request, 'broadcast-line-announcement', 5, 60000);
        if (!rateLimitCheck.success) return newCorsResponse(rateLimitCheck.error, 429);

        const authCheck = await verifyUserAuth(request, { requireAuth: true, requireAdmin: true, endpoint: '/api/broadcast-line-announcement' });
        if (!authCheck.success) return authCheck.error;

        // 3. Validate Request Data
        const body = await request.json();
        const dataValidation = validateRequestData(body, ['announcementId'], []);
        if (!dataValidation.success) return newCorsResponse(dataValidation.error, 400);
        const { announcementId } = dataValidation.data;

        // 4. Fetch Announcement
        const { data: announcement, error: annError } = await supabaseServer
            .from('announcements')
            .select('title, summary, application_deadline, target_audience') // Select only needed fields
            .eq('id', announcementId)
            .single();
        if (annError || !announcement) {
            return newCorsResponse({ error: '找不到指定的公告' }, 404);
        }

        // 5. Build LINE Message from database fields
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        if (!process.env.NEXT_PUBLIC_SITE_URL) {
            console.warn(`[WARNING] NEXT_PUBLIC_SITE_URL environment variable is not set. Using fallback "${siteUrl}".`);
        }
        const platformUrl = `${siteUrl}/?announcement_id=${announcementId}`;

        const flexMessage = buildFlexMessage(announcement, platformUrl);
        const lineMessages = [flexMessage];
        
        console.log(`[LINE Broadcast] Manually built Flex Message for announcement ${announcementId}`);

        // 6. Call LINE API
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

        // 7. Log Success
        logSuccessAction('LINE_BROADCAST_SENT', '/api/broadcast-line-announcement', {
            adminId: authCheck.user.id,
            announcementId,
            messageType: 'flex',
        });

        return newCorsResponse({ success: true, message: '公告已成功透過 LINE 廣播' }, 200);

    } catch (err) {
        console.error(`[API ERROR: /api/broadcast-line-announcement]`, err.message);
        return newCorsResponse({ error: err.message || '伺服器發生內部錯誤' }, 500);
    }
}