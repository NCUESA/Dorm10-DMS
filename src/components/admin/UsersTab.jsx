'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { Search, Users, Shield, UserCheck, Edit, X, Save, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Loader2, Send } from 'lucide-react';

// --- New Send Notification Modal Component ---
const SendNotificationModal = ({ isOpen, onClose, user, showToast }) => {
    const [emailData, setEmailData] = useState({ subject: '', body: '' });
    const [isSending, setIsSending] = useState(false);
  
    useEffect(() => {
        if (isOpen) {
            setEmailData({ subject: '', body: '' }); // Reset form on open
        }
    }, [isOpen]);
  
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmailData(prev => ({ ...prev, [name]: value }));
    };
  
    const handleSend = async () => {
        if (!emailData.subject || !emailData.body) {
            showToast('標題和內文為必填欄位', 'error');
            return;
        }
        setIsSending(true);
        try {
            // This assumes you have a new API endpoint for sending custom emails
            const response = await authFetch('/api/send-custom-email', {
                method: 'POST',
                body: JSON.stringify({
                    email: user.emailFull,
                    subject: emailData.subject,
                    body: emailData.body
                }),
            });
            const data = await response.json();
            if (response.ok) {
                showToast('通知已成功寄送！', 'success');
                onClose();
            } else {
                showToast(data.error || '寄送失敗', 'error');
            }
        } catch (error) {
            showToast('寄送時發生錯誤', 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b flex justify-between items-center"><h2 className="text-lg font-bold text-gray-800">寄送通知給 {user?.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full"><X size={20} /></button></div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                            {/* Edit Area */}
                            <div className="space-y-4">
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1">標題</label><input type="text" name="subject" value={emailData.subject} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"/></div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1">內文 (支援 HTML)</label><textarea name="body" value={emailData.body} onChange={handleChange} rows="10" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 font-mono text-sm"></textarea></div>
                            </div>
                            {/* Preview Area */}
                            <div className="bg-gray-50 rounded-lg p-4 border space-y-4">
                                <h3 className="font-bold text-gray-800">{emailData.subject || '(預覽標題)'}</h3>
                                <div className="border-t pt-4 text-gray-700 text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: emailData.body || '<p>(預覽內文)</p>' }} />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/80 border-t flex justify-end space-x-3 rounded-b-xl">
                            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
                            <Button type="button" onClick={handleSend} disabled={isSending} leftIcon={isSending ? <Loader2 className="animate-spin" /> : <Send size={16}/>}>
                                {isSending ? '寄送中...' : '確認寄送'}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- Main UsersTab Component ---
export default function UsersTab() {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    // State for the new notification modal
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationUser, setNotificationUser] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/users');
            const data = await response.json();
            if (response.ok) {
                setAllUsers(data.users);
            } else {
                showToast(data.error || '獲取用戶資料失敗', 'error');
            }
        } catch (error) {
            showToast('獲取用戶資料失敗', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userToUpdate) => {
        const newRole = userToUpdate.role === '管理員' ? '一般使用者' : '管理員';
        if (!confirm(`確定要將使用者 ${userToUpdate.name} 的權限變更為「${newRole}」嗎？`)) {
            return;
        }

        try {
            const response = await authFetch(`/api/users/${userToUpdate.id}`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole }),
            });
            const data = await response.json();
            if (response.ok) {
                fetchUsers(); // Refresh data on success
                showToast('使用者權限更新成功', 'success');
            } else {
                showToast(data.error || '更新失敗', 'error');
            }
        } catch (error) {
            showToast('更新時發生錯誤', 'error');
        }
    };
    
    // Function to open the notification modal
    const openNotificationModal = (user) => {
        setNotificationUser(user);
        setIsNotificationModalOpen(true);
    };

    // Client-side Filtering and Pagination
    const processedUsers = useMemo(() => {
        let filtered = [...allUsers];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                (user.name?.toLowerCase() || '').includes(lowercasedTerm) ||
                (user.studentId?.toLowerCase() || '').includes(lowercasedTerm) ||
                (user.email?.toLowerCase() || '').includes(lowercasedTerm)
            );
        }
        return filtered;
    }, [allUsers, searchTerm]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return processedUsers.slice(startIndex, startIndex + rowsPerPage);
    }, [processedUsers, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(processedUsers.length / rowsPerPage);

    const stats = useMemo(() => ({
        total: allUsers.length,
        admins: allUsers.filter(u => u.role === '管理員').length,
        users: allUsers.filter(u => u.role === '一般使用者').length,
    }), [allUsers]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white p-4 rounded-xl border">
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="搜尋姓名、學號、信箱..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border">
                    <div className="text-center"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1"><Users size={14}/>總用戶數</h3><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
                    <div className="text-center"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1"><Shield size={14}/>管理員</h3><p className="text-2xl font-bold text-blue-600">{stats.admins}</p></div>
                    <div className="text-center"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1"><UserCheck size={14}/>一般使用者</h3><p className="text-2xl font-bold text-gray-600">{stats.users}</p></div>
                </div>
            </div>

            <div className="rounded-xl w-full bg-white shadow-lg overflow-hidden border border-gray-200/80">
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/70 text-left">
                            <tr>
                                <th className="p-4 px-6 font-semibold text-gray-500">學號</th>
                                <th className="p-4 px-6 font-semibold text-gray-500">姓名</th>
                                <th className="p-4 px-6 font-semibold text-gray-500">電子信箱</th>
                                <th className="p-4 px-6 font-semibold text-gray-500">權限</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-12"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></td></tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-12 text-gray-500">找不到符合條件的使用者。</td></tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="transform transition-all duration-300 hover:bg-indigo-50/50 hover:shadow-md z-0 hover:z-10 hover:scale-[1.01]">
                                        <td className="p-4 px-6 font-mono">{user.studentId || '-'}</td>
                                        <td className="p-4 px-6 font-medium text-gray-800">{user.name || '-'}</td>
                                        <td className="p-4 px-6 text-gray-600" title={user.emailFull}>{user.email}</td>
                                        <td className="p-4 px-6">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === '管理員' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role}</span>
                                        </td>
                                        <td className="p-4 px-6">
                                            <div className="flex items-center justify-center gap-4">
                                                <Button variant="outline" size="sm" onClick={() => handleRoleChange(user)}>
                                                    {user.role === '管理員' ? '設為使用者' : '設為管理員'}
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => openNotificationModal(user)}>
                                                    寄送通知
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-gray-100">
                     {loading ? (
                        <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
                     ) : paginatedUsers.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">找不到符合條件的使用者。</div>
                     ) : (
                         paginatedUsers.map(user => (
                             <div key={user.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-base text-gray-900 flex-1 pr-4">{user.name || '-'}</h3>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${user.role === '管理員' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role}</span>
                                </div>
                                <div className="text-sm space-y-2 text-gray-600 border-t pt-3">
                                    <p><strong className="font-semibold text-gray-800">學號: </strong>{user.studentId || '-'}</p>
                                    <p><strong className="font-semibold text-gray-800">信箱: </strong>{user.email}</p>
                                </div>
                                <div className="flex items-center justify-end border-t pt-3 gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleRoleChange(user)}>{user.role === '管理員' ? '設為使用者' : '設為管理員'}</Button>
                                    <Button variant="outline" size="sm" onClick={() => openNotificationModal(user)}>寄送通知</Button>
                                </div>
                            </div>
                         ))
                     )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">共 {processedUsers.length} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                     <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm bg-white shadow-sm">
                        <option value={10}>10 筆 / 頁</option>
                        <option value={25}>25 筆 / 頁</option>
                        <option value={50}>50 筆 / 頁</option>
                    </select>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button>
                    </nav>
                </div>
            </div>

            <SendNotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} user={notificationUser} showToast={showToast} />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}