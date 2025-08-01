'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import CreateAnnouncementModal from '@/components/CreateAnnouncementModal';
import UpdateAnnouncementModal from '@/components/UpdateAnnouncementModal';
import DeleteAnnouncementModal from '@/components/DeleteAnnouncementModal';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { MessageSquare, Send } from 'lucide-react';

// --- Helper: Email Sending Function ---
// ** MODIFIED: Updated to use supabase.functions.invoke for auth **
const sendEmailAnnouncement = async (id, showToast) => {
  if (!confirm('確定要透過 Email 將此公告寄送給所有使用者嗎？')) return;
  
  try {
    showToast('正在透過 Email 發送公告...', 'info');

    // Use supabase.functions.invoke to automatically handle authentication
    const { data, error } = await supabase.functions.invoke('send-announcement', {
        body: { announcementId: id },
    });

    if (error) throw new Error(error.message || 'Email 寄送失敗');
    
    showToast(data.message || '公告已成功透過 Email 寄送！', 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Email 寄送失敗，請稍後再試', 'error');
  }
};

// ** MODIFIED: LINE Broadcast Function updated to use supabase.functions.invoke for auth **
const sendLineBroadcast = async (id, showToast) => {
  if (!confirm('確定要透過 LINE 廣播此公告給所有已加入的好友嗎？')) return;

  try {
    showToast('正在透過 LINE 廣播公告...', 'info');

    // Use supabase.functions.invoke to automatically handle authentication
    const { data, error } = await supabase.functions.invoke('broadcast-line-announcement', {
        body: { announcementId: id },
    });
    
    if (error) throw new Error(error.message || 'LINE 廣播失敗');

    showToast(data.message || '公告已成功透過 LINE 廣播！', 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'LINE 廣播失敗，請稍後再試', 'error');
  }
};

export default function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast('無法載入公告列表，請稍後再試', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenEdit = (announcement) => setEditing(announcement);
  const handleCloseEdit = () => setEditing(null);
  const handleOpenDelete = (id) => setDeletingId(id);
  const handleCloseDelete = () => setDeletingId(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">公告列表</h2>
        <Button onClick={handleOpenModal} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          新增公告
        </Button>
      </div>
      
      <div className="border rounded-lg w-full bg-white shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&>tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 text-left">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">標題</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">分類</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">申請截止日</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">狀態</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">最後更新</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child]:border-0">
              {loading ? (
                <tr><td colSpan="6" className="text-center p-8">載入中...</td></tr>
              ) : announcements.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-gray-500">目前沒有任何公告。</td></tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="border-b transition-colors hover:bg-gray-50/50">
                    <td className="p-4 align-middle font-medium">{announcement.title}</td>
                    <td className="p-4 align-middle text-gray-600">{announcement.category}</td>
                    <td className="p-4 align-middle text-gray-600">{announcement.application_deadline || 'N/A'}</td>
                    <td className="p-4 align-middle">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }`}>
                        {announcement.is_active ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-gray-600">{new Date(announcement.created_at).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-4">
                        <Button variant="link" className="text-indigo-600 p-0 h-auto" onClick={() => handleOpenEdit(announcement)}>
                          編輯
                        </Button>
                        <Button variant="link" className="text-red-600 p-0 h-auto" onClick={() => handleOpenDelete(announcement.id)}>
                          刪除
                        </Button>
                        
                        <div className="flex items-center gap-2 border-l pl-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => sendEmailAnnouncement(announcement.id, showToast)}
                                leftIcon={<Send size={14} />}
                            >
                                寄送
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => sendLineBroadcast(announcement.id, showToast)}
                                leftIcon={<MessageSquare size={14} />}
                            >
                                LINE
                            </Button>
                        </div>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <CreateAnnouncementModal isOpen={isModalOpen} onClose={handleCloseModal} refreshAnnouncements={fetchAnnouncements} />
      <UpdateAnnouncementModal isOpen={!!editing} onClose={handleCloseEdit} announcement={editing} refreshAnnouncements={fetchAnnouncements} />
      <DeleteAnnouncementModal isOpen={!!deletingId} onClose={handleCloseDelete} announcementId={deletingId} refreshAnnouncements={fetchAnnouncements} />
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );
}