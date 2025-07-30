'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import CreateAnnouncementModal from '@/components/CreateAnnouncementModal';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

export default function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 【新】從 Supabase 獲取公告資料
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
      alert('無法載入公告列表，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, []);

  // 組件載入時，自動獲取一次資料
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">公告列表</h2>
        <Button
          onClick={handleOpenModal}
          leftIcon={
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
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        announcement.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.is_active ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-gray-600">{new Date(announcement.created_at).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2">
                        <Button variant="link" className="text-indigo-600 p-0">
                          編輯
                        </Button>
                        <Button variant="link" className="text-red-600 p-0">
                          刪除
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
      
      <CreateAnnouncementModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        refreshAnnouncements={fetchAnnouncements} // 【重要】將刷新函式傳遞下去
      />
    </div>
  );
}
