"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Import tab components
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import UsersTab from '@/components/admin/UsersTab';
import UsageTab from '@/components/admin/UsageTab';

// Main component for the admin management page
export default function ManagePage() {
  // State for the currently active tab
  const [activeTab, setActiveTab] = useState('announcements');
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Effect to handle redirection for non-admin users
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      setIsRedirecting(true);
      // Redirect to home page after a short delay
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, isAdmin, loading, router]);

  // Tab definitions
  const tabs = [
    { id: 'announcements', label: '公告管理' },
    { id: 'users', label: '使用者管理' },
    { id: 'usage', label: '用量統計' },
  ];

  // Renders the content for the active tab
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

  // Display a loading spinner while checking auth state or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isRedirecting ? '權限不足，正在重導向...' : '載入中...'}
          </p>
        </div>
      </div>
    );
  }

  // If the user is not an admin, render nothing (as redirection is in progress)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">管理後台</h1>
          <p className="mt-2 text-sm text-gray-600">
            管理系統的公告、使用者和用量等相關設定。
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar for navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                    ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                    flex items-center justify-between` // <-- This is the fix
                  }
                >
                  <span className="font-medium">{tab.label}</span>
                  {/* Arrow Icon */}
                  <span
                    className={`transform transition-transform duration-200
                      ${
                        activeTab === tab.id ? 'rotate-0' : '-rotate-90'
                      }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content area */}
          <main className="lg:col-span-3">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
