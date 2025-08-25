"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertTriangle, List, CheckCircle, Ban } from "lucide-react";
// --- START: 核心修正區塊 1 ---
// 導入我們建立的 authFetch 函式
import { authFetch } from "@/lib/authFetch";
// --- END: 核心修正區塊 1 ---

export default function DemeritPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            const loadRecords = async () => {
                setLoadingRecords(true);
                try {
                    // --- START: 核心修正區塊 2 ---
                    // 使用 authFetch 而不是原生的 fetch
                    const res = await authFetch('/api/demerits');
                    // --- END: 核心修正區塊 2 ---
                    
                    const result = await res.json();
                    if (res.ok && result.success) {
                        setRecords(Array.isArray(result.records) ? result.records : []);
                    } else {
                        // 現在這裡的 result.error 會是後端 API 回傳的真實錯誤
                        console.error('取得違規記點失敗：', result.error || '伺服器回傳錯誤');
                        setRecords([]);
                    }
                } catch (err) {
                    console.error('載入違規記點時發生錯誤：', err);
                    setRecords([]);
                } finally {
                    setLoadingRecords(false);
                }
            };
            loadRecords();
        }
    }, [isAuthenticated]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }
    const demeritPoints = records.length;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 my-12 sm:my-16 space-y-10">
            {/* --- 標題 (無變更) --- */}
            <h1 className="text-4xl font-bold text-center text-gray-800 tracking-tight">違規記點查詢</h1>

            {/* --- 總記點提示 (無變更) --- */}
            <div className="bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800 rounded-r-lg p-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-lg font-semibold">目前累計違規計點數：{demeritPoints} 點</h2>
                        <p className="text-sm mt-1">您的記點狀況將影響住宿資格與保證金退還，請務必詳閱以下規定。</p>
                    </div>
                </div>
            </div>

            {/* --- 公約摘要 (無變更) --- */}
            <div>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">宿舍生活公約摘要</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            <h3 className="text-lg font-bold text-yellow-800">累計 10 點懲處</h3>
                        </div>
                        <p className="text-yellow-900">凡累計記點達 <span className="font-bold text-lg">10</span> 點者，將處以：</p>
                        <div className="mt-3 space-y-2 bg-yellow-100/70 p-4 rounded-md text-yellow-900">
                            <p className="flex items-center gap-2 font-semibold"><Ban size={16} className="text-yellow-600"/> 取消一年住宿權。</p>
                            <p className="flex items-center gap-2 font-bold"><Ban size={16} className="text-yellow-600"/> 不退還住宿費及保證金。</p>
                        </div>
                        <p className="text-xs text-yellow-700 mt-3"><span className="font-semibold">常見事由：</span>私接線路、抽菸、帶異性或非住宿生進入非宿舍開放區域、違反性平規定等。</p>
                    </div>
                    <div className="p-5 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                            <h3 className="text-lg font-bold text-red-800">累計 20 點懲處</h3>
                        </div>
                        <p className="text-red-900">凡累計記點達 <span className="font-bold text-lg">20</span> 點者，將處以：</p>
                        <div className="mt-3 space-y-2 bg-red-100/70 p-4 rounded-md text-red-900">
                            <p className="flex items-center gap-2 font-semibold"><Ban size={16} className="text-red-600"/> 取消二年住宿權。</p>
                            <p className="flex items-center gap-2 font-bold"><Ban size={16} className="text-red-600"/> 不退還住宿費及保證金。</p>
                        </div>
                        <p className="text-xs text-red-700 mt-3"><span className="font-semibold">常見事由：</span>賭博、竊盜、蓄意破壞公物、私自住校或轉讓床位、擅自帶異性或非該宿舍住宿生進入寢室等重大違規。</p>
                    </div>
                </div>
            </div>

            {/* --- 其他重要規定 (無變更) --- */}
            <div className="bg-gray-100 border border-gray-200 text-gray-700 rounded-lg p-4 text-sm">
                <p><span className="font-bold">其他重要規定：</span>違規行為若同時觸犯校規，將依學生獎懲辦法另行處理，嚴重者可撤銷在學期間住宿權。因個人因素中途退宿或未完成退宿手續者，亦將扣除全額保證金。</p>
            </div>

            {/* --- 記錄明細 (無變更) --- */}
            <div>
                <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-3"><List /> 記點明細</h2>
                <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    {loadingRecords ? (
                        <div className="p-10 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" /> 載入紀錄中...
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-10 text-center bg-white">
                            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-emerald-700">太棒了！</h3>
                            <p className="text-gray-600 mt-2">您目前沒有任何違規記點紀錄，請繼續保持。</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-3 px-4 font-semibold text-gray-600 w-1/4">記點日期</th>
                                        <th className="p-3 px-4 font-semibold text-gray-600 w-1/4">登記人</th>
                                        <th className="p-3 px-4 font-semibold text-gray-600 w-1/2">事由</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {records.map((r, index) => (
                                        <tr key={r.id || index} className="hover:bg-gray-50">
                                            <td className="p-3 px-4 text-gray-700">{new Date(r.created_at).toLocaleDateString('zh-TW')}</td>
                                            <td className="p-3 px-4 text-gray-700">{r.recorder_name}</td>
                                            <td className="p-3 px-4 text-gray-700">{r.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}