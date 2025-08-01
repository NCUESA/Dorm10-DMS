'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '@/lib/supabase/client';
import QuillEditor from './QuillEditor';
import Button from '@/components/ui/Button';

// Stepper component to show the current stage
const Stepper = ({ currentStep }) => {
    const steps = ['上傳檔案', 'AI 分析', '審閱發布'];
    return (
        <div className="flex items-center justify-center mb-4">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center text-sm md:text-base">
                    <div className={`flex items-center ${index <= currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 ${index <= currentStep ? 'bg-indigo-600 scale-105' : 'bg-gray-400'
                                }`}
                        >
                            {index + 1}
                        </div>
                        <span className="ml-2 font-medium hidden md:block">{step}</span>
                    </div>
                    {index < steps.length - 1 && <div className="w-8 md:w-16 h-0.5 mx-2 md:mx-4 bg-gray-300 rounded-full"></div>}
                </div>
            ))}
        </div>
    );
};

// Toast 通知組件
const Toast = ({ show, message, type = 'success', onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // 延長到 5 秒
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

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
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200'
    };

    return (
        <div className={`fixed top-20 right-4 z-[60] transform transition-all duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className={`flex items-center p-4 rounded-lg border shadow-lg ${bgColors[type]} min-w-[320px] max-w-md`}>
                <div className="flex-shrink-0">
                    {icons[type]}
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-800">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// URL Input Area component
const UrlInputArea = ({ urls, setUrls, disabled, showToast }) => {
    const [urlInput, setUrlInput] = useState('');
    
    const handleAddUrl = () => {
        const trimmedUrl = urlInput.trim();
        if (!trimmedUrl) {
            showToast('請輸入網址', 'warning');
            return;
        }
        
        // 簡單的 URL 驗證
        try {
            new URL(trimmedUrl);
        } catch {
            showToast('請輸入有效的網址', 'warning');
            return;
        }
        
        // 檢查是否已存在
        if (urls.some(url => url === trimmedUrl)) {
            showToast('此網址已經存在', 'warning');
            return;
        }
        
        setUrls(prev => [...prev, trimmedUrl]);
        setUrlInput('');
        showToast('網址已添加', 'success');
    };
    
    const handleRemoveUrl = (indexToRemove) => {
        setUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddUrl();
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="輸入網址進行AI分析 (例: https://example.com)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={disabled || !urlInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    添加
                </button>
            </div>
            
            {urls.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">已添加的網址：</h4>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                        {urls.map((url, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <a 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                                    >
                                        {url}
                                    </a>
                                </div>
                                {!disabled && (
                                    <button
                                        onClick={() => handleRemoveUrl(index)}
                                        className="text-red-500 hover:text-red-700 transition-colors ml-2"
                                        title="移除網址"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Multiple Files Upload Area component
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
    
    const validateAndAddFiles = (files) => {
        const validFiles = [];
        const fileArray = Array.from(files);
        const currentFilesCount = selectedFiles.length;
        
        for (const file of fileArray) {
            // 檢查是否已經存在相同名稱的檔案
            if (selectedFiles.some(existingFile => existingFile.name === file.name)) {
                showToast(`檔案 "${file.name}" 已經存在`, 'warning');
                continue;
            }
            
            // 檢查檔案數量限制（包括現有檔案）
            if (currentFilesCount + validFiles.length >= maxFiles) {
                showToast(`最多只能上傳 ${maxFiles} 個檔案`, 'warning');
                break;
            }
            
            // 檢查文件類型
            if (!supportedTypes[file.type]) {
                showToast(`檔案 "${file.name}" 格式不支援。請上傳 PDF、DOCX、DOC 或圖片文件。`, 'warning');
                continue;
            }
            
            // 檢查文件大小
            if (file.size > maxFileSize) {
                showToast(`檔案 "${file.name}" 大小超過限制。請選擇小於 10MB 的文件。`, 'warning');
                continue;
            }
            
            validFiles.push(file);
        }
        
        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
        }
    };
    
    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            validateAndAddFiles(files);
        }
        // 重置 input value 以允許重新選擇相同檔案
        event.target.value = '';
    };
    
    const handleDragOver = (event) => event.preventDefault();
    
    const handleDrop = (event) => {
        event.preventDefault();
        if (disabled) return;
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndAddFiles(files);
        }
    };
    
    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                                <div key={isExisting ? file.id : index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {isExisting ? (
                                            <button
                                                onClick={() => handleFileDownload(file)}
                                                className="group relative"
                                                title="點擊下載檔案"
                                            >
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className="h-8 w-8 text-blue-500 transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer" 
                                                    viewBox="0 0 20 20" 
                                                    fill="currentColor"
                                                >
                                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                                {/* Hover 提示 */}
                                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                                    點擊下載
                                                </div>
                                            </button>
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
                                                    路徑: {file.path}
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


// --- 主 Modal 組件 ---
export default function CreateAnnouncementModal({ isOpen, onClose, refreshAnnouncements, editingAnnouncement = null }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("AI 分析中...");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [urls, setUrls] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isEditMode = !!editingAnnouncement;
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        status: '1',
        category: '',
        application_deadline: '',
        target_audience: '',
        application_limitations: '',
        submission_method: '',
        external_urls: '',
    });

    // 當進入編輯模式時，填充表單數據和載入附件
    useEffect(() => {
        if (editingAnnouncement && isOpen) {
            setFormData({
                title: editingAnnouncement.title || '',
                summary: editingAnnouncement.summary || '',
                status: editingAnnouncement.is_active ? '1' : '0',
                category: editingAnnouncement.category || '',
                application_deadline: editingAnnouncement.application_deadline || '',
                target_audience: editingAnnouncement.target_audience || '',
                application_limitations: editingAnnouncement.application_limitations || '',
                submission_method: editingAnnouncement.submission_method || '',
                external_urls: editingAnnouncement.external_urls || '',
            });
            setCurrentStep(2); // 跳過文件上傳步驟
            
            // 載入現有附件
            loadExistingAttachments(editingAnnouncement.id);
        }
    }, [editingAnnouncement, isOpen]);

    // 載入現有附件的函數
    const loadExistingAttachments = async (announcementId) => {
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
                // 構建完整的檔案 URL
                const fileUrl = file.path.startsWith('/') ? file.path : `/${file.path}`;
                
                // 創建下載連結
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = file.name;
                link.target = '_blank';
                
                // 觸發下載
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showToast(`正在下載檔案: ${file.name}`, 'success');
            } else {
                showToast('無法下載此檔案', 'error');
            }
        } catch (error) {
            console.error('下載失敗:', error);
            showToast('檔案下載失敗', 'error');
        }
    };

    // Toast 通知狀態
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, show: false }));
    };
    
    const modelRef = useRef(null);
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            const genAI = new GoogleGenAI({
                apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            });
            modelRef.current = genAI;
        }
    }, []);

    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // 阻止外部頁面滾動
            document.body.style.overflow = 'hidden';
            setTimeout(() => setShow(true), 50);
        } else {
            // 恢復外部頁面滾動
            document.body.style.overflow = 'unset';
            setShow(false);
        }
        
        // 清理函數：確保組件卸載時恢復滾動
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const isFormValid = (() => {
        if (formData.title.trim() === '') return false;
        const pureTextSummary = formData.summary.replace(/<[^>]*>?/gm, '').trim();
        if (pureTextSummary === '') return false;
        return true;
    })();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 清理 HTML 標籤的函數
    const stripHtmlTags = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').trim();
    };
    
    const handleSummaryChange = useCallback((content) => {
        setFormData(prev => ({ ...prev, summary: content }));
    }, []);


    async function fileToGenerativePart(file) {
        const base64EncodedData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: base64EncodedData, mimeType: file.type },
        };
    }

    const handleAiAnalyze = async () => {
        if (selectedFiles.length === 0 && urls.length === 0) {
            showToast("請先選擇至少一個文件或添加一個網址", "warning");
            return;
        }
        if (!modelRef.current) {
            showToast("AI 模型尚未初始化。請檢查您的 Gemini API 金鑰環境變數。", "error");
            return;
        }

        setIsLoading(true);
        setCurrentStep(1); 

        try {
            setLoadingText("正在準備分析資料...");
            
            // 準備 prompt 內容
            let promptParts = [];
            let hasFileContent = false;
            
            // 如果有檔案，處理檔案
            if (selectedFiles.length > 0) {
                let fileForAnalysis;
                if (selectedFiles.length === 1) {
                    fileForAnalysis = selectedFiles[0];
                } else {
                    // 自動選擇第一個PDF檔案，如果沒有PDF則選擇第一個檔案
                    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
                    fileForAnalysis = pdfFiles.length > 0 ? pdfFiles[0] : selectedFiles[0];
                    showToast(`使用檔案 "${fileForAnalysis.name}" 進行AI分析`, "success");
                }
                
                const pdfPart = await fileToGenerativePart(fileForAnalysis);
                promptParts.push(pdfPart);
                hasFileContent = true;
            }
            
            // 建構 prompt 文字
            let promptText = `
# 角色 (Persona)
你是一位頂尖的「彰化師範大學獎學金公告分析專家」。你的任務是將獎學金相關資訊進行分析，提取結構化資料並生成摘要內容。你只須關注與「大學部」及「碩士班」學生相關的資訊，並嚴格遵循所有規則。

# 核心任務 (Core Task)
根據提供的資訊來源，提取關鍵資訊並生成結構化摘要內容。

### 欄位規則 (Field Rules)
- **不確定性原則**：若資訊未提及或不明確，**必須**回傳空字串 ""，**禁止**自行猜测。
- 對於 summary_content 欄位，請提取並整理關鍵內容項目，後續會在前端組合成 HTML 格式。

# 獎助學金代碼定義 (Category Definitions)
- **A**: 各縣市政府獎助學金
- **B**: 縣市政府以外之各級公家機關及公營單位獎助學金
- **C**: 宗親會及民間各項指定身分獎助學金 (指定姓名、籍貫、學系等)
- **D**: 各民間單位：因經濟不利、學業優良或其他無法歸類之獎助學金
- **E**: 純粹的獎學金「得獎名單」公告

請分析以下資訊：`;
            
            // 如果有網址，添加網址資訊
            if (urls.length > 0) {
                promptText += `\n\n# 網址資料來源：\n`;
                urls.forEach((url, index) => {
                    promptText += `${index + 1}. ${url}\n`;
                });
            }
            
            // 如果有檔案，添加檔案說明
            if (hasFileContent) {
                promptText += `\n\n# 檔案資料來源已上傳`;
            }
            
            promptParts.push({ text: promptText });

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "公告的簡短標題，必須包含提供單位和獎學金名稱"
                    },
                    category: {
                        type: Type.STRING,
                        description: "獎學金分類代碼 A-E"
                    },
                    application_deadline: {
                        type: Type.STRING,
                        description: "申請截止日期，格式 YYYY-MM-DD"
                    },
                    target_audience: {
                        type: Type.STRING,
                        description: "目標對象，包含年級、特殊身份、家庭狀況或成績要求等核心申請條件"
                    },
                    application_limitations: {
                        type: Type.STRING,
                        description: "兼領限制，Y=可以兼領，N=不可兼領，空字串=未提及"
                    },
                    submission_method: {
                        type: Type.STRING,
                        description: "送件方式，簡要說明最終的送件管道"
                    },
                    external_urls: {
                        type: Type.STRING,
                        description: "相關網址或連結"
                    },
                    summary_content: {
                        type: Type.OBJECT,
                        properties: {
                            sections: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: {
                                            type: Type.STRING,
                                            description: "小標題"
                                        },
                                        content: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    type: {
                                                        type: Type.STRING,
                                                        description: "內容類型：text, list, table, highlight_number, highlight_condition"
                                                    },
                                                    text: {
                                                        type: Type.STRING,
                                                        description: "文字內容"
                                                    },
                                                    items: {
                                                        type: Type.ARRAY,
                                                        items: {
                                                            type: Type.STRING
                                                        },
                                                        description: "列表項目，當type為list時使用"
                                                    },
                                                    table_data: {
                                                        type: Type.ARRAY,
                                                        items: {
                                                            type: Type.ARRAY,
                                                            items: {
                                                                type: Type.STRING
                                                            }
                                                        },
                                                        description: "表格數據，當type為table時使用"
                                                    }
                                                },
                                                required: ["type"]
                                            }
                                        }
                                    },
                                    required: ["title", "content"]
                                }
                            }
                        },
                        required: ["sections"]
                    }
                },
                required: ["title", "category", "application_deadline", "target_audience", "application_limitations", "submission_method", "external_urls", "summary_content"],
                propertyOrdering: ["title", "category", "application_deadline", "target_audience", "application_limitations", "submission_method", "external_urls", "summary_content"]
            };

            // 配置 tools 和 config
            const tools = urls.length > 0 ? [{ urlContext: {} }] : [];
            
            const config = {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                tools: tools,
                systemInstruction: [
                    {
                        text: `繁體中文回應。如果有提供網址，請詳細分析網頁內容並提取相關的獎學金資訊。`,
                    }
                ],
                mediaResolution: 'MEDIA_RESOLUTION_MEDIUM'
            };

            const model = 'gemini-2.5-flash';
            const contents = [
                {
                    role: 'user',
                    parts: promptParts,
                },
            ];

            setLoadingText("AI 分析中，請稍候...");

            const response = await modelRef.current.models.generateContentStream({
                model,
                config,
                contents,
            });

            setLoadingText("正在解析結果...");
            let result = '';
            for await (const chunk of response) {
                result += chunk.text || '';
            }

            const aiResponse = JSON.parse(result);
            
            // 在前端組合 HTML 格式的 summary
            const summary = generateHtmlSummary(aiResponse.summary_content);
            
            const processedResponse = {
                ...aiResponse,
                summary: summary
            };
            delete processedResponse.summary_content;

            setFormData(prev => ({
                ...prev,
                ...processedResponse,
                status: prev.status || '1',
            }));
            
            setCurrentStep(2);

        } catch (error) {
            console.error("AI 分析失敗:", error);
            showToast(`AI 分析時發生錯誤: ${error.message}`, "error");
            setCurrentStep(0);
        } finally {
            setIsLoading(false);
        }
    };

    // 生成 HTML 格式摘要的函數
    const generateHtmlSummary = (summaryContent) => {
        if (!summaryContent || !summaryContent.sections) return '';
        
        // 定義需要特殊標註的關鍵字模式
        const highlightPatterns = {
            // 紅色 - 金額、日期、名額等數字類關鍵字
            red: [
                /(\d+[\d,]*)\s*元/g,                    // 金額
                /(\d+)\s*名/g,                          // 名額
                /(\d+)\s*位/g,                          // 位數
                /(\d{2,4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g, // 日期
                /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,        // 日期格式
                /(\d{1,2}-\d{1,2}-\d{2,4})/g,          // 日期格式
                /(\d+)\s*學分/g,                        // 學分
                /(\d+)\s*點/g,                          // 點數
                /前\s*(\d+)\s*名/g,                     // 排名
                /第\s*(\d+)\s*名/g,                     // 排名
                /(\d+)\s*萬/g,                          // 萬元
                /(\d+)\s*千/g,                          // 千元
                /平均\s*(\d+\.?\d*)/g,                  // 平均分數
                /(\d+)\s*分/g,                          // 分數
                /(\d+)\s*級分/g,                        // 級分
                /(\d+)\s*%/g,                           // 百分比
                /(\d+)\s*件/g                           // 件數
            ],
            // 橙色 - 身份、成績、申請條件
            orange: [
                /(大[一二三四]|碩[一二]|博[一二三四五六七八])/g,  // 年級
                /(低收入戶|中低收入戶)/g,                // 經濟狀況
                /(原住民|身心障礙|清寒)/g,              // 特殊身份
                /(優秀|傑出|優良|卓越)/g,               // 優秀相關
                /(學業成績|操行成績|學期成績)/g,         // 成績相關
                /(全班前\d+%|全系前\d+%|全校前\d+%)/g,  // 排名
                /(碩士班|大學部|博士班)/g,               // 學制
                /(在學|就讀|修讀)/g,                     // 就學狀態
                /(設籍|戶籍)/g,                         // 戶籍相關
                /(家庭年收入|年收入)/g,                  // 收入相關
                /(持有證明|檢附證明)/g,                  // 證明文件
                /(具備|符合|滿足)/g,                     // 條件符合
                /(限制|禁止|不得)/g                      // 限制條件
            ]
        };
        
        // 文字高亮處理函數
        const highlightText = (text) => {
            if (!text) return text;
            
            let processedText = text;
            
            // 先處理紅色高亮（數字相關）
            highlightPatterns.red.forEach(pattern => {
                processedText = processedText.replace(pattern, (match) => {
                    return `<span style="color: #D6334C; font-weight: bold;">${match}</span>`;
                });
            });
            
            // 再處理橙色高亮（條件相關）
            highlightPatterns.orange.forEach(pattern => {
                processedText = processedText.replace(pattern, (match) => {
                    // 避免重複標註已經被標註的內容
                    if (match.includes('<span')) return match;
                    return `<span style="color: #F79420; font-weight: bold;">${match}</span>`;
                });
            });
            
            return processedText;
        };
        
        let html = '';
        
        summaryContent.sections.forEach(section => {
            // 添加小標題
            html += `<h4 style="color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;">${highlightText(section.title)}</h4>`;
            
            section.content.forEach(item => {
                switch (item.type) {
                    case 'text':
                        html += `<p>${highlightText(item.text)}</p>`;
                        break;
                    case 'list':
                        if (item.items && item.items.length > 0) {
                            html += '<ul>';
                            item.items.forEach(listItem => {
                                html += `<li>${highlightText(listItem)}</li>`;
                            });
                            html += '</ul>';
                        }
                        break;
                    case 'table':
                        if (item.table_data && item.table_data.length > 0) {
                            html += '<table style="border-collapse: collapse; width: 100%;"><tbody>';
                            item.table_data.forEach(row => {
                                html += '<tr>';
                                row.forEach(cell => {
                                    html += `<td style="border: 1px solid #ddd; padding: 8px;">${highlightText(cell)}</td>`;
                                });
                                html += '</tr>';
                            });
                            html += '</tbody></table>';
                        }
                        break;
                    case 'highlight_number':
                        // 這些已經由 AI 預先分類，直接使用指定顏色
                        html += `<p><span style="color: #D6334C; font-weight: bold;">${item.text}</span></p>`;
                        break;
                    case 'highlight_condition':
                        // 這些已經由 AI 預先分類，直接使用指定顏色
                        html += `<p><span style="color: #F79420; font-weight: bold;">${item.text}</span></p>`;
                        break;
                    default:
                        html += `<p>${highlightText(item.text || '')}</p>`;
                        break;
                }
            });
        });
        
        return html;
    };
    
    const handleSave = async () => {
        if (!isFormValid) {
            showToast("請填寫所有必填欄位", "warning");
            return;
        }
        setIsLoading(true);
        setLoadingText(isEditMode ? "更新中..." : "儲存中...");

        try {
            const announcementData = {
                title: formData.title,
                summary: formData.summary,
                category: formData.category,
                application_deadline: formData.application_deadline || null,
                target_audience: formData.target_audience,
                application_limitations: formData.application_limitations,
                submission_method: formData.submission_method,
                external_urls: formData.external_urls,
                is_active: formData.status === '1',
            };

            let announcementId;
            if (isEditMode) {
                const { data: updated, error } = await supabase
                    .from('announcements')
                    .update(announcementData)
                    .eq('id', editingAnnouncement.id)
                    .select()
                    .single();
                if (error) throw error;
                announcementId = updated.id;
            } else {
                const { data: created, error } = await supabase
                    .from('announcements')
                    .insert([announcementData])
                    .select()
                    .single();
                if (error) throw error;
                announcementId = created.id;
            }

            // 上傳新檔案到本地儲存
            const newFiles = selectedFiles.filter(file => !file.isExisting);
            if (newFiles.length > 0) {
                setLoadingText("上傳檔案中...");
                
                const uploadFormData = new FormData();
                newFiles.forEach(file => {
                    uploadFormData.append('files', file);
                });
                uploadFormData.append('announcementId', announcementId.toString());

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
                        announcement_id: announcementId,
                        file_name: uploadedFile.originalName,
                        stored_file_path: uploadedFile.relativePath,
                        file_size: uploadedFile.size,
                        mime_type: uploadedFile.mimeType,
                    });
                    if (insErr) throw insErr;
                }
            }

            // 處理被移除的現有檔案
            if (isEditMode) {
                // 獲取原始附件列表
                const { data: originalAttachments, error: fetchError } = await supabase
                    .from('attachments')
                    .select('*')
                    .eq('announcement_id', announcementId);
                
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
                    
                    // 可選：也可以從檔案系統中刪除實際檔案
                    // 這裡暫時跳過實際檔案刪除，只刪除資料庫記錄
                }
            }

            showToast(isEditMode ? "公告已成功更新！" : "公告已成功儲存！", "success");
            if (refreshAnnouncements) refreshAnnouncements();
            handleClose();
        } catch (error) {
            console.error(isEditMode ? "更新失敗:" : "儲存失敗:", error);
            showToast(`${isEditMode ? '更新' : '儲存'}失敗: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingAnnouncement) return;
        
        setIsLoading(true);
        setLoadingText("刪除中...");

        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', editingAnnouncement.id);

            if (error) throw error;
            showToast("公告已成功刪除！", "success");
            if (refreshAnnouncements) refreshAnnouncements();
            handleClose();
        } catch (error) {
            console.error("刪除失敗:", error);
            showToast(`刪除失敗: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleClose = useCallback(() => {
        if (isLoading) return;
        setShow(false);
        setTimeout(() => {
            // 恢復外部頁面滾動
            document.body.style.overflow = 'unset';
            onClose();
            setCurrentStep(0);
            setSelectedFiles([]);
            setUrls([]);
            setAttachments([]);
            setShowDeleteConfirm(false);
            setFormData({
                title: '', summary: '', status: '1', category: '',
                application_deadline: '', target_audience: '', application_limitations: '',
                submission_method: '', external_urls: '',
            });
        }, 300);
    }, [isLoading, onClose]);
    
    if (!isOpen) return null;

    return (
        <>
            <Toast 
                show={toast.show} 
                message={toast.message} 
                type={toast.type} 
                onClose={hideToast} 
            />
            
            {/* 刪除確認對話框 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center mb-4">
                            <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900">確認刪除</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            您確定要刪除「{formData.title}」這個公告嗎？此操作無法復原。
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                            >
                                取消
                            </Button>
                            <Button 
                                type="button" 
                                variant="danger" 
                                onClick={handleDelete}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                {isLoading ? '刪除中...' : '確認刪除'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <div
                className={`fixed inset-0 bg-black/60 z-50 flex justify-center items-start px-4 pt-24 pb-8 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
                aria-modal="true"
                role="dialog"
            >
            <div
                className={`bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl h-[calc(100vh-8rem)] flex flex-col transition-all duration-300 ${show ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b flex justify-between items-center flex-shrink-0 bg-gray-50 sticky top-0 z-20">
                    <h2 className="text-lg font-bold text-gray-800" id="modal-title">
                        {isEditMode ? '編輯獎學金公告' : '新增獎學金公告'}
                    </h2>
                    <button onClick={handleClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 p-2 rounded-full disabled:cursor-not-allowed">&times;</button>
                </div>
                <div className="p-4 md:p-6 flex-grow overflow-y-auto scrollbar-hide relative" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    <style jsx>{`
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/90 z-30 flex flex-col items-center justify-center">
                            <div className="bg-white rounded-xl p-6 shadow-2xl border max-w-xs w-full text-center">
                                <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">處理中</h3>
                                <p className="text-indigo-700 font-medium text-sm leading-relaxed">{loadingText}</p>
                                <div className="mt-3 text-xs text-gray-500">
                                    請稍候，這可能需要幾分鐘時間
                                </div>
                            </div>
                        </div>
                    )}
                    <Stepper currentStep={currentStep} />
                    <form id="announcement-form" noValidate className="space-y-6">
                        {!isEditMode && (
                            <fieldset className="p-6 bg-white rounded-lg border shadow-sm">
                                <legend className="text-base font-semibold text-gray-800 px-3 py-1 bg-blue-50 rounded-md">步驟一：上傳文件或提供網址</legend>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">檔案上傳</h4>
                                        <MultipleFilesUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast}/>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">或</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">網址連結分析</h4>
                                        <UrlInputArea urls={urls} setUrls={setUrls} disabled={isLoading} showToast={showToast}/>
                                    </div>
                                </div>
                                
                                <Button
                                    type="button"
                                    variant="warning"
                                    className="w-full mt-6"
                                    onClick={handleAiAnalyze}
                                    disabled={(selectedFiles.length === 0 && urls.length === 0) || isLoading}
                                    loading={isLoading && currentStep === 1}
                                >
                                    {isLoading && currentStep === 1 ? '處理中...' : '開始 AI 分析'}
                                </Button>
                            </fieldset>
                        )}
                        <fieldset className="p-6 bg-white rounded-lg border shadow-sm">
                            <legend className="text-base font-semibold text-gray-800 px-3 py-1 bg-green-50 rounded-md">
                                {isEditMode ? '編輯公告資訊' : '步驟二：基本資訊與內容'}
                            </legend>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">公告標題 (必填)</label>
                                        <input 
                                            type="text" 
                                            id="title" 
                                            name="title" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            value={formData.title} 
                                            onChange={handleChange} 
                                            disabled={isLoading} 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">公告狀態</label>
                                        <select 
                                            id="status" 
                                            name="status" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            value={formData.status} 
                                            onChange={handleChange} 
                                            disabled={isLoading}
                                        >
                                            <option value="0">下架 (草稿)</option>
                                            <option value="1">上架</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">獎學金分類</label>
                                        <select 
                                            id="category" 
                                            name="category" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            value={formData.category} 
                                            onChange={handleChange} 
                                            disabled={isLoading}
                                        >
                                             <option value="">請選擇或由AI分析</option>
                                             <option value="A">A: 縣市政府</option>
                                             <option value="B">B: 其他公家機關</option>
                                             <option value="C">C: 宗親會/指定身分</option>
                                             <option value="D">D: 其他民間單位</option>
                                             <option value="E">E: 得獎名單</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="application_deadline" className="block text-sm font-semibold text-gray-700 mb-2">申請截止日期</label>
                                        <input 
                                            type="date" 
                                            id="application_deadline" 
                                            name="application_deadline" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            value={formData.application_deadline} 
                                            onChange={handleChange} 
                                            disabled={isLoading} 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-2">送件方式</label>
                                        <input 
                                            type="text" 
                                            id="submission_method" 
                                            name="submission_method" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            placeholder="自行送件、至系生輔組申請..." 
                                            value={stripHtmlTags(formData.submission_method)} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, submission_method: e.target.value }))} 
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="external_urls" className="block text-sm font-semibold text-gray-700 mb-2">外部連結</label>
                                        <input 
                                            type="url" 
                                            id="external_urls" 
                                            name="external_urls" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            value={formData.external_urls} 
                                            onChange={handleChange} 
                                            disabled={isLoading} 
                                            placeholder="相關網頁連結..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="target_audience" className="block text-sm font-semibold text-gray-700 mb-2">適用對象</label>
                                        <textarea 
                                            id="target_audience" 
                                            name="target_audience" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[80px] resize-none" 
                                            rows={3} 
                                            value={stripHtmlTags(formData.target_audience)} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))} 
                                            disabled={isLoading} 
                                            placeholder="申請資格或適用對象..."
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-2">申請限制</label>
                                        <textarea 
                                            id="application_limitations" 
                                            name="application_limitations" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[80px] resize-none" 
                                            rows={3} 
                                            value={stripHtmlTags(formData.application_limitations)} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, application_limitations: e.target.value }))} 
                                            disabled={isLoading} 
                                            placeholder="申請資格限制或注意事項..."
                                        ></textarea>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-2">公告摘要 (必填)</label>
                                <QuillEditor
                                        value={formData.summary}
                                        onChange={handleSummaryChange}
                                        placeholder="AI 生成的內容將顯示於此，您也可以手動編輯..."
                                        disabled={isLoading}
                                    />
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">附件上傳</label>
                                    <MultipleFilesUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast}/>
                                </div>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>
                <div className="p-4 bg-gray-100/80 backdrop-blur-sm border-t rounded-b-2xl flex justify-between space-x-3 flex-shrink-0">
                    <div className="flex space-x-3">
                        <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
                            取消
                        </Button>
                        {isEditMode && (
                            <Button 
                                type="button" 
                                variant="danger" 
                                onClick={() => setShowDeleteConfirm(true)} 
                                disabled={isLoading}
                            >
                                刪除
                            </Button>
                        )}
                    </div>
                    <Button 
                        type="button"
                        onClick={handleSave} 
                        disabled={!isFormValid || isLoading}
                        loading={isLoading}
                    >
                        {isLoading ? loadingText : (isEditMode ? '更新公告' : '儲存公告')}
                    </Button>
                </div>
            </div>
            </div>
        </>
    );
}
