import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseServer } from '@/lib/supabase/server';

// 創建郵件傳輸器
const transporter = nodemailer.createTransport({
  host: process.env.NCUE_SMTP_HOST || 'ncuesanas.ncue.edu.tw',
  port: parseInt(process.env.NCUE_SMTP_PORT || '587', 10),
  secure: process.env.NCUE_SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.NCUE_SMTP_USER || 'ncuesu',
    pass: process.env.NCUE_SMTP_PASSWORD || 'Ncuesa23!'
  },
  tls: {
    rejectUnauthorized: false // 允許自簽名證書
  }
});

export async function POST(request) {
  try {
    const { announcementId } = await request.json();
    if (!announcementId) {
      return NextResponse.json({ error: '缺少公告 ID' }, { status: 400 });
    }

    // 取得公告資訊
    const { data: announcement, error: annError } = await supabaseServer
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (annError || !announcement) {
      console.error('取得公告失敗', annError);
      return NextResponse.json({ error: '無法取得公告資料' }, { status: 500 });
    }

    // 取得所有使用者的 email
    const { data: users, error: userError } = await supabaseServer.auth.admin.listUsers();
    if (userError) {
      console.error('取得使用者清單失敗', userError);
      return NextResponse.json({ error: '無法取得使用者清單' }, { status: 500 });
    }

    const emails = users?.users?.map((u) => u.email).filter(Boolean);
    if (!emails || emails.length === 0) {
      return NextResponse.json({ error: '沒有可寄送的 Email' }, { status: 400 });
    }

    // 清理 HTML 標籤的函數
    const stripHtml = (html) => {
      if (!html) return '';
      return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    };

    // 準備郵件內容
    const cleanSummary = stripHtml(announcement.summary);
    const deadline = announcement.application_deadline 
      ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW')
      : '未指定';

    const emailContent = `
【NCUE 獎學金資訊平台 - 新公告通知】

公告標題：${announcement.title}

${announcement.category ? `分類：${announcement.category}` : ''}
${announcement.application_deadline ? `申請截止日期：${deadline}` : ''}
${announcement.target_audience ? `適用對象：${announcement.target_audience}` : ''}
${announcement.submission_method ? `送件方式：${announcement.submission_method}` : ''}

公告內容：
${cleanSummary}

${announcement.external_urls ? `\n相關連結：${announcement.external_urls}` : ''}

---
請至 NCUE 獎學金資訊整合平台查看完整內容及附件
發送時間：${new Date().toLocaleString('zh-TW')}
此郵件由系統自動發送，請勿直接回覆
`;

    const htmlContent = `
<div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🎓 NCUE 獎學金新公告</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
    <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
      ${announcement.title}
    </h2>
    
    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      ${announcement.category ? `<p><strong>📋 分類：</strong>${announcement.category}</p>` : ''}
      ${announcement.application_deadline ? `<p><strong>⏰ 申請截止：</strong><span style="color: #e74c3c; font-weight: bold;">${deadline}</span></p>` : ''}
      ${announcement.target_audience ? `<p><strong>👥 適用對象：</strong>${announcement.target_audience}</p>` : ''}
      ${announcement.submission_method ? `<p><strong>📨 送件方式：</strong>${announcement.submission_method}</p>` : ''}
    </div>
    
    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #2c3e50; margin-top: 0;">📄 公告內容</h3>
      ${announcement.summary || '<p>請至平台查看詳細內容</p>'}
    </div>
    
    ${announcement.external_urls ? `
    <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #27ae60;">
      <p><strong>🔗 相關連結：</strong></p>
      <a href="${announcement.external_urls}" style="color: #27ae60; text-decoration: none;">${announcement.external_urls}</a>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 20px 0;">
      <p style="background: #3498db; color: white; padding: 15px; border-radius: 5px; margin: 0;">
        <strong>📱 請至 NCUE 獎學金資訊整合平台查看完整內容及下載附件</strong>
      </p>
    </div>
  </div>
  
  <div style="background: #34495e; color: #ecf0f1; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
    <p style="margin: 0;">發送時間：${new Date().toLocaleString('zh-TW')}</p>
    <p style="margin: 5px 0 0 0;">此郵件由 NCUE 獎學金資訊平台系統自動發送，請勿直接回覆</p>
  </div>
</div>
`;

    const mailOptions = {
      from: '"NCUE 獎學金平台" <noreply@ncuesa.org.tw>',
      bcc: emails.join(','), // 使用密件副本保護隱私
      subject: `【公告通知】${announcement.title}`,
      text: emailContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('公告郵件發送成功:', result.messageId);

    return NextResponse.json({ 
      success: true, 
      message: `公告已成功發送給 ${emails.length} 位使用者`,
      messageId: result.messageId,
      recipientCount: emails.length
    });

  } catch (err) {
    console.error('寄送公告失敗', err);
    return NextResponse.json({ error: '寄送失敗：' + err.message }, { status: 500 });
  }
}
