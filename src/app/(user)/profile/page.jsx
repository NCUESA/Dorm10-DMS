"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // 如果未登入，重定向到登入頁面
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // 從用戶物件中提取個人資料
    if (user) {
      setProfileData({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        student_id: user.user_metadata?.student_id || '',
        department: user.user_metadata?.department || '',
        year: user.user_metadata?.year || '',
        email_verified: user.email_confirmed_at !== null,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 未登入時不顯示任何內容（會被重定向）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              個人資料
            </h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              登出
            </button>
          </div>

          {profileData && (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">
                  基本資訊
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-900">{profileData.email}</span>
                      {profileData.email_verified ? (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          已驗證
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          待驗證
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {profileData.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        姓名
                      </label>
                      <span className="text-gray-900">{profileData.name}</span>
                    </div>
                  )}
                  
                  {profileData.student_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        學號
                      </label>
                      <span className="text-gray-900">{profileData.student_id}</span>
                    </div>
                  )}
                  
                  {profileData.department && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        系所
                      </label>
                      <span className="text-gray-900">{profileData.department}</span>
                    </div>
                  )}
                  
                  {profileData.year && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        年級
                      </label>
                      <span className="text-gray-900">{profileData.year}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 帳號狀態 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  帳號狀態
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用戶ID
                    </label>
                    <span className="text-sm text-gray-900 font-mono">{profileData.id}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      註冊時間
                    </label>
                    <span className="text-gray-900">
                      {new Date(profileData.created_at).toLocaleString('zh-TW')}
                    </span>
                  </div>
                  
                  {profileData.last_sign_in && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最後登入時間
                      </label>
                      <span className="text-gray-900">
                        {new Date(profileData.last_sign_in).toLocaleString('zh-TW')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 功能區 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-yellow-900 mb-4">
                  快速功能
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">查看獎學金</span>
                    </div>
                  </button>
                  
                  <button className="p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">申請獎學金</span>
                    </div>
                  </button>
                  
                  <button className="p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">申請歷史</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
