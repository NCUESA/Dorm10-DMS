'use client';

import { useState, useEffect } from 'react';
import EditUserModal from './EditUserModal';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // 獲取用戶資料
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
      } else {
        showToast(data.error || '獲取用戶資料失敗', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('獲取用戶資料失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveUser = async (updatedUser) => {
    try {
      const response = await authFetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: updatedUser.role,
          username: updatedUser.name,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(prev => prev.map(u => (u.id === updatedUser.id ? data.user : u)));
        showToast('用戶資料更新成功', 'success');
      } else {
        showToast(data.error || '更新用戶資料失敗', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('更新用戶資料失敗', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">使用者列表</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            刷新
          </Button>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 bottom-0 w-5 h-5 my-auto text-gray-400 left-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="搜尋姓名、學號、信箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="搜尋使用者"
            />
          </div>
        </div>
      </div>

      {/* 用戶統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">總用戶數</h3>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">管理員</h3>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === '管理員').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">一般使用者</h3>
          <p className="text-2xl font-bold text-gray-600">
            {users.filter(u => u.role === '一般使用者').length}
          </p>
        </div>
      </div>
      
      <div className="border rounded-lg w-full">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&>tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">學號</th>
                <th className="h-12 px-4 text-left align-middle font-medium">姓名</th>
                <th className="h-12 px-4 text-left align-middle font-medium">電子信箱</th>
                <th className="h-12 px-4 text-left align-middle font-medium">權限</th>
                <th className="h-12 px-4 text-left align-middle font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                      載入中...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    {searchTerm ? '未找到符合條件的用戶' : '暫無用戶資料'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-mono text-sm">{user.studentId || '未設定'}</td>
                    <td className="p-4 align-middle font-medium">{user.name || '未設定'}</td>
                    <td className="p-4 align-middle text-gray-600" title={user.emailFull}>
                      {user.email}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === '管理員' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2">
                        <Button
                          variant="link"
                          className="text-indigo-600 p-0"
                          onClick={() => setEditingUser({...user, email: user.emailFull || user.email})}
                        >
                          編輯
                        </Button>
                        <Button variant="link" className="text-blue-600 p-0">
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
      </div>

      {/* TODO: 分頁功能 */}

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
      />

      <Toast
        show={toast.show}
        onClose={hideToast}
        type={toast.type}
        message={toast.message}
      />
    </div>
  );
}
