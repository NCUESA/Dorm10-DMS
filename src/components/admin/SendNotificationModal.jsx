import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button'; // Assuming you have a custom Button component
import { authFetch } from '@/lib/authFetch';
import { X, Send, Loader2 } from 'lucide-react';

export const SendNotificationModal = ({ isOpen, onClose, user, showToast }) => {
    const [emailData, setEmailData] = useState({ subject: '', body: '' });
    const [isSending, setIsSending] = useState(false);
  
    useEffect(() => {
        if (isOpen) {
            setEmailData({ subject: `來自 NCUE 獎學金平台的通知`, body: `<p>親愛的 ${user?.name || '使用者'} 同學，您好：</p><p><br></p><p>...</p><p><br></p><p>敬上</p><p>彰師大生輔組 敬啟</p>` });
        }
    }, [isOpen, user]);
  
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmailData(prev => ({ ...prev, [name]: value }));
    };
  
    const handleSend = async () => {
        if (!emailData.subject || !emailData.body) {
            showToast('標題和內文為必填欄位', 'error');
            return;
        }
        setIsSending(true);
        try {
            const response = await authFetch('/api/send-custom-email', {
                method: 'POST',
                body: JSON.stringify({
                    email: user.emailFull,
                    subject: emailData.subject,
                    htmlContent: emailData.body // Ensure API expects htmlContent
                }),
            });
            const data = await response.json();
            if (response.ok) {
                showToast('通知已成功寄送！', 'success');
                onClose();
            } else {
                showToast(data.error || '寄送失敗', 'error');
            }
        } catch (error) {
            showToast('寄送時發生錯誤', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const emailPreviewHtml = `
    <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎓 NCUE 獎學金平台通知</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                ${emailData.subject || '(預覽標題)'}
            </h2>
            <div class="prose max-w-none">
                ${emailData.body || '<p>(預覽內文)</p>'}
            </div>
        </div>
    </div>
    `;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">寄送通知給 {user?.name}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                            {/* Edit Area */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">標題</label>
                                    <input type="text" name="subject" value={emailData.subject} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">內文 (支援 HTML)</label>
                                    <textarea name="body" value={emailData.body} onChange={handleChange} rows="15" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 font-mono text-sm"></textarea>
                                </div>
                            </div>
                            {/* Preview Area */}
                            <div className="bg-slate-100 rounded-lg p-4 border overflow-y-auto">
                                <div dangerouslySetInnerHTML={{ __html: emailPreviewHtml }} />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/80 border-t flex justify-end space-x-3 rounded-b-xl flex-shrink-0">
                            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
                            <Button type="button" onClick={handleSend} disabled={isSending} leftIcon={isSending ? <Loader2 className="animate-spin" /> : <Send size={16}/>}>
                                {isSending ? '寄送中...' : '確認寄送'}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};