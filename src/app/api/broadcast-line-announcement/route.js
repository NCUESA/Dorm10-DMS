import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast';

// --- Helper Functions (Copied EXACTLY from the latest LinePreview.jsx) ---

const htmlToPlainText = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/(\r\n|\n|\r)/gm, "").replace(/\s+/g, ' ').trim();
};

const htmlToFlexSpans = (html) => {
    if (!html) return [{ type: 'span', text: '' }];

    const spans = [];
    const spanRegex = /<span[^>]*style="[^"]*color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/span>/gs;
    let lastIndex = 0;
    let match;

    while ((match = spanRegex.exec(html)) !== null) {
        if (match.index > lastIndex) {
            const text = htmlToPlainText(html.substring(lastIndex, match.index));
            if (text) spans.push({ type: 'span', text: text });
        }
        
        const color = match[1].trim();
        const content = htmlToPlainText(match[2]);
        if (content) {
            spans.push({
                type: 'span',
                text: content,
                color: color,
                weight: 'bold',
            });
        }
        
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
        const text = htmlToPlainText(html.substring(lastIndex));
        if (text) spans.push({ type: 'span', text: text });
    }

    return spans.length > 0 ? spans : [{ type: 'span', text: htmlToPlainText(html) }];
};

const htmlToFlexComponents = (html) => {
    if (!html) return [];

    const components = [];
    const elementRegex = /<(h4|p|ul|ol|table)[\s\S]*?>(.*?)<\/\1>/gs;
    let lastIndex = 0;
    let match;

    while ((match = elementRegex.exec(html)) !== null) {
        if (match.index > lastIndex) {
            const textContent = html.substring(lastIndex, match.index);
            if (htmlToPlainText(textContent)) {
                components.push({ type: 'text', contents: htmlToFlexSpans(textContent), wrap: true, size: 'sm', margin: 'md' });
            }
        }
        
        const [fullMatch, tagName, innerHtml] = match;
        const plainText = (text) => text.replace(/<[^>]*>?/gm, '').trim();

        switch (tagName) {
            case 'h4':
                components.push({ type: 'text', text: plainText(innerHtml), weight: 'bold', size: 'md', margin: 'lg', color: '#6D28D9' });
                break;
            case 'p':
                components.push({ type: 'text', contents: htmlToFlexSpans(innerHtml), wrap: true, size: 'sm', margin: 'md' });
                break;
            case 'ul':
            case 'ol':
                const items = innerHtml.match(/<li.*?>(.*?)<\/li>/gs) || [];
                items.forEach(item => {
                    components.push({
                        type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'xs',
                        contents: [
                            { type: 'text', text: '•', flex: 0, color: '#9ca3af', margin: 'xs' },
                            { type: 'text', contents: htmlToFlexSpans(item), wrap: true, size: 'sm', flex: 1 }
                        ]
                    });
                });
                break;
            case 'table':
                const rows = innerHtml.match(/<tr.*?>(.*?)<\/tr>/gs) || [];
                rows.forEach(row => {
                    const cells = row.match(/<td.*?>(.*?)<\/td>/gs) || [];
                    if (cells.length > 0) {
                        components.push({
                            type: 'box', layout: 'horizontal', margin: 'sm', spacing: 'md',
                            contents: cells.map(cell => ({
                                type: 'text', 
                                contents: htmlToFlexSpans(cell), 
                                wrap: true, 
                                size: 'sm', 
                                flex: 1, 
                                margin: 'xs'
                            }))
                        });
                    }
                });
                break;
            default: break;
        }
        lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < html.length) {
        const textContent = html.substring(lastIndex);
        if (htmlToPlainText(textContent)) {
            components.push({ type: 'text', contents: htmlToFlexSpans(textContent), wrap: true, size: 'sm', margin: 'md' });
        }
    }

    return components;
};

// **MODIFIED**: This function is now an exact replica of the preview's builder.
const buildFlexMessage = (announcement, platformUrl) => {
    const startDate = announcement.application_start_date ? new Date(announcement.application_start_date).toLocaleDateString('en-CA') : null;
    const endDate = announcement.application_end_date ? new Date(announcement.application_end_date).toLocaleDateString('en-CA') : '無期限';
    const dateString = startDate ? `${startDate} ~ ${endDate}` : endDate;
    const categoryText = `分類 ${announcement.category || '未分類'}`;
    
    const summaryComponents = htmlToFlexComponents(announcement.summary);
    const audienceSpans = htmlToFlexSpans(announcement.target_audience);

    return {
        type: 'flex',
        altText: `獎學金新公告：${announcement.title}`,
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '20px',
                backgroundColor: '#A78BFA',
                spacing: 'md',
                contents: [
                    { type: 'text', text: categoryText, color: '#EDE9FE', size: 'sm' },
                    { type: 'text', text: announcement.title || '無標題', color: '#FFFFFF', size: 'lg', weight: 'bold', wrap: true },
                ],
            },
            body: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '20px',
                spacing: 'xl',
                contents: [
                    ...summaryComponents,
                    { type: 'separator', margin: 'xl' },
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'md',
                        contents: [
                            {
                                type: 'box',
                                layout: 'baseline',
                                spacing: 'sm',
                                contents: [
                                    { type: 'text', text: '申請期間', size: 'sm', color: '#94a3b8', flex: 0, weight: 'bold' },
                                    { type: 'text', text: dateString, size: 'sm', color: '#334155', align: 'end', wrap: true },
                                ],
                            },
                            {
                                type: 'box',
                                layout: 'baseline',
                                spacing: 'sm',
                                contents: [
                                    { type: 'text', text: '適用對象', size: 'sm', color: '#94a3b8', flex: 0, weight: 'bold' },
                                    { type: 'text', size: 'sm', color: '#334155', align: 'end', wrap: true, contents: audienceSpans },
                                ],
                            },
                        ],
                    },
                ],
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '20px',
                backgroundColor: '#f8fafc',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        color: '#8B5CF6',
                        action: { type: 'uri', label: '查看更多資訊', uri: platformUrl },
                    },
                ],
            },
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

        // 4. Fetch all necessary fields for the Flex Message
        const { data: announcement, error: annError } = await supabaseServer
            .from('announcements')
            .select('title, summary, category, application_start_date, application_end_date, target_audience')
            .eq('id', announcementId)
            .single();
        if (annError || !announcement) {
            console.error('Supabase fetch error:', annError);
            return newCorsResponse({ error: '找不到指定的公告' }, 404);
        }

        // 5. Build LINE Flex Message from database fields
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        if (!process.env.NEXT_PUBLIC_SITE_URL) {
            console.warn(`[WARNING] NEXT_PUBLIC_SITE_URL environment variable is not set. Using fallback "${siteUrl}".`);
        }
        const platformUrl = `${siteUrl}/?announcement_id=${announcementId}`;
        
        const flexMessage = buildFlexMessage(announcement, platformUrl);
        const lineMessages = [flexMessage];
        
        console.log(`[LINE Broadcast] Built Flex Message for announcement ${announcementId}`);

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