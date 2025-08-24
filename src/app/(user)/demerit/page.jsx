"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";

export default function DemeritPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);

    // 未登入者導向登入頁
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            const loadRecords = async () => {
                try {
                    const res = await authFetch('/api/demerits');
                    const result = await res.json();
                    if (res.ok) {
                        setRecords(Array.isArray(result.records) ? result.records : []);
                    } else {
                        console.error('取得違規記點失敗：', result.error);
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

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center p-4">
                <span className="text-gray-600">載入中...</span>
            </div>
        );
    }
    const demerit = records.length;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-16 space-y-8">
            {/* 標題 */}
            <h1 className="text-3xl font-bold text-center">違規記點查詢</h1>

            {/* 總記點提示 */}
            <div className="bg-green-50 border border-green-300 text-green-800 rounded-lg p-4">
                <p className="font-bold">目前累積違規扣點：{demerit} 點</p>
                <p className="text-sm mt-1">您的記點將於住宿學年度結束後清零，如有疑問請洽宿舍管理員。</p>
            </div>

            {/* 公約摘要 */}
            <div>
                <h2 className="text-xl font-semibold mb-4">宿舍生活公約摘要</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <p className="font-bold">凡累計超過10點者：</p>
                        <p className="text-sm mt-1">將予以留校察看。</p>
                    </div>
                    <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                        <p className="font-bold">凡累計超過20點者：</p>
                        <p className="text-sm mt-1">將予以退宿。</p>
                    </div>
                </div>
            </div>

            {/* 記錄明細 */}
            <div>
                <h2 className="text-xl font-semibold mb-4">記錄明細</h2>
                {loadingRecords ? (
                    <div className="border rounded-lg p-6 text-center">載入中...</div>
                ) : records.length === 0 ? (
                    <div className="border rounded-lg p-6 text-center bg-green-50 text-green-700">
                        太好了！目前尚無違規記錄。
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left border">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border">日期</th>
                                    <th className="p-2 border">登記人</th>
                                    <th className="p-2 border">事由</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r) => (
                                    <tr key={r.id} className="border-t">
                                        <td className="p-2 border">{new Date(r.created_at).toLocaleDateString('en-CA')}</td>
                                        <td className="p-2 border">{r.recorder}</td>
                                        <td className="p-2 border">{r.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
