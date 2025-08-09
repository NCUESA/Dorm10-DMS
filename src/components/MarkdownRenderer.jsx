// src/components/MarkdownRenderer.jsx

'use client';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

/**
 * 最終版的 Markdown 渲染器，強制美化表格樣式。
 * @param {{ content: string }} props
 */
const MarkdownRenderer = ({ content }) => {
    // 如果沒有內容，直接返回 null，避免不必要的渲染
    if (!content) return null;

    return (
        <ReactMarkdown
            // rehypeRaw 插件是必要的，用來處理 AI 回應中可能夾帶的 HTML
            rehypePlugins={[rehypeRaw]}
            // 使用 components 屬性來覆寫預設的 HTML 元素渲染方式
            components={{
                // **核心修正點**: 為表格相關元素提供明確的樣式
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4 border border-gray-200 rounded-lg bg-white">
                        <table className="min-w-full text-sm" {...props} />
                    </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200" {...props} />,
                tr: ({ node, ...props }) => <tr className="hover:bg-gray-50" {...props} />,
                th: ({ node, ...props }) => (
                    <th
                        className="px-4 py-2 text-left font-semibold text-gray-600"
                        {...props}
                    />
                ),
                td: ({ node, ...props }) => (
                    <td className="px-4 py-3 text-gray-700" {...props} />
                ),
                // 你也可以繼續為其他元素自訂樣式
                // 例如，讓連結更突出
                a: ({ node, ...props }) => (
                    <a className="text-blue-600 hover:underline" {...props} />
                ),
                // 讓列表有更多空間
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;
