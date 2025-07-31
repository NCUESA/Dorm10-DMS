'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import UsersTab from '@/components/admin/UsersTab';
import UsageTab from '@/components/admin/UsageTab';

// 頁籤設定
const tabs = [
  { id: 'announcements', label: '公告管理' },
  { id: 'users', label: '使用者管理' },
  { id: 'usage', label: '使用說明' },
];

export default function ManagePage() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('announcements');

  // 檢查登入狀態與權限，不符合條件則導向其他頁面
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/manage');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'announcements':
        return <AnnouncementsTab />;
      case 'users':
        return <UsersTab />;
      case 'usage':
        return <UsageTab />;
      default:
        return null;
    }
  };

  // 載入資料期間顯示讀取狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // 若未通過驗證或非管理員，不渲染內容
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            管理後台
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            管理公告、使用者和檢視使用說明。
          </p>
        </header>

        <div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  role="tab"
                  aria-controls={`tabpanel-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  id={`tab-${tab.id}`}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors duration-200
                    ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-t-md
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                role="tabpanel"
                id={`tabpanel-${tab.id}`}
                aria-labelledby={`tab-${tab.id}`}
                hidden={activeTab !== tab.id}
                className="focus:outline-none"
                tabIndex="0"
              >
                {activeTab === tab.id && renderTabContent()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
