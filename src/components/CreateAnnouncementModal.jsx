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

// PDF Upload Area component
const PDFUploadArea = ({ selectedFile, setSelectedFile, disabled, showToast }) => {
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
    
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // 檢查文件類型
            if (!supportedTypes[file.type]) {
                showToast('不支援的文件格式。請上傳 PDF、DOCX、DOC 或圖片文件。', 'warning');
                return;
            }
            // 檢查文件大小
            if (file.size > maxFileSize) {
                showToast('文件大小超過限制。請選擇小於 10MB 的文件。', 'warning');
                return;
            }
            setSelectedFile(file);
        }
    };
    
    const handleDragOver = (event) => event.preventDefault();
    
    const handleDrop = (event) => {
        event.preventDefault();
        if (disabled) return;
        const file = event.dataTransfer.files[0];
        if (file) {
            // 檢查文件類型
            if (!supportedTypes[file.type]) {
                showToast('不支援的文件格式。請上傳 PDF、DOCX、DOC 或圖片文件。', 'warning');
                return;
            }
            // 檢查文件大小
            if (file.size > maxFileSize) {
                showToast('文件大小超過限制。請選擇小於 10MB 的文件。', 'warning');
                return;
            }
            setSelectedFile(file);
        }
    };
    
    const handleRemoveFile = () => setSelectedFile(null);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
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
            />
            {!selectedFile ? (
                <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                        拖曳檔案到此處，或 <span className="font-medium text-indigo-600">點擊上傳</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">支援 PDF、DOCX、DOC、圖片格式 (最大 10MB)</p>
                </>
            ) : (
                <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="mt-2 font-medium text-gray-700 break-all">{selectedFile.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                        {supportedTypes[selectedFile.type]} • {formatFileSize(selectedFile.size)}
                    </p>
                    {!disabled && (
                         <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                            className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                            移除檔案
                        </button>
                    )}
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
    const [selectedFile, setSelectedFile] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isEditMode = !!editingAnnouncement;
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        status: '0',
        category: '',
        application_deadline: '',
        target_audience: '',
        application_limitations: '',
        submission_method: '',
        external_urls: '',
    });

    // 當進入編輯模式時，填充表單數據
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
        }
    }, [editingAnnouncement, isOpen]);

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
        if (!selectedFile) {
            showToast("請先選擇一個文件", "warning");
            return;
        }
        if (!modelRef.current) {
            showToast("AI 模型尚未初始化。請檢查您的 Gemini API 金鑰環境變數。", "error");
            return;
        }

        setIsLoading(true);
        setCurrentStep(1); 

        try {
            setLoadingText("正在準備檔案...");
            const pdfPart = await fileToGenerativePart(selectedFile);

            const htmlStyleInstructions = `
                - **標題 (h4)**: 使用 <h4> 標籤，並加上 inline style 'color: #1e40af; font-weight: bold;'。
                - **列表 (ul/li)**: 使用 <ul> 和 <li>。
                - **表格 (table)**: 使用標準 HTML 表格標籤，並為 table 加上 'border-collapse: collapse; width: 100%;'，為 th/td 加上 'border: 1px solid #ddd; padding: 8px;' 的 inline style。
                - **強調 (span)**: 對於關鍵字詞（如日期、金額），使用 <span> 並加上 'color: #c026d3; font-weight: 600;' 的 inline style。
            `;

            const prompt = `
# 角色 (Persona)
你是一位頂尖的「彰化師範大學獎學金公告分析專家」。你的任務是將一篇關於獎學金的公告，轉換成一段重點突出、視覺清晰的 HTML 公告，並提取結構化資料。你只須關注與「大學部」及「碩士班」學生相關的資訊，並嚴格遵循所有規則。

# 核心任務 (Core Task)
你的任務是根據下方提供的「公告全文」，執行以下兩項任務，並將結果合併在一個**單一的 JSON 物件**中回傳。

## 任務一：提取結構化資料 (JSON Extraction)
提取公告中的關鍵資訊，並以一個嚴格的 JSON 物件格式回傳。

### 欄位規則 (Field Rules)
- **不確定性原則**：若資訊未提及或不明確，**必須**回傳空字串 ""，**禁止**自行猜测。
- **欄位列表**：
    1. title (string): 公告的**簡短**標題，必須包含**提供單位**和**獎學金名稱**。
    2. category (string): 根據下方的「代碼定義」從 'A'~'E' 中選擇一個。
    3. application_deadline (string): **申請截止日期**，格式必須是 YYYY-MM-DD。若只提及月份，以該月最後一天為準。若為區間，以**結束日期**為準，備註: 民國年 + 1911 即為西元年。
    4. target_audience (string): **目標對象**。用一段話簡潔但完整地說明，應包含年級、特殊身份、家庭狀況或成績要求等核心申請條件。
    5. application_limitations (string): **兼領限制**。若內容明確提及**可以**兼領其他獎學金，回傳 'Y'。若提及**不行**兼領其他獎學金，則回傳 'N'。若完全未提及，則回傳空字串 ""。
    6. submission_method (string): **送件方式**。簡要說明最終的送件管道。
    7. external_urls (string): 若有相關網址或連結，請提取。若無，則回傳空字串 ""。
    8. summary (string): 生成專業、條理分明的 HTML 格式重點摘要，使用以下樣式指導：
       - **多色彩重點標記**：
         * **金額、日期、名額等數字類關鍵字**: <span style="color: #D6334C; font-weight: bold;">
         * **身份、成績等申請條件**: <span style="color: #F79420; font-weight: bold;">
         * **所有小標題**: <h4 style="color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;">
       - **標籤限定**：只能使用 <h4>, <ul>, <li>, <ol>, <strong>, <p>, <br>, <span>, <table>, <tbody>, <tr>, <td>

# 獎助學金代碼定義 (Category Definitions)
- **A**: 各縣市政府獎助學金
- **B**: 縣市政府以外之各級公家機關及公營單位獎助學金
- **C**: 宗親會及民間各項指定身分獎助學金 (指定姓名、籍貫、學系等)
- **D**: 各民間單位：因經濟不利、學業優良或其他無法歸類之獎助學金
- **E**: 純粹的獎學金「得獎名單」公告

# 最終輸出規則 (Final Output Rules)
- **你的回覆必須是、也只能是一個 JSON 物件**。
- **絕對禁止**在 JSON 物件前後包含任何 Markdown 標記或其他解釋性文字。
- 所有欄位都必須填寫，找不到資訊時請回傳空字串 ""。

請分析以下 PDF 檔案內容：`;
            
            const config = {
                responseMimeType: 'application/json'
            };

            const model = 'gemini-2.0-flash-lite';
            const contents = [
                {
                    role: 'user',
                    parts: [
                        pdfPart,
                        {
                            text: prompt,
                        },
                    ],
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

            setFormData(prev => ({
                ...prev,
                ...aiResponse,
                status: prev.status || '0', 
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

            let error;
            if (isEditMode) {
                ({ error } = await supabase
                    .from('announcements')
                    .update(announcementData)
                    .eq('id', editingAnnouncement.id));
            } else {
                ({ error } = await supabase
                    .from('announcements')
                    .insert([announcementData]));
            }

            if (error) throw error;
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
            setSelectedFile(null);
            setShowDeleteConfirm(false);
            setFormData({
                title: '', summary: '', status: '0', category: '',
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
                        <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-lg">
                            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-4 text-indigo-700 font-semibold">{loadingText}</p>
                        </div>
                    )}
                    <Stepper currentStep={currentStep} />
                    <form id="announcement-form" noValidate className="space-y-6">
                        {!isEditMode && (
                            <fieldset className="p-6 bg-white rounded-lg border shadow-sm">
                                <legend className="text-base font-semibold text-gray-800 px-3 py-1 bg-blue-50 rounded-md">步驟一：上傳文件</legend>
                                <PDFUploadArea selectedFile={selectedFile} setSelectedFile={setSelectedFile} disabled={isLoading} showToast={showToast}/>
                                <Button
                                    type="button"
                                    variant="warning"
                                    className="w-full mt-6"
                                    onClick={handleAiAnalyze}
                                    disabled={!selectedFile || isLoading}
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
