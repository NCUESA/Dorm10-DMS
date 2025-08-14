import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

// --- Generic Email Template Generator ---
const generateEmailTemplate = (subject, htmlBody) => {
    const currentYear = new Date().getFullYear();
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scholarship.ncuesa.org.tw';

    return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>彰師生輔組校外獎學金資訊平台</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; -webkit-font-smoothing: antialiased; width: 100% !important; }
            table { border-collapse: collapse; width: 100%; }
            .wrapper { background-color: #f4f4f7; width: 100%; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
            .content { padding: 32px 40px; color: #374151; }
            .content h2 { color: #1f2937; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; text-align: left; }
            .html-body { font-size: 16px; line-height: 1.7; color: #374151; word-break: break-word; }
            .html-body p { margin: 0 0 1em 0; }
            .html-body a { color: #4f46e5; text-decoration: underline; }
            .html-body strong { font-weight: 700; }
            .html-body ul, .html-body ol { margin: 0 0 1em 0; padding-left: 20px; }
            .chat-bubble table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
            .chat-bubble th, .chat-bubble td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            .chat-bubble th { background-color: #f9fafb; font-weight: 700; }
            .chat-bubble tbody tr:nth-child(even) { background-color: #f9fafb; }
            .details-table { width: 100%; margin-bottom: 24px; border-spacing: 0; }
            .details-table td { padding: 8px 0; font-size: 15px; vertical-align: top; }
            .details-table .label { color: #6b7280; font-weight: 500; width: 120px; padding-right: 10px; }
            .details-table .value a { color: #3b82f6; text-decoration: none; }
            .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
            .footer a { color: #6b7280; text-decoration: none; }
            @media screen and (max-width: 600px) {
                .wrapper { padding: 16px 0 !important; }
                .container { width: 100% !important; }
                .content { padding: 24px 20px; }
                .header h1 { font-size: 22px; }
                .content h2 { font-size: 20px; }
            }
        </style>
    </head>
    <body>
        <table class="wrapper" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    <table class="container" border="0" cellpadding="0" cellspacing="0">
                        <tr><td class="header"><h1>彰師生輔組校外獎學金資訊平台</h1></td></tr>
                        <tr><td class="content">
                            <h2>${subject}</h2>
                            <div class="html-body">${htmlBody}</div>
                        </td></tr>
                        <tr><td class="footer">
                            <p style="margin: 0 0 12px;"><a href="${platformUrl}" target="_blank">生輔組獎學金資訊平台</a> &bull; <a href="https://stuaffweb.ncue.edu.tw/" target="_blank">生輔組首頁</a></p>
                            <p style="margin: 0 0 5px;">© ${currentYear} 彰師生輔組校外獎學金資訊平台. All Rights Reserved.</p>
                            <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
                        </td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

// --- Support Email Content Generator ---
const generateSupportEmailHtml = (user, messages) => {
    const requestTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scholarship.ncuesa.org.tw';

    const processMessageContent = (content) => {
        let processedContent = content;
        const cardRegex = /\[ANNOUNCEMENT_CARD:([a-f0-9\-]+)\]/g;
        processedContent = processedContent.replace(cardRegex, (match, announcementId) => {
            const announcementUrl = `${platformUrl}/?announcement_id=${announcementId}`;
            return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px; margin-bottom: 12px;">
                        <tbody>
                            <tr>
                                <td style="text-align: center; vertical-align: middle; padding: 16px 0;">
                                    <a href="${announcementUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">AI 參考資料源</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;
        });
        const blocks = processedContent.split(/\n\s*\n/);
        const htmlBlocks = blocks.map(block => {
            if (!block.trim()) return '';
            let processedBlock = block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (/^\s*<(table|ul|div)/i.test(processedBlock.trim())) return processedBlock;
            if (/^(\s*[\*\-]\s+.*)/.test(processedBlock)) {
                return processedBlock.replace(/^((\s*[\*\-]\s+.*)(\n|$))+/gm, (match) => {
                    const lines = match.trim().split('\n'); let listHtml = ''; let lastIndent = -1; const indentSize = 2;
                    lines.forEach(line => {
                        const indentMatch = line.match(/^(\s*)/); const currentIndent = indentMatch ? indentMatch[1].length : 0; const itemText = line.replace(/^\s*[\*\-]\s+/, '');
                        if (currentIndent > lastIndent) { for (let i = 0; i < (currentIndent - lastIndent) / indentSize; i++) { listHtml += '<ul>'; } }
                        else if (currentIndent < lastIndent) { for (let i = 0; i < (lastIndent - currentIndent) / indentSize; i++) { listHtml += '</li></ul>'; } listHtml += '</li>'; }
                        else if (lastIndent !== -1) { listHtml += '</li>'; }
                        listHtml += `<li>${itemText}`; lastIndent = currentIndent;
                    });
                    for (let i = 0; i <= lastIndent / indentSize; i++) { listHtml += '</li></ul>'; }
                    return listHtml.replace(/<\/li><\/ul><li>/g, '<ul><li>');
                });
            }
            return `<p>${processedBlock.replace(/\n/g, '<br />')}</p>`;
        });
        return htmlBlocks.join('');
    };

    const renderChatHistory = (msgs) => {
        if (!msgs || msgs.length === 0) return '<tr><td><p style="text-align: center; color: #6b7280;">沒有提供對話紀錄。</p></td></tr>';
        return msgs.map(msg => {
            const isUser = msg.role === 'user';
            const bubbleContainerStyle = `text-align: ${isUser ? 'right' : 'left'}; padding: 6px 0;`;
            const bubbleStyle = `display: inline-block; padding: 12px 18px; border-radius: 20px; max-width: 85%; line-height: 1.6; word-break: break-word; text-align: left; background-color: ${isUser ? '#ede9fe' : '#f3f4f6'}; color: ${isUser ? '#5b21b6' : '#1f2937'};`;
            const formattedContent = processMessageContent(msg.content);
            return `<tr><td style="${bubbleContainerStyle}"><div class="chat-bubble" style="${bubbleStyle}">${formattedContent}</div></td></tr>`;
        }).join('');
    };

    const supportBodyHtml = `
        <table class="details-table">
            <tbody>
                <tr><td class="label">請求時間</td><td class="value">${requestTime}</td></tr>
                <tr><td class="label">使用者 ID</td><td class="value">${user.id}</td></tr>
                <tr><td class="label">姓名</td><td class="value">${user.user_metadata?.name || '未提供'}</td></tr>
                <tr><td class="label">學號</td><td class="value">${user.user_metadata?.student_id || '未提供'}</td></tr>
                <tr><td class="label">Email (請直接回覆此郵件)</td><td class="value"><a href="mailto:${user.email}">${user.email}</a></td></tr>
            </tbody>
        </table>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 20px;">對話紀錄</h3>
        <table class="chat-history-table"><tbody>${renderChatHistory(messages)}</tbody></table>
    `;

    return generateEmailTemplate("使用者協助請求", supportBodyHtml);
};

// --- Nodemailer Transporter 設定 ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
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
            from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
            to: '3526ming@gmail.com',
            replyTo: user.email,
            subject: `使用者 ${user.user_metadata?.name || user.email} 請求協助`,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);

        logSuccessAction('SUPPORT_REQUEST_SENT', '/api/send-support-email', { userId: user.id, messageId: result.messageId });

        return NextResponse.json({
            success: true,
            message: '您的協助請求已成功寄出，我們將盡快透過 mail 回覆您 !'
        });

    } catch (err) {
        return handleApiError(err, '/api/send-support-email');
    }
}
