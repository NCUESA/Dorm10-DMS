// src/components/previews/EmailPreview.jsx

import React from 'react';

const EmailPreview = ({ announcement }) => {
    const deadline = announcement.application_deadline
        ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
        : '未指定';

    const platformUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?announcement_id=${announcement.id}`;
    const currentYear = new Date().getFullYear();

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>彰師校外獎學金資訊平台</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            table { border-collapse: collapse; }
            .wrapper { background-color: #f4f4f7; width: 100%; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
            .content { padding: 32px 40px; color: #374151; }
            .content h2 { color: #1f2937; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; text-align: left; }
            .details-table { width: 100%; margin-bottom: 24px; border-collapse: collapse; }
            .details-table td { padding: 8px 0; vertical-align: top; font-size: 15px; }
            .details-table td.label { color: #6b7280; font-weight: 500; width: 80px; padding-right: 16px; }
            .details-table td.value { color: #1f2937; }
            .deadline { color: #9333ea; font-weight: 700; }
            .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
            .prose { font-size: 16px; line-height: 1.7; color: #374151; }
            .prose h3 { font-size: 18px; color: #1f2937; margin-top: 24px; margin-bottom: 12px; }
            .prose p { margin: 0 0 16px; }

            /* --- 表格樣式 --- */
            .prose table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 14px;
                border: 1px solid #dee2e6;
            }
            .prose th, .prose td {
                border: 1px solid #dee2e6;
                padding: 12px 15px;
                text-align: left;
                vertical-align: top;
            }
            .prose th {
                background-color: #f8f9fa;
                font-weight: 600;
                color: #495057;
            }
            .prose tr:nth-of-type(even) {
                background-color: #f8f9fa;
            }

            .cta-button { display: inline-block; background-color: #7c3aed; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500; }
            .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; }
            .footer a { color: #6b7280; text-decoration: none; }
        </style>
    </head>
    <body>
        <table class="wrapper" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="padding: 24px;">
                    <table class="container" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <!-- HEADER -->
                        <tr>
                            <td class="header"><h1>彰師校外獎學金資訊平台</h1></td>
                        </tr>
                        <!-- CONTENT -->
                        <tr>
                            <td class="content">
                                <h2>${announcement.title}</h2>
                                <table class="details-table">
                                    ${announcement.category ? `<tr><td class="label">類 別</td><td class="value">${announcement.category}</td></tr>` : ''}
                                    ${announcement.application_deadline ? `<tr><td class="label">申請截止</td><td class="value"><span class="deadline">${deadline}</span></td></tr>` : ''}
                                    ${announcement.target_audience ? `<tr><td class="label">適用對象</td><td class="value">${announcement.target_audience}</td></tr>` : ''}
                                    ${announcement.submission_method ? `<tr><td class="label">送件方式</td><td class="value">${announcement.submission_method}</td></tr>` : ''}
                                </table>
                                <hr class="divider" />
                                <div class="prose">
                                    <h3>公告摘要</h3>
                                    ${announcement.summary || '<p>請至平台查看詳細內容。</p>'}
                                </div>
                                ${announcement.external_urls ? `<hr class="divider" /><div style="font-size: 14px; text-align: left;"><strong style="color: #6b7280;">相關連結：</strong> <a href="${announcement.external_urls}" target="_blank" style="color: #7c3aed;">${announcement.external_urls}</a></div>` : ''}
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
                                    <tr><td align="center"><a href="${platformUrl}" target="_blank" class="cta-button">前往平台查看完整資訊</a></td></tr>
                                </table>
                            </td>
                        </tr>
                        <!-- FOOTER -->
                        <tr>
                            <td class="footer">
                                <p style="margin: 0 0 12px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" target="_blank">校外獎學金資訊平台</a>  •  <a href="https://stuaffweb.ncue.edu.tw/" target="_blank">生輔組首頁</a></p>
                                <p style="margin: 0 0 5px;">© ${currentYear} 彰師校外獎學金資訊平台. All Rights Reserved.</p>
                                <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default EmailPreview;