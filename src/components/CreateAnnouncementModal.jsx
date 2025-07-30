'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase/client';
import QuillEditor from './QuillEditor';

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

// PDF Upload Area component
const PDFUploadArea = ({ selectedFile, setSelectedFile, disabled }) => {
    const fileInputRef = useRef(null);
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        }
    };
    const handleDragOver = (event) => event.preventDefault();
    const handleDrop = (event) => {
        event.preventDefault();
        if (disabled) return;
        const file = event.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        }
    };
    const handleRemoveFile = () => setSelectedFile(null);

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
                accept="application/pdf"
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
                    <p className="mt-1 text-xs text-gray-500">僅支援 PDF 檔案</p>
                </>
            ) : (
                <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="mt-2 font-medium text-gray-700 break-all">{selectedFile.name}</p>
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
export default function CreateAnnouncementModal({ isOpen, onClose, refreshAnnouncements }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("AI 分析中...");
    const [selectedFile, setSelectedFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        status: '0',
        category: '',
        application_deadline: '',
        target_audience: '',
        submission_method: '',
    });
    
    const modelRef = useRef(null);
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
            modelRef.current = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
    }, []);

    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setShow(true), 50);
        } else {
            setShow(false);
        }
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
            alert("請先選擇一個 PDF 檔案");
            return;
        }
        if (!modelRef.current) {
            alert("AI 模型尚未初始化。請檢查您的 Gemini API 金鑰環境變數。");
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

            const prompt = `你是一個專業的獎學金公告分析助理。請仔細閱讀這份 PDF 檔案，並根據內容，回傳一個 JSON 物件。
            JSON 物件應包含以下欄位:
            - title: "公告標題 (純文字)"
            - summary: "一個包含詳細說明的 HTML 字串。請嚴格遵循以下樣式指南來生成此 HTML：${htmlStyleInstructions}"
            - category: "從 'A' (縣市政府), 'B' (其他公家機關), 'C' (宗親會/指定身分), 'D' (其他民間單位), 'E' (得獎名單) 中選擇一個最適合的分類字母"
            - application_deadline: "YYYY-MM-DD 格式的申請截止日期。如果找不到，請回傳空字串。"
            - target_audience: "申請資格或適用對象。如果找不到，請回傳空字串。"
            - submission_method: "簡要說明申請方式。如果找不到，請回傳空字串。"
            
            對於找不到資訊的欄位，請回傳空字串 ""。`;
            
            setLoadingText("AI 分析中，請稍候...");

            const result = await modelRef.current.generateContent({
                contents: [{ role: "user", parts: [pdfPart, { text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            setLoadingText("正在解析結果...");
            const response = await result.response;
            const aiResponse = JSON.parse(response.text());

            setFormData(prev => ({
                ...prev,
                ...aiResponse,
                status: prev.status || '0', 
            }));
            
            setCurrentStep(2);

        } catch (error) {
            console.error("AI 分析失敗:", error);
            alert(`AI 分析時發生錯誤。請檢查瀏覽器主控台以獲取詳細資訊。可能是 API 金鑰問題或網路連線錯誤。

錯誤訊息: ${error.message}`);
            setCurrentStep(0);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async () => {
        if (!isFormValid) {
            alert("請填寫所有必填欄位。");
            return;
        }
        setIsLoading(true);
        setLoadingText("儲存中...");

        try {
            const { error } = await supabase
                .from('announcements')
                .insert([{
                    title: formData.title,
                    summary: formData.summary,
                    category: formData.category,
                    application_deadline: formData.application_deadline || null,
                    target_audience: formData.target_audience,
                    submission_method: formData.submission_method,
                    is_active: formData.status === '1',
                }]);
            if (error) throw error;
            alert("公告已成功儲存！");
            if (refreshAnnouncements) refreshAnnouncements();
            handleClose();
        } catch (error) {
            console.error("儲存失敗:", error);
            alert(`儲存失敗: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = useCallback(() => {
        if (isLoading) return;
        setShow(false);
        setTimeout(() => {
            onClose();
            setCurrentStep(0);
            setSelectedFile(null);
            setFormData({
                title: '', summary: '', status: '0', category: '',
                application_deadline: '', target_audience: '', submission_method: '',
            });
        }, 300);
    }, [isLoading, onClose]);
    
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 bg-black/60 z-50 pt-16 pb-10 px-4 flex justify-center items-start overflow-y-auto transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={`bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col transition-all duration-300 ${show ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800" id="modal-title">
                        新增獎學金公告
                    </h2>
                    <button onClick={handleClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 p-2 rounded-full disabled:cursor-not-allowed">&times;</button>
                </div>
                <div className="p-4 md:p-6 flex-grow overflow-y-auto relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-lg">
                            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-4 text-indigo-700 font-semibold">{loadingText}</p>
                        </div>
                    )}
                    <Stepper currentStep={currentStep} />
                    <form id="announcement-form" noValidate className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <fieldset className="p-5 bg-white rounded-lg border">
                                <legend className="text-base font-semibold text-gray-800 px-2">步驟一：上傳 PDF</legend>
                                <PDFUploadArea selectedFile={selectedFile} setSelectedFile={setSelectedFile} disabled={isLoading}/>
                                <button
                                    type="button"
                                    onClick={handleAiAnalyze}
                                    disabled={!selectedFile || isLoading}
                                    className="w-full mt-4 btn-modern accent disabled:bg-indigo-300 disabled:cursor-not-allowed"
                                >
                                    {isLoading && currentStep === 1 ? '處理中...' : '開始 AI 分析'}
                                </button>
                            </fieldset>
                            <fieldset className="p-5 bg-white rounded-lg border">
                                <legend className="text-base font-semibold text-gray-800 px-2">步驟三：審閱與發布</legend>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="title" className="form-label">公告標題 (必填)</label>
                                        <input type="text" id="title" name="title" className="form-control" value={formData.title} onChange={handleChange} disabled={isLoading} />
                                    </div>
                                    <div>
                                        <label htmlFor="summary" className="form-label">公告摘要 (必填)</label>
                                        <QuillEditor 
                                            value={formData.summary}
                                            onChange={handleSummaryChange}
                                            placeholder="AI 生成的內容將顯示於此，您也可以手動編輯..."
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                        <aside className="p-5 bg-white rounded-lg border h-fit sticky top-4 space-y-4">
                             <div>
                                <label htmlFor="status" className="form-label">公告狀態</label>
                                <select id="status" name="status" className="form-control" value={formData.status} onChange={handleChange} disabled={isLoading}>
                                    <option value="0">下架 (草稿)</option>
                                    <option value="1">上架</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="category" className="form-label">獎學金分類</label>
                                <select id="category" name="category" className="form-control" value={formData.category} onChange={handleChange} disabled={isLoading}>
                                     <option value="">請選擇或由AI分析</option>
                                     <option value="A">A: 縣市政府</option>
                                     <option value="B">B: 其他公家機關</option>
                                     <option value="C">C: 宗親會/指定身分</option>
                                     <option value="D">D: 其他民間單位</option>
                                     <option value="E">E: 得獎名單</option>
                                </select>
                             </div>
                             <div>
                                 <label htmlFor="application_deadline" className="form-label">申請截止日期</label>
                                 <input type="date" id="application_deadline" name="application_deadline" className="form-control" value={formData.application_deadline} onChange={handleChange} disabled={isLoading} />
                             </div>
                             <div>
                                 <label htmlFor="target_audience" className="form-label">適用對象</label>
                                 <textarea id="target_audience" name="target_audience" className="form-control" rows={3} value={formData.target_audience} onChange={handleChange} disabled={isLoading}></textarea>
                             </div>
                              <div>
                                 <label htmlFor="submission_method" className="form-label">送件方式</label>
                                 <input type="text" id="submission_method" name="submission_method" className="form-control" placeholder="自行送件、至系生輔組申請..." value={formData.submission_method} onChange={handleChange} disabled={isLoading}/>
                             </div>
                        </aside>
                    </form>
                </div>
                <div className="p-4 bg-gray-100/80 backdrop-blur-sm border-t flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={handleClose} className="btn-modern secondary" disabled={isLoading}>取消</button>
                    <button type="button" onClick={handleSave} className="btn-modern primary" disabled={!isFormValid || isLoading}>
                        {isLoading ? loadingText : '儲存公告'}
                    </button>
                </div>
            </div>
        </div>
    );
}
