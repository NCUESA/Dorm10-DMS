'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { Search, Users, Shield, UserCheck, Edit, X, Save, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Loader2, Send } from 'lucide-react';

// --- New Send Notification Modal Component ---
const SendNotificationModal = ({ isOpen, onClose, user, showToast }) => {
    const [emailData, setEmailData] = useState({ subject: '', body: '' });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setEmailData({
                subject: `來自 NCUE 獎學金平台的通知`,
                body: `<p>親愛的 ${user.name || '使用者'} 同學，您好：</p><p><br></p><p>...</p><p><br></p><p>敬上</p><p>彰師大生輔組 敬啟</p>`
            });
        }
    }, [isOpen, user]);

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
            const response = await authFetch('/api/send-custom-email', {
                method: 'POST',
                body: JSON.stringify({
                    email: user.emailFull,
                    subject: emailData.subject,
                    htmlContent: emailData.body
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

    const emailPreviewHtml = `
    <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎓 NCUE 獎學金平台通知</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                ${emailData.subject || '(預覽標題)'}
            </h2>
            <div class="prose max-w-none">
                ${emailData.body || '<p>(預覽內文)</p>'}
            </div>
        </div>
    </div>
    `;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">寄送通知給 {user?.name}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                            {/* Edit Area */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">標題</label>
                                    <input type="text" name="subject" value={emailData.subject} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">內文 (支援 HTML)</label>
                                    <textarea name="body" value={emailData.body} onChange={handleChange} rows="15" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 font-mono text-sm"></textarea>
                                </div>
                            </div>
                            {/* Preview Area */}
                            <div className="bg-slate-100 rounded-lg p-4 border overflow-y-auto">
                                <div dangerouslySetInnerHTML={{ __html: emailPreviewHtml }} />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/80 border-t flex justify-end space-x-3 rounded-b-xl flex-shrink-0">
                            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
                            <Button type="button" onClick={handleSend} disabled={isSending} leftIcon={isSending ? <Loader2 className="animate-spin" /> : <Send size={16} />}>
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
    const { user: currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationUser, setNotificationUser] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/users');
            const data = await response.json();
            if (response.ok) setAllUsers(data.users);
            else showToast(data.error || '獲取用戶資料失敗', 'error');
        } catch (error) { showToast('獲取用戶資料失敗', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = async (userToUpdate) => {
        if (currentUser && userToUpdate.id === currentUser.id) {
            showToast('無法變更自己的權限', 'error');
            return;
        }

        const newRole = userToUpdate.role === '管理員' ? '一般使用者' : '管理員';
        if (!confirm(`確定要將使用者 ${userToUpdate.name} 的權限變更為「${newRole}」嗎？`)) return;

        try {
            const response = await authFetch(`/api/users/${userToUpdate.id}`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole }),
            });
            const data = await response.json();
            if (response.ok) {
                fetchUsers(); // Refresh data on success
                showToast('使用者權限更新成功', 'success');
            } else { showToast(data.error || '更新失敗', 'error'); }
        } catch (error) { showToast('更新時發生錯誤', 'error'); }
    };

    const openNotificationModal = (user) => {
        setNotificationUser(user);
        setIsNotificationModalOpen(true);
    };

    const processedUsers = useMemo(() => {
    // ** CRITICAL FIX: Ensure `allUsers` is an array before spreading it. **
    // If `allUsers` is null or undefined, it will default to an empty array.
    let filtered = [...(allUsers || [])]; 

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
            (user.name?.toLowerCase() || '').includes(lowercasedTerm) ||
            (user.studentId?.toLowerCase() || '').includes(lowercasedTerm) ||
            (user.email?.toLowerCase() || '').includes(lowercasedTerm)
        );
    }
    
    // ... sorting logic ...
    
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

    const ghostButtonBase = "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-300 ease-in-out transform disabled:transform-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
    const buttonStyles = {
        promote: `${ghostButtonBase} border-rose-200 bg-transparent text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/20`,
        demote: `${ghostButtonBase} border-green-200 bg-transparent text-green-600 hover:bg-green-100 hover:text-green-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20`,
        notify: `${ghostButtonBase} border-indigo-200 bg-transparent text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20`,
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-center">
                <div className="lg:col-span-3 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="搜尋姓名、學號、信箱..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow shadow-sm" />
                </div>
                <div className="lg:col-span-2 grid grid-cols-3 gap-4 text-center bg-white p-3 rounded-xl border border-gray-200/80">
                    <div><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><Users size={14} />總用戶數</h3><p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p></div>
                    <div className="border-l border-gray-200"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><Shield size={14} />管理員</h3><p className="text-2xl font-bold text-blue-600 mt-1">{stats.admins}</p></div>
                    <div className="border-l border-gray-200"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><UserCheck size={14} />一般使用者</h3><p className="text-2xl font-bold text-gray-600 mt-1">{stats.users}</p></div>
                </div>
            </div>

            <div className="rounded-xl w-full bg-white shadow-lg overflow-hidden border border-gray-200/80">
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/70 text-left"><tr>
                            <th className="p-4 px-6 font-semibold text-gray-500">學號</th><th className="p-4 px-6 font-semibold text-gray-500">姓名</th><th className="p-4 px-6 font-semibold text-gray-500">電子信箱</th><th className="p-4 px-6 font-semibold text-gray-500">權限</th><th className="p-4 px-6 font-semibold text-gray-500 text-center">操作</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (<tr><td colSpan="5" className="text-center p-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>) : paginatedUsers.length === 0 ? (<tr><td colSpan="5" className="text-center p-12 text-gray-500">找不到符合條件的使用者。</td></tr>) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="transform transition-all duration-300 hover:bg-violet-100/50 hover:shadow-xl z-0 hover:z-10 hover:scale-[1.02]">
                                        <td className="p-4 px-6 font-mono">{user.studentId || '-'}</td><td className="p-4 px-6 font-medium text-gray-800">{user.name || '-'}</td><td className="p-4 px-6 text-gray-600" title={user.emailFull}>{user.email}</td><td className="p-4 px-6"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === '管理員' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role}</span></td>
                                        <td className="p-4 px-6"><div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleRoleChange(user)} className={user.role === '管理員' ? buttonStyles.demote : buttonStyles.promote} disabled={currentUser && user.id === currentUser.id}>{user.role === '管理員' ? '設為使用者' : '設為管理員'}</button>
                                            <button onClick={() => openNotificationModal(user)} className={buttonStyles.notify}>寄送通知</button>
                                        </div></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (<div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>) : paginatedUsers.length === 0 ? (<div className="text-center p-8 text-gray-500">找不到符合條件的使用者。</div>) : (
                        paginatedUsers.map(user => (
                            <div key={user.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start"><h3 className="font-bold text-base text-gray-900 flex-1 pr-4">{user.name || '-'}</h3><span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${user.role === '管理員' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role}</span></div>
                                <div className="text-sm space-y-2 text-gray-600 border-t pt-3"><p><strong className="font-semibold text-gray-800">學號: </strong>{user.studentId || '-'}</p><p><strong className="font-semibold text-gray-800">信箱: </strong>{user.email}</p></div>
                                <div className="flex items-center justify-end border-t pt-3 gap-2"><button onClick={() => handleRoleChange(user)} className={user.role === '管理員' ? buttonStyles.demote : buttonStyles.promote} disabled={currentUser && user.id === currentUser.id}>{user.role === '管理員' ? '設為使用者' : '設為管理員'}</button><button onClick={() => openNotificationModal(user)} className={buttonStyles.notify}>寄送通知</button></div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">共 {processedUsers.length} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                    <div className="relative"><select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-9 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"><option value={10}>10 筆 / 頁</option><option value={25}>25 筆 / 頁</option><option value={50}>50 筆 / 頁</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div></div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm"><button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button><button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button><button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button><button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button></nav>
                </div>
            </div>

            <SendNotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} user={notificationUser} showToast={showToast} />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}