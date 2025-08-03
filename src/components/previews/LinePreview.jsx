// src/components/previews/LinePreview.jsx
import React from 'react';
import { Smartphone, CornerUpRight } from 'lucide-react';

const LinePreview = ({ announcement }) => {
    const deadline = announcement.application_deadline 
        ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW') 
        : '未指定';
    const platformUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?announcement_id=${announcement.id}`;

    const textContent = `🎓 獎學金新公告\n\n【${announcement.title}】\n\n- 截止日期：${deadline}\n- 適用對象：${announcement.target_audience || '所有學生'}\n\n👇 點擊下方連結查看完整資訊與附件\n${platformUrl}`;

    return (
        <div className="flex justify-center items-center h-full bg-slate-200 p-4 rounded-lg">
            <div className="w-full max-w-sm bg-[#78829c] rounded-3xl shadow-2xl p-2">
                <div className="bg-[#8c94ac] rounded-t-2xl px-4 py-2 text-white text-center text-sm">
                    與 NCUE 獎學金平台 的聊天
                </div>
                <div className="p-4 space-y-2">
                    <div className="bg-white rounded-lg p-3 max-w-xs">
                        <p className="whitespace-pre-wrap text-sm text-gray-800">{textContent}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-2">
                    <input type="text" disabled placeholder="輸入訊息..." className="flex-grow bg-white rounded-full px-4 py-2 text-sm" />
                    <button disabled className="p-2 bg-white rounded-full"><CornerUpRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default LinePreview;