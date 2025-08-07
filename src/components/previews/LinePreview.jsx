// src/components/previews/LinePreview.jsx
import React from 'react';
import { Smartphone } from 'lucide-react';

// --- Helper Components for rendering Flex Message ---

// 轉換 LINE 的樣式屬性為 Tailwind CSS
const mapStyleToProps = (props = {}) => {
    const styles = [];
    if (props.size) {
        const sizeMap = { 'xs': 'text-xs', 'sm': 'text-sm', 'md': 'text-base', 'lg': 'text-lg', 'xl': 'text-xl' };
        styles.push(sizeMap[props.size] || 'text-sm');
    }
    if (props.weight === 'bold') styles.push('font-bold');
    if (props.color) styles.push(`[color:${props.color}]`); // 使用任意值語法
    if (props.align) {
        const alignMap = { 'start': 'text-left', 'center': 'text-center', 'end': 'text-right' };
        styles.push(alignMap[props.align]);
    }
    if (props.margin) {
        const marginMap = { 'xs': 'mt-1', 'sm': 'mt-2', 'md': 'mt-4', 'lg': 'mt-6', 'xl': 'mt-8' };
        styles.push(marginMap[props.margin]);
    }
    return styles.join(' ');
};

const FlexText = ({ component }) => (
    <p className={`${mapStyleToProps(component)} ${component.wrap ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
        {component.text}
    </p>
);

const FlexButton = ({ component }) => {
    const styleMap = {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-200 text-black',
        link: 'bg-transparent text-blue-500'
    };
    return (
        <div className={`w-full rounded-md text-center p-2 font-bold ${styleMap[component.style] || styleMap.primary} ${mapStyleToProps(component)}`}>
            {component.action.label}
        </div>
    );
};

// 這是核心的遞迴渲染組件
const FlexContent = ({ component }) => {
    if (!component) return null;
    switch (component.type) {
        case 'box':
            return <FlexBox box={component} />;
        case 'text':
            return <FlexText component={component} />;
        case 'button':
            return <FlexButton component={component} />;
        default:
            return null;
    }
};

const FlexBox = ({ box }) => {
    const layoutMap = {
        vertical: 'flex-col',
        horizontal: 'flex-row items-center'
    };
    const spacingMap = {
        'xs': 'gap-1', 'sm': 'gap-2', 'md': 'gap-4', 'lg': 'gap-6', 'xl': 'gap-8'
    };
    return (
        <div className={`flex ${layoutMap[box.layout] || 'flex-col'} ${spacingMap[box.spacing] || ''} ${mapStyleToProps(box)} w-full`}>
            {box.contents.map((content, index) => (
                <FlexContent key={index} component={content} />
            ))}
        </div>
    );
};


// --- Main Preview Component ---

const LinePreview = ({ announcement }) => {
    let flexMessage = null;

    // 嘗試解析 AI 生成的 Flex Message
    if (announcement?.line_msg) {
        try {
            const parsed = JSON.parse(announcement.line_msg);
            // 確保解析出來的是一個有效的 Flex Message 物件
            if (parsed.type === 'flex' && parsed.contents) {
                flexMessage = parsed.contents; // 我們只需要渲染 bubble 的內容
            }
        } catch (e) {
            console.warn("Failed to parse line_msg, falling back to text preview.", e);
            flexMessage = null; // 解析失敗則退回
        }
    }

    // --- 備用方案：純文字預覽 ---
    const PlainTextPreview = () => {
        const deadline = announcement.application_deadline 
            ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW') 
            : '未指定';
        const platformUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?announcement_id=${announcement.id}`;
        const textContent = `🎓 獎學金新公告\n\n【${announcement.title}】\n\n- 截止日期：${deadline}\n- 適用對象：${announcement.target_audience || '所有學生'}\n\n👇 點擊下方連結查看完整資訊與附件\n${platformUrl}`;
        
        return (
             <div className="bg-white rounded-lg p-3 max-w-full">
                <p className="whitespace-pre-wrap text-sm text-gray-800">{textContent}</p>
            </div>
        );
    };

    // --- Flex Message 預覽 ---
    const FlexMessagePreview = ({ bubble }) => (
        <div className="bg-white rounded-lg w-full overflow-hidden">
            {/* 渲染 Header */}
            {bubble.header && (
                <div className="p-4 bg-gray-50 border-b">
                    <FlexBox box={bubble.header} />
                </div>
            )}
            {/* 渲染 Hero (圖片) */}
            {bubble.hero && (
                 <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Hero Image Preview</span>
                </div>
            )}
            {/* 渲染 Body */}
            {bubble.body && (
                <div className="p-4">
                    <FlexBox box={bubble.body} />
                </div>
            )}
            {/* 渲染 Footer */}
            {bubble.footer && (
                 <div className="p-4 border-t">
                    <FlexBox box={bubble.footer} />
                </div>
            )}
        </div>
    );


    return (
        <div className="flex justify-center items-center h-full bg-slate-200/80 p-4 rounded-lg">
            <div className="w-full max-w-[320px] bg-[#78829c] rounded-3xl shadow-2xl p-2 font-sans">
                {/* 手機頂部狀態欄 */}
                <div className="flex justify-between items-center px-4 pt-1">
                    <span className="text-white text-xs font-bold">11:24</span>
                    <div className="flex items-center gap-1">
                        <Smartphone size={12} className="text-white" />
                        <span className="text-white text-xs font-bold">5G</span>
                    </div>
                </div>

                {/* LINE 聊天室標題 */}
                <div className="bg-[#8c94ac] rounded-t-2xl px-4 py-2 text-white text-center text-sm mt-1">
                    NCUE 獎學金平台
                </div>

                {/* 聊天內容區域 */}
                <div className="p-4 space-y-2 bg-[#8c94ac] min-h-[450px] flex flex-col items-start">
                    {/* 根據是否有 flexMessage 決定渲染哪個版本 */}
                    {flexMessage ? <FlexMessagePreview bubble={flexMessage} /> : <PlainTextPreview />}
                </div>

                {/* 輸入框區域 */}
                <div className="flex items-center gap-2 p-2 bg-[#8c94ac] rounded-b-2xl">
                    <input type="text" disabled placeholder="輸入訊息..." className="flex-grow bg-white rounded-full px-4 py-2 text-sm focus:outline-none" />
                </div>
            </div>
        </div>
    );
};

export default LinePreview;