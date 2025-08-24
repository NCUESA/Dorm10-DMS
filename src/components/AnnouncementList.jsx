"use client";

import { useEffect, useState } from "react";
// 透過後端 API 取得公告資料
import { Loader2, Paperclip, Link as LinkIcon } from "lucide-react";

// 解析 external_urls 欄位，支援 JSON 陣列或單一字串
function parseUrls(raw) {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed
                .map((item) => {
                    if (typeof item === "string") return item;
                    if (item && typeof item.url === "string") return item.url;
                    return null;
                })
                .filter(Boolean);
        }
    } catch (e) {
        // 若不是 JSON，就直接回傳字串
        if (typeof raw === "string") return [raw];
    }
    return [];
}

// 將儲存路徑轉換為公開下載網址
function getPublicAttachmentUrl(filePath) {
    if (!filePath) return "#";
    const parts = filePath.split("/");
    const fileName = parts[parts.length - 1];
    return `/api/attachments/${fileName}`;
}

export default function AnnouncementList() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // 由後端 API 載入公告資料
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/announcements');
                const result = await res.json();
                if (res.ok) {
                    setAnnouncements(Array.isArray(result.announcements) ? result.announcements : []);
                } else {
                    console.error('載入公告失敗：', result.error);
                    setAnnouncements([]);
                }
            } catch (err) {
                console.error('載入公告時發生錯誤：', err);
                setAnnouncements([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8 text-indigo-600">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (announcements.length === 0) {
        return <div className="text-center text-gray-500">目前沒有公告。</div>;
    }

    return (
        <ul className="space-y-6">
            {announcements.map((ann) => {
                const links = parseUrls(ann.external_urls);
                return (
                    <li key={ann.id} className="bg-white border rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800">{ann.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">發布日期：{new Date(ann.created_at).toLocaleDateString("en-CA")}</p>

                        {links.length > 0 && (
                            <div className="mt-4 space-y-1">
                                {links.map((url, idx) => (
                                    <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-indigo-600 hover:underline"
                                    >
                                        <LinkIcon className="h-4 w-4 mr-1" />
                                        {url}
                                    </a>
                                ))}
                            </div>
                        )}

                        {ann.attachments?.length > 0 && (
                            <div className="mt-4 space-y-1">
                                {ann.attachments.map((att) => (
                                    <a
                                        key={att.id}
                                        href={getPublicAttachmentUrl(att.stored_file_path)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-slate-700 hover:text-indigo-600"
                                    >
                                        <Paperclip className="h-4 w-4 mr-1" />
                                        {att.file_name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
