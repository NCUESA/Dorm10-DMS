// src/components/AnnouncementPreviewModal.jsx

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
        // 外層容器：調整為從頂部開始排列，並增加 pt-20 (80px) 的頂部內距
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start p-4 pt-20 overflow-y-auto"
          onClick={onClose}
        >
          {/* Modal 卡片：加入半透明背景、模糊效果和邊框 */}
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[calc(100vh-100px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題區域 */}
            <div className="p-5 border-b border-black/10 dark:border-white/10 flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{type === 'email' ? 'Email 通知預覽' : 'LINE 通知預覽'}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>

            {/* 內容預覽區域：背景改為透明以透出毛玻璃效果 */}
            <div className="p-6 bg-transparent flex-grow overflow-y-auto">
              {type === 'email' && <EmailPreview announcement={announcement} />}
              {type === 'line' && <LinePreview announcement={announcement} />}
            </div>

            {/* 頁腳區域：更新背景和按鈕 */}
            <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex justify-end items-center rounded-b-xl flex-shrink-0">
              <div className="flex items-center gap-x-2">
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300" onClick={onClose}>
                  關閉
                </Button>
                <Button
                  variant="ghost" // 紫色 Ghost Button
                  onClick={handleConfirm}
                  disabled={isSending}
                  className="text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/50 font-bold"
                  leftIcon={isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={16} />}
                >
                  {isSending ? '發送中...' : `確認並發送 ${type === 'email' ? 'Email' : 'LINE'}`}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};