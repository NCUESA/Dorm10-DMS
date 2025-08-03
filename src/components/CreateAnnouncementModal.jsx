'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '@/lib/supabase/client';
import QuillEditor from './QuillEditor';
import Button from '@/components/ui/Button';
import { authFetch } from '@/lib/authFetch';

// Stepper 組件
const Stepper = ({ currentStep, inputMode = 'ai' }) => {
    const aiSteps = ['上傳檔案', 'AI 分析', '審閱發布'];
    const manualSteps = ['手動輸入', '審閱發布'];
    const steps = inputMode === 'manual' ? manualSteps : aiSteps;
    
    return (
        <div className="flex items-center justify-center mb-4">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center text-sm md:text-base">
                    <div className={`flex items-center ${index <= currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 ${
                            index <= currentStep ? 'bg-indigo-600 scale-105' : 'bg-gray-400'
                        }`}>
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
            }, 5000);
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
        <div className={`fixed top-24 right-4 z-[60] transform transition-all duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
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

// 輸入模式選擇組件
const InputModeSelector = ({ inputMode, setInputMode, disabled }) => {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">選擇輸入模式</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                        inputMode === 'ai' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !disabled && setInputMode('ai')}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                            inputMode === 'ai' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                            {inputMode === 'ai' && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">AI 智慧分析</h4>
                            <p className="text-sm text-gray-600">上傳檔案或網址，由 AI 自動分析並生成內容</p>
                        </div>
                    </div>
                </div>
                
                <div 
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                        inputMode === 'manual' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 hover:border-gray-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !disabled && setInputMode('manual')}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                            inputMode === 'manual' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                            {inputMode === 'manual' && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">手動輸入</h4>
                            <p className="text-sm text-gray-600">直接填寫標題和內容，可上傳附件</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// URL 輸入區域組件
const UrlInputArea = ({ urls, setUrls, disabled, showToast }) => {
    const [urlInput, setUrlInput] = useState('');
    
    const handleAddUrl = () => {
        const trimmedUrl = urlInput.trim();
        if (!trimmedUrl) {
            showToast('請輸入網址', 'warning');
            return;
        }
        
        try {
            new URL(trimmedUrl);
        } catch {
            showToast('請輸入有效的網址', 'warning');
            return;
        }
        
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

// 檔案上傳組件
const FileUploadArea = ({ selectedFiles, setSelectedFiles, disabled, showToast }) => {
    const fileInputRef = useRef(null);
    
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
    const maxFiles = 5;
    
    const validateAndAddFiles = (files) => {
        const validFiles = [];
        const fileArray = Array.from(files);
        const currentFilesCount = selectedFiles.length;
        
        for (const file of fileArray) {
            if (!file || !file.name) {
                showToast('發現無效的檔案', 'error');
                continue;
            }
            
            const fileName = file.name.trim();
            if (!fileName) {
                showToast('檔案名稱不能為空', 'error');
                continue;
            }
            
            if (fileName.length > 255) {
                showToast(`檔案名稱過長: ${fileName}`, 'error');
                continue;
            }
            
            const illegalChars = /[<>:"|?*\x00-\x1f]/;
            if (illegalChars.test(fileName)) {
                showToast(`檔案名稱包含非法字符: ${fileName}`, 'error');
                continue;
            }
            
            if (selectedFiles.some(existingFile => existingFile.name === fileName)) {
                showToast(`檔案 "${fileName}" 已經存在`, 'warning');
                continue;
            }
            
            if (currentFilesCount + validFiles.length >= maxFiles) {
                showToast(`最多只能上傳 ${maxFiles} 個檔案`, 'warning');
                break;
            }
            
            if (!supportedTypes[file.type]) {
                showToast(`檔案 "${fileName}" 格式不支援。請上傳 PDF、DOCX、DOC 或圖片文件。`, 'warning');
                continue;
            }
            
            if (file.size > maxFileSize) {
                showToast(`檔案 "${fileName}" 大小超過限制。請選擇小於 10MB 的文件。`, 'warning');
                continue;
            }
            
            if (file.size === 0) {
                showToast(`檔案 "${fileName}" 是空檔案`, 'warning');
                continue;
            }
            
            validFiles.push({
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                tempId: Date.now() + Math.random(),
                isNewFile: true
            });
        }
        
        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            showToast(`成功選擇 ${validFiles.length} 個檔案`, 'success');
        }
    };
    
    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            validateAndAddFiles(files);
        }
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
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                    拖曳檔案到此處，或 <span className="font-medium text-indigo-600">點擊上傳</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    支援 PDF、DOCX、DOC、圖片格式 (最大 10MB，最多 {maxFiles} 個檔案)
                </p>
                <p className="mt-1 text-xs text-indigo-600">
                    已選擇 {selectedFiles.length} / {maxFiles} 個檔案
                </p>
            </div>

            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">已選擇的檔案：</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {selectedFiles.map((fileWrapper, index) => {
                            const fileType = supportedTypes[fileWrapper.type] || '未知';
                            
                            return (
                                <div key={fileWrapper.tempId || index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 break-all">{fileWrapper.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {fileType} • {formatFileSize(fileWrapper.size)}
                                            </p>
                                        </div>
                                    </div>
                                    {!disabled && (
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="移除檔案"
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

// 手動輸入表單組件
const ManualInputForm = ({ formData, setFormData, handleSummaryChange, disabled }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-6">
            {/* 標題 */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    標題 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="請輸入公告標題"
                />
            </div>

            {/* 分類 */}
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    分類
                </label>
                <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">請選擇分類</option>
                    <option value="A">A - 各縣市政府獎助學金</option>
                    <option value="B">B - 公家機關及公營單位獎助學金</option>
                    <option value="C">C - 宗親會及民間指定身分獎助學金</option>
                    <option value="D">D - 民間單位獎助學金</option>
                    <option value="E">E - 獎學金得獎名單公告</option>
                </select>
            </div>

            {/* 申請截止日期 */}
            <div>
                <label htmlFor="application_deadline" className="block text-sm font-medium text-gray-700 mb-2">
                    申請截止日期
                </label>
                <input
                    type="date"
                    id="application_deadline"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>

            {/* 目標對象 */}
            <div>
                <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 mb-2">
                    目標對象
                </label>
                <input
                    type="text"
                    id="target_audience"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="例：大學部學生、低收入戶學生"
                />
            </div>

            {/* 兼領限制 */}
            <div>
                <label htmlFor="application_limitations" className="block text-sm font-medium text-gray-700 mb-2">
                    兼領限制
                </label>
                <select
                    id="application_limitations"
                    name="application_limitations"
                    value={formData.application_limitations}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">請選擇</option>
                    <option value="Y">Y - 可以兼領</option>
                    <option value="N">N - 不可兼領</option>
                </select>
            </div>

            {/* 送件方式 */}
            <div>
                <label htmlFor="submission_method" className="block text-sm font-medium text-gray-700 mb-2">
                    送件方式
                </label>
                <input
                    type="text"
                    id="submission_method"
                    name="submission_method"
                    value={formData.submission_method}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="例：線上申請、郵寄、現場繳交"
                />
            </div>

            {/* 相關網址 */}
            <div>
                <label htmlFor="external_urls" className="block text-sm font-medium text-gray-700 mb-2">
                    相關網址
                </label>
                <input
                    type="url"
                    id="external_urls"
                    name="external_urls"
                    value={formData.external_urls}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="https://example.com"
                />
            </div>

            {/* 內容 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    內容 <span className="text-red-500">*</span>
                </label>
                <QuillEditor
                    value={formData.summary}
                    onChange={handleSummaryChange}
                    disabled={disabled}
                    placeholder="請輸入公告內容..."
                />
            </div>

            {/* 狀態 */}
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    發布狀態
                </label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="1">啟用</option>
                    <option value="0">停用</option>
                </select>
            </div>
        </div>
    );
};

// 主要組件
export default function CreateAnnouncementModal({ isOpen, onClose, refreshAnnouncements, editingAnnouncement = null }) {
    const [inputMode, setInputMode] = useState('ai');
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("處理中...");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [urls, setUrls] = useState([]);
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

    const [show, setShow] = useState(false);
    const modelRef = useRef(null);

    // 初始化 Gemini AI
    useEffect(() => {
        console.log("Gemini API Key:", process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "已設定" : "未設定");
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            const genAI = new GoogleGenAI({
                apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            });
            modelRef.current = genAI;
            console.log("Gemini AI 已初始化");
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => setShow(true), 50);
            
            // 重置狀態
            if (!isEditMode) {
                setInputMode('ai');
                setCurrentStep(0);
                setSelectedFiles([]);
                setUrls([]);
                setFormData({
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
            }
        } else {
            document.body.style.overflow = 'unset';
            setShow(false);
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isEditMode]);

    // 編輯模式初始化
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
            setInputMode('manual');
            setCurrentStep(0);
            loadExistingAttachments(editingAnnouncement.id);
        }
    }, [editingAnnouncement, isOpen]);

    // 載入現有附件
    const loadExistingAttachments = async (announcementId) => {
        try {
            const { data: attachments, error } = await supabase
                .from('attachments')
                .select('*')
                .eq('announcement_id', announcementId);
            
            if (error) throw error;
            
            if (attachments && attachments.length > 0) {
                const existingFiles = attachments.map(attachment => ({
                    id: attachment.id,
                    name: attachment.file_name || '未知檔案',
                    size: attachment.file_size || 0,
                    type: attachment.mime_type || 'application/octet-stream',
                    path: attachment.stored_file_path,
                    isExisting: true
                })).filter(file => file.path);
                
                setSelectedFiles(existingFiles);
            }
        } catch (error) {
            console.error('載入附件失敗:', error);
            showToast('載入附件失敗', 'error');
        }
    };

    const handleSummaryChange = useCallback((content) => {
        setFormData(prev => ({ ...prev, summary: content }));
    }, []);

    const isFormValid = (() => {
        if (formData.title.trim() === '') return false;
        const pureTextSummary = formData.summary.replace(/<[^>]*>?/gm, '').trim();
        if (pureTextSummary === '') return false;
        return true;
    })();

    // 跳轉到手動輸入模式
    const handleSkipToManual = () => {
        setInputMode('manual');
        setCurrentStep(0);
    };

    // 檔案轉換為 AI 輸入格式
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

    // AI 分析功能
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
                
                const pdfPart = await fileToGenerativePart(fileForAnalysis.file || fileForAnalysis);
                promptParts.push(pdfPart);
                hasFileContent = true;
            }
            
            // 建構 prompt 文字
            let promptText = `
# 角色 (Persona)
你是一位頂尖的「彰化師範大學獎學金公告分析專家」。你的任務是將一篇關於獎學金的公告，轉換成一段重點突出、視覺清晰的 HTML 公告，並提取結構化資料。你只須關注與「大學部」及「碩士班」學生相關的資訊，並嚴格遵循所有規則。

# 核心任務 (Core Task)
你的任務是根據下方提供的「公告全文」，執行以下兩項任務，並將結果合併在一個**單一的 JSON 物件**中回傳。

## 任務一：提取結構化資料 (JSON Extraction)
提取公告中的關鍵資訊，並以一個嚴格的 JSON 物件格式回傳。

### 欄位規則 (Field Rules)
- **不確定性原則**：若資訊未提及或不明確，**必須**回傳空字串 ""，**禁止**自行猜測。
- **欄位列表**：
    1. title (string): 公告的**簡短**標題，必須包含**提供單位**和**獎學金名稱**。例如：「國際崇她社『崇她獎』獎學金」。
    2. category (string): 根據下方的「代碼定義」從 'A'~'E' 中選擇一個。
    3. application_deadline (string): **申請截止日期**，格式必須是 YYYY-MM-DD。若只提及月份，以該月最後一天為準。若為區間，以**結束日期**為準，備註: 民國年 + 1911 即為西元年。
    4. target_audience (string): **目標對象**。用一段話簡潔但完整地說明，應包含年級、特殊身份、家庭狀況或成績要求等核心申請條件。
    5. application_limitations (string): **兼領限制**。若內容明確提及**可以**兼領其他獎學金，回傳 'Y'。若提及**不行**兼領其他獎學金，則回傳 'N'。若完全未提及，則回傳空字串。
    6. submission_method (string): **送件方式**。簡要說明最終的送件管道，例如「自行送件申請」、「送至生輔組彙辦」或「線上系統申請」。
    7. external_urls (string): **相關網址或連結**。

## 任務二：生成 HTML 重點摘要 (HTML Summary Generation)
根據你分析的內容，生成一份專業、條理分明的 HTML 格式重點摘要。

### 內容與結構指導 (Content & Structure Guidance)
- **摘要必須包含以下幾個部分（如果公告中有提及）**：
    1.  **申請資格**: 應包含所有身份、年級、成績、家庭等條件。**建議使用 <ul> 列點呈現**。
    2.  **獎助金額**: 應清楚說明不同組別的金額與名額。**強烈建議使用 <table> 呈現**。
    3.  **申請期限**: 說明完整的申請起訖時間。
    4.  **應繳文件**: 清楚列出所有需要繳交的文件。**建議使用 <ul> 或 <ol> 列點呈現**。
    5.  **其他注意事項**: 其他補充說明。
- **表格優先**：當資訊具有「項目-內容」的對應關係時（如：大學部-五萬元），**優先使用 <table>**。

### 視覺化與樣式指導 (Visualization & Style Guidance)
- **多色彩重點標記**：請**大量且智慧地**使用以下三種顏色來標記重點：
    - **金額、日期、名額等數字類關鍵字**: <span style="color: #D6334C; font-weight: bold;">
    - **身份、成績等申請條件**: <span style="color: #F79420; font-weight: bold;">
    - **所有小標題 (如：申請資格、獎助金額)**: <h4 style="color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;">
- **標籤限定**：只能使用 <h4>, <ul>, <li>, <ol>, <strong>, <p>, <br>, <span>, <table>, <tbody>, <tr>, <td>。
- summary 的內容必須放在 JSON 物件的 summary (string) 鍵中。

# 獎助學金代碼定義 (Category Definitions)
- **A**: 各縣市政府獎助學金
- **B**: 縣市政府以外之各級公家機關及公營單位獎助學金
- **C**: 宗親會及民間各項指定身分獎助學金 (指定姓名、籍貫、學系等)
- **D**: 各民間單位：因經濟不利、學業優良或其他無法歸類之獎助學金
- **E**: 純粹的獎學金「得獎名單」公告

# 最終輸出規則 (Final Output Rules)
- **你的回覆必須是、也只能是一個 JSON 物件**。
- **絕對禁止**在 JSON 物件前後包含任何 Markdown 標記 (如 """json ... """) 或其他任何解釋性文字。
- 請嚴格模仿下方範例的 JSON 結構和 HTML 風格。

# 輸出格式與範例 (Output Format & Example)
{
  "title": "國際蘭馨交流協會『讓夢想起飛』助學方案",
  "category": "C",
  "application_deadline": "2025-07-23",
  "target_audience": "大學部在學女學生(含大一新生)，歷年平均成績達70分，且全戶所得及財產符合規定者。",
  "application_limitations": "N",
  "submission_method": "送件至生輔組或 Email 寄送 PDF 檔",
  "external_urls": "",
  "summary": "<h4 style=\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\">申請資格</h4><ul><li>國內各大學日間部、進修學士班之<span style=\\"color: #F79420; font-weight: bold;\\">在學女學生</span>。</li><li>歷年學業平均成績達 <span style=\\"color: #F79420; font-weight: bold;\\">70分</span> 且未受記過處分。</li><li>全戶人均所得未逾當年度最低基本工資。</li><li>全戶存款本金未逾 <span style=\\"color: #D6334C; font-weight: bold;\\">10萬元</span>。</li></ul><h4 style=\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\">補助金額</h4><p>通過審查者，補助每學期學費至畢業為止。</p><h4 style=\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\">申請應繳文件</h4><ol><li>申請書（需黏貼照片並簽名）。</li><li>歷年成績單（新生附高三成績單）。</li><li>全戶含記事戶籍謄本。</li><li>全戶113年所得及財產清單。</li><li>其他佐證資料（如重大傷病卡、身障手冊等）。</li></ol><h4 style=\\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\\">申請期限</h4><p>即日起至 <span style=\\"color: #D6334C; font-weight: bold;\\">2025年7月23日</span> 前，將文件送至生輔組或 Email 寄送。</p>"
}

# 公告全文 (Source Text)
---

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

            // 配置 AI 參數（移除 JSON schema，使用簡單配置）
            const config = {
                responseMimeType: 'application/json',
                systemInstruction: [
                    {
                        text: `繁體中文回應。如果有提供網址，請詳細分析網頁內容並提取相關的獎學金資訊。請直接生成完整的HTML格式摘要內容，包含豐富的樣式和結構。`,
                    }
                ]
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
                const chunkText = chunk.text || '';
                result += chunkText;
                console.log("AI 回應片段:", chunkText);
            }

            console.log("完整 AI 回應:", result);

            // 清理和解析 JSON 回應（參考 raw/api/generate_summary.php 的處理方式）
            let cleanedResult = result.trim();
            
            // 尋找 JSON 物件的開始和結束
            const firstBrace = cleanedResult.indexOf('{');
            const lastBrace = cleanedResult.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleanedResult = cleanedResult.substring(firstBrace, lastBrace + 1);
            }
            
            // 移除可能的 markdown 標記
            cleanedResult = cleanedResult.replace(/```json\s*\n?/g, '').replace(/\n?\s*```/g, '');
            
            let aiResponse;
            try {
                aiResponse = JSON.parse(cleanedResult);
            } catch (parseError) {
                console.error("JSON 解析失敗:", parseError);
                console.error("原始回應:", result);
                console.error("清理後回應:", cleanedResult);
                throw new Error("AI 回傳的 JSON 格式不正確，請重試");
            }

            // 確保 summary 欄位存在
            if (!aiResponse.summary) {
                aiResponse.summary = '<p>AI 未能生成摘要內容，請手動輸入。</p>';
            }

            // 調試：檢查 AI 回應內容
            console.log("AI 分析結果:", aiResponse);
            console.log("Summary 內容:", aiResponse.summary);
            
            setFormData(prev => {
                const newFormData = {
                    ...prev,
                    ...aiResponse,
                    status: prev.status || '1',
                };
                console.log("formData 更新前:", prev);
                console.log("更新後的 formData:", newFormData);
                console.log("特別檢查 summary 字段:", {
                    previous: prev.summary,
                    new: newFormData.summary,
                    hasChanged: prev.summary !== newFormData.summary,
                    newSummaryLength: newFormData.summary ? newFormData.summary.length : 0
                });
                return newFormData;
            });
            
            // 延遲一點再切換步驟，確保 formData 更新完成
            setTimeout(() => {
                setCurrentStep(2);
            }, 100);

        } catch (error) {
            console.error("AI 分析失敗:", error);
            showToast(`AI 分析時發生錯誤: ${error.message}`, "error");
            setCurrentStep(0);
        } finally {
            setIsLoading(false);
        }
    };

    // 上傳檔案到伺服器
    const uploadFilesToServer = async (files) => {
        const uploadedFiles = [];
        
        for (const fileWrapper of files) {
            if (fileWrapper.isNewFile) {
                try {
                    console.log("正在上傳檔案:", fileWrapper.name);
                    
                    // 檢查當前用戶身份驗證狀態
                    const { data: { session } } = await supabase.auth.getSession();
                    console.log("當前身份驗證狀態:", {
                        hasSession: !!session,
                        hasToken: !!session?.access_token,
                        user: session?.user?.email
                    });
                    
                    const formData = new FormData();
                    formData.append('file', fileWrapper.file || fileWrapper);
                    
                    console.log("FormData 內容:", {
                        fileName: (fileWrapper.file || fileWrapper).name,
                        fileSize: (fileWrapper.file || fileWrapper).size,
                        fileType: (fileWrapper.file || fileWrapper).type
                    });
                    
                    const response = await authFetch('/api/upload-files', {
                        method: 'POST',
                        body: formData,
                    });
                    
                    console.log("上傳回應狀態:", response.status);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("上傳失敗詳情:", errorText);
                        throw new Error(`上傳失敗: ${response.status} - ${errorText}`);
                    }
                    
                    const result = await response.json();
                    console.log("上傳成功結果:", result);
                    uploadedFiles.push(result.data);
                } catch (error) {
                    console.error(`檔案 ${fileWrapper.name} 上傳失敗:`, error);
                    showToast(`檔案 ${fileWrapper.name} 上傳失敗: ${error.message}`, 'error');
                }
            }
        }
        
        return uploadedFiles;
    };

    // 儲存公告
    const handleSave = async () => {
        if (!isFormValid) {
            showToast("請填寫所有必填欄位", "warning");
            return;
        }

        setIsLoading(true);
        setLoadingText(isEditMode ? "更新中..." : "儲存中...");

        try {
            // 上傳新檔案
            const newFiles = selectedFiles.filter(file => file.isNewFile);
            const uploadedFiles = await uploadFilesToServer(newFiles);

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
                const { data, error } = await supabase
                    .from('announcements')
                    .update(announcementData)
                    .eq('id', editingAnnouncement.id)
                    .select()
                    .single();

                if (error) throw error;
                announcementId = editingAnnouncement.id;
            } else {
                const { data, error } = await supabase
                    .from('announcements')
                    .insert(announcementData)
                    .select()
                    .single();

                if (error) throw error;
                announcementId = data.id;
            }

            // 儲存附件資訊到資料庫
            if (uploadedFiles.length > 0) {
                const attachmentData = uploadedFiles.map(file => ({
                    announcement_id: announcementId,
                    file_name: file.originalName,
                    stored_file_path: file.path,
                    file_size: file.size,
                    mime_type: file.mimeType
                }));

                const { error: attachmentError } = await supabase
                    .from('attachments')
                    .insert(attachmentData);

                if (attachmentError) throw attachmentError;
            }

            showToast(isEditMode ? "公告更新成功!" : "公告發布成功!", "success");
            
            if (refreshAnnouncements) {
                refreshAnnouncements();
            }
            
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            console.error('儲存失敗:', error);
            showToast(`儲存失敗: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // 刪除公告
    const handleDelete = async () => {
        setIsLoading(true);
        setLoadingText("刪除中...");

        try {
            // 刪除公告（附件會自動級聯刪除）
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', editingAnnouncement.id);

            if (error) throw error;

            showToast("公告刪除成功!", "success");
            
            if (refreshAnnouncements) {
                refreshAnnouncements();
            }
            
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            console.error('刪除失敗:', error);
            showToast(`刪除失敗: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleClose = useCallback(() => {
        if (isLoading) return;
        onClose();
    }, [isLoading, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pt-16"
                onClick={handleClose}
            >
                <div
                    className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden transform transition-all duration-300 ${
                        show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 標題欄 */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {isEditMode ? '編輯公告' : '建立新公告'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {isEditMode ? '修改現有公告內容' : '建立並發布新的獎學金公告'}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 主要內容 */}
                    <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-6">
                        {!isEditMode && currentStep === 0 && (
                            <>
                                <InputModeSelector 
                                    inputMode={inputMode} 
                                    setInputMode={setInputMode} 
                                    disabled={isLoading} 
                                />
                                
                                {inputMode === 'ai' ? (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-medium text-gray-900">上傳檔案或網址進行 AI 分析</h3>
                                        <FileUploadArea 
                                            selectedFiles={selectedFiles}
                                            setSelectedFiles={setSelectedFiles}
                                            disabled={isLoading}
                                            showToast={showToast}
                                        />
                                        <UrlInputArea 
                                            urls={urls}
                                            setUrls={setUrls}
                                            disabled={isLoading}
                                            showToast={showToast}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-medium text-gray-900">手動輸入公告內容</h3>
                                        <ManualInputForm
                                            formData={formData}
                                            setFormData={setFormData}
                                            handleSummaryChange={handleSummaryChange}
                                            disabled={isLoading}
                                        />
                                        <FileUploadArea 
                                            selectedFiles={selectedFiles}
                                            setSelectedFiles={setSelectedFiles}
                                            disabled={isLoading}
                                            showToast={showToast}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {currentStep === 1 && (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-lg font-medium text-gray-900">{loadingText}</p>
                                <p className="text-sm text-gray-500 mt-2">請稍候，正在處理您的資料...</p>
                            </div>
                        )}

                        {(currentStep === 2 || isEditMode) && (
                            <div className="space-y-6">
                                <Stepper currentStep={inputMode === 'manual' ? 1 : 2} inputMode={inputMode} />
                                <h3 className="text-lg font-medium text-gray-900">審閱並發布公告</h3>
                                <ManualInputForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    handleSummaryChange={handleSummaryChange}
                                    disabled={isLoading}
                                />
                                {!isEditMode && (
                                    <FileUploadArea 
                                        selectedFiles={selectedFiles}
                                        setSelectedFiles={setSelectedFiles}
                                        disabled={isLoading}
                                        showToast={showToast}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center space-x-3">
                            {!isEditMode && currentStep === 0 && (
                                <Stepper currentStep={currentStep} inputMode={inputMode} />
                            )}
                        </div>

                        <div className="flex items-center space-x-3">
                            {isEditMode && (
                                <Button
                                    variant="danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isLoading}
                                >
                                    刪除公告
                                </Button>
                            )}

                            <Button
                                variant="secondary"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                取消
                            </Button>

                            {!isEditMode && currentStep === 0 && inputMode === 'ai' && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={handleSkipToManual}
                                        disabled={isLoading}
                                    >
                                        跳過 AI 分析
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleAiAnalyze}
                                        disabled={isLoading || (selectedFiles.length === 0 && urls.length === 0)}
                                    >
                                        開始 AI 分析
                                    </Button>
                                </>
                            )}

                            {((!isEditMode && currentStep === 0 && inputMode === 'manual') || 
                              (!isEditMode && currentStep === 2) || 
                              isEditMode) && (
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    disabled={isLoading || !isFormValid}
                                >
                                    {isEditMode ? '更新公告' : '發布公告'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast 通知 */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

            {/* 刪除確認對話框 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">確認刪除</h3>
                        <p className="text-gray-600 mb-6">
                            您確定要刪除這個公告嗎？此操作無法復原，相關的附件檔案也會一併刪除。
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                            >
                                取消
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                disabled={isLoading}
                            >
                                確認刪除
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
