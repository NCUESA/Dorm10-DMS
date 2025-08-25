"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronsUpDown, ArrowUp, ArrowDown, Loader2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye, User, Calendar, FileText, ChevronDown } from 'lucide-react';
import AnnouncementDetailModal from './AnnouncementDetailModal'; // 引入 Modal 元件

// --- 主元件內容 ---
function AnnouncementsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState({ column: 'created_at', ascending: false });
    
    // 用於行動版卡片展開
    const [expandedId, setExpandedId] = useState(null);

    // Modal 相關的 state
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const isInitialLoad = useRef(true);

    // 異步獲取公告資料的函式
    const fetchAnnouncements = useCallback(async (announcementIdToOpen = null) => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            rowsPerPage: rowsPerPage.toString(),
            search: search,
            sortBy: sort.column,
            ascending: sort.ascending.toString(),
        });

        try {
            const res = await fetch(`/api/announcements?${params.toString()}`);
            if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
            const result = await res.json();

            if (result.success) {
                setAnnouncements(result.announcements);
                setTotalCount(result.totalCount);

                // 如果 URL 帶有 ID，則在資料載入後找到對應公告並開啟 Modal
                if (announcementIdToOpen) {
                    const foundAnn = result.announcements.find(a => a.id === announcementIdToOpen);
                    if (foundAnn) {
                        setSelectedAnnouncement(foundAnn);
                    }
                }
            } else {
                console.error("Error fetching announcements:", result.error);
                setAnnouncements([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
            setAnnouncements([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, sort]);

    // 首次載入時，檢查 URL 參數
    useEffect(() => {
        if (isInitialLoad.current) {
            const announcementIdFromUrl = searchParams.get('announcement_id');
            fetchAnnouncements(announcementIdFromUrl);
            isInitialLoad.current = false;
        }
    }, []); // 依賴為空陣列，確保只在首次掛載時執行

    // 當篩選條件改變時，重新獲取資料
    useEffect(() => {
        if (!isInitialLoad.current) {
            fetchAnnouncements();
        }
    }, [page, rowsPerPage, search, sort]);
    
    // 開啟和關閉 Modal 的處理函式
    const handleOpenModal = (announcement) => {
        setSelectedAnnouncement(announcement);
    };

    const handleCloseModal = () => {
        setSelectedAnnouncement(null);
        // 關閉 Modal 時，從 URL 中移除參數
        const newParams = new URLSearchParams(Array.from(searchParams.entries()));
        newParams.delete('announcement_id');
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        router.replace(newUrl, { scroll: false });
    };

    // 處理排序變更
    const handleSort = (field) => {
        setSort(prev => ({ 
            column: field, 
            ascending: prev.column === field ? !prev.ascending : false 
        }));
        setPage(1);
    };
    
    // 延遲搜尋以避免過多請求 (debounce)
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!isInitialLoad.current) {
                fetchAnnouncements();
            }
        }, 500); // 500ms 延遲

        return () => {
            clearTimeout(handler);
        };
    }, [search]);


    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    // 渲染排序圖示
    const renderSortIcon = (column) => {
        if (sort.column !== column) return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />;
        return sort.ascending ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" />;
    };

    const totalPages = Math.ceil(totalCount / rowsPerPage);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <FileText size={30} className="text-indigo-600" />
                最新公告
            </h1>
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-auto md:flex-1 md:max-w-md">
                    <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="搜尋公告標題或摘要..." value={search} onChange={handleSearchChange}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
            </div>

            <div className="rounded-xl w-full bg-white shadow-lg overflow-hidden border border-gray-200/80">
                {/* --- 桌面版表格 --- */}
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/70 text-left">
                            <tr>
                                <th className="p-4 px-6 font-semibold text-gray-600 w-[55%] cursor-pointer" onClick={() => handleSort('title')}>
                                    <div className="flex items-center">標題 {renderSortIcon('title')}</div>
                                </th>
                                <th className="p-4 px-6 font-semibold text-gray-600 w-[15%] cursor-pointer" onClick={() => handleSort('views')}>
                                    <div className="flex items-center">點閱數 {renderSortIcon('views')}</div>
                                </th>
                                <th className="p-4 px-6 font-semibold text-gray-600 w-[15%] cursor-pointer" onClick={() => handleSort('uploader')}>
                                    <div className="flex items-center">上傳者 {renderSortIcon('uploader')}</div>
                                </th>
                                <th className="p-4 px-6 font-semibold text-gray-600 w-[15%] cursor-pointer" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center">發布時間 {renderSortIcon('created_at')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-16 text-gray-500"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></td></tr>
                            ) : announcements.map(ann => (
                                <tr key={ann.id} onClick={() => handleOpenModal(ann)} className="hover:bg-indigo-50/50 transition-colors cursor-pointer">
                                    <td className="p-4 px-6 font-medium text-gray-800">{ann.title}</td>
                                    <td className="p-4 px-6 text-gray-600">{ann.views}</td>
                                    <td className="p-4 px-6 text-gray-600">{ann.profiles?.username || '系統管理員'}</td>
                                    <td className="p-4 px-6 text-gray-600">{new Date(ann.created_at).toLocaleDateString('en-CA')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- 行動版卡片 --- */}
                <div className="md:hidden flex flex-col">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                    ) : announcements.map(ann => (
                        <div key={ann.id} className="border-b border-gray-100 last:border-b-0">
                             <button onClick={() => handleOpenModal(ann)} className="w-full text-left p-4 hover:bg-indigo-50/50 transition-colors">
                                <h3 className="font-bold text-base text-gray-800 flex-1 mb-2">{ann.title}</h3>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5"><User size={12} /> {ann.profiles?.username || '系統管理員'}</div>
                                    <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(ann.created_at).toLocaleDateString('en-CA')}</div>
                                    <div className="flex items-center gap-1.5"><Eye size={12} /> {ann.views}</div>
                                </div>
                             </button>
                        </div>
                    ))}
                </div>
                
                {announcements.length === 0 && !loading && (<div className="p-16 text-center text-gray-500">找不到任何公告。</div>)}
            </div>

            {/* --- 分頁控制 --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-gray-600">共 {totalCount} 筆資料，第 {page} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                     <div className="relative">
                        <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm shadow-sm focus:outline-none focus:border-indigo-500">
                            {[10, 25, 50].map(v => <option key={v} value={v}>{v} 筆/頁</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"><ChevronsUpDown className="h-4 w-4" /></div>
                    </div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button onClick={() => setPage(1)} disabled={page === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                        <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button>
                    </nav>
                </div>
            </div>
            
            <AnnouncementDetailModal 
                isOpen={!!selectedAnnouncement} 
                onClose={handleCloseModal} 
                announcement={selectedAnnouncement} 
            />
        </div>
    );
}

// --- 主頁面 Wrapper ---
export default function AnnouncementsPage() {
    return (
        <Suspense fallback={
            <div className="w-full flex items-center justify-center py-24">
                <div className="h-12 w-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        }>
            <AnnouncementsPageContent />
        </Suspense>
    );
}