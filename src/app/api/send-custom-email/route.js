import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Use the factory function
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

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


// 創建郵件傳輸器 (與您現有的設定相同)
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
        // 1. Rate limiting 檢查 (可以設定不同的限制)
        const rateLimitCheck = checkRateLimit(request, 'send-custom-email', 10, 60000); // 每分鐘10次
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
        const dataValidation = validateRequestData(
            body,
            ['email', 'subject', 'body'], // 這是新的必填欄位
            []
        );
        if (!dataValidation.success) return newCorsResponse(dataValidation.error, 400);

        const { email, subject, body: htmlContent } = dataValidation.data;

        // 4. 準備郵件選項
        const mailOptions = {
            from: '"NCUE 獎學金平台" <noreply@ncuesa.org.tw>',
            to: email, // 直接寄送給指定的 email
            subject: `【NCUE 獎學金平台通知】${subject}`,
            html: htmlContent, // 直接使用前端傳來的 HTML 內文
            // 建議也產生一個純文字版本，以防某些郵件客戶端不支援 HTML
            text: htmlContent.replace(/<[^>]*>?/gm, '')
        };

        // 5. 發送郵件
        const result = await transporter.sendMail(mailOptions);

        // 6. 記錄成功的操作
        logSuccessAction('CUSTOM_EMAIL_SENT', '/api/send-custom-email', {
            adminId: authCheck.user.id,
            recipientEmail: email,
            subject: subject,
            messageId: result.messageId
        });

        console.log(`客製化郵件成功發送至 ${email}:`, result.messageId);

        return newCorsResponse({
            success: true,
            message: `通知已成功發送至 ${email}`,
        }, 200);

    } catch (err) {
        console.error(`[API ERROR: /api/send-custom-email]`, err.message);
        return newCorsResponse({ error: err.message || '伺服器發生內部錯誤' }, 500);
    }
}