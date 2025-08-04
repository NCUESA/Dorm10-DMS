"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronsUpDown, ArrowUp, ArrowDown, Award, Loader2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import AnnouncementDetailModal from './AnnouncementDetailModal';

// --- Helper Functions & Constants ---
const categoryStyles = {
    A: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },         // 紅
    B: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' }, // 橘 (黃)
    C: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },   // 綠
    D: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },     // 藍
    E: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' }, // 紫
    default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};
const getCategoryStyle = (cat) => categoryStyles[cat] || categoryStyles.default;

const calculateSemester = (deadlineStr) => {
    if (!deadlineStr) return 'N/A';
    const deadline = new Date(deadlineStr);
    const year = deadline.getFullYear();
    const month = deadline.getMonth() + 1;
    const academicYear = year - 1912 + Math.floor(month / 7);
    const semester = (month >= 8 || month === 1) ? 1 : 2;
    return `${academicYear}-${semester}`;
};

// --- Main Component ---
function AnnouncementListContent() {
    const searchParams = useSearchParams();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortLoading, setSortLoading] = useState(false);
    const [filter, setFilter] = useState('open');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState({ column: 'application_deadline', ascending: true });

    // ✨ 修改: 手機版 RWD 卡片展開狀態
    const [expandedId, setExpandedId] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const announcementRefs = useRef({});

    const fetchAnnouncements = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        else setSortLoading(true);

        let query = supabase.from('announcements').select('*, attachments(*)', { count: 'exact' });

        if (search) query = query.or(`title.ilike.%${search}%,target_audience.ilike.%${search}%,application_limitations.ilike.%${search}%`);

        const today = new Date().toISOString().slice(0, 10);
        if (filter === 'open') query = query.gte('application_deadline', today);
        else if (filter === 'expired') query = query.lt('application_deadline', today);

        const orderColumn = sort.column === 'semester' ? 'application_deadline' : sort.column;
        query = query.order(orderColumn, { ascending: sort.ascending });

        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (!error) {
            const dataWithSemester = (data || []).map(item => ({ ...item, semester: calculateSemester(item.application_deadline) }));
            setAnnouncements(dataWithSemester);
            setTotalCount(count || 0);
        } else console.error("Error fetching announcements:", error);

        if (isInitialLoad) setLoading(false);
        else setSortLoading(false);
    }, [search, filter, page, rowsPerPage, sort]);

    useEffect(() => {
        fetchAnnouncements(announcements.length === 0);
    }, [fetchAnnouncements]);

    useEffect(() => {
        const announcementIdFromUrl = searchParams.get('announcement_id');
        if (announcementIdFromUrl && announcements.length > 0) {
            const targetAnnouncement = announcements.find(a => a.id === announcementIdFromUrl);
            if (targetAnnouncement) {
                handleOpenDetailModal(targetAnnouncement);
                setTimeout(() => {
                    announcementRefs.current[announcementIdFromUrl]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        }
    }, [searchParams, announcements]);

    const handleSort = (field) => {
        setSort(prev => ({ column: field, ascending: prev.column === field ? !prev.ascending : true }));
        setPage(1);
    };

    const handleOpenDetailModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsDetailModalOpen(true);
    };

    const renderSortIcon = (column) => {
        if (sort.column !== column) return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />;
        return sort.ascending ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" />;
    };

    const totalPages = Math.ceil(totalCount / rowsPerPage);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white/80 backdrop-blur-lg border border-slate-200/80 rounded-2xl p-6 mb-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Award size={22} className="text-indigo-500" />獎助學金代碼定義
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-slate-600">
                    <p><strong className="font-semibold text-red-600">A：</strong>各縣市政府獎助學金</p>
                    <p><strong className="font-semibold text-orange-600">B：</strong>縣市政府以外之各級公家機關及公營單位獎助學金</p>
                    <p><strong className="font-semibold text-green-600">C：</strong>宗教及民間各項指定身分獎助學金</p>
                    <p><strong className="font-semibold text-blue-600">D：</strong>各民間單位（經濟不利、學業優良等）</p>
                    <p><strong className="font-semibold text-violet-600">E：</strong>獎學金得獎名單公告</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:max-w-md">
                    <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="搜尋公告標題、摘要、適用對象..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-300
                                   focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <Button variant={filter === 'open' ? 'primary' : 'ghost'} onClick={() => { setFilter('open'); setPage(1); }}>開放申請中</Button>
                    <Button variant={filter === 'all' ? 'primary' : 'ghost'} onClick={() => { setFilter('all'); setPage(1); }}>全部公告</Button>
                    <Button variant={filter === 'expired' ? 'primary' : 'ghost'} onClick={() => { setFilter('expired'); setPage(1); }}>已過期</Button>
                </div>
            </div>

            <div className="rounded-xl w-full bg-white shadow-lg overflow-hidden border border-gray-200/80">
                <div className="hidden md:block relative">
                    {sortLoading && (<div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center"><div className="flex items-center gap-2 text-slate-600 font-semibold"><Loader2 className="animate-spin h-5 w-5" />排序中...</div></div>)}
                    <table className="w-full text-sm table-fixed">
                        <thead className="bg-gray-50/70 text-left">
                            <tr>
                                <th className="p-4 px-6 font-semibold text-gray-500 cursor-pointer w-[10%]" onClick={() => handleSort('semester')}><div className="flex items-center">學期 {renderSortIcon('semester')}</div></th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[25%]">獎助學金資料</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[35%]">適用對象</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[10%]">兼領限制</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 cursor-pointer w-[20%]" onClick={() => handleSort('application_deadline')}><div className="flex items-center">申請期限 / 送件方式 {renderSortIcon('application_deadline')}</div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (<tr><td colSpan="5" className="text-center p-16 text-gray-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />載入中...</td></tr>) : announcements.map(item => (
                                <tr key={item.id} ref={el => (announcementRefs.current[item.id] = el)} onClick={() => handleOpenDetailModal(item)} className="transform transition-all duration-300 hover:bg-violet-100/50 hover:shadow-2xl z-0 hover:z-10 hover:scale-[1.01] cursor-pointer">
                                    <td className="p-4 px-6 font-medium text-gray-800 align-top">{item.semester}</td>
                                    <td className="p-4 px-6 align-top">
                                        <div className="flex items-start gap-3">
                                            <span className={`flex-shrink-0 mt-1 inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold ${getCategoryStyle(item.category).bg} ${getCategoryStyle(item.category).text} border ${getCategoryStyle(item.category).border}`}>{item.category}</span>
                                            <p className="font-semibold text-gray-900">{item.title}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 text-sm text-gray-600 align-top">{item.target_audience}</td>
                                    <td className="p-4 px-6 text-sm font-bold align-top">
                                        {item.application_limitations === 'N' && <span className="text-green-600">{item.application_limitations}</span>}
                                        {item.application_limitations === 'Y' && <span className="text-red-600">{item.application_limitations}</span>}
                                        {item.application_limitations !== 'N' && item.application_limitations !== 'Y' && <span className="text-gray-600 font-normal">{item.application_limitations || '無'}</span>}
                                    </td>
                                    <td className="p-4 px-6 text-sm align-top">
                                        <div className={`font-bold ${new Date(item.application_deadline) < new Date() && item.application_deadline ? 'text-gray-500' : 'text-red-600'}`}>
                                            {item.application_deadline ? new Date(item.application_deadline).toLocaleDateString('en-CA') : 'N/A'}
                                        </div>
                                        <div className="text-slate-500 mt-1">{item.submission_method}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden flex flex-col gap-3 p-3">
                    {loading ? (<div className="p-10 text-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />載入中...</div>) : announcements.map(item => {
                        const isExpanded = expandedId === item.id;
                        const style = getCategoryStyle(item.category);
                        return (
                            <motion.div key={item.id} layout ref={el => (announcementRefs.current[item.id] = el)} className={`bg-white rounded-lg transition-all duration-300 border ${isExpanded ? 'shadow-xl ring-2 ring-indigo-400' : 'shadow-md border-gray-200/60'}`}>
                                <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="w-full text-left p-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold ${style.bg} ${style.text}`}>{item.category}</span>
                                                <span className="text-xs text-gray-500 font-medium">{`學期 ${item.semester}`}</span>
                                            </div>
                                            <h3 className="font-bold text-base text-gray-800">{item.title}</h3>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-400 mt-1 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                                            <div className="pt-2 pb-4 px-4 border-t border-gray-200 space-y-3 text-sm">
                                                <div>
                                                    <div className="font-semibold text-gray-500 mb-1">申請截止</div>
                                                    <div className={`font-bold ${new Date(item.application_deadline) < new Date() && item.application_deadline ? 'text-gray-500' : 'text-red-600'}`}>{item.application_deadline ? new Date(item.application_deadline).toLocaleDateString('en-CA') : 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-500 mb-1">適用對象</div>
                                                    <p className="text-gray-700">{item.target_audience}</p>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-500 mb-1">兼領限制</div>
                                                    {item.application_limitations === 'N' && <p className="font-bold text-green-600">{item.application_limitations}</p>}
                                                    {item.application_limitations === 'Y' && <p className="font-bold text-red-600">{item.application_limitations}</p>}
                                                    {item.application_limitations !== 'N' && item.application_limitations !== 'Y' && <p className="text-gray-700">{item.application_limitations || '無'}</p>}
                                                </div>
                                                <div className="pt-2">
                                                    <Button size="sm" onClick={() => handleOpenDetailModal(item)}>查看詳細內容</Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {announcements.length === 0 && !loading && (<div className="p-16 text-center text-gray-500">無符合條件的公告。</div>)}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-gray-600">共 {totalCount} 筆資料，第 {page} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30">
                            {[10, 25, 50].map(v => <option key={v} value={v}>{v} 筆 / 頁</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <ChevronsUpDown className="h-4 w-4" />
                        </div>
                    </div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button onClick={() => setPage(1)} disabled={page === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button>
                        <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                        <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button>
                    </nav>
                </div>
            </div>

            <AnnouncementDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} announcement={selectedAnnouncement} />
        </div>
    );
}

export default function AnnouncementList() {
    return (
        <Suspense fallback={
            <div className="w-full flex items-center justify-center py-24">
                <div className="h-12 w-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        }>
            <AnnouncementListContent />
        </Suspense>
    );
}
