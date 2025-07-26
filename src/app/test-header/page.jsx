"use client";

import { useAuthFromHeaders } from "../hooks/useAuth";

export default function TestLoginPage() {
  const { isLoggedIn, userInfo, login, logout, isLoading } = useAuthFromHeaders();

  const handleTestLogin = () => {
    // 模擬登入
    const mockUserData = {
      name: "楊教傑",
      email: "grason.yang@ncue.edu.tw",
      role: "admin"
    };
    login(mockUserData);
  };

  const handleTestLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Header 狀態測試頁面（Middleware 版本）
          </h1>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 當前狀態顯示 */}
              <div className="bg-gray-100 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">當前登入狀態</h2>
                <div className="space-y-2">
                  <p><strong>登入狀態:</strong> {isLoggedIn ? '已登入' : '未登入'}</p>
                  {isLoggedIn && userInfo && (
                    <>
                      <p><strong>用戶名稱:</strong> {userInfo.name}</p>
                      <p><strong>電子郵件:</strong> {userInfo.email}</p>
                      <p><strong>角色:</strong> {userInfo.role}</p>
                    </>
                  )}
                </div>
              </div>

              {/* 控制按鈕 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isLoggedIn ? (
                  <button
                    onClick={handleTestLogin}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    測試登入 (模擬楊教傑)
                  </button>
                ) : (
                  <button
                    onClick={handleTestLogout}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    測試登出
                  </button>
                )}
              </div>

              {/* 說明文字 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Middleware 認證系統特點</h3>
                <ul className="space-y-2 text-blue-800">
                  <li><strong>服務器端認證:</strong> 使用 Next.js middleware 在服務器端處理認證</li>
                  <li><strong>Cookie 基礎:</strong> 認證狀態存儲在 HTTP cookies 中</li>
                  <li><strong>自動路由保護:</strong> 受保護的路由會自動重定向到登入頁面</li>
                  <li><strong>SEO 友好:</strong> 服務器端渲染時即可確定認證狀態</li>
                  <li><strong>安全性提升:</strong> 認證邏輯在服務器端執行，更加安全</li>
                </ul>
              </div>

              {/* Header 預覽說明 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">如何測試</h3>
                <ol className="space-y-2 text-green-800 list-decimal list-inside">
                  <li>點擊上方的「測試登入」按鈕來模擬登入狀態</li>
                  <li>觀察頂部Header的變化 - 導航項目會自動切換</li>
                  <li>嘗試訪問 <code>/manage</code> 等受保護的路由</li>
                  <li>在桌面版，hover用戶名稱可以看到下拉選單</li>
                  <li>在手機版，點擊漢堡選單可以看到展開的選項</li>
                  <li>點擊「登出」可以回到未登入狀態</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
