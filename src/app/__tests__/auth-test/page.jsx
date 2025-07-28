"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function AuthTest() {
  const { user, isAuthenticated, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8">認證功能測試頁面</h1>
          
          {/* 用戶狀態 */}
          <div className="mb-8 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">用戶狀態</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>是否已登入:</strong> {isAuthenticated ? '是' : '否'}</p>
                <p><strong>載入狀態:</strong> {loading ? '載入中' : '已載入'}</p>
              </div>
              <div>
                {user ? (
                  <div>
                    <p><strong>用戶信息:</strong></p>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p><strong>用戶信息:</strong> 無</p>
                )}
              </div>
            </div>
            
            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                登出
              </button>
            )}
          </div>

          {/* 認證頁面連結 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">登入</h3>
              <p className="text-gray-600 mb-4">測試用戶登入功能</p>
              <Link
                href="/login"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
              >
                前往登入
              </Link>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">註冊</h3>
              <p className="text-gray-600 mb-4">測試用戶註冊功能</p>
              <Link
                href="/register"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
              >
                前往註冊
              </Link>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">忘記密碼</h3>
              <p className="text-gray-600 mb-4">測試密碼重設功能</p>
              <Link
                href="/forgot-password"
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 inline-block"
              >
                忘記密碼
              </Link>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">重設密碼</h3>
              <p className="text-gray-600 mb-4">測試密碼重設頁面</p>
              <Link
                href="/reset-password?token=test&email=test@example.com"
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 inline-block"
              >
                重設密碼
              </Link>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">郵件驗證</h3>
              <p className="text-gray-600 mb-4">測試郵件驗證功能</p>
              <Link
                href="/verify-email?email=test@example.com"
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 inline-block"
              >
                郵件驗證
              </Link>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">個人資料</h3>
              <p className="text-gray-600 mb-4">查看個人資料頁面</p>
              <Link
                href="/profile"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 inline-block"
              >
                個人資料
              </Link>
            </div>
          </div>

          {/* 測試結果 */}
          <div className="mt-8 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">測試清單</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" id="login-test" className="mr-2" />
                <label htmlFor="login-test">✅ 登入頁面正常顯示</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="register-test" className="mr-2" />
                <label htmlFor="register-test">✅ 註冊頁面正常顯示</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="forgot-test" className="mr-2" />
                <label htmlFor="forgot-test">✅ 忘記密碼頁面正常顯示</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="reset-test" className="mr-2" />
                <label htmlFor="reset-test">✅ 重設密碼頁面正常顯示</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="verify-test" className="mr-2" />
                <label htmlFor="verify-test">✅ 郵件驗證頁面正常顯示</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="auth-context" className="mr-2" />
                <label htmlFor="auth-context">⚠️ AuthContext 功能測試 (需實際 Supabase 連接)</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="routes-test" className="mr-2" />
                <label htmlFor="routes-test">✅ 路由導航正常</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
