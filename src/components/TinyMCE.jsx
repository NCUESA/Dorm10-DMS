'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const TinyMceEditor = ({ value, onChange, placeholder, disabled }) => {
    const [isClient, setIsClient] = useState(false);
    const editorRef = useRef(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleEditorChange = (content, editor) => {
        onChange(content);
    };

    // 如果不在客戶端，顯示載入中的提示，避免 SSR 問題
    if (!isClient) {
        return (
            <div
                style={{
                    minHeight: '350px',
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

    return (
        <>
            <style jsx global>{`
                .rich-text-content table {
                    width: 100% !important;
                    border-collapse: collapse;
                }
                .rich-text-content td,
                .rich-text-content th {
                    border: 1px solid #ccc;
                    padding: 8px;
                }
            `}</style>
            <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue={value || ''}
                onEditorChange={handleEditorChange}
                disabled={disabled}
                init={{
                    min_height: 350,
                    autoresize_bottom_margin: 25,
                    resize: 'vertical',
                    language: 'zh_TW',
                    language_url: '/langs/zh_TW.js',

                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                        'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                        'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount',
                        'autoresize', 'codesample', 'emoticons'
                    ],
                    toolbar:
                        'undo redo | styles | bold italic underline strikethrough | ' +
                        'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
                        'bullist numlist outdent indent | link image media | ' +
                        'table codesample emoticons | removeformat | fullscreen preview code | help',

                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',

                    table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
                    image_advtab: true,
                    image_caption: true,
                    image_title: true,
                    paste_data_images: true,
                    menubar: true,
                }}
            />
        </>
    );
};

export default TinyMceEditor;