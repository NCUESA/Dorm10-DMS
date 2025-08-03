import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { X, Send, Loader2 } from 'lucide-react';
import EmailPreview from './previews/EmailPreview';
import LinePreview from './previews/LinePreview';

export default function AnnouncementPreviewModal({ isOpen, type, announcement, onConfirm, onClose }) {
    const [isSending, setIsSending] = useState(false);

    const handleConfirm = async () => {
        setIsSending(true);
        await onConfirm();
        setIsSending(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                // 背景疊加層：深色、半透明、背景模糊
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex justify-center items-start p-4 pt-20 overflow-y-auto"
                    onClick={onClose}
                >
                <motion.div
                    initial={{ scale: 0.95, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="bg-white/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[calc(100vh-120px)]"
                    onClick={(e) => e.stopPropagation()}
                >
                        <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">{type === 'email' ? 'Email 通知預覽' : 'LINE 通知預覽'}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 bg-transparent flex-grow overflow-y-auto">
                            {type === 'email' && <EmailPreview announcement={announcement} />}
                            {type === 'line' && <LinePreview announcement={announcement} />}
                        </div>

                        <div className="p-4 bg-white/60 border-t border-black/10 flex justify-end items-center rounded-b-2xl flex-shrink-0 space-x-3">
                            <Button variant="ghost" onClick={onClose}>
                                關閉
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isSending}
                                leftIcon={isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={16} />}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold transform transition-all duration-300 ease-in-out
                                    hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/50
                                    disabled:transform-none disabled:shadow-none"
                            >
                                {isSending ? '發送中...' : `確認並發送 ${type === 'email' ? 'Email' : 'LINE'}`}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};