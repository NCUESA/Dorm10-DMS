'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import QuillEditor from './QuillEditor';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { X, Loader2, Save, Trash2, Undo, UploadCloud, File as FileIcon, Link as LinkIcon, PlusCircle } from 'lucide-react';

// --- Reusable Components for this Modal ---
const formatFileSize = (size) => {
    if (!size) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const FileItem = ({ file, onRemove, onUndelete, isMarkedForDeletion }) => {
    const isExisting = file.isExisting;
    return (
        <div className={`relative flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${isMarkedForDeletion ? 'bg-red-100' : 'bg-white border'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
                <FileIcon className={`h-6 w-6 flex-shrink-0 ${isExisting ? 'text-blue-500' : 'text-green-500'}`} />
                <div className="overflow-hidden">
                    <p className={`text-sm font-medium text-gray-800 truncate ${isMarkedForDeletion ? 'line-through' : ''}`}>{file.name}</p>
                    <p className="text-xs text-gray-500">{file.type} • {formatFileSize(file.size)}</p>
                </div>
            </div>
            <button
                onClick={isMarkedForDeletion ? onUndelete : onRemove}
                className={`p-1 rounded-full transition-colors ${isMarkedForDeletion ? 'text-yellow-600 hover:bg-yellow-200' : 'text-red-500 hover:bg-red-100'}`}
                title={isMarkedForDeletion ? "取消刪除" : "標記為刪除"}
            >
                {isMarkedForDeletion ? <Undo size={18} /> : <Trash2 size={18} />}
            </button>
        </div>
    );
};

const MultipleFilesUploadArea = ({ selectedFiles, setSelectedFiles, filesToRemove, setFilesToRemove, disabled, showToast }) => {
    const fileInputRef = useRef(null);
    const maxFiles = 5;
    const supportedTypes = { 'application/pdf': 'PDF', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX', 'application/msword': 'DOC', 'image/jpeg': '圖片', 'image/jpg': '圖片', 'image/png': '圖片', 'image/gif': '圖片', 'image/webp': '圖片' };

    const handleFiles = (files) => {
        let newFiles = [];
        for (const file of files) {
            if (!supportedTypes[file.type]) { showToast(`不支援的檔案類型: ${file.name}`, 'warning'); continue; }
            if (file.size > 10 * 1024 * 1024) { showToast(`檔案過大: ${file.name}`, 'warning'); continue; }
            if (selectedFiles.length + newFiles.length >= maxFiles) { showToast(`最多只能選擇 ${maxFiles} 個檔案`, 'warning'); break; }
            newFiles.push(file);
        }
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileChange = (e) => { handleFiles(Array.from(e.target.files)); e.target.value = ''; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); };

    const handleRemoveFile = (index) => {
        const file = selectedFiles[index];
        if (file.isExisting) {
            setFilesToRemove(prev => [...prev, file]);
        } else {
            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleUndeleteFile = (fileToUndelete) => {
        setFilesToRemove(prev => prev.filter(f => f.id !== fileToUndelete.id));
    };

    return (
        <div className="space-y-4">
            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${!disabled ? 'border-gray-300 hover:border-indigo-400 bg-transparent cursor-pointer' : 'bg-gray-100/50 cursor-not-allowed'}`}
                onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => !disabled && fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp" disabled={disabled} multiple />
                <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">拖曳檔案到此，或 <span className="font-medium text-indigo-600">點擊上傳</span></p>
                <p className="mt-1 text-xs text-gray-500">已選擇 {selectedFiles.length} / {maxFiles} 個檔案</p>
            </div>
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-lg p-2 bg-transparent">
                        {selectedFiles.map((file, index) => (
                            <FileItem key={file.id || `new-${index}`} file={file}
                                onRemove={() => handleRemoveFile(index)}
                                onUndelete={() => handleUndeleteFile(file)}
                                isMarkedForDeletion={filesToRemove.some(f => f.id === file.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


export default function UpdateAnnouncementModal({ isOpen, onClose, announcement, refreshAnnouncements }) {
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filesToRemove, setFilesToRemove] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        is_active: false,
        category: '',
        application_start_date: '',
        application_end_date: '',
        target_audience: '',
        application_limitations: '',
        submission_method: '',
        external_urls: [{ url: '' }]
    });

    const inputStyles = "w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30";

    useEffect(() => {
        if (isOpen && announcement) {
            document.body.style.overflow = 'hidden';
            let urls = [{ url: '' }];
            try {
                const parsedUrls = JSON.parse(announcement.external_urls);
                if (Array.isArray(parsedUrls) && parsedUrls.length > 0) { urls = parsedUrls; }
            } catch (e) {
                if (typeof announcement.external_urls === 'string' && announcement.external_urls.startsWith('http')) {
                    urls = [{ url: announcement.external_urls }];
                }
            }

            setFormData({
                title: announcement.title || '',
                summary: announcement.summary || '',
                is_active: announcement.is_active,
                category: announcement.category || '',
                application_start_date: announcement.application_start_date || '',
                application_end_date: announcement.application_end_date || '',
                target_audience: announcement.target_audience || '',
                application_limitations: announcement.application_limitations || '',
                submission_method: announcement.submission_method || '',
                external_urls: urls
            });

            loadExistingAttachments(announcement.id);
            setFilesToRemove([]);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, announcement]);

    const loadExistingAttachments = async (announcementId) => {
        if (!announcementId) return setSelectedFiles([]);
        try {
            const { data, error } = await supabase.from('attachments').select('*').eq('announcement_id', announcementId);
            if (error) throw error;
            const existingFiles = (data || []).map(att => ({
                id: att.id, name: att.file_name, size: att.file_size, type: att.mime_type,
                path: att.stored_file_path, isExisting: true
            }));
            setSelectedFiles(existingFiles);
        } catch (error) { showToast('載入附件失敗', 'error'); }
    };

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSummaryChange = useCallback((content) => setFormData(prev => ({ ...prev, summary: content })), []);
    const handleTargetAudienceChange = useCallback((content) => setFormData(prev => ({ ...prev, target_audience: content })), []);

    const handleUrlChange = (index, value) => {
        const newUrls = [...formData.external_urls]; newUrls[index].url = value;
        setFormData(prev => ({ ...prev, external_urls: newUrls }));
    };
    const addUrlInput = () => setFormData(prev => ({ ...prev, external_urls: [...prev.external_urls, { url: '' }] }));
    const removeUrlInput = (index) => setFormData(prev => ({ ...prev, external_urls: prev.external_urls.filter((_, i) => i !== index) }));

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.summary.replace(/<[^>]*>?/gm, '').trim()) {
            showToast('請填寫所有必填欄位', 'warning'); return;
        }
        setIsSaving(true);
        try {
            const finalUrls = formData.external_urls.filter(item => item.url.trim() !== '');

            const { data: updated, error } = await supabase.from('announcements').update({
                title: formData.title,
                summary: formData.summary,
                is_active: formData.is_active,
                category: formData.category,
                application_start_date: formData.application_start_date || null,
                application_end_date: formData.application_end_date || null,
                target_audience: formData.target_audience,
                application_limitations: formData.application_limitations,
                submission_method: formData.submission_method,
                external_urls: JSON.stringify(finalUrls)
            }).eq('id', announcement.id).select().single();
            if (error) throw error;

            if (filesToRemove.length > 0) {
                const pathsToRemove = filesToRemove.map(f => f.path);
                const idsToRemove = filesToRemove.map(f => f.id);
                await authFetch('/api/delete-files', { method: 'POST', body: JSON.stringify({ filePaths: pathsToRemove }) });
                const { error: deleteDbError } = await supabase.from('attachments').delete().in('id', idsToRemove);
                if (deleteDbError) throw deleteDbError;
            }

            const newFiles = selectedFiles.filter(file => !file.isExisting);
            for (const file of newFiles) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                const uploadResponse = await authFetch('/api/upload-files', { method: 'POST', body: uploadFormData });
                if (!uploadResponse.ok) throw new Error(`檔案 "${file.name}" 上傳失敗`);
                const uploadResult = await uploadResponse.json();
                const { data: uploadedFileData } = uploadResult;
                const { error: insErr } = await supabase.from('attachments').insert({
                    announcement_id: updated.id, file_name: uploadedFileData.originalName, stored_file_path: uploadedFileData.path,
                    file_size: uploadedFileData.size, mime_type: uploadedFileData.mimeType,
                });
                if (insErr) throw insErr;
            }

            showToast('公告已成功更新', 'success');
            if (refreshAnnouncements) refreshAnnouncements();
            onClose();
        } catch (err) {
            showToast(`更新失敗: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-16"
                        onClick={onClose}>
                        <motion.div
                            initial={{ scale: 0.95, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 50, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="relative bg-white/85 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-white/20"
                            style={{ height: 'calc(100vh - 10rem)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-lg font-bold text-gray-800">編輯公告</h2>
                                <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-gray-600 p-2 rounded-full"><X size={20} /></button>
                            </div>

                            <div className="flex-grow p-6 overflow-y-auto">
                                <div className="space-y-6">
                                    {isSaving && (<div className="absolute inset-0 bg-white/70 z-20 flex flex-col items-center justify-center rounded-lg"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /><p className="mt-4 text-indigo-700 font-semibold">儲存中...</p></div>)}

                                    <div>
                                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            公告標題 <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input type="text" id="title" name="title" className={inputStyles} value={formData.title} onChange={handleChange} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label htmlFor="is_active" className="block text-sm font-semibold text-gray-700 mb-1.5">公告狀態</label><select id="is_active" name="is_active" className={inputStyles} value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}><option value={false}>下架</option><option value={true}>上架</option></select></div>
                                        <div><label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5">獎學金分類</label><select id="category" name="category" className={inputStyles} value={formData.category} onChange={handleChange}><option value="">請選擇</option><option value="A">A：各縣市政府獎學金</option><option value="B">B：縣市政府以外之各級公家機關及公營單位獎學金</option><option value="C">C：宗教及民間各項指定身分獎學金</option><option value="D">D：非公家機關或其他無法歸類的獎學金</option><option value="E">E：獎學金得獎名單公告</option></select></div>
                                        <div><label htmlFor="application_start_date" className="block text-sm font-semibold text-gray-700 mb-1.5">申請開始日期</label><input type="date" id="application_start_date" name="application_start_date" className={inputStyles} value={formData.application_start_date} onChange={handleChange} /></div>
                                        <div><label htmlFor="application_end_date" className="block text-sm font-semibold text-gray-700 mb-1.5">申請截止日期</label><input type="date" id="application_end_date" name="application_end_date" className={inputStyles} value={formData.application_end_date} onChange={handleChange} /></div>
                                        <div><label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-1.5">送件方式</label><input type="text" id="submission_method" name="submission_method" className={inputStyles} value={formData.submission_method} onChange={handleChange} /></div>

                                        <div>
                                            <label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-1.5">申請限制</label>
                                            <select id="application_limitations" name="application_limitations" className={inputStyles} value={formData.application_limitations} onChange={handleChange}>
                                                <option value="">未指定</option>
                                                <option value="Y">Y (可兼領)</option>
                                                <option value="N">N (不可兼領)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col min-h-[250px]">
                                        <label htmlFor="target_audience" className="block text-sm font-semibold text-gray-700 mb-1.5">適用對象</label>
                                        <div className="relative flex-grow">
                                            <QuillEditor value={formData.target_audience} onChange={handleTargetAudienceChange} disabled={isSaving} />
                                        </div>
                                    </div>

                                    <div className="flex flex-col min-h-[400px]">
                                        <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0">
                                            公告摘要 <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative flex-grow">
                                            <QuillEditor value={formData.summary} onChange={handleSummaryChange} disabled={isSaving} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-500/5 rounded-lg border">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">附件與連結</label>
                                        <MultipleFilesUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} filesToRemove={filesToRemove} setFilesToRemove={setFilesToRemove} disabled={isSaving} showToast={showToast} />
                                        <div className="mt-4 space-y-2">
                                            <label className="block text-sm font-medium text-gray-600 flex items-center gap-2"><LinkIcon size={16} />外部參考連結</label>
                                            {formData.external_urls.map((item, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input type="url" className={inputStyles} value={item.url} onChange={(e) => handleUrlChange(index, e.target.value)} placeholder="https://example.com" />
                                                    {formData.external_urls.length > 1 && (<button type="button" onClick={() => removeUrlInput(index)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>)}
                                                </div>
                                            ))}
                                            <Button type="button" variant="ghost" size="sm" onClick={addUrlInput} leftIcon={<PlusCircle size={16} />}>新增連結</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-black/5 flex justify-end space-x-3 flex-shrink-0">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>取消</Button>
                                <Button type="button" variant="primary" onClick={handleSave} loading={isSaving} leftIcon={<Save size={16} />}>儲存變更</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}