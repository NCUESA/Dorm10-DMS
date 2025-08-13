import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyUserAuth, checkRateLimit, validateRequestData, logSuccessAction } from '@/lib/apiMiddleware';

// --- CORS 處理 ---
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

// --- 郵件範本產生器 ---
const generateEmailHtml = (subject, htmlBody) => {
    const currentYear = new Date().getFullYear();
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let processedHtmlBody = htmlBody;
    processedHtmlBody = processedHtmlBody.replace(/(href|src)\s*=\s*["']([^"']*)["']/g, (match, attr, path) => {
        const trimmedPath = path.trim();
        if (/^(https?:|mailto:|tel:|#)/i.test(trimmedPath)) {
            return match;
        }
        if (trimmedPath.startsWith('//')) {
            return `${attr}="https:${trimmedPath}"`;
        }
        const absolutePath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
        return `${attr}="${platformUrl}${absolutePath}"`;
    });

    return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>彰師生輔組獎學金資訊平台</title>
        
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
            .html-body table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
            .html-body th, .html-body td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            .html-body th { background-color: #f9fafb; font-weight: 700; }
            .html-body * { max-width: 100%; }
            
            .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
            .footer a { color: #6b7280; text-decoration: none; }

            @media screen and (max-width: 600px) {
                .wrapper { padding: 16px 0 !important; }
                .container { width: 92% !important; }
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
                            <div class="html-body">${processedHtmlBody}</div>
                        </td></tr>
                        <tr><td class="footer">
                            <p style="margin: 0 0 12px;"><a href="${platformUrl}" target="_blank">生輔組獎學金資訊平台</a>  •  <a href="https://stuaffweb.ncue.edu.tw/" target="_blank">生輔組首頁</a></p>
                            <p style="margin: 0 0 5px;">© ${currentYear} 彰師生輔組獎學金資訊平台. All Rights Reserved.</p>
                            <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
                        </td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};


// --- 郵件傳輸器設定 ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
});

export async function POST(request) {
    try {
        const rateLimitCheck = checkRateLimit(request, 'send-custom-email', 10, 60000);
        if (!rateLimitCheck.success) return newCorsResponse(rateLimitCheck.error, 429);

        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint: '/api/send-custom-email'
        });
        if (!authCheck.success) return newCorsResponse({ error: '未授權' }, 401);

        const body = await request.json();
        const dataValidation = validateRequestData(body, ['email', 'subject', 'body'], []);
        if (!dataValidation.success) return newCorsResponse(dataValidation.error, 400);

        const { email, subject, body: htmlBody } = dataValidation.data;

        const finalHtmlContent = generateEmailHtml(subject, htmlBody);
        
        const plainTextVersion = htmlBody.replace(/<[^>]*>?/gm, '');

        const mailOptions = {
            from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
            to: email,
            subject: `${subject}`,
            html: finalHtmlContent,
            text: plainTextVersion
        };

        const result = await transporter.sendMail(mailOptions);

        logSuccessAction('CUSTOM_EMAIL_SENT', '/api/send-custom-email', {
            adminId: authCheck.user.id,
            recipientEmail: email,
            subject: subject,
            messageId: result.messageId
        });

        console.log(`郵件成功發送至 ${email}:`, result.messageId);

        return newCorsResponse({
            success: true,
            message: `通知已成功發送至 ${email}`,
        }, 200);

    } catch (err) {
        console.error(`[API ERROR: /api/send-custom-email]`, err.message);
        return newCorsResponse({ error: err.message || '伺服器發生內部錯誤' }, 500);
    }
}
