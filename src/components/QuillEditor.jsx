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

            // 監聽內容變更事件
            quillInstance.current.on('text-change', onTextChange);
        };

        loadQuill().catch(console.error);
    }, [isClient, placeholder, onTextChange]);

    useEffect(() => {
        if (quillInstance.current) {
            // --- 處理外部傳入的 value 變化 ---
            const editorHTML = quillInstance.current.root.innerHTML;
            // 只有當外部傳入的 value 與編輯器內的內容不同時，才更新編輯器
            // 這樣可以避免在使用者輸入時，因父組件 re-render 導致的游標跳動問題
            if (value !== editorHTML) {
                // dangerouslyPasteHTML 會保留 HTML 樣式，正是我們需要的
                quillInstance.current.clipboard.dangerouslyPasteHTML(value || '');
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
