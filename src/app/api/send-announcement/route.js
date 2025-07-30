import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseServer } from '@/lib/supabase/server';

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

    // 建立寄信 transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE === 'ssl',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: emails.join(','),
      subject: `【公告通知】${announcement.title}`,
      text: announcement.summary || '',
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('寄送公告失敗', err);
    return NextResponse.json({ error: '寄送失敗' }, { status: 500 });
  }
}
