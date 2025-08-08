'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';

// 動態導入 Quill，防止 SSR 問題
const QuillEditor = ({ value, onChange, placeholder, disabled }) => {
    const [isClient, setIsClient] = useState(false);
    const quillRef = useRef(null); // 用於 DOM 元素的 Ref
    const quillInstance = useRef(null); // 用於 Quill 實例的 Ref

    // 檢查是否在客戶端
    useEffect(() => {
        setIsClient(true);
    }, []);

    // 使用 useCallback 確保 onTextChange 函數的穩定性
    const onTextChange = useCallback((delta, oldDelta, source) => {
        if (source === 'user' && quillInstance.current) {
            // 當使用者手動修改內容時，調用父組件傳入的 onChange 函數
            onChange(quillInstance.current.root.innerHTML);
        }
    }, [onChange]);

    useEffect(() => {
        if (!isClient || !quillRef.current || quillInstance.current) {
            return;
        }

        // 動態導入 Quill 和樣式
        const loadQuill = async () => {
            const Quill = (await import('quill')).default;
            await import('quill/dist/quill.snow.css');
            
            // --- 僅在第一次渲染時初始化 Quill ---
            quillInstance.current = new Quill(quillRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image'],
                        ['clean']
                    ],
                },
                placeholder,
            });

            // 設置初始內容
            if (value) {
                quillInstance.current.clipboard.dangerouslyPasteHTML(value);
            }

            quillInstance.current.on('text-change', onTextChange);
        };

        loadQuill().catch(console.error);

        // 清理函數
        return () => {
            if (quillInstance.current) {
                console.log("QuillEditor 清理");
                // 移除事件監聽器
                quillInstance.current.off('text-change', onTextChange);
                // 清空 DOM 內容
                if (quillRef.current) {
                    quillRef.current.innerHTML = '';
                }
                // 清空實例引用
                quillInstance.current = null;
            }
        };
    }, [isClient, placeholder, onTextChange]); // 移除 value 依賴

    useEffect(() => {
        if (quillInstance.current && value !== undefined) {
            // --- 處理外部傳入的 value 變化 ---
            const editorHTML = quillInstance.current.root.innerHTML;
            const normalizedEditorHTML = editorHTML === '<p><br></p>' ? '' : editorHTML.trim();
            const normalizedValue = (value || '').trim();
            
            // 只有當外部傳入的 value 與編輯器內的內容不同時，才更新編輯器
            if (normalizedValue !== normalizedEditorHTML) {
                try {
                    // 先清空編輯器
                    quillInstance.current.setText('');
                    
                    if (normalizedValue) {
                        // 使用 clipboard.dangerouslyPasteHTML 插入HTML內容
                        setTimeout(() => {
                            quillInstance.current.clipboard.dangerouslyPasteHTML(normalizedValue);
                            console.log("QuillEditor 內容已更新至:", normalizedValue);
                        }, 10);
                    } else {
                        console.log("QuillEditor 已清空");
                    }
                } catch (error) {
                    console.error("QuillEditor 更新內容失敗:", error);
                    // 備用方法: 直接設置 innerHTML
                    try {
                        quillInstance.current.root.innerHTML = normalizedValue || '<p><br></p>';
                        console.log("使用備用方法更新 QuillEditor 內容");
                    } catch (fallbackError) {
                        console.error("QuillEditor 備用方法失敗:", fallbackError);
                    }
                }
            }
        }
    }, [value]);

    useEffect(() => {
        if (quillInstance.current) {
            // --- 處理 disabled 狀態的變化 ---
            quillInstance.current.enable(!disabled);
        }
    }, [disabled]);

    // 如果不在客戶端，顯示 loading 或備用 UI
    if (!isClient) {
        return (
            <div 
                style={{ 
                    minHeight: '200px', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px',
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                }}
            >
                載入編輯器中...
            </div>
        );
    }

    return <div ref={quillRef} style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }} />;
};

export default QuillEditor;
