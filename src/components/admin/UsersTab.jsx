'use client';

import { useState } from 'react';

// 模擬的使用者數據
const mockUsers = [
  { id: 'S12345678', name: '陳小明', email: 'chen@example.com', role: '管理員' },
  { id: 'S87654321', name: '林美麗', email: 'lin@example.com', role: '一般使用者' },
  { id: 'S11223344', name: '黃大衛', email: 'huang@example.com', role: '一般使用者' },
];

export default function UsersTab() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">使用者列表</h2>
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-mono text-sm">{user.id}</td>
                  <td className="p-4 align-middle font-medium">{user.name}</td>
                  <td className="p-4 align-middle text-gray-600">{user.email}</td>
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
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">編輯</button>
                    <button className="text-blue-600 hover:text-blue-900">寄送通知</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TODO: 分頁功能 */}
    </div>
  );
}
