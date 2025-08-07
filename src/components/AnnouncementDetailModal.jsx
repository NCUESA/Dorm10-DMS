'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Link as LinkIcon, Calendar, Users, Send as SendIcon } from 'lucide-react';

// --- Helper Functions & Constants ---
const categoryStyles = {
    A: { bg: 'bg-red-100', text: 'text-red-800' },
    B: { bg: 'bg-orange-100', text: 'text-orange-800' },
    C: { bg: 'bg-blue-100', text: 'text-blue-800' },
    D: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    E: { bg: 'bg-green-100', text: 'text-green-800' },
    default: { bg: 'bg-gray-100', text: 'text-gray-800' },
};
const getCategoryStyle = (cat) => categoryStyles[cat] || categoryStyles.default;

const getPublicAttachmentUrl = (filePath) => {
    if (!filePath) return '#';

    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];

    return `/api/attachments/${fileName}`;
};

// --- Main Component ---
export default function AnnouncementDetailModal({ isOpen, onClose, announcement }) {

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const parsedUrls = useMemo(() => {
        if (!announcement?.external_urls) return [];
        try {
            const parsed = JSON.parse(announcement.external_urls);
            if (Array.isArray(parsed)) {
                return parsed.filter(item => item.url && typeof item.url === 'string');
            }
        } catch (e) {
            if (typeof announcement.external_urls === 'string' && announcement.external_urls.startsWith('http')) {
                return [{ url: announcement.external_urls }];
            }
        }
        return [];
    }, [announcement]);

    if (!isOpen || !announcement) return null;

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-CA');
    };

    const startDate = formatDate(announcement.application_start_date);
    const endDate = formatDate(announcement.announcement_end_date);

    const dateDisplayString = startDate
        ? `${startDate} ~ ${endDate || '無期限'}`
        : endDate || '未指定';

    const finalContent = announcement.summary || '無詳細內容';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-start p-4 pt-16 sm:pt-20 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white/85 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[calc(100vh-100px)] overflow-hidden border border-white/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-black/10 flex justify-between items-start gap-4 flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <span className={`flex-shrink-0 mt-1 inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold ${getCategoryStyle(announcement.category).bg} ${getCategoryStyle(announcement.category).text}`}>
                                    {announcement.category}
                                </span>
                                <h2 className="text-lg md:text-xl font-bold text-gray-800">{announcement.title}</h2>
                            </div>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors flex-shrink-0"><X size={20} /></button>
                        </div>

                        <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-500">{startDate ? '申請期間' : '公告結束/申請截止'}</p>
                                        <p className="font-bold text-lg text-gray-900">
                                            {dateDisplayString}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-500">適用對象</p>
                                        <div
                                            className="text-gray-800 rich-text-content"
                                            dangerouslySetInnerHTML={{ __html: announcement.target_audience || '未指定' }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <SendIcon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-500">送件方式</p>
                                        <p className="text-gray-800">{announcement.submission_method || '未指定'}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            <div>
                                <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">詳細內容</h3>
                                <div className="rich-text-content"
                                    dangerouslySetInnerHTML={{ __html: finalContent }} />
                            </div>

                            {announcement.attachments?.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">相關附件</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {announcement.attachments.map(att => (
                                            <a key={att.id}
                                                href={getPublicAttachmentUrl(att.stored_file_path)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-3 bg-slate-100 hover:bg-indigo-100 hover:border-indigo-300 border border-transparent p-3 rounded-lg text-indigo-800 font-medium transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                                                <Paperclip className="h-5 w-5 flex-shrink-0 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                                                <span className="truncate flex-1">{att.file_name}</span>
                                                <span className="text-xs text-indigo-500/80 opacity-0 group-hover:opacity-100 transition-opacity">點擊下載</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedUrls.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">外部連結</h3>
                                    <div className="space-y-2">
                                        {parsedUrls.map((item, index) => (
                                            <a key={index} href={item.url} target="_blank" rel="noopener noreferrer"
                                                className="group flex items-center gap-3 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                                <LinkIcon className="h-4 w-4 transform group-hover:rotate-[-45deg] transition-transform flex-shrink-0" />
                                                <span className="break-all group-hover:underline">{item.url}</span>
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