'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import QuillEditor from './QuillEditor'
import Button from '@/components/ui/Button'

// Multiple Files Upload Area component (與 CreateAnnouncementModal 相同)
const MultipleFilesUploadArea = ({ selectedFiles, setSelectedFiles, disabled, showToast }) => {
    const fileInputRef = useRef(null);

    // 支援的文件類型
    const supportedTypes = {
        'application/pdf': 'PDF',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'application/msword': 'DOC',
        'image/jpeg': '圖片',
        'image/jpg': '圖片',
        'image/png': '圖片',
        'image/gif': '圖片',
        'image/webp': '圖片'
    };

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5; // 最多5個檔案

    // 格式化檔案大小
    const formatFileSize = (size) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    // 移除檔案
    const handleRemoveFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 處理檔案選擇
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        let newFiles = [];
        for (const file of files) {
            if (!supportedTypes[file.type]) {
                showToast(`不支援的檔案類型: ${file.name}`, 'warning');
                continue;
            }
            if (file.size > maxFileSize) {
                showToast(`檔案過大: ${file.name}`, 'warning');
                continue;
            }
            if (selectedFiles.length + newFiles.length >= maxFiles) {
                showToast(`最多只能選擇 ${maxFiles} 個檔案`, 'warning');
                break;
            }
            newFiles.push(file);
        }
        setSelectedFiles(prev => [...prev, ...newFiles]);
        e.target.value = '';
    };

    // 拖曳上傳
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files);
        let newFiles = [];
        for (const file of files) {
            if (!supportedTypes[file.type]) {
                showToast(`不支援的檔案類型: ${file.name}`, 'warning');
                continue;
            }
            if (file.size > maxFileSize) {
                showToast(`檔案過大: ${file.name}`, 'warning');
                continue;
            }
            if (selectedFiles.length + newFiles.length >= maxFiles) {
                showToast(`最多只能選擇 ${maxFiles} 個檔案`, 'warning');
                break;
            }
            newFiles.push(file);
        }
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    return (
        <div className="space-y-4">
            {/* 上傳區域 */}
            <div
                className={`relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors duration-300 ${!disabled ? 'hover:border-indigo-400 bg-gray-50 cursor-pointer' : 'bg-gray-100 cursor-not-allowed'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp"
                    disabled={disabled}
                    multiple
                />
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                    拖曳多個檔案到此處，或 <span className="font-medium text-indigo-600">點擊上傳</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    支援 PDF、DOCX、DOC、圖片格式 (最大 10MB，最多 {maxFiles} 個檔案)
                </p>
                <p className="mt-1 text-xs text-indigo-600">
                    已選擇 {selectedFiles.length} / {maxFiles} 個檔案
                </p>
            </div>

            {/* 已選擇的檔案列表 */}
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">已選擇的檔案：</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => {
                            const isExisting = file.isExisting;
                            const fileType = isExisting ? file.type : supportedTypes[file.type];
                            return (
                                <div key={isExisting ? file.id : index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg relative" style={{ overflow: 'visible' }}>
                                    <div className="flex items-center space-x-3">
                                        {isExisting ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-8 w-8 text-blue-500"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-700 break-all">{file.name}</p>
                                                {isExisting && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        現有檔案
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {fileType} • {formatFileSize(file.size)}
                                            </p>
                                            {isExisting && (
                                                <p className="text-xs text-blue-600">
                                                    路徑: <a href={file.path.startsWith('/') ? file.path : `/${file.path}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">{file.path}</a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!disabled && (
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title={isExisting ? "從列表移除" : "移除檔案"}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
// Toast 與 CreateAnnouncementModal 中相同
const Toast = ({ show, message, type = 'success', onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const icons = {
    success: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }

  return (
    <div className={`fixed top-20 right-4 z-[60] transform transition-all duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className={`flex items-center p-4 rounded-lg border shadow-lg ${bgColors[type]} min-w-[320px] max-w-md`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function UpdateAnnouncementModal({ isOpen, onClose, announcement, refreshAnnouncements }) {
  const [show, setShow] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    status: announcement?.is_active ? '1' : '0',
    category: '',
    application_deadline: '',
    target_audience: '',
    application_limitations: '',
    submission_method: '',
    external_urls: ''
  })

  useEffect(() => {
    if (isOpen) {
      // 阻止外部頁面滾動
      document.body.style.overflow = 'hidden';
      
      setFormData({
        title: announcement?.title || '',
        summary: announcement?.summary || '',
        status: announcement?.is_active ? '1' : '0',
        category: announcement?.category || '',
        application_deadline: announcement?.application_deadline || '',
        target_audience: announcement?.target_audience || '',
        application_limitations: announcement?.application_limitations || '',
        submission_method: announcement?.submission_method || '',
        external_urls: announcement?.external_urls || ''
      })
      
      // 載入現有附件
      loadExistingAttachments(announcement?.id);
      
      setTimeout(() => setShow(true), 50)
    } else {
      // 恢復外部頁面滾動
      document.body.style.overflow = 'unset';
      setShow(false)
    }
    
    // 清理函數：確保組件卸載時恢復滾動
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, announcement])

  // 載入現有附件的函數
  const loadExistingAttachments = async (announcementId) => {
    if (!announcementId) return;
    
    try {
      const { data: attachments, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('announcement_id', announcementId);
      
      if (error) throw error;
      
      // 將現有附件轉換為顯示格式
      if (attachments && attachments.length > 0) {
        const existingFiles = attachments.map(attachment => ({
          id: attachment.id,
          name: attachment.file_name,
          size: attachment.file_size,
          type: attachment.mime_type,
          path: attachment.stored_file_path,
          isExisting: true // 標記為現有檔案
        }));
        setSelectedFiles(existingFiles);
      }
    } catch (error) {
      console.error('載入附件失敗:', error);
      showToast('載入附件失敗', 'error');
    }
  };

  // 處理檔案下載
  const handleFileDownload = async (file) => {
    try {
      // 對於現有檔案，使用儲存的路徑
      if (file.isExisting && file.path) {
        // 構建完整的檔案 URL，確保檔案可以被正確訪問
        const fileUrl = file.path.startsWith('/') ? file.path : `/${file.path}`;
        
        // 使用 window.open 來下載檔案，這樣可以更好地處理檔案下載
        window.open(fileUrl, '_blank');
        
        showToast(`正在下載檔案: ${file.name}`, 'success');
      } else {
        showToast('無法下載此檔案', 'error');
      }
    } catch (error) {
      console.error('下載失敗:', error);
      showToast('檔案下載失敗', 'error');
    }
  };

  const showToast = (message, type = 'success') => setToast({ show: true, message, type })
  const hideToast = () => setToast(prev => ({ ...prev, show: false }))

  const stripHtmlTags = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').trim()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSummaryChange = useCallback((content) => {
    setFormData(prev => ({ ...prev, summary: content }))
  }, [])

  const isFormValid = formData.title.trim() !== '' && formData.summary.replace(/<[^>]*>?/gm, '').trim() !== ''

  const handleSave = async () => {
    if (!isFormValid) {
      showToast('請填寫所有必填欄位', 'warning')
      return
    }
    setIsSaving(true)
    try {
      const { data: updated, error } = await supabase
        .from('announcements')
        .update({
          title: formData.title,
          summary: formData.summary,
          category: formData.category,
          application_deadline: formData.application_deadline || null,
          target_audience: formData.target_audience,
          application_limitations: formData.application_limitations,
          submission_method: formData.submission_method,
          external_urls: formData.external_urls,
          is_active: formData.status === '1'
        })
        .eq('id', announcement.id)
        .select()
        .single()
      if (error) throw error

      // 上傳新檔案到本地儲存
      const newFiles = selectedFiles.filter(file => !file.isExisting);
      if (newFiles.length > 0) {
        const uploadFormData = new FormData();
        newFiles.forEach(file => {
          uploadFormData.append('files', file);
        });
        uploadFormData.append('announcementId', updated.id.toString());

        const uploadResponse = await fetch('/api/upload-files', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('檔案上傳失敗');
        }

        const uploadResult = await uploadResponse.json();
        
        // 將新檔案資訊儲存到資料庫
        for (const uploadedFile of uploadResult.files) {
          const { error: insErr } = await supabase.from('attachments').insert({
            announcement_id: updated.id,
            file_name: uploadedFile.originalName,
            stored_file_path: uploadedFile.relativePath,
            file_size: uploadedFile.size,
            mime_type: uploadedFile.mimeType,
          });
          if (insErr) throw insErr;
        }
      }

      // 處理被移除的現有檔案
      // 獲取原始附件列表
      const { data: originalAttachments, error: fetchError } = await supabase
        .from('attachments')
        .select('*')
        .eq('announcement_id', updated.id);
      
      if (fetchError) throw fetchError;
      
      // 找出被移除的檔案
      const currentExistingFiles = selectedFiles.filter(file => file.isExisting);
      const removedAttachments = originalAttachments.filter(
        original => !currentExistingFiles.some(current => current.id === original.id)
      );
      
      // 刪除被移除的檔案記錄
      for (const removedAttachment of removedAttachments) {
        const { error: deleteError } = await supabase
          .from('attachments')
          .delete()
          .eq('id', removedAttachment.id);
        
        if (deleteError) throw deleteError;
      }

      showToast('公告已更新', 'success')
      if (refreshAnnouncements) refreshAnnouncements()
      handleClose()
    } catch (err) {
      console.error('更新失敗:', err)
      showToast(`更新失敗: ${err.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = useCallback(() => {
    if (isSaving) return
    setShow(false)
    setTimeout(() => {
      // 恢復外部頁面滾動
      document.body.style.overflow = 'unset';
      onClose()
      setSelectedFiles([])
    }, 300)
  }, [isSaving, onClose])

  if (!isOpen) return null

  return (
    <>
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div
        className={`fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-4 pt-20 pb-8 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-modal="true"
        role="dialog"
      >
        <div
          className={`bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col transition-all duration-300 ${show ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800">更新公告</h2>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full disabled:cursor-not-allowed"
            >
              &times;
            </button>
          </div>
          <div className="p-4 md:p-6 flex-grow overflow-y-auto scrollbar-hide relative" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {isSaving && (
              <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-lg">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="mt-4 text-indigo-700 font-semibold">儲存中...</p>
              </div>
            )}
            <form className="space-y-6" noValidate>
              <fieldset className="p-6 bg-white rounded-lg border shadow-sm">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">公告標題 (必填)</label>
                      <input type="text" id="title" name="title" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.title} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">公告狀態</label>
                      <select id="status" name="status" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.status} onChange={handleChange} disabled={isSaving}>
                        <option value="0">下架 (草稿)</option>
                        <option value="1">上架</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">獎學金分類</label>
                      <select id="category" name="category" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.category} onChange={handleChange} disabled={isSaving}>
                        <option value="">請選擇</option>
                        <option value="A">A: 縣市政府</option>
                        <option value="B">B: 其他公家機關</option>
                        <option value="C">C: 宗親會/指定身分</option>
                        <option value="D">D: 其他民間單位</option>
                        <option value="E">E: 得獎名單</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="application_deadline" className="block text-sm font-semibold text-gray-700 mb-2">申請截止日期</label>
                      <input type="date" id="application_deadline" name="application_deadline" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.application_deadline} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div>
                      <label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-2">送件方式</label>
                      <input type="text" id="submission_method" name="submission_method" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={stripHtmlTags(formData.submission_method)} onChange={(e) => setFormData(prev => ({ ...prev, submission_method: e.target.value }))} disabled={isSaving} />
                    </div>
                    <div>
                      <label htmlFor="external_urls" className="block text-sm font-semibold text-gray-700 mb-2">外部連結</label>
                      <input type="url" id="external_urls" name="external_urls" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" value={formData.external_urls} onChange={handleChange} disabled={isSaving} placeholder="相關網頁連結..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="target_audience" className="block text-sm font-semibold text-gray-700 mb-2">適用對象</label>
                      <textarea id="target_audience" name="target_audience" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[80px] resize-none" rows={3} value={stripHtmlTags(formData.target_audience)} onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))} disabled={isSaving} placeholder="申請資格或適用對象..." />
                    </div>
                    <div>
                      <label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-2">申請限制</label>
                      <textarea id="application_limitations" name="application_limitations" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[80px] resize-none" rows={3} value={stripHtmlTags(formData.application_limitations)} onChange={(e) => setFormData(prev => ({ ...prev, application_limitations: e.target.value }))} disabled={isSaving} placeholder="申請資格限制或注意事項..." />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-2">公告摘要 (必填)</label>
                    <QuillEditor value={formData.summary} onChange={handleSummaryChange} disabled={isSaving} />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">附件上傳</label>
                    <MultipleFilesUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isSaving} showToast={showToast} />
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
          <div className="p-4 bg-gray-100/80 backdrop-blur-sm border-t flex justify-end space-x-3 flex-shrink-0 rounded-b-2xl">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>取消</Button>
            <Button type="button" variant="primary" onClick={handleSave} loading={isSaving}>保存</Button>
          </div>
        </div>
      </div>
    </>
  )
}
