'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AnnouncementPreviewModal({ isOpen, type, contentHtml, contentText, onConfirm, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => setShow(true), 50);
    } else {
      document.body.style.overflow = 'unset';
      setShow(false);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setShow(false);
    setTimeout(() => {
      document.body.style.overflow = 'unset';
      onClose();
    }, 200);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">{type === 'email' ? 'mail 預覽' : 'LINE 訊息預覽'}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {type === 'email' ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{contentText}</pre>
          )}
        </div>
        <div className="p-4 bg-gray-100 border-t flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
          <button onClick={handleClose} className="px-4 py-2 rounded-md bg-white border text-gray-700 hover:bg-gray-50">取消</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
            {type === 'email' ? '寄送 mail' : '發送 LINE'}
          </button>
        </div>
      </div>
    </div>
  );
}
