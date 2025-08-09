import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

// --- 郵件 HTML 生成函式 ---
const generateSupportEmailHtml = (user, messages) => {
    const requestTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const currentYear = new Date().getFullYear();
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scholarship.ncuesa.org.tw';

    // **新增**: 內容處理函式，處理 Markdown 和特殊卡片標籤
    const processMessageContent = (content) => {
        let processedContent = content;

        // 1. 處理換行
        processedContent = processedContent.replace(/\n/g, '<br />');

        // 2. 處理 Markdown 粗體 **text** -> <strong>text</strong>
        processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 3. 處理 [ANNOUNCEMENT_CARD:...]
        const cardRegex = /\[ANNOUNCEMENT_CARD:([a-f0-9\-]+)\]/g;
        processedContent = processedContent.replace(cardRegex, (match, announcementId) => {
            const announcementUrl = `${platformUrl}/?announcement_id=${announcementId}`;
            return `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 12px; margin-bottom: 12px; background-color: #f9fafb;">
                    <p style="margin: 0; font-size: 14px; color: #374151; margin-bottom: 12px;">相關公告資訊：</p>
                    <a href="${announcementUrl}" target="_blank" style="display: inline-block; background-color: #7c3aed; color: #ffffff !important; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                        點此查看公告詳情
                    </a>
                </div>
            `;
        });

        return processedContent;
    };

    const renderChatHistory = (msgs) => {
        if (!msgs || msgs.length === 0) return '<p style="text-align: center; color: #6b7280;">沒有提供對話紀錄。</p>';

        return msgs.map(msg => {
            const isUser = msg.role === 'user';
            const bubbleContainerStyle = `
                text-align: ${isUser ? 'right' : 'left'};
                padding: 6px 0;
            `;
            const bubbleStyle = `
                display: inline-block;
                padding: 12px 18px;
                border-radius: 20px;
                max-width: 85%;
                line-height: 1.6;
                word-break: break-word;
                text-align: left;
                background-color: ${isUser ? '#ede9fe' : '#f3f4f6'};
                color: ${isUser ? '#5b21b6' : '#1f2937'};
            `;
            const formattedContent = processMessageContent(msg.content);

            return `
                <tr>
                    <td style="${bubbleContainerStyle}">
                        <div style="${bubbleStyle}">
                            ${formattedContent}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // --- 主郵件模板 ---
    return `
    <!DOCTYPE html>
    <html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>彰師校外獎學金資訊平台</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
        body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; }
        table { border-collapse: collapse; } .wrapper { background-color: #f4f4f7; width: 100%; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
        .content { padding: 32px 40px; color: #374151; } .content h2 { color: #1f2937; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; }
        .details-table { width: 100%; margin-bottom: 24px; } .details-table td { padding: 8px 0; font-size: 15px; border-bottom: 1px solid #f3f4f6; }
        .details-table tr:last-child td { border-bottom: none; }
        .details-table td.label { color: #6b7280; font-weight: 500; width: 100px; } .details-table td.value a { color: #3b82f6; text-decoration: none; }
        .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
        .prose-h3 { font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 20px; }
        .chat-history-table { width: 100%; }
        .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; }
        .footer a { color: #6b7280; text-decoration: none; }
    </style></head><body>
    <table class="wrapper" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding: 24px;">
    <table class="container" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr><td class="header"><h1>彰師校外獎學金資訊平台</h1></td></tr>
        <tr><td class="content">
            <h2>使用者資訊</h2>
            <table class="details-table">
                <tr><td class="label">請求時間</td><td>${requestTime}</td></tr>
                <tr><td class="label">使用者 ID</td><td>${user.id}</td></tr>
                <tr><td class="label">姓名</td><td>${user.user_metadata?.name || '未提供'}</td></tr>
                <tr><td class="label">學號</td><td>${user.user_metadata?.student_id || '未提供'}</td></tr>
                <tr><td class="label">Email (請直接回覆此郵件)</td><td class="value"><a href="mailto:${user.email}">${user.email}</a></td></tr>
            </table>
            <hr class="divider" />
            <h3 class="prose-h3">對話紀錄</h3>
            <table class="chat-history-table">
                ${renderChatHistory(messages)}
            </table>
        </td></tr>
        <tr><td class="footer">
            <p style="margin: 0 0 12px;">此請求由 <a href="${platformUrl}" target="_blank">彰師校外獎學金資訊平台</a> 發出</p>
            <p style="margin: 0 0 5px;">© ${currentYear} All Rights Reserved.</p>
            <p style="margin: 0;">此為系統自動發送之信件，請直接回覆此信件以聯繫使用者。</p>
        </td></tr>
    </table></td></tr></table></body></html>`;
};

// --- Nodemailer Transporter 設定 ---
const transporter = nodemailer.createTransport({
    host: process.env.NCUE_SMTP_HOST,
    port: parseInt(process.env.NCUE_SMTP_PORT, 10),
    secure: process.env.NCUE_SMTP_SECURE === 'true',
    auth: {
        user: process.env.NCUE_SMTP_USER,
        pass: process.env.NCUE_SMTP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// --- API 端點主邏輯 ---
export async function POST(request) {
    try {
        const rateLimitCheck = checkRateLimit(request, 'support-request', 3, 600000);
        if (!rateLimitCheck.success) return rateLimitCheck.error;

        const authCheck = await verifyUserAuth(request, { requireAuth: true, endpoint: '/api/send-support-email' });
        if (!authCheck.success) return authCheck.error;

        const user = authCheck.user;

        const body = await request.json();
        const { messages } = body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: '無效的對話紀錄內容' }, { status: 400 });
        }

        const htmlContent = generateSupportEmailHtml(user, messages);

        const mailOptions = {
            from: `"彰師校外獎學金資訊平台" <noreply@ncuesa.org.tw>`,
            to: '3526ming@gmail.com',
            replyTo: user.email,
            subject: `使用者 ${user.user_metadata?.name || user.email} 請求協助`,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);

        logSuccessAction('SUPPORT_REQUEST_SENT', '/api/send-support-email', { userId: user.id, messageId: result.messageId });

        console.log('支援請求郵件發送成功:', result.messageId);

        return NextResponse.json({
            success: true,
            message: '您的協助請求已成功寄出，我們將盡快透過 mail 回覆您 !'
        });

    } catch (err) {
        return handleApiError(err, '/api/send-support-email');
    }
}