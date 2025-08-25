'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronsUpDown, ArrowDown, ArrowUp, Link as LinkIcon, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Edit, Trash2, Download, ChevronDown, Eye } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import CreateAnnouncementModal from '@/components/CreateAnnouncementModal';
import UpdateAnnouncementModal from '@/components/UpdateAnnouncementModal';
import DeleteAnnouncementModal from '@/components/DeleteAnnouncementModal';
import AnnouncementPreviewModal from '@/components/AnnouncementPreviewModal';
import Toast from '@/components/ui/Toast';
import DownloadPDFButton from './DownloadPDFButton';

// Gmail Icon Component
const GmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 50 50" className="inline-block">
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343,3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
    </svg>
);

// Helper for Email Notification
const sendEmailAnnouncement = async (id, showToast) => {
    try {
        showToast('正在透過 Email 發送預覽...', 'info');
        const res = await authFetch('/api/send-announcement', { method: 'POST', body: JSON.stringify({ announcementId: id }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Email 寄送失敗');
        showToast(data.message || '預覽郵件已成功寄送！', 'success');
    } catch (err) { 
        showToast(err.message || 'Email 寄送失敗，請稍後再試', 'error'); 
    }
};

// New Status Calculation Function
const getStatus = (announcement) => {
    const { is_active, removed_at } = announcement;
    if (!is_active) {
        return { text: '草稿', color: 'bg-gray-100 text-gray-800' };
    }
    const now = new Date();
    const endDate = removed_at ? new Date(removed_at) : null;
    now.setHours(23, 59, 59, 999);
    if (endDate && now > endDate) {
        return { text: '下架', color: 'bg-red-100 text-red-800' };
    }
    return { text: '上架', color: 'bg-green-100 text-green-800' };
};


export default function AnnouncementsTab() {
    const [allAnnouncements, setAllAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [preview, setPreview] = useState({ open: false, announcement: null });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState({ column: 'created_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedId, setExpandedId] = useState(null);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/announcements?admin=true');
            const result = await res.json();
            if (res.ok && result.success) {
                setAllAnnouncements(Array.isArray(result.announcements) ? result.announcements : []);
            } else {
                showToast(result.error || '無法載入公告列表', 'error');
            }
        } catch (error) {
            showToast('載入公告時發生網路錯誤', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

    const processedAnnouncements = useMemo(() => {
        let filtered = [...allAnnouncements];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(ann => 
                ann.title.toLowerCase().includes(lowercasedTerm) || 
                (ann.summary && ann.summary.toLowerCase().includes(lowercasedTerm))
            );
        }
        if (sort.column) {
            filtered.sort((a, b) => {
                const aValue = a[sort.column]; 
                const bValue = b[sort.column];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [allAnnouncements, searchTerm, sort]);

    const paginatedAnnouncements = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return processedAnnouncements.slice(startIndex, startIndex + rowsPerPage);
    }, [processedAnnouncements, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(processedAnnouncements.length / rowsPerPage);

    const handleSort = (column) => {
        setSort(prev => ({ 
            column, 
            direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc' 
        }));
        setCurrentPage(1);
    };

    const renderSortIcon = (column) => {
        if (sort.column !== column) return <ChevronsUpDown className="h-4 w-4" />;
        return sort.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-indigo-600" /> : <ArrowDown className="h-4 w-4 text-indigo-600" />;
    };
    
    const handleCopyLink = async (announcementId) => {
        const siteUrl = window.location.origin;
        const link = `${siteUrl}?announcement_id=${announcementId}`;
        try {
            await navigator.clipboard.writeText(link);
            showToast('公告的公開連結已成功複製！', 'success');
        } catch (err) {
            showToast('複製連結失敗', 'error');
        }
    };
    
    const ghostButtonBase = "flex items-center justify-center gap-1.5 rounded-lg border transition-all duration-300 ease-in-out transform disabled:transform-none disabled:shadow-none";
    const buttonStyles = {
        add: `${ghostButtonBase} px-4 py-2 text-sm font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40`,
        edit: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-indigo-200 bg-transparent text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20`,
        delete: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-rose-200 bg-transparent text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/20`,
        send: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-sky-200 bg-transparent text-sky-600 hover:bg-sky-100 hover:text-sky-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20`,
        link: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-amber-200 bg-transparent text-amber-600 hover:bg-amber-100 hover:text-amber-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20`,
        download: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-stone-300 bg-transparent text-stone-700 hover:bg-stone-200 hover:text-stone-800 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-stone-500/20`,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="搜尋標題、摘要..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-4 h-11 bg-white border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className={`${buttonStyles.add} w-full sm:w-auto`}>
                    <Plus size={18} /> <span className="whitespace-nowrap">新增公告</span>
                </button>
            </div>

            <div className="rounded-lg w-full bg-white shadow-md overflow-hidden border border-gray-200/60">
                {/* --- DESKTOP TABLE VIEW --- */}
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/70 text-left">
                            <tr>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[40%]">標題</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[10%] text-center">狀態</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[15%] cursor-pointer" onClick={() => handleSort('views')}><div className="flex items-center justify-center gap-1">點閱數 {renderSortIcon('views')}</div></th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[12.5%] cursor-pointer" onClick={() => handleSort('created_at')}><div className="flex items-center gap-1">發布日期 {renderSortIcon('created_at')}</div></th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[12.5%] cursor-pointer" onClick={() => handleSort('removed_at')}><div className="flex items-center gap-1">截止日期 {renderSortIcon('removed_at')}</div></th>
                                <th className="p-4 px-6 font-semibold text-gray-500 text-center w-[20%]">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-12 text-gray-500"><div className="flex justify-center items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div> 載入中...</div></td></tr>
                            ) : paginatedAnnouncements.map((ann) => {
                                const status = getStatus(ann);
                                return (
                                    <tr key={ann.id} className="transform transition-all duration-300 hover:bg-violet-100/60 hover:shadow-lg z-0 hover:z-10 hover:scale-[1.02]">
                                        <td className="p-3 px-6 font-medium text-gray-800 break-words">{ann.title}</td>
                                        <td className="p-3 px-6 text-center"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span></td>
                                        <td className="p-3 px-6 text-gray-600 text-center">{ann.views}</td>
                                        <td className="p-3 px-6 text-gray-600">{new Date(ann.created_at).toLocaleDateString('en-CA')}</td>
                                        <td className="p-3 px-6 text-gray-600">{ann.removed_at ? new Date(ann.removed_at).toLocaleDateString('en-CA') : '無'}</td>
                                        <td className="p-3 px-6">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => setEditingAnnouncement(ann)} className={buttonStyles.edit}><Edit size={14} /><span className="whitespace-nowrap">編輯</span></button>
                                                <button onClick={() => setDeletingId(ann.id)} className={buttonStyles.delete}><Trash2 size={14} /><span className="whitespace-nowrap">刪除</span></button>
                                                <button onClick={() => handleCopyLink(ann.id)} className={buttonStyles.link}><LinkIcon size={14} /><span className="whitespace-nowrap">連結</span></button>
                                                <DownloadPDFButton announcement={ann} className={buttonStyles.download}><Download size={14} /></DownloadPDFButton>
                                                <button onClick={() => setPreview({ open: true, announcement: ann })} className={buttonStyles.send}><GmailIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- MOBILE VIEW --- */}
                <div className="md:hidden flex flex-col">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500">載入中...</div>
                    ) : paginatedAnnouncements.map(ann => {
                        const status = getStatus(ann);
                        const isExpanded = expandedId === ann.id;
                        return (
                            <div key={ann.id} className="border-b border-gray-100 last:border-b-0">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                                    className="w-full flex items-center justify-between text-left p-4 hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="flex-1 pr-4">
                                        <h3 className="font-bold text-base text-gray-900">{ann.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-x-3 flex-shrink-0">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.color}`}>
                                            {status.text}
                                        </span>
                                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-gray-50/70 p-4 flex justify-between items-center">
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <span>點閱數:</span>
                                                    <span className="font-medium text-gray-800">{ann.views}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    <button onClick={() => setEditingAnnouncement(ann)} className={buttonStyles.edit} title="編輯"><Edit size={14} /></button>
                                                    <button onClick={() => setDeletingId(ann.id)} className={buttonStyles.delete} title="刪除"><Trash2 size={14} /></button>
                                                    <button onClick={() => handleCopyLink(ann.id)} className={buttonStyles.link} title="複製連結"><LinkIcon size={14} /></button>
                                                    <DownloadPDFButton announcement={ann} className={buttonStyles.download} title="下載PDF"><Download size={14} /></DownloadPDFButton>
                                                    <button onClick={() => setPreview({ open: true, announcement: ann })} className={buttonStyles.send} title="Email 預覽"><GmailIcon /></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">共 {processedAnnouncements.length} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:border-indigo-500">
                            {[10, 25, 50].map(v => <option key={v} value={v}>{v} 筆/頁</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><ChevronsUpDown className="h-4 w-4" /></div>
                    </div>
                    <nav className="flex items-center space-x-1">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button>
                    </nav>
                </div>
            </div>
            
            <CreateAnnouncementModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} refreshAnnouncements={fetchAnnouncements} />
            <UpdateAnnouncementModal isOpen={!!editingAnnouncement} onClose={() => setEditingAnnouncement(null)} announcement={editingAnnouncement} refreshAnnouncements={fetchAnnouncements} />
            <DeleteAnnouncementModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} announcementId={deletingId} refreshAnnouncements={fetchAnnouncements} />
            <AnnouncementPreviewModal
                isOpen={preview.open}
                type="email"
                announcement={preview.announcement}
                onConfirm={() => {
                    sendEmailAnnouncement(preview.announcement.id, showToast);
                    setPreview({ open: false, announcement: null });
                }}
                onClose={() => setPreview({ open: false, announcement: null })}
            />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}