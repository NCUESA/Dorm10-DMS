'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { X, Send, Loader2 } from 'lucide-react';

const SendNotificationModal = ({ isOpen, onClose, user, onConfirm, isSending }) => {
    const [emailData, setEmailData] = useState({ subject: '', body: '' });

    useEffect(() => {
        if (isOpen && user) {
            setEmailData({
                subject: `[重要通知] 彰師大校外獎學金平台`,
                body: `親愛的 ${user.name || '使用者'} 同學，您好：\n\n此為來自「彰師大校外獎學金資訊平台」的通知。\n\n...\n\n若有任何疑問，歡迎隨時與我們聯繫。\n彰師大 學務處生輔組 敬上\n`
            });
        }
    }, [isOpen, user]);

    // 處理輸入框的變更
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmailData(prev => ({ ...prev, [name]: value }));
    };

    // 點擊確認按鈕時，呼叫父元件傳入的 onConfirm 函數
    const handleConfirmClick = () => {
        // 傳遞標題和純文字內文
        onConfirm({
            subject: emailData.subject,
            htmlContent: emailData.body
        });
    };

    const currentYear = new Date().getFullYear();
    const emailPreviewHtml = `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>彰師大 校外獎學金資訊平台</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body { margin: 0; padding: 0; background-color: transparent; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; -webkit-font-smoothing: antialiased; }
            table { border-collapse: collapse; width: 100%; }
            .container { background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
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
            <tr><td>
                <table class="container" border="0" cellpadding="0" cellspacing="0">
                    <tr><td class="header"><h1>彰師大 校外獎學金資訊平台</h1></td></tr>
                    <tr><td class="content">
                        <h2>${emailData.subject || '(預覽標題)'}</h2>
                        <div class="plain-text-body">${emailData.body || '(預覽內文)'}</div>
                    </td></tr>
                    <tr><td class="footer">
                        <p style="margin: 0 0 12px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" target="_blank">平台首頁</a>  •  <a href="https://www.ncue.edu.tw/" target="_blank">彰師大官網</a></p>
                        <p style="margin: 0 0 5px;">© ${currentYear} 彰師大 校外獎學金資訊平台. All Rights Reserved.</p>
                        <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
                    </td></tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>`;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex justify-center items-start p-4 pt-20 overflow-y-auto" onClick={onClose}>

                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[calc(100vh-120px)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">寄送通知給 {user?.name} <span className="text-gray-500 font-normal text-base">({user?.email})</span></h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto flex-1">
                            <div className="flex flex-col space-y-6">
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1.5">標題</label>
                                    <input id="subject" type="text" name="subject" value={emailData.subject} onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white/70 border border-gray-300 rounded-lg shadow-sm transition-all duration-300
                                                    focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <label htmlFor="body" className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0">郵件內文</label>
                                    <textarea id="body" name="body" value={emailData.body} onChange={handleChange}
                                        className="w-full flex-1 px-4 py-3 bg-white/70 border border-gray-300 rounded-lg shadow-sm font-mono text-sm leading-relaxed transition-all duration-300
                                                    focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"></textarea>
                                </div>
                            </div>

                            <div className="bg-slate-500/10 rounded-lg p-4 lg:p-6 border border-black/10 overflow-y-auto h-full">
                                <div dangerouslySetInnerHTML={{ __html: emailPreviewHtml }} />
                            </div>
                        </div>

                        <div className="p-4 bg-white/60 border-t border-black/10 flex justify-end space-x-3 rounded-b-2xl flex-shrink-0">
                            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>

                            <Button
                                type="button"
                                onClick={handleConfirmClick}
                                disabled={isSending}
                                leftIcon={isSending ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold transform transition-all duration-300 ease-in-out
                                            hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/50
                                            disabled:transform-none disabled:shadow-none"
                            >
                                {isSending ? '寄送中...' : '確認寄送'}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SendNotificationModal;