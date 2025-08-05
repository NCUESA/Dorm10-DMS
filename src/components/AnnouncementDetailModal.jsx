'use client';

import { useEffect } from 'react';
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || !filePath) return '#';

    // return `${supabaseUrl}/storage/v1/object/public/attachments/${filePath}`;
    return `${filePath}`;
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

    const tableStyles = `
        <style>
            .prose table { width: 100%; border-collapse: collapse; margin-top: 1.5em; margin-bottom: 1.5em; font-size: 0.9em; border: 1px solid #dee2e6; }
            .prose th, .prose td { border: 1px solid #dee2e6; padding: 0.75rem 1rem; text-align: left; vertical-align: top; }
            .prose th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
            .prose tr:nth-of-type(even) { background-color: #f8f9fa; }
        </style>
    `;

    if (!announcement) return null;

    const deadline = announcement.application_deadline
        ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : '未指定';

    const finalContent = tableStyles + (announcement.full_content || announcement.summary || '無詳細內容');

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
                                        <p className="font-semibold text-gray-500">申請截止</p>
                                        <p className={`font-bold text-lg ${new Date(announcement.application_deadline) < new Date() ? 'text-gray-600' : 'text-red-600'}`}>{deadline}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-500">適用對象</p>
                                        <p className="text-gray-800">{announcement.target_audience}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <SendIcon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-500">送件方式</p>
                                        <p className="text-gray-800">{announcement.submission_method}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            <div>
                                <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">詳細內容</h3>
                                <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: finalContent }} />
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

                            {announcement.external_urls && (
                                <div>
                                    <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">外部連結</h3>
                                    <a href={announcement.external_urls} target="_blank" rel="noopener noreferrer"
                                        className="group flex items-center gap-3 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                        <LinkIcon className="h-4 w-4 transform group-hover:rotate-[-45deg] transition-transform" />
                                        <span className="break-all group-hover:underline">{announcement.external_urls}</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}