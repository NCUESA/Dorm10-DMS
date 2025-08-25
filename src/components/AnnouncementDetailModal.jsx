'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Link as LinkIcon, User, Calendar, Eye } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

// 解析 external_urls, 現在支援 { name: "...", url: "..." } 的格式
const parseUrls = (raw) => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.filter(item => item && typeof item.url === 'string');
        }
    } catch (e) {
        if (typeof raw === 'string' && raw.startsWith('http')) {
            return [{ name: raw, url: raw }]; // 將單一 URL 轉換為物件格式
        }
    }
    return [];
};

// 取得附件下載連結
const getPublicAttachmentUrl = (filePath) => {
    if (!filePath) return '#';
    const parts = filePath.split('/');
    const fileName = parts.slice(1).join('/');
    return `/api/attachments/${fileName}`;
};


export default function AnnouncementDetailModal({ isOpen, onClose, announcement }) {

    // --- START: 核心功能 - 智慧點閱計數 ---
    const handleViewIncrement = useCallback(async (announcementId) => {
        const now = new Date().getTime();
        const lastViewed = localStorage.getItem(`viewed_${announcementId}`);
        
        // 5 分鐘冷卻時間 (5 * 60 * 1000 毫秒)
        const COOLDOWN = 300000; 

        if (!lastViewed || (now - parseInt(lastViewed, 10)) > COOLDOWN) {
            try {
                await fetch(`/api/announcements/${announcementId}/increment-view`, {
                    method: 'POST',
                });
                localStorage.setItem(`viewed_${announcementId}`, now.toString());
            } catch (error) {
                console.error('Failed to increment view count:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen && announcement?.id) {
            // Modal 開啟時，觸發點閱計數
            handleViewIncrement(announcement.id);
        }
    }, [isOpen, announcement, handleViewIncrement]);
    // --- END: 核心功能 - 智慧點閱計數 ---

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    const parsedUrls = useMemo(() => parseUrls(announcement?.external_urls), [announcement]);
    
    // 使用 DOMPurify 清理 HTML 內容，防止 XSS 攻擊
    const sanitizedSummary = useMemo(() => {
        if (!announcement?.summary) return { __html: '無詳細內容' };
        return { __html: DOMPurify.sanitize(announcement.summary) };
    }, [announcement]);


    if (!isOpen || !announcement) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center overflow-y-auto p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* --- Header --- */}
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{announcement.title}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-2 rounded-full transition-colors"><X size={24} /></button>
                        </div>

                        {/* --- Content --- */}
                        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
                            {/* --- Metadata --- */}
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2"><User size={14} /> <span className="font-medium">{announcement.profiles?.username || '系統管理員'}</span></div>
                                <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(announcement.created_at).toLocaleDateString('zh-TW')}</div>
                                <div className="flex items-center gap-2"><Eye size={14} /> {announcement.views} 次點閱</div>
                            </div>
                            
                            {/* --- Summary (HTML Content) --- */}
                            <div>
                                <h3 className="text-lg font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-4">詳細內容</h3>
                                <div className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={sanitizedSummary} />
                            </div>

                            {/* --- Attachments --- */}
                            {announcement.attachments?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-4">相關附件</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {announcement.attachments.map(att => (
                                            <a key={att.id}
                                                href={getPublicAttachmentUrl(att.stored_file_path)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-3 bg-slate-50 hover:bg-indigo-100/60 p-3 rounded-lg text-indigo-800 font-medium transition-all duration-200 border border-slate-200 hover:border-indigo-300">
                                                <Paperclip className="h-5 w-5 flex-shrink-0 text-indigo-500" />
                                                <span className="truncate flex-1">{att.file_name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- External Links --- */}
                            {parsedUrls.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-4">外部連結</h3>
                                    <div className="space-y-2">
                                        {parsedUrls.map((item, index) => (
                                            <a key={index} href={item.url} target="_blank" rel="noopener noreferrer"
                                                className="group flex items-center gap-3 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                                <LinkIcon className="h-4 w-4" />
                                                <span className="break-all group-hover:underline">{item.name || item.url}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}