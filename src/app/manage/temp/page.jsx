// "use client";

// import { useAuth } from "@/hooks/useAuth";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase/client";
// import CreateAnnouncementModal from "@/components/CreateAnnouncementModal";
// import AnnouncementsTab from "@/components/admin/AnnouncementsTab";
// import UsersTab from "@/components/admin/UsersTab";
// import UsageTab from "@/components/admin/UsageTab";

// export default function ManagePage() {
//   const { isAuthenticated, isAdmin, loading } = useAuth();
//   const router = useRouter();
//   const [isRedirecting, setIsRedirecting] = useState(false);
//   const [activeTab, setActiveTab] = useState('announcements');
//   const [announcements, setAnnouncements] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [chatLogs, setChatLogs] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [isLoading, setIsLoading] = useState({
//     announcements: false,
//     users: false,
//     chatLogs: false
//   });

//   useEffect(() => {
//     if (!loading) {
//       if (!isAuthenticated) {
//         setIsRedirecting(true);
//         router.push('/login?redirect=/manage');
//       } else if (!isAdmin) {
//         setIsRedirecting(true);
//         router.push('/');
//       } else {
//         loadAnnouncements();
//       }
//     }
//   }, [isAuthenticated, isAdmin, loading, router]);

//   // 載入公告數據
//   const loadAnnouncements = async () => {
//     setIsLoading(prev => ({ ...prev, announcements: true }));
//     try {
//       const { data, error } = await supabase
//         .from('announcements')
//         .select(`
//           *,
//           profiles:created_by(name)
//         `)
//         .order('created_at', { ascending: false });
      
//       if (error) throw error;
//       setAnnouncements(data || []);
//     } catch (error) {
//       console.error('載入公告失敗:', error);
//     }
//     setIsLoading(prev => ({ ...prev, announcements: false }));
//   };

//   // 載入用戶數據
//   const loadUsers = async () => {
//     setIsLoading(prev => ({ ...prev, users: true }));
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .order('created_at', { ascending: false });
      
//       if (error) throw error;
//       setUsers(data || []);
//     } catch (error) {
//       console.error('載入用戶失敗:', error);
//     }
//     setIsLoading(prev => ({ ...prev, users: false }));
//   };

//   // 載入對話紀錄
//   const loadChatLogs = async () => {
//     setIsLoading(prev => ({ ...prev, chatLogs: true }));
//     try {
//       const { data, error } = await supabase
//         .from('chat_logs')
//         .select('*')
//         .order('created_at', { ascending: false })
//         .limit(100);
      
//       if (error) throw error;
//       setChatLogs(data || []);
//     } catch (error) {
//       console.error('載入對話紀錄失敗:', error);
//     }
//     setIsLoading(prev => ({ ...prev, chatLogs: false }));
//   };

//   // 處理標籤切換
//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     switch (tab) {
//       case 'announcements':
//         if (announcements.length === 0) loadAnnouncements();
//         break;
//       case 'users':
//         if (users.length === 0) loadUsers();
//         break;
//       case 'usage':
//         if (chatLogs.length === 0) loadChatLogs();
//         break;
//     }
//   };

//   // 刪除公告
//   const handleDeleteAnnouncement = async (id) => {
//     if (!confirm('確定要刪除這個公告嗎？')) return;
    
//     try {
//       const { error } = await supabase
//         .from('announcements')
//         .delete()
//         .eq('id', id);
      
//       if (error) throw error;
//       setAnnouncements(prev => prev.filter(item => item.id !== id));
//       alert('公告已刪除');
//     } catch (error) {
//       console.error('刪除公告失敗:', error);
//       alert('刪除失敗');
//     }
//   };

//   // 更新用戶權限
//   const handleUpdateUserRole = async (userId, newRole) => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ role: newRole })
//         .eq('id', userId);
      
//       if (error) throw error;
//       setUsers(prev => prev.map(user => 
//         user.id === userId ? { ...user, role: newRole } : user
//       ));
//       alert('權限已更新');
//     } catch (error) {
//       console.error('更新權限失敗:', error);
//       alert('更新失敗');
//     }
//   };

//   // 刪除用戶
//   const handleDeleteUser = async (userId) => {
//     if (!confirm('確定要刪除這個用戶嗎？此操作無法復原。')) return;
    
//     try {
//       const { error } = await supabase.auth.admin.deleteUser(userId);
//       if (error) throw error;
      
//       setUsers(prev => prev.filter(user => user.id !== userId));
//       alert('用戶已刪除');
//     } catch (error) {
//       console.error('刪除用戶失敗:', error);
//       alert('刪除失敗');
//     }
//   };

//   // 處理新增公告成功
//   const handleAnnouncementCreated = (newAnnouncement) => {
//     setAnnouncements(prev => [newAnnouncement, ...prev]);
//   };

//   // 過濾數據
//   const filteredAnnouncements = announcements.filter(item =>
//     item.title.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const filteredUsers = users.filter(user =>
//     user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.department?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // 顯示載入狀態
//   if (loading || isRedirecting) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//           <p className="text-muted-foreground">
//             {isRedirecting ? '正在重定向...' : '載入中...'}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // 如果不是管理員或未登入，不渲染內容
//   if (!isAuthenticated || !isAdmin) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* 頁面標題 */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">管理後台</h1>
//           <p className="mt-2 text-gray-600">
//             管理系統各項功能和設定
//           </p>
//         </div>

//         {/* 導航標籤 */}
//         <div className="bg-white shadow rounded-lg mb-6">
//           <div className="border-b border-gray-200">
//             <nav className="-mb-px flex space-x-8" aria-label="Tabs">
//               <button 
//                 onClick={() => handleTabChange('announcements')}
//                 className={`${
//                   activeTab === 'announcements' 
//                     ? 'border-blue-500 text-blue-600' 
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
//               >
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
//                 </svg>
//                 公告管理
//               </button>
//               <button 
//                 onClick={() => handleTabChange('users')}
//                 className={`${
//                   activeTab === 'users' 
//                     ? 'border-blue-500 text-blue-600' 
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
//               >
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                 </svg>
//                 使用者管理
//               </button>
//               <button 
//                 onClick={() => handleTabChange('usage')}
//                 className={`${
//                   activeTab === 'usage' 
//                     ? 'border-blue-500 text-blue-600' 
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
//               >
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                 </svg>
//                 使用說明
//               </button>
//             </nav>
//           </div>
//         </div>

//         {/* 搜尋欄 */}
//         <div className="mb-6">
//           <div className="relative max-w-md">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//               </svg>
//             </div>
//             <input
//               type="text"
//               placeholder={
//                 activeTab === 'announcements' ? '搜尋公告標題...' :
//                 activeTab === 'users' ? '搜尋姓名、學號、信箱...' :
//                 '搜尋對話紀錄...'
//               }
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>
//         </div>

//         {/* 內容區域 */}
//         {activeTab === 'announcements' && (
//           <AnnouncementsTab 
//             announcements={filteredAnnouncements}
//             isLoading={isLoading.announcements}
//             onDelete={handleDeleteAnnouncement}
//             onRefresh={loadAnnouncements}
//             onCreateNew={() => setShowCreateModal(true)}
//           />
//         )}

//         {activeTab === 'users' && (
//           <UsersTab 
//             users={filteredUsers}
//             isLoading={isLoading.users}
//             onUpdateRole={handleUpdateUserRole}
//             onDelete={handleDeleteUser}
//             onRefresh={loadUsers}
//           />
//         )}

//         {activeTab === 'usage' && (
//           <UsageTab />
//         )}

//         {/* 新增公告模態視窗 */}
//         <CreateAnnouncementModal
//           isOpen={showCreateModal}
//           onClose={() => setShowCreateModal(false)}
//           onSuccess={handleAnnouncementCreated}
//         />
//       </div>
//     </div>
//   );
// }
