import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyUserAuth, checkRateLimit, validateRequestData, logSuccessAction } from '@/lib/apiMiddleware';

// --- CORS 處理 ---
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

// --- 郵件範本產生器 ---
const generateEmailHtml = (subject, plainTextBody) => {
    const currentYear = new Date().getFullYear();
    const platformUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>彰師大 校外獎學金資訊平台</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; -webkit-font-smoothing: antialiased; }
            table { border-collapse: collapse; width: 100%; }
            .wrapper { background-color: #f4f4f7; width: 100%; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
            .content { padding: 32px 40px; color: #374151; }
            .content h2 { color: #1f2937; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; text-align: left; }
            .plain-text-body { font-size: 16px; line-height: 1.7; color: #374151; white-space: pre-wrap; word-break: break-word; }
            .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
            .footer a { color: #6b7280; text-decoration: none; }
        </style>
    </head>
    <body>
        <table class="wrapper" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding: 24px;">
                    <table class="container" border="0" cellpadding="0" cellspacing="0">
                        <tr><td class="header"><h1>彰師大 校外獎學金資訊平台</h1></td></tr>
                        <tr><td class="content">
                            <h2>${subject}</h2>
                            <div class="plain-text-body">${plainTextBody}</div>
                        </td></tr>
                        <tr><td class="footer">
                            <p style="margin: 0 0 12px;"><a href="${platformUrl}" target="_blank">平台首頁</a>  •  <a href="https://www.ncue.edu.tw/" target="_blank">彰師大官網</a></p>
                            <p style="margin: 0 0 5px;">© ${currentYear} 彰師大 校外獎學金資訊平台. All Rights Reserved.</p>
                            <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
                        </td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};


// 創建郵件傳輸器
const transporter = nodemailer.createTransport({
    host: process.env.NCUE_SMTP_HOST || 'ncuesanas.ncue.edu.tw',
    port: parseInt(process.env.NCUE_SMTP_PORT || '587', 10),
    secure: process.env.NCUE_SMTP_SECURE === 'true',
    auth: {
        user: process.env.NCUE_SMTP_USER || 'ncuesu',
        pass: process.env.NCUE_SMTP_PASSWORD || 'Ncuesa23!'
    },
    tls: {
        rejectUnauthorized: false
    }
});

export async function POST(request) {
    try {
        // 1. Rate limiting 檢查
        const rateLimitCheck = checkRateLimit(request, 'send-custom-email', 10, 60000);
        if (!rateLimitCheck.success) return newCorsResponse(rateLimitCheck.error, 429);

        // 2. 管理員身份驗證
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint: '/api/send-custom-email'
        });
        if (!authCheck.success) return newCorsResponse({ error: '未授權' }, 401);

        // 3. 驗證請求資料
        const body = await request.json();
        const dataValidation = validateRequestData(body, ['email', 'subject', 'body'], []);
        if (!dataValidation.success) return newCorsResponse(dataValidation.error, 400);

        // 使用更清晰的變數名稱
        const { email, subject, body: plainTextBody } = dataValidation.data;

        // --- 核心修改 ---
        // 4. 使用範本產生 HTML 郵件內容
        const finalHtmlContent = generateEmailHtml(subject, plainTextBody);

        // 5. 準備郵件選項
        const mailOptions = {
            from: '"NCUE 獎學金平台" <noreply@ncuesa.org.tw>',
            to: email,
            subject: `【NCUE 獎學金平台通知】${subject}`,
            html: finalHtmlContent, // 使用產生好的 HTML
            text: plainTextBody      // 使用原始的純文字作為備用
        };

        // 6. 發送郵件
        const result = await transporter.sendMail(mailOptions);

        // 7. 記錄成功的操作
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