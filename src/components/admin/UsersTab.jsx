'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { Search, Users, Shield, UserCheck, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Loader2, Ban, Mail, ChevronsUpDown, UserX, UserPlus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SendNotificationModal from './SendNotificationModal';
// import AddDemeritModal from './AddDemeritModal';
// import ViewDemeritsModal from './ViewDemeritsModal';
import ManageDemeritsModal from './ManageDemeritsModal';

// Gmail Icon Component for consistency
const GmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 50 50" className="inline-block">
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343,3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
    </svg>
);

export default function UsersTab() {
    const { user: currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedId, setExpandedId] = useState(null);

    // Modal States
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationUser, setNotificationUser] = useState(null);
    const [isSending, setIsSending] = useState(false);

    const [demeritUser, setDemeritUser] = useState(null); // The user being managed
    const [isDemeritModalOpen, setIsDemeritModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/users');
            const data = await response.json();
            if (response.ok && data.success) {
                setAllUsers(Array.isArray(data.users) ? data.users : []);
            } else {
                showToast(data.error || '獲取用戶資料失敗', 'error');
                setAllUsers([]);
            }
        } catch (error) {
            showToast('獲取用戶資料時發生錯誤', 'error');
            setAllUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = async (userToUpdate) => {
        if (currentUser && userToUpdate.id === currentUser.id) {
            showToast('無法變更自己的權限', 'error');
            return;
        }
        const newRole = userToUpdate.role === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`確定要將使用者 ${userToUpdate.name} 的權限變更為「${newRole}」嗎？`)) return;

        try {
            const response = await authFetch(`/api/users/${userToUpdate.id}`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showToast('使用者權限更新成功', 'success');
                fetchUsers();
            } else {
                showToast(data.error || '更新失敗', 'error');
            }
        } catch (error) {
            showToast('更新時發生錯誤', 'error');
        }
    };

    const openNotificationModal = (user) => {
        setNotificationUser(user);
        setIsNotificationModalOpen(true);
    };

    const openDemeritModal = (user) => {
        setDemeritUser(user);
        setIsDemeritModalOpen(true);
    };

    const handleAddDemerit = async ({ reason, points }) => {
        if (!demeritUser) return;
        setIsSubmitting(true);
        try {
            const response = await authFetch('/api/demerits', {
                method: 'POST',
                body: JSON.stringify({ userId: demeritUser.id, reason, points })
            });
            const data = await response.json();
            if (response.ok) {
                showToast('違規記點新增成功', 'success');
                await fetchUsers(); // 刷新資料
            } else {
                showToast(data.error || '新增失敗', 'error');
            }
        } catch (error) {
            showToast('新增違規記點時發生錯誤', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveDemerit = async (recordId) => {
        if (!window.confirm('您確定要撤銷此筆違規記錄嗎？此操作無法復原。')) return;

        setIsSubmitting(true);
        try {
            const response = await authFetch('/api/demerits', {
                method: 'PATCH',
                body: JSON.stringify({ recordId })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showToast('違規記錄已成功撤銷', 'success');

                // 為了即時反應，手動更新前端狀態
                const updatedUsers = allUsers.map(u => {
                    if (u.id === demeritUser.id) {
                        const newRecords = u.demeritRecords.filter(r => r.record_id !== recordId);
                        const newTotalPoints = newRecords.reduce((sum, r) => sum + r.points, 0);
                        return { ...u, demeritRecords: newRecords, demerit: newTotalPoints };
                    }
                    return u;
                });
                setAllUsers(updatedUsers);
                setDemeritUser(prev => {
                    const newRecords = prev.demeritRecords.filter(r => r.record_id !== recordId);
                    const newTotalPoints = newRecords.reduce((sum, r) => sum + r.points, 0);
                    return { ...prev, demeritRecords: newRecords, demerit: newTotalPoints };
                });

            } else {
                showToast(data.error || '撤銷失敗', 'error');
            }
        } catch (error) {
            showToast('撤銷時發生錯誤', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendNotification = async ({ subject, htmlContent }) => {
        if (!notificationUser) return;
        setIsSending(true);
        try {
            const response = await authFetch('/api/send-custom-email', {
                method: 'POST',
                body: JSON.stringify({ email: notificationUser.emailFull, subject, body: htmlContent }),
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.message || '通知已成功寄送！', 'success');
                setIsNotificationModalOpen(false);
            } else {
                showToast(data.error || '寄送失敗', 'error');
            }
        } catch (error) {
            showToast('寄送時發生網路錯誤', 'error');
        } finally {
            setIsSending(false);
        }
    };



    const processedUsers = useMemo(() => {
        if (!Array.isArray(allUsers)) return [];
        let filtered = [...allUsers];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                (user.name?.toLowerCase() || '').includes(lowercasedTerm) ||
                (user.studentId?.toLowerCase() || '').includes(lowercasedTerm) ||
                (user.emailFull?.toLowerCase() || '').includes(lowercasedTerm) ||
                (user.room?.toLowerCase() || '').includes(lowercasedTerm)
            );
        }
        return filtered.sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0));
    }, [allUsers, searchTerm]);

    const paginatedUsers = useMemo(() => {
        return processedUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    }, [processedUsers, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(processedUsers.length / rowsPerPage);

    const stats = useMemo(() => ({
        total: allUsers.length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        users: allUsers.filter(u => u.role !== 'admin').length,
    }), [allUsers]);

    const ghostButtonBase = "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed";
    const buttonStyles = {
        demote: `${ghostButtonBase} border-rose-200 bg-transparent text-rose-600 hover:bg-rose-100`,
        promote: `${ghostButtonBase} border-indigo-200 bg-transparent text-indigo-600 hover:bg-indigo-100`,
        notify: `${ghostButtonBase} p-2 border-sky-300 bg-white text-sky-600 hover:bg-sky-50`,
        demerit: `${ghostButtonBase} p-2 border-orange-300 bg-white text-orange-600 hover:bg-orange-50`
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-center">
                <div className="lg:col-span-3 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="搜尋姓名、學號、房號..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-4 h-11 bg-white border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="lg:col-span-2 w-full grid grid-cols-3 gap-4 text-center bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm">
                    <div><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><Users size={14} />總用戶</h3><p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p></div>
                    <div className="border-l border-gray-200"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><Shield size={14} />管理員</h3><p className="text-2xl font-bold text-blue-600 mt-1">{stats.admins}</p></div>
                    <div className="border-l border-gray-200"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><UserCheck size={14} />使用者</h3><p className="text-2xl font-bold text-gray-600 mt-1">{stats.users}</p></div>
                </div>
            </div>

            <div className="rounded-lg w-full bg-white shadow-md overflow-hidden border border-gray-200/60">
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/70 text-left"><tr>
                            <th className="p-4 px-6 font-semibold text-gray-500 w-[12%]">房號</th>
                            <th className="p-4 px-6 font-semibold text-gray-500 w-[15%]">學號</th>
                            <th className="p-4 px-6 font-semibold text-gray-500 w-[15%]">姓名</th>
                            <th className="p-4 px-6 font-semibold text-gray-500 w-[23%]">電子信箱</th>
                            <th className="p-4 px-6 font-semibold text-gray-500 w-[10%] text-center">違規</th>
                            <th className="p-4 px-6 font-semibold text-gray-500 w-[10%] text-center">權限</th>
                            <th className="p-4 px-6 font-semibold text-gray-500 text-center w-[15%]">操作</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (<tr><td colSpan="7" className="text-center p-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>) : paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-violet-50/50">
                                    <td className="p-4 px-6 font-mono text-gray-600">{user.room}</td>
                                    <td className="p-4 px-6 font-mono text-gray-600">{user.studentId || '-'}</td>
                                    <td className="p-4 px-6 font-medium text-gray-800">{user.name || '-'}</td>
                                    <td className="p-4 px-6 text-gray-600 truncate" title={user.emailFull}>{user.email}</td>
                                    <td className="p-4 px-6 text-center">
                                        <button onClick={() => openViewDemeritsModal(user)} className="font-medium text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline" disabled={!user.demerit || user.demerit === 0}>{user.demerit}</button>
                                    </td>
                                    <td className="p-4 px-6 text-center"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role === 'admin' ? '管理員' : '使用者'}</span></td>
                                    <td className="p-4 px-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleRoleChange(user)} className={user.role === 'admin' ? buttonStyles.demote : buttonStyles.promote} disabled={currentUser?.id === user.id} title={user.role === 'admin' ? '設為使用者' : '設為管理員'}>
                                                {user.role === 'admin' ? <UserX size={14} /> : <UserPlus size={14} />}
                                            </button>
                                            <button onClick={() => openNotificationModal(user)} className={buttonStyles.notify} title="寄送通知"><GmailIcon /></button>
                                            <button onClick={() => openDemeritModal(user)} className={buttonStyles.demerit} title="新增違規記點"><Ban size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (<div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>) : paginatedUsers.map(user => (
                        <div key={user.id} className="p-4">
                            <div className="flex justify-between items-start" onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}>
                                <div>
                                    <h3 className="font-bold text-base text-gray-900">{user.name || '-'}</h3>
                                    <p className="text-sm text-gray-500 font-mono mt-1">{user.studentId || '-'}</p>
                                </div>
                                <div className="flex items-center gap-x-3 flex-shrink-0">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role === 'admin' ? '管理員' : '使用者'}</span>
                                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedId === user.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            <AnimatePresence>
                                {expandedId === user.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="text-sm space-y-2 text-gray-600 border-t pt-3 mt-3">
                                            <p><strong className="font-semibold text-gray-700 w-16 inline-block">房號:</strong> {user.room}</p>
                                            <p><strong className="font-semibold text-gray-700 w-16 inline-block">信箱:</strong> <span className="truncate">{user.email}</span></p>
                                            <p><strong className="font-semibold text-gray-700 w-16 inline-block">違規:</strong>
                                                <button onClick={() => openViewDemeritsModal(user)} className="font-medium text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline ml-1" disabled={!user.demerit || user.demerit === 0}>{user.demerit} 點</button>
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-end border-t pt-3 mt-3 gap-2">
                                            <button onClick={() => handleRoleChange(user)} className={user.role === 'admin' ? buttonStyles.demote : buttonStyles.promote} disabled={currentUser?.id === user.id} title={user.role === 'admin' ? '降級為使用者' : '升級為管理員'}>
                                                {user.role === 'admin' ? <UserX size={14} /> : <UserPlus size={14} />}
                                            </button>
                                            <button onClick={() => openNotificationModal(user)} className={buttonStyles.notify} title="寄送通知"><GmailIcon /></button>
                                            <button onClick={() => openDemeritModal(user)} className={buttonStyles.demerit} title="新增違規記點"><Ban size={14} /></button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">共 {processedUsers.length} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
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

            <SendNotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} user={notificationUser} onConfirm={handleSendNotification} isSending={isSending} />
            <ManageDemeritsModal 
                isOpen={isDemeritModalOpen}
                onClose={() => setIsDemeritModalOpen(false)}
                user={demeritUser}
                onAddDemerit={handleAddDemerit}
                onRemoveDemerit={handleRemoveDemerit}
                isSubmitting={isSubmitting}
            />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}