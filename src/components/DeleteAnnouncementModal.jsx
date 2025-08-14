'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/authFetch'; // 確保您有一個可以發送認證請求的 fetch wrapper

export default function DeleteAnnouncementModal({ isOpen, onClose, announcementId, refreshAnnouncements }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        if (isOpen) { document.body.style.overflow = 'hidden'; } 
        else { document.body.style.overflow = 'unset'; }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    // ** MODIFIED: Complete refactor of the delete logic for local file system **
    const handleDelete = async () => {
        if (!announcementId) {
            showToast('無效的公告 ID', 'error');
            return;
        }
        setIsDeleting(true);
        try {
            // 步驟 1: 從資料庫查詢關聯的附件路徑
            const { data: attachments, error: fetchError } = await supabase
                .from('attachments')
                .select('stored_file_path')
                .eq('announcement_id', announcementId);

            if (fetchError) {
                console.error("無法查詢關聯附件:", fetchError);
                // 查詢失敗，嘗試刪除主公告
            }

            // 步驟 2: 如果有附件，呼叫後端 API 來刪除本地檔案
            if (attachments && attachments.length > 0) {
                const filePaths = attachments.map(att => att.stored_file_path);
                
                const deleteFileRes = await authFetch('/api/delete-files', {
                    method: 'POST',
                    body: JSON.stringify({ filePaths }),
                });

                if (!deleteFileRes.ok) {
                    const errorData = await deleteFileRes.json();
                    showToast(`部分附件檔案刪除失敗: ${errorData.error || ''}`, 'warning');
                    console.error("刪除本地檔案失敗:", errorData);
                }
            }

            // 步驟 3: 刪除公告的資料庫紀錄
            const { error: deleteError } = await supabase
                .from('announcements')
                .delete()
                .eq('id', announcementId);

            if (deleteError) {
                throw deleteError;
            }
            
            showToast('公告及其所有附件已成功刪除', 'success');
            if (refreshAnnouncements) {
                refreshAnnouncements();
            }
            onClose();

        } catch (err) {
            console.error("刪除公告時發生錯誤:", err);
            showToast(`刪除失敗: ${err.message}`, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: -20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="bg-white/85 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-white/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 text-center">
                                <div className="mx-auto flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="mt-4">
                                    <h2 className="text-xl font-bold text-gray-900">刪除公告</h2>
                                    <p className="text-base text-gray-500 mt-2">您確定要永久刪除這則公告及其所有附件嗎？<br />此操作將無法復原。</p>
                                </div>
                            </div>

                            <div className="p-4 bg-black/5 flex justify-end space-x-3">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}
                                    className="transition-transform hover:-translate-y-0.5"
                                >
                                    取消
                                </Button>
                                <Button type="button" variant="danger" onClick={handleDelete} loading={isDeleting}
                                    className="transition-transform hover:-translate-y-0.5"
                                >
                                    {isDeleting ? '刪除中...' : '確認刪除'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}