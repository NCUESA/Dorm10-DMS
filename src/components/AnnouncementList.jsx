"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Search, X, ChevronsUpDown, ArrowUp, ArrowDown, Link as LinkIcon, Paperclip } from 'lucide-react';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Button from '@/components/ui/Button';

// --- Helper Functions ---
const categoryStyles = {
    A: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    B: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    C: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    D: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    E: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    default: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};
const getCategoryStyle = (cat) => categoryStyles[cat] || categoryStyles.default;

// 依申請截止日期計算所屬學期
const calculateSemester = (deadlineStr) => {
    if (!deadlineStr) return 'N/A';
    const deadline = new Date(deadlineStr);
    const year = deadline.getFullYear();
    const month = deadline.getMonth() + 1; // getMonth() 為 0 起算

    // 學年 = 西元年 - 1912 + floor(月份 / 7)
    const academicYear = year - 1912 + Math.floor(month / 7);
    // 8-1 月為上學期，2-7 月為下學期
    const semester = (month >= 8 || month === 1) ? 1 : 2;

    return `${academicYear}-${semester}`;
};

// --- Main Component ---
function AnnouncementListContent() {
    const searchParams = useSearchParams();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortLoading, setSortLoading] = useState(false); // 新增排序載入狀態
    const [filter, setFilter] = useState('open');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState({ column: 'application_deadline', ascending: true });

    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const announcementRefs = useRef({});

    const fetchAnnouncements = useCallback(async (isInitialLoad = false) => {
        // 如果不是初始載入，使用 sortLoading 來避免閃跳
        if (isInitialLoad) {
            setLoading(true);
        } else {
            setSortLoading(true);
        }
        
        let query = supabase
            .from('announcements')
            .select('*, attachments(*)', { count: 'exact' });

        if (search) {
            query = query.or(`title.ilike.%${search}%,target_audience.ilike.%${search}%,application_limitations.ilike.%${search}%`);
        }

        const today = new Date().toISOString().slice(0, 10);
        if (filter === 'open') {
            query = query.gte('application_deadline', today);
        } else if (filter === 'expired') {
            query = query.lt('application_deadline', today);
        }

        // 若以學期排序，實際以申請截止日期排序
        const orderColumn = sort.column === 'semester' ? 'application_deadline' : sort.column;
        query = query.order(orderColumn, { ascending: sort.ascending });

        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (!error) {
            const dataWithSemester = (data || []).map(item => ({
                ...item,
                semester: calculateSemester(item.application_deadline),
            }));
            setAnnouncements(dataWithSemester);
            setTotalCount(count || 0);
        } else {
            console.error("Error fetching announcements:", error);
        }
        
        if (isInitialLoad) {
            setLoading(false);
        } else {
            setSortLoading(false);
        }
    }, [search, filter, page, rowsPerPage, sort]);

    useEffect(() => {
        // 判斷是否為初始載入（沒有公告資料）
        const isInitialLoad = announcements.length === 0;
        fetchAnnouncements(isInitialLoad);
    }, [fetchAnnouncements]);

    useEffect(() => {
        const announcementId = searchParams.get('announcement_id');
        if (announcementId && announcements.length > 0) {
            const target = announcements.find(a => a.id === announcementId);
            if (target) {
                setSelectedAnnouncement(target);
                setTimeout(() => {
                    announcementRefs.current[announcementId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }, [searchParams, announcements]);

    const handleSort = (field) => {
        let newDirection = true; // ascending
        if (sort.column === field && sort.ascending === true) {
            newDirection = false; // descending
        }
        setSort({ column: field, ascending: newDirection });
        setPage(1);
        // 使用排序載入狀態，不是初始載入
        fetchAnnouncements(false);
    };

    const renderSortIcon = (column) => {
        if (sort.column !== column) return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />;
        return sort.ascending ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" />;
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">獎助學金代碼定義</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-slate-600">
                    <p><strong className="font-semibold text-red-600">A：</strong>各縣市政府獎助學金</p>
                    <p><strong className="font-semibold text-orange-600">B：</strong>縣市政府以外之各級公家機關及公營單位獎助學金</p>
                    <p><strong className="font-semibold text-blue-600">C：</strong>宗教及民間各項指定身分獎助學金</p>
                    <p><strong className="font-semibold text-emerald-600">D：</strong>各民間單位（經濟不利、學業優良等）</p>
                    <p><strong className="font-semibold text-green-600">E：</strong>獎學金得獎名單公告</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="搜尋公告標題、摘要…" value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <ButtonGroup>
                    <Button variant={filter === 'open' ? 'primary' : 'secondary'} onClick={() => {
                        setFilter('open');
                    }}>開放申請中</Button>
                    <Button variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => {
                        setFilter('all');
                    }}>全部</Button>
                    <Button variant={filter === 'expired' ? 'primary' : 'secondary'} onClick={() => {
                        setFilter('expired');
                    }}>已過期</Button>
                </ButtonGroup>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block relative">
                    {/* 排序時顯示覆蓋層，避免列表閃爍 */}
                    <div className={`absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center transition-opacity duration-300 ${sortLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex items-center gap-2 text-slate-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                            <span>排序中...</span>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('semester')}>
                                    <div className="flex items-center">學期 {renderSortIcon('semester')}</div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">獎助學金資料</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">適用對象</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">兼領限制</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('application_deadline')}>
                                    <div className="flex items-center">申請期限 / 送件方式 {renderSortIcon('application_deadline')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-gray-500">載入中...</td></tr>
                            ) : announcements.map(item => (
                                <tr key={item.id} ref={el => announcementRefs.current[item.id] = el} className="hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => setSelectedAnnouncement(item)}>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-800">{item.semester}</td>
                                    <td className="px-6 py-5 max-w-xs">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold ${getCategoryStyle(item.category).bg} ${getCategoryStyle(item.category).text}`}>{item.category}</span>
                                            <span className="font-semibold text-gray-900 truncate">{item.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-600 max-w-xs truncate">
                                        <span dangerouslySetInnerHTML={{ __html: item.target_audience }} />
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-600 max-w-xs truncate">{item.application_limitations}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                                        <div className="font-bold text-red-600">{item.application_deadline ? new Date(item.application_deadline).toLocaleDateString('en-CA') : '-'}</div>
                                        <div className="text-gray-500">{item.submission_method}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-gray-200 relative">
                    {/* 排序時顯示覆蓋層，避免列表閃爍 */}
                    <div className={`absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center transition-opacity duration-300 ${sortLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex items-center gap-2 text-slate-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                            <span>排序中...</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">載入中...</div>
                    ) : announcements.map(item => (
                        <div key={item.id} ref={el => announcementRefs.current[item.id] = el} className="p-4 hover:bg-indigo-50 cursor-pointer" onClick={() => setSelectedAnnouncement(item)}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-base text-gray-900 flex-1 pr-4">{item.title}</h3>
                                <div className="text-right flex-shrink-0">
                                    <div className="font-bold text-red-600">{item.application_deadline ? new Date(item.application_deadline).toLocaleDateString('en-CA') : '-'}</div>
                                    <div className="text-xs text-gray-500">{item.semester}</div>
                                </div>
                            </div>
                            <div className="text-sm space-y-2 text-gray-600">
                                <p><strong className="font-semibold text-gray-800">適用對象: </strong><span dangerouslySetInnerHTML={{ __html: item.target_audience }} /></p>
                                <p><strong className="font-semibold text-gray-800">兼領限制: </strong>{item.application_limitations}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {announcements.length === 0 && !loading && (
                    <div className="p-10 text-center text-gray-500">無符合條件的公告。</div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-gray-600">
                    共 {totalCount} 筆資料
                </div>
                <div className="flex items-center gap-4">
                    <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="p-2 border border-gray-300 rounded-md text-sm bg-white">
                        {[10, 25, 50].map(v => <option key={v} value={v}>{v} 筆 / 頁</option>)}
                    </select>
                    <ButtonGroup>
                        <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一頁</Button>
                        <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * rowsPerPage >= totalCount}>下一頁</Button>
                    </ButtonGroup>
                </div>
            </div>

            {selectedAnnouncement && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300" onClick={() => setSelectedAnnouncement(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b p-5 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold text-gray-800">{selectedAnnouncement.title}</h2>
                            <button onClick={() => setSelectedAnnouncement(null)} className="text-gray-400 hover:text-gray-800 transition-colors"><X /></button>
                        </div>
                        <div className="p-6 space-y-8 overflow-y-auto">
                            {selectedAnnouncement.summary && selectedAnnouncement.full_content && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-indigo-700 border-l-4 border-indigo-500 pl-3">公告摘要</h3>
                                    <p className="text-gray-700">{selectedAnnouncement.summary}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-indigo-700 border-l-4 border-indigo-500 pl-3">詳細內容</h3>
                                {/* 調試資訊 */}
                                {process.env.NODE_ENV === 'development' && (
                                    <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                                        <strong>Debug - full_content:</strong> {JSON.stringify(selectedAnnouncement.full_content)}<br/>
                                        <strong>Debug - summary type:</strong> {typeof selectedAnnouncement.summary}<br/>
                                        <strong>Debug - summary length:</strong> {selectedAnnouncement.summary?.length}<br/>
                                        <strong>Debug - summary first 100:</strong> {selectedAnnouncement.summary?.substring(0, 100)}
                                    </div>
                                )}
                                <div 
                                    className="prose max-w-none text-gray-700" 
                                    dangerouslySetInnerHTML={{ 
                                        __html: selectedAnnouncement.full_content || selectedAnnouncement.summary || '無詳細內容'
                                    }} 
                                />
                            </div>
                            {selectedAnnouncement.attachments?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-indigo-700 border-l-4 border-indigo-500 pl-3">相關附件</h3>
                                    <div className="space-y-2">
                                        {selectedAnnouncement.attachments.map(att => (
                                            <a key={att.id} href={att.public_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 p-3 rounded-lg text-blue-800 font-medium transition-colors">
                                                <Paperclip className="h-5 w-5 flex-shrink-0" />
                                                <span className="truncate">{att.file_name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedAnnouncement.external_urls && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-indigo-700 border-l-4 border-indigo-500 pl-3">外部連結</h3>
                                    <a href={selectedAnnouncement.external_urls} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline">
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{selectedAnnouncement.external_urls}</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
