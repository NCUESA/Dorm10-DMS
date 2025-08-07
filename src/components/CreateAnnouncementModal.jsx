'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import QuillEditor from './QuillEditor';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { X, Loader2, Save, Trash2, UploadCloud, Link as LinkIcon, PlusCircle, File as FileIcon } from 'lucide-react';

// --- Reusable Sub-Components for this Modal ---

const InputModeSelector = ({ inputMode, setInputMode, disabled }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">選擇輸入模式</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${inputMode === 'ai' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 hover:border-gray-400'}`} onClick={() => !disabled && setInputMode('ai')}>
                <h4 className="font-bold text-gray-900">AI 智慧分析</h4>
                <p className="text-sm text-gray-600 mt-1">上傳檔案或網址，由 AI 自動生成</p>
            </div>
            <div className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${inputMode === 'manual' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 hover:border-gray-400'}`} onClick={() => !disabled && setInputMode('manual')}>
                <h4 className="font-bold text-gray-900">手動輸入</h4>
                <p className="text-sm text-gray-600 mt-1">自行填寫所有公告欄位</p>
            </div>
        </div>
    </div>
);

const FileUploadArea = ({ selectedFiles, setSelectedFiles, disabled, showToast }) => {
    const fileInputRef = useRef(null);
    const maxFiles = 5;
    const supportedTypes = { 'application/pdf': 'PDF', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX', 'application/msword': 'DOC', 'image/jpeg': '圖片', 'image/jpg': '圖片', 'image/png': '圖片', 'image/gif': '圖片', 'image/webp': '圖片' };

    const handleFiles = (files) => {
        let newFiles = [];
        for (const file of files) {
            if (selectedFiles.some(f => f.name === file.name)) { showToast(`檔案 "${file.name}" 已存在`, 'warning'); continue; }
            if (!supportedTypes[file.type]) { showToast(`不支援的檔案類型: ${file.name}`, 'warning'); continue; }
            if (file.size > 10 * 1024 * 1024) { showToast(`檔案過大: ${file.name}`, 'warning'); continue; }
            if (selectedFiles.length + newFiles.length >= maxFiles) { showToast(`最多只能選擇 ${maxFiles} 個檔案`, 'warning'); break; }
            file.isNewFile = true;
            newFiles.push(file);
        }
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileChange = (e) => { handleFiles(Array.from(e.target.files)); e.target.value = ''; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); };
    const handleRemoveFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const formatFileSize = (size) => {
        if (!size) return '0 B';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${!disabled ? 'border-gray-300 hover:border-indigo-400 bg-transparent cursor-pointer' : 'bg-gray-100/50 cursor-not-allowed'}`}
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
                             <div key={file.name + index} className="relative flex items-center justify-between p-3 rounded-lg bg-white border">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <FileIcon className="h-6 w-6 flex-shrink-0 text-blue-500" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{file.type} • {formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveFile(index)}
                                    className="p-1 rounded-full transition-colors text-red-500 hover:bg-red-100"
                                    title="移除"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const UrlInputArea = ({ urls, setUrls, disabled, showToast }) => {
    const [urlInput, setUrlInput] = useState('');
    const inputStyles = "w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30";

    const handleAddUrl = () => {
        const trimmedUrl = urlInput.trim();
        if (!trimmedUrl) { showToast('請輸入網址', 'warning'); return; }
        try { new URL(trimmedUrl); } catch { showToast('請輸入有效的網址', 'warning'); return; }
        if (urls.some(url => url === trimmedUrl)) { showToast('此網址已經存在', 'warning'); return; }
        setUrls(prev => [...prev, trimmedUrl]);
        setUrlInput('');
    };

    const handleRemoveUrl = (indexToRemove) => {
        setUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                    placeholder="輸入網址進行AI分析 (可選)" className={inputStyles} disabled={disabled}
                />
                <Button onClick={handleAddUrl} disabled={disabled || !urlInput.trim()}>添加</Button>
            </div>
            {urls.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto p-2">
                    {urls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <LinkIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline truncate">{url}</a>
                            </div>
                            {!disabled && (
                                <button onClick={() => handleRemoveUrl(index)} className="p-1 rounded-full text-red-500 hover:bg-red-100 ml-2" title="移除網址">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Modal Component ---
export default function CreateAnnouncementModal({ isOpen, onClose, refreshAnnouncements }) {
    const [inputMode, setInputMode] = useState('ai');
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("處理中...");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [urls, setUrls] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const modelRef = useRef(null);

    const initialFormData = {
        title: '', summary: '', category: '', application_start_date: '',
        announcement_end_date: '', target_audience: '', application_limitations: '',
        submission_method: '', external_urls: [{ url: '' }],
        is_active: true,
    };
    const [formData, setFormData] = useState(initialFormData);

    const inputStyles = "w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30";

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
                modelRef.current = genAI.getGenerativeModel({
                     model: "gemini-1.5-flash",
                     generationConfig: { responseMimeType: "application/json" },
                });
            } catch (error) {
                 console.error("Failed to initialize Gemini AI:", error);
                 showToast("AI 模型初始化失敗", "error");
            }
        } else {
            console.error("Gemini API Key is not set.");
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setInputMode('ai');
            setCurrentStep(0);
            setSelectedFiles([]);
            setUrls([]);
            setFormData(initialFormData);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSummaryChange = useCallback((content) => setFormData(prev => ({ ...prev, summary: content })), []);
    const handleTargetAudienceChange = useCallback((content) => setFormData(prev => ({ ...prev, target_audience: content })), []);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleUrlChange = (index, value) => {
        const newUrls = [...formData.external_urls];
        newUrls[index].url = value;
        setFormData(prev => ({ ...prev, external_urls: newUrls }));
    };
    const addUrlInput = () => setFormData(prev => ({ ...prev, external_urls: [...prev.external_urls, { url: '' }] }));
    const removeUrlInput = (index) => setFormData(prev => ({ ...prev, external_urls: prev.external_urls.filter((_, i) => i !== index) }));

    const isFormValid = formData.title.trim() !== '' && formData.summary.replace(/<[^>]*>?/gm, '').trim() !== '';

    const fileToGenerativePart = async (file) => {
        const base64EncodedData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
        return { inlineData: { data: base64EncodedData, mimeType: file.type } };
    };

    const handleAiAnalyze = async () => {
        if (selectedFiles.length === 0 && urls.length === 0) {
            showToast("請至少上傳一個檔案或提供一個網址", "warning"); return;
        }
        if (!modelRef.current) {
            showToast("AI 模型尚未初始化或初始化失敗", "error"); return;
        }

        setIsLoading(true);
        setCurrentStep(1);

        try {
            setLoadingText("正在準備分析資料...");
            const parts = [];
            const promptText = `
# 角色
你是一位頂尖的「彰化師範大學獎學金公告分析專家」。

# 核心任務
根據提供的「公告檔案」或「網址內容」，執行以下任務，並將結果合併在一個**單一的、格式完美的 JSON 物件**中回傳。

## 任務一：提取結構化資料 (JSON Extraction)
提取公告中的關鍵資訊，並嚴格遵循以下欄位規則。
### 欄位規則
- **不確定性原則**：若資訊未提及或不明確，**必須**回傳空字串 \`""\` 或 \`null\`。
- **日期格式**：所有日期欄位格式必須是 \`YYYY-MM-DD\`。民國年 + 1911 即為西元年。
- **欄位列表**：
    1.  \`title\` (string): 公告的**簡短**標題。
    2.  \`category\` (string): 根據下方的「代碼定義」從 'A'~'E' 中選擇一個。
    3.  \`application_start_date\` (date): **申請開始日期**。若無，回傳 \`null\`。
    4.  \`announcement_end_date\` (date): **公告結束日期** (通常是申請的截止日)。若無則回傳 \`null\`。
    5.  \`target_audience\` (text/HTML): **目標對象**。**此欄位必須是 HTML 格式**，並遵循下方的「視覺化與樣式指導」為關鍵字上色。
    6.  \`application_limitations\` (string): **兼領限制**。回傳 'Y' (可兼領), 'N' (不可兼領), 或 "" (未提及)。
    7.  \`submission_method\` (string): **送件方式**。
    8.  \`external_urls\` (array of objects): **所有相關網址**。將所有找到的 URL 整理成一個物件陣列，格式為 \`[{ "url": "https://..." }]\`。若無則回傳空陣列 \`[]\`。

## 任務二：生成 HTML 重點摘要 (HTML Summary Generation)
生成一份專業、條理分明的 HTML 格式重點摘要，放在 \`summary\` (text) 鍵中。
- **摘要必須包含**：申請資格、獎助金額、申請期限、應繳文件等。
- **視覺化呈現**：**優先使用 \`<ul>\`、\`<ol>\`、\`<table>\`**。

# 視覺化與樣式指導 (適用於 summary 和 target_audience)
- **金額、日期、名額**: \`<span style="color: #D6334C; font-weight: bold;">\`
- **身份、成績等條件**: \`<span style="color: #F79420; font-weight: bold;">\`
- **所有小標題**: \`<h4 style="color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;">\`

# 獎助學金代碼定義
A: 各縣市政府 | B: 公家機關 | C: 宗教及民間指定身分 | D: 其他民間單位 | E: 得獎名單

# 最終輸出規則
- **你的回覆必須是、也只能是一個 JSON 物件，不含任何 Markdown 標記。**

# 公告全文
---
請分析以下資訊：
${urls.length > 0 ? `\n# 網址資料來源:\n${urls.join('\n')}` : ''}
${selectedFiles.length > 0 ? '\n# 檔案資料來源' : ''}
`;
            parts.push({ text: promptText });

            if (selectedFiles.length > 0) {
                const fileForAnalysis = selectedFiles[0];
                parts.push(await fileToGenerativePart(fileForAnalysis));
                showToast(`使用檔案 "${fileForAnalysis.name}" 進行AI分析`, "success");
            }
            
            setLoadingText("AI 分析中，請稍候...");
            
            const result = await modelRef.current.generateContent({ contents: [{ parts }] });
            const response = result.response;
            const aiResponse = JSON.parse(response.text());

            if (!aiResponse.title || !aiResponse.summary) {
                 throw new Error("AI 回應中缺少 title 或 summary 欄位。");
            }
    
            setFormData(prev => ({
                 ...prev,
                 ...aiResponse,
                 is_active: true,
                 external_urls: Array.isArray(aiResponse.external_urls) && aiResponse.external_urls.length > 0 ? aiResponse.external_urls : [{ url: '' }],
            }));
            
            setCurrentStep(2);
    
        } catch (error) {
            console.error("AI 分析失敗:", error);
            showToast(`分析失敗: ${error.message}`, "error");
            setCurrentStep(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isFormValid) {
            showToast("請填寫所有必填欄位", "warning");
            return;
        }
        setIsLoading(true);
        setLoadingText("儲存中...");
        try {
            const uploadPromises = selectedFiles.filter(f => f.isNewFile).map(file => {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                return authFetch('/api/upload-files', { method: 'POST', body: uploadFormData });
            });
            const uploadResponses = await Promise.all(uploadPromises);
            const uploadedFilesData = await Promise.all(uploadResponses.map(res => {
                if (!res.ok) throw new Error('一個或多個檔案上傳失敗');
                return res.json();
            }));

            const finalUrls = formData.external_urls.filter(item => item.url && item.url.trim() !== '');

            const dataToInsert = {
                title: formData.title,
                summary: formData.summary,
                category: formData.category,
                application_start_date: formData.application_start_date || null,
                announcement_end_date: formData.announcement_end_date || null,
                target_audience: formData.target_audience,
                application_limitations: formData.application_limitations,
                submission_method: formData.submission_method,
                external_urls: JSON.stringify(finalUrls),
                is_active: formData.is_active,
            };

            const { data: announcement, error: announcementError } = await supabase
                .from('announcements')
                .insert(dataToInsert)
                .select().single();
            if (announcementError) throw announcementError;

            if (uploadedFilesData.length > 0) {
                const attachments = uploadedFilesData.map(result => ({
                    announcement_id: announcement.id,
                    file_name: result.data.originalName,
                    stored_file_path: result.data.path,
                    file_size: result.data.size,
                    mime_type: result.data.mimeType,
                }));
                const { error: attachmentError } = await supabase.from('attachments').insert(attachments);
                if (attachmentError) throw attachmentError;
            }

            showToast("公告發布成功!", "success");
            if (refreshAnnouncements) refreshAnnouncements();
            onClose();

        } catch (error) {
            console.error('儲存失敗:', error);
            showToast(`儲存失敗: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Render Functions ---
    const renderStepContent = () => {
        if (currentStep === 0) {
             return (
                 <div className="max-w-3xl mx-auto">
                    <InputModeSelector inputMode={inputMode} setInputMode={setInputMode} disabled={isLoading} />
                    <hr className="my-6 border-gray-200" />
                    {inputMode === 'ai' ? (
                        <div className="space-y-6">
                             <h3 className="text-lg font-semibold text-gray-800">1. 上傳檔案</h3>
                             <FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} />
                             <h3 className="text-lg font-semibold text-gray-800">2. 提供參考網址 (可選)</h3>
                             <UrlInputArea urls={urls} setUrls={setUrls} disabled={isLoading} showToast={showToast} />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 p-8 bg-gray-50/50 rounded-lg">
                             <h3 className="text-lg font-semibold text-gray-800 mb-4">手動輸入模式</h3>
                             <p>請點擊「下一步」開始手動填寫公告內容。</p>
                        </div>
                    )}
                 </div>
            );
        }
        if (currentStep === 1) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                     <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
                     <p className="text-lg font-semibold text-gray-900">{loadingText}</p>
                     <p className="text-sm text-gray-500 mt-2">請稍候，AI 正在為您生成公告內容...</p>
                </div>
            );
        }
        if (currentStep === 2) {
             return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-4 lg:pr-2 overflow-y-auto">
                        <div><label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">公告標題 (必填)</label><input type="text" id="title" name="title" className={inputStyles} value={formData.title} onChange={handleChange} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label htmlFor="is_active" className="block text-sm font-semibold text-gray-700 mb-1.5">公告狀態</label><select id="is_active" name="is_active" className={inputStyles} value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}><option value={true}>上架</option><option value={false}>下架</option></select></div>
                            <div><label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5">獎學金分類</label><select id="category" name="category" className={inputStyles} value={formData.category} onChange={handleChange}><option value="">請選擇</option><option value="A">A：各縣市政府</option><option value="B">B：公家機關</option><option value="C">C：宗教及民間指定身分</option><option value="D">D：其他民間單位</option><option value="E">E：得獎名單公告</option></select></div>
                        </div>
                         <div><label htmlFor="application_start_date" className="block text-sm font-semibold text-gray-700 mb-1.5">申請開始日期</label><input type="date" id="application_start_date" name="application_start_date" className={inputStyles} value={formData.application_start_date} onChange={handleChange} /></div>
                         <div><label htmlFor="announcement_end_date" className="block text-sm font-semibold text-gray-700 mb-1.5">公告結束日期</label><input type="date" id="announcement_end_date" name="announcement_end_date" className={inputStyles} value={formData.announcement_end_date} onChange={handleChange} /></div>
                        <div><label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-1.5">送件方式</label><input type="text" id="submission_method" name="submission_method" className={inputStyles} value={formData.submission_method} onChange={handleChange} /></div>
                        <div><label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-1.5">申請限制</label><input type="text" id="application_limitations" name="application_limitations" className={inputStyles} value={formData.application_limitations} onChange={handleChange} /></div>
                        
                        <div className="flex flex-col min-h-[200px]">
                             <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0">適用對象 (HTML)</label>
                             <div className="relative flex-grow">
                                <QuillEditor value={formData.target_audience} onChange={handleTargetAudienceChange} disabled={isLoading} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 flex flex-col h-full lg:pl-2">
                        <div className="flex-grow flex flex-col min-h-[300px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0">公告摘要 (必填)</label>
                            <div className="relative flex-grow">
                                <QuillEditor value={formData.summary} onChange={handleSummaryChange} disabled={isLoading} />
                            </div>
                        </div>
                        <div className="mt-6">
                             <div className="p-4 bg-slate-500/5 rounded-lg border">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">附件與連結</label>
                                <FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} />
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
                </div>
             );
        }
    };

    const handleNextStep = () => {
        if (inputMode === 'ai') {
            handleAiAnalyze();
        } else {
            setFormData(initialFormData);
            setCurrentStep(2); 
        }
    };

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
                            className="relative bg-white/85 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col overflow-hidden border border-white/20"
                            style={{ height: 'calc(100vh - 10rem)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-lg font-bold text-gray-800">建立新公告</h2>
                                <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 p-2 rounded-full"><X size={20} /></button>
                            </div>

                            <div className="flex-grow p-6 overflow-y-auto">
                                {renderStepContent()}
                            </div>

                            <div className="p-4 bg-black/5 flex justify-between items-center flex-shrink-0 border-t border-black/10">
                                 <div>
                                    {currentStep === 2 && (
                                        <Button type="button" variant="secondary" onClick={() => setCurrentStep(0)} disabled={isLoading}>返回上一步</Button>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>取消</Button>
                                    
                                    {currentStep === 0 && (
                                        <Button type="button" variant="primary" onClick={handleNextStep} disabled={isLoading || (inputMode === 'ai' && selectedFiles.length === 0 && urls.length === 0)}>
                                            {inputMode === 'ai' ? '開始 AI 分析' : '下一步'}
                                        </Button>
                                    )}

                                    {currentStep === 2 && (
                                        <Button type="button" variant="primary" onClick={handleSave} loading={isLoading} disabled={!isFormValid} leftIcon={<Save size={16} />}>儲存並發布</Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}